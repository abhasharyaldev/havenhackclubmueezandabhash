import { Boss } from '../entities/Boss.js';
import { BOSSES } from '../data/bosses.js';
import { spawnProjectile } from '../systems/CombatSystem.js';

export class DeadlineBoss extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'b_deadline_0', BOSSES.deadline);
    this.setupBody(20, 40, 14, 18, true);
    this.patterns = ['slash', 'delay', 'walk', 'shock'];
    this.mark = null;
  }

  syncTex() {
    const key = this.state === 'slash' ? 'b_deadline_atk' : `b_deadline_${this.anim % 4}`;
    if (this.scene.textures.exists(key)) this.setTexture(key);
  }

  step(dt) {
    if (!this.alive || !this.started) return;
    this.baseTick(dt);
    this.facePlayer();
    if (this.state === 'intro' && this.stateTimer <= 0) this.go('idle', 300);
    if (this.state === 'stagger' && this.stateTimer <= 0) {
      this.exposed = false;
      this.go('idle', 200);
    }
    if (this.state === 'idle' && this.stateTimer <= 0) this.startPattern();
    if (this.state === 'walk') {
      this.body.setVelocityX(this.facing * 70);
      if (this.stateTimer <= 0) this.go('idle', 180);
    }
    if (this.state === 'slashWind') {
      this.body.setVelocityX(0);
      this.setTint(0xffe08a);
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.go('slash', 140);
      }
    }
    if (this.state === 'slash') {
      this.strike.activeHit = true;
      this.strike.damage = 1;
      this.strike.setPosition(this.x + this.facing * 28, this.y - 22);
      this.body.setVelocityX(this.facing * 40);
      if (this.stateTimer <= 0) this.go('recover', this.phase === 2 ? 280 : 420);
    }
    if (this.state === 'delayWind') {
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) this.dropDelay();
    }
    if (this.state === 'shockWind') {
      this.body.setVelocityX(0);
      this.setTint(0xffcc66);
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.shockwave();
        this.exposed = true;
        this.go('recover', this.phase === 2 ? 620 : 900);
      }
    }
    if (this.state === 'recover') {
      this.strike.activeHit = false;
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.exposed = false;
        this.clearTint();
        this.go('idle', this.phase === 2 ? 160 : 260);
      }
    }
  }

  startPattern() {
    const name = this.patterns[this.patternI % this.patterns.length];
    this.patternI += 1;
    if (this.phase === 2 && name === 'walk') {
      this.go('shockWind', 360);
      return;
    }
    if (name === 'slash') this.go('slashWind', this.phase === 2 ? 280 : 420);
    else if (name === 'delay') this.armDelay();
    else if (name === 'shock') this.go('shockWind', this.phase === 2 ? 340 : 520);
    else this.go('walk', 500);
  }

  armDelay() {
    const x = this.scene.player.x;
    this.markX = x;
    this.clearMark();
    this.mark = this.scene.add.image(x, this.y, 'fx_mark').setDepth(6);
    this.go('delayWind', this.phase === 2 ? 520 : 700);
  }

  dropDelay() {
    this.clearMark();
    const zone = this.scene.add.zone(this.markX, this.y - 16, 28, 36);
    this.scene.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.moves = false;
    zone.activeHit = true;
    zone.damage = 1;
    zone.owner = this;
    zone.life = 140;
    this.scene.threats.push(zone);
    this.scene.time.delayedCall(140, () => zone.destroy());
    this.scene.spawnFx('fx_burst_2', this.markX, this.y - 8);
    this.go('recover', this.phase === 2 ? 360 : 520);
  }

  shockwave() {
    spawnProjectile(this.scene, this.x, this.y - 8, 150, 0, 'fx_warn', { owner: this, damage: 1, life: 1600, w: 18, h: 12 });
    spawnProjectile(this.scene, this.x, this.y - 8, -150, 0, 'fx_warn', { owner: this, damage: 1, life: 1600, w: 18, h: 12 });
  }

  clearMark() {
    this.mark?.destroy();
    this.mark = null;
  }

  onDamaged() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.patterns = ['shock', 'delay', 'slash', 'shock'];
      this.emitHp();
      this.go('idle', 360);
    }
  }
}
