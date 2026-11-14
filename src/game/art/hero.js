import { HERO, IMPOSTER } from './palette.js';
import { makeSurface } from './surface.js';

function cupVisible(pose) {
  return ['idle', 'run', 'jump', 'fall', 'land', 'victory', 'respawn'].includes(pose);
}

function legPose(pose, frame) {
  const run = [
    { bx: -5, fx: 6, bl: 0, fl: 1 },
    { bx: -3, fx: 4, bl: 0, fl: 3 },
    { bx: -1, fx: 1, bl: 1, fl: 4 },
    { bx: 4, fx: -4, bl: 2, fl: 0 },
    { bx: 6, fx: -6, bl: 3, fl: 0 },
    { bx: 2, fx: -1, bl: 4, fl: 1 },
  ];
  if (pose === 'run') return run[frame % 6];
  if (pose === 'jump' || pose === 'air') {
    const sets = [
      { bx: -3, fx: 3, bl: 4, fl: 5 },
      { bx: -2, fx: 2, bl: 6, fl: 6 },
      { bx: -4, fx: 4, bl: 3, fl: 3 },
    ];
    return sets[frame % 3];
  }
  if (pose === 'fall') return [{ bx: -4, fx: 5, bl: 1, fl: 0 }, { bx: -2, fx: 3, bl: 0, fl: 2 }][frame % 2];
  if (pose === 'dash') return { bx: -6, fx: 5, bl: 1, fl: 2 };
  if (pose === 'land') return [{ bx: -6, fx: 6, bl: 0, fl: 0 }, { bx: -4, fx: 4, bl: 0, fl: 0 }, { bx: -2, fx: 2, bl: 0, fl: 0 }][frame % 3];
  if (pose === 'hurt') return { bx: -3, fx: 2, bl: 1, fl: 0 };
  if (pose === 'defeat') {
    const t = [0, 2, 5, 8, 10, 12][frame] || 0;
    return { bx: -3, fx: 4, bl: t, fl: t };
  }
  const idle = [
    { bx: -2, fx: 2, bl: 0, fl: 0 },
    { bx: -2, fx: 2, bl: 1, fl: 0 },
    { bx: -2, fx: 2, bl: 0, fl: 0 },
    { bx: -2, fx: 2, bl: 0, fl: 1 },
  ];
  return idle[frame % 4];
}

function armPose(pose, frame) {
  if (pose === 'light1') return [-40, -10, 30, 70][frame] ?? 20;
  if (pose === 'light2') return [80, 20, -30, -80][frame] ?? 0;
  if (pose === 'light3') return [-90, -40, 10, 55, 100][frame] ?? 40;
  if (pose === 'heavy') return [-110, -80, -30, 20, 70, 110][frame] ?? 0;
  if (pose === 'air') return [-20, 40, 80][frame] ?? 40;
  if (pose === 'parry') return [140, 150, 130][frame] ?? 140;
  if (pose === 'parryok') return [160, 150, 120][frame] ?? 140;
  if (pose === 'dash') return [40, 55, 50, 30][frame] ?? 40;
  if (pose === 'victory') return [-20, -70, -110, -90][frame] ?? -70;
  if (pose === 'hurt') return [20, -10][frame] ?? 0;
  return 18;
}

function drawLeg(s, hipX, hipY, dx, lift, pal) {
  const footX = hipX + dx;
  const footY = hipY + 12 - lift;
  s.line(hipX, hipY, footX, footY - 2, pal.pants, 4);
  s.rect(footX - 1, hipY + 2, 3, 6, pal.pantsDk);
  s.rect(footX - 4, footY - 1, 8, 3, pal.shoe);
  s.rect(footX - 4, footY + 1, 8, 2, pal.sole);
  s.px(footX + 2, footY - 1, pal.shoe);
  s.px(footX - 2, footY, pal.sole);
}

