export default function PauseMenu({ onResume, onControls, onOptions, onRestart, onQuit }) {
  return (
    <div className="overlay">
      <div className="panel narrow">
        <h2 className="logo">PAUSED</h2>
        <div className="menu-list">
          <button className="pixel-btn green" onClick={onResume}>RESUME</button>
          <button className="pixel-btn" onClick={onControls}>CONTROLS</button>
          <button className="pixel-btn" onClick={onOptions}>OPTIONS</button>
          <button className="pixel-btn" onClick={onRestart}>RESTART CHECKPOINT</button>
          <button className="pixel-btn danger" onClick={onQuit}>QUIT TO MENU</button>
        </div>
      </div>
    </div>
  );
}
