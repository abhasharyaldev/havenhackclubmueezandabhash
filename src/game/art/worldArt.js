import { makeSurface } from './surface.js';
import { themePalettes } from './palette.js';

function tile(draw) {
  const s = makeSurface(16, 16);
  draw(s);
  return s.toCanvas();
}

function hash(x, y) {
  return ((x * 374761393 + y * 668265263) ^ 0x9e3779b9) >>> 0;
}

export function buildTiles() {
  return {
    tile_grass: tile((s) => {
      s.rect(0, 0, 16, 16, '#6b4a32');
      s.rect(0, 0, 16, 5, '#5ea84a');
      s.rect(0, 5, 16, 2, '#3e7a32');
      for (let x = 0; x < 16; x += 3) s.px(x, 1, '#8fd06a');
      s.px(2, 8, '#8a5a3c');
      s.px(9, 12, '#5a3824');
    }),
    tile_dirt: tile((s) => {
      s.rect(0, 0, 16, 16, '#6b452c');
      s.px(3, 4, '#8a6240');
      s.px(11, 9, '#4a2e1c');
      s.px(7, 13, '#8a6240');
    }),
    tile_wood: tile((s) => {
      s.rect(0, 0, 16, 16, '#7a4e34');
      s.rect(0, 0, 16, 1, '#9a6844');
      s.rect(0, 8, 16, 1, '#5c3824');
      s.px(4, 4, '#c48a5c');
      s.px(12, 12, '#c48a5c');
    }),
    tile_wood_top: tile((s) => {
      s.rect(0, 0, 16, 16, '#8a5a3c');
      s.rect(0, 0, 16, 3, '#d7a06a');
      s.rect(0, 3, 16, 1, '#6a4028');
      s.px(2, 8, '#c48a5c');
      s.px(10, 12, '#5c3824');
    }),
    tile_metal: tile((s) => {
      s.rect(0, 0, 16, 16, '#3e4858');
      s.rect(0, 0, 16, 2, '#6a7688');
      s.rect(1, 1, 14, 1, '#9aa6b6');
      s.px(3, 8, '#2a3140');
      s.px(12, 11, '#2a3140');
      s.rect(7, 6, 2, 2, '#89a');
    }),
    tile_metal_top: tile((s) => {
      s.rect(0, 0, 16, 16, '#465064');
      s.rect(0, 0, 16, 4, '#d0d6e0');
      s.rect(0, 4, 16, 2, '#7c8798');
      s.px(4, 10, '#9aa6b4');
    }),
    tile_heat: tile((s) => {
      s.rect(0, 0, 16, 16, '#8a3a22');
      s.rect(0, 0, 16, 4, '#ff7a32');
      s.rect(0, 4, 16, 2, '#c44820');
      s.px(3, 9, '#ffd2a0');
      s.px(11, 12, '#ffb15a');
    }),
    tile_core: tile((s) => {
      s.rect(0, 0, 16, 16, '#4a1860');
      s.rect(0, 0, 16, 4, '#ff5fa8');
      s.rect(0, 4, 16, 2, '#9a3070');
      s.px(4, 10, '#7af0ff');
      s.px(11, 8, '#ffd0ea');
    }),
    tile_core_fill: tile((s) => {
      s.rect(0, 0, 16, 16, '#3a1450');
      s.px(3, 5, '#6a2878');
      s.px(12, 11, '#7af0ff');
      s.px(8, 8, '#ff5fa8');
    }),
    tile_plat: tile((s) => {
      s.rect(0, 4, 16, 6, '#6b4634');
      s.rect(0, 4, 16, 2, '#c48a5c');
      s.rect(0, 8, 16, 2, '#4a2e1c');
    }),
    tile_plat_metal: tile((s) => {
      s.rect(0, 4, 16, 6, '#3a4454');
      s.rect(0, 4, 16, 2, '#d5dbe6');
      s.rect(2, 7, 3, 2, '#ffcc44');
      s.rect(11, 7, 3, 2, '#222');
    }),
    tile_plat_core: tile((s) => {
      s.rect(0, 4, 16, 6, '#6a2070');
      s.rect(0, 4, 16, 2, '#ff8ac4');
      s.px(4, 7, '#7af0ff');
      s.px(12, 7, '#7af0ff');
    }),
    tile_spike: tile((s) => {
      s.rect(1, 10, 4, 6, '#d0d4dc');
      s.rect(6, 6, 4, 10, '#f4f6fa');
      s.rect(11, 10, 4, 6, '#d0d4dc');
      s.px(7, 5, '#ffffff');
    }),
    tile_checkpoint: tile((s) => {
      s.rect(7, 2, 2, 12, '#d7c08a');
      s.rect(4, 4, 8, 6, '#49d07a');
      s.rect(6, 6, 3, 2, '#eafff0');
    }),
    tile_door: tile((s) => {
      s.rect(2, 0, 12, 16, '#3a2418');
      s.rect(4, 2, 8, 12, '#6a4630');
      s.rect(6, 4, 4, 5, '#8fd0ff');
      s.px(10, 10, '#ffd27a');
    }),
    tile_door_core: tile((s) => {
      s.rect(2, 0, 12, 16, '#2a0840');
      s.rect(4, 2, 8, 12, '#67f08a');
      s.rect(6, 5, 4, 4, '#eafff2');
    }),
    tile_shard: tile((s) => {
      s.rect(7, 2, 2, 2, '#d4f28a');
      s.rect(5, 4, 6, 6, '#7dba45');
      s.rect(7, 10, 2, 3, '#d4f28a');
      s.px(6, 6, '#f4ffe4');
    }),
    tile_heart: tile((s) => {
      s.rect(4, 5, 3, 3, '#e44555');
      s.rect(9, 5, 3, 3, '#e44555');
      s.rect(5, 8, 6, 3, '#e44555');
      s.rect(7, 11, 2, 2, '#e44555');
      s.px(5, 6, '#ffd0d4');
    }),
    tile_ladder: tile((s) => {
      s.rect(3, 0, 2, 16, '#8a6244');
      s.rect(11, 0, 2, 16, '#8a6244');
      s.rect(3, 3, 10, 2, '#c48a5c');
      s.rect(3, 8, 10, 2, '#c48a5c');
      s.rect(3, 13, 10, 2, '#c48a5c');
    }),
  };
}

