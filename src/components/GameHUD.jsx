export default function GameHUD({ hud, intro }) {
  if (!hud && !intro) return null;
  const hearts = hud ? `${'♥'.repeat(Math.max(0, hud.hp))}${'·'.repeat(Math.max(0, hud.maxHp - hud.hp))}` : '';
  return (
    <>
      {hud && (
        <div className="hud">
          <div className="hud-card">
            <div className="hearts">{hearts}</div>
            <div>DASH {hud.dashes}/{hud.maxDashes}</div>
            <div className="meter"><span style={{ width: `${Math.round((hud.dashRatio || 0) * 100)}%` }} /></div>
            <div>{hud.matcha ? 'MATCHA READY' : 'MATCHA EMPTY'} {hud.shield ? ' SHIELD' : ''}</div>
            <div>FRAG {hud.fragments}</div>
          </div>
          {hud.boss && (
            <div className="hud-card boss-wrap">
              <div>{hud.boss.name} P{hud.boss.phase}</div>
              <div className="boss-bar"><span style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.max) * 100)}%` }} /></div>
            </div>
          )}
        </div>
      )}
      {intro && (
        <div className="intro">
          <div className="hud-card">
            <strong>{intro.name}</strong>
            <div>{intro.subtitle}</div>
          </div>
        </div>
      )}
    </>
  );
}
