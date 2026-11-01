// Tuiles, objets et bâtiments dessinés par code (16x16 par tuile).
import { Pix, darken, lighten, mix } from './pixel.js';
import { hash2 } from '../core/util.js';

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

export const THEMES = {
  village: { g: ['#82cf5e', '#78c456', '#6cb84e'], tuft: '#5aa442', tuftL: '#a2e478', tall: '#3f9a3a', tallL: '#6cc858', tallD: '#2c7430', path: '#e0c68c', path2: '#d2b87c', pathE: '#b89a62', tree: '#3fa04a', trunk: '#7a5230', bush: '#4cae52', water: ['#4a9ae8', '#5aaaf0', '#7cc4ff'], stone: '#b8b0a8', flowers: ['#ff6a8a', '#fff0a0', '#ffffff', '#b890ff'] },
  forest:  { g: ['#58a050', '#4e9648', '#448c40'], tuft: '#3a7c38', tuftL: '#7cc470', tall: '#2c7a3a', tallL: '#4cac54', tallD: '#1e5a2c', path: '#c2a874', path2: '#b49a68', pathE: '#8c7448', tree: '#2c7a42', trunk: '#6a4628', bush: '#3a8c48', water: ['#3a82c8', '#4a92d8', '#6cb0f0'], stone: '#a0a098', flowers: ['#ff8aa8', '#ffe090', '#e8f0ff', '#c8a0ff'] },
  ruins:   { g: ['#7aa07c', '#70967a', '#668c70'], tuft: '#547a5c', tuftL: '#9cc4a0', tall: '#3c6c58', tallL: '#5c9a7c', tallD: '#2a5242', path: '#b8b0b8', path2: '#aaa2ac', pathE: '#8a828e', tree: '#3a6a5a', trunk: '#5a4a48', bush: '#4a7a60', water: ['#4a78b8', '#5a88c8', '#7ca8e0'], stone: '#a8a4b4', flowers: ['#d8a0ff', '#fff0a0', '#ffffff', '#a0d8ff'] },
};
export const SOLID_GROUND = new Set(['w', 'c', 'W', 'X', 'I', 'D', ' ']);
export const SOLID_OBJ = new Set(['t', 'b', 'r', 'S', 'L', 'F', 'P', 'Y', 'H', 'B', 'E', 'C', 'R', 'Q', 'M', 'N', 'A', 'U', 'O', 'V']);
export const ANIMATED = new Set(['w', 'H', 'N', 'A', 'Y']);
export const isEncounterGround = (ch) => ch === ',';

