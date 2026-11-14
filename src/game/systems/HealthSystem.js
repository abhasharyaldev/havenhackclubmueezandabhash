export function hurtActor(actor, amount, fromX) {
  if (!actor.alive || actor.iFrame > 0) return false;
  actor.hp -= amount;
  actor.iFrame = actor.hurtInvuln ?? 220;
  const dir = Math.sign(actor.x - fromX) || 1;
  if (actor.body) actor.body.setVelocity(dir * (actor.knockResist ? 40 : 130), -120);
  actor.onHurt?.();
  if (actor.hp <= 0) {
    actor.alive = false;
    actor.onDefeat?.();
  }
  return true;
}
