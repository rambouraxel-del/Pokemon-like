// Écran d'équipe (liste, résumé, réordonnancement) + sélecteur utilisable en combat.
import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { G } from '../systems/game.js';
import { SPECIES } from '../data/species.js';
import { MOVES, moveInfo } from '../data/moves.js';
import { TYPES } from '../data/types.js';
import { calcStats, maxHp, expForLevel, expProgress } from '../systems/creatures.js';
import { creatureIcon, creatureSprite } from '../gfx/creatures.js';
import { drawBackdrop, hpBar, typeBadge, smallText } from './common.js';

class SummaryScene {
  get sceneId() { return 'summary'; }
  constructor(index, done) { this.i = index; this.done = done; this.t = 0; }
  update(dt) {
    this.t += dt; const n = G.s.team.length;
    if (input.pressed('left') || input.pressed('up')) { this.i = (this.i + n - 1) % n; audio.sfx('select'); }
    if (input.pressed('right') || input.pressed('down')) { this.i = (this.i + 1) % n; audio.sfx('select'); }
    if (input.pressed('b') || input.pressed('a') || input.pressed('start')) { audio.sfx('back'); scenes.pop(); this.done(); }
  }
  render(g) {
    drawBackdrop(g, this.t, 'RÉSUMÉ');
    const c = G.s.team[this.i], sp = SPECIES[c.species], st = calcStats(c);
    panel(g, 6, 26, 130, 160, { fill: '#e8f0ff' });
    g.fillStyle = 'rgba(40,60,120,0.25)'; g.beginPath(); g.ellipse(71, 150, 48, 8, 0, 0, 6.3); g.fill();
    g.drawImage(creatureSprite(c.species, 'front'), 7, 56 + Math.sin(this.t * 2) * 2, 128, 128);
    text(g, sp.name, 14, 34, COL.text); typeBadge(g, 14, 46, sp.type);
    text(g, 'N.' + c.level, 128, 34, COL.text, null, 'right');
    panel(g, 140, 26, 174, 74, { fill: '#fbf8ee' });
    const rows = [['PV', `${c.hp}/${st.maxHp}`], ['Attaque', st.atk], ['Défense', st.def], ['Vitesse', st.spd]];
    rows.forEach(([k, v], i) => { text(g, k, 148, 32 + i * 12, COL.dim); text(g, String(v), 306, 32 + i * 12, COL.text, null, 'right'); });
    const nxt = expForLevel(c.level + 1) - c.exp;
    smallText(g, `Exp ${c.exp}  Niveau suivant: ${Math.max(0, nxt)}`, 148, 82);
    g.fillStyle = '#2a2a44'; g.fillRect(148, 91, 158, 4); g.fillStyle = '#48a8f8'; g.fillRect(149, 92, Math.round(156 * expProgress(c)), 2);
    panel(g, 140, 104, 174, 82, { fill: '#fbf8ee' });
    c.moves.forEach((id, i) => {
      const m = MOVES[id], info = moveInfo(id), y = 110 + i * 19;
      typeBadge(g, 146, y + 1, m.type); text(g, m.name.length > 14 ? m.name.slice(0, 14) : m.name, 190, y, COL.text);
      smallText(g, info.power ? `Puiss ${info.power}` : info.text, 190, y + 9);
    });
    smallText(g, '< > autre Lumin   B retour', W / 2, H - 9, '#fff', 'center');
  }
}

