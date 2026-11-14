import { AudioManager } from './AudioManager.js';
import { SaveSystem } from './SaveSystem.js';
import { gameBus } from './GameEvents.js';

export const CheckpointSystem = {
  activate(levelId, x, y) {
    SaveSystem.setCheckpoint(levelId, x, y);
    SaveSystem.update((data) => {
      data.matchaReady = true;
    });
    AudioManager.play('checkpoint');
    gameBus.emit('toast', 'CHECKPOINT');
    gameBus.emit('save-changed', SaveSystem.load());
  },
};
