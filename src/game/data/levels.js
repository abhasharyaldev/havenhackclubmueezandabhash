const T = 16;
const FLOOR = 20;
const feet = (tx, surface = FLOOR) => ({ x: tx * T + 8, y: surface * T });

function solid(x, y, w, h, skin, extra = {}) {
  return { x, y, w, h, skin, ...extra };
}

function bedroom() {
  const solids = [
    solid(0, FLOOR, 76, 3, 'wood'),
    solid(0, 0, 2, FLOOR, 'wood'),
    solid(74, 0, 2, FLOOR, 'wood'),
    solid(6, 18, 6, 2, 'wood'),
    solid(16, 18, 5, 2, 'wood'),
  ];
  return {
    id: 'bedroom',
    scene: 'HubScene',
    name: 'BEDROOM',
    theme: 'bedroom',
    music: 'bedroom',
    width: 76,
    height: 23,
    solids,
    platforms: [],
    timers: [],
    movers: [],
    hazards: [],
    enemies: [],
    shards: [{ id: 'bed-shard', ...feet(8, 18), amount: 3 }],
    hearts: [],
    checkpoints: [],
    interacts: [
      { kind: 'upgrade', ...feet(24), label: 'E  UPGRADES' },
      { kind: 'door', ...feet(34), to: 'tutorial', label: 'PRACTICE' },
      { kind: 'door', ...feet(42), to: 'school', label: 'CAMPUS' },
      { kind: 'door', ...feet(50), to: 'clock', label: 'CLOCK' },
      { kind: 'door', ...feet(58), to: 'overheat', label: 'HEAT' },
      { kind: 'door', ...feet(66), to: 'mirror', label: 'MIRROR' },
      { kind: 'door', ...feet(72), to: 'core', label: 'CORE' },
    ],
    exit: null,
    boss: null,
    steps: [],
    gates: [],
    echoes: [],
    decors: [
      { x: 18 * T, y: 16 * T, blink: true, tint: 0x8fd0ff },
      { x: 10 * T, y: 15 * T, blink: true, tint: 0xffd27a },
    ],
    playerStart: feet(4),
  };
}

function tutorial() {
  const gate = (after, x) => solid(x, 14, 2, 6, 'metal', { gate: after });
  return {
    id: 'tutorial',
    scene: 'TutorialScene',
    name: 'PRACTICE',
    theme: 'bedroom',
    music: 'tutorial',
    width: 142,
    height: 23,
    solids: [
      solid(0, FLOOR, 28, 3, 'wood'),
      solid(31, FLOOR, 11, 3, 'wood'),
      solid(49, FLOOR, 93, 3, 'wood'),
      solid(0, 0, 2, FLOOR, 'wood'),
      solid(140, 0, 2, FLOOR, 'wood'),
      gate('move', 20),
      gate('jump', 38),
      gate('dash', 60),
      gate('attack', 74),
      gate('heavy', 86),
      gate('parry', 98),
      gate('checkpoint', 112),
      gate('fight', 126),
    ],
    platforms: [{ x: 22, y: 16, w: 3, skin: 'plat' }],
    timers: [],
    movers: [],
    hazards: [],
    enemies: [
      { id: 'tut-dummy', kind: 'dummy', ...feet(68) },
      { id: 'tut-armor', kind: 'armor', ...feet(80) },
      { id: 'tut-trainer', kind: 'trainer', ...feet(92), patrol: 16 },
      { id: 'fight-a', kind: 'slime', ...feet(118), patrol: 20, drop: 2 },
      { id: 'fight-b', kind: 'slime', ...feet(122), patrol: 16, drop: 2 },
    ],
    shards: [{ id: 'tut-shard-1', ...feet(23, 16), amount: 3 }],
    hearts: [],
    checkpoints: [{ id: 'tut-cp', ...feet(106) }],
    interacts: [{ kind: 'door', ...feet(134), to: 'school', label: 'CAMPUS', exit: true }],
    exit: { ...feet(134), to: 'school' },
    boss: null,
    steps: [
      { id: 'move', kind: 'move', goal: 180, prompt: 'A D  MOVE', ...feet(8, 17) },
      { id: 'jump', kind: 'x', goal: 33 * T, prompt: 'SPACE  JUMP', ...feet(26, 17) },
      { id: 'dash', kind: 'dash-x', goal: 50 * T, prompt: 'SHIFT  DASH', ...feet(44, 17) },
      { id: 'attack', kind: 'hit', prompt: 'J  ATTACK', ...feet(68, 17) },
      { id: 'heavy', kind: 'kill', target: 'tut-armor', prompt: 'K  HEAVY', ...feet(80, 17) },
      { id: 'parry', kind: 'parry', prompt: 'Q  PARRY', ...feet(92, 17) },
      { id: 'checkpoint', kind: 'checkpoint', prompt: 'E  SAVE', ...feet(106, 17) },
      { id: 'fight', kind: 'clear', prefix: 'fight-', prompt: 'CLEAR', ...feet(118, 17) },
      { id: 'exit', kind: 'reach', goal: 130 * T, prompt: 'E  EXIT', ...feet(132, 17) },
    ],
    gates: [],
    echoes: [],
    decors: [],
    playerStart: feet(4),
  };
}

