import { drawLabel, labelKey } from '../art/font.js';

export function ensureLabel(scene, text, color = '#f6e7c1') {
  const key = labelKey(`${text}_${color}`);
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, drawLabel(text, color));
  return key;
}

export function floatingText(scene, x, y, text, color = '#f6e7c1') {
  const img = scene.add.image(x, y, ensureLabel(scene, text, color)).setDepth(40);
  scene.tweens.add({
    targets: img,
    y: y - 18,
    alpha: 0,
    duration: 700,
    onComplete: () => img.destroy(),
  });
}

export function makePrompt(scene, x, y, text) {
  return scene.add.image(x, y, ensureLabel(scene, text)).setDepth(25);
}
