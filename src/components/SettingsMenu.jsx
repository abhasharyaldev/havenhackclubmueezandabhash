export default function SettingsMenu({ settings, onChange, onBack }) {
  const set = (patch) => onChange({ ...settings, ...patch });
  return (
    <div className="overlay">
      <div className="panel narrow">
        <h2 className="logo">SETTINGS</h2>
        <div className="stack">
          <label className="row">MASTER <input className="slider" type="range" min="0" max="1" step="0.05" value={settings.master} onChange={(e) => set({ master: Number(e.target.value) })} /></label>
          <label className="row">MUSIC <input className="slider" type="range" min="0" max="1" step="0.05" value={settings.music} onChange={(e) => set({ music: Number(e.target.value) })} /></label>
          <label className="row">EFFECTS <input className="slider" type="range" min="0" max="1" step="0.05" value={settings.sfx} onChange={(e) => set({ sfx: Number(e.target.value) })} /></label>
          <label className="row">SHAKE <input className="slider" type="range" min="0" max="1" step="0.25" value={settings.shake} onChange={(e) => set({ shake: Number(e.target.value) })} /></label>
          <label className="check"><input type="checkbox" checked={!!settings.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.checked })} /> REDUCED MOTION</label>
          <label className="check"><input type="checkbox" checked={!!settings.fullscreen} onChange={(e) => set({ fullscreen: e.target.checked })} /> FULLSCREEN</label>
          <button className="pixel-btn" onClick={onBack}>BACK</button>
        </div>
      </div>
    </div>
  );
}
