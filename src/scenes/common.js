// Éléments d'interface partagés par les écrans plein cadre.
import { W, H } from '../config.js';
import { text, panel, COL } from '../core/ui.js';
import { TYPES } from '../data/types.js';

let bgCache = null;
export function drawBackdrop(g, t = 0, title = null) {
  if (!bgCache) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#4a6ac8'); gr.addColorStop(1, '#8aa8f0');
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = -H; i < W; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 8, 0); x.lineTo(i + 8 + H, H); x.lineTo(i + H, H); x.fill(); }
    bgCache = c;
  }
  g.drawImage(bgCache, 0, 0);
  if (title) { panel(g, 4, 4, title.length * 8 + 20, 16, { fill: '#fff8d8' }); text(g, title, 14, 8, COL.text); }
}
export function hpBar(g, x, y, w, cur, max) {
  const r = Math.max(0, Math.min(1, cur / max));
  g.fillStyle = '#2a2a44'; g.fillRect(x, y, w, 6); g.fillStyle = '#dcdcdc'; g.fillRect(x + 1, y + 1, w - 2, 4);
  g.fillStyle = r > 0.5 ? '#38c868' : r > 0.2 ? '#e8c030' : '#e04848'; g.fillRect(x + 1, y + 1, Math.round((w - 2) * r), 4);
}
export function typeBadge(g, x, y, type) {
  const tc = TYPES[type]; g.fillStyle = tc.color; g.fillRect(x, y, tc.name.length * 6 + 6, 9);
  text(g, tc.name.toUpperCase(), x + 3, y + 2, '#fff', null, 'left', 6);
  return tc.name.length * 6 + 6;
}
export function smallText(g, str, x, y, color = COL.dim, align = 'left') { text(g, str, x, y, color, null, align, 6); }