export class TeamScene {
  get sceneId() { return 'team'; }
  // opts: {mode:'menu'|'switch'|'item', title, active, cancel, validate}
  constructor(opts, resolve) { this.o = opts; this.resolve = resolve; this.i = Math.max(0, opts.active ?? 0); this.t = 0; this.swapFrom = null; this.busy = false; }
  get team() { return G.s.team; }
  update(dt) {
    this.t += dt; if (this.busy) return;
    const n = this.team.length;
    const prev = this.i;
    if (input.pressed('down')) this.i = Math.min(n - 1, this.i + 2);
    if (input.pressed('up')) this.i = Math.max(0, this.i - 2);
    if (input.pressed('right') && this.i % 2 === 0 && this.i + 1 < n) this.i++;
    if (input.pressed('left') && this.i % 2 === 1) this.i--;
    if (this.i !== prev) audio.sfx('select');
    if (input.pressed('a')) this.select();
    else if (input.pressed('b') || input.pressed('start')) {
      if (this.swapFrom !== null) { this.swapFrom = null; audio.sfx('back'); return; }
      if (this.o.cancel === false) { audio.sfx('error'); ui.toast('Choisis un Lumin !'); return; }
      audio.sfx('back'); scenes.pop(); this.resolve(-1);
    }
  }
  async select() {
    const o = this.o, c = this.team[this.i];
    this.busy = true;
    try {
      if (this.swapFrom !== null) {
        const a = this.swapFrom, b = this.i;
        if (a !== b) { [this.team[a], this.team[b]] = [this.team[b], this.team[a]]; audio.sfx('confirm'); }
        this.swapFrom = null; return;
      }
      if (o.mode === 'item') { scenes.pop(); this.resolve(this.i); return; }
      const sp = SPECIES[c.species];
      const opts = o.mode === 'switch' ? ['Envoyer', 'Résumé', 'Retour'] : ['Résumé', 'Déplacer', 'Retour'];
      const r = await ui.choose(opts, { x: 214, y: 110, cancel: 2 });
      const act = opts[r];
      if (act === 'Envoyer') {
        if (c.hp <= 0) { await ui.say([`${sp.name} est K.O. et ne peut pas se battre !`]); return; }
        if (this.i === o.active) { await ui.say([`${sp.name} est déjà au combat !`]); return; }
        scenes.pop(); this.resolve(this.i); return;
      }
      if (act === 'Résumé') await new Promise((res) => scenes.push(new SummaryScene(this.i, res)));
      if (act === 'Déplacer') { if (this.team.length < 2) await ui.say(["Tu n'as qu'un seul Lumin."]); else { this.swapFrom = this.i; ui.toast('Choisis la nouvelle place'); } }
    } finally { this.busy = false; }
  }
  render(g) {
    drawBackdrop(g, this.t, this.o.title || 'ÉQUIPE');
    this.team.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = 6 + col * 158, y = 28 + row * 52, w = 152, h = 48;
      const sel = i === this.i, sp = SPECIES[c.species], mh = maxHp(c);
      panel(g, x, y, w, h, { fill: c.hp <= 0 ? '#e8d0d0' : sel ? '#fff8d0' : '#f4f8ff', border: sel ? '#d84a4a' : '#2c3a78', inner: sel ? '#ffb0a0' : '#9ab4f0' });
      g.drawImage(creatureIcon(c.species), x + 4, y + 8 + (sel ? Math.sin(this.t * 8) * 1.5 : 0), 32, 32);
      text(g, sp.name, x + 40, y + 6, COL.text); text(g, 'N.' + c.level, x + w - 6, y + 6, COL.text, null, 'right');
      hpBar(g, x + 40, y + 20, 104, c.hp, mh);
      smallText(g, c.hp <= 0 ? 'K.O.' : `${c.hp}/${mh}`, x + w - 6, y + 29, c.hp <= 0 ? '#c83a3a' : COL.dim, 'right');
      typeBadge(g, x + 40, y + 31, sp.type);
      if (this.o.active === i) smallText(g, 'EN JEU', x + 76, y + 33, '#2a7a3a');
      if (this.swapFrom === i) smallText(g, 'DÉPLACER', x + 76, y + 33, '#c83a3a');
    });
    smallText(g, 'A: choisir   B: retour', W / 2, H - 9, '#fff', 'center');
  }
}
export function openTeam(opts = {}) { return new Promise((res) => scenes.push(new TeamScene({ mode: 'menu', ...opts }, res))); }
export function pickTeam(opts) { return new Promise((res) => scenes.push(new TeamScene(opts, res))); }
