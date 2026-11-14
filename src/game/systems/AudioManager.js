const SFX = {
  jump: () => blip({ freq: 620, to: 880, dur: 0.08, type: 'square', vol: 0.18 }),
  land: () => blip({ freq: 180, to: 90, dur: 0.06, type: 'triangle', vol: 0.12 }),
  dash: () => blip({ freq: 240, to: 720, dur: 0.12, type: 'square', vol: 0.14 }),
  slash: () => noise({ dur: 0.07, vol: 0.16, hp: 900 }),
  heavy: () => {
    noise({ dur: 0.12, vol: 0.2, hp: 400 });
    blip({ freq: 160, to: 70, dur: 0.14, type: 'sawtooth', vol: 0.08 });
  },
  parry: () => blip({ freq: 980, to: 1320, dur: 0.09, type: 'square', vol: 0.16 }),
  parryOk: () => {
    blip({ freq: 880, to: 1320, dur: 0.08, type: 'square', vol: 0.16 });
    blip({ freq: 1320, to: 1760, dur: 0.1, type: 'square', vol: 0.1, delay: 0.06 });
  },
  hit: () => noise({ dur: 0.05, vol: 0.18, hp: 600 }),
  hurt: () => blip({ freq: 320, to: 90, dur: 0.16, type: 'square', vol: 0.18 }),
  die: () => blip({ freq: 440, to: 60, dur: 0.4, type: 'triangle', vol: 0.2 }),
  checkpoint: () => {
    blip({ freq: 523, to: 523, dur: 0.08, type: 'square', vol: 0.12 });
    blip({ freq: 784, to: 784, dur: 0.12, type: 'square', vol: 0.12, delay: 0.09 });
  },
  pickup: () => blip({ freq: 740, to: 1180, dur: 0.1, type: 'square', vol: 0.12 }),
  upgrade: () => {
    blip({ freq: 523, dur: 0.08, type: 'square', vol: 0.12 });
    blip({ freq: 659, dur: 0.08, type: 'square', vol: 0.12, delay: 0.08 });
    blip({ freq: 880, dur: 0.14, type: 'square', vol: 0.12, delay: 0.16 });
  },
  ui: () => blip({ freq: 660, dur: 0.04, type: 'square', vol: 0.08 }),
  shoot: () => blip({ freq: 420, to: 180, dur: 0.1, type: 'square', vol: 0.1 }),
  boss: () => blip({ freq: 110, to: 55, dur: 0.45, type: 'sawtooth', vol: 0.12 }),
  victory: () => {
    [523, 659, 784, 1046].forEach((f, i) => {
      blip({ freq: f, dur: 0.12, type: 'square', vol: 0.12, delay: i * 0.11 });
    });
  },
  heal: () => blip({ freq: 600, to: 980, dur: 0.16, type: 'triangle', vol: 0.14 }),
  door: () => blip({ freq: 300, to: 520, dur: 0.12, type: 'square', vol: 0.1 }),
  deny: () => blip({ freq: 140, to: 90, dur: 0.1, type: 'square', vol: 0.12 }),
};

const MUSIC = {
  bedroom: [523, 659, 587, 698, 659, 523, 440, 392],
  tutorial: [392, 494, 523, 494, 440, 392, 349, 392],
  school: [523, 659, 784, 659, 698, 784, 880, 784],
  clock: [440, 523, 494, 440, 392, 440, 349, 330],
  overheat: [311, 370, 415, 370, 349, 311, 277, 311],
  mirror: [466, 523, 622, 523, 466, 415, 466, 523],
  core: [392, 466, 523, 622, 587, 523, 466, 392],
  menu: [392, 494, 587, 494, 440, 392, 349, 330],
};

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let settings = { master: 0.8, music: 0.45, sfx: 0.85 };
let musicTimer = null;
let musicStep = 0;
let musicKey = null;

function ensure() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  masterGain = ctx.createGain();
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  applyGains();
  return true;
}

function applyGains() {
  if (!ctx) return;
  masterGain.gain.value = settings.master;
  musicGain.gain.value = settings.music;
  sfxGain.gain.value = settings.sfx;
}

function blip({ freq, to, dur = 0.1, type = 'square', vol = 0.1, delay = 0 }) {
  if (!ensure() || settings.master <= 0 || settings.sfx <= 0) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ dur = 0.08, vol = 0.1, hp = 800 }) {
  if (!ensure() || settings.master <= 0 || settings.sfx <= 0) return;
  const length = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain);
  src.start();
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  musicKey = null;
}

function tickMusic() {
  if (!ctx || !musicKey) return;
  const notes = MUSIC[musicKey];
  if (!notes) return;
  const freq = notes[musicStep % notes.length];
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq / 2;
  g.gain.setValueAtTime(0.05, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.connect(g);
  g.connect(musicGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.24);
  const lead = ctx.createOscillator();
  const lg = ctx.createGain();
  lead.type = 'triangle';
  lead.frequency.value = notes[(musicStep + 2) % notes.length];
  lg.gain.setValueAtTime(0.04, ctx.currentTime);
  lg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  lead.connect(lg);
  lg.connect(musicGain);
  lead.start();
  lead.stop(ctx.currentTime + 0.2);
  musicStep += 1;
}

export const AudioManager = {
  unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
  },
  apply(next) {
    settings = { ...settings, ...next };
    applyGains();
  },
  play(name) {
    this.unlock();
    SFX[name]?.();
  },
  music(key) {
    this.unlock();
    if (key === musicKey) return;
    stopMusic();
    if (!key || !MUSIC[key] || settings.music <= 0) return;
    musicKey = key;
    musicStep = 0;
    tickMusic();
    musicTimer = setInterval(tickMusic, 280);
  },
  stopMusic,
};