function school() {
  const solids = [
    solid(0, FLOOR, 28, 3, 'grass'),
    solid(32, FLOOR, 20, 3, 'grass'),
    solid(58, FLOOR, 110, 3, 'grass'),
    solid(0, 0, 2, FLOOR, 'dirt'),
    solid(166, 0, 2, FLOOR, 'dirt'),
  ];
  return {
    id: 'school',
    scene: 'SchoolScene',
    name: 'SCHOOL CAMPUS',
    theme: 'school',
    music: 'school',
    width: 168,
    height: 23,
    solids,
    platforms: [
      { x: 12, y: 16, w: 4, skin: 'plat' },
      { x: 36, y: 16, w: 4, skin: 'plat' },
      { x: 66, y: 15, w: 4, skin: 'plat' },
      { x: 92, y: 16, w: 5, skin: 'plat' },
    ],
    timers: [],
    movers: [],
    hazards: [],
    enemies: [
      { id: 'sch-slime-1', kind: 'slime', ...feet(40), patrol: 40 },
      { id: 'sch-gob-1', kind: 'goblin', ...feet(70), patrol: 36 },
      { id: 'sch-drone-1', kind: 'drone', ...feet(84, 16), patrol: 50 },
      { id: 'sch-note-1', kind: 'note', ...feet(100), patrol: 30 },
      { id: 'sch-slime-2', kind: 'slime', ...feet(112), patrol: 28 },
    ],
    shards: [
      { id: 'sch-s1', ...feet(14, 16), amount: 3 },
      { id: 'sch-s2', ...feet(68, 15), amount: 3 },
      { id: 'sch-s3', ...feet(94, 16), amount: 3 },
    ],
    hearts: [{ id: 'sch-h1', ...feet(48) }],
    checkpoints: [
      { id: 'sch-cp1', ...feet(8) },
      { id: 'sch-cp2', ...feet(104) },
    ],
    interacts: [],
    exit: { ...feet(160), to: 'clock' },
    boss: { id: 'bug', ...feet(146), trigger: 132, arena: { x: 128, y: 0, w: 40, h: 23 } },
    steps: [],
    gates: [],
    echoes: [],
    decors: [
      { x: 20 * T, y: 14 * T, blink: false, tint: 0xf4a4c4 },
      { x: 80 * T, y: 12 * T, blink: false, tint: 0xf4a4c4 },
      { x: 110 * T, y: 13 * T, blink: false, tint: 0xffffff },
    ],
    playerStart: feet(4),
  };
}

