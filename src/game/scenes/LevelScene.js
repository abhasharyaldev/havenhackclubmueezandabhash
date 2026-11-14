import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config.js';
import { LEVELS } from '../data/levels.js';
import { AudioManager } from '../systems/AudioManager.js';
import { ageProjectiles, resolveCombat } from '../systems/CombatSystem.js';
import { CheckpointSystem } from '../systems/CheckpointSystem.js';
import { gameBus } from '../systems/GameEvents.js';
import { createParallax } from '../systems/ParallaxSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { BugBoss } from '../bosses/BugBoss.js';
import { DeadlineBoss } from '../bosses/DeadlineBoss.js';
import { BurnoutBoss } from '../bosses/BurnoutBoss.js';
import { ImposterBoss } from '../bosses/ImposterBoss.js';
import { ComplexityBoss } from '../bosses/ComplexityBoss.js';
import { floatingText, makePrompt } from './labels.js';

const BOSSES = { bug: BugBoss, deadline: DeadlineBoss, burnout: BurnoutBoss, imposter: ImposterBoss, complexity: ComplexityBoss };
const TOP = { grass: 'tile_grass', wood: 'tile_wood_top', metal: 'tile_metal_top', heat: 'tile_heat', core: 'tile_core', dirt: 'tile_dirt', spike: 'tile_spike' };
const FILL = { grass: 'tile_dirt', wood: 'tile_wood', metal: 'tile_metal', heat: 'tile_heat', core: 'tile_core_fill', dirt: 'tile_dirt', spike: 'tile_spike' };
const PLAT = { plat: 'tile_plat', plat_metal: 'tile_plat_metal', plat_core: 'tile_plat_core' };
const BG = { bedroom: '#241424', school: '#87c8f0', clock: '#121826', overheat: '#2a1214', mirror: '#1a1030', core: '#2a0838' };

export class LevelScene extends Phaser.Scene {
  constructor(key, levelId) {
    super(key);
    this.levelId = levelId;
  }

  init(data) {
    this.spawnOverride = data?.spawn || null;
    this.downed = false;
    this.bossStarted = false;
    this.bossHandled = false;
    this.hitLanded = false;
    this.didParry = false;
    this.savedHere = false;
    this.stepDashBase = null;
    this.hudStamp = 0;
    this.hitStopMs = 0;
    this.ready = false;
    this.promptId = '';
    this.prompt = null;
    this.stepPrompt = null;
    this.echoState = null;
    this.exitPoint = null;
    this.boss = null;
  }

