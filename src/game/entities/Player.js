import Phaser from 'phaser';
import { HERO_BODY, HERO_ORIGIN } from '../art/hero.js';
import { ATTACKS, PARRY, PARRY_OK } from '../data/attacks.js';
import { PHYS } from '../config.js';
import { textureKey } from '../systems/AnimationSystem.js';
import { getModifiers } from '../systems/UpgradeSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { spawnProjectile } from '../systems/CombatSystem.js';

const PREFIX = 'p';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'p_idle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(HERO_ORIGIN.x, HERO_ORIGIN.y);
    this.body.setSize(HERO_BODY.w, HERO_BODY.h);
    this.body.setOffset(HERO_BODY.ox, HERO_BODY.oy);
    this.body.setMaxVelocity(520, PHYS.maxFall);
    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.refreshUpgrades();
    this.hp = 5;
    this.maxHp = 5;
    this.facing = 1;
    this.alive = true;
    this.reported = false;
    this.state = 'respawn';
    this.pose = 'respawn';
    this.animFrame = 0;
    this.animTimer = 0;
    this.coyote = PHYS.coyote;
    this.jumpBuffer = 0;
    this.jumpHeld = false;
    this.cutJump = false;
    this.onGround = false;
    this.wasGround = false;
    this.airDashes = this.mods.airDashes;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.dashDir = 1;
    this.dashCount = 0;
    this.iFrame = 500;
    this.stun = 0;
    this.attackName = null;
    this.attackLive = false;
    this.swingToken = 0;
    this.attackBuffer = 0;
    this.heavyBuffer = 0;
    this.parryTimer = 0;
    this.counterTimer = 0;
    this.landTimer = 0;
    this.defeatTimer = 0;
    this.shieldUp = this.mods.shield;
    this.matchaReady = this.mods.matcha;
    this.hazardLock = 0;
    this.dustTimer = 0;
    this.wantLight = false;
    this.wantHeavy = false;
    this.attackZone = scene.add.zone(-1000, -1000, 24, 18);
    scene.physics.add.existing(this.attackZone);
    this.attackZone.body.setAllowGravity(false);
    this.attackZone.body.moves = false;
    this.slashFx = scene.add.image(x, y, 'fx_slash_0').setVisible(false).setDepth(11);
    this.shieldFx = scene.add.image(x, y, 'fx_spark_0').setVisible(false).setDepth(12);
    this.playPose('respawn', true);
  }

  refreshUpgrades() {
    const save = SaveSystem.load() || { upgrades: {} };
    this.mods = getModifiers(save.upgrades || {});
    this.shieldUp = !!this.mods.shield;
    if (this.mods.matcha) this.matchaReady = true;
  }

  playPose(pose, force = false) {
    if (!force && this.pose === pose) return;
    this.pose = pose;
    this.animFrame = 0;
    this.animTimer = 0;
    this.setTexture(textureKey(PREFIX, pose, 0));
  }

  get onFloor() {
    return this.body.blocked.down || this.body.touching.down;
  }

  canAct() {
    return this.alive && this.state !== 'defeat' && this.state !== 'respawn' && this.stun <= 0;
  }

  update(_time, delta) {
    const dt = Math.min(34, delta);
    const keys = this.scene.keys;
    this.iFrame -= dt;
    this.hazardLock -= dt;
    this.counterTimer -= dt;
    this.dashCd -= dt;
    this.jumpBuffer -= dt;
    this.attackBuffer -= dt;
    this.heavyBuffer -= dt;
    this.animTimer += dt;

    if (!this.alive) {
      this.tickAnim(dt);
      this.defeatTimer -= dt;
      if (this.defeatTimer <= 0 && !this.reported) {
        this.reported = true;
        this.scene.onPlayerDown();
      }
      this.syncVisuals();
      return;
    }

    if (this.state === 'respawn') {
      this.tickAnim(dt);
      this.body.setVelocity(0, 0);
      if (this.animFrame >= 4 && this.animTimer > 40) this.state = 'idle';
      this.syncVisuals();
      return;
    }

    const left = keys.left.isDown || keys.a.isDown;
    const right = keys.right.isDown || keys.d.isDown;
    let dir = (right ? 1 : 0) - (left ? 1 : 0);
    if (dir !== 0) this.facing = dir;

    this.wasGround = this.onGround;
    this.onGround = this.onFloor;
    if (this.onGround) {
      this.coyote = PHYS.coyote;
      this.airDashes = this.mods.airDashes;
      this.cutJump = false;
    } else if (!this.wasGround) {
      // Only start burning coyote time once we have been airborne for a full
      // frame, so a low frame rate does not eat the window on the first step.
      this.coyote -= dt;
    }

    if (Phaser.Input.Keyboard.JustDown(keys.space)) this.jumpBuffer = PHYS.jumpBuffer;
    if (Phaser.Input.Keyboard.JustDown(keys.j) || this.wantLight) {
      this.attackBuffer = 140;
      this.wantLight = false;
    }
    if (Phaser.Input.Keyboard.JustDown(keys.k) || this.wantHeavy) {
      this.heavyBuffer = 140;
      this.wantHeavy = false;
    }
    if (Phaser.Input.Keyboard.JustDown(keys.q) || Phaser.Input.Keyboard.JustDown(keys.l)) this.tryParry();
    if (Phaser.Input.Keyboard.JustDown(keys.f)) this.tryMatcha();

    const dashPressed = Phaser.Input.Keyboard.JustDown(keys.shift);
    if (dashPressed) this.tryDash(dir);

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.body.setVelocityX(this.dashDir * PHYS.dashSpeed);
      if (this.onGround) this.body.setVelocityY(0);
      this.state = 'dash';
      this.playPose('dash');
      if (this.mods.afterimage && this.animTimer > 30) this.spawnAfterimage();
      this.tickAnim(dt);
      this.syncVisuals();
      this.attackLive = false;
      return;
    }

    if (this.stun > 0) {
      this.stun -= dt;
      this.state = 'hurt';
      this.playPose('hurt');
      this.tickAnim(dt);
      this.attackLive = false;
      this.syncVisuals();
      return;
    }

    if (this.state === 'parry' || this.state === 'parryok') {
      const spec = this.state === 'parry' ? PARRY : PARRY_OK;
      this.tickAttackLike(dt, spec);
      this.controlMove(dir, dt, 0.2);
      // Leave the stance once every frame has played out (tickAttackLike resets
      // animTimer on each frame step, so the frame counter is the reliable exit).
      if (this.animFrame >= spec.frames) {
        this.state = this.onGround ? 'idle' : 'fall';
        this.playPose(this.state, true);
      }
      this.syncVisuals();
      return;
    }

    if (this.state === 'attack') {
      this.tickAttack(dt);
      this.controlMove(dir, dt, this.onGround ? 0.2 : 0.55);
      this.tryJump(dt);
      this.syncVisuals();
      return;
    }

    this.attackLive = false;
    this.tryJump(dt);
    this.controlMove(dir, dt, 1);
    this.tryStartAttack();
    if (this.state === 'attack') {
      // The attack started this frame; do not let the locomotion state
      // machine below overwrite it back to idle/run.
      this.tickAttack(dt);
      this.syncVisuals();
      return;
    }

    if (!this.onGround) {
      this.state = this.body.velocity.y < 0 ? 'jump' : 'fall';
      this.playPose(this.state);
    } else if (!this.wasGround && this.onGround) {
      this.landTimer = 140;
      this.state = 'land';
      this.playPose('land', true);
      AudioManager.play('land');
      this.scene.spawnFx('fx_dust_0', this.x, this.y);
    } else if (this.landTimer > 0 && Math.abs(this.body.velocity.x) < 20) {
      this.landTimer -= dt;
      this.state = 'land';
    } else if (dir !== 0) {
      this.state = 'run';
      this.playPose('run');
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) {
        this.dustTimer = 90;
        this.scene.spawnFx('fx_dust_1', this.x - this.facing * 6, this.y);
      }
    } else {
      this.state = 'idle';
      this.playPose('idle');
    }

    this.tickAnim(dt);
    this.syncVisuals();
  }

  controlMove(dir, dt, scale) {
    const speed = this.mods.speed;
    const accel = (this.onGround ? PHYS.accel : PHYS.airAccel) * scale;
    const decel = this.onGround ? PHYS.decel : PHYS.airDecel;
    let vx = this.body.velocity.x;
    if (dir !== 0 && scale > 0) {
      vx += dir * accel * (dt / 1000);
      vx = Phaser.Math.Clamp(vx, -speed, speed);
    } else {
      const step = decel * (dt / 1000);
      if (Math.abs(vx) <= step) vx = 0;
      else vx -= Math.sign(vx) * step;
    }
    this.body.setVelocityX(vx);
  }

  tryJump() {
    const keys = this.scene.keys;
    if (this.jumpBuffer > 0 && this.coyote > 0 && this.state !== 'defeat') {
      this.body.setVelocityY(PHYS.jumpV);
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.jumpHeld = true;
      this.cutJump = false;
      this.onGround = false;
      AudioManager.play('jump');
      if (this.state !== 'attack' && this.state !== 'parry') {
        this.state = 'jump';
        this.playPose('jump', true);
      }
    } else if (this.jumpHeld && !keys.space.isDown && this.body.velocity.y < 0 && !this.cutJump) {
      this.body.setVelocityY(this.body.velocity.y * PHYS.jumpCut);
      this.cutJump = true;
      this.jumpHeld = false;
    }
    if (!keys.space.isDown) this.jumpHeld = false;
  }

  tryDash(dir) {
    if (!this.canAct()) return;
    const dashDir = dir !== 0 ? dir : this.facing;
    const recoveryCancel = this.state === 'attack' && this.attackName && this.animFrame >= (ATTACKS[this.attackName]?.recovery ?? 9);
    if (this.state === 'attack' && !recoveryCancel) return;
    if (this.state === 'parry') return;
    if (this.dashCd > 0 || this.dashTimer > 0) return;
    if (!this.onGround && this.airDashes <= 0) return;
    this.dashTimer = PHYS.dashTime;
    this.dashDir = dashDir;
    this.facing = dashDir;
    this.dashCount += 1;
    this.attackLive = false;
    this.state = 'dash';
    this.playPose('dash', true);
    if (this.onGround) this.dashCd = PHYS.dashCooldown;
    else {
      this.airDashes -= 1;
      this.dashCd = 110;
    }
    if (this.mods.dashIFrame) this.iFrame = Math.max(this.iFrame, this.mods.dashIFrame);
    AudioManager.play('dash');
  }

  tryStartAttack() {
    if (!this.canAct()) return;
    if (this.heavyBuffer > 0) {
      this.heavyBuffer = 0;
      this.attackBuffer = 0;
      this.startAttack(this.onGround ? 'heavy' : 'air');
      return;
    }
    if (this.attackBuffer > 0) {
      this.attackBuffer = 0;
      this.startAttack(this.onGround ? 'light1' : 'air');
    }
  }

  startAttack(name) {
    this.attackName = name;
    this.state = 'attack';
    this.swingToken += 1;
    this.playPose(name, true);
    this.attackLive = false;
    AudioManager.play(name === 'heavy' ? 'heavy' : 'slash');
    if (name === 'air' && this.mods.airSlash) {
      spawnProjectile(this.scene, this.x + this.facing * 18, this.y - 24, this.facing * 260, 0, 'fx_wave', {
        owner: this,
        damage: 1,
        life: 280,
        w: 16,
        h: 10,
        friendly: true,
      });
    }
  }

  tickAttack(dt) {
    const atk = ATTACKS[this.attackName];
    if (!atk) {
      this.state = 'idle';
      return;
    }
    const recovering = this.animFrame >= atk.recovery;
    const frameMs = atk.ms * (recovering ? this.mods.recoveryMul : 1);
    this.attackLive = atk.active.includes(this.animFrame);
    if (this.animTimer >= frameMs) {
      this.animTimer = 0;
      this.animFrame += 1;
      if (this.animFrame >= atk.frames) {
        this.attackLive = false;
        const chain = this.onGround && atk.next && this.attackBuffer > 0;
        if (chain) {
          this.attackBuffer = 0;
          this.startAttack(atk.next);
          return;
        }
        this.state = this.onGround ? 'idle' : 'fall';
        this.attackName = null;
        return;
      }
    }
    if (recovering && this.attackBuffer > 0 && atk.next && this.onGround) {
      this.attackBuffer = 0;
      this.startAttack(atk.next);
      return;
    }
    if (recovering && this.heavyBuffer > 0 && this.onGround) {
      this.heavyBuffer = 0;
      this.startAttack('heavy');
      return;
    }
    this.setTexture(textureKey(PREFIX, this.pose, this.animFrame));
  }

  tickAttackLike(dt, spec) {
    const frameMs = spec.ms * (this.animFrame >= (spec.recovery ?? 99) ? this.mods.recoveryMul : 1);
    if (this.animTimer >= frameMs) {
      this.animTimer = 0;
      this.animFrame += 1;
    }
    const pose = this.state === 'parryok' ? 'parryok' : 'parry';
    this.pose = pose;
    this.setTexture(textureKey(PREFIX, pose, Math.min(this.animFrame, 2)));
  }

  tryParry() {
    if (!this.canAct()) return;
    if (this.state === 'attack' && this.attackLive) return;
    this.state = 'parry';
    this.parryTimer = 160;
    this.playPose('parry', true);
    AudioManager.play('parry');
  }

  get parryActive() {
    return this.state === 'parry' && this.animFrame <= 1;
  }

  tryMatcha() {
    if (!this.mods.matcha || !this.matchaReady || !this.alive) return;
    if (this.hp >= this.maxHp) return;
    this.hp += 1;
    this.matchaReady = false;
    AudioManager.play('heal');
    this.scene.spawnFx('fx_spark_1', this.x, this.y - 24);
    this.scene.emitHud();
  }

  receiveHit(amount, fromX, threat) {
    if (!this.alive || this.state === 'defeat') return 'ignore';
    if (this.parryActive && threat) {
      this.onParry(threat, fromX);
      return 'parry';
    }
    if (this.iFrame > 0) return 'ignore';
    if (this.shieldUp) {
      this.shieldUp = false;
      this.iFrame = 400;
      AudioManager.play('parryOk');
      this.scene.spawnFx('fx_spark_2', this.x, this.y - 20);
      this.scene.emitHud();
      return 'block';
    }
    this.hp -= amount;
    this.iFrame = PHYS.hitInvuln;
    this.stun = this.mods.hurtStun;
    this.state = 'hurt';
    this.attackLive = false;
    this.attackName = null;
    this.playPose('hurt', true);
    const dir = Math.sign(this.x - fromX) || -this.facing;
    this.body.setVelocity(dir * 150, -180);
    AudioManager.play('hurt');
    this.scene.feedback('hurt');
    this.scene.emitHud();
    if (this.hp <= 0) this.die();
    return 'hurt';
  }

  onParry(threat, fromX) {
    this.state = 'parryok';
    this.playPose('parryok', true);
    this.counterTimer = 800;
    this.iFrame = 200;
    AudioManager.play('parryOk');
    this.scene.feedback('parry');
    this.scene.spawnFx('fx_spark_1', this.x + this.facing * 16, this.y - 22);
    this.scene.onParried?.();
    const owner = threat.owner;
    owner?.stagger?.(700);
    if (this.mods.counterPulse) {
      for (const foe of this.scene.foes) {
        if (!foe.alive) continue;
        if (Phaser.Math.Distance.Between(this.x, this.y, foe.x, foe.y) < 48) {
          foe.takeHit?.({ damage: 2, armor: true, facing: this.facing, token: `pulse-${this.swingToken}-${foe.name || foe.x}`, kb: 160, fromX: this.x });
        }
      }
    }
    void fromX;
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.hp = 0;
    this.state = 'defeat';
    this.attackLive = false;
    this.playPose('defeat', true);
    this.defeatTimer = 780;
    this.body.setVelocity(0, -80);
    this.body.checkCollision.none = true;
    AudioManager.play('die');
    this.scene.emitHud();
  }

  onEnemyKilled() {
    if (this.mods.airReset && !this.onGround) {
      this.airDashes = this.mods.airDashes;
      this.coyote = PHYS.coyote;
    }
  }

  getAttackInfo() {
    const atk = ATTACKS[this.attackName] || ATTACKS.light1;
    let damage = atk.damage;
    if (atk.armor) damage += this.mods.heavyBonus;
    if (this.counterTimer > 0) damage = Math.ceil(damage * 1.5);
    return {
      damage,
      armor: !!atk.armor,
      facing: this.facing,
      token: this.swingToken,
      kb: atk.kb,
      fromX: this.x,
      air: !!atk.air,
      hitstop: atk.hitstop || 0,
    };
  }

  syncAttackZone() {
    const atk = ATTACKS[this.attackName];
    if (!this.attackLive || !atk) {
      this.attackZone.setPosition(-2000, -2000);
      sync(this.attackZone);
      this.slashFx.setVisible(false);
      return;
    }
    this.attackZone.setPosition(this.x + atk.ox * this.facing, this.y + atk.oy);
    this.attackZone.body.setSize(atk.w, atk.h, true);
    sync(this.attackZone);
    this.slashFx.setVisible(true).setPosition(this.x + 20 * this.facing, this.y - 26).setFlipX(this.facing < 0);
    this.slashFx.setTexture(`fx_slash_${this.animFrame % 3}`);
  }

  tickAnim() {
    const meta = { idle: 160, run: 80, jump: 90, fall: 120, land: 70, dash: 50, hurt: 100, defeat: 110, respawn: 90, victory: 120 }[this.pose];
    const fps = meta || 100;
    if (this.state === 'attack' || this.state === 'parry' || this.state === 'parryok') return;
    if (this.animTimer >= fps) {
      this.animTimer = 0;
      const frames = { idle: 4, run: 6, jump: 3, fall: 2, land: 3, dash: 4, hurt: 2, defeat: 6, respawn: 5, victory: 4 }[this.pose] || 4;
      this.animFrame += 1;
      if (this.animFrame >= frames) this.animFrame = this.pose === 'defeat' || this.pose === 'respawn' || this.pose === 'land' ? frames - 1 : 0;
      this.setTexture(textureKey(PREFIX, this.pose, this.animFrame));
    }
  }

  syncVisuals() {
    this.setFlipX(this.facing < 0);
    const blink = this.iFrame > 0 && Math.floor(this.scene.time.now / 70) % 2 === 0 && this.alive;
    this.setAlpha(blink ? 0.45 : 1);
    this.shieldFx.setVisible(this.shieldUp && this.alive).setPosition(this.x, this.y - 24);
  }

  spawnAfterimage() {
    const ghost = this.scene.add.image(this.x, this.y, this.texture.key).setOrigin(this.originX, this.originY).setFlipX(this.flipX).setAlpha(0.45).setDepth(9).setTint(0x9dffb0);
    this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 180, onComplete: () => ghost.destroy() });
  }
}

function sync(obj) {
  obj.body?.updateFromGameObject?.();
}
