export function makeSurface(w, h) {
  const bytes = new Uint8ClampedArray(w * h * 4);
  const api = {
    w,
    h,
    bytes,
    px(x, y, hex) {
      x |= 0;
      y |= 0;
      if (!hex || x < 0 || y < 0 || x >= w || y >= h) return;
      const n = typeof hex === 'number' ? hex : Number.parseInt(hex.slice(1), 16);
      const i = (y * w + x) * 4;
      bytes[i] = (n >> 16) & 255;
      bytes[i + 1] = (n >> 8) & 255;
      bytes[i + 2] = n & 255;
      bytes[i + 3] = 255;
    },
    opaque(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      return bytes[(y * w + x) * 4 + 3] > 0;
    },
    rect(x, y, rw, rh, hex) {
      for (let yy = 0; yy < rh; yy++) {
        for (let xx = 0; xx < rw; xx++) api.px(x + xx, y + yy, hex);
      }
    },
    ellipse(cx, cy, rx, ry, hex) {
      const rrx = Math.max(1, rx);
      const rry = Math.max(1, ry);
      for (let y = -rry; y <= rry; y++) {
        for (let x = -rrx; x <= rrx; x++) {
          if ((x * x) / (rrx * rrx) + (y * y) / (rry * rry) <= 1) api.px(cx + x, cy + y, hex);
        }
      }
    },
    line(x0, y0, x1, y1, hex, width = 1) {
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= steps; i++) {
        const x = Math.round(x0 + ((x1 - x0) * i) / steps);
        const y = Math.round(y0 + ((y1 - y0) * i) / steps);
        for (let oy = 0; oy < width; oy++) {
          for (let ox = 0; ox < width; ox++) api.px(x + ox - ((width / 2) | 0), y + oy - ((width / 2) | 0), hex);
        }
      }
    },
    outline(hex) {
      const mark = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (api.opaque(x, y)) continue;
          if (api.opaque(x - 1, y) || api.opaque(x + 1, y) || api.opaque(x, y - 1) || api.opaque(x, y + 1)) {
            mark.push(x, y);
          }
        }
      }
      for (let i = 0; i < mark.length; i += 2) api.px(mark[i], mark[i + 1], hex);
    },
    stamp(rows, ox, oy, map) {
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const col = map[row[x]];
          if (col) api.px(ox + x, oy + y, col);
        }
      });
    },
    hash() {
      let hsh = 2166136261;
      for (let i = 0; i < bytes.length; i += 13) {
        hsh ^= bytes[i];
        hsh = Math.imul(hsh, 16777619);
      }
      return hsh >>> 0;
    },
    toCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(new ImageData(bytes, w, h), 0, 0);
      return canvas;
    },
  };
  return api;
}

export function hex(n) {
  return n;
}
