import { useEffect, useRef, useState } from 'react';
import ControlsMenu from './components/ControlsMenu.jsx';
import GameHUD from './components/GameHUD.jsx';
import MainMenu from './components/MainMenu.jsx';
import PauseMenu from './components/PauseMenu.jsx';
import SettingsMenu from './components/SettingsMenu.jsx';
import UpgradeMenu from './components/UpgradeMenu.jsx';
import VictoryScreen from './components/VictoryScreen.jsx';
import { createPhaserGame } from './game/createGame.js';
import { AudioManager } from './game/systems/AudioManager.js';
import { gameBus } from './game/systems/GameEvents.js';
import { SaveSystem } from './game/systems/SaveSystem.js';

export default function App() {
  const hostRef = useRef(null);
  const screenRef = useRef('boot');
  const backRef = useRef('menu');
  const [screen, setScreen] = useState('boot');
  const [back, setBack] = useState('menu');
  const [hud, setHud] = useState(null);
  const [save, setSave] = useState(() => SaveSystem.load());
  const [settings, setSettings] = useState(() => SaveSystem.loadSettings());
  const [toast, setToast] = useState('');
  const [intro, setIntro] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    backRef.current = back;
  }, [back]);

  useEffect(() => {
    const game = createPhaserGame(hostRef.current);
    const off = [
      gameBus.on('ready', () => {
        if (screenRef.current === 'boot') setScreen('menu');
        AudioManager.music('menu');
      }),
      gameBus.on('boot-error', (msg) => setError(msg)),
      gameBus.on('hud', setHud),
      gameBus.on('save-changed', setSave),
      gameBus.on('toast', (text) => {
        setToast(text);
        window.setTimeout(() => setToast(''), 1200);
      }),
      gameBus.on('boss-intro', (data) => {
        setIntro(data);
        window.setTimeout(() => setIntro(null), 1700);
      }),
      gameBus.on('player-defeated', () => {
        setSave(SaveSystem.load());
        setScreen('retry');
      }),
      gameBus.on('victory', () => setScreen('victory')),
      gameBus.on('open-upgrades', () => {
        setSave(SaveSystem.load());
        setBack('playing');
        setScreen('upgrades');
        gameBus.emit('cmd:pause');
      }),
    ];
    const onKey = (event) => {
      if (event.key === 'Tab') event.preventDefault();
      if (event.code === 'Space') event.preventDefault();
      const current = screenRef.current;
      if (event.key === 'Escape') {
        if (current === 'playing') {
          setBack('playing');
          setScreen('pause');
          gameBus.emit('cmd:pause');
        } else if (current === 'pause') {
          setScreen('playing');
          gameBus.emit('cmd:resume');
        } else if (current === 'controls' || current === 'settings' || current === 'upgrades' || current === 'credits') {
          const dest = backRef.current;
          setScreen(dest);
          if (dest === 'playing') gameBus.emit('cmd:resume');
        }
      }
      if (event.key === 'Tab' && current === 'playing') {
        setSave(SaveSystem.load());
        setBack('playing');
        setScreen('upgrades');
        gameBus.emit('cmd:pause');
      }
    };
    window.addEventListener('keydown', onKey);
    const unlock = () => AudioManager.unlock();
    window.addEventListener('pointerdown', unlock);
    return () => {
      off.forEach((fn) => fn());
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', unlock);
      game.destroy(true);
    };
  }, []);

  const go = (next, from = screen) => {
    setBack(from);
    setScreen(next);
    AudioManager.play('ui');
  };

  const startNew = () => {
    AudioManager.unlock();
    const data = SaveSystem.newGame();
    setSave(data);
    setScreen('playing');
    gameBus.emit('cmd:start-level', { levelId: 'bedroom' });
  };

  const continueGame = () => {
    const data = SaveSystem.load();
    if (!data) return;
    setSave(data);
    setScreen('playing');
    gameBus.emit('cmd:start-level', { levelId: data.currentLevel, spawn: data.checkpoints?.[data.currentLevel] });
  };

  const buy = (id) => {
    const result = SaveSystem.tryBuy(id);
    if (!result.ok) {
      AudioManager.play('deny');
      return;
    }
    AudioManager.play('upgrade');
    setSave(result.data);
    gameBus.emit('save-changed', result.data);
  };

  const playing = screen === 'playing' || screen === 'pause' || screen === 'retry' || screen === 'upgrades' || screen === 'victory';

  return (
    <div className="shell">
      <div className="stage">
        <div className="phaser-host" ref={hostRef} />
        {playing && <GameHUD hud={hud} intro={intro} />}
        {screen === 'boot' && <div className="overlay"><div className="panel narrow"><h1 className="logo">BOUNCE//BACK</h1><p className="sub">{error || 'LOADING'}</p></div></div>}
        {screen === 'menu' && (
          <MainMenu
            hasSave={!!save}
            onNew={startNew}
            onContinue={continueGame}
            onHow={() => go('controls', 'menu')}
            onSettings={() => go('settings', 'menu')}
            onCredits={() => go('credits', 'menu')}
          />
        )}
        {screen === 'pause' && (
          <PauseMenu
            onResume={() => { setScreen('playing'); gameBus.emit('cmd:resume'); }}
            onControls={() => go('controls', 'pause')}
            onOptions={() => go('settings', 'pause')}
            onRestart={() => { setScreen('playing'); gameBus.emit('cmd:respawn'); }}
            onQuit={() => { setScreen('menu'); setHud(null); gameBus.emit('cmd:menu'); }}
          />
        )}
        {screen === 'controls' && <ControlsMenu onBack={() => { setScreen(back); if (back === 'playing') gameBus.emit('cmd:resume'); }} />}
        {screen === 'settings' && (
          <SettingsMenu
            settings={settings}
            onChange={(next) => { setSettings(next); gameBus.emit('cmd:settings', next); }}
            onBack={() => { setScreen(back); if (back === 'playing') gameBus.emit('cmd:resume'); }}
          />
        )}
        {screen === 'upgrades' && (
          <UpgradeMenu
            save={save}
            onBuy={buy}
            onClose={() => { setScreen('playing'); gameBus.emit('cmd:resume'); }}
          />
        )}
        {screen === 'retry' && (
          <UpgradeMenu
            save={save}
            title="RETRY"
            onBuy={buy}
            onClose={() => { setScreen('playing'); gameBus.emit('cmd:respawn'); }}
          />
        )}
        {screen === 'victory' && (
          <VictoryScreen
            onWake={() => setScreen('playing')}
            onMenu={() => { setScreen('menu'); setHud(null); gameBus.emit('cmd:menu'); }}
          />
        )}
        {screen === 'credits' && (
          <div className="overlay">
            <div className="panel narrow">
              <h2 className="logo">CREDITS</h2>
              <p className="sub">BOUNCE//BACK is an original game made with React and Phaser. Pixel sprites are generated in-engine. Sound is synthesized in the browser. No commercial game assets are used.</p>
              <div className="menu-list"><button className="pixel-btn" onClick={() => setScreen(back)}>BACK</button></div>
            </div>
          </div>
        )}
        {toast && screen === 'playing' && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
