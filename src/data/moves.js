// kind: 'dmg' (dégâts, effet secondaire optionnel) | 'heal' (soin soi-même, part des PV max) | 'stat' (modif. de stat)
// effect: { stat:'atk|def|spd', stages:±n, self:bool, chance:0..1 }
export const MOVES = {
  charge:       { name: 'Charge',            type: 'normal', kind: 'dmg', power: 40, acc: 100 },
  coup_bec:     { name: 'Coup de bec',       type: 'normal', kind: 'dmg', power: 55, acc: 100 },
  plaquage:     { name: 'Plaquage',          type: 'normal', kind: 'dmg', power: 70, acc: 90 },
  rugissement:  { name: 'Rugissement',       type: 'normal', kind: 'stat', acc: 100, effect: { stat: 'atk', stages: -1, self: false } },
  posture:      { name: 'Posture',           type: 'normal', kind: 'stat', effect: { stat: 'def', stages: 1, self: true } },
  agilite:      { name: 'Agilité',           type: 'normal', kind: 'stat', effect: { stat: 'spd', stages: 2, self: true } },
  repos:        { name: 'Récupération',      type: 'normal', kind: 'heal', heal: 0.5 },
  feuille:      { name: 'Feuille-lame', type: 'flore', kind: 'dmg', power: 45, acc: 100 },
  liane:        { name: 'Fouet-liane',       type: 'flore',  kind: 'dmg', power: 60, acc: 95 },
  epine:        { name: "Tir d'épines",      type: 'flore',  kind: 'dmg', power: 40, acc: 100, effect: { stat: 'def', stages: -1, self: false, chance: 0.3 } },
  pollen:       { name: 'Pollen',            type: 'flore',  kind: 'stat', acc: 100, effect: { stat: 'spd', stages: -1, self: false } },
  herisse:      { name: 'Hérissement',       type: 'flore',  kind: 'stat', effect: { stat: 'def', stages: 2, self: true } },
  braise:       { name: 'Étincelle',         type: 'braise', kind: 'dmg', power: 40, acc: 100 },
  flambee:      { name: 'Flambée',           type: 'braise', kind: 'dmg', power: 65, acc: 95 },
  ardeur:       { name: 'Ardeur',            type: 'braise', kind: 'stat', effect: { stat: 'atk', stages: 1, self: true } },
  jet:          { name: "Jet d'eau",         type: 'onde',   kind: 'dmg', power: 40, acc: 100 },
  bulle:        { name: 'Brume-bulles',      type: 'onde',   kind: 'dmg', power: 35, acc: 100, effect: { stat: 'spd', stages: -1, self: false, chance: 0.5 } },
  vague:        { name: 'Vague',             type: 'onde',   kind: 'dmg', power: 65, acc: 95 },
  eclat:        { name: 'Éclat',             type: 'eclat',  kind: 'dmg', power: 40, acc: 100 },
  rayon:        { name: 'Rayon-prisme',      type: 'eclat',  kind: 'dmg', power: 70, acc: 90 },
  eblouir:      { name: 'Éblouir',           type: 'eclat',  kind: 'stat', acc: 100, effect: { stat: 'def', stages: -1, self: false } },
  aura:         { name: 'Aura sacrée',       type: 'eclat',  kind: 'heal', heal: 0.5 },
  morsure:      { name: "Croc d'ombre",   type: 'ombre',  kind: 'dmg', power: 45, acc: 100, effect: { stat: 'def', stages: -1, self: false, chance: 0.2 } },
  griffe:       { name: 'Griffe-ombre',  type: 'ombre',  kind: 'dmg', power: 65, acc: 95 },
  hurlement:    { name: 'Hurlement',         type: 'ombre',  kind: 'stat', acc: 100, effect: { stat: 'atk', stages: -2, self: false } },
  eclipse:      { name: 'Éclipse',           type: 'ombre',  kind: 'dmg', power: 80, acc: 90 },
};

export const STAT_NAMES = { atk: 'Attaque', def: 'Défense', spd: 'Vitesse' };
// description courte pour les menus
export function moveInfo(id) {
  const m = MOVES[id];
  if (m.kind === 'dmg') return { power: m.power, acc: m.acc, text: m.effect ? `${Math.round((m.effect.chance || 1) * 100)}%: ${STAT_NAMES[m.effect.stat]} ${m.effect.stages > 0 ? '+' : ''}${m.effect.stages}` : 'Dégâts' };
  if (m.kind === 'heal') return { power: null, acc: null, text: `Soigne ${Math.round(m.heal * 100)}% PV` };
  const e = m.effect; return { power: null, acc: m.acc || null, text: `${e.self ? 'Soi' : 'Adv.'}: ${STAT_NAMES[e.stat]} ${e.stages > 0 ? '+' : ''}${e.stages}` };
}
