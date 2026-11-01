// Sprites des huit espèces, dessinés par code (64x64). Deux vues : 'front' (adversaire) et 'back' (équipe du joueur).
import { Pix, mirrorPts, lighten, darken } from './pixel.js';

const DARK = '#241838';
const eyeFront = (p, x, y, r = 2.6, col = DARK) => {   // œil rond brillant
  p.ell(x, y, r * 0.95, r * 1.15, '#ffffff', { flat: true });
  p.ell(x + 0.2, y + 0.4, r * 0.62, r * 0.85, col, { flat: true });
  p.dot(x - 0.4, y - 0.6, '#ffffff', 0.8);
};

function feuillin(p, front) {
  const G = '#66c466', GD = '#3f9a52', CR = '#f4f0b8';
  p.ell(23, 55, 5.5, 3, GD); p.ell(41, 55, 5.5, 3, GD);
  p.ell(15, 44, 3.5, 5.5, GD); p.ell(49, 44, 3.5, 5.5, GD);
  p.blob([['ell', 32, 45, 15, 12], ['ell', 32, 30, 16.5, 14]], G);
  if (front) p.ell(32, 47, 9, 8, CR);
  // feuilles
  p.poly([[31, 18], [28, 11], [21, 5], [11, 7], [14, 15], [23, 19]], '#92e07c');
  p.poly([[33, 18], [36, 10], [44, 3], [54, 6], [51, 15], [41, 19]], '#46a45a');
  p.line(30, 17, 15, 9, '#4fa85a'); p.line(34, 17, 50, 8, '#2f7e46');
  p.rect(31, 13, 2, 6, '#3a8c4c', { flat: true });
  if (front) {
    eyeFront(p, 25.5, 30, 3); eyeFront(p, 38.5, 30, 3);
    p.ell(20, 36, 3, 2, '#f59aa6', { flat: true }); p.ell(44, 36, 3, 2, '#f59aa6', { flat: true });
    p.rect(30, 37, 4, 1, DARK, { flat: true }); p.set(29, 36, DARK); p.set(34, 36, DARK);
  } else {
    p.ell(32, 54, 5, 3.5, '#92e07c');
  }
}

function braisillon(p, front) {
  const O = '#f08a3a', OD = '#c4561e', CR = '#fdebc8';
  // queue enflammée
  p.blob([['ell', 51, 42, 6, 11], ['ell', 47, 52, 6, 4]], O);
  p.poly([[44, 34], [43, 22], [49, 28], [52, 12], [57, 27], [61, 21], [58, 36]], '#ff5a2a');
  p.poly([[49, 34], [48, 27], [52, 19], [55, 28], [55, 34]], '#ffd23c', { flat: true });
  // pattes
  p.ell(23, 56, 4.5, 3, OD); p.ell(37, 56, 4.5, 3, OD);
  p.ell(30, 45, 13, 12, O);
  if (front) p.ell(30, 48, 6.5, 8, CR);
  // oreilles
  p.poly([[19, 24], [16, 6], [28, 17]], O); p.poly([[34, 17], [45, 6], [43, 25]], O);
  p.poly([[20, 21], [19, 11], [26, 18]], '#ffc3a0', { flat: true }); p.poly([[36, 18], [42, 11], [41, 22]], '#ffc3a0', { flat: true });
  p.ell(30, 29, 13.5, 11, O);
  if (front) {
    p.ell(30, 33, 7.5, 5.5, CR);
    p.ell(30, 31, 2.2, 1.5, DARK, { flat: true });
    eyeFront(p, 24, 27, 2.5); eyeFront(p, 36, 27, 2.5);
    p.rect(29, 33, 2, 1, DARK, { flat: true });
  } else {
    p.ell(30, 52, 5, 3, lighten(O, 0.25));
  }
}

function gouttelin(p, front) {
  const B = '#4f9be8', CR = '#d8f2ff';
  p.ell(21, 55, 6, 3, darken(B, 0.2)); p.ell(43, 55, 6, 3, darken(B, 0.2));
  p.blob([['ell', 32, 42, 18, 14], ['poly', [[32, 6], [21, 24], [43, 24]]], ['ell', 32, 27, 13, 12]], B);
  // nageoires
  p.poly([[16, 38], [5, 44], [8, 52], [18, 48]], darken(B, 0.1));
  p.poly([[48, 38], [59, 44], [56, 52], [46, 48]], darken(B, 0.1));
  if (front) {
    p.ell(32, 47, 11, 9, CR);
    eyeFront(p, 25, 34, 3, '#1a3868'); eyeFront(p, 39, 34, 3, '#1a3868');
    p.rect(29, 40, 6, 1, DARK, { flat: true }); p.rect(30, 41, 4, 1, '#e86a80', { flat: true });
    p.ell(19, 40, 2.5, 1.8, '#a8d8ff', { flat: true }); p.ell(45, 40, 2.5, 1.8, '#a8d8ff', { flat: true });
  } else {
    p.poly([[26, 52], [32, 60], [38, 52]], darken(B, 0.1));
  }
  p.dot(27, 16, '#ffffff', 1.4); p.dot(25, 20, '#ffffff', 0.8);
}