function clock() {
  const solids = [
    solid(0, FLOOR, 24, 3, 'metal'),
    solid(44, FLOOR, 28, 3, 'metal'),
    solid(86, FLOOR, 54, 3, 'metal'),
    solid(0, 0, 2, FLOOR, 'metal'),
    solid(138, 0, 2, FLOOR, 'metal'),
  ];
  return {
    id: 'clock',
    scene: 'ClockScene',
    name: 'CLOCK SECTOR',
    theme: 'clock',
    music: 'clock',
    width: 140,
    height: 23,
    solids,
    platforms: [{ x: 48, y: 16, w: 4, skin: 'plat_metal' }],
    timers: [
      { x: 26, y: 20, w: 4, on: 1800, off: 900, phase: 0 },
      { x: 32, y: 20, w: 4, on: 1800, off: 900, phase: 700 },
      { x: 38, y: 20, w: 4, on: 1800, off: 900, phase: 1400 },
    ],
    movers: [{ x: 74, y: 17, w: 4, axis: 'x', range: 48, period: 2600 }],
    hazards: [],
    enemies: [
      { id: 'clk-drone', kind: 'drone', ...feet(50, 14), patrol: 40 },
      { id: 'clk-gob', kind: 'goblin', ...feet(60), patrol: 30, armored: false },
      { id: 'clk-armor', kind: 'goblin', ...feet(96), patrol: 20, armored: true },
      { id: 'clk-note', kind: 'note', ...feet(108), patrol: 24 },
    ],
    shards: [
      { id: 'clk-s1', ...feet(50, 16), amount: 3 },
      { id: 'clk-s2', ...feet(90), amount: 3 },
    ],
    hearts: [{ id: 'clk-h', ...feet(20) }],
    checkpoints: [
      { id: 'clk-cp1', ...feet(8) },
      { id: 'clk-cp2', ...feet(100) },
    ],
    interacts: [],
    exit: { ...feet(132), to: 'overheat' },
    boss: { id: 'deadline', ...feet(124), trigger: 114, arena: { x: 110, y: 0, w: 30, h: 23 } },
    steps: [],
    gates: [],
    echoes: [],
    decors: [
      { x: 16 * T, y: 12 * T, blink: true, tint: 0x39ff88 },
      { x: 70 * T, y: 11 * T, blink: true, tint: 0x39ff88 },
    ],
    playerStart: feet(4),
  };
}

function overheat() {
  const S = (x, w, skin) => solid(x, FLOOR, w, 3, skin, skin === 'heat' ? { hurt: 'heat' } : {});
  const solids = [
    S(0, 16, 'metal'),
    S(16, 8, 'heat'),
    S(24, 8, 'metal'),
    S(32, 10, 'heat'),
    S(42, 10, 'metal'),
    S(52, 8, 'heat'),
    S(60, 80, 'metal'),
    solid(0, 0, 2, FLOOR, 'metal'),
    solid(138, 0, 2, FLOOR, 'metal'),
  ];
  return {
    id: 'overheat',
    scene: 'OverheatScene',
    name: 'OVERHEAT SECTOR',
    theme: 'overheat',
    music: 'overheat',
    width: 140,
    height: 23,
    solids,
    platforms: [
      { x: 18, y: 16, w: 4, skin: 'plat_metal' },
      { x: 34, y: 15, w: 4, skin: 'plat_metal' },
      { x: 54, y: 16, w: 4, skin: 'plat_metal' },
    ],
    timers: [],
    movers: [],
    hazards: [],
    enemies: [
      { id: 'hot-slime', kind: 'slime', ...feet(28, 16), patrol: 16 },
      { id: 'hot-gob', kind: 'goblin', ...feet(66), patrol: 30 },
      { id: 'hot-drone', kind: 'drone', ...feet(78, 15), patrol: 36 },
      { id: 'hot-note', kind: 'note', ...feet(90), patrol: 24 },
    ],
    shards: [
      { id: 'hot-s1', ...feet(36, 15), amount: 3 },
      { id: 'hot-s2', ...feet(84), amount: 3 },
    ],
    hearts: [{ id: 'hot-h', ...feet(46) }],
    checkpoints: [
      { id: 'hot-cp1', ...feet(6) },
      { id: 'hot-cp2', ...feet(96) },
    ],
    interacts: [],
    exit: { ...feet(132), to: 'mirror' },
    boss: { id: 'burnout', ...feet(124), trigger: 112, arena: { x: 108, y: 0, w: 32, h: 23 } },
    steps: [],
    gates: [],
    echoes: [],
    decors: [{ x: 40 * T, y: 12 * T, blink: true, tint: 0xff7a32 }],
    playerStart: feet(4),
  };
}

