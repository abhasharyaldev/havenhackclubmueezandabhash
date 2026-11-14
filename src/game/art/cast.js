import { makeSurface } from './surface.js';

function slime(frame, attack) {
  const s = makeSurface(24, 20);
  const squish = attack ? 2 : [0, 1, 2, 1][frame % 4];
  const y = 6 + squish;
  s.ellipse(12, y + 4, 8, 6 - squish, '#c4303a');
  s.ellipse(12, y + 5, 6, 4, '#e24a4a');
  s.rect(7, y + 6, 10, 3, '#8e1c28');
  s.ellipse(8, y + 2, 2, 2, '#ff6a6a');
  if (attack) {
    s.ellipse(18, y + 4, 4, 3, '#ff4444');
  }
  s.rect(9, y + 3, 2, 2, '#1a1014');
  s.rect(14, y + 3, 2, 2, '#1a1014');
  s.px(9, y + 3, '#ffffff');
  s.outline('#2a0c10');
  return s.toCanvas();
}

function drone(frame, attack) {
  const s = makeSurface(24, 20);
  const bob = [0, 1, 0, -1][frame % 4];
  s.rect(6, 6 + bob, 10, 8, '#f4f7fb');
  s.rect(14, 8 + bob, 6, 4, '#d0d6e0');
  s.rect(8, 8 + bob, 3, 3, '#7ec8ff');
  s.rect(4, 4 + bob, 4, 2, '#cfd6e2');
  s.rect(8, 2 + bob, 3, 3, '#e8eef8');
  s.px(18, 9 + bob, attack ? '#ff4455' : '#89a');
  if (attack) s.rect(18, 9 + bob, 4, 2, '#9fd0ff');
  s.outline('#243044');
  return s.toCanvas();
}

function goblin(frame, attack) {
  const s = makeSurface(28, 28);
  const bob = [0, 1, 0, 1][frame % 4];
  s.ellipse(13, 12 + bob, 6, 6, '#7dba45');
  s.rect(10, 14 + bob, 8, 7, '#5e9a32');
  s.rect(8, 20 + bob, 4, 4, '#6aaa38');
  s.rect(15, 20 + bob, 4, 4, '#6aaa38');
  s.rect(9, 23 + bob, 4, 2, '#3d2918');
  s.rect(15, 23 + bob, 4, 2, '#3d2918');
  s.rect(11, 11 + bob, 2, 2, '#1c140c');
  s.rect(15, 11 + bob, 2, 2, '#1c140c');
  s.px(11, 11 + bob, '#ffffff');
  const wx = attack ? 20 : 17;
  const wy = attack ? 8 : 14;
  s.rect(wx, wy + bob, 3, 10, '#c0c6cc');
  s.rect(wx - 2, wy + 8 + bob, 7, 3, '#8a9098');
  s.outline('#1a2410');
  return s.toCanvas();
}

function note(frame, attack) {
  const s = makeSurface(22, 24);
  const tilt = [0, 1, 0, -1][frame % 4];
  s.rect(4 + tilt, 3, 12, 15, '#f4f0e4');
  s.rect(5 + tilt, 5, 8, 1, '#e24a4a');
  s.rect(5 + tilt, 8, 9, 1, '#2a241c');
  s.rect(5 + tilt, 11, 7, 1, '#2a241c');
  s.rect(5 + tilt, 14, 6, 1, '#7a7368');
  s.rect(6, 18, 3, 3, '#d8d2c4');
  s.rect(12, 18, 3, 3, '#d8d2c4');
  if (attack) {
    s.rect(16, 8, 4, 3, '#ff5555');
    s.px(17, 9, '#fff');
  }
  s.rect(7 + tilt, 6, 2, 2, '#1c140c');
  s.outline('#2a241c');
  return s.toCanvas();
}

function dummy(armored) {
  const s = makeSurface(24, 32);
  s.rect(6, 6, 12, 16, armored ? '#c0a060' : '#d8d2c6');
  s.rect(8, 8, 8, 6, armored ? '#e6c98a' : '#f4f0e6');
  s.rect(9, 18, 3, 8, '#8a8478');
  s.rect(13, 18, 3, 8, '#8a8478');
  s.rect(8, 10, 2, 2, '#1c140c');
  s.rect(13, 10, 2, 2, '#1c140c');
  if (armored) s.rect(5, 12, 14, 3, '#8a7040');
  s.outline('#2a241c');
  return s.toCanvas();
}

export function buildEnemyArt() {
  const out = {};
  for (let i = 0; i < 4; i++) {
    out[`e_slime_${i}`] = slime(i, false);
    out[`e_drone_${i}`] = drone(i, false);
    out[`e_goblin_${i}`] = goblin(i, false);
    out[`e_note_${i}`] = note(i, false);
  }
  out.e_slime_atk = slime(1, true);
  out.e_drone_atk = drone(1, true);
  out.e_goblin_atk = goblin(0, true);
  out.e_note_atk = note(1, true);
  out.e_dummy = dummy(false);
  out.e_armor = dummy(true);
  return out;
}

