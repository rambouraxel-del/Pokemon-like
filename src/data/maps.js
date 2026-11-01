// Cartes du jeu : géométrie, bâtiments, warps, PNJ, objets, rencontres sauvages.
// Les scripts (dialogues, événements) sont dans story.js, référencés par clé (talk:'mom').
import { MapBuilder } from './mapbuilder.js';

const f = (k) => (G) => !!G.s.flags[k];

// ---------- intérieurs ----------
function room(w, h, windowCols = [], mats = []) {
  const m = new MapBuilder(w, h, '_');
  m.gRect('I', 0, 0, w, h);
  m.gRect('_', 1, 1, w - 2, h - 2);
  m.gRect('W', 1, 0, w - 2, 1);
  windowCols.forEach((x) => m.gset(x, 0, 'X'));
  m.gRect('I', 0, h - 1, w, 1);
  mats.forEach((x) => m.gset(x, h - 1, 'e'));
  return m;
}

function home() {
  const m = room(10, 8, [2, 6], [4, 5]);
  m.gRect('k', 3, 3, 4, 3);
  m.oset(1, 1, 'B'); m.oset(8, 1, 'Q'); m.oset(6, 1, 'R'); m.oset(7, 1, 'R'); m.oset(7, 4, 'E');
  return {
    id: 'home', name: 'Maison de Noa', theme: 'village', indoor: true, music: 'inside', bg: 'village', ...m.build(),
    warps: [{ x: 4, y: 7, to: 'village', tx: 6, ty: 8, dir: 'down' }, { x: 5, y: 7, to: 'village', tx: 6, ty: 8, dir: 'down' }],
    npcs: [{ id: 'mom', x: 5, y: 4, dir: 'left', look: 'mom', name: 'Maman', talk: 'mom' }],
    interacts: [{ x: 1, y: 1, talk: 'bed' }, { x: 7, y: 4, talk: 'homeTable' }, { x: 6, y: 1, talk: 'homeShelf' }, { x: 7, y: 1, talk: 'homeShelf' }],
  };
}

function lab() {
  const m = room(12, 9, [3, 8], [5, 6]);
  m.gRect('k', 4, 5, 4, 2);
  m.oset(1, 1, 'R'); m.oset(2, 1, 'R'); m.oset(9, 1, 'R'); m.oset(10, 1, 'R'); m.oset(10, 5, 'E'); m.oset(1, 6, 'Q'); m.oset(10, 7, 'Q');
  m.oset(3, 3, 'N'); m.oset(6, 3, 'N'); m.oset(9, 3, 'N');
  return {
    id: 'lab', name: 'Laboratoire du Pr Sauge', theme: 'village', indoor: true, music: 'inside', bg: 'village', ...m.build(),
    warps: [{ x: 5, y: 8, to: 'village', tx: 15, ty: 8, dir: 'down' }, { x: 6, y: 8, to: 'village', tx: 15, ty: 8, dir: 'down' }],
    npcs: [
      { id: 'prof', x: 6, y: 1, dir: 'down', look: 'prof', name: 'Pr Sauge', talk: 'prof' },
      { id: 'aide', x: 2, y: 5, dir: 'right', look: 'villagerF', name: 'Assistante', talk: 'aide' },
      { id: 'rival_lab', x: 9, y: 5, dir: 'left', look: 'rival', name: 'Lior', talk: 'rivalLab', hideIf: (G) => !!G.s.flags.rival1 },
    ],
    interacts: [
      { x: 3, y: 3, talk: 'pedestal:feuillin' }, { x: 6, y: 3, talk: 'pedestal:braisillon' }, { x: 9, y: 3, talk: 'pedestal:gouttelin' },
      { x: 10, y: 5, talk: 'labTable' }, { x: 1, y: 1, talk: 'labShelf' }, { x: 2, y: 1, talk: 'labShelf' }, { x: 9, y: 1, talk: 'labShelf' }, { x: 10, y: 1, talk: 'labShelf' },
    ],
    events: [{ x: 5, y: 7, once: 'labIntro', talk: 'labIntro', when: (G) => !G.s.flags.starter }, { x: 6, y: 7, once: 'labIntro', talk: 'labIntro', when: (G) => !G.s.flags.starter }],
  };
}

