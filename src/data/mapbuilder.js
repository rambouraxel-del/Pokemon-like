// Petit utilitaire pour construire les cartes par code (deux couches : sol + objets).
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class MapBuilder {
  constructor(w, h, base = '.') {
    this.w = w; this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill(base));
    this.o = Array.from({ length: h }, () => Array(w).fill(' '));
    this.keep = [];          // zones à ne pas encombrer
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  gset(x, y, c) { if (this.inb(x, y)) this.g[y][x] = c; return this; }
  oset(x, y, c) { if (this.inb(x, y)) this.o[y][x] = c; return this; }
  gRect(c, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.gset(i, j, c); return this; }
  oRect(c, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.oset(i, j, c); return this; }
  // chemin : suite de points reliés par des segments axiaux, épaisseur `th`
  path(pts, th = 2, c = 'p') {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      this.gRect(c, Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + th, Math.abs(y2 - y1) + th);
    }
    return this;
  }
  // tache organique d'un type de sol (uniquement sur herbe)
  patch(c, cx, cy, rx, ry, onlyOn = ['.']) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1.05 && this.inb(x, y) && onlyOn.includes(this.g[y][x])) this.g[y][x] = c;
    }
    return this;
  }
  clear(x, y, w, h) { this.keep.push({ x, y, w, h }); return this; }
  kept(x, y) { return this.keep.some((k) => x >= k.x && y >= k.y && x < k.x + k.w && y < k.y + k.h); }
  // bordure d'arbres (épaisseur th) avec trouées [{x1,y1,x2,y2}]
  border(c = 't', th = 2, gaps = []) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (x < th || y < th || x >= this.w - th || y >= this.h - th) {
        if (!gaps.some((g) => x >= g.x1 && x <= g.x2 && y >= g.y1 && y <= g.y2)) this.o[y][x] = c;
      }
    }
    return this;
  }
  // objets aléatoires sur un sol donné
  scatter(c, count, seed, x0 = 0, y0 = 0, x1 = this.w - 1, y1 = this.h - 1, on = ['.', 'f']) {
    const r = rng(seed); let placed = 0, tries = 0;
    while (placed < count && tries++ < count * 40) {
      const x = x0 + Math.floor(r() * (x1 - x0 + 1)), y = y0 + Math.floor(r() * (y1 - y0 + 1));
      if (this.inb(x, y) && this.o[y][x] === ' ' && on.includes(this.g[y][x]) && !this.kept(x, y)) { this.o[y][x] = c; placed++; }
    }
    return this;
  }
  build() { return { w: this.w, h: this.h, ground: this.g.map((r) => r.join('')), obj: this.o.map((r) => r.join('')) }; }
}
