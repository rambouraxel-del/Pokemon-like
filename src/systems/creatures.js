import { SPECIES } from '../data/species.js';
import { MAX_TEAM } from '../config.js';

export const expForLevel = (L) => 3 * L * L;
export const MAX_LEVEL = 30;

export function calcStats(c) {
  const b = SPECIES[c.species].base, L = c.level;
  const f = (v) => Math.floor((2 * v * L) / 100) + 5;
  return { maxHp: Math.floor((2 * b.hp * L) / 100) + L + 10, atk: f(b.atk), def: f(b.def), spd: f(b.spd) };
}
export const maxHp = (c) => calcStats(c).maxHp;

let uidCounter = Date.now();
export const newUid = () => 'c' + (uidCounter++).toString(36);

// 4 dernières attaques apprises jusqu'au niveau donné
export function movesAt(speciesId, level) {
  const learned = [];
  for (const [lv, mv] of SPECIES[speciesId].learnset) if (lv <= level && !learned.includes(mv)) learned.push(mv);
  return learned.slice(-4);
}
export function makeCreature(speciesId, level) {
  const c = { uid: newUid(), species: speciesId, level, exp: expForLevel(level), hp: 1, moves: movesAt(speciesId, level) };
  c.hp = maxHp(c);
  return c;
}
export const isKO = (c) => c.hp <= 0;
export const healFull = (c) => { c.hp = maxHp(c); };
export const aliveCount = (team) => team.filter((c) => c.hp > 0).length;
export const firstAlive = (team) => team.findIndex((c) => c.hp > 0);

// Ajoute de l'expérience ; renvoie la liste des montées de niveau [{level, learn:[moveIds]}]. Les PV restent proportionnels (gain de PV max ajouté).
export function addExp(c, amount) {
  const events = [];
  c.exp += amount;
  while (c.level < MAX_LEVEL && c.exp >= expForLevel(c.level + 1)) {
    const before = maxHp(c);
    c.level++;
    if (c.hp > 0) c.hp += maxHp(c) - before;
    const learn = SPECIES[c.species].learnset.filter(([lv, mv]) => lv === c.level && !c.moves.includes(mv)).map(([, mv]) => mv);
    events.push({ level: c.level, learn });
  }
  return events;
}
export function expProgress(c) {
  const lo = expForLevel(c.level), hi = expForLevel(c.level + 1);
  return c.level >= MAX_LEVEL ? 1 : Math.max(0, Math.min(1, (c.exp - lo) / (hi - lo)));
}
export { MAX_TEAM };
