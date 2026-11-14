export default function MainMenu({ hasSave, onNew, onContinue, onHow, onSettings, onCredits }) {
  return (
    <div className="overlay">
      <div className="panel">
        <h1 className="logo">BOUNCE//BACK</h1>
        <p className="sub">A corrupted compiler. Five errors. Get back up.</p>
        <div className="menu-list">
          <button className="pixel-btn green" onClick={onNew}>NEW GAME</button>
          <button className="pixel-btn" onClick={onContinue} disabled={!hasSave}>CONTINUE</button>
          <button className="pixel-btn" onClick={onHow}>HOW TO PLAY</button>
          <button className="pixel-btn" onClick={onSettings}>SETTINGS</button>
          <button className="pixel-btn" onClick={onCredits}>CREDITS</button>
        </div>
      </div>
    </div>
  );
}