// ---------- sols ----------
function drawGrass(g, x, y, tx, ty, th, env) {
  const v = Math.floor(hash2(tx, ty, 1) * 3);
  R(g, x, y, 16, 16, th.g[v]);
  const n = 2 + Math.floor(hash2(tx, ty, 2) * 3);
  for (let i = 0; i < n; i++) {
    const px = x + 1 + Math.floor(hash2(tx, ty, 10 + i) * 13), py = y + 2 + Math.floor(hash2(tx, ty, 20 + i) * 12);
    R(g, px, py, 1, 2, th.tuft); R(g, px + 1, py + 1, 1, 1, th.tuft); R(g, px - 1, py, 1, 1, th.tuftL);
  }
  if (env.nb(0, -1) === 'c') { g.fillStyle = 'rgba(30,20,50,0.28)'; g.fillRect(x, y, 16, 5); g.fillStyle = 'rgba(30,20,50,0.14)'; g.fillRect(x, y + 5, 16, 3); }
}
function drawTall(g, x, y, tx, ty, th, env) {
  R(g, x, y, 16, 16, th.tallD);
  for (let c = 0; c < 4; c++) {
    const bx = x + (c % 2) * 8, by = y + Math.floor(c / 2) * 8 + (hash2(tx, ty, c) > 0.5 ? 1 : 0);
    R(g, bx + 1, by + 3, 6, 5, th.tall);
    for (let k = 0; k < 3; k++) { const o = bx + 1 + k * 2; R(g, o, by + 1 + (k % 2), 2, 6, k % 2 ? th.tallL : th.tall); R(g, o, by + 1 + (k % 2), 2, 1, th.tallL); }
  }
}
function drawPath(g, x, y, tx, ty, th, env, grassFn) {
  grassFn();
  const is = (dx, dy) => { const c = env.nb(dx, dy); return c === 'p' || c === '=' || c === 'T' || c == null || c === 'e' ; };
  const l = is(-1, 0) ? 0 : 2, r = is(1, 0) ? 0 : 2, t = is(0, -1) ? 0 : 2, b = is(0, 1) ? 0 : 2;
  R(g, x + l - (l ? 1 : 0), y + t - (t ? 1 : 0), 16 - l - r + (l ? 1 : 0) + (r ? 1 : 0), 16 - t - b + (t ? 1 : 0) + (b ? 1 : 0), th.pathE);
  R(g, x + l, y + t, 16 - l - r, 16 - t - b, hash2(tx, ty, 3) > 0.5 ? th.path : th.path2);
  const n = 3 + Math.floor(hash2(tx, ty, 4) * 3);
  for (let i = 0; i < n; i++) {
    const px = x + 2 + Math.floor(hash2(tx, ty, 30 + i) * 11), py = y + 2 + Math.floor(hash2(tx, ty, 40 + i) * 11);
    R(g, px, py, 1, 1, th.pathE); if (i % 2) R(g, px + 1, py, 1, 1, lighten(th.path, 0.4));
  }
  // coins arrondis (herbe qui mord)
  if (l && t) R(g, x, y, 2, 2, 'rgba(0,0,0,0)');
}
function drawWater(g, x, y, tx, ty, th, env, time) {
  R(g, x, y, 16, 16, th.water[0]);
  const ph = Math.floor(time * 2.2 + hash2(tx, ty) * 4) % 4;
  for (let i = 0; i < 3; i++) {
    const yy = y + 2 + i * 5 + ((ph + i) % 2), xx = x + ((i * 5 + ph * 3 + tx * 7) % 12);
    R(g, xx, yy, 4, 1, th.water[1]); R(g, xx + 1, yy + 1, 2, 1, th.water[2]);
  }
  const isW = (dx, dy) => { const c = env.nb(dx, dy); return c === 'w' || c === '='; };
  g.fillStyle = 'rgba(255,255,255,0.75)';
  if (!isW(0, -1)) { g.fillRect(x, y, 16, 1); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y + 1, 16, 1); g.fillStyle = 'rgba(255,255,255,0.75)'; }
  if (!isW(0, 1)) g.fillRect(x, y + 15, 16, 1);
  if (!isW(-1, 0)) g.fillRect(x, y, 1, 16);
  if (!isW(1, 0)) g.fillRect(x + 15, y, 1, 16);
}
function drawCliff(g, x, y, tx, ty, th, env) {
  const top = env.nb(0, -1) !== 'c';
  R(g, x, y, 16, 16, '#8c7a6a');
  for (let i = 0; i < 4; i++) { R(g, x + i * 4 + 1, y, 1, 16, '#7a6858'); }
  for (let i = 0; i < 3; i++) { const px = x + Math.floor(hash2(tx, ty, 50 + i) * 12) + 1, py = y + 3 + Math.floor(hash2(tx, ty, 60 + i) * 10); R(g, px, py, 3, 1, '#a89684'); R(g, px, py + 1, 1, 2, '#6a5848'); }
  if (top) { R(g, x, y, 16, 3, '#b8a692'); R(g, x, y + 3, 16, 1, '#6a5848'); }
  if (env.nb(0, 1) !== 'c') { R(g, x, y + 12, 16, 4, '#5a4838'); R(g, x, y + 12, 16, 1, '#6a5848'); }
  R(g, x + 15, y, 1, 16, '#5a4838');
}
function drawFlowers(g, x, y, tx, ty, th, env, time) {
  drawGrass(g, x, y, tx, ty, th, env);
  for (let i = 0; i < 3; i++) {
    const px = x + 2 + Math.floor(hash2(tx, ty, 70 + i) * 11), py = y + 3 + Math.floor(hash2(tx, ty, 80 + i) * 10);
    const col = th.flowers[Math.floor(hash2(tx, ty, 90 + i) * 4)];
    R(g, px, py + 1, 1, 2, '#3a8a3a'); R(g, px - 1, py, 3, 1, col); R(g, px, py - 1, 1, 3, col); R(g, px, py, 1, 1, '#ffe070');
  }
}
function drawBridge(g, x, y, tx, ty, th, env) {
  R(g, x, y, 16, 16, th.water[0]);
  R(g, x, y, 16, 16, '#9a6a3a');
  for (let i = 0; i < 4; i++) { R(g, x, y + i * 4 + 3, 16, 1, '#6a4422'); R(g, x + 2 + (i % 2) * 5, y + i * 4 + 1, 4, 1, '#b88850'); }
  const vert = env.nb(0, -1) === 'w' || env.nb(0, 1) === 'w';
  if (vert) { R(g, x, y, 2, 16, '#5a3a1a'); R(g, x + 14, y, 2, 16, '#5a3a1a'); R(g, x + 2, y, 1, 16, '#7a5028'); }
  else { R(g, x, y, 16, 2, '#5a3a1a'); R(g, x, y + 14, 16, 2, '#5a3a1a'); R(g, x, y + 2, 16, 1, '#7a5028'); }
}
function drawStone(g, x, y, tx, ty, th, env) {
  R(g, x, y, 16, 16, th.path); R(g, x, y, 16, 1, th.pathE); R(g, x, y, 1, 16, th.pathE);
  R(g, x + 8, y + 1, 1, 7, th.pathE); R(g, x, y + 8, 16, 1, th.pathE); R(g, x + 4, y + 9, 1, 7, th.pathE);
  const h = hash2(tx, ty, 5);
  if (h > 0.6) { R(g, x + 3, y + 3, 3, 1, th.path2); R(g, x + 11, y + 11, 2, 2, '#7aa07c'); }
  if (h < 0.25) { R(g, x + 10, y + 3, 1, 4, th.pathE); R(g, x + 9, y + 6, 1, 2, th.pathE); }
  R(g, x + 1, y + 1, 6, 1, lighten(th.path, 0.3));
}
// ----- intérieur -----
function drawFloor(g, x, y, tx, ty) {
  R(g, x, y, 16, 16, '#c9985e');
  for (let i = 0; i < 2; i++) { R(g, x, y + i * 8, 16, 1, '#a87a46'); }
  R(g, x + ((ty % 2) ? 5 : 11), y, 1, 8, '#b4864e'); R(g, x + ((ty % 2) ? 12 : 4), y + 8, 1, 8, '#b4864e');
  R(g, x + 2, y + 2, 5, 1, '#d8a870'); R(g, x + 9, y + 11, 4, 1, '#d8a870');
}
function drawCarpet(g, x, y, tx, ty) {
  R(g, x, y, 16, 16, '#b8484e'); R(g, x + 1, y + 1, 14, 14, '#c85a5e');
  R(g, x + 3, y + 3, 10, 10, '#b8484e'); R(g, x + 7, y + 7, 2, 2, '#f0d890'); R(g, x + 4, y + 4, 1, 1, '#f0d890'); R(g, x + 11, y + 11, 1, 1, '#f0d890');
}
function drawMat(g, x, y) { drawFloor(g, x, y, 0, 0); R(g, x + 1, y + 3, 14, 11, '#7a5a8a'); R(g, x + 2, y + 4, 12, 9, '#9a7aaa'); R(g, x + 5, y + 7, 6, 3, '#d8c0e8'); }
function drawWall(g, x, y, tx, ty, env, window_) {
  R(g, x, y, 16, 16, '#efe0c4'); R(g, x, y, 16, 3, '#9a7a5a'); R(g, x, y + 3, 16, 1, '#7a5a3e');
  R(g, x, y + 12, 16, 4, '#a8825a'); R(g, x, y + 12, 16, 1, '#c8a47a'); R(g, x, y + 15, 16, 1, '#7a5a3a');
  for (let i = 0; i < 4; i++) R(g, x + 2 + i * 4, y + 6, 1, 4, '#e0cfae');
  if (window_) { R(g, x + 3, y + 4, 10, 9, '#6a4a2a'); R(g, x + 4, y + 5, 8, 7, '#a8e0ff'); R(g, x + 4, y + 5, 8, 3, '#d0f0ff'); R(g, x + 7, y + 5, 1, 7, '#6a4a2a'); R(g, x + 4, y + 8, 8, 1, '#6a4a2a'); }
}
function drawDark(g, x, y, tx, ty) {
  R(g, x, y, 16, 16, '#3a3858'); R(g, x, y + 15, 16, 1, '#24223c');
  for (let r = 0; r < 4; r++) { R(g, x, y + r * 4 + 3, 16, 1, '#2a2844'); const o = (r % 2) * 5 + 2; R(g, x + o, y + r * 4, 1, 4, '#2a2844'); R(g, x + o + 8, y + r * 4, 1, 4, '#2a2844'); }
  R(g, x, y, 16, 2, '#5a5880'); if (hash2(tx, ty, 9) > 0.7) { R(g, x + 6, y + 6, 4, 1, '#6ae8ff'); R(g, x + 7, y + 4, 2, 5, '#6ae8ff'); }
}
function drawBorder(g, x, y) { R(g, x, y, 16, 16, '#5a3e2a'); R(g, x, y, 16, 2, '#7a5a3e'); R(g, x + 4, y + 2, 1, 14, '#4a3222'); R(g, x + 11, y + 2, 1, 14, '#4a3222'); }

