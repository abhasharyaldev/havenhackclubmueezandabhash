import Phaser from 'phaser';
import { DEBUG, GAME_HEIGHT, GAME_WIDTH } from './config.js';
import { LEVELS } from './data/levels.js';
import { BootScene } from './scenes/BootScene.js';
import { ClockScene } from './scenes/ClockScene.js';
import { FinalScene } from './scenes/FinalScene.js';
import { HubScene } from './scenes/HubScene.js';
import { MirrorScene } from './scenes/MirrorScene.js';
import { OverheatScene } from './scenes/OverheatScene.js';
import { SchoolScene } from './scenes/SchoolScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { AudioManager } from './systems/AudioManager.js';
import { gameBus } from './systems/GameEvents.js';
import { SaveSystem } from './systems/SaveSystem.js';

function activeLevel(game) {
  return game.scene.getScenes(true).find((scene) => scene.scene.key !== 'BootScene');
}

function startLevel(game, { levelId, spawn }) {
  const level = LEVELS[levelId];
  if (!level) return;
  game.registry.set('currentLevel', levelId);
  const running = game.scene.getScenes(true).map((scene) => scene.scene.key);
  running.forEach((key) => game.scene.stop(key));
  game.scene.start(level.scene, { spawn: spawn || null });
}

export function createPhaserGame(parent) {
  const settings = SaveSystem.loadSettings();
  AudioManager.apply(settings);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    banner: false,
    backgroundColor: '#120e16',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1500 },
        debug: DEBUG,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: { pixelArt: true, antialias: false, roundPixels: true },
    fps: { target: 60 },
    scene: [BootScene, HubScene, TutorialScene, SchoolScene, ClockScene, OverheatScene, MirrorScene, FinalScene],
  });
  game.registry.set('settings', settings);
  if (import.meta.env.DEV) {
    window.__BOUNCE = game;
    window.__bus = gameBus;
  }

  const onStart = (data) => startLevel(game, data || { levelId: 'bedroom' });
  const onPause = () => activeLevel(game)?.scene.pause();
  const onResume = () => activeLevel(game)?.scene.resume();
  const onRespawn = () => {
    const levelId = game.registry.get('currentLevel') || SaveSystem.load()?.currentLevel || 'bedroom';
    startLevel(game, { levelId, spawn: SaveSystem.getCheckpoint(levelId) });
  };
  const onMenu = () => {
    game.scene.getScenes(true).forEach((scene) => {
      if (scene.scene.key !== 'BootScene') game.scene.stop(scene.scene.key);
    });
    if (!game.scene.isActive('BootScene')) game.scene.start('BootScene');
    AudioManager.music('menu');
  };
  const onSettings = (next) => {
    const saved = SaveSystem.saveSettings(next);
    game.registry.set('settings', saved);
    AudioManager.apply(saved);
    if (saved.fullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen?.();
    if (!saved.fullscreen && document.fullscreenElement) document.exitFullscreen?.();
  };

  gameBus.on('cmd:start-level', onStart);
  gameBus.on('cmd:pause', onPause);
  gameBus.on('cmd:resume', onResume);
  gameBus.on('cmd:respawn', onRespawn);
  gameBus.on('cmd:menu', onMenu);
  gameBus.on('cmd:settings', onSettings);
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    gameBus.off('cmd:start-level', onStart);
    gameBus.off('cmd:pause', onPause);
    gameBus.off('cmd:resume', onResume);
    gameBus.off('cmd:respawn', onRespawn);
    gameBus.off('cmd:menu', onMenu);
    gameBus.off('cmd:settings', onSettings);
    AudioManager.stopMusic();
  });
  return game;
}