function shop() {
  const m = room(8, 7, [2, 5], [3, 4]);
  m.gRect('k', 2, 4, 4, 1);
  m.oRect('C', 1, 3, 6, 1); m.oset(1, 1, 'R'); m.oset(6, 1, 'R'); m.oset(6, 2, 'U'); m.oset(5, 2, 'U'); m.oset(1, 5, 'U');
  return {
    id: 'shop', name: 'Boutique Lanterne', theme: 'village', indoor: true, music: 'inside', bg: 'village', ...m.build(),
    warps: [{ x: 3, y: 6, to: 'village', tx: 30, ty: 8, dir: 'down' }, { x: 4, y: 6, to: 'village', tx: 30, ty: 8, dir: 'down' }],
    npcs: [
      { id: 'shopkeeper', x: 3, y: 2, dir: 'down', look: 'shop', name: 'Marchand', talk: 'shop' },
      { id: 'customer', x: 5, y: 5, dir: 'left', look: 'villager', name: 'Client', talk: 'shopCustomer' },
    ],
    interacts: [],
  };
}

function heal() {
  const m = room(8, 7, [2, 5], [3, 4]);
  m.gRect('k', 3, 4, 2, 1);
  m.oRect('C', 1, 3, 6, 1); m.oset(5, 1, 'M'); m.oset(1, 1, 'Q'); m.oset(1, 4, 'V');
  return {
    id: 'heal', name: 'Maison des Soins', theme: 'village', indoor: true, music: 'inside', bg: 'village', ...m.build(),
    warps: [{ x: 3, y: 6, to: 'village', tx: 23, ty: 8, dir: 'down' }, { x: 4, y: 6, to: 'village', tx: 23, ty: 8, dir: 'down' }],
    npcs: [{ id: 'nurse', x: 3, y: 2, dir: 'down', look: 'nurse', name: 'Infirmière', talk: 'nurse' }],
    interacts: [{ x: 1, y: 4, talk: 'pc' }],
  };
}

function sanctum() {
  const m = new MapBuilder(14, 11, 'T');
  m.gRect('D', 0, 0, 14, 1); m.gRect('D', 0, 0, 1, 11); m.gRect('D', 13, 0, 1, 11); m.gRect('D', 0, 10, 14, 1);
  m.gRect('e', 6, 10, 2, 1);
  m.gRect('k', 5, 5, 4, 5);
  m.oset(6, 1, 'A'); m.oset(7, 1, 'A');
  [[2, 3], [2, 6], [11, 3], [11, 6]].forEach(([x, y]) => m.oset(x, y, 'P'));
  m.oset(3, 8, 'Y'); m.oset(10, 8, 'Y');
  return {
    id: 'sanctum', name: 'Sanctuaire des Lueurs', theme: 'ruins', indoor: true, music: 'ruins', bg: 'ruins', ...m.build(),
    warps: [{ x: 6, y: 10, to: 'ruins', tx: 14, ty: 7, dir: 'down' }, { x: 7, y: 10, to: 'ruins', tx: 14, ty: 7, dir: 'down' }],
    npcs: [
      { id: 'vesper', x: 7, y: 3, dir: 'down', look: 'boss', name: 'Maître Vesper', talk: 'vesper', hideIf: () => false,
        trainer: { sight: 0, boss: true } },
      { id: 'tenebrume_npc', x: 5, y: 3, dir: 'down', look: null, creature: 'tenebrume', name: 'Ténébrume', talk: 'tenebrumeNpc', hideIf: (G) => !!G.s.flags.ending },
    ],
    interacts: [{ x: 6, y: 1, talk: 'altar' }, { x: 7, y: 1, talk: 'altar' }, { x: 3, y: 8, talk: 'runeW' }, { x: 10, y: 8, talk: 'runeE' }],
    events: [{ x: 6, y: 7, once: 'vesperIntro', talk: 'vesperIntro', when: (G) => !G.s.flags.bossBeaten }, { x: 7, y: 7, once: 'vesperIntro', talk: 'vesperIntro', when: (G) => !G.s.flags.bossBeaten }],
  };
}

