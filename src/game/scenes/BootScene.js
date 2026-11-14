import Phaser from 'phaser';
import { generateAll, installTextures } from '../art/generateArt.js';
import { gameBus } from '../systems/GameEvents.js';
import { createParallax } from '../systems/ParallaxSystem.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    try {
      if (!this.textures.exists('p_idle_0')) installTextures(this, generateAll());
      this.parallax = createParallax(this, 'school');
      this.scroll = 0;
      gameBus.emit('ready');
    } catch (err) {
      console.error(err);
      gameBus.emit('boot-error', String(err?.message || err));
    }
  }

  update(_time, delta) {
    this.scroll += delta * 0.06;
    this.parallax?.update({ scrollX: this.scroll, scrollY: 20 });
  }
}
