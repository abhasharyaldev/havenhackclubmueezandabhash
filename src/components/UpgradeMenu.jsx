import { UPGRADES } from '../game/data/upgrades.js';
import { isUnlocked, nextCost } from '../game/systems/UpgradeSystem.js';

export default function UpgradeMenu({ save, title = 'UPGRADES', onBuy, onClose }) {
  const fragments = save?.fragments || 0;
  return (
    <div className="overlay">
      <div className="panel">
        <h2 className="logo">{title}</h2>
        <p className="sub">FRAGMENTS {fragments}</p>
        <div className="cards">
          {UPGRADES.map((def) => {
            const rank = save?.upgrades?.[def.id] || 0;
            const unlocked = isUnlocked(def, save || { bosses: [] });
            const cost = nextCost(def, rank);
            const maxed = rank >= def.max;
            const afford = cost != null && fragments >= cost;
            return (
              <button className="card" key={def.id} disabled={!unlocked || maxed || !afford} onClick={() => onBuy(def.id)}>
                <strong>{def.name} {rank}/{def.max}</strong>
                <small>{def.desc}</small>
                <small>{!unlocked ? ` CLEAR ${def.unlock.toUpperCase()}` : maxed ? ' MAXED' : ` ${cost} FRAGMENTS`}</small>
              </button>
            );
          })}
        </div>
        <div className="menu-list">
          <button className="pixel-btn green" onClick={onClose}>{title === 'RETRY' ? 'RESPAWN' : 'CLOSE'}</button>
        </div>
      </div>
    </div>
  );
}
