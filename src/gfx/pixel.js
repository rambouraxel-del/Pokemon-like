// Mini-moteur de pixel art procédural : formes remplies avec ombrage "cel" automatique + contour.
export function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export const lighten = (c, t = 0.3) => mix(c, '#ffffff', t);
export const darken = (c, t = 0.3) => mix(c, '#1a1038', t);

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (this.inb(x, y)) this.d[y * this.w + x] = c; }
  get(x, y) { return this.inb(x, y) ? this.d[y * this.w + x] : null; }
  // --- masques ---
  maskEll(cx, cy, rx, ry) {
    const m = new Set();
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && this.inb(x, y)) m.add(y * this.w + x);
      }
    return m;
  }
  maskPoly(pts) {
    const m = new Set();
    let minY = 1e9, maxY = -1e9;
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const yy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= yy && y2 > yy) || (y2 <= yy && y1 > yy)) xs.push(x1 + ((yy - y1) / (y2 - y1)) * (x2 - x1));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) if (this.inb(x, y)) m.add(y * this.w + x);
    }
    return m;
  }
  maskRect(x, y, w, h) {
    const m = new Set();
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) m.add(j * this.w + i);
    return m;
  }
  maskLine(x0, y0, x1, y1, th = 1) {
    const m = new Set(), n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) { const px = Math.round(x - th / 2 + a + 0.5), py = Math.round(y - th / 2 + b + 0.5); if (this.inb(px, py)) m.add(py * this.w + px); }
    }
    return m;
  }
  // remplit un masque avec ombrage automatique (lumière en haut à gauche)
  fill(mask, col, o = {}) {
    if (!mask.size) return this;
    const W = this.w;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const i of mask) { const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = Math.max(1, (x1 - x0 + 1) / 2), hy = Math.max(1, (y1 - y0 + 1) / 2);
    const hi = o.hi || lighten(col, 0.38), sh = o.sh || darken(col, 0.32);
    const thick = Math.max(1, Math.min(3, Math.round(Math.min(hx, hy) * 0.3)));
    const dist = (x, y, dx, dy, max) => { for (let k = 1; k <= max; k++) if (!mask.has((y + dy * k) * W + x + dx * k)) return k; return max + 1; };
    for (const i of mask) {
      const x = i % W, y = (i / W) | 0;
      let c = col;
      if (!o.flat) {
        const nx = (x + 0.5 - cx) / hx, ny = (y + 0.5 - cy) / hy;
        const l = -0.55 * nx - 0.8 * ny;
        const rimS = dist(x, y, 1, 0, thick) <= thick - (thick > 1 ? 1 : 0) || dist(x, y, 0, 1, thick) <= thick;
        const rimL = dist(x, y, -1, 0, 1) <= 1 || dist(x, y, 0, -1, 1) <= 1;
        if (l < -0.5 || (rimS && l < 0.3)) c = sh;
        else if (l > 0.5 || (rimL && l > -0.2)) c = hi;
      }
      this.d[i] = c;
    }
    return this;
  }
  ell(cx, cy, rx, ry, col, o) { return this.fill(this.maskEll(cx, cy, rx, ry), col, o); }
  poly(pts, col, o) { return this.fill(this.maskPoly(pts), col, o); }
  rect(x, y, w, h, col, o) { return this.fill(this.maskRect(x, y, w, h), col, o); }
  line(x0, y0, x1, y1, col, th = 1) { return this.fill(this.maskLine(x0, y0, x1, y1, th), col, { flat: true }); }
  // union de formes avec un seul ombrage : shapes = [['ell',cx,cy,rx,ry],['poly',pts],['rect',x,y,w,h]]
  blob(shapes, col, o) {
    const m = new Set();
    for (const s of shapes) {
      const part = s[0] === 'ell' ? this.maskEll(...s.slice(1)) : s[0] === 'poly' ? this.maskPoly(s[1]) : this.maskRect(...s.slice(1));
      for (const i of part) m.add(i);
    }
    return this.fill(m, col, o);
  }
  dot(x, y, col, r = 0.5) { return this.fill(this.maskEll(x, y, r, r), col, { flat: true }); }
  // contour sombre (4-voisins)
  outline(col = '#1c1430') {
    const out = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) out.push([x, y]);
    }
    for (const [x, y] of out) this.set(x, y, col);
    return this;
  }
  toCanvas() {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    const g = c.getContext('2d'); const img = g.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const col = this.d[i]; if (!col) continue;
      const [r, gg, b] = hexToRgb(col); img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }
}
export const mirrorPts = (pts, cx = 32) => pts.map(([x, y]) => [2 * cx - x, y]);
