// Sac : liste des objets, utilisation hors combat, sélection en combat.
import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { G } from '../systems/game.js';
import { ITEMS } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { maxHp } from '../systems/creatures.js';
import { drawBackdrop, smallText } from './common.js';
import { pickTeam } from './team.js';

export class BagScene {
  // opts: {mode:'menu'|'battle', wild, validate(id, targetIdx)->string|null}
  constructor(opts, resolve) { this.o = opts; this.resolve = resolve; this.i = 0; this.scroll = 0; this.t = 0; this.busy = false; }
  list() { return Object.keys(G.s.items).filter((k) => G.s.items[k] > 0 && ITEMS[k]).sort((a, b) => order(a) - order(b)); }
  update(dt) {
    this.t += dt; if (this.busy) return;
    const l = this.list(); if (this.i >= l.length) this.i = Math.max(0, l.length - 1);
    if (input.pressed('down') && l.length) { this.i = (this.i + 1) % l.length; audio.sfx('select'); }
    if (input.pressed('up') && l.length) { this.i = (this.i + l.length - 1) % l.length; audio.sfx('select'); }
    if (this.i < this.scroll) this.scroll = this.i; if (this.i > this.scroll + 5) this.scroll = this.i - 5;
    if (input.pressed('a') && l.length) this.use(l[this.i]);
    else if (input.pressed('b') || input.pressed('start')) { audio.sfx('back'); scenes.pop(); this.resolve(null); }
  }
  async use(id) {
    const it = ITEMS[id]; this.busy = true;
    try {
      const battle = this.o.mode === 'battle';
      if (it.kind === 'ball') {
        if (!battle) { await ui.say(["Tu ne peux pas lancer de Lanterne ici : il n'y a aucun Lumin sauvage."]); return; }
        const err = this.o.validate(id, -1);
        if (err) { await ui.say([err]); return; }
        scenes.pop(); this.resolve({ id }); return;
      }
      // soin / rappel : choisir la cible
      for (;;) {
        const ti = await pickTeam({ mode: 'item', title: `${it.name} sur qui ?`, active: battle ? this.o.activeIndex : -1, cancel: true });
        if (ti < 0) return;
        const err = battle ? this.o.validate(id, ti) : this.validate(id, ti);
        if (err) { await ui.say([err]); continue; }
        if (battle) { scenes.pop(); this.resolve({ id, target: ti }); return; }
        const c = G.s.team[ti], n = SPECIES[c.species].name; G.useItem(id); audio.sfx('heal');
        if (it.kind === 'heal') c.hp = Math.min(maxHp(c), c.hp + it.hp); else c.hp = Math.max(1, Math.floor(maxHp(c) * it.frac));
        await ui.say([it.kind === 'heal' ? `${n} récupère des PV !` : `${n} est de retour sur pied !`]);
        return;
      }
    } finally { this.busy = false; }
  }
  validate(id, ti) {
    const it = ITEMS[id], c = G.s.team[ti], n = SPECIES[c.species].name;
    if (it.kind === 'heal') { if (c.hp <= 0) return `${n} est K.O. : utilise un Rappel.`; if (c.hp >= maxHp(c)) return `Ça n'aurait aucun effet sur ${n}.`; }
    if (it.kind === 'revive' && c.hp > 0) return `${n} n'est pas K.O. !`;
    return null;
  }
  render(g) {
    drawBackdrop(g, this.t, 'SAC');
    const l = this.list();
    panel(g, 6, 26, 190, 128, { fill: '#fbf8ee' });
    if (!l.length) text(g, 'Le sac est vide.', 18, 40, COL.dim);
    l.slice(this.scroll, this.scroll + 6).forEach((id, k) => {
      const y = 34 + k * 20, i = this.scroll + k, it = ITEMS[id];
      text(g, it.name, 28, y, COL.text); text(g, 'x' + G.s.items[id], 186, y, COL.text, null, 'right');
      if (i === this.i) cursor(g, 16, y);
    });
    if (l.length > 6) { if (this.scroll > 0) smallText(g, '^', 190, 28); if (this.scroll + 6 < l.length) smallText(g, 'v', 190, 144); }
    panel(g, 200, 26, 114, 60, { fill: '#fff8d8' }); text(g, 'Écus', 208, 34, COL.dim); text(g, String(G.s.money), 306, 46, COL.text, null, 'right');
    panel(g, 6, 158, W - 12, 30);
    const cur = l[this.i]; if (cur) { const words = ITEMS[cur].desc; text(g, words.length > 36 ? words.slice(0, 36) : words, 14, 163, COL.text); if (words.length > 36) text(g, words.slice(36), 14, 175, COL.text); }
  }
}
const order = (id) => ({ lanterne: 0, super_lanterne: 1, baume: 2, grand_baume: 3, rappel: 4 }[id] ?? 9);
export function openBag(opts = {}) { return new Promise((res) => scenes.push(new BagScene({ mode: 'menu', ...opts }, res))); }
export function pickBattleItem(opts) { return new Promise((res) => scenes.push(new BagScene({ mode: 'battle', ...opts }, res))); }