function paintLayer(theme, layer) {
  const p = themePalettes()[theme];
  const w = 256;
  const h = 640;
  const s = makeSurface(w, h);
  if (layer === 'far') {
    const bands = p.sky;
    const bandH = 70;
    for (let i = 0; i < 8; i++) s.rect(0, i * bandH, w, bandH, bands[i % bands.length]);
    for (let i = 0; i < 5; i++) {
      const cx = 20 + i * 52;
      s.ellipse(cx, 120 + (i % 3) * 18, 18, 8, p.cloud);
      s.ellipse(cx + 12, 124 + (i % 3) * 18, 12, 6, p.cloud);
    }
    for (let x = 0; x < w; x += 8) {
      const bh = 40 + (hash(x, 3) % 50);
      s.rect(x, 300 - bh, 10, bh + 80, p.far);
    }
    s.rect(0, 300, w, 340, p.far);
  } else if (layer === 'mid') {
    s.rect(0, 0, w, h, '#000000');
    for (let i = 0; i < bytesClear(s); i++) void i;
    clear(s);
    for (let x = 0; x < w; x += 28) {
      const bh = 70 + (hash(x, 9) % 80);
      s.rect(x + 2, 250 - bh, 24, bh, p.mid);
      s.rect(x + 4, 250 - bh, 20, 6, p.midHi);
      if (theme === 'school') {
        s.ellipse(x + 10, 236 - bh, 10, 6, '#f4a4c4');
        s.ellipse(x + 18, 244 - bh, 7, 5, '#5ea84a');
      }
      if (theme === 'clock' || theme === 'overheat' || theme === 'mirror') {
        s.rect(x + 8, 270 - bh, 6, 4, theme === 'overheat' ? '#ff7a32' : p.screen || '#39ff88');
      }
      if (theme === 'core') {
        s.rect(x + 8, 240 - (hash(x, 2) % 40), 8, 8, '#7af0ff');
      }
    }
    if (theme === 'bedroom') {
      s.rect(0, 180, w, 8, '#6a4030');
      for (let x = 16; x < w; x += 36) {
        s.rect(x, 150, 18, 22, '#5c4038');
        s.rect(x + 3, 154, 12, 8, '#88c0e8');
      }
    }
  } else {
    clear(s);
    for (let x = 0; x < w; x += 32) {
      const kind = hash(x, 5) % 4;
      if (theme === 'school') {
        s.rect(x, 210, 32, 36, p.near);
        s.rect(x, 206, 32, 4, p.nearHi);
        s.rect(x + 4, 240, 24, 10, '#6dae4e');
        if (kind === 0) s.rect(x + 22, 160, 4, 50, '#8a9098');
      } else if (theme === 'bedroom') {
        s.rect(x + 4, 200, 22, 28, '#6a4634');
        s.rect(x + 6, 188, 8, 12, '#3a6a40');
        s.rect(x + 14, 214, 8, 6, '#ffd27a');
      } else if (theme === 'core') {
        s.rect(x + 6, 180 + (kind * 10), 16, 10, p.nearHi);
        s.rect(x + 10, 160, 6, 6, '#7af0ff');
      } else {
        s.rect(x, 200, 30, 16, p.near);
        s.rect(x + 2, 196, 26, 4, p.nearHi);
        s.rect(x + 6, 206, 8, 5, theme === 'overheat' ? '#ff7a32' : '#39ff88');
        s.rect(x + 4, 216, 22, 6, '#2a3038');
      }
    }
  }
  return s.toCanvas();
}

