// Parcours complet automatisé : de "Nouvelle partie" jusqu'à la conclusion (via les vraies entrées du jeu).
// usage: node tools/playthrough.cjs [url] [outdir]
const { launch } = require('./lib.cjs');
const OUT = process.argv[3] || '/tmp/lumina-run/';
require('fs').mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
(async () => {
  const t = await launch({ speed: 4, url: process.argv[2] ? process.argv[2] + '?speed=4' : undefined });
  await t.p.addScriptTag({ path: require('path').join(__dirname, 'bot.js') });
  const go = (x, y) => t.ev(([x, y]) => bot.walkTo(x, y), [x, y]);
  const talk = (x, y) => t.ev(([x, y]) => bot.talkAt(x, y), [x, y]);
  const handle = () => t.ev(() => bot.autoHandle());
  const idle = () => t.ev(() => bot.waitIdle());
  const state = () => t.ev(() => { const L = window.__lumina, G = L.G; return JSON.stringify({ map: L.world && L.world.mapId, pos: [G.s.player.x, G.s.player.y], team: G.s.team.map((c) => c.species + ':' + c.level + ':' + c.hp), box: G.s.box.length, money: G.s.money, items: G.s.items, flags: Object.keys(G.s.flags) }); });
  const opts = (o) => t.ev((o) => { window.botOpts = o; }, o);
  const shot = (n) => t.shot(OUT + n + '.png');
  const fail = async (m) => { log('ECHEC:', m, await state()); await shot('fail'); console.log(t.errors.join('\n')); await t.close(); process.exit(1); };
  const expect = async (cond, m) => { if (!cond) await fail(m); };

  // --- titre -> nouvelle partie -> intro (vraies touches) ---
  await shot('00_title');
  await t.press('Enter'); await t.wait(300); await shot('01_title_menu');
  await t.press('Enter'); await t.wait(1000);
  for (let i = 0; i < 8; i++) { await t.press('Enter'); await t.wait(300); await t.press('Enter'); await t.wait(300); }
  await t.until(() => window.__lumina.world && window.__lumina.world.map); await idle();
  log('monde chargé', await state());
  // --- maison : maman ---
  await t.ev(() => bot.walkTo(4, 4)); await t.ev(async () => { await bot.tap('right'); await bot.tap('a'); });
  await handle(); await shot('02_home_done');
  await go(4, 7); await idle();
  // essai de sortie sans compagnon (doit être bloqué)
  await t.ev(() => bot.tp('village', 33, 9, 'right')); await t.ev(() => bot.step('right')); await handle();
  const sx = await t.ev(() => window.__lumina.world.mapId);
  await expect(sx === 'village', 'sortie du village sans compagnon non bloquée');
  log('sortie bloquée sans compagnon : OK');
  await t.ev(() => bot.tp('village', 6, 8, 'down'));
  // --- labo : choix du compagnon ---
  await go(15, 7); await handle(); await idle(); await shot('03_lab');
  await talk(6, 3);
  await t.ev(async () => { for (let i = 0; i < 80 && !window.__lumina.ui.menu; i++) { await bot.tap('a', 1); await bot.frames(15); } });
  await shot('04_choose'); await t.ev(async () => { await bot.tap('a', 1); await bot.frames(10); });
  await opts({ heal: 0.35 });
  await t.ev(() => { window.__run = bot.autoHandle(); });
  await t.ev(async () => { await window.__run; });
  log('après rival 1', await state());
  await expect((await t.ev(() => window.__lumina.G.s.flags.rival1)) === true, 'rival1 non terminé');
  await expect((await t.ev(() => window.__lumina.G.s.items.lanterne)) >= 5, 'lanternes non reçues');
  // --- achats + soin ---
  await go(5, 8); await idle(); await go(30, 7); await idle();
  await talk(3, 3);
  await t.ev(async () => { for (let i = 0; i < 20 && (top().constructor.name !== 'ShopScene'); i++) { await bot.tap('a', 1); await bot.frames(15); } function top() { return window.__lumina.scenes.top; } });
  await shot('05_shop');
  const buy = async (idx, q) => t.ev(async ([idx, q]) => { const s = window.__lumina.scenes.top; s.i = idx; await bot.tap('a', 1); await bot.frames(10); window.__lumina.ui.menu.index = q - 1; await bot.tap('a', 1); await bot.frames(10); await bot.tap('a', 1); await bot.frames(20); }, [idx, q]);
  const money0 = await t.ev(() => window.__lumina.G.s.money);
  await buy(0, 4);      // 4 lanternes
  await buy(2, 2);      // 2 baumes
  const money1 = await t.ev(() => window.__lumina.G.s.money);
  log('achats', money0, '->', money1);
  await expect(money1 < money0 && (await t.ev(() => window.__lumina.G.s.items.lanterne)) >= 9, 'achat boutique KO');
  await t.ev(async () => { await bot.tap('b', 1); await bot.frames(10); }); await handle();
  await go(3, 6); await idle();
  await go(23, 7); await idle(); await talk(3, 3); await handle(); await shot('06_heal');
  log('soin OK', await state());
  await go(3, 6); await idle();
  // --- forêt ---
  await go(35, 9); await idle(); await shot('07_forest_entry');
  const mapId = () => t.ev(() => window.__lumina.world.mapId);
  // revient dans la zone voulue après une défaite (respawn au point de soin)
  const ensureMap = async (want) => {
    for (let k = 0; k < 6; k++) {
      const m = await mapId(); if (m === want) return true;
      if (want === 'forest' && m === 'village') await go(35, 9);
      else if (m === 'heal' || m === 'shop' || m === 'home' || m === 'lab') { await go(m === 'home' ? 4 : m === 'lab' ? 5 : 3, m === 'home' ? 7 : m === 'lab' ? 8 : 6); }
      else if (want === 'ruins' && m === 'forest') await go(35, 0);
      else if (want === 'forest' && m === 'ruins') await go(14, 27);
      else return false;
      await idle();
    }
    return (await mapId()) === want;
  };
  const grind = async (map, cx, cy, until, maxIter = 60) => {
    const spots = map === 'forest' ? [[9, 22], [14, 26], [8, 25], [13, 23]] : [[4, 18], [7, 22], [3, 21], [6, 19]];
    for (let i = 0; i < maxIter; i++) {
      if (await t.ev((u) => eval(u), until)) return true;
      if (!(await ensureMap(map))) return false;
      const sp = spots[i % spots.length];
      await go(sp[0], sp[1]); await handle();
    }
    return false;
  };
  // capture d'un 2e Lumin dans les hautes herbes au sud du chemin
  await opts({ catch: true, heal: 0.45 });
  const gotSecond = await grind('forest', 11, 24, 'window.__lumina.G.s.team.length >= 2', 120);
  await expect(gotSecond, 'capture impossible');
  log('capture OK', await state()); await shot('08_captured');
  // monter en niveau un peu : combats sauvages sans capture
  await opts({ heal: 0.45 });
  await grind('forest', 11, 24, 'window.__lumina.G.s.team[0].level >= 8', 80);
  log('niveau', await state());
  await go(14, 19); await handle(); await go(14, 19);
  // pont : rival 2 et dresseurs
  await opts({ heal: 0.4 });
  await go(25, 12); await handle();
  log('après Marcel/rival', await state());
  await go(29, 8); await handle();      // source de lumière (devant la fontaine)
  await talk(29, 7); await t.ev(async () => { for (let i = 0; i < 30 && !window.__lumina.ui.menu; i++) { await bot.tap('a', 1); await bot.frames(15); } await bot.tap('a', 1); await bot.frames(40); }); await handle();
  await go(33, 9); await handle(); await go(35, 6); await handle();
  log('devant la garde', await state());
  await expect((await t.ev(() => window.__lumina.G.s.defeated.zoe)) === true, 'Zoé non battue');
  await talk(35, 5); await handle();
  const gate = await t.ev(() => !!window.__lumina.G.s.flags.gateOpen);
  await expect(gate, 'sceau non ouvert');
  await shot('09_gate_open');
  await go(35, 0); await idle(); await shot('10_ruins');
  log('ruines', await state());
  // monter le niveau dans les ruines
  await opts({ heal: 0.35 });
  await t.ev(() => bot.tp('ruins', 14, 25, 'up'));
  await grind('ruins', 5, 20, 'window.__lumina.G.s.team[0].level >= 11 && window.__lumina.G.s.team.length >= 2', 120);
  log('avant disciples', await state());
  await go(14, 24); await handle(); await go(14, 17); await handle(); await go(15, 8); await handle();
  log('devant le sanctuaire', await state());
  // soin à la source avant le boss
  await t.ev(() => bot.tp('ruins', 12, 25, 'up')); await talk(12, 24);
  await t.ev(async () => { for (let i = 0; i < 30 && !window.__lumina.ui.menu; i++) { await bot.tap('a', 1); await bot.frames(15); } await bot.tap('a', 1); await bot.frames(40); }); await handle();
  await go(14, 6); await idle(); await shot('11_sanctum');
  // boss : le bot avance dans la salle ; l'événement lance le combat puis l'épilogue
  await opts({ heal: 0.4 });
  await go(7, 7);
  let result = null;
  for (let tries = 0; tries < 5; tries++) {
    await handle();
    const flags = await t.ev(() => window.__lumina.G.s.flags);
    if (flags.ending) { result = 'ending'; break; }
    log('boss : nouvel essai', await state());
    // défaite : retour au point de soin -> y retourner
    const m = await t.ev(() => window.__lumina.world.mapId);
    if (m !== 'sanctum') { await go(14, 6); await idle(); }
    await go(7, 7); await handle();
    await talk(7, 3);
  }
  await shot('12_ending');
  log('FIN', result, await state());
  await expect(result === 'ending', 'fin non atteinte');
  // vérifications finales : sauvegarde
  const saved = await t.ev(() => window.__lumina.G.save());
  log('sauvegarde', saved);
  console.log(t.errors.join('\n') || 'aucune erreur console');
  await t.close();
})().catch((e) => { console.error('EXCEPTION', e); process.exit(2); });
