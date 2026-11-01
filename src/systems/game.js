// État global de la partie (sérialisable) + helpers de progression.
import { MAX_TEAM } from '../config.js';
import { deepCopy } from '../core/util.js';
import { readSave, writeSave, hasSave } from '../core/save.js';
import { healFull, newUid } from './creatures.js';

export const START_POS = { map: 'home', x: 4, y: 3, dir: 'down' };

function freshState() {
  return {
    version: 1,
    player: { ...START_POS },
    flags: {},                 // progression de l'histoire
    defeated: {},              // dresseurs vaincus
    picked: {},                // objets ramassés
    team: [], box: [],
    items: { lanterne: 0, baume: 0 },
    money: 100,
    dex: {},                   // espèce -> 'seen' | 'caught'
    lastHeal: { map: 'village', x: 23, y: 8, dir: 'down' },     // devant la Maison des Soins
    playtime: 0,
    stats: { battles: 0, captures: 0, steps: 0 },
  };
}

export const G = {
  s: freshState(),
  newGame() { this.s = freshState(); },
  load() { const d = readSave(); if (!d) return false; this.s = Object.assign(freshState(), d); return true; },
  save() { return writeSave(this.s); },
  hasSave,
  flag(k) { return this.s.flags[k]; },
  setFlag(k, v = true) { this.s.flags[k] = v; },
  // --- objets ---
  count(id) { return this.s.items[id] || 0; },
  addItem(id, n = 1) { this.s.items[id] = this.count(id) + n; },
  useItem(id) { if (this.count(id) > 0) { this.s.items[id]--; if (this.s.items[id] <= 0) delete this.s.items[id]; return true; } return false; },
  // --- équipe ---
  addCreature(c) {
    this.markCaught(c.species);
    if (this.s.team.length < MAX_TEAM) { this.s.team.push(c); return 'team'; }
    this.s.box.push(c); return 'box';
  },
  markSeen(sp) { if (!this.s.dex[sp]) this.s.dex[sp] = 'seen'; },
  markCaught(sp) { this.s.dex[sp] = 'caught'; },
  healTeam() { this.s.team.forEach(healFull); },
  get team() { return this.s.team; },
  get box() { return this.s.box; },
  uid: newUid,
  snapshot() { return deepCopy(this.s); },
};
