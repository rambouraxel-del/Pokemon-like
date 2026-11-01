// Sprites de personnages 16x24 (4 directions x 3 frames), générés par code à partir d'un "look".
import { Pix, darken, lighten } from './pixel.js';

const OUT = '#241838';
export const LOOKS = {
  player:   { skin: '#f4c9a0', hair: '#3a2a22', shirt: '#3aa0a8', shirt2: '#f0e8d0', pants: '#46506a', shoes: '#c04a3a', hat: '#d84a3a', style: 'short' },
  rival:    { skin: '#f0c098', hair: '#d8c050', shirt: '#4868d0', shirt2: '#e8e8f0', pants: '#2c3048', shoes: '#e0e0e0', style: 'spiky' },
  prof:     { skin: '#f0c8a0', hair: '#d0d0d8', shirt: '#f4f4f4', shirt2: '#7ab0e0', pants: '#5a4a40', shoes: '#4a3a30', style: 'short', coat: '#f4f4f8' },
  mom:      { skin: '#f4c9a0', hair: '#8a5030', shirt: '#e88aa0', shirt2: '#fff0f0', pants: '#8a5030', shoes: '#6a4030', style: 'bun', apron: '#f8f0e0' },
  villager: { skin: '#e8b890', hair: '#6a4a30', shirt: '#7a9a4a', shirt2: '#e0d0a0', pants: '#6a5a4a', shoes: '#4a3a30', style: 'short' },
  villagerF:{ skin: '#f4c9a0', hair: '#c06a30', shirt: '#c85a7a', shirt2: '#f0e0e0', pants: '#7a4a6a', shoes: '#5a3a30', style: 'long' },
  elder:    { skin: '#e8b890', hair: '#e8e8e8', shirt: '#8a6a9a', shirt2: '#d8c8e0', pants: '#5a4a60', shoes: '#4a3a40', style: 'bald', robe: '#8a6a9a' },
  kid:      { skin: '#f4c9a0', hair: '#2a2a40', shirt: '#e8c040', shirt2: '#fff', pants: '#3a60a0', shoes: '#c04a3a', style: 'short', small: true },
  shop:     { skin: '#e8b890', hair: '#4a3a30', shirt: '#4a8a5a', shirt2: '#f0e8d0', pants: '#4a4a5a', shoes: '#3a3030', style: 'short', apron: '#e8d8b0', hat: '#4a8a5a' },
  nurse:    { skin: '#f4c9a0', hair: '#f0a0b0', shirt: '#f8e8f0', shirt2: '#f06a8a', pants: '#f8e8f0', shoes: '#f06a8a', style: 'bun', apron: '#f8f8ff', hat: '#f8f8ff' },
  hiker:    { skin: '#e8b890', hair: '#6a4a30', shirt: '#b88a40', shirt2: '#e0d0a0', pants: '#5a4a3a', shoes: '#4a3a30', style: 'short', hat: '#8a6a30' },
  scout:    { skin: '#f4c9a0', hair: '#2a2a3a', shirt: '#58a858', shirt2: '#e8e0c0', pants: '#486a48', shoes: '#4a3a30', style: 'long', hat: '#58a858' },
  breeder:  { skin: '#e8b890', hair: '#a06a40', shirt: '#e8884a', shirt2: '#fff0d0', pants: '#4a5a8a', shoes: '#3a3a4a', style: 'short' },
  guard:    { skin: '#e8b890', hair: '#4a3a30', shirt: '#6a7a9a', shirt2: '#c8d0e0', pants: '#4a5068', shoes: '#2a2a38', style: 'short', hat: '#6a7a9a' },
  disciple: { skin: '#e8c0a0', hair: '#2a2040', shirt: '#4a3a7a', shirt2: '#9a82d8', pants: '#3a2a60', shoes: '#2a2040', style: 'hood', robe: '#4a3a7a' },
  boss:     { skin: '#f0d0b8', hair: '#d8d8f0', shirt: '#2a2048', shirt2: '#a08ae8', pants: '#2a2048', shoes: '#18102c', style: 'long', robe: '#2a2048', cape: '#5a3a98' },
};

