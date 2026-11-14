import { Boss } from '../entities/Boss.js';
import { BOSSES } from '../data/bosses.js';
import { spawnProjectile } from '../systems/CombatSystem.js';

export class BugBoss extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'b_bug_0', BOSSES.bug);
    this.setupBody(22, 36, 17, 22, true);
    this.patterns = ['slash', 'burst', 'slash', 'teleport'];
  }

  syncTex() {
    const key = this.state === 'slash' ? 'b_bug_atk' : `b_bug_${this.anim % 4}`;
    if (this.scene.textures.exists(key)) this.setTexture(key);
  }

  step(dt) {
    if (!this.alive || !this.started) return;
    this.baseTick(dt);
    this.facePlayer();
    if (this.state === 'intro') {
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) this.go('idle', 280);
      return;
    }
    if (this.state === 'stagger') {
      if (this.stateTimer <= 0) {
        this.exposed = false;
        this.go('idle', 200);
      }
      return;
    }
    if (this.state === 'idle') {
      this.body.setVelocityX(0);
      this.exposed = false;
      if (this.stateTimer <= 0) this.startMove(this.next());
      return;
    }
    if (this.state === 'slashWind') {
      this.body.setVelocityX(0);
      this.setTint(0xff6677);
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.go('slash', 150);
        this.body.setVelocityX(this.facing * 90);
      }
      return;
    }
    if (this.state === 'slash') {
      this.strike.activeHit = true;
      this.strike.damage = 1;
      this.strike.setPosition(this.x + this.facing * 24, this.y - 20);
      if (this.stateTimer <= 0) {
        const missed = Math.abs(this.scene.player.x - this.x) > 46;
        this.exposed = missed;
        this.go('slashRecover', missed ? 760 : 320);
      }
      return;
    }
    if (this.state === 'slashRecover') {
      this.strike.activeHit = false;
      this.body.setVelocityX(0);
      if (this.exposed) this.setTint(0xb7ffb0);
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.exposed = false;
        this.go('idle', this.phase === 2 ? 160 : 280);
      }
      return;
    }
    if (this.state === 'teleport') {
      this.setAlpha(0.15);
      this.body.checkCollision.none = true;
      if (this.stateTimer <= 0) {
        const p = this.scene.player;
        this.x = this.clampX(p.x - this.facing * 72);
        this.y = p.y;
        this.setAlpha(1);
        this.body.checkCollision.none = false;
        this.body.reset(this.x, this.y);
        this.go('idle', this.phase === 2 ? 180 : 320);
      }
      return;
    }
    if (this.state === 'burstWind') {
      this.setTint(0xff8890);
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.fireBurst();
        this.go('idle', this.phase === 2 ? 240 : 420);
      }
    }
  }

  startMove(name) {
    if (name === 'slash') this.go('slashWind', this.phase === 2 ? 280 : 480);
    else if (name === 'teleport') this.go('teleport', 220);
    else this.go('burstWind', this.phase === 2 ? 280 : 420);
  }

  next() {
    const name = this.patterns[this.patternI % this.patterns.length];
    this.patternI += 1;
    return name;
  }

  fireBurst() {
    const base = this.facing === 1 ? 0 : Math.PI;
    for (const spread of [-0.4, 0, 0.4]) {
      const a = base + spread;
      spawnProjectile(this.scene, this.x + this.facing * 10, this.y - 24, Math.cos(a) * 85, Math.sin(a) * 85, 'fx_error', {
        owner: this,
        damage: 1,
        life: 2400,
      });
    }
  }

  onDamaged() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.patterns = ['slash', 'teleport', 'burst', 'slash', 'teleport'];
      this.go('idle', 400);
      this.scene.spawnFx('fx_burst_2', this.x, this.y - 30);
      this.emitHp();
    }
  }
}