function clear(s) {
  s.bytes.fill(0);
}

function bytesClear() {
  return 0;
}

export function buildBackgrounds() {
  const themes = ['bedroom', 'school', 'clock', 'overheat', 'mirror', 'core'];
  const layers = ['far', 'mid', 'near'];
  const out = {};
  for (const theme of themes) {
    for (const layer of layers) out[`bg_${theme}_${layer}`] = paintLayer(theme, layer);
  }
  return out;
}

export function buildEffects() {
  const out = {};
  for (let i = 0; i < 3; i++) {
    const slash = makeSurface(28, 20);
    slash.line(2, 16 - i * 2, 24, 4 + i, '#67f06c', 2);
    slash.line(4, 14 - i, 22, 6 + i, '#e9ffd8', 1);
    slash.outline('#145c24');
    out[`fx_slash_${i}`] = slash.toCanvas();

    const spark = makeSurface(16, 16);
    spark.line(8, 1, 8, 14, '#fff4a8', 1);
    spark.line(1, 8, 14, 8, '#fff4a8', 1);
    spark.line(3, 3, 12, 12, '#ffe08a', 1);
    spark.px(8, 8, '#ffffff');
    out[`fx_spark_${i}`] = spark.toCanvas();

    const burst = makeSurface(16, 16);
    burst.ellipse(8, 8, 3 + i * 2, 3 + i * 2, i === 2 ? '#ffd2a0' : '#ffffff');
    out[`fx_burst_${i}`] = burst.toCanvas();

    const dust = makeSurface(8, 8);
    dust.rect(2, 3, 2, 2, '#d8c8a8');
    dust.px(5, 2, '#f0e6d0');
    out[`fx_dust_${i}`] = dust.toCanvas();
  }
  const proj = makeSurface(8, 8);
  proj.rect(2, 2, 4, 4, '#ff4458');
  proj.px(3, 3, '#ffd0d4');
  out.fx_error = proj.toCanvas();

  const shot = makeSurface(8, 6);
  shot.rect(0, 2, 8, 2, '#9fd0ff');
  shot.px(1, 2, '#ffffff');
  out.fx_shot = shot.toCanvas();

  const cube = makeSurface(10, 10);
  cube.rect(1, 1, 8, 8, '#c45cff');
  cube.rect(3, 3, 3, 3, '#f0e8ff');
  cube.outline('#2a1040');
  out.fx_cube = cube.toCanvas();

  const wave = makeSurface(20, 12);
  wave.rect(0, 6, 20, 4, '#67f06c');
  wave.rect(2, 4, 16, 2, '#e9ffd8');
  out.fx_wave = wave.toCanvas();

  const warn = makeSurface(20, 8);
  warn.rect(0, 2, 20, 4, '#ff4458');
  warn.rect(0, 3, 20, 2, '#ffd0d4');
  out.fx_warn = warn.toCanvas();

  const mark = makeSurface(24, 8);
  mark.rect(0, 4, 24, 3, '#ffcc44');
  mark.rect(2, 2, 2, 4, '#ffcc44');
  mark.rect(20, 2, 2, 4, '#ffcc44');
  out.fx_mark = mark.toCanvas();

  const petal = makeSurface(4, 4);
  petal.rect(1, 0, 2, 3, '#f4a4c4');
  petal.px(2, 3, '#ffffff');
  out.fx_petal = petal.toCanvas();

  const ember = makeSurface(4, 4);
  ember.rect(1, 1, 2, 2, '#ff7a32');
  out.fx_ember = ember.toCanvas();

  const ghost = makeSurface(4, 4);
  ghost.rect(0, 0, 4, 4, '#c45cff');
  out.fx_ghost = ghost.toCanvas();

  return out;
}

