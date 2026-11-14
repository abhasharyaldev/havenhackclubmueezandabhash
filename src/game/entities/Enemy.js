import Phaser from 'phaser';
import { makeThreat, spawnProjectile } from '../systems/CombatSystem.js';
import { AudioManager } from '../systems/AudioManager.js';

const KIND = {
  slime: { hp: 3, speed: 40, tex: 'e_slime', w: 16, h: 12, ox: 4, oy: 8, gravity: true, detect: 120 },
  drone: { hp: 3, speed: 50, tex: 'e_drone', w: 16, h: 12, ox: 4, oy: 4, gravity: false, detect: 150 },
  goblin: { hp: 4, speed: 55, tex: 'e_goblin', w: 14, h: 16, ox: 7, oy: 10, gravity: true, detect: 110 },
  note: { hp: 3, speed: 70, tex: 'e_note', w: 14, h: 14, ox: 4, oy: 8, gravity: true, detect: 130 },
  dummy: { hp: 99, speed: 0, tex: 'e_dummy', w: 14, h: 20, ox: 5, oy: 10, gravity: true, detect: 0 },
  armor: { hp: 4, speed: 0, tex: 'e_armor', w: 14, h: 20, ox: 5, oy: 10, gravity: true, detect: 0, armored: true },
  trainer: { hp: 6, speed: 24, tex: 'e_slime', w: 16, h: 12, ox: 4, oy: 8, gravity: true, detect: 90 },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, cfg) {
    const def = KIND[cfg.kind];
    super(scene, cfg.x, cfg.y, def.tex.includes('dummy') || def.tex.includes('armor') ? def.tex : `${def.tex}_0`);
    this.kind = cfg.kind;
    this.eid = cfg.id;
    this.def = def;
    this.drop = cfg.drop ?? 2;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, def.gravity ? 1 : 0.5);
    this.body.setSize(def.w, def.h);
    this.body.setOffset(def.ox, def.oy);
    this.body.setAllowGravity(def.gravity);
    this.setDepth(8);
    this.hp = def.hp;
    this.alive = true;
    this.facing = -1;
    this.state = cfg.kind === 'dummy' || cfg.kind === 'armor' ? 'idle' : 'patrol';
    this.stateTimer = 300;
    this.iFrame = 0;
    this.armored = cfg.armored ?? !!def.armored;
    this.home = cfg.x;
    this.patrol = cfg.patrol ?? 48;
    this.animFrame = 0;
    this.frameTimer = 0;
    this.hitTokens = new Set();
    this.strike = makeThreat(scene, 18, 14);
    this.strike.owner = this;
    this.strike.damage = 1;
    this.setFlipX(false);
  }

  step(dt) {
    if (!this.alive) {
      this.deadTimer -= dt;
      this.y += 0.4;
      this.setAlpha(Math.max(0, this.alpha - dt / 360));
      if (this.deadTimer <= 0) this.destroy();
      return;
    }
    this.iFrame -= dt;
    this.stateTimer -= dt;
    this.frameTimer += dt;
    if (this.frameTimer > 140) {
      this.frameTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
      if (!this.def.tex.startsWith('e_dummy') && this.def.tex !== 'e_armor' && this.state !== 'attack') {
        const key = `${this.def.tex}_${this.animFrame}`;
        if (this.scene.textures.exists(key)) this.setTexture(key);
      }
    }
    const player = this.scene.player;
    const dist = player ? Math.abs(player.x - this.x) : 9999;
    const see = player && player.alive && dist < this.def.detect && Math.abs(player.y - this.y) < 70;

    if (this.kind === 'dummy' || this.kind === 'armor') {
      this.body.setVelocityX(0);
      this.strike.activeHit = false;
      return;
    }

    switch (this.state) {
      case 'patrol':
        this.patrolMove();
        if (see) this.go('alert', 220);
        break;
      case 'alert':
        this.facePlayer();
        this.body.setVelocityX(0);
        if (this.stateTimer <= 0) this.go('telegraph', this.kind === 'trainer' ? 820 : this.kind === 'goblin' ? 480 : 400);
        break;
      case 'telegraph':
        this.facePlayer();
        this.body.setVelocityX(0);
        this.setTint(0xffb0b0);
        if (this.stateTimer <= 0) this.beginAttack();
        break;
      case 'attack':
        this.tickAttack(dt);
        break;
      case 'recover':
        this.strike.activeHit = false;
        this.clearTint();
        this.body.setVelocityX(0);
        if (this.stateTimer <= 0) this.go('patrol', 200);
        break;
      case 'stagger':
        this.strike.activeHit = false;
        this.setTint(0xfff2a8);
        if (this.stateTimer <= 0) {
          this.clearTint();
          this.go('recover', 180);
        }
        break;
      default:
        break;
    }
    if (this.def.gravity) this.avoidLedge();
    this.setFlipX(this.facing < 0);
  }

  go(state, ms) {
    this.state = state;
    this.stateTimer = ms;
  }

  facePlayer() {
    const p = this.scene.player;
    if (!p) return;
    this.facing = p.x < this.x ? -1 : 1;
  }

  patrolMove() {
    if (!this.def.gravity) {
      this.facing = this.body.velocity.x >= 0 ? 1 : this.facing;
      if (this.x > this.home + this.patrol) this.facing = -1;
      if (this.x < this.home - this.patrol) this.facing = 1;
      this.body.setVelocity(this.facing * this.def.speed, Math.sin(this.scene.time.now / 300) * 12);
      return;
    }
    if (this.kind === 'note') {
      if (this.stateTimer <= 0) {
        this.facing = Math.random() < 0.5 ? -1 : 1;
        this.body.setVelocityX(this.facing * this.def.speed);
        this.stateTimer = 260;
      } else if (this.stateTimer < 80) this.body.setVelocityX(0);
      return;
    }
    if (this.x > this.home + this.patrol) this.facing = -1;
    else if (this.x < this.home - this.patrol) this.facing = 1;
    this.body.setVelocityX(this.facing * this.def.speed);
  }

  avoidLedge() {
    if (this.state !== 'patrol' || !this.body.blocked.down) return;
    if (this.body.blocked.left || this.body.blocked.right) this.facing *= -1;
    const ahead = this.x + this.facing * 12;
    const below = this.y + 10;
    const supported = this.scene.solidRects.some((r) => ahead >= r.left && ahead <= r.right && below >= r.top && below <= r.bottom + 8);
    if (!supported) this.facing *= -1;
  }

  beginAttack() {
    this.clearTint();
    this.go('attack', this.kind === 'drone' || this.kind === 'note' ? 260 : 280);
    this.facePlayer();
    if (this.kind === 'slime' || this.kind === 'trainer') {
      const speed = this.kind === 'trainer' ? 90 : 170;
      this.body.setVelocity(this.facing * speed, -200);
      this.strike.damage = 1;
    } else if (this.kind === 'goblin') {
      this.body.setVelocityX(this.facing * 40);
      this.strike.damage = 1;
      if (this.scene.textures.exists('e_goblin_atk')) this.setTexture('e_goblin_atk');
    } else if (this.kind === 'drone') {
      const p = this.scene.player;
      const ang = Phaser.Math.Angle.Between(this.x, this.y, p.x, p.y - 16);
      spawnProjectile(this.scene, this.x, this.y, Math.cos(ang) * 90, Math.sin(ang) * 90, 'fx_shot', { owner: this, damage: 1, life: 2600 });
      AudioManager.play('shoot');
      this.strike.activeHit = false;
    } else if (this.kind === 'note') {
      spawnProjectile(this.scene, this.x, this.y - 8, this.facing * 80, -40, 'fx_error', { owner: this, damage: 1 });
      spawnProjectile(this.scene, this.x, this.y - 8, this.facing * 80, 20, 'fx_error', { owner: this, damage: 1 });
      AudioManager.play('shoot');
    }
  }

  tickAttack() {
    if (this.kind === 'slime' || this.kind === 'trainer' || this.kind === 'goblin') {
      this.strike.activeHit = true;
      this.strike.damage = 1;
      this.strike.setPosition(this.x + this.facing * 14, this.y - 10);
    }
    if (this.stateTimer <= 0) {
      this.strike.activeHit = false;
      this.go('recover', this.kind === 'trainer' ? 700 : 420);
    }
  }

  stagger(ms = 650) {
    if (!this.alive) return;
    this.go('stagger', ms);
    this.strike.activeHit = false;
    this.body.setVelocity(this.facing * -100, -60);
  }

  takeHit(info) {
    if (!this.alive || this.iFrame > 0) return;
    if (info.token != null) {
      if (this.hitTokens.has(info.token)) return;
      this.hitTokens.add(info.token);
    }
    if (this.kind === 'dummy') {
      this.scene.onDummyHit();
      this.scene.hitStop?.(Math.min(24, info.hitstop || 0));
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(50, () => this.clearTint());
      this.scene.feedback('hit');
      return;
    }
    if (this.armored && !info.armor) {
      this.scene.spawnFx('fx_spark_0', this.x, this.y - 16);
      AudioManager.play('deny');
      return;
    }
    if (this.armored && info.armor) this.armored = false;
    this.hp -= info.damage;
    this.iFrame = 90;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => { if (this.active) this.clearTint(); });
    this.scene.hitStop?.(info.hitstop);
    const dir = Math.sign(this.x - info.fromX) || -info.facing || 1;
    this.body.setVelocity(dir * Math.min(160, info.kb), -80);
    this.scene.feedback('hit');
    if (this.hp <= 0) this.die();
    else this.go('stagger', 160);
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.deadTimer = 320;
    this.strike.activeHit = false;
    this.body.enable = false;
    this.scene.onEnemyDown(this);
  }
}