function drawCup(s, x, y, pal) {
  s.rect(x, y, 5, 6, pal.cup);
  s.rect(x, y + 4, 5, 2, pal.cupDk);
  s.rect(x + 1, y + 1, 3, 3, pal.matcha);
  s.px(x + 2, y + 1, pal.matchaHi);
  s.rect(x + 2, y - 3, 1, 3, pal.cupDk);
}

function drawBlade(s, x, y, angleDeg, reach, pal) {
  const rad = (angleDeg * Math.PI) / 180;
  const x1 = x + Math.cos(rad) * reach;
  const y1 = y + Math.sin(rad) * reach;
  s.line(x, y, x1, y1, pal.bladeDk, 4);
  s.line(x, y, x1, y1, pal.blade, 2);
  s.line(x + 1, y, x1, y1, pal.bladeHi, 1);
  s.rect(x - 1, y - 1, 3, 3, pal.hoodHi);
}

function drawEyes(s, x, y, pose, frame, pal) {
  const blink = pose === 'idle' && frame === 2;
  if (blink || (pose === 'defeat' && frame >= 3)) return;
  if (pose === 'hurt') {
    s.px(x, y, pal.eye);
    s.px(x + 1, y + 1, pal.eye);
    s.px(x + 3, y, pal.eye);
    s.px(x + 4, y + 1, pal.eye);
    return;
  }
  s.rect(x, y, 1, 2, pal.eye);
  s.rect(x + 3, y, 1, 2, pal.eye);
  s.px(x, y, '#ffffff');
  if (pose === 'victory') {
    s.px(x + 1, y + 4, pal.eye);
    s.px(x + 2, y + 4, pal.eye);
  } else {
    s.px(x + 4, y + 3, pal.blush);
  }
}

function drawStanding(s, pose, frame, pal) {
  const bob = pose === 'idle' ? [0, 1, 2, 1][frame % 4] : pose === 'run' ? [0, 1, 0, 1, 0, 1][frame % 6] : pose === 'land' ? [3, 1, 0][frame % 3] : 0;
  const lean = pose === 'dash' ? [3, 4, 4, 2][frame % 4] : pose === 'hurt' ? -2 : pose === 'light3' ? 1 : 0;
  const squash = pose === 'land' && frame === 0 ? 2 : 0;
  const y = bob + squash;
  const legs = legPose(pose, frame);
  const hipY = 30 + y;
  if (pose !== 'defeat' || frame < 4) {
    drawLeg(s, 13 + lean, hipY, legs.bx, legs.bl, pal);
    drawLeg(s, 18 + lean, hipY, legs.fx, legs.fl, pal);
  }

  const bodyY = 18 + y;
  s.rect(8 + lean, bodyY, 16, 14 - squash, pal.hood);
  s.rect(9 + lean, bodyY + 1, 5, 10, pal.hoodHi);
  s.rect(8 + lean, bodyY + 11 - squash, 16, 3, pal.hoodDk);
  s.rect(18 + lean, bodyY + 3, 6, 5, pal.hoodDk);

  const angle = armPose(pose, frame);
  const reach = pose === 'heavy' ? 16 : pose === 'light3' ? 15 : pose === 'parry' || pose === 'parryok' ? 8 : 13;
  const shoulderX = 20 + lean;
  const shoulderY = 24 + y;
  if (cupVisible(pose)) {
    const swing = pose === 'run' ? [0, 1, 0, -1, 0, 1][frame % 6] : 0;
    const raised = pose === 'victory' ? [-2, -8, -12, -10][frame % 4] : 0;
    drawCup(s, 22 + lean, 22 + y + swing + raised, pal);
  } else if (!['hurt', 'defeat', 'respawn'].includes(pose)) {
    drawBlade(s, shoulderX, shoulderY, angle, reach, pal);
  }
  if (pose === 'parry' || pose === 'parryok') {
    s.rect(22 + lean, 18 + y, 3, 10, pal.blade);
    s.rect(21 + lean, 18 + y, 5, 2, pal.bladeHi);
  }

  const hx = 15 + lean;
  const hy = 13 + y;
  s.ellipse(hx - 1, hy, 9, 8, pal.hair);
  s.ellipse(hx + 2, hy + 1, 6, 6, pal.skin);
  s.rect(hx - 8, hy - 8, 3, 5, pal.hair);
  s.rect(hx - 5, hy - 11, 4, 7, pal.hair);
  s.rect(hx, hy - 9, 3, 5, pal.hair);
  s.rect(hx + 3, hy - 7, 4, 5, pal.hair);
  s.rect(hx - 6, hy - 4, 13, 4, pal.hair);
  s.rect(hx - 2, hy - 8, 2, 3, pal.hairHi);
  s.rect(hx - 9, hy + 5, 15, 4, pal.hood);
  s.rect(hx - 8, hy + 6, 4, 3, pal.hoodHi);

  if (pose === 'dash') {
    const len = [4, 7, 9, 5][frame % 4];
    s.rect(2, 24 + y, len, 1, pal.bladeHi);
    s.rect(0, 28 + y, len + 2, 1, pal.hoodHi);
  }
  if (pose === 'parryok') {
    const n = [2, 5, 3][frame % 3];
    s.rect(26, 16 + y, n, n, pal.spark);
    s.px(28, 14 + y, pal.bladeHi);
    s.px(30, 20 + y, pal.spark);
  }
  if (pose === 'respawn') {
    const glow = ['#7af0ff', '#d4f28a', '#ffffff', '#7af0ff', '#86c83e'][frame % 5];
    s.rect(6, 8 + frame, 1, 1, glow);
    s.rect(26, 12, 1, 1, glow);
    s.rect(16, 4, 1, 1, glow);
  }

  s.outline(pal.outline);
  drawEyes(s, hx + 3, hy, pose, frame, pal);
}

