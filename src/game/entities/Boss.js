import Phaser from 'phaser';
import { makeThreat } from '../systems/CombatSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { gameBus } from '../systems/GameEvents.js';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, cfg) {
    super(scene, x, y, texture);
    this.cfg = cfg;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.alive = true;
    this.phase = 1;
    this.state = 'wait';
    this.stateTimer = 0;
    this.iFrame = 0;
    this.facing = -1;
    this.patternI = 0;
    this.exposed = false;
    this.hitTokens = new Set();
    this.started = false;
    this.strike = makeThreat(scene, 30, 18);
    this.strike.owner = this;
    this.strike.damage = 1;
    this.anim = 0;
    this.animTimer = 0;
  }

  setupBody(w, h, ox, oy, gravity = true) {
    this.setOrigin(0.5, gravity ? 1 : 0.5);
    this.body.setSize(w, h);
    this.body.setOffset(ox, oy);
    this.body.setAllowGravity(gravity);
    this.body.setMaxVelocity(280, 700);
  }

  begin() {
    if (this.started) return;
    this.started = true;
    this.go('intro', 900);
    this.emitHp();
    gameBus.emit('boss-intro', { name: this.cfg.name, subtitle: this.cfg.subtitle });
    AudioManager.play('boss');
  }

  emitHp() {
    gameBus.emit('boss', {
      id: this.cfg.id,
      name: this.cfg.name,
      hp: Math.max(0, this.hp),
      max: this.maxHp,
      phase: this.phase,
    });
  }

  go(state, ms) {
    this.state = state;
    this.stateTimer = ms;
    this.strike.activeHit = false;
  }

  facePlayer() {
    const p = this.scene.player;
    if (!p) return;
    this.facing = p.x < this.x ? -1 : 1;
    this.setFlipX(this.facing < 0);
  }

  baseTick(dt) {
    this.stateTimer -= dt;
    this.iFrame -= dt;
    this.animTimer += dt;
    if (this.animTimer > 160) {
      this.animTimer = 0;
      this.anim = (this.anim + 1) % 4;
      this.syncTex();
    }
  }

  syncTex() {}

  takeHit(info) {
    if (!this.alive || !this.started || this.state === 'intro') return;
    if (this.iFrame > 0) return;
    if (info.token != null) {
      if (this.hitTokens.has(info.token)) return;
      this.hitTokens.add(info.token);
    }
    let damage = info.damage;
    if (this.exposed) damage = Math.ceil(damage * 1.5);
    this.hp -= damage;
    this.iFrame = 60;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => { if (this.active) this.clearTint(); });
    this.scene.feedback('hit');
    this.scene.hitStop?.(info.hitstop);
    this.scene.spawnFx('fx_burst_1', this.x, this.y - 24);
    this.emitHp();
    this.onDamaged?.(damage);
    if (this.hp <= 0) this.die();
  }

  stagger(ms = 680) {
    if (!this.alive) return;
    this.exposed = true;
    this.go('stagger', ms);
    this.body.setVelocity(this.facing * -70, -30);
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.go('dead', 0);
    this.body.enable = false;
    this.strike.activeHit = false;
    gameBus.emit('boss', null);
    this.scene.tweens.add({ targets: this, alpha: 0, y: this.y - 10, duration: 500 });
    this.scene.onBossDefeated(this);
  }

  arena() {
    return this.scene.arenaPx;
  }

  clampX(x) {
    const a = this.arena();
    if (!a) return x;
    return Phaser.Math.Clamp(x, a.left + 36, a.right - 36);
  }
}
