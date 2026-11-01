// Réserve : déplacer des Lumins entre l'équipe (6 max) et la réserve.
import { W, H } from '../config.js';
import { MAX_TEAM } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { G } from '../systems/game.js';
import { SPECIES } from '../data/species.js';
import { maxHp } from '../systems/creatures.js';
import { creatureIcon } from '../gfx/creatures.js';
import { drawBackdrop, hpBar, smallText } from './common.js';

export class BoxScene {
  constructor(resolve) { this.resolve = resolve; this.col = 0; this.i = 0; this.t = 0; this.busy = false; this.scroll = 0; }
  list() { return this.col === 0 ? G.s.team : G.s.box; }
  update(dt) {
    this.t += dt; if (this.busy) return;
    const l = this.list();
    if (input.pressed('left') || input.pressed('right')) { this.col = 1 - this.col; this.i = 0; this.scroll = 0; audio.sfx('select'); }
    if (l.length) {
      if (input.pressed('down')) { this.i = (this.i + 1) % l.length; audio.sfx('select'); }
      if (input.pressed('up')) { this.i = (this.i + l.length - 1) % l.length; audio.sfx('select'); }
    }
    if (this.i < this.scroll) this.scroll = this.i; if (this.i > this.scroll + 4) this.scroll = this.i - 4;
    if (input.pressed('a') && l.length) this.act();
    else if (input.pressed('b') || input.pressed('start')) { audio.sfx('back'); scenes.pop(); this.resolve(); }
  }
  async act() {
    this.busy = true;
    try {
      const c = this.list()[this.i], n = SPECIES[c.species].name;
      if (this.col === 0) {
        const r = await ui.choose(['Déposer', 'Retour'], { x: 90, y: 100, cancel: 1 });
        if (r === 0) {
          if (G.s.team.length <= 1) { await ui.say(["Tu ne peux pas déposer ton dernier Lumin !"]); return; }
          if (G.s.team.filter((x) => x.hp > 0).length === 1 && c.hp > 0) { await ui.say(["Garde au moins un Lumin en état de se battre !"]); return; }
          G.s.team.splice(this.i, 1); G.s.box.push(c); audio.sfx('confirm'); this.i = Math.max(0, this.i - 1);
        }
      } else {
        const r = await ui.choose(['Prendre', 'Retour'], { x: 200, y: 100, cancel: 1 });
        if (r === 0) {
          if (G.s.team.length >= MAX_TEAM) { await ui.say(["Ton équipe est pleine (6 Lumins). Dépose-en un d'abord."]); return; }
          G.s.box.splice(this.i, 1); G.s.team.push(c); audio.sfx('confirm'); this.i = Math.max(0, this.i - 1);
        }
      }
    } finally { this.busy = false; }
  }
  render(g) {
    drawBackdrop(g, this.t, 'RÉSERVE');
    [['ÉQUIPE', G.s.team, 0], ['RÉSERVE', G.s.box, 1]].forEach(([title, l, ci]) => {
      const x = 6 + ci * 158;
      panel(g, x, 26, 152, 160, { fill: this.col === ci ? '#fff8d0' : '#f4f8ff', border: this.col === ci ? '#d84a4a' : COL.navy });
      smallText(g, `${title} (${l.length}${ci === 0 ? '/' + MAX_TEAM : ''})`, x + 8, 31, COL.navy);
      if (!l.length) smallText(g, 'Vide', x + 8, 50, COL.dim);
      const sc = ci === this.col ? this.scroll : 0;
      l.slice(sc, sc + 5).forEach((c, k) => {
        const y = 44 + k * 28, idx = sc + k;
        g.drawImage(creatureIcon(c.species), x + 14, y - 3, 24, 24);
        text(g, SPECIES[c.species].name, x + 42, y, COL.text); smallText(g, 'N.' + c.level, x + 144, y + 1, COL.dim, 'right');
        hpBar(g, x + 42, y + 12, 70, c.hp, maxHp(c));
        if (ci === this.col && idx === this.i) cursor(g, x + 4, y + 6);
      });
    });
    smallText(g, '< > changer de liste   A: choisir   B: retour', W / 2, H - 8, '#fff', 'center');
  }
}
