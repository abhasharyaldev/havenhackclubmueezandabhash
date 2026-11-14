# BOUNCE//BACK

A 2D pixel-art action platformer about a burnt-out tech-bro student who fights his way back from a crashed semester, one matcha at a time. Built for Hack Club Haven.

**Play it in the browser:** _itch.io link goes here_

## What it's about

You wake up in your bedroom with a failed compile and five hearts. The way back runs through six sectors — the practice room, the school campus, the Clock Sector, the Overheat Sector, the Mirror Sector, and finally the Compile Core — each guarded by a boss that is a very literal version of something that wrecks a project:

| Boss | What it is |
| --- | --- |
| **The Bug** | Glitch-burst teleporter haunting the campus |
| **The Deadline** | Armoured clock knight with time-slash and delayed strikes |
| **The Burnout** | Smouldering golem that slams, punches, and throws embers |
| **The Imposter** | Your purple shadow: rushes, combos, and clones |
| **The Complexity** | Floating code-core that barrages, pulses, and collapses the arena |

Between fights you collect **fragments** from enemies and shards, spend them at the bedroom **upgrade station** (Double Dash, Code Shield, Air Slash, Matcha Burst, Compile Strike…), save at checkpoints, and parry everything you can. Beat The Complexity and the room goes quiet again.

Combat is built around a three-hit light combo, a slow armour-breaking heavy, a short parry window that staggers whatever you catch, and a dash with coyote time and jump buffering so the platforming stays forgiving.

## Who worked on it

- **Abhash Aryal** — code, design, levels, art direction
- **Mueez** — co-creator (concept art, design)

## Controls

| Action | Keys |
| --- | --- |
| Move | **A / D** or **← / →** |
| Jump (hold for higher) | **Space** |
| Dash / air dash | **Shift** |
| Light attack (combo ×3) | **J** or left mouse |
| Heavy attack (breaks armour) | **K** or right mouse |
| Parry | **Q** or **L** |
| Interact / save / enter door | **E** |
| Matcha burst (heal, once per checkpoint, after upgrade) | **F** |
| Upgrades menu | **Tab** |
| Pause | **Esc** |

Tips: parry a boss's strike to stagger it and deal 1.5× damage; heavy attacks are the only thing that cracks armoured enemies; checkpoints refill hearts, shield, and matcha.

## Run it locally

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
```

- `npm run build` — production build into `dist/`
- `npm run release` — build + zip `dist/` as `bounceback-itch.zip` (index.html at the root, ready for an itch.io HTML upload)
- `npm run preview` — serve the production build
- `npm run validate` — sanity-check level data

In development, keys **1–7** warp to each level and `?debug` turns on physics debug drawing.

## Project structure

- `src/components/` — React menus and HUD
- `src/game/scenes/` — Phaser levels (one `LevelScene` base, a subclass per sector)
- `src/game/entities/` — player, enemies, boss base class
- `src/game/bosses/` — The Bug, Deadline, Burnout, Imposter, Complexity
- `src/game/systems/` — combat, save, checkpoints, upgrades, parallax, audio
- `src/game/art/` — procedural pixel sprites, tiles, backgrounds, effects
- `src/game/data/` — levels, attacks, upgrades, boss stats
- `assets/` — concept sheets (reference art, not sliced into atlases)

See `DEVELOPMENT_PROGRESS.md` for what has been playtested and what is still open.
