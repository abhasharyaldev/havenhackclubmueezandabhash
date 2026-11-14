import { ANIM } from '../data/attacks.js';

export function animMeta(pose) {
  return ANIM[pose] || ANIM.idle;
}

export function textureKey(prefix, pose, frame) {
  const meta = animMeta(pose);
  const index = Math.max(0, Math.min(meta.frames - 1, frame | 0));
  return `${prefix}_${pose}_${index}`;
}