function drawFallen(s, frame, pal) {
  const y = frame === 5 ? 30 : 28;
  s.ellipse(14, y - 4, 8, 6, pal.hair);
  s.rect(8, y - 2, 16, 8, pal.hood);
  s.rect(22, y, 12, 5, pal.pants);
  s.rect(32, y + 2, 8, 3, pal.shoe);
  s.rect(6, y + 4, 6, 3, pal.shoe);
  s.rect(18, y - 6, 6, 5, pal.skin);
  s.outline(pal.outline);
  s.px(21, y - 4, pal.eye);
}

const POSES = {
  idle: 4,
  run: 6,
  jump: 3,
  fall: 2,
  land: 3,
  dash: 4,
  light1: 4,
  light2: 4,
  light3: 5,
  heavy: 6,
  air: 3,
  parry: 3,
  parryok: 3,
  hurt: 2,
  defeat: 6,
  respawn: 5,
  victory: 4,
};

export function buildHeroTextures(prefix, palette) {
  const out = {};
  const hashes = {};
  for (const [pose, count] of Object.entries(POSES)) {
    hashes[pose] = [];
    for (let frame = 0; frame < count; frame++) {
      const s = makeSurface(48, 48);
      if (pose === 'defeat' && frame >= 4) drawFallen(s, frame, palette);
      else drawStanding(s, pose, frame, palette);
      const key = `${prefix}_${pose}_${frame}`;
      out[key] = s.toCanvas();
      hashes[pose].push(s.hash());
    }
    const unique = new Set(hashes[pose]);
    if (unique.size !== count) {
      console.warn(`[art] ${prefix} ${pose} has duplicate frames`, hashes[pose]);
    }
  }
  return out;
}

export function buildPlayerArt() {
  return {
    ...buildHeroTextures('p', HERO),
    ...buildHeroTextures('imp', IMPOSTER),
  };
}

export const HERO_ORIGIN = { x: 16 / 48, y: 45 / 48 };
export const HERO_BODY = { w: 14, h: 28, ox: 9, oy: 17 };