export function buildIcons() {
  const specs = {
    quickRecovery: (s) => {
      s.rect(3, 4, 10, 8, '#67f06c');
      s.rect(6, 2, 4, 3, '#e9ffd8');
      s.rect(7, 7, 2, 4, '#145c24');
    },
    afterimage: (s) => {
      s.rect(2, 5, 4, 7, '#3a3a3a');
      s.rect(7, 4, 4, 7, '#6a6a6a');
      s.rect(11, 6, 3, 5, '#67f06c');
    },
    counterPulse: (s) => {
      s.ellipse(8, 8, 6, 6, '#fff4a8');
      s.ellipse(8, 8, 3, 3, '#ff4458');
    },
    airReset: (s) => {
      s.line(3, 11, 8, 3, '#9fd0ff', 2);
      s.line(8, 3, 13, 11, '#9fd0ff', 2);
      s.rect(6, 2, 4, 2, '#ffffff');
    },
    overclock: (s) => {
      s.line(3, 12, 8, 3, '#ffcc44', 2);
      s.line(8, 3, 13, 8, '#ffcc44', 2);
      s.rect(7, 3, 2, 8, '#fff4c8');
    },
    doubleDash: (s) => {
      s.rect(1, 6, 6, 4, '#67f06c');
      s.rect(8, 6, 6, 4, '#d4f28a');
    },
    codeShield: (s) => {
      s.rect(4, 2, 8, 3, '#7af0ff');
      s.rect(3, 5, 10, 8, '#2a6a78');
      s.rect(6, 7, 4, 3, '#e8fdff');
    },
    airSlash: (s) => {
      s.line(2, 12, 13, 3, '#67f06c', 2);
      s.line(4, 12, 14, 6, '#e9ffd8', 1);
    },
    matchaBurst: (s) => {
      s.rect(5, 4, 6, 8, '#f6f3ea');
      s.rect(6, 6, 4, 4, '#86c83e');
      s.px(7, 6, '#d4f28a');
    },
    compileStrike: (s) => {
      s.line(8, 1, 8, 14, '#c45cff', 2);
      s.line(2, 8, 14, 8, '#c45cff', 2);
      s.rect(6, 6, 4, 4, '#f0e8ff');
    },
  };
  const out = {};
  for (const [id, draw] of Object.entries(specs)) {
    const s = makeSurface(16, 16);
    draw(s);
    s.outline('#1a120c');
    out[`icon_${id}`] = s.toCanvas();
  }
  return out;
}