export function drawGround(g, ch, px, py, tx, ty, theme, env, time = 0) {
  const th = THEMES[theme] || THEMES.village;
  const grass = () => drawGrass(g, px, py, tx, ty, th, env);
  switch (ch) {
    case '.': grass(); break;
    case ',': drawTall(g, px, py, tx, ty, th, env); break;
    case 'p': drawPath(g, px, py, tx, ty, th, env, grass); break;
    case 'w': drawWater(g, px, py, tx, ty, th, env, time); break;
    case 'c': drawCliff(g, px, py, tx, ty, th, env); break;
    case 'f': drawFlowers(g, px, py, tx, ty, th, env, time); break;
    case '=': drawBridge(g, px, py, tx, ty, th, env); break;
    case 'T': drawStone(g, px, py, tx, ty, th, env); break;
    case '_': drawFloor(g, px, py, tx, ty); break;
    case 'k': drawCarpet(g, px, py, tx, ty); break;
    case 'e': drawMat(g, px, py); break;
    case 'W': drawWall(g, px, py, tx, ty, env, false); break;
    case 'X': drawWall(g, px, py, tx, ty, env, true); break;
    case 'I': drawBorder(g, px, py); break;
    case 'D': drawDark(g, px, py, tx, ty); break;
    default: R(g, px, py, 16, 16, '#101018');
  }
}
// herbe haute dessinée AU-DESSUS des personnages (moitié basse) pour l'effet de profondeur
export function drawTallFront(g, px, py, th) {
  const t = THEMES[th] || THEMES.village;
  for (let k = 0; k < 4; k++) { R(g, px + 1 + k * 4, py + 9, 2, 7, k % 2 ? t.tall : t.tallL); R(g, px + 2 + k * 4, py + 8, 1, 2, t.tallL); }
  R(g, px, py + 13, 16, 3, t.tall); R(g, px, py + 13, 16, 1, t.tallL);
}

