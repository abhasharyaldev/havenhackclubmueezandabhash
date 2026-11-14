import { LEVELS } from '../src/game/data/levels.js';

const ids = Object.keys(LEVELS);
let failed = 0;
for (const id of ids) {
  const level = LEVELS[id];
  const problems = [];
  if (level.id !== id) problems.push('id mismatch');
  if (!level.playerStart) problems.push('missing start');
  if (!level.solids?.length) problems.push('no solids');
  if (!level.scene) problems.push('no scene');
  if (level.boss && !level.exit) problems.push('boss without exit');
  if (level.boss && !level.checkpoints?.length && id !== 'bedroom') problems.push('no checkpoint');
  const startTile = Math.floor(level.playerStart.x / 16);
  const covered = level.solids.some((s) => startTile >= s.x && startTile < s.x + s.w && level.playerStart.y / 16 >= s.y && level.playerStart.y / 16 <= s.y + 1);
  if (!covered && id !== 'core') problems.push('start not on a solid top');
  if (problems.length) {
    failed += 1;
    console.error(id, problems.join(', '));
  } else {
    console.log('ok', id, `${level.width}x${level.height}`, `enemies:${level.enemies.length}`, level.boss?.id || 'hub');
  }
}
if (failed) process.exit(1);