function plumette(p, front) {
  const T = '#d8a064', TD = '#a8703a', CR = '#fbf0d0';
  if (!front) p.poly([[24, 50], [20, 62], [32, 58], [44, 62], [40, 50]], TD);
  p.line(26, 56, 26, 61, '#f0a030', 2); p.line(38, 56, 38, 61, '#f0a030', 2);
  p.line(22, 61, 30, 61, '#f0a030', 1); p.line(34, 61, 42, 61, '#f0a030', 1);
  p.blob([['ell', 32, 40, 17, 16], ['ell', 32, 30, 15, 13]], T);
  if (front) p.ell(32, 46, 10.5, 10, CR);
  // ailes
  p.poly([[17, 32], [6, 42], [8, 54], [20, 50], [19, 40]], TD);
  p.poly([[47, 32], [58, 42], [56, 54], [44, 50], [45, 40]], TD);
  // houppe
  p.poly([[28, 18], [26, 7], [31, 15]], '#e8b878', { flat: true }); p.poly([[31, 18], [33, 4], [36, 17]], '#e8b878', { flat: true }); p.poly([[35, 18], [40, 8], [39, 19]], '#e8b878', { flat: true });
  if (front) {
    p.poly([[29, 31], [35, 31], [32, 37]], '#ffc040', { flat: true });
    p.line(29, 31, 35, 31, '#d08a1a');
    eyeFront(p, 24.5, 27, 3); eyeFront(p, 39.5, 27, 3);
    p.ell(19, 33, 2.5, 1.8, '#f59aa6', { flat: true }); p.ell(45, 33, 2.5, 1.8, '#f59aa6', { flat: true });
  }
}

function ronceau(p, front) {
  const BR = '#a8724c', SK = '#ecc99a', GR = '#3c9a50';
  p.ell(23, 56, 5, 3, '#7a4a30'); p.ell(41, 56, 5, 3, '#7a4a30');
  // épines (arrière)
  const spikes = [];
  for (let a = 200; a <= 340; a += 14) {
    const r = (a * Math.PI) / 180, cx = 32 + Math.cos(r) * 16, cy = 40 + Math.sin(r) * 14, L = 10;
    const tx = 32 + Math.cos(r) * (16 + L), ty = 40 + Math.sin(r) * (14 + L);
    const px = -Math.sin(r) * 4, py = Math.cos(r) * 4;
    spikes.push([[cx - px, cy - py], [tx, ty], [cx + px, cy + py]]);
  }
  spikes.forEach((s, i) => p.poly(s, i % 2 ? '#2f8a48' : '#58b860'));
  p.blob([['ell', 32, 42, 17, 14]], BR);
  if (front) {
    p.ell(32, 45, 11.5, 10, SK);
    p.ell(32, 43, 2, 1.5, '#6a3040', { flat: true });
    eyeFront(p, 26, 39, 2.2); eyeFront(p, 38, 39, 2.2);
    p.rect(30, 47, 4, 1, DARK, { flat: true });
    p.ell(21, 31, 3.4, 3.4, BR);
    p.ell(43, 31, 3.4, 3.4, BR);
  } else {
    for (let a = 215; a <= 330; a += 22) { const r = (a * Math.PI) / 180; p.poly([[32 + Math.cos(r) * 8 - 3, 42 + Math.sin(r) * 7], [32 + Math.cos(r) * 20, 42 + Math.sin(r) * 17], [32 + Math.cos(r) * 8 + 3, 42 + Math.sin(r) * 7]], '#58b860'); }
  }
  // fleur
  p.poly([[32, 14], [29, 18], [32, 21], [35, 18]], '#f05a8a', { flat: true });
  p.ell(32, 17.5, 1.6, 1.6, '#ffe070', { flat: true });
}

function noctule(p, front) {
  const P = '#7050b8', PD = '#4a3488', LI = '#c8b4f0';
  // ailes (gauche puis miroir)
  const wl = [[23, 36], [10, 22], [2, 26], [3, 38], [9, 36], [10, 46], [16, 43], [19, 52], [25, 46]];
  p.poly(wl, PD); p.poly(mirrorPts(wl), PD);
  const wi = [[22, 38], [11, 27], [6, 31], [7, 38], [12, 38], [15, 44], [21, 44]];
  p.poly(wi, lighten(PD, 0.18), { flat: true }); p.poly(mirrorPts(wi), lighten(PD, 0.18), { flat: true });
  p.ell(27, 57, 3, 2, PD); p.ell(37, 57, 3, 2, PD);
  p.ell(32, 43, 10, 12, P);
  if (front) p.ell(32, 46, 6, 8, LI);
  // oreilles
  p.poly([[23, 22], [20, 4], [31, 17]], P); p.poly([[33, 17], [44, 4], [41, 22]], P);
  p.poly([[23, 19], [22, 9], [28, 17]], '#e8a8d8', { flat: true }); p.poly([[36, 17], [42, 9], [41, 19]], '#e8a8d8', { flat: true });
  p.ell(32, 28, 11.5, 10, P);
  if (front) {
    p.ell(27, 27, 3.2, 3.4, '#ffe040', { flat: true }); p.ell(37, 27, 3.2, 3.4, '#ffe040', { flat: true });
    p.rect(26.5, 25, 1.5, 5, DARK, { flat: true }); p.rect(36.5, 25, 1.5, 5, DARK, { flat: true });
    p.poly([[29, 33], [35, 33], [32, 36]], '#ffffff', { flat: true });
    p.rect(30, 33, 1, 3, '#ffffff', { flat: true }); p.rect(34, 33, 1, 3, '#ffffff', { flat: true });
  }
}

