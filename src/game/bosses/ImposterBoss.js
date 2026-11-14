import Phaser from 'phaser';
import { Boss } from '../entities/Boss.js';
import { BOSSES } from '../data/bosses.js';
import { makeThreat } from '../systems/CombatSystem.js';

export class ImposterBoss extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'imp_idle_0', BOSSES.imposter);
    this.setupBody(14, 28, 9, 17, true);
    this.setOrigin(16 / 48, 45 / 48);
    this.patterns = ['rush', 'combo', 'air', 'clone'];
    this.eye = scene.add.rectangle(x, y - 30, 3, 2, 0xd15cff).setDepth(12);
    this.clones = [];
  }

  syncTex() {
    const pose = this.state === 'rush' ? 'dash' : this.state === 'combo' ? 'light1' : 'idle';
    const key = `imp_${pose}_${this.anim % (pose === 'idle' ? 4 : pose === 'dash' ? 4 : 4)}`;
    if (this.scene.textures.exists(key)) this.setTexture(key);
    this.eye.setPosition(this.x + this.facing * 4, this.y - 32).setVisible(this.alive && this.alpha > 0.8);
  }

  step(dt) {
    if (!this.alive || !this.started) return;
    this.baseTick(dt);
    this.facePlayer();
    this.clones = this.clones.filter((c) => c.active);
    if (this.state === 'intro' && this.stateTimer <= 0) this.go('idle', 300);
    if (this.state === 'stagger' && this.stateTimer <= 0) {
      this.exposed = false;
      this.go('idle', 180);
    }
    if (this.state === 'idle') {
      this.body.setVelocityX(0);
      this.setAlpha(1);
      if (this.stateTimer <= 0) this.startPattern();
    }
    if (this.state === 'rushWind') {
      this.setTint(0xc45cff);
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.rushDir = this.facing;
        this.go('rush', 280);
      }
    }
    if (this.state === 'rush') {
      this.body.setVelocityX(this.rushDir * 300);
      this.strike.activeHit = true;
      this.strike.damage = 1;
      this.strike.setPosition(this.x + this.rushDir * 16, this.y - 16);
      if (this.stateTimer <= 0) {
        this.exposed = true;
        this.go('recover', 650);
      }
    }
    if (this.state === 'combo') {
      this.body.setVelocityX(this.facing * 50);
      const hitting = this.anim % 2 === 0;
      this.strike.activeHit = hitting;
      this.strike.setPosition(this.x + this.facing * 18, this.y - 18);
      if (this.stateTimer <= 0) this.go('recover', 380);
    }
    if (this.state === 'airMark') {
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.body.setVelocityY(-360);
        this.go('airHang', 280);
      }
    }
    if (this.state === 'airHang' && this.stateTimer <= 0) {
      this.x = this.markX;
      this.body.reset(this.x, this.y - 20);
      this.body.setVelocityY(420);
      this.go('airFall', 500);
    }
    if (this.state === 'airFall' && (this.body.blocked.down || this.stateTimer <= 0)) {
      this.strike.activeHit = true;
      this.strike.setPosition(this.x, this.y - 10);
      this.scene.time.delayedCall(120, () => { this.strike.activeHit = false; });
      this.markImg?.destroy();
      this.go('recover', 420);
    }
    if (this.state === 'cloneWind' && this.stateTimer <= 0) {
      this.raiseClones();
      this.go('recover', this.phase === 2 ? 280 : 460);
    }
    if (this.state === 'recover') {
      this.strike.activeHit = false;
      this.body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.exposed = false;
        this.go('idle', this.phase === 2 ? 140 : 240);
      }
    }
  }

  startPattern() {
    const name = this.patterns[this.patternI % this.patterns.length];
    this.patternI += 1;
    if (name === 'rush') this.go('rushWind', this.phase === 2 ? 280 : 420);
    else if (name === 'combo') this.go('combo', 720);
    else if (name === 'air') this.armAir();
    else this.go('cloneWind', 360);
  }

  armAir() {
    this.markX = Phaser.Math.Clamp(this.scene.player.x, this.arena().left + 30, this.arena().right - 30);
    this.markImg?.destroy();
    this.markImg = this.scene.add.image(this.markX, this.y, 'fx_mark').setTint(0xc45cff).setDepth(6);
    this.go('airMark', 420);
  }

  raiseClones() {
    const count = this.phase === 2 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const cx = this.clampX(this.x + (i === 0 ? -70 : 70));
      const clone = this.scene.add.sprite(cx, this.y, 'imp_idle_0').setOrigin(this.originX, this.originY).setAlpha(0.45).setTint(0xbbaadd).setDepth(8);
      const strike = makeThreat(this.scene, 22, 16);
      strike.owner = this;
      strike.damage = 1;
      this.scene.time.delayedCall(420 + i * 180, () => {
        if (!clone.active) return;
        strike.activeHit = true;
        strike.setPosition(clone.x + 16, clone.y - 18);
        clone.setTexture('imp_light1_2');
        this.scene.time.delayedCall(160, () => {
          strike.activeHit = false;
          strike.destroy();
          clone.destroy();
        });
      });
      this.clones.push(clone);
    }
  }

  onDamaged() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.patterns = ['rush', 'clone', 'combo', 'air', 'clone'];
      this.emitHp();
    }
  }

  die() {
    this.eye?.destroy();
    this.markImg?.destroy();
    super.die();
  }
}