// ---------- extérieurs ----------
function village() {
  const m = new MapBuilder(36, 24, '.');
  m.gRect('p', 2, 9, 34, 2);
  [6, 15, 23, 30].forEach((x) => m.gset(x, 8, 'p'));
  m.clear(2, 8, 34, 3);
  // jardin clôturé (sud-ouest)
  m.gRect('f', 4, 13, 5, 3);
  m.oRect('F', 3, 12, 7, 1); m.oRect('F', 3, 16, 7, 1); m.oRect('F', 3, 13, 1, 3); m.oRect('F', 9, 13, 1, 3);
  m.oset(6, 12, ' '); m.gset(6, 12, 'p'); m.gset(6, 11, 'p');
  // étang
  m.gRect('w', 13, 14, 6, 4); m.gRect('w', 14, 13, 4, 1); m.gRect('w', 14, 18, 4, 1); m.gRect('w', 12, 15, 1, 2); m.gRect('w', 19, 15, 1, 2);
  m.oset(11, 14, 'r'); m.oset(20, 17, 'r'); m.oset(13, 19, 'b'); m.oset(19, 19, 'b');
  // fleurs devant les maisons
  [[4, 8], [5, 8], [8, 8], [9, 8], [13, 8], [14, 8], [17, 8], [18, 8], [21, 8], [22, 8], [25, 8], [26, 8], [28, 8], [29, 8], [32, 8], [33, 8]].forEach(([x, y]) => m.gset(x, y, 'f'));
  // plateau sud-est avec falaise
  m.gRect('f', 22, 13, 4, 2); m.gRect('f', 29, 14, 4, 2);
  m.gRect('c', 21, 17, 5, 2); m.gRect('c', 28, 17, 6, 2);
  m.gRect('p', 26, 17, 2, 2); m.gRect('p', 26, 15, 2, 2); m.gRect('p', 26, 11, 2, 4);
  m.clear(26, 11, 2, 10);
  // arbres : bordure (trouée à l'est sur la route) + dispersés
  m.border('t', 2, [{ x1: 34, y1: 9, x2: 35, y2: 10 }]);
  m.clear(30, 8, 1, 1);
  m.scatter('t', 14, 11, 2, 11, 33, 21, ['.']);
  m.scatter('b', 8, 12, 2, 11, 33, 21, ['.']);
  m.oset(10, 8, 'S'); m.oset(32, 7, 'S');
  m.oset(2, 9, ' ');
  m.o[9][0] = 't'; m.o[10][0] = 't'; m.o[9][1] = 't'; m.o[10][1] = 't';
  // pas d'objets sur la route
  for (let y = 9; y <= 10; y++) for (let x = 2; x < 34; x++) m.o[y][x] = ' ';
  m.o[9][0] = 't'; m.o[10][0] = 't'; m.o[9][1] = 't'; m.o[10][1] = 't';
  return {
    id: 'village', name: 'Aubépine', theme: 'village', music: 'village', bg: 'village', ...m.build(),
    buildings: [
      { x: 4, y: 3, w: 5, h: 5, door: 2, wall: '#f0dcb8', roof: '#d8604a', emblem: 'chimney', windows: [0], warp: { to: 'home', tx: 4, ty: 6, dir: 'up' } },
      { x: 12, y: 2, w: 7, h: 6, door: 3, wall: '#e8eaf4', roof: '#4a78c8', emblem: 'lab', windows: [0, 5], warp: { to: 'lab', tx: 5, ty: 7, dir: 'up' } },
      { x: 21, y: 3, w: 5, h: 5, door: 2, wall: '#fbe8ec', roof: '#e8647a', emblem: 'cross', windows: [0], warp: { to: 'heal', tx: 3, ty: 5, dir: 'up' } },
      { x: 28, y: 4, w: 5, h: 4, door: 2, wall: '#f4e4b8', roof: '#58a85a', emblem: 'coin', awning: true, windows: [0], warp: { to: 'shop', tx: 3, ty: 5, dir: 'up' } },
    ],
    warps: [{ x: 35, y: 9, to: 'forest', tx: 2, ty: 19, dir: 'right' }, { x: 35, y: 10, to: 'forest', tx: 2, ty: 20, dir: 'right' }],
    signs: [
      { x: 10, y: 8, text: ["AUBÉPINE - Village des lueurs.", "Labo du Pr Sauge au centre. Boutique et Maison des Soins à l'est."] },
      { x: 32, y: 7, text: ["Route de la forêt de Brumevert.", "Les hautes herbes y abritent des Lumins sauvages."] },
    ],
    npcs: [
      { id: 'papy', x: 11, y: 11, dir: 'down', look: 'elder', name: 'Papy Tilleul', talk: 'papy' },
      { id: 'kid', x: 14, y: 12, dir: 'down', look: 'kid', name: 'Petit Malo', talk: 'kid' },
      { id: 'dame', x: 24, y: 12, dir: 'left', look: 'villagerF', name: 'Villageoise', talk: 'dame' },
      { id: 'jardinier', x: 6, y: 14, dir: 'down', look: 'villager', name: 'Jardinier', talk: 'jardinier' },
    ],
    items: [{ id: 'v_lanterne', x: 31, y: 15, item: 'lanterne', n: 2 }, { id: 'v_baume', x: 23, y: 20, item: 'baume', n: 1 }],
    events: [
      { x: 34, y: 9, talk: 'blockExit', when: (G) => !G.s.flags.starter },
      { x: 34, y: 10, talk: 'blockExit', when: (G) => !G.s.flags.starter },
    ],
  };
}