function bug(frame, attack) {
  const s = makeSurface(56, 60);
  const bob = [0, 1, 2, 1][frame % 4];
  s.ellipse(28, 30 + bob, 16, 20, '#3a3a3a');
  s.ellipse(28, 18 + bob, 12, 10, '#2a2a2a');
  s.rect(16, 34 + bob, 8, 12, '#2f2f2f');
  s.rect(32, 34 + bob, 8, 12, '#2f2f2f');
  s.rect(18, 44 + bob, 6, 4, '#1a1a1a');
  s.rect(34, 44 + bob, 6, 4, '#1a1a1a');
  s.rect(14, 16 + bob, 6, 4, '#4a4a4a');
  s.rect(34, 12 + bob, 5, 6, '#4a4a4a');
  for (let i = 0; i < 5; i++) {
    const px = 10 + ((i * 9 + frame * 3) % 36);
    const py = 8 + ((i * 5 + frame) % 10);
    s.rect(px, py, 2, 2, i % 2 ? '#ff4458' : '#7a2030');
  }
  s.rect(22, 16 + bob, 3, 3, '#ff2a3a');
  s.rect(30, 16 + bob, 3, 3, '#ff2a3a');
  s.px(23, 16 + bob, '#ffd0d4');
  s.px(31, 16 + bob, '#ffd0d4');
  if (attack) {
    s.line(36, 28 + bob, 52, 24 + bob, '#ff4458', 3);
    s.rect(48, 20 + bob, 4, 4, '#ff8890');
  }
  s.outline('#120c0c');
  return s.toCanvas();
}

function deadline(frame, attack) {
  const s = makeSurface(48, 60);
  const bob = frame % 2;
  s.rect(16, 28 + bob, 16, 18, '#c6a15a');
  s.rect(18, 30 + bob, 12, 8, '#f0d48a');
  s.ellipse(24, 34 + bob, 5, 5, '#f8f1d2');
  s.rect(23, 31 + bob, 2, 4, '#2a2418');
  s.rect(22, 34 + bob, 4, 1, '#2a2418');
  s.rect(14, 16 + bob, 20, 14, '#d8b86a');
  s.rect(18, 18 + bob, 12, 8, '#8a7040');
  s.rect(20, 20 + bob, 3, 3, '#fff4c8');
  s.rect(26, 20 + bob, 3, 3, '#fff4c8');
  s.rect(12, 18 + bob, 6, 16, '#a84848');
  s.rect(30, 30 + bob, 6, 14, '#b89048');
  s.rect(14, 42 + bob, 7, 10, '#8d7344');
  s.rect(26, 42 + bob, 7, 10, '#8d7344');
  s.rect(13, 50 + bob, 8, 3, '#5a4630');
  s.rect(26, 50 + bob, 8, 3, '#5a4630');
  if (attack) s.line(32, 24, 46, 40, '#f0e2a0', 3);
  else s.rect(34, 20 + bob, 3, 16, '#eee4b8');
  s.outline('#2a2010');
  return s.toCanvas();
}

function burnout(frame, attack) {
  const s = makeSurface(72, 64);
  const bob = [0, 1, 0, 2][frame % 4];
  s.ellipse(36, 34 + bob, 22, 18, '#2a2a2a');
  s.ellipse(20, 30 + bob, 10, 8, '#3a3a3a');
  s.ellipse(52, 30 + bob, 10, 8, '#3a3a3a');
  s.ellipse(36, 20 + bob, 12, 10, '#242424');
  s.rect(28, 18 + bob, 4, 3, '#ffb15a');
  s.rect(40, 18 + bob, 4, 3, '#ffb15a');
  s.px(29, 18 + bob, '#fff1c8');
  s.px(41, 18 + bob, '#fff1c8');
  s.rect(32, 30 + bob, 8, 10, attack ? '#ffe08a' : '#ff7a32');
  s.rect(34, 32 + bob, 4, 6, '#ffd2a0');
  s.rect(22, 46 + bob, 10, 8, '#1e1e1e');
  s.rect(40, 46 + bob, 10, 8, '#1e1e1e');
  s.rect(16, 24 + bob, 6, 4, '#4a4a4a');
  s.rect(50, 20 + bob, 8, 4, '#3a3a3a');
  if (attack) s.ellipse(56, 36, 6, 4, '#ff8844');
  s.outline('#140c0c');
  return s.toCanvas();
}

function complexity(frame) {
  const s = makeSurface(80, 72);
  const bob = [0, 2, 1, 2][frame % 4];
  s.ellipse(40, 34 + bob, 18, 16, '#3a1460');
  s.ellipse(40, 28 + bob, 10, 9, '#f4f0ea');
  s.rect(34, 26 + bob, 3, 4, '#241838');
  s.rect(43, 26 + bob, 3, 4, '#241838');
  s.rect(37, 32 + bob, 6, 2, '#241838');
  s.rect(36, 40 + bob, 8, 8, '#7af0ff');
  s.rect(38, 42 + bob, 4, 4, '#e8fdff');
  const cubes = [
    [14, 18],
    [58, 16],
    [18, 48],
    [56, 46],
  ];
  cubes.forEach(([x, y], i) => {
    const ox = ((frame + i) % 2) * 2;
    s.rect(x + ox, y + bob, 8, 8, i % 2 ? '#c45cff' : '#7a4ad0');
    s.rect(x + 2 + ox, y + 2 + bob, 3, 3, '#f0e8ff');
  });
  s.line(22, 30 + bob, 30, 34 + bob, '#c45cff', 2);
  s.line(50, 34 + bob, 58, 28 + bob, '#7af0ff', 2);
  s.outline('#140818');
  return s.toCanvas();
}

export function buildBossArt() {
  const out = {};
  for (let i = 0; i < 4; i++) {
    out[`b_bug_${i}`] = bug(i, false);
    out[`b_deadline_${i}`] = deadline(i, false);
    out[`b_burnout_${i}`] = burnout(i, false);
    out[`b_complex_${i}`] = complexity(i);
  }
  out.b_bug_atk = bug(2, true);
  out.b_deadline_atk = deadline(1, true);
  out.b_burnout_atk = burnout(2, true);
  out.b_bug_hurt = bug(0, false);
  return out;
}