function mirror() {
  const solids = [
    solid(0, FLOOR, 22, 3, 'metal'),
    solid(28, FLOOR, 18, 3, 'metal'),
    solid(52, FLOOR, 78, 3, 'metal'),
    solid(0, 0, 2, FLOOR, 'metal'),
    solid(128, 0, 2, FLOOR, 'metal'),
  ];
  return {
    id: 'mirror',
    scene: 'MirrorScene',
    name: 'MIRROR SECTOR',
    theme: 'mirror',
    music: 'mirror',
    width: 130,
    height: 23,
    solids,
    platforms: [
      { x: 24, y: 16, w: 3, skin: 'plat_metal' },
      { x: 34, y: 16, w: 4, skin: 'plat_metal' },
      { x: 46, y: 15, w: 4, skin: 'plat_metal' },
    ],
    timers: [],
    movers: [{ x: 60, y: 16, w: 3, axis: 'y', range: 36, period: 2200 }],
    hazards: [],
    enemies: [
      { id: 'mir-note', kind: 'note', ...feet(32), patrol: 20 },
      { id: 'mir-drone', kind: 'drone', ...feet(70, 15), patrol: 40 },
      { id: 'mir-gob', kind: 'goblin', ...feet(82), patrol: 24 },
    ],
    shards: [
      { id: 'mir-s1', ...feet(46, 15), amount: 3 },
      { id: 'mir-s2', ...feet(74), amount: 3 },
    ],
    hearts: [],
    checkpoints: [
      { id: 'mir-cp1', ...feet(6) },
      { id: 'mir-cp2', ...feet(88) },
    ],
    interacts: [],
    exit: { ...feet(122), to: 'core' },
    boss: { id: 'imposter', ...feet(114), trigger: 100, arena: { x: 96, y: 0, w: 34, h: 23 } },
    steps: [],
    gates: [],
    echoes: [
      { x: 16 * T, interval: 2600, phase: 0 },
      { x: 40 * T, interval: 2600, phase: 900 },
    ],
    decors: [{ x: 20 * T, y: 12 * T, blink: true, tint: 0xc084ff }],
    playerStart: feet(4),
  };
}

function core() {
  const solids = [
    solid(0, 18, 6, 5, 'core'),
    solid(108, FLOOR, 36, 3, 'core'),
    solid(0, 0, 2, 23, 'core'),
    solid(142, 0, 2, 23, 'core'),
  ];
  const plats = [];
  const spots = [10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98];
  spots.forEach((x, i) => plats.push({ x, y: i % 2 === 0 ? 18 : 15, w: 4, skin: 'plat_core' }));
  return {
    id: 'core',
    scene: 'FinalScene',
    name: 'COMPILE CORE',
    theme: 'core',
    music: 'core',
    width: 144,
    height: 23,
    solids,
    platforms: plats,
    timers: [],
    movers: [{ x: 46, y: 16, w: 3, axis: 'x', range: 28, period: 2000 }],
    hazards: [],
    enemies: [
      { id: 'core-drone', kind: 'drone', ...feet(20, 15), patrol: 30 },
      { id: 'core-note', kind: 'note', ...feet(52, 15), patrol: 16 },
      { id: 'core-gob', kind: 'goblin', ...feet(74, 18), patrol: 16 },
      { id: 'core-slime', kind: 'slime', ...feet(90, 18), patrol: 16 },
    ],
    shards: [
      { id: 'core-s1', ...feet(26, 18), amount: 3 },
      { id: 'core-s2', ...feet(66, 15), amount: 3 },
      { id: 'core-s3', ...feet(98, 15), amount: 3 },
    ],
    hearts: [{ id: 'core-h', ...feet(34, 15) }],
    checkpoints: [
      { id: 'core-cp1', ...feet(2, 18) },
      { id: 'core-cp2', ...feet(98, 15) },
    ],
    interacts: [],
    exit: { ...feet(136), to: 'bedroom' },
    boss: { id: 'complexity', ...feet(124), trigger: 112, arena: { x: 108, y: 0, w: 36, h: 23 } },
    steps: [],
    gates: [],
    echoes: [],
    decors: [
      { x: 30 * T, y: 8 * T, blink: true, tint: 0x7af0ff },
      { x: 70 * T, y: 7 * T, blink: true, tint: 0xff5fa8 },
    ],
    playerStart: feet(3, 18),
  };
}

export const LEVELS = {
  bedroom: bedroom(),
  tutorial: tutorial(),
  school: school(),
  clock: clock(),
  overheat: overheat(),
  mirror: mirror(),
  core: core(),
};

export const LEVEL_ORDER = ['bedroom', 'tutorial', 'school', 'clock', 'overheat', 'mirror', 'core'];
