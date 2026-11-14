import { GAME_HEIGHT, GAME_WIDTH } from '../config.js';
import { SaveSystem } from './SaveSystem.js';

const LAYERS = [
  { name: 'far', factor: 0.1, depth: -30 },
  { name: 'mid', factor: 0.3, depth: -20 },
  { name: 'near', factor: 0.65, depth: -10 },
];

export function createParallax(scene, theme) {
  const nodes = LAYERS.map((layer) => {
    const key = `bg_${theme}_${layer.name}`;
    const spr = scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key)
      .setOrigin(0, 0)
      .setScrollFactor(1)
      .setDepth(layer.depth);
    spr.setData('factor', layer.factor);
    return spr;
  });

  return {
    nodes,
    update(cam) {
      const settings = scene.game?.registry?.get('settings') || SaveSystem.loadSettings();
      const motion = settings.reducedMotion ? 0.25 : 1;
      const maxY = 640 - GAME_HEIGHT;
      for (const node of nodes) {
        const factor = node.getData('factor') * motion;
        node.setPosition(cam.scrollX, cam.scrollY);
        node.tilePositionX = Math.floor(cam.scrollX * factor);
        node.tilePositionY = Math.floor(Math.max(0, Math.min(maxY, cam.scrollY * factor)));
      }
    },
  };
}
