import { PHYS } from '../config.js';

export function getModifiers(upgrades = {}) {
  const over = upgrades.overclock || 0;
  const quick = upgrades.quickRecovery || 0;
  const compile = upgrades.compileStrike || 0;
  return {
    speed: PHYS.speed * (1 + 0.08 * over),
    recoveryMul: Math.max(0.55, 1 - 0.22 * quick),
    hurtStun: quick ? 120 : 250,
    airDashes: upgrades.doubleDash ? 2 : 1,
    dashIFrame: upgrades.afterimage ? 145 : 0,
    afterimage: !!upgrades.afterimage,
    counterPulse: !!upgrades.counterPulse,
    airReset: !!upgrades.airReset,
    shield: !!upgrades.codeShield,
    airSlash: !!upgrades.airSlash,
    matcha: !!upgrades.matchaBurst,
    heavyBonus: compile,
  };
}

export function isUnlocked(def, save) {
  if (!def.unlock) return true;
  return (save.bosses || []).includes(def.unlock);
}

export function nextCost(def, rank) {
  if (rank >= def.max) return null;
  return def.cost[Math.min(rank, def.cost.length - 1)];
}
