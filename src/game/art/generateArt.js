import { buildBossArt, buildEnemyArt } from './cast.js';
import { buildPlayerArt } from './hero.js';
import { buildEffects, buildIcons, buildTiles, buildBackgrounds } from './worldArt.js';

export function generateAll() {
  return {
    ...buildPlayerArt(),
    ...buildEnemyArt(),
    ...buildBossArt(),
    ...buildTiles(),
    ...buildBackgrounds(),
    ...buildEffects(),
    ...buildIcons(),
  };
}

export function installTextures(scene, bank) {
  for (const [key, canvas] of Object.entries(bank)) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }
}
