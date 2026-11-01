// Menu principal (superposé à l'exploration) : bestiaire, équipe, sac, objectif, réserve, sauvegarde, options.
import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { G } from '../systems/game.js';
import { objective } from '../data/story.js';
import { openTeam } from './team.js';
import { openBag } from './bag.js';
import { DexScene } from './dex.js';
import { BoxScene } from './box.js';
import { OptionsScene } from './options.js';
import { smallText } from './common.js';
import { wrap } from '../core/ui.js';

const ITEMS_MENU = ['Bestiaire', 'Équipe', 'Sac', 'Objectif', 'Réserve', 'Sauvegarder', 'Options', 'Fermer'];

export class MenuScene {
  constructor(world, resolve) { this.world = world; this.resolve = resolve; this.i = 0; this.t = 0; this.busy = false; this.transparent = true; }
  close() { scenes.pop(); this.resolve(); }
  update(dt) {
    this.t += dt; if (this.busy) return;
    if (input.pressed('down')) { this.i = (this.i + 1) % ITEMS_MENU.length; audio.sfx('select'); }
    if (input.pressed('up')) { this.i = (this.i + ITEMS_MENU.length - 1) % ITEMS_MENU.length; audio.sfx('select'); }
    if (input.pressed('b') || input.pressed('start')) { audio.sfx('back'); this.close(); return; }
    if (input.pressed('a')) { audio.sfx('confirm'); this.act(ITEMS_MENU[this.i]); }
  }
  async act(a) {
    this.busy = true;
    try {
      if (a === 'Fermer') { this.close(); return; }
      if (a === 'Bestiaire') await new Promise((res) => scenes.push(new DexScene(res)));
      else if (a === 'Équipe') await openTeam({ mode: 'menu', title: 'ÉQUIPE' });
      else if (a === 'Sac') await openBag({ mode: 'menu' });
      else if (a === 'Objectif') await ui.say([objective()], 'Objectif');
      else if (a === 'Réserve') await new Promise((res) => scenes.push(new BoxScene(res)));
      else if (a === 'Options') await new Promise((res) => scenes.push(new OptionsScene(res, this.world)));
      else if (a === 'Sauvegarder') {
        const r = await ui.ask('Sauvegarder la partie ?', ['Oui', 'Non']);
        if (r === 0) { const p = this.world.player; G.s.player = { map: this.world.mapId, x: p.x, y: p.y, dir: p.dir }; const ok = G.save(); audio.sfx('save'); await ui.say([ok ? 'Partie sauvegardée !' : "Échec de la sauvegarde (stockage indisponible)."]); }
      }
    } finally { this.busy = false; }
  }
  render(g) {
    const x = W - 98;
    panel(g, x, 6, 92, ITEMS_MENU.length * 16 + 12);
    ITEMS_MENU.forEach((s, i) => { const y = 13 + i * 16; text(g, s, x + 20, y, COL.text); if (i === this.i) cursor(g, x + 8, y); });
    // résumé en bas à gauche
    panel(g, 6, 6, 118, 54, { fill: '#fff8d8' });
    const secs = Math.floor(G.s.playtime), hh = String(Math.floor(secs / 3600)).padStart(2, '0'), mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    text(g, this.world.map.name.slice(0, 14), 12, 12, COL.text);
    smallText(g, `Écus  ${G.s.money}`, 12, 26, COL.text); smallText(g, `Lumins ${G.s.team.length}  Temps ${hh}:${mm}`, 12, 38, COL.text);
    const caught = Object.values(G.s.dex).filter((v) => v === 'caught').length;
    smallText(g, `Bestiaire ${caught}/8`, 12, 48, COL.text);
  }
}
