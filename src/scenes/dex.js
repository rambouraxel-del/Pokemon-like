import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { text, panel, cursor, COL, wrap } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { G } from '../systems/game.js';
import { SPECIES_LIST } from '../data/species.js';
import { creatureSprite, creatureSilhouette } from '../gfx/creatures.js';
import { drawBackdrop, typeBadge, smallText } from './common.js';

export class DexScene {
  get sceneId() { return 'dex'; }
  constructor(resolve) { this.resolve = resolve; this.i = 0; this.t = 0; }
  update(dt) {
    this.t += dt; const n = SPECIES_LIST.length;
    if (input.pressed('down')) { this.i = (this.i + 1) % n; audio.sfx('select'); }
    if (input.pressed('up')) { this.i = (this.i + n - 1) % n; audio.sfx('select'); }
    if (input.pressed('b') || input.pressed('a') || input.pressed('start')) { audio.sfx('back'); scenes.pop(); this.resolve(); }
  }
  render(g) {
    drawBackdrop(g, this.t, 'BESTIAIRE');
    const seen = Object.keys(G.s.dex).length, caught = Object.values(G.s.dex).filter((v) => v === 'caught').length;
    smallText(g, `Vus ${seen}  Capturés ${caught}`, W - 8, 10, '#fff', 'right');
    panel(g, 6, 26, 130, 160, { fill: '#fbf8ee' });
    SPECIES_LIST.forEach((s, k) => {
      const st = G.s.dex[s.id], y = 33 + k * 18;
      text(g, String(s.no).padStart(2, '0'), 24, y, COL.dim);
      text(g, st ? s.name : '??????', 44, y, st ? COL.text : COL.dim);
      if (st === 'caught') { g.fillStyle = '#e8584a'; g.beginPath(); g.arc(122, y + 4, 4, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.fillRect(118, y + 3, 8, 2); }
      else if (st === 'seen') { g.fillStyle = COL.navy; g.fillRect(118, y + 3, 8, 3); }
      if (k === this.i) cursor(g, 12, y);
    });
    const s = SPECIES_LIST[this.i], st = G.s.dex[s.id];
    panel(g, 140, 26, 174, 160, { fill: '#e8f0ff' });
    g.fillStyle = 'rgba(40,60,120,0.2)'; g.beginPath(); g.ellipse(227, 106, 40, 7, 0, 0, 6.3); g.fill();
    g.drawImage(st ? creatureSprite(s.id, 'front') : creatureSilhouette(s.id), 195, 40 + Math.sin(this.t * 2) * 2, 64, 64);
    if (!st) { text(g, '??????', 227, 112, COL.dim, null, 'center'); smallText(g, 'Pas encore rencontré', 227, 126, COL.dim, 'center'); return; }
    text(g, s.name, 227, 112, COL.text, null, 'center'); typeBadge(g, 212, 124, s.type);
    if (st === 'caught') wrap(s.desc, 20).slice(0, 5).forEach((l, i) => smallText(g, l, 148, 140 + i * 8, COL.text));
    else smallText(g, 'Capture-le pour en savoir plus.', 148, 140, COL.dim);
    smallText(g, st === 'caught' ? 'Capturé' : 'Aperçu', 308, 32, st === 'caught' ? '#c83a3a' : COL.dim, 'right');
  }
}
