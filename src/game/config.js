export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const TILE = 16;

export const PHYS = {
  gravity: 1500,
  speed: 165,
  accel: 2800,
  airAccel: 1700,
  decel: 3600,
  airDecel: 280,
  jumpV: -432,
  jumpCut: 0.48,
  maxFall: 760,
  coyote: 130,
  jumpBuffer: 150,
  dashSpeed: 400,
  dashTime: 145,
  dashCooldown: 460,
  hitInvuln: 900,
};

export const DEBUG = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

export const SAVE_KEY = 'bounceback.save.v1';
export const SETTINGS_KEY = 'bounceback.settings.v1';
export const SAVE_VERSION = 1;
