# BOUNCE//BACK development progress

Status after the browser playtest session (headless Chrome, real DOM keyboard events, Phaser 3.90).

## Verified in the browser
- Clock Sector boots and the loop runs (frame counter advances, player lands, moves). The earlier "stall" was a harness artifact.
- Movement: held jump 59px / tapped 32px (jump cut), ground dash + cooldown, one air dash per jump, coyote jump 100ms after leaving a ledge, buffered jump fires on landing.
- Combat: light combo chains light1→light2→light3, heavy deals 3, parry staggers and sets parryok, hit-stop freezes 64ms and releases.
- Tutorial: all nine steps completed with keys, then the exit door into School.
- Bosses defeated by a scripted keyboard player: The Bug (12s), The Deadline (17s), The Complexity (all three phases, 86s). Burnout and Imposter were each fought to 1 HP by the bot (fights run cleanly; losses were bot skill).
- Progression: death → RETRY screen → buy Overclock (speed 165→178, fragments spent) → RESPAWN with working controls; CONTINUE after a page reload; locked hub doors stay locked; exit opens on boss defeat.
- Ending: leaving Compile Core after Complexity returns to the bedroom and shows RESTORED.
- Audio: every SFX and music key runs without errors (not listened to by ear).
- `npm run build` succeeds after all fixes.

## Bugs fixed this session
1. Keys died after any scene restart (respawn, retry, warp): Phaser destroys Key objects on shutdown; keys are now rebuilt in create().
2. Attacks never triggered from the keyboard: the locomotion state machine overwrote `state='attack'` in the same frame.
3. Attack hitboxes sat at shoulder height and could not reach slimes/goblins; lowered and extended.
4. Parry/parryok never exited (timer reset before the exit check) — player was soft-locked until hit. Exits on frame count now.
5. Every projectile was frozen in place: `resolveCombat` snapped projectile bodies back to the stale sprite position each frame.
6. Approaching any door crashed the update loop (`label` Image passed as prompt text).
7. Tutorial exit was LOCKED because unlock happened only on travel; level exits are now always usable once enabled.
8. Hit-stop was defined in data but never applied; implemented (physics pause for the attack's hitstop ms).
9. Complexity hovered out of sword reach; it now sinks to hittable height while exposed/staggered.
10. Ground enemies ignored their patrol range; clamped.
11. Coyote (130ms) and jump buffer (150ms) widened; first airborne frame no longer eats the coyote window.
12. Arena seal nudges the player inside if they overlap the seal column; per-run scene state reset in init().
13. Doors drawn at 2x with a pulsing glow so they read against backgrounds.

## Still open
- Sprites are original procedural placeholders. The concept sheets in `assets/` are reference art, not atlases; authored frames would need a real atlas pipeline.
- Audio has not been listened to by a human.
- Burnout/Imposter were not beaten by the bot (both reached 1 HP); a human playtest should confirm the difficulty curve.