// ---------- objets (sprites mis en cache) ----------
const objCache = {};
function mk(key, w, h, fn) {
  if (objCache[key]) return objCache[key];
  const p = new Pix(w, h); fn(p);
  return (objCache[key] = p.toCanvas());
}
const OUT = '#241838';
export function objectSprite(ch, theme) {
  const th = THEMES[theme] || THEMES.village;
  switch (ch) {
    case 't': return { c: mk('t' + theme, 26, 38, (p) => {
      p.rect(11, 26, 4, 10, th.trunk); p.rect(15, 28, 1, 8, darken(th.trunk, 0.3), { flat: true });
      p.blob([['ell', 13, 13, 11.5, 12], ['ell', 6, 19, 6.5, 6.5], ['ell', 20, 19, 6.5, 6.5]], th.tree);
      p.dot(8, 9, lighten(th.tree, 0.5), 1.2); p.dot(15, 5, lighten(th.tree, 0.5), 1);
      p.outline(OUT);
    }), ox: -5 };
    case 'b': return { c: mk('b' + theme, 16, 14, (p) => { p.blob([['ell', 8, 8, 7, 5.5], ['ell', 4, 9, 3.5, 3.5], ['ell', 12, 9, 3.5, 3.5]], th.bush); p.dot(6, 6, '#ff6a8a', 0.8); p.dot(11, 8, '#ff6a8a', 0.8); p.outline(OUT); }), ox: 0, oy: 1 };
    case 'r': return { c: mk('r' + theme, 16, 14, (p) => { p.poly([[2, 13], [1, 8], [5, 3], [11, 2], [15, 7], [14, 13]], '#9a9aa8'); p.poly([[5, 4], [10, 3], [9, 6], [5, 7]], '#c8c8d4', { flat: true }); p.outline(OUT); }), ox: 0, oy: 1 };
    case 'S': return { c: mk('S', 16, 20, (p) => { p.rect(7, 10, 2, 9, '#7a5230'); p.rect(1, 2, 14, 9, '#c89a5a'); p.rect(2, 3, 12, 1, '#e8c07a', { flat: true }); p.rect(3, 5, 10, 1, '#7a5230', { flat: true }); p.rect(3, 7, 7, 1, '#7a5230', { flat: true }); p.outline(OUT); }), ox: 0, oy: -4 };
    case 'L': return { c: mk('L', 16, 34, (p) => { p.rect(7, 12, 2, 20, '#3a4054'); p.rect(4, 30, 8, 3, '#2a3044'); p.rect(4, 3, 8, 9, '#ffe9a0'); p.rect(3, 1, 10, 3, '#3a4054'); p.rect(3, 11, 10, 2, '#3a4054'); p.rect(6, 5, 4, 5, '#fff8d8', { flat: true }); p.outline(OUT); }), ox: 0, oy: -18, glow: true };
    case 'F': return { c: mk('F', 16, 16, (p) => { p.rect(0, 5, 16, 2, '#d8b078', { flat: true }); p.rect(0, 10, 16, 2, '#d8b078', { flat: true }); p.rect(1, 2, 3, 13, '#b88a50'); p.rect(12, 2, 3, 13, '#b88a50'); p.outline(OUT); }), ox: 0, oy: 0 };
    case 'P': return { c: mk('P' + theme, 20, 38, (p) => { p.rect(2, 2, 16, 5, '#c8c4d4'); p.rect(4, 7, 12, 25, '#aeaabc'); p.rect(2, 31, 16, 6, '#c8c4d4'); p.rect(7, 9, 1, 20, '#c8c4d4', { flat: true }); p.rect(12, 9, 1, 20, '#8a869a', { flat: true }); p.rect(8, 14, 4, 1, '#7a9a8a', { flat: true }); p.outline(OUT); }), ox: -2, oy: -22 };
    case 'Y': return { c: mk('Y', 18, 30, (p) => { p.poly([[2, 29], [3, 7], [9, 1], [15, 7], [16, 29]], '#9a98b4'); p.rect(8, 8, 2, 8, '#8af0ff', { flat: true }); p.rect(6, 11, 6, 2, '#8af0ff', { flat: true }); p.rect(8, 19, 2, 3, '#8af0ff', { flat: true }); p.outline(OUT); }), ox: -1, oy: -14, glow: 'rune' };
    case 'H': return { c: mk('H', 20, 22, (p) => { p.ell(10, 15, 9.5, 6, '#c8c4d4'); p.ell(10, 14, 7.5, 4.5, '#6ac8ff', { flat: true }); p.rect(8, 3, 4, 9, '#c8c4d4'); p.ell(10, 3, 4, 2, '#9ae8ff'); p.outline(OUT); }), ox: -2, oy: -6, glow: 'spring' };
    case 'B': return { c: mk('B', 16, 24, (p) => { p.rect(1, 2, 14, 21, '#8a5a3a'); p.rect(2, 3, 12, 6, '#f8f0e0'); p.rect(2, 3, 12, 2, '#ffffff', { flat: true }); p.rect(2, 10, 12, 12, '#5a8ad0'); p.rect(2, 10, 12, 2, '#7aaaf0', { flat: true }); p.outline(OUT); }), ox: 0, oy: -8 };
    case 'E': return { c: mk('E', 16, 18, (p) => { p.rect(1, 3, 14, 7, '#d8a468'); p.rect(2, 10, 2, 7, '#8a5a30'); p.rect(12, 10, 2, 7, '#8a5a30'); p.rect(3, 4, 4, 2, '#f0d090', { flat: true }); p.rect(9, 5, 4, 3, '#fff', { flat: true }); p.outline(OUT); }), ox: 0, oy: -2 };
    case 'C': return { c: mk('C', 16, 20, (p) => { p.rect(0, 2, 16, 8, '#e8c088'); p.rect(0, 9, 16, 10, '#a8723c'); p.rect(2, 11, 5, 6, '#8a5a2c', { flat: true }); p.rect(9, 11, 5, 6, '#8a5a2c', { flat: true }); p.rect(0, 2, 16, 1, '#fff0c8', { flat: true }); p.outline(OUT); }), ox: 0, oy: -4 };
    case 'R': return { c: mk('R', 16, 28, (p) => { p.rect(0, 0, 16, 27, '#8a5a30'); p.rect(1, 1, 14, 25, '#6a4220', { flat: true }); [3, 11, 19].forEach((yy, k) => { p.rect(1, yy + 5, 14, 2, '#a87a48', { flat: true }); for (let i = 0; i < 5; i++) p.rect(2 + i * 3, yy, 2, 5, ['#c8504a', '#4a78c8', '#e0c04a', '#58a858', '#a860c0'][(i + k * 2) % 5], { flat: true }); }); p.outline(OUT); }), ox: 0, oy: -12 };
    case 'Q': return { c: mk('Q', 16, 22, (p) => { p.blob([['ell', 8, 7, 7, 6], ['ell', 4, 10, 4, 4], ['ell', 12, 10, 4, 4]], '#4cae52'); p.rect(4, 14, 8, 7, '#c8643a'); p.rect(3, 14, 10, 2, '#e07a4a', { flat: true }); p.outline(OUT); }), ox: 0, oy: -6 };
    case 'M': return { c: mk('M', 16, 26, (p) => { p.rect(0, 4, 16, 21, '#e8e8f0'); p.rect(2, 6, 12, 7, '#2a3a5a'); p.rect(3, 7, 10, 5, '#8af0d0', { flat: true }); p.rect(6, 15, 4, 6, '#f06a8a', { flat: true }); p.rect(7, 16, 2, 4, '#fff', { flat: true }); p.rect(5, 17, 6, 2, '#fff', { flat: true }); p.outline(OUT); }), ox: 0, oy: -10 };
    case 'N': return { c: mk('N', 16, 22, (p) => { p.rect(3, 10, 10, 11, '#b8b4c8'); p.rect(1, 8, 14, 4, '#d8d4e8'); p.rect(4, 12, 8, 1, '#8a869a', { flat: true }); p.outline(OUT); }), ox: 0, oy: -6 };
    case 'A': return { c: mk('A', 32, 26, (p) => { p.rect(2, 8, 28, 16, '#aeaabc'); p.rect(0, 5, 32, 5, '#d8d4e8'); p.rect(12, 10, 8, 11, '#5a5470', { flat: true }); p.rect(13, 1, 6, 5, '#8a869a', { flat: true }); p.outline(OUT); }), ox: 0, oy: -10 };
    case 'U': return { c: mk('U', 16, 16, (p) => { p.rect(1, 2, 14, 13, '#a87a48'); p.rect(1, 2, 14, 2, '#c89a68', { flat: true }); p.rect(1, 8, 14, 1, '#6a4a28', { flat: true }); p.rect(7, 2, 2, 13, '#6a4a28', { flat: true }); p.outline(OUT); }), ox: 0, oy: 0 };
    case 'O': return { c: mk('O', 16, 18, (p) => { p.ell(8, 11, 7, 6, '#8a6a4a'); p.rect(2, 4, 12, 4, '#a8825a'); p.rect(1, 8, 14, 1, '#4a3a2a', { flat: true }); p.rect(1, 12, 14, 1, '#4a3a2a', { flat: true }); p.outline(OUT); }), ox: 0, oy: -2 };
    case 'V': return { c: mk('V', 16, 22, (p) => { p.rect(1, 4, 14, 14, '#4a5470'); p.rect(2, 5, 12, 9, '#1a2438', { flat: true }); p.rect(3, 6, 10, 7, '#6ae8c0', { flat: true }); p.rect(3, 6, 10, 1, '#c0fff0', { flat: true }); p.rect(5, 18, 6, 3, '#3a4258'); p.outline(OUT); }), ox: 0, oy: -6 };
    default: return null;
  }
}
// ombre portée au pied des objets hauts
export function drawObjectShadow(g, ch, px, py) {
  if (ch === 't') { g.fillStyle = 'rgba(20,40,20,0.3)'; g.beginPath(); g.ellipse(px + 8, py + 14, 10, 4, 0, 0, 6.3); g.fill(); }
  else if (ch === 'b' || ch === 'r' || ch === 'P' || ch === 'L') { g.fillStyle = 'rgba(20,20,40,0.22)'; g.beginPath(); g.ellipse(px + 8, py + 14, 7, 2.5, 0, 0, 6.3); g.fill(); }
}

