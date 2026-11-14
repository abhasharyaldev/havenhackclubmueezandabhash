import { CONTROLS } from '../game/data/controls.js';

export default function ControlsMenu({ onBack }) {
  return (
    <div className="overlay">
      <div className="panel">
        <h2 className="logo">CONTROLS</h2>
        <div className="scroll">
          {CONTROLS.map((row) => (
            <div className="row" key={row.action}>
              <span className="keycaps">
                {row.keys.map((key) => <span className="keycap" key={key}>{key}</span>)}
                {row.alt?.map((key) => <span className="keycap" key={key}>{key}</span>)}
              </span>
              <span>{row.action}</span>
            </div>
          ))}
        </div>
        <div className="menu-list">
          <button className="pixel-btn" onClick={onBack}>BACK</button>
        </div>
      </div>
    </div>
  );
}