function forest() {
  const m = new MapBuilder(46, 32, '.');
  // rivière + pont
  m.gRect('w', 15, 2, 4, 28);
  m.gRect('=', 15, 19, 4, 2);
  // chemin principal
  m.gRect('p', 0, 19, 15, 2);
  m.gRect('p', 19, 19, 8, 2); m.gRect('p', 25, 9, 2, 12); m.gRect('p', 25, 9, 12, 2); m.gRect('p', 35, 2, 2, 9);
  // petit chemin vers la source et le coin ouest
  m.gRect('p', 8, 14, 2, 5);
  m.clear(0, 19, 46, 2); m.clear(25, 9, 2, 12); m.clear(25, 9, 12, 2); m.clear(35, 2, 2, 9); m.clear(8, 14, 2, 5);
  // hautes herbes
  [[5, 14, 3.5, 2.6], [11, 24, 3.6, 3], [5, 25, 3, 2.4], [22, 24, 3.8, 3], [29, 14, 3.6, 3], [22, 5, 3.6, 3], [38, 13, 3.8, 3], [10, 7, 3.4, 2.6], [30, 25, 3.4, 2.6], [40, 24, 3, 3]].forEach(([x, y, rx, ry]) => m.patch(',', x, y, rx, ry));
  // fleurs
  m.scatter('b', 10, 3, 2, 2, 44, 30, ['.']);
  m.patch('f', 3, 22, 2, 1.5); m.patch('f', 32, 5, 2.5, 1.5); m.patch('f', 21, 12, 2, 1.5);
  // falaise (relief) au nord-est
  m.gRect('c', 28, 4, 5, 2); m.gRect('c', 38, 4, 6, 2);
  m.gRect('c', 21, 28, 8, 1);
  m.border('t', 2, [{ x1: 0, y1: 19, x2: 1, y2: 20 }, { x1: 35, y1: 0, x2: 36, y2: 1 }]);
  // couvert forestier
  m.scatter('t', 70, 21, 2, 2, 43, 29, ['.']);
  m.scatter('r', 8, 22, 2, 2, 43, 29, ['.']);
  // goulot du sceau
  m.oset(37, 5, 'r'); m.oset(37, 4, 'r');
  m.oset(34, 5, 't'); m.oset(34, 4, 't'); m.oset(34, 6, 't');
  m.gRect('p', 35, 2, 2, 9);
  for (let y = 2; y <= 10; y++) { m.o[y][35] = ' '; m.o[y][36] = ' '; }
  m.o[5][37] = 'r'; m.o[4][37] = 'r'; m.o[6][37] = 'r'; m.o[3][37] = 'r'; m.o[2][37] = 'r';
  m.o[5][34] = 't'; m.o[4][34] = 't'; m.o[6][34] = 't'; m.o[3][34] = 't';
  // source de soin
  m.gRect('T', 28, 7, 3, 2); m.o[7][29] = 'H';
  m.oset(30, 6, 'b');
  m.oset(2, 17, 'S'); m.oset(33, 11, 'S');
  // objets sur le chemin : rien
  for (let y = 19; y <= 20; y++) for (let x = 0; x < 28; x++) m.o[y][x] = ' ';
  for (let y = 9; y <= 20; y++) for (let x = 25; x <= 26; x++) m.o[y][x] = ' ';
  for (let y = 9; y <= 10; y++) for (let x = 25; x <= 36; x++) m.o[y][x] = ' ';
  for (let y = 11; y <= 20; y++) for (let x = 25; x <= 26; x++) m.o[y][x] = ' ';
  for (let y = 8; y <= 10; y++) for (let x = 8; x <= 9; x++) m.o[y][x] = ' ';
  for (let y = 14; y <= 19; y++) for (let x = 8; x <= 9; x++) m.o[y][x] = ' ';
  m.o[7][29] = 'H';
  return {
    id: 'forest', name: 'Forêt de Brumevert', theme: 'forest', music: 'forest', bg: 'forest', ...m.build(),
    warps: [
      { x: 0, y: 19, to: 'village', tx: 33, ty: 9, dir: 'left' }, { x: 0, y: 20, to: 'village', tx: 33, ty: 10, dir: 'left' },
      { x: 35, y: 0, to: 'ruins', tx: 14, ty: 26, dir: 'up' }, { x: 36, y: 0, to: 'ruins', tx: 15, ty: 26, dir: 'up' },
    ],
    signs: [
      { x: 2, y: 17, text: ["FORÊT DE BRUMEVERT.", "Dans les hautes herbes, des Lumins sauvages rôdent. Affaiblis-les avant de lancer une lanterne !"] },
      { x: 33, y: 11, text: ["Sanctuaire des Lueurs : au nord.", "Le sceau n'est ouvert qu'aux dresseurs accompagnés."] },
    ],
    interacts: [{ x: 29, y: 7, talk: 'spring' }],
    encounters: { rate: 0.12, table: [
      { s: 'plumette', min: 3, max: 6, w: 32 }, { s: 'ronceau', min: 4, max: 6, w: 22 }, { s: 'feuillin', min: 3, max: 5, w: 5 },
      { s: 'braisillon', min: 3, max: 5, w: 5 }, { s: 'gouttelin', min: 3, max: 5, w: 5 }, { s: 'lucioline', min: 4, max: 6, w: 12 }, { s: 'noctule', min: 4, max: 6, w: 10 },
    ] },
    npcs: [
      { id: 'lea', x: 4, y: 18, dir: 'right', look: 'scout', name: 'Léa', talk: 'lea' },
      { id: 'pia', x: 8, y: 15, dir: 'down', look: 'hiker', name: 'Pia', talk: 'trainer', trainer: { id: 'pia', cls: 'Randonneuse', sight: 4, reward: 90, team: [['plumette', 5], ['plumette', 6]],
        intro: ["Halte là ! Mes Plumettes ont envie de jouer !"], defeat: ["Oh... elles se sont bien battues pourtant."], after: ["Chaque combat t'apporte de l'expérience. Garde un oeil sur tes PV !"] } },
      { id: 'lior_forest', x: 21, y: 20, dir: 'left', look: 'rival', name: 'Lior', talk: 'rivalForest', hideIf: (G) => !!G.s.flags.rival2,
        trainer: { id: 'rival2', cls: 'Rival', sight: 5, rival: true } },
      { id: 'marcel', x: 28, y: 14, dir: 'left', look: 'breeder', name: 'Marcel', talk: 'trainer', trainer: { id: 'marcel', cls: 'Éleveur', sight: 4, reward: 110, team: [['ronceau', 6], ['plumette', 7]],
        intro: ["Mes Lumins sont élevés avec amour ! Voyons ce que valent les tiens."], defeat: ["Bravo, tu as de l'allure."], after: ["Un type avantageux fait toute la différence : l'eau éteint le feu, le feu brûle les plantes..."] } },
      { id: 'zoe', x: 33, y: 8, dir: 'down', look: 'villagerF', name: 'Zoé', talk: 'trainer', trainer: { id: 'zoe', cls: 'Collectionneuse', sight: 4, reward: 130, team: [['lucioline', 7], ['noctule', 7]],
        intro: ["Je collectionne les Lumins rares ! Montre-moi les tiens."], defeat: ["Magnifique combat !"], after: ["La source de lumière, près d'ici, soigne gratuitement tous les Lumins."] } },
      { id: 'gardien', x: 35, y: 5, dir: 'down', look: 'guard', name: 'Gardien Orme', talk: 'gardien', hideIf: (G) => !!G.s.flags.gateOpen },
      { id: 'gardienne', x: 36, y: 5, dir: 'down', look: 'guard', name: 'Gardienne Aspe', talk: 'gardien', hideIf: (G) => !!G.s.flags.gateOpen },
    ],
    items: [
      { id: 'f_baume', x: 4, y: 15, item: 'baume', n: 1 }, { id: 'f_lanterne', x: 23, y: 26, item: 'lanterne', n: 2 },
      { id: 'f_ecus', x: 41, y: 15, item: 'grand_baume', n: 1 }, { id: 'f_super', x: 12, y: 26, item: 'super_lanterne', n: 1 },
    ],
    events: [],
  };
}