function lucioline(p, front) {
  const Y = '#ffd34a', YD = '#e8a020';
  // antennes
  p.line(29, 17, 22, 5, DARK, 1); p.line(35, 17, 42, 5, DARK, 1);
  p.dot(22, 5, '#fff7a8', 2.2); p.dot(42, 5, '#fff7a8', 2.2);
  // ailes
  const up = [[27, 31], [4, 10], [2, 26], [14, 38], [26, 38]];
  const lo = [[27, 38], [8, 44], [12, 57], [27, 50]];
  p.poly(up, Y); p.poly(mirrorPts(up), Y); p.poly(lo, YD); p.poly(mirrorPts(lo), YD);
  p.ell(11, 23, 4, 5, '#fff7c8', { flat: true }); p.ell(53, 23, 4, 5, '#fff7c8', { flat: true });
  p.ell(15, 49, 2.5, 3, '#fff7c8', { flat: true }); p.ell(49, 49, 2.5, 3, '#fff7c8', { flat: true });
  // corps
  p.ell(32, 38, 6.5, 12, '#fff3b0');
  p.ell(32, 51, 5, 5, '#ffffff', { flat: true });
  p.dot(32, 51, '#ffffe0', 3);
  p.ell(32, 23, 8, 7.5, '#fffbe0');
  if (front) {
    eyeFront(p, 28.5, 23, 2.4, '#3a2060'); eyeFront(p, 35.5, 23, 2.4, '#3a2060');
    p.rect(31, 28, 2, 1, DARK, { flat: true });
  }
}

function tenebrume(p, front) {
  const V = '#4a3a88', VD = '#2c2060', MANE = '#7a62c8';
  // traîne de brume
  p.poly([[10, 48], [14, 60], [22, 54], [28, 63], [34, 55], [42, 63], [48, 54], [55, 60], [56, 48]], VD);
  p.blob([['ell', 32, 44, 20, 14]], V);
  // crinière
  p.poly([[17, 26], [8, 14], [19, 20], [14, 6], [25, 15], [26, 3], [31, 14]], MANE);
  p.poly(mirrorPts([[17, 26], [8, 14], [19, 20], [14, 6], [25, 15], [26, 3], [31, 14]]), MANE);
  // griffes
  p.poly([[11, 46], [6, 56], [14, 53], [17, 58], [20, 48]], V);
  p.poly(mirrorPts([[11, 46], [6, 56], [14, 53], [17, 58], [20, 48]]), V);
  // oreilles
  p.poly([[20, 23], [17, 6], [29, 17]], V); p.poly([[35, 17], [47, 6], [44, 23]], V);
  p.ell(32, 27, 14, 12, V);
  // cristal frontal
  p.poly([[32, 8], [27, 16], [32, 23], [37, 16]], '#8ff0ff');
  p.poly([[32, 11], [29.5, 16], [32, 20], [34.5, 16]], '#e8ffff', { flat: true });
  if (front) {
    p.poly([[22, 28], [30, 31], [29, 34], [21, 31]], '#ff4a5a', { flat: true });
    p.poly(mirrorPts([[22, 28], [30, 31], [29, 34], [21, 31]]), '#ff4a5a', { flat: true });
    p.dot(26, 31.5, '#ffe0e0', 0.8); p.dot(38, 31.5, '#ffe0e0', 0.8);
    p.poly([[28, 38], [36, 38], [32, 42]], '#ffffff', { flat: true });
    p.ell(32, 47, 8, 7, lighten(V, 0.18));
  }
}

export const PAINTERS = { feuillin, braisillon, gouttelin, plumette, ronceau, noctule, lucioline, tenebrume };
const cache = {};
// retourne un canvas 64x64
export function creatureSprite(speciesId, view = 'front') {
  const key = speciesId + ':' + view;
  if (cache[key]) return cache[key];
  const p = new Pix(64, 64);
  PAINTERS[speciesId](p, view === 'front');
  p.outline(DARK);
  return (cache[key] = p.toCanvas());
}
// version réduite pour les listes (32x32)
export function creatureIcon(speciesId) {
  const key = speciesId + ':icon';
  if (cache[key]) return cache[key];
  const src = creatureSprite(speciesId, 'front');
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, 32, 32);
  return (cache[key] = c);
}
// silhouette (espèce vue mais pas capturée)
export function creatureSilhouette(speciesId) {
  const key = speciesId + ':sil';
  if (cache[key]) return cache[key];
  const src = creatureSprite(speciesId, 'front');
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#3a3a58'; g.fillRect(0, 0, 64, 64);
  return (cache[key] = c);
}
