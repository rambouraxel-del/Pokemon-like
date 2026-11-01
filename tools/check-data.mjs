// Vérification statique des données : cartes, accessibilité (BFS), références de scripts, espèces/attaques/objets.
import { getMap, MAP_IDS } from '../src/data/maps.js';
import { SPECIES } from '../src/data/species.js';
import { MOVES } from '../src/data/moves.js';
import { ITEMS } from '../src/data/items.js';
import { SCRIPTS } from '../src/data/story.js';
import { SOLID_GROUND, SOLID_OBJ } from '../src/gfx/tiles.js';

let errors = 0; const err = (m) => { console.log('ERREUR:', m); errors++; };
for (const [id, s] of Object.entries(SPECIES)) {
  for (const [, mv] of s.learnset) if (!MOVES[mv]) err(`espèce ${id}: attaque inconnue ${mv}`);
}
for (const [id, m] of Object.entries(MOVES)) { if (!['dmg', 'heal', 'stat'].includes(m.kind)) err('kind ' + id); }
for (const id of MAP_IDS) {
  const m = getMap(id);
  const blocked = Array.from({ length: m.h }, (_, j) => Array.from({ length: m.w }, (_, i) => SOLID_GROUND.has(m.ground[j][i]) || SOLID_OBJ.has(m.obj[j][i])));
  if (m.ground.some((r) => r.length !== m.w) || m.obj.some((r) => r.length !== m.w)) err(`${id}: largeur de ligne incohérente`);
  const warps = [...(m.warps || [])];
  for (const b of m.buildings || []) {
    for (let j = b.y; j < b.y + b.h; j++) for (let i = b.x; i < b.x + b.w; i++) blocked[j][i] = true;
    blocked[b.y + b.h - 1][b.x + b.door] = false;
    if (b.warp) warps.push({ x: b.x + b.door, y: b.y + b.h - 1, ...b.warp });
  }
  const npcAt = new Set((m.npcs || []).map((n) => n.x + ',' + n.y));
  // point de départ : première warp d'arrivée connue (cherche depuis les autres cartes) ou position de départ
  const starts = [];
  for (const oid of MAP_IDS) { const om = getMap(oid); const ws = [...(om.warps || []), ...(om.buildings || []).filter((b) => b.warp).map((b) => b.warp)]; ws.forEach((w) => { if (w.to === id) starts.push([w.tx, w.ty]); }); }
  if (id === 'home') starts.push([4, 3]);
  if (!starts.length) err(`${id}: aucune entrée`);
  for (const [sx, sy] of starts) {
    if (blocked[sy][sx]) { err(`${id}: entrée (${sx},${sy}) bloquée`); continue; }
    const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k) || blocked[ny][nx]) continue; seen.add(k); q.push([nx, ny]); } }
    // cibles : adjacent à chaque PNJ / interaction, items, warps
    const adj = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => seen.has(x + dx + ',' + (y + dy)) || (m.obj[y + dy] && m.obj[y + dy][x + dx] === 'C' && seen.has(x + 2 * dx + ',' + (y + 2 * dy))));
    for (const n of m.npcs || []) { if (!adj(n.x, n.y) && !seen.has(n.x + ',' + n.y)) err(`${id}: PNJ ${n.id} (${n.x},${n.y}) inaccessible depuis (${sx},${sy})`); if (n.talk && !SCRIPTS[n.talk]) err(`${id}: script ${n.talk} manquant`); }
    for (const it of m.items || []) { if (!seen.has(it.x + ',' + it.y)) err(`${id}: objet ${it.id} inaccessible depuis (${sx},${sy})`); if (!ITEMS[it.item]) err('objet inconnu ' + it.item); }
    for (const w of warps) { if (!seen.has(w.x + ',' + w.y)) err(`${id}: warp (${w.x},${w.y}) inaccessible depuis (${sx},${sy})`); }
    for (const ia of m.interacts || []) { if (!adj(ia.x, ia.y)) err(`${id}: interaction (${ia.x},${ia.y}) inaccessible depuis (${sx},${sy})`); const [nm] = ia.talk.split(':'); if (!SCRIPTS[nm]) err(`${id}: script ${ia.talk} manquant`); }
    for (const sg of m.signs || []) if (!adj(sg.x, sg.y)) err(`${id}: panneau (${sg.x},${sg.y}) inaccessible`);
  }
  for (const w of warps) { const tm = getMap(w.to); if (!tm) err(`${id}: warp vers carte inconnue ${w.to}`); }
  for (const n of m.npcs || []) if (n.trainer && n.trainer.team) for (const [s, l] of n.trainer.team) if (!SPECIES[s]) err('espèce dresseur ' + s);
  for (const e of m.encounters ? m.encounters.table : []) if (!SPECIES[e.s]) err('espèce rencontre ' + e.s);
}
console.log(errors ? `${errors} erreur(s)` : 'Données OK : cartes accessibles, scripts et références valides.');
process.exit(errors ? 1 : 0);
