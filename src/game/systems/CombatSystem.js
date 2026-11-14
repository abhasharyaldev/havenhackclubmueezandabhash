export function syncBody(obj) {
  if (obj?.body?.updateFromGameObject) obj.body.updateFromGameObject();
}

export function makeThreat(scene, w, h) {
  const zone = scene.add.zone(-1000, -1000, w, h);
  scene.physics.add.existing(zone);
  zone.body.setAllowGravity(false);
  zone.body.setImmovable(true);
  zone.body.moves = false;
  zone.activeHit = false;
  zone.damage = 1;
  zone.owner = null;
  scene.threats.push(zone);
  return zone;
}

export function spawnProjectile(scene, x, y, vx, vy, texture, opts = {}) {
  const proj = scene.physics.add.sprite(x, y, texture);
  proj.setDepth(8);
  proj.body.setAllowGravity(!!opts.gravity);
  proj.body.setVelocity(vx, vy);
  proj.damage = opts.damage ?? 1;
  proj.owner = opts.owner ?? null;
  proj.life = opts.life ?? 2200;
  proj.activeHit = true;
  proj.isProjectile = true;
  proj.friendly = !!opts.friendly;
  proj.setSize(opts.w || 8, opts.h || 8);
  scene.projectiles.push(proj);
  if (proj.friendly) scene.playerShots.push(proj);
  else scene.threats.push(proj);
  return proj;
}

export function resolveCombat(scene) {
  const player = scene.player;
  if (!player?.body) return;

  player.syncAttackZone();
  syncBody(player.attackZone);

  for (const threat of scene.threats) {
    if (!threat.active || threat.body == null) continue;
    // Zones are positioned by hand each frame, so pull the body to them.
    // Projectiles are moved by physics; snapping their body back to the
    // (not yet post-updated) sprite position would freeze them in place.
    if (!threat.isProjectile) syncBody(threat);
  }

  if (player.attackLive && player.attackZone.body) {
    scene.physics.overlap(player.attackZone, scene.foes, (_zone, foe) => {
      foe.takeHit?.(player.getAttackInfo());
    });
  }

  if (scene.playerShots?.length) {
    scene.physics.overlap(scene.playerShots, scene.foes, (shot, foe) => {
      if (!shot.active || shot.spent) return;
      shot.spent = true;
      foe.takeHit?.({
        damage: shot.damage || 1,
        armor: false,
        facing: Math.sign(shot.body?.velocity.x || 1),
        token: `shot-${shot.x}-${shot.y}`,
        kb: 90,
        fromX: shot.x,
      });
      shot.destroy();
    });
  }

  scene.physics.overlap(player, scene.threats, (_player, threat) => {
    if (!threat.activeHit || !threat.active) return;
    const result = player.receiveHit(threat.damage || 1, threat.x, threat);
    if (result === 'parry' && threat.isProjectile) threat.destroy();
  });

  scene.physics.overlap(player, scene.hazards, (_player, hazard) => {
    if (!hazard.active) return;
    if (player.hazardLock > 0) return;
    const fromX = hazard.x + (player.x < hazard.x ? 20 : -20);
    const result = player.receiveHit(1, fromX, null);
    if (result === 'hurt' || result === 'block') player.hazardLock = 700;
  });
}

export function ageProjectiles(scene, dt) {
  for (const proj of [...scene.projectiles]) {
    if (!proj.active) continue;
    proj.life -= dt;
    const bounds = scene.levelBounds;
    const outside = proj.x < bounds.x - 40 || proj.x > bounds.right + 40 || proj.y > bounds.bottom + 80 || proj.y < bounds.y - 80;
    if (proj.life <= 0 || outside) {
      proj.activeHit = false;
      proj.destroy();
    }
  }
  scene.projectiles = scene.projectiles.filter((p) => p.active);
  scene.threats = scene.threats.filter((t) => t.active);
}
