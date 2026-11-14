import { SAVE_KEY, SAVE_VERSION, SETTINGS_KEY } from '../config.js';
import { UPGRADES } from '../data/upgrades.js';
import { isUnlocked, nextCost } from './UpgradeSystem.js';

export const DEFAULT_SETTINGS = {
  master: 0.8,
  music: 0.45,
  sfx: 0.85,
  shake: 1,
  reducedMotion: false,
  fullscreen: false,
};

function freshSave() {
  return {
    version: SAVE_VERSION,
    currentLevel: 'bedroom',
    checkpoints: {},
    fragments: 0,
    upgrades: {},
    bosses: [],
    unlocked: ['bedroom', 'tutorial'],
    collected: [],
    defeatedOnce: [],
    awards: [],
    tutorialDone: false,
    seenEnding: false,
    tutorialSteps: [],
  };
}

function normalize(raw) {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  if (raw.version !== SAVE_VERSION) return base;
  return {
    ...base,
    ...raw,
    checkpoints: { ...base.checkpoints, ...(raw.checkpoints || {}) },
    upgrades: { ...base.upgrades, ...(raw.upgrades || {}) },
    bosses: Array.isArray(raw.bosses) ? raw.bosses : [],
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked : base.unlocked,
    collected: Array.isArray(raw.collected) ? raw.collected : [],
    defeatedOnce: Array.isArray(raw.defeatedOnce) ? raw.defeatedOnce : [],
    awards: Array.isArray(raw.awards) ? raw.awards : [],
    tutorialSteps: Array.isArray(raw.tutorialSteps) ? raw.tutorialSteps : [],
  };
}

export const SaveSystem = {
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  hasSave() {
    return !!this.load();
  },
  write(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  },
  newGame() {
    const data = freshSave();
    this.write(data);
    return data;
  },
  update(mutator) {
    const data = this.load() || freshSave();
    mutator(data);
    this.write(data);
    return data;
  },
  addFragments(amount, reasonId) {
    return this.update((data) => {
      if (reasonId) {
        if (data.awards.includes(reasonId)) return;
        data.awards.push(reasonId);
      }
      data.fragments += amount;
    });
  },
  collect(id, amount) {
    return this.update((data) => {
      if (data.collected.includes(id)) return;
      data.collected.push(id);
      data.fragments += amount;
    });
  },
  markEnemyDrop(id, amount) {
    return this.update((data) => {
      if (data.defeatedOnce.includes(id)) return;
      data.defeatedOnce.push(id);
      data.fragments += amount;
    });
  },
  alreadyDropped(id) {
    const data = this.load();
    return !!data?.defeatedOnce?.includes(id);
  },
  alreadyCollected(id) {
    const data = this.load();
    return !!data?.collected?.includes(id);
  },
  setCheckpoint(levelId, x, y) {
    return this.update((data) => {
      data.checkpoints[levelId] = { x: Math.round(x), y: Math.round(y) };
      data.currentLevel = levelId;
    });
  },
  getCheckpoint(levelId) {
    return this.load()?.checkpoints?.[levelId] || null;
  },
  markBoss(id) {
    return this.update((data) => {
      if (!data.bosses.includes(id)) data.bosses.push(id);
    });
  },
  bossDead(id) {
    return !!this.load()?.bosses?.includes(id);
  },
  unlock(levelId) {
    return this.update((data) => {
      if (!data.unlocked.includes(levelId)) data.unlocked.push(levelId);
    });
  },
  isUnlocked(levelId) {
    const data = this.load();
    if (!data) return levelId === 'bedroom' || levelId === 'tutorial';
    return data.unlocked.includes(levelId);
  },
  setFlag(key, value) {
    return this.update((data) => {
      data[key] = value;
    });
  },
  markTutorialStep(step) {
    return this.update((data) => {
      if (!data.tutorialSteps.includes(step)) data.tutorialSteps.push(step);
    });
  },
  tryBuy(id) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return { ok: false, reason: 'unknown' };
    const data = this.load() || freshSave();
    if (!isUnlocked(def, data)) return { ok: false, reason: 'locked' };
    const rank = data.upgrades[id] || 0;
    if (rank >= def.max) return { ok: false, reason: 'max' };
    const cost = nextCost(def, rank);
    if (data.fragments < cost) return { ok: false, reason: 'cost' };
    data.fragments -= cost;
    data.upgrades[id] = rank + 1;
    this.write(data);
    return { ok: true, data, rank: rank + 1 };
  },
  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },
  saveSettings(settings) {
    const next = { ...DEFAULT_SETTINGS, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    return next;
  },
};
