// Huit espèces originales. `learnset`: [niveau, attaque]. `sprite` : clé dans gfx/creatures.js
export const SPECIES = {
  feuillin: {
    id: 'feuillin', no: 1, name: 'Feuillin', type: 'flore', base: { hp: 45, atk: 49, def: 49, spd: 45 }, catchRate: 120, exp: 62,
    learnset: [[1, 'charge'], [1, 'rugissement'], [4, 'feuille'], [7, 'pollen'], [10, 'liane'], [13, 'repos']],
    desc: "Une pousse rieuse. La feuille sur sa tête capte la moindre lueur du matin.",
  },
  braisillon: {
    id: 'braisillon', no: 2, name: 'Braisillon', type: 'braise', base: { hp: 39, atk: 55, def: 43, spd: 65 }, catchRate: 120, exp: 62,
    learnset: [[1, 'charge'], [1, 'braise'], [4, 'agilite'], [7, 'ardeur'], [10, 'flambee'], [13, 'plaquage']],
    desc: "Petit renard dont la queue ne s'éteint jamais. Il réchauffe les mains de ses amis.",
  },
  gouttelin: {
    id: 'gouttelin', no: 3, name: 'Gouttelin', type: 'onde', base: { hp: 50, atk: 48, def: 55, spd: 43 }, catchRate: 120, exp: 62,
    learnset: [[1, 'charge'], [1, 'jet'], [4, 'posture'], [7, 'bulle'], [10, 'vague'], [13, 'repos']],
    desc: "Né d'une goutte de rosée. Il adore les flaques et les câlins.",
  },
  plumette: {
    id: 'plumette', no: 4, name: 'Plumette', type: 'normal', base: { hp: 40, atk: 46, def: 40, spd: 58 }, catchRate: 220, exp: 45,
    learnset: [[1, 'charge'], [1, 'agilite'], [5, 'coup_bec'], [8, 'rugissement'], [11, 'plaquage'], [14, 'posture']],
    desc: "Oiseau dodu et curieux, présent partout. Sa houppe tressaute quand il est content.",
  },
  ronceau: {
    id: 'ronceau', no: 5, name: 'Ronceau', type: 'flore', base: { hp: 52, atk: 56, def: 56, spd: 36 }, catchRate: 150, exp: 58,
    learnset: [[1, 'charge'], [1, 'epine'], [5, 'herisse'], [8, 'liane'], [11, 'plaquage'], [14, 'repos']],
    desc: "Hérisson de sous-bois. Une fleur pousse entre ses épines quand il se sent en sécurité.",
  },
  noctule: {
    id: 'noctule', no: 6, name: 'Noctule', type: 'ombre', base: { hp: 42, atk: 52, def: 42, spd: 72 }, catchRate: 130, exp: 66,
    learnset: [[1, 'morsure'], [1, 'rugissement'], [5, 'agilite'], [8, 'griffe'], [12, 'repos'], [15, 'hurlement']],
    desc: "Chauve-souris des ruines. Ses yeux brillent là où la lumière a disparu.",
  },
  lucioline: {
    id: 'lucioline', no: 7, name: 'Lucioline', type: 'eclat', base: { hp: 46, atk: 46, def: 50, spd: 62 }, catchRate: 100, exp: 70,
    learnset: [[1, 'eclat'], [1, 'posture'], [5, 'eblouir'], [8, 'aura'], [11, 'rayon'], [14, 'agilite']],
    desc: "Phalène lumineuse. On raconte que son halo guide les voyageurs perdus.",
  },
  tenebrume: {
    id: 'tenebrume', no: 8, name: 'Ténébrume', type: 'ombre', base: { hp: 78, atk: 88, def: 72, spd: 78 }, catchRate: 15, exp: 140,
    learnset: [[1, 'morsure'], [1, 'hurlement'], [1, 'griffe'], [12, 'eclipse'], [14, 'repos']],
    desc: "Gardienne des ruines, longtemps asservie par l'ombre. Un cristal brille sur son front.",
  },
};
export const SPECIES_LIST = Object.values(SPECIES).sort((a, b) => a.no - b.no);
