export default function VictoryScreen({ onWake, onMenu }) {
  return (
    <div className="overlay">
      <div className="panel narrow">
        <h2 className="logo">RESTORED</h2>
        <p className="sub">The compile finished. The room is quiet again.</p>
        <div className="menu-list">
          <button className="pixel-btn green" onClick={onWake}>STAY</button>
          <button className="pixel-btn" onClick={onMenu}>TITLE</button>
        </div>
      </div>
    </div>
  );
}
