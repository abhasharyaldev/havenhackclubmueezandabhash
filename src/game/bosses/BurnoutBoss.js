import { Boss } from '../entities/Boss.js';
import { BOSSES } from '../data/bosses.js';
import { spawnProjectile } from '../systems/CombatSystem.js';

export class BurnoutBoss extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'b_burnout_0', BOSSES.burnout);
    this.setupBody(36, 40, 18, 22, true);
    this.patterns = ['slam', 'punch', 'ember', 'slam'];
  }

  syncTex() {
    const key = this.state === 'punch' ? 'b_burnout_atk' : `b_burnout_${this.anim % 4}`;
    if (this.scene.textures.exists(key)) this.setTexture(key);
  }

  step(dt) {
    if (!this.alive || !this.started) return;
    this.baseTick(dt);
    this.facePlayer();
    if (this.state === 'intro' && this.stateTimer <= 0) this.go('idle', 400);
    if (this.state === 'stagger' && this.stateTimer <= 0) {
      this.exposed = false;
      this.go('idle', 240);
    }
    if (this.state === 'idle') {
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) this.startPattern();
    }
    if (this.state === 'slamWind') {
      this.setTint(0xff9966);
      this.body.setVelocityY(-180);
      if (this.stateTimer <= 0) this.go('slamFall', 700);
    }
    if (this.state === 'slamFall') {
      if (this.body.blocked.down || this.stateTimer <= 0) this.landSlam();
    }
    if (this.state === 'punchWind') {
      this.body.setVelocityX(this.facing * 30);
      this.setTint(0xff7744);
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.go('punch', 180);
        this.body.setVelocityX(this.facing * 120);
      }
    }
    if (this.state === 'punch') {
      this.strike.activeHit = true;
      this.strike.damage = 2;
      this.strike.setPosition(this.x + this.facing * 30, this.y - 18);
      if (this.stateTimer <= 0) this.go('recover', 480);
    }
    if (this.state === 'emberWind' && this.stateTimer <= 0) {
      this.emberBurst();
      this.go('recover', 520);
    }
    if (this.state === 'recover') {
      this.strike.activeHit = false;
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.exposed = false;
        this.clearTint();
        this.go('idle', this.phase === 2 ? 220 : 360);
      }
    }
  }

  startPattern() {
    const name = this.patterns[this.patternI % this.patterns.length];
    this.patternI += 1;
    if (name === 'slam') this.go('slamWind', 360);
    else if (name === 'punch') this.go('punchWind', 420);
    else this.go('emberWind', 480);
  }

  landSlam() {
    if (this.state !== 'slamFall') return;
    spawnProjectile(this.scene, this.x, this.y - 6, 130, 0, 'fx_warn', { owner: this, damage: 1, life: 1400, w: 20, h: 14 });
    spawnProjectile(this.scene, this.x, this.y - 6, -130, 0, 'fx_warn', { owner: this, damage: 1, life: 1400, w: 20, h: 14 });
    this.exposed = true;
    this.clearTint();
    this.scene.cameras.main.shake(90, 0.004);
    if (this.phase === 2) this.heatLanes();
    this.go('recover', 900);
  }

  heatLanes() {
    const a = this.arena();
    if (!a) return;
    const midL = a.left + (a.right - a.left) * 0.35;
    const midR = a.left + (a.right - a.left) * 0.65;
    for (const side of [a.left + 40, a.right - 40]) {
      const zone = this.scene.add.zone(side < midL ? (a.left + midL) / 2 : (midR + a.right) / 2, this.y - 8, (a.right - a.left) * 0.3, 20);
      this.scene.physics.add.existing(zone);
      zone.body.setAllowGravity(false);
      zone.body.moves = false;
      zone.activeHit = true;
      zone.damage = 1;
      zone.owner = this;
      this.scene.threats.push(zone);
      const mark = this.scene.add.rectangle(zone.x, this.y - 2, zone.width, 8, 0xff7a32, 0.45).setDepth(3);
      this.scene.time.delayedCall(1800, () => {
        zone.destroy();
        mark.destroy();
      });
    }
  }

  emberBurst() {
    const gaps = new Set([1, 5]);
    for (let i = 0; i < 8; i++) {
      if (gaps.has(i)) continue;
      const a = (Math.PI * 2 * i) / 8;
      spawnProjectile(this.scene, this.x, this.y - 24, Math.cos(a) * 80, Math.sin(a) * 80, 'fx_ember', {
        owner: this,
        damage: 1,
        life: 1800,
        w: 6,
        h: 6,
      });
    }
  }

  onDamaged() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.patterns = ['slam', 'ember', 'punch', 'slam'];
      this.emitHp();
    }
  }
}
