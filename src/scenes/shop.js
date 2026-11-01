import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL, wrap } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { G } from '../systems/game.js';
import { ITEMS, SHOP_STOCK } from '../data/items.js';
import { drawBackdrop, smallText } from './common.js';

export class ShopScene {
  get sceneId() { return 'shop'; }
  constructor(resolve) { this.resolve = resolve; this.i = 0; this.t = 0; this.busy = false; }
  update(dt) {
    this.t += dt; if (this.busy) return;
    const n = SHOP_STOCK.length + 1;
    if (input.pressed('down')) { this.i = (this.i + 1) % n; audio.sfx('select'); }
    if (input.pressed('up')) { this.i = (this.i + n - 1) % n; audio.sfx('select'); }
    if (input.pressed('a')) { if (this.i === SHOP_STOCK.length) { audio.sfx('back'); scenes.pop(); this.resolve(); } else this.buy(SHOP_STOCK[this.i]); }
    else if (input.pressed('b') || input.pressed('start')) { audio.sfx('back'); scenes.pop(); this.resolve(); }
  }
  async buy(id) {
    this.busy = true;
    try {
      const it = ITEMS[id];
      if (G.s.money < it.price) { audio.sfx('error'); await ui.say(["Tu n'as pas assez d'écus."]); return; }
      const max = Math.min(9, Math.floor(G.s.money / it.price));
      let q = 1;
      const opts = Array.from({ length: max }, (_, k) => `${k + 1}  (${(k + 1) * it.price} écus)`);
      const r = await ui.choose(opts, { x: 150, y: 70, cancel: -1, title: `${it.name} - combien ?` });
      if (r < 0) return;
      q = r + 1;
      G.s.money -= q * it.price; G.addItem(id, q); audio.sfx('buy');
      await ui.say([`Tu achètes ${q} ${it.name}. Merci !`]);
    } finally { this.busy = false; }
  }
  render(g) {
    drawBackdrop(g, this.t, 'BOUTIQUE');
    panel(g, 6, 26, 200, 128, { fill: '#fbf8ee' });
    [...SHOP_STOCK, null].forEach((id, k) => {
      const y = 34 + k * 19;
      if (!id) text(g, 'Quitter', 28, y, COL.text);
      else { text(g, ITEMS[id].name, 28, y, COL.text); text(g, `${ITEMS[id].price}`, 196, y, COL.text, null, 'right'); }
      if (k === this.i) cursor(g, 16, y);
    });
    panel(g, 210, 26, 104, 52, { fill: '#fff8d8' }); text(g, 'Écus', 218, 34, COL.dim); text(g, String(G.s.money), 306, 48, COL.text, null, 'right');
    const id = SHOP_STOCK[this.i]; if (id) smallText(g, `Possédé: ${G.count(id)}`, 218, 64, COL.text);
    panel(g, 6, 158, W - 12, 30);
    if (id) wrap(ITEMS[id].desc, 35).slice(0, 2).forEach((ln, k) => text(g, ln, 14, 163 + k * 12, COL.text));
  }
}