function ruins() {
  const m = new MapBuilder(30, 28, '.');
  m.gRect('T', 13, 7, 4, 21);
  m.gRect('T', 9, 14, 12, 4);
  m.gRect('T', 11, 24, 3, 2);
  m.clear(13, 7, 4, 21); m.clear(9, 14, 12, 4);
  [[4, 20, 4, 3.5], [24, 21, 3.6, 3], [5, 10, 3, 3], [25, 10, 3.4, 3.4], [22, 4, 2.6, 2.4], [6, 4, 2.6, 2.4]].forEach(([x, y, rx, ry]) => m.patch(',', x, y, rx, ry));
  m.border('t', 2, [{ x1: 14, y1: 26, x2: 15, y2: 27 }]);
  m.scatter('t', 22, 31, 2, 8, 27, 25, ['.']);
  m.scatter('r', 8, 32, 2, 8, 27, 25, ['.']);
  [[12, 9], [17, 9], [12, 20], [17, 20], [12, 12], [17, 12]].forEach(([x, y]) => m.oset(x, y, 'P'));
  m.oset(10, 16, 'Y'); m.oset(19, 16, 'Y');
  m.oset(12, 24, 'H'); m.gset(12, 24, 'T');
  m.oset(11, 22, 'S');
  // dégager l'avenue
  for (let y = 7; y < 28; y++) for (let x = 13; x < 17; x++) if (m.o[y][x] !== 'P') m.o[y][x] = ' ';
  for (let y = 14; y <= 17; y++) for (let x = 9; x <= 20; x++) if (m.o[y][x] !== 'Y') m.o[y][x] = ' ';
  m.o[25][14] = ' '; m.o[25][15] = ' '; m.o[26][14] = ' '; m.o[26][15] = ' '; m.o[27][14] = ' '; m.o[27][15] = ' ';
  return {
    id: 'ruins', name: 'Sanctuaire des Lueurs', theme: 'ruins', music: 'ruins', bg: 'ruins', ...m.build(),
    buildings: [{ x: 9, y: 1, w: 12, h: 6, door: 5, wall: '#b4b0c4', roof: '#5a5a92', trim: '#d8d4e8', base: '#6a667c', doorC: '#4a4468', windows: [1, 8], warp: { to: 'sanctum', tx: 6, ty: 9, dir: 'up' } }],
    warps: [{ x: 14, y: 27, to: 'forest', tx: 35, ty: 2, dir: 'down' }, { x: 15, y: 27, to: 'forest', tx: 36, ty: 2, dir: 'down' }],
    signs: [{ x: 11, y: 22, text: ["Une source de lumière coule encore ici.", "Elle soigne ceux qui s'approchent avec respect."] }],
    interacts: [{ x: 12, y: 24, talk: 'spring' }, { x: 10, y: 16, talk: 'runeW' }, { x: 19, y: 16, talk: 'runeE' }],
    encounters: { rate: 0.13, table: [
      { s: 'noctule', min: 8, max: 11, w: 34 }, { s: 'lucioline', min: 8, max: 11, w: 30 }, { s: 'ronceau', min: 8, max: 10, w: 16 }, { s: 'plumette', min: 8, max: 10, w: 12 },
      { s: 'braisillon', min: 8, max: 10, w: 4 }, { s: 'gouttelin', min: 8, max: 10, w: 4 },
    ] },
    npcs: [
      { id: 'disciple1', x: 14, y: 19, dir: 'down', look: 'disciple', name: 'Disciple', talk: 'trainer', trainer: { id: 'disciple1', cls: "Disciple de l'Ombre", sight: 4, reward: 200, team: [['noctule', 9], ['noctule', 10]],
        intro: ["L'Éclat est en sécurité avec Maître Vesper. Fais demi-tour !"], defeat: ["Impossible... Mais Maître Vesper t'arrêtera."], after: ["Maître Vesper t'attend dans le sanctuaire..."] } },
      { id: 'disciple2', x: 19, y: 10, dir: 'left', look: 'disciple', name: 'Disciple', talk: 'trainer', trainer: { id: 'disciple2', cls: "Disciple de l'Ombre", sight: 4, reward: 220, team: [['ronceau', 10], ['lucioline', 10]],
        intro: ["Tu ne passeras pas ! L'ombre protège la gardienne !"], defeat: ["Tu es plus fort que prévu..."], after: ["Va... Maître Vesper n'est pas méchant. Il est juste désespéré. Sa gardienne Ténébrume craint la lumière, souviens-t'en."] } },
    ],
    items: [{ id: 'r_baume1', x: 5, y: 15, item: 'grand_baume', n: 1 }, { id: 'r_rappel', x: 24, y: 17, item: 'rappel', n: 1 }, { id: 'r_super', x: 8, y: 6, item: 'super_lanterne', n: 2 }],
    events: [],
  };
}

const BUILDERS = { home, lab, shop, heal, sanctum, village, forest, ruins };
const cache = {};
// retire les obstacles décoratifs sous les PNJ / objets ramassables / warps pour garantir l'accès
function normalize(m) {
  const clearAt = (x, y) => {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return;
    if (m.obj[y][x] !== ' ') m.obj[y] = m.obj[y].substring(0, x) + ' ' + m.obj[y].substring(x + 1);
    if (['w', 'c'].includes(m.ground[y][x])) m.ground[y] = m.ground[y].substring(0, x) + '.' + m.ground[y].substring(x + 1);
  };
  (m.npcs || []).forEach((n) => clearAt(n.x, n.y));
  (m.items || []).forEach((n) => clearAt(n.x, n.y));
  (m.warps || []).forEach((n) => { clearAt(n.x, n.y); });
  return m;
}
export function getMap(id) {
  if (!cache[id]) cache[id] = normalize(BUILDERS[id]());
  return cache[id];
}
export const MAP_IDS = Object.keys(BUILDERS);