function drawChar(look, dir, frame) {
  const p = new Pix(16, 24);
  const L = look, F = { flat: true };
  const sk = L.skin, hairD = darken(L.hair, 0.15);
  const step = frame === 1 ? -1 : frame === 2 ? 1 : 0;   // oscillation des jambes
  const bob = frame === 0 ? 0 : 0;
  const top = L.small ? 3 : 0;                             // enfants : plus petits
  const oy = top;
  const side = dir === 'left' || dir === 'right';
  const flip = dir === 'right';
  const X = (x) => (flip && side ? 15 - x : x);
  const rect = (x, y, w, h, c) => { const xs = flip && side ? 16 - x - w : x; p.rect(xs, y + oy, w, h, c, F); };
  // cape (derrière)
  if (L.cape && dir !== 'down') rect(3, 12 + bob, 10, 11, L.cape);
  // jambes
  if (L.robe) {
    rect(4, 18 + bob, 8, 5 - (step ? 0 : 0), L.robe); rect(4, 22 + bob, 8, 1, darken(L.robe, 0.3));
    rect(5 + (step < 0 ? 0 : 0), 22, 2, 1, L.shoes); rect(9, 22, 2, 1, L.shoes);
  } else if (side) {
    rect(6 + step, 19, 4, 3, L.pants); rect(6 + step, 22, 4, 1, L.shoes);
    rect(6 - step, 19, 4, 3, darken(L.pants, 0.2)); rect(6 - step, 22, 4, 1, darken(L.shoes, 0.2));
  } else {
    const l = step < 0 ? 1 : 0, r = step > 0 ? 1 : 0;
    rect(5, 19, 3, 3 - l, L.pants); rect(5, 22 - l, 3, 1 + 0, L.shoes);
    rect(8, 19, 3, 3 - r, L.pants); rect(8, 22 - r, 3, 1, L.shoes);
  }
  // corps
  const bodyC = L.coat || L.shirt;
  const bodyBottom = L.coat || L.robe ? 21 : 19;
  if (side) {
    rect(5, 12, 6, bodyBottom - 12, bodyC);
    rect(5, 18, 6, 1, darken(bodyC, 0.25));
    if (L.apron) rect(4, 14, 3, 6, L.apron);
    // bras
    rect(6 + step * -1, 13, 3, 5, darken(bodyC, 0.12)); rect(7 - step, 17, 2, 2, sk);
  } else {
    rect(4, 12, 8, bodyBottom - 12, bodyC);
    rect(4, 18, 8, 1, darken(bodyC, 0.25));
    if (L.shirt2 && !L.coat && dir === 'down') { rect(7, 12, 2, 5, L.shirt2); }
    if (L.coat && dir === 'down') { rect(7, 12, 2, 8, L.shirt2); rect(7, 12, 2, 1, L.shirt); }
    if (L.apron && dir === 'down') rect(5, 14, 6, 6, L.apron);
    if (L.robe && dir === 'down') { rect(7, 12, 2, 9, L.shirt2); }
    // bras (balancier)
    rect(2, 13 + (step > 0 ? 1 : 0), 2, 5, darken(bodyC, 0.1)); rect(12, 13 + (step < 0 ? 1 : 0), 2, 5, darken(bodyC, 0.1));
    rect(2, 18 + (step > 0 ? 1 : 0), 2, 1, sk); rect(12, 18 + (step < 0 ? 1 : 0), 2, 1, sk);
  }
  // tête
  const headTop = 2;
  if (side) {
    p.ell(X(8) + 0, headTop + 6.2 + oy, 5, 5.2, sk, F);
  } else p.ell(8, headTop + 6.2 + oy, 5.2, 5.2, sk, F);
  // cheveux
  const hairC = L.hair;
  if (dir === 'down') {
    if (L.style !== 'bald') {
      p.ell(8, headTop + 4.5 + oy, 5.6, 4, hairC, F);
      rect(2, headTop + 5, 2, 4, hairC); rect(12, headTop + 5, 2, 4, hairC);
      rect(4, headTop + 5, 8, 2, hairC);
      if (L.style === 'long') { rect(2, headTop + 8, 2, 5, hairC); rect(12, headTop + 8, 2, 5, hairC); }
      if (L.style === 'spiky') { p.poly([[3, 4 + oy], [4, 0 + oy], [6, 3 + oy]], hairC, F); p.poly([[7, 3 + oy], [8.5, -0.5 + oy], [10, 3 + oy]], hairC, F); p.poly([[10, 3 + oy], [13, 0 + oy], [13, 4 + oy]], hairC, F); }
      if (L.style === 'bun') p.ell(8, 2 + oy, 2.4, 2.2, hairC, F);
      if (L.style === 'hood') { p.ell(8, headTop + 6 + oy, 6.3, 6, L.robe, F); p.ell(8, headTop + 7.5 + oy, 4, 3.6, sk, F); p.rect(5, headTop + 7 + oy, 6, 1, darken(L.robe, 0.5), F); }
    } else { rect(3, headTop + 3, 10, 2, '#e8e8e8'); rect(2, headTop + 5, 2, 3, '#e8e8e8'); rect(12, headTop + 5, 2, 3, '#e8e8e8'); }
    // yeux
    if (L.style === 'hood') { p.set(6, 10 + oy, '#ffe040'); p.set(10, 10 + oy, '#ffe040'); }
    else { rect(5, 9, 2, 2, '#ffffff'); rect(9, 9, 2, 2, '#ffffff'); p.set(6, 10 + oy, OUT); p.set(10, 10 + oy, OUT); }
    rect(7, 12, 2, 1, darken(sk, 0.2));
  } else if (dir === 'up') {
    p.ell(8, headTop + 6 + oy, 5.4, 5.4, L.style === 'bald' ? '#e8e8e8' : (L.style === 'hood' ? L.robe : hairC), F);
    if (L.style === 'long') rect(3, headTop + 8, 10, 5, hairC);
    if (L.style === 'bun') p.ell(8, 2 + oy, 2.4, 2.2, hairC, F);
    if (L.style === 'spiky') { p.poly([[3, 4 + oy], [4, 0 + oy], [6, 3 + oy]], hairC, F); p.poly([[10, 3 + oy], [13, 0 + oy], [13, 4 + oy]], hairC, F); }
  } else {
    p.ell(X(8), headTop + 4.5 + oy, 5.6, 4, hairC, F);
    rect(8, headTop + 5, 5, 5, hairC);           // arrière de la tête (côté droit en regardant à gauche)
    rect(3, headTop + 5, 3, 2, hairC);
    if (L.style === 'long') rect(9, headTop + 8, 4, 5, hairC);
    if (L.style === 'bun') p.ell(X(11), 3 + oy, 2.2, 2.2, hairC, F);
    if (L.style === 'hood') { p.ell(X(8), headTop + 6 + oy, 6, 6, L.robe, F); p.ell(X(6), headTop + 7 + oy, 3, 3, sk, F); }
    if (L.style === 'bald') { rect(3, headTop + 3, 8, 2, '#e8e8e8'); }
    p.set(X(5), 10 + oy, L.style === 'hood' ? '#ffe040' : OUT); p.set(X(6), 10 + oy, L.style === 'hood' ? '#ffe040' : OUT);
  }
  // chapeau / casquette
  if (L.hat) {
    if (dir === 'down') { rect(3, 3, 10, 3, L.hat); rect(2, 6, 12, 1, darken(L.hat, 0.25)); if (L.apron) { rect(5, 2, 6, 1, L.hat); } }
    else if (dir === 'up') { rect(3, 3, 10, 4, L.hat); }
    else { rect(3, 3, 9, 3, L.hat); rect(1, 6, 6, 1, darken(L.hat, 0.25)); }
  }
  p.outline(OUT);
  return p.toCanvas();
}

const cache = {};
// renvoie { down:[c0,c1,c2], up:[...], left:[...], right:[...] }
export function characterSheet(lookName) {
  if (cache[lookName]) return cache[lookName];
  const look = LOOKS[lookName];
  const sheet = {};
  for (const dir of ['down', 'up', 'left', 'right']) sheet[dir] = [0, 1, 2].map((f) => drawChar(look, dir, f));
  return (cache[lookName] = sheet);
}