// ---------- bâtiments ----------
const bCache = {};
export function buildingSprite(spec) {
  const key = JSON.stringify(spec);
  if (bCache[key]) return bCache[key];
  const W = spec.w * 16, Hh = spec.h * 16, CH = Hh + 16, SW = 7, FW = W - SW;
  const p = new Pix(W, CH);
  const RH = Math.round(Hh * 0.52) + 12;                    // bas du toit
  const wall = spec.wall, roof = spec.roof, trim = spec.trim || '#f4ecd8';
  // mur latéral (volume)
  p.poly([[FW, RH], [W, RH - 6], [W, CH - 6], [FW, CH]], darken(wall, 0.28), { flat: true });
  // mur de face
  p.rect(2, RH, FW - 3, CH - RH, wall, { flat: true });
  for (let y = RH + 4; y < CH - 6; y += 5) p.rect(2, y, FW - 3, 1, darken(wall, 0.08), { flat: true });
  p.rect(2, CH - 5, FW - 3, 5, spec.base || '#8a8498', { flat: true });
  p.rect(2, CH - 5, FW - 3, 1, lighten(spec.base || '#8a8498', 0.3), { flat: true });
  p.rect(2, RH, FW - 3, 3, darken(wall, 0.45), { flat: true });           // ombre sous l'avant-toit
  // toit : pan avant (trapèze) + pan latéral
  p.poly([[FW, RH], [W, RH - 6], [W - 6, 9], [FW - 9, 5]], darken(roof, 0.28), { flat: true });
  p.poly([[-0, RH + 1], [FW + 1, RH + 1], [FW - 9, 5], [9, 5]], roof, { flat: true });
  for (let y = 8, i = 0; y < RH; y += 4, i++) {
    const inset = Math.round(((RH - y) / RH) * -0.0);
    p.rect(Math.max(1, 9 - Math.round((y - 5) * 0.02)) - 0, y, FW - 18 + Math.round((y - 5) * 0.43) * 2 - 0, 1, darken(roof, 0.28), { flat: true });
    for (let x = (i % 2) * 3 + 10; x < FW - 8; x += 6) p.rect(x, y + 1, 1, 3, darken(roof, 0.18), { flat: true });
  }
  // bandes sombres (cache les bords du trapèze au-delà)
  p.rect(9, 5, FW - 18, 3, lighten(roof, 0.45), { flat: true });         // faîtage
  p.rect(9, 7, FW - 18, 1, darken(roof, 0.3), { flat: true });
  // rebord blanc de toit
  p.rect(0, RH - 1, FW + 1, 3, trim, { flat: true });
  p.rect(0, RH + 2, FW + 1, 1, darken(trim, 0.3), { flat: true });
  // emblème
  const cx = Math.round(FW / 2), ey = Math.round(RH / 2) + 3;
  if (spec.emblem === 'cross') { p.rect(cx - 2, ey - 6, 5, 13, '#f8f8f8', { flat: true }); p.rect(cx - 6, ey - 2, 13, 5, '#f8f8f8', { flat: true }); p.rect(cx - 1, ey - 5, 3, 11, '#e84a5a', { flat: true }); p.rect(cx - 5, ey - 1, 11, 3, '#e84a5a', { flat: true }); }
  if (spec.emblem === 'coin') { p.ell(cx, ey, 7, 7, '#ffd84a'); p.rect(cx - 1, ey - 4, 3, 9, '#b88a1a', { flat: true }); }
  if (spec.emblem === 'lab') { p.ell(cx, ey, 7, 7, '#e8f4ff'); p.ell(cx, ey, 4.5, 4.5, '#6ac8ff', { flat: true }); p.dot(cx - 1, ey - 1, '#fff', 1); }
  if (spec.emblem === 'chimney') { p.rect(FW - 18, 0, 6, 12, '#a8624a'); p.rect(FW - 19, 0, 8, 2, '#c8826a', { flat: true }); }
  // porte
  const dx = spec.door * 16 + 2;
  const dh = 22;
  p.rect(dx - 1, CH - dh - 1, 14, dh + 1, trim, { flat: true });
  p.rect(dx, CH - dh, 12, dh, spec.doorC || '#7a4a2a', { flat: true });
  p.rect(dx + 1, CH - dh + 1, 10, 7, '#a8e0ff', { flat: true }); p.rect(dx + 1, CH - dh + 1, 10, 2, '#e0f8ff', { flat: true });
  p.rect(dx + 5, CH - dh + 1, 1, 7, '#7a4a2a', { flat: true });
  p.rect(dx + 9, CH - 11, 2, 2, '#ffd84a', { flat: true });
  p.rect(dx - 1, CH - 2, 14, 2, '#c8c4d4', { flat: true });
  // auvent (boutique)
  if (spec.awning) {
    for (let i = 0; i < 14; i++) p.rect(dx - 8 + i * 2, CH - dh - 6, 2, 7, i % 2 ? '#f8f8f8' : '#e84a5a', { flat: true });
    p.rect(dx - 8, CH - dh + 1, 28, 1, '#a82a3a', { flat: true });
  }
  // fenêtres
  for (const wc of spec.windows || []) {
    const wx = wc * 16 + 3, wy = RH + 8;
    p.rect(wx - 1, wy - 1, 12, 12, trim, { flat: true });
    p.rect(wx, wy, 10, 10, '#6ab8f0', { flat: true }); p.rect(wx, wy, 10, 3, '#bfe8ff', { flat: true });
    p.rect(wx + 4, wy, 1, 10, trim, { flat: true }); p.rect(wx, wy + 4, 10, 1, trim, { flat: true });
    p.rect(wx - 1, wy + 11, 12, 2, '#b86a4a', { flat: true });
    p.dot(wx + 2, wy + 12, '#ff6a8a', 0.7);
  }
  p.outline(OUT);
  const c = p.toCanvas();
  return (bCache[key] = c);
}
export const BUILDING_OFFSET_Y = 16;
