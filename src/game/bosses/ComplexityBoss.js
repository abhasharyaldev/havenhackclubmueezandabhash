import Phaser from 'phaser';
import { Boss } from '../entities/Boss.js';
import { BOSSES } from '../data/bosses.js';
import { spawnProjectile } from '../systems/CombatSystem.js';

export class ComplexityBoss extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'b_complex_0', BOSSES.complexity);
    this.setupBody(28, 36, 26, 18, false);
    this.patterns = ['barrage', 'pulse', 'barrage'];
    this.core = scene.add.rectangle(x, y, 6, 6, 0x7af0ff).setDepth(12);
  }

  syncTex() {
    const key = `b_complex_${this.anim % 4}`;
    if (this.scene.textures.exists(key)) this.setTexture(key);
    this.core.setPosition(this.x, this.y).setVisible(this.alive);
    if (this.exposed) this.core.setFillStyle(0xfff2a8);
    else this.core.setFillStyle(0x7af0ff);
  }

  step(dt) {
    if (!this.alive || !this.started) return;
    this.baseTick(dt);
    const a = this.arena();
    if (a) {
      // Hover high while attacking; sink to sword height while exposed so the
      // player can actually reach the core.
      const targetY = this.exposed || this.state === 'stagger' ? a.floor - 34 : a.top + 86;
      this.hoverY = this.hoverY == null ? targetY : this.hoverY + (targetY - this.hoverY) * Math.min(1, dt / 160);
      this.x = a.left + (a.right - a.left) / 2;
      this.y = this.hoverY + Math.sin(this.scene.time.now / 400) * 6;
      this.body.reset(this.x, this.y);
    }
    if (this.state === 'intro' && this.stateTimer <= 0) this.go('idle', 400);
    if (this.state === 'stagger' && this.stateTimer <= 0) {
      this.exposed = false;
      this.go('idle', 200);
    }
    if (this.state === 'idle') {
      if (this.stateTimer <= 0) this.startPattern();
    }
    if (this.state === 'barrageWind' && this.stateTimer <= 0) {
      this.barrage();
      this.finishPattern(700);
    }
    if (this.state === 'pulseWind' && this.stateTimer <= 0) {
      this.pulse();
      this.finishPattern(800);
    }
    if (this.state === 'dropWind' && this.stateTimer <= 0) {
      this.dropPlatform();
      this.finishPattern(760);
    }
    if (this.state === 'collapseWind' && this.stateTimer <= 0) {
      this.collapse();
      this.finishPattern(900);
    }
    if (this.state === 'exposed') {
      if (this.stateTimer <= 0) {
        this.exposed = false;
        this.go('idle', this.phase === 3 ? 180 : 320);
      }
    }
  }

  startPattern() {
    if (this.phase === 1) {
      const name = this.patterns[this.patternI % this.patterns.length];
      this.patternI += 1;
      this.go(name === 'pulse' ? 'pulseWind' : 'barrageWind', 520);
      return;
    }
    if (this.phase === 2) {
      const seq = ['barrageWind', 'dropWind', 'pulseWind'];
      this.go(seq[this.patternI % seq.length], 420);
      this.patternI += 1;
      return;
    }
    const seq = ['collapseWind', 'barrageWind', 'pulseWind'];
    this.go(seq[this.patternI % seq.length], 320);
    this.patternI += 1;
  }

  finishPattern(openMs) {
    this.exposed = true;
    this.go('exposed', openMs);
  }

  barrage() {
    const a = this.arena();
    if (!a) return;
    const gap = Phaser.Math.Clamp(this.scene.player.y - 10, a.top + 120, a.bottom - 70);
    this.scene.add.rectangle(a.left + 16, gap, 10, 28, 0x9dffb0, 0.4).setDepth(4).setData('temp', 1);
    const marker = this.scene.add.rectangle(a.left + 20, gap, 8, 26, 0xb7ffb0, 0.5).setDepth(4);
    this.scene.time.delayedCall(900, () => marker.destroy());
    for (let i = 0; i < 6; i++) {
      const y = a.top + 120 + i * 28;
      if (Math.abs(y - gap) < 22) continue;
      spawnProjectile(this.scene, a.left + 20, y, this.phase === 3 ? 120 : 80, 0, 'fx_cube', { owner: this, damage: 1, life: 3200, w: 10, h: 10 });
      spawnProjectile(this.scene, a.right - 20, y, this.phase === 3 ? -120 : -80, 0, 'fx_cube', { owner: this, damage: 1, life: 3200, w: 10, h: 10 });
    }
  }

  pulse() {
    const a = this.arena();
    if (!a) return;
    const lanes = 5;
    const width = (a.right - a.left) / lanes;
    const safe = Phaser.Math.Clamp(Math.floor((this.scene.player.x - a.left) / width), 0, lanes - 1);
    for (let i = 0; i < lanes; i++) {
      if (i === safe) {
        const mark = this.scene.add.rectangle(a.left + width * i + width / 2, a.bottom - 20, width - 8, 8, 0xb7ffb0, 0.7).setDepth(4);
        this.scene.time.delayedCall(1400, () => mark.destroy());
        continue;
      }
      const delay = 180 * i;
      this.scene.time.delayedCall(delay, () => {
        if (!this.alive) return;
        const zone = this.scene.add.zone(a.left + width * i + width / 2, a.bottom - 28, width - 6, 24);
        this.scene.physics.add.existing(zone);
        zone.body.setAllowGravity(false);
        zone.body.moves = false;
        zone.activeHit = true;
        zone.damage = 1;
        zone.owner = this;
        this.scene.threats.push(zone);
        const flash = this.scene.add.rectangle(zone.x, zone.y, width - 6, 16, 0xff5fa8, 0.45).setDepth(4);
        this.scene.time.delayedCall(220, () => {
          zone.destroy();
          flash.destroy();
        });
      });
    }
  }

  dropPlatform() {
    const x = this.scene.player.x;
    const y = this.scene.player.y;
    const mark = this.scene.add.image(x, y, 'fx_mark').setTint(0xff5fa8).setDepth(6);
    this.scene.time.delayedCall(560, () => {
      mark.destroy();
      if (!this.alive) return;
      const zone = this.scene.add.zone(x, y - 10, 36, 28);
      this.scene.physics.add.existing(zone);
      zone.body.setAllowGravity(false);
      zone.body.moves = false;
      zone.activeHit = true;
      zone.damage = 1;
      zone.owner = this;
      this.scene.threats.push(zone);
      this.scene.spawnFx('fx_burst_2', x, y - 20);
      this.scene.time.delayedCall(180, () => zone.destroy());
    });
  }

  collapse() {
    const a = this.arena();
    if (!a) return;
    const cols = 6;
    const width = (a.right - a.left) / cols;
    const safe = Phaser.Math.Between(0, cols - 1);
    for (let i = 0; i < cols; i++) {
      const x = a.left + i * width + width / 2;
      if (i === safe) {
        const mark = this.scene.add.rectangle(x, a.top + 70, width - 10, 10, 0xb7ffb0, 0.8).setDepth(5);
        this.scene.time.delayedCall(1600, () => mark.destroy());
        continue;
      }
      this.scene.time.delayedCall(120 * i, () => {
        if (!this.alive) return;
        spawnProjectile(this.scene, x, a.top + 40, 0, 160, 'fx_cube', { owner: this, damage: 1, life: 1600, w: 12, h: 12, gravity: false });
      });
    }
  }

  onDamaged() {
    if (this.phase === 1 && this.hp <= this.maxHp * 0.7) {
      this.phase = 2;
      this.emitHp();
      this.go('idle', 400);
    } else if (this.phase === 2 && this.hp <= this.maxHp * 0.35) {
      this.phase = 3;
      this.emitHp();
      this.go('idle', 400);
    }
  }

  die() {
    this.core?.destroy();
    super.die();
  }
}