  create() {
    this.level = LEVELS[this.levelId];
    const level = this.level;
    this.worldW = level.width * TILE;
    this.worldH = level.height * TILE;
    this.cameras.main.setBackgroundColor(BG[level.theme] || '#111');
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(180, 0, 0, 0);
    this.physics.world.setBounds(0, -400, this.worldW, this.worldH + 800);
    this.levelBounds = new Phaser.Geom.Rectangle(0, 0, this.worldW, this.worldH);
    this.parallax = createParallax(this, level.theme);
    this.solidBodies = [];
    this.solidRects = [];
    this.oneWayBodies = [];
    this.hazards = [];
    this.foes = [];
    this.enemyList = [];
    this.threats = [];
    this.projectiles = [];
    this.playerShots = [];
    this.pickups = [];
    this.interactables = [];
    this.movers = [];
    this.timers = [];
    this.echoes = [];
    this.petals = [];
    this.colliders = [];
    this.prompt = null;

    // Phaser destroys a scene's Key objects on shutdown, so a scene that is
    // restarted (respawn, retry, warp to the same level) must rebuild them.
    {
      this.keys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        j: Phaser.Input.Keyboard.KeyCodes.J,
        k: Phaser.Input.Keyboard.KeyCodes.K,
        q: Phaser.Input.Keyboard.KeyCodes.Q,
        l: Phaser.Input.Keyboard.KeyCodes.L,
        e: Phaser.Input.Keyboard.KeyCodes.E,
        f: Phaser.Input.Keyboard.KeyCodes.F,
        one: Phaser.Input.Keyboard.KeyCodes.ONE,
        two: Phaser.Input.Keyboard.KeyCodes.TWO,
        three: Phaser.Input.Keyboard.KeyCodes.THREE,
        four: Phaser.Input.Keyboard.KeyCodes.FOUR,
        five: Phaser.Input.Keyboard.KeyCodes.FIVE,
        six: Phaser.Input.Keyboard.KeyCodes.SIX,
        seven: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      });
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.TAB,
      ]);
    }
    if (!this.boundShutdown) {
      this.events.on('shutdown', this.shutdown, this);
      this.events.on('resume', () => this.player?.refreshUpgrades());
      this.boundShutdown = true;
    }
    this.onPointer = (pointer) => {
      if (!this.player?.alive) return;
      if (pointer.leftButtonDown()) this.player.wantLight = true;
      if (pointer.rightButtonDown()) this.player.wantHeavy = true;
    };
    this.input.on('pointerdown', this.onPointer);
    this.input.mouse?.disableContextMenu();

    const save = SaveSystem.load() || { tutorialSteps: [], bosses: [] };
    for (const rect of level.solids) {
      if (rect.gate && save.tutorialSteps?.includes(rect.gate)) continue;
      this.makeSolid(rect);
    }
    for (const plat of level.platforms || []) this.makePlatform(plat);
    for (const timer of level.timers || []) this.makeTimer(timer);
    for (const mover of level.movers || []) this.makeMover(mover);
    for (const decor of level.decors || []) this.makeDecor(decor);

    const spawn = this.spawnOverride || SaveSystem.getCheckpoint(level.id) || level.playerStart;
    this.player = new Player(this, spawn.x, spawn.y);
    if (!SaveSystem.getCheckpoint(level.id)) SaveSystem.setCheckpoint(level.id, spawn.x, spawn.y);

    for (const cfg of level.enemies || []) this.spawnEnemy(cfg);
    for (const shard of level.shards || []) this.spawnPickup(shard, 'tile_shard', 'shard');
    for (const heart of level.hearts || []) this.spawnPickup(heart, 'tile_heart', 'heart');
    for (const cp of level.checkpoints || []) this.spawnCheckpoint(cp);
    this.buildDoors(save);
    this.buildBoss(save);

    this.bindActor(this.player);
    for (const foe of this.foes) this.bindActor(foe);
    this.ready = true;

    this.cameras.main.setDeadzone(24, 20);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    AudioManager.music(level.music);
    this.registry.set('currentLevel', level.id);
    this.game.registry.set('currentScene', this.scene.key);
    floatingText(this, spawn.x, spawn.y - 48, level.name, '#d4f28a');
    if (level.id === 'bedroom' && save.bosses?.includes('complexity') && !save.seenEnding) {
      SaveSystem.setFlag('seenEnding', true);
      this.time.delayedCall(700, () => gameBus.emit('victory'));
    }
    this.emitHud(true);
    gameBus.emit('save-changed', SaveSystem.load());
  }

  standOn(actor, plat) {
    return actor.body.velocity.y >= 0 && actor.body.bottom <= plat.body.top + 14;
  }

  makeSolid(rect) {
    const images = [];
    for (let ty = 0; ty < rect.h; ty++) {
      for (let tx = 0; tx < rect.w; tx++) {
        const key = (ty === 0 ? TOP[rect.skin] : FILL[rect.skin]) || 'tile_metal';
        images.push(this.add.image((rect.x + tx) * TILE + 8, (rect.y + ty) * TILE + 8, key).setDepth(2));
      }
    }
    const body = this.add.rectangle((rect.x + rect.w / 2) * TILE, (rect.y + rect.h / 2) * TILE, rect.w * TILE, rect.h * TILE, 0, 0);
    this.physics.add.existing(body, true);
    body.gate = rect.gate || null;
    body.images = images;
    this.solidBodies.push(body);
    this.solidRects.push({
      left: rect.x * TILE,
      right: (rect.x + rect.w) * TILE,
      top: rect.y * TILE,
      bottom: (rect.y + rect.h) * TILE,
    });
    if (rect.hurt) {
      const zone = this.add.zone((rect.x + rect.w / 2) * TILE, rect.y * TILE, rect.w * TILE, 12);
      this.physics.add.existing(zone);
      zone.body.setAllowGravity(false);
      zone.body.moves = false;
      zone.hurt = rect.hurt;
      this.hazards.push(zone);
    }
    return body;
  }

  makePlatform(def) {
    const key = PLAT[def.skin] || 'tile_plat';
    const images = [];
    for (let i = 0; i < def.w; i++) images.push(this.add.image(def.x * TILE + i * TILE + 8, def.y * TILE + 8, key).setDepth(2));
    const body = this.add.rectangle(def.x * TILE + (def.w * TILE) / 2, def.y * TILE + 8, def.w * TILE, 8, 0, 0);
    this.physics.add.existing(body, true);
    body.images = images;
    this.oneWayBodies.push(body);
  }

  makeTimer(def) {
    const key = 'tile_plat_metal';
    const images = [];
    for (let i = 0; i < def.w; i++) images.push(this.add.image(def.x * TILE + i * TILE + 8, def.y * TILE + 8, key).setDepth(2));
    const body = this.add.rectangle(def.x * TILE + (def.w * TILE) / 2, def.y * TILE + 8, def.w * TILE, 10, 0, 0);
    this.physics.add.existing(body, true);
    body.images = images;
    body.clock = def.phase || 0;
    body.onMs = def.on;
    body.offMs = def.off;
    this.timers.push(body);
    this.oneWayBodies.push(body);
  }

  makeMover(def) {
    const key = this.level.theme === 'core' ? 'tile_plat_core' : 'tile_plat_metal';
    const images = [];
    for (let i = 0; i < def.w; i++) images.push(this.add.image(def.x * TILE + i * TILE + 8, def.y * TILE + 8, key).setDepth(2));
    const x = def.x * TILE + (def.w * TILE) / 2;
    const y = def.y * TILE + 8;
    const body = this.add.rectangle(x, y, def.w * TILE, 8, 0, 0);
    this.physics.add.existing(body);
    body.body.setAllowGravity(false);
    body.body.setImmovable(true);
    body.images = images;
    body.originX = x;
    body.originY = y;
    body.t = 0;
    body.range = def.range;
    body.period = def.period;
    body.axis = def.axis;
    body.prevX = x;
    body.prevY = y;
    this.movers.push(body);
    this.oneWayBodies.push(body);
  }

  makeDecor(def) {
    const img = this.add.image(def.x, def.y, 'tile_checkpoint').setTint(def.tint || 0xffffff).setDepth(-4).setScrollFactor(0.65);
    if (def.blink && !(this.game.registry.get('settings')?.reducedMotion)) {
      this.tweens.add({ targets: img, alpha: 0.35, duration: 280 + (def.x % 180), yoyo: true, repeat: -1 });
    }
  }

  bindActor(actor, solids = this.solidBodies, plats = this.oneWayBodies) {
    this.colliders.push(this.physics.add.collider(actor, solids));
    this.colliders.push(this.physics.add.collider(actor, plats, null, this.standOn));
  }

  spawnEnemy(cfg) {
    const enemy = new Enemy(this, cfg);
    enemy.spawnCfg = cfg;
    this.enemyList.push(enemy);
    this.foes.push(enemy);
    if (this.ready) this.bindActor(enemy);
    return enemy;
  }

  spawnPickup(def, texture, kind) {
    if (kind === 'shard' && SaveSystem.alreadyCollected(def.id)) return;
    const img = this.add.image(def.x, def.y - 20, texture).setDepth(6);
    img.kind = kind;
    img.def = def;
    img.baseY = def.y - 20;
    this.pickups.push(img);
  }

  spawnCheckpoint(def) {
    const img = this.add.image(def.x, def.y - 24, 'tile_checkpoint').setDepth(6);
    this.interactables.push({ kind: 'checkpoint', x: def.x, y: def.y, sprite: img, id: def.id });
  }

  buildDoors(save) {
    const doors = [...(this.level.interacts || [])];
    if (this.level.exit && !doors.some((d) => d.to === this.level.exit.to)) {
      doors.push({ kind: 'door', x: this.level.exit.x, y: this.level.exit.y, to: this.level.exit.to, label: 'E  EXIT', exit: true });
    }
    const bossDead = this.level.boss ? save.bosses?.includes(this.level.boss.id) : true;
    for (const door of doors) {
      // Doors are 16px tiles; draw them at 2x with a soft glow so they read on busy backgrounds.
      const glow = this.add.rectangle(door.x, door.y - 24, 40, 40, 0xd4f28a, 0.18).setDepth(4);
      this.tweens.add({ targets: glow, alpha: 0.05, duration: 700, yoyo: true, repeat: -1 });
      const sprite = this.add.image(door.x, door.y - 24, this.level.theme === 'core' ? 'tile_door_core' : 'tile_door').setDepth(5).setScale(2);
      const label = makePrompt(this, door.x, door.y - 52, door.label || 'E  ENTER');
      // `label` is the floating Image; keep the text separately so prompts can use it.
      const point = { ...door, labelText: door.label || 'ENTER', sprite, label, enabled: door.exit ? bossDead || !this.level.boss : true };
      point.glow = glow;
      if (!point.enabled) {
        sprite.setVisible(false);
        label.setVisible(false);
        glow.setVisible(false);
      }
      this.interactables.push(point);
      if (door.exit) this.exitPoint = point;
    }
  }

  buildBoss(save) {
    if (!this.level.boss) return;
    const spec = this.level.boss;
    const a = spec.arena;
    this.arenaPx = { left: a.x * TILE, right: (a.x + a.w) * TILE, top: a.y * TILE, bottom: (a.y + a.h) * TILE, floor: spec.y };
    if (save.bosses?.includes(spec.id)) {
      this.bossStarted = true;
      this.bossHandled = true;
      return;
    }
    const Cls = BOSSES[spec.id];
    this.boss = new Cls(this, spec.x, spec.y);
    this.foes.push(this.boss);
  }

  shutdown() {
    this.ready = false;
    this.colliders?.forEach((c) => c.destroy());
    this.colliders = [];
    if (this.onPointer) this.input.off('pointerdown', this.onPointer);
    AudioManager.stopMusic();
  }

  hitStop(ms) {
    if (!ms || this.downed) return;
    if (this.game.registry.get('settings')?.reducedMotion) ms = Math.min(ms, 20);
    if (ms <= this.hitStopMs) return;
    if (this.hitStopMs <= 0) this.physics.world.pause();
    this.hitStopMs = ms;
  }

  update(time, delta) {
    const dt = Math.min(34, delta);
    const cam = this.cameras?.main;
    if (!cam || !this.ready) return;
    this.parallax.update(cam);
    if (this.hitStopMs > 0) {
      // Hit-stop: freeze simulation and animation for a few frames on impact.
      this.hitStopMs -= delta;
      if (this.hitStopMs <= 0) {
        this.hitStopMs = 0;
        if (!this.downed) this.physics.world.resume();
      }
      return;
    }
    this.updateMovers(dt);
    this.updateTimers(dt);
    this.updateEchoes(dt);
    this.updatePetals(dt);
    this.player?.update(time, delta);
    if (!this.player) return;
    if (this.downed) return;
    for (const enemy of this.enemyList) enemy.step?.(dt);
    this.boss?.step?.(dt);
    ageProjectiles(this, dt);
    resolveCombat(this);
    this.touchPickups();
    this.touchInteract();
    this.tickTutorial();
    this.tickBossGate();
    this.tickFall();
    this.devWarp();
    if (time > this.hudStamp) {
      this.hudStamp = time + 120;
      this.emitHud();
    }
  }

  updateMovers(dt) {
    for (const m of this.movers) {
      const prevX = m.x;
      const prevY = m.y;
      m.t += dt;
      const wave = Math.sin((m.t / m.period) * Math.PI * 2);
      const nx = m.axis === 'x' ? m.originX + wave * m.range : m.originX;
      const ny = m.axis === 'y' ? m.originY + wave * m.range : m.originY;
      m.setPosition(nx, ny);
      m.body.reset(nx, ny);
      const dx = nx - prevX;
      const dy = ny - prevY;
      m.images.forEach((img) => img.setPosition(img.x + dx, img.y + dy));
      const p = this.player;
      if (p?.body?.blocked.down && Math.abs(p.body.bottom - m.body.top) < 18 && Math.abs(p.body.center.x - m.body.center.x) < m.body.halfWidth + 10) {
        p.x += dx;
        p.y += dy;
      }
    }
  }

  updateTimers(dt) {
    const reduced = this.game.registry.get('settings')?.reducedMotion;
    for (const t of this.timers) {
      t.clock += dt;
      const cycle = t.onMs + t.offMs;
      const local = t.clock % cycle;
      const visible = reduced ? true : local < t.onMs;
      const blink = visible && local > t.onMs - 260;
      t.body.enable = visible;
      const alpha = !visible ? 0.15 : blink && Math.floor(this.time.now / 70) % 2 === 0 ? 0.35 : 1;
      t.images.forEach((img) => img.setAlpha(alpha));
    }
  }

  updateEchoes(dt) {
    if (!this.level.echoes?.length || this.downed) return;
    if (!this.echoState) {
      this.echoState = this.level.echoes.map((e) => ({ ...e, timer: e.phase || 400 }));
    }
    for (const echo of this.echoState) {
      echo.timer -= dt;
      if (echo.timer > 0) continue;
      echo.timer = echo.interval;
      const x = this.player.x;
      const y = this.player.y;
      const mark = this.add.image(x, y - 8, 'fx_mark').setTint(0xc084ff).setDepth(7);
      this.time.delayedCall(620, () => {
        mark.destroy();
        if (!this.player?.alive) return;
        const zone = this.add.zone(x, y - 12, 20, 28);
        this.physics.add.existing(zone);
        zone.body.setAllowGravity(false);
        zone.body.moves = false;
        zone.activeHit = true;
        zone.damage = 1;
        zone.owner = null;
        this.threats.push(zone);
        this.spawnFx('fx_burst_0', x, y - 16);
        this.time.delayedCall(120, () => zone.destroy());
      });
    }
  }

  updatePetals(dt) {
    const settings = this.game.registry.get('settings') || {};
    if (settings.reducedMotion || this.level.theme === 'bedroom') {
      return;
    }
    const cam = this.cameras.main;
    const region = Phaser.Math.Clamp(this.player.x / this.worldW, 0, 1);
    let chance = 0;
    let tex = 'fx_petal';
    if (this.level.theme === 'school') chance = 0.15 + region * 0.45;
    else if (this.level.theme === 'core') {
      chance = 0.1 + region * 0.3;
      tex = 'fx_cube';
    } else if (this.level.theme === 'overheat') {
      chance = 0.08;
      tex = 'fx_ember';
    }
    if (chance && Math.random() < chance * (dt / 16)) {
      const p = this.add.image(cam.scrollX + Math.random() * GAME_WIDTH, cam.scrollY - 4, tex).setDepth(-3).setScale(this.level.theme === 'core' ? 0.6 : 1);
      p.vy = 18 + Math.random() * 22;
      p.vx = 8 + Math.random() * 10;
      this.petals.push(p);
    }
    this.petals = this.petals.filter((p) => {
      if (!p.active) return false;
      p.x += p.vx * (dt / 1000);
      p.y += p.vy * (dt / 1000);
      if (p.y > cam.scrollY + GAME_HEIGHT + 8) {
        p.destroy();
        return false;
      }
      return true;
    });
  }

  touchPickups() {
    for (const item of [...this.pickups]) {
      if (!item.active) continue;
      item.y = item.baseY + Math.sin(this.time.now / 220 + item.x) * 2;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y - 16, item.x, item.y) > 22) continue;
      if (item.kind === 'shard') {
        const before = SaveSystem.load()?.fragments || 0;
        SaveSystem.collect(item.def.id, item.def.amount || 3);
        const after = SaveSystem.load()?.fragments || 0;
        if (after > before) floatingText(this, item.x, item.y, `+${after - before}`, '#d4f28a');
      } else if (this.player.hp < this.player.maxHp) {
        this.player.hp += 1;
        floatingText(this, item.x, item.y, '+HP', '#ffb0b8');
      } else continue;
      AudioManager.play('pickup');
      item.destroy();
      this.pickups = this.pickups.filter((p) => p !== item);
      this.emitHud(true);
      gameBus.emit('save-changed', SaveSystem.load());
    }
  }

  touchInteract() {
    let near = null;
    let best = 42;
    for (const point of this.interactables) {
      if (point.enabled === false) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y);
      if (dist < best) {
        best = dist;
        near = point;
      }
    }
    this.showPrompt(near);
    if (!near || !Phaser.Input.Keyboard.JustDown(this.keys.e)) return;
    if (near.kind === 'checkpoint') {
      CheckpointSystem.activate(this.levelId, near.x, near.y);
      this.savedHere = true;
      this.player.hp = this.player.maxHp;
      this.player.matchaReady = this.player.mods.matcha;
      this.player.shieldUp = this.player.mods.shield;
      near.sprite?.setTint(0xd4f28a);
      this.emitHud(true);
      return;
    }
    if (near.kind === 'upgrade') {
      gameBus.emit('open-upgrades');
      return;
    }
    if (near.kind === 'door') {
      const save = SaveSystem.load();
      // A level's own exit is always usable once it is enabled (boss down / no boss);
      // only hub doors depend on the unlock list.
      const open = near.exit || !near.to || near.to === 'bedroom' || near.to === 'tutorial' || save?.unlocked?.includes(near.to);
      if (!open) {
        AudioManager.play('deny');
        floatingText(this, near.x, near.y - 36, 'LOCKED', '#ffb0b0');
        return;
      }
      this.travel(near.to);
    }
  }

  showPrompt(point) {
    const id = point ? `${point.kind}:${point.x}` : '';
    if (this.promptId === id) return;
    this.promptId = id;
    this.prompt?.destroy();
    this.prompt = null;
    if (!point) return;
    const text = point.kind === 'checkpoint' ? 'E  SAVE' : point.kind === 'upgrade' ? 'E  UPGRADES' : `E  ${point.labelText || 'ENTER'}`;
    this.prompt = makePrompt(this, point.x, point.y - 46, text);
  }

  tickTutorial() {
    const steps = this.level.steps || [];
    if (!steps.length) return;
    const save = SaveSystem.load();
    const done = new Set(save?.tutorialSteps || []);
    const step = steps.find((s) => !done.has(s.id));
    if (!step) return;
    if (!this.stepPrompt || this.stepPrompt.name !== step.id) {
      this.stepPrompt?.destroy();
      this.stepPrompt = makePrompt(this, step.x, step.y, step.prompt);
      this.stepPrompt.name = step.id;
      if (step.kind === 'dash-x') this.stepDashBase = this.player.dashCount;
    }
    let complete = false;
    if (step.kind === 'move' || step.kind === 'x' || step.kind === 'reach') complete = this.player.x > step.goal;
    if (step.kind === 'dash-x') complete = this.player.dashCount > (this.stepDashBase ?? 0) && this.player.x > step.goal;
    if (step.kind === 'hit') complete = this.hitLanded;
    if (step.kind === 'parry') complete = this.didParry;
    if (step.kind === 'checkpoint') complete = this.savedHere;
    if (step.kind === 'kill') complete = !this.enemyList.some((e) => e.eid === step.target && e.alive);
    if (step.kind === 'clear') complete = !this.enemyList.some((e) => e.alive && e.eid?.startsWith(step.prefix));
    if (!complete) return;
    SaveSystem.markTutorialStep(step.id);
    this.openGate(step.id);
    this.stepPrompt?.destroy();
    this.stepPrompt = null;
    floatingText(this, this.player.x, this.player.y - 40, 'OK', '#d4f28a');
  }

  openGate(id) {
    for (const body of this.solidBodies) {
      if (body.gate !== id) continue;
      if (body.body) body.body.enable = false;
      body.images?.forEach((img) => img.destroy());
    }
  }

  tickBossGate() {
    const spec = this.level.boss;
    if (!spec || this.bossStarted || !this.boss) return;
    if (this.player.x < spec.trigger * TILE) return;
    this.bossStarted = true;
    // Seal the arena behind the player. If the player somehow overlaps the seal
    // column (knockback, dash carry), push them inside so they are never left
    // outside the locked camera.
    const sealX = spec.arena.x;
    const sealRight = (sealX + 2) * TILE;
    if (this.player.body.left < sealRight + 2) {
      this.player.setPosition(sealRight + this.player.body.halfWidth + 6, this.player.y);
      this.player.body.reset(this.player.x, this.player.y);
    }
    const seal = this.makeSolid({ x: sealX, y: 12, w: 2, h: 8, skin: 'metal' });
    this.bindActor(this.player, [seal], []);
    for (const foe of this.foes) this.bindActor(foe, [seal], []);
    const left = Phaser.Math.Clamp(spec.arena.x * TILE, 0, Math.max(0, this.worldW - GAME_WIDTH));
    this.cameras.main.setBounds(left, 0, Math.min(GAME_WIDTH, this.worldW), this.worldH);
    CheckpointSystem.activate(this.levelId, spec.trigger * TILE, spec.y);
    this.player.hp = this.player.maxHp;
    this.boss.begin();
    this.emitHud(true);
  }

  tickFall() {
    if (this.player.y > this.worldH + 8) this.player.die();
  }

  devWarp() {
    if (!import.meta.env.DEV) return;
    const map = ['bedroom', 'tutorial', 'school', 'clock', 'overheat', 'mirror', 'core'];
    const keys = [this.keys.one, this.keys.two, this.keys.three, this.keys.four, this.keys.five, this.keys.six, this.keys.seven];
    keys.forEach((key, i) => {
      if (key && Phaser.Input.Keyboard.JustDown(key)) gameBus.emit('cmd:start-level', { levelId: map[i] });
    });
  }

  travel(to) {
    if (this.levelId === 'tutorial') {
      SaveSystem.setFlag('tutorialDone', true);
      SaveSystem.unlock('school');
      SaveSystem.addFragments(8, 'tutorial-clear');
    }
    const dest = LEVELS[to];
    SaveSystem.update((data) => {
      data.currentLevel = to;
      if (!data.checkpoints[to]) data.checkpoints[to] = { ...dest.playerStart };
    });
    AudioManager.play('door');
    gameBus.emit('save-changed', SaveSystem.load());
    this.cameras.main.fadeOut(160, 0, 0, 0);
    this.time.delayedCall(180, () => {
      gameBus.emit('cmd:start-level', { levelId: to, spawn: SaveSystem.getCheckpoint(to) });
    });
  }

  onDummyHit() {
    this.hitLanded = true;
  }

  onParried() {
    this.didParry = true;
  }

  onEnemyDown(enemy) {
    AudioManager.play('hit');
    if (!SaveSystem.alreadyDropped(enemy.eid) && enemy.drop) {
      SaveSystem.markEnemyDrop(enemy.eid, enemy.drop);
      floatingText(this, enemy.x, enemy.y - 20, `+${enemy.drop}`, '#d4f28a');
      gameBus.emit('save-changed', SaveSystem.load());
    }
    this.player.onEnemyKilled();
    if (enemy.kind === 'trainer' && !this.didParry && enemy.spawnCfg) {
      this.time.delayedCall(450, () => {
        if (this.sys?.isActive()) this.spawnEnemy(enemy.spawnCfg);
      });
    }
    this.emitHud(true);
  }

  onBossDefeated(boss) {
    if (this.bossHandled) return;
    this.bossHandled = true;
    AudioManager.play('victory');
    SaveSystem.markBoss(boss.cfg.id);
    SaveSystem.addFragments(boss.cfg.fragments, `boss-${boss.cfg.id}`);
    if (boss.cfg.next) SaveSystem.unlock(boss.cfg.next);
    if (this.exitPoint) {
      this.exitPoint.enabled = true;
      this.exitPoint.sprite?.setVisible(true);
      this.exitPoint.label?.setVisible(true);
      this.exitPoint.glow?.setVisible(true);
    }
    for (let i = 0; i < 8; i++) this.time.delayedCall(i * 40, () => this.spawnFx('fx_burst_2', boss.x + (i - 4) * 6, boss.y - 20));
    floatingText(this, boss.x, boss.y - 48, 'CLEAR', '#d4f28a');
    gameBus.emit('toast', 'EXIT OPEN');
    gameBus.emit('save-changed', SaveSystem.load());
    this.emitHud(true);
  }

  onPlayerDown() {
    if (this.downed) return;
    this.downed = true;
    this.physics.pause();
    const save = SaveSystem.load();
    gameBus.emit('player-defeated', { fragments: save?.fragments || 0 });
  }

  spawnFx(key, x, y) {
    const img = this.add.image(x, y, key).setDepth(20);
    this.tweens.add({ targets: img, alpha: 0, y: y - 8, duration: 220, onComplete: () => img.destroy() });
  }

  feedback(kind) {
    const shake = this.game.registry.get('settings')?.shake ?? 1;
    if (kind === 'hit') {
      AudioManager.play('hit');
      if (shake) this.cameras.main.shake(60, 0.0025 * shake);
    } else if (kind === 'hurt') {
      if (shake) this.cameras.main.shake(120, 0.005 * shake);
    } else if (kind === 'parry') {
      if (shake) this.cameras.main.shake(50, 0.002 * shake);
    }
  }

  emitHud(force = false) {
    void force;
    const p = this.player;
    if (!p) return;
    const save = SaveSystem.load();
    gameBus.emit('hud', {
      hp: p.hp,
      maxHp: p.maxHp,
      dashes: p.onGround ? (p.dashCd > 0 ? 0 : 1) : p.airDashes,
      maxDashes: p.mods.airDashes,
      dashRatio: p.dashCd > 0 ? 1 - p.dashCd / 460 : 1,
      matcha: p.mods.matcha && p.matchaReady,
      shield: p.shieldUp,
      fragments: save?.fragments || 0,
      boss: this.boss && this.boss.started && this.boss.alive ? { name: this.boss.cfg.name, hp: this.boss.hp, max: this.boss.maxHp, phase: this.boss.phase } : null,
    });
  }
}
