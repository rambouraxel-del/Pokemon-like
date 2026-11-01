// Bot de test (injecté dans la page) : marche, parle, combat, capture... en passant par les vraies entrées du jeu.
(function () {
  const L = () => window.__lumina;
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  const frames = async (n) => { for (let i = 0; i < n; i++) await frame(); };
  const world = () => L().world;
  const top = () => L().scenes.top;
  const isBattle = () => top() && top().constructor.name === 'BattleScene';
  const isWorld = () => top() === world();
  async function tap(name, n = 2) { L().input.press(name); await frames(n); L().input.release(name); await frames(2); L().input.releaseAll(); }
  async function waitUntil(fn, timeoutFrames = 1800) { for (let i = 0; i < timeoutFrames; i++) { if (fn()) return true; await frame(); } return false; }
  const idle = () => isWorld() && !L().ui.active && !world().busy && !L().fx.mode && !world().player.moving;
  async function waitIdle(t = 1800) { return waitUntil(idle, t); }
  // appuie sur A tant qu'une boîte de dialogue est ouverte ou qu'un script tourne
  async function advance(maxFrames = 3000) {
    for (let i = 0; i < maxFrames; i++) {
      if (isWorld() && !L().ui.active && !world().busy && !L().fx.mode) return true;
      if (L().ui.box && !L().ui.menu) await tap('a', 1);
      else if (L().ui.menu) return false;
      else await frames(3);
    }
    return false;
  }
  // chemin le plus court (BFS) jusqu'à (gx,gy)
  function bfs(gx, gy, allowWarp = true) {
    const w = world(), p = w.player, m = w.map;
    const key = (x, y) => x + ',' + y;
    const q = [[p.x, p.y]], prev = { [key(p.x, p.y)]: null };
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    while (q.length) {
      const [x, y] = q.shift();
      if (x === gx && y === gy) { const path = []; let k = key(x, y); while (prev[k]) { path.unshift(prev[k].d); k = prev[k].from; } return path; }
      for (const d in D) {
        const nx = x + D[d][0], ny = y + D[d][1], k = key(nx, ny);
        if (prev[k] !== undefined) continue;
        const goal = nx === gx && ny === gy;
        if (!(w.canMove(nx, ny, p) || (goal && allowWarp && w.warps.some((q2) => q2.x === nx && q2.y === ny)))) continue;
        // éviter les warps intermédiaires
        if (!goal && w.warps.some((q2) => q2.x === nx && q2.y === ny)) continue;
        prev[k] = { from: key(x, y), d }; q.push([nx, ny]);
      }
    }
    return null;
  }
  async function step(d, run = false) {
    const w = world(), p = w.player; const ox = p.x, oy = p.y, mapId = w.mapId;
    if (run) L().input.press('b');
    L().input.press(d);
    await waitUntil(() => w.mapId !== mapId || (p.moving && (p.x !== ox || p.y !== oy)) || (!p.moving && w.busy), 120);
    await waitUntil(() => !p.moving, 120);
    L().input.releaseAll();
    await frames(1);
  }
  // marche jusqu'à (x,y) sur la carte courante ; s'arrête si un événement (combat, dialogue) survient puis le règle via onInterrupt
  async function walkTo(gx, gy, opts = {}) {
    const startMap = world().mapId;
    for (let guard = 0; guard < 400; guard++) {
      if (!await waitIdle()) { if (opts.onInterrupt) await opts.onInterrupt(); else await autoHandle(); }
      const w = world(); if (w.mapId !== startMap) return 'mapchange';
      if (w.player.x === gx && w.player.y === gy) return 'arrived';
      const path = bfs(gx, gy);
      if (!path) return 'nopath';
      await step(path[0], opts.run !== false);
      await frames(1);
      if (isBattle() || world().busy || L().ui.active) { if (opts.onInterrupt) await opts.onInterrupt(); else await autoHandle(); }
    }
    return 'timeout';
  }
  // règle automatiquement dialogues, combats et écrans superposés
  async function autoHandle(opts) {
    opts = opts || window.botOpts || {};
    for (let guard = 0; guard < 9000; guard++) {
      const name = top() ? top().constructor.name : '';
      if (isBattle()) { await fightStep(opts); continue; }
      if (name === 'BagScene') { await overlayBag(opts); continue; }
      if (name === 'TeamScene') { await overlayTeam(opts); continue; }
      if (name === 'EndingScene') { await tap('a', 1); await frames(30); continue; }
      if (L().ui.box && !L().ui.menu) { await tap('a', 1); continue; }
      if (L().ui.menu) { await tap('a', 1); continue; }
      if (L().fx.mode || (!isWorld())) { await frames(3); continue; }
      if (world().busy) { await frames(3); continue; }
      return true;
    }
    return false;
  }
  async function overlayBag(opts) {
    const b = top(); if (L().ui.box || L().ui.menu) { await tap('a', 1); return; }
    const list = b.list(); const want = window.botIntent === 'heal' ? ['grand_baume', 'baume'] : ['super_lanterne', 'lanterne'];
    let idx = list.findIndex((id) => want.includes(id)); if (idx < 0) { await tap('b', 1); await frames(10); return; }
    b.i = idx; await tap('a', 1); await frames(10);
  }
  async function overlayTeam(opts) {
    const t = top(); if (L().ui.box) { await tap('a', 1); return; }
    if (L().ui.menu) { await tap('a', 1); return; }
    const team = L().G.s.team;
    let idx;
    if (t.o.mode === 'item') { idx = t.o.active >= 0 ? t.o.active : team.findIndex((c, i) => c.hp > 0 && c.hp < 9999); }
    else { idx = team.findIndex((c, i) => c.hp > 0 && i !== t.o.active); }
    if (idx < 0) { await tap('b', 1); await frames(10); return; }
    t.i = idx; await tap('a', 1); await frames(10);
  }
  const maxHpOf = (c) => window.__maxHp(c);
  function pickMenu(i) { L().ui.menu.index = i; }
  async function fightStep(opts) {
    const b = top(), ui = L().ui;
    if (ui.menu) {
      const labels = ui.menu.opts.map((o) => o.label);
      if (labels[0] === 'Attaque') {
        if (opts.catch && b.isWild && b.ec.hp < window.__maxHp(b.ec) * 0.45) { // capture : utiliser un objet une fois affaibli
          const hasBall = L().G.count('lanterne') + L().G.count('super_lanterne') > 0;
          if (hasBall) { window.botIntent = 'ball'; await tap_choose(1); return; }
        }
        if (opts.run && b.isWild) { await tap_choose(3); return; }
        if (opts.heal && b.pc.hp < opts.heal * maxHpOf(b.pc) && (L().G.count('baume') + L().G.count('grand_baume')) > 0 && b.pc.hp > 0) { window.botIntent = 'heal'; await tap_choose(1); return; }
        await tap_choose(0); return;
      }
      if (labels.includes('Ne pas apprendre')) {
        const weak = b.pc.moves.findIndex((m) => ['charge', 'rugissement', 'posture'].includes(m));
        await tap_choose(weak >= 0 ? weak : 4); return;
      }
      // menu des capacités : meilleure puissance
      if (b.pc.moves && labels.length === b.pc.moves.length && b.pc.moves.every((m, i) => labels[i] === window.__movesName(m))) { await tap_choose(bestMove(b)); return; }
      await tap_choose(ui.menu.index); return;
    }
    if (ui.box) { await tap('a', 1); return; }
    await frames(3);
  }
  async function tap_choose(i) { pickMenu(i); await tap('a', 1); }
  function bestMove(b) { const M = window.__movesData; let best = 0, bs = -1; b.pc.moves.forEach((id, i) => { const m = M[id]; const s = m.kind === 'dmg' ? m.power * (m.acc / 100) : 1; if (s > bs) { bs = s; best = i; } }); return best; }
  // va se placer à côté de (tx,ty), se tourne vers la case et appuie sur A
  async function talkAt(tx, ty, opts = {}) {
    const w = world(); const dirs = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }; // côté depuis lequel on regarde -> d = direction à regarder
    const cand = [];
    for (const [dir, off] of Object.entries(dirs)) { const x = tx + off[0], y = ty + off[1]; const path = (w.canMove(x, y, w.player) || (w.player.x === x && w.player.y === y)) ? (w.player.x === x && w.player.y === y ? [] : bfs(x, y)) : null; if (path) cand.push({ dir, x, y, len: path.length }); }
    cand.sort((a, b) => a.len - b.len);
    if (!cand.length) return 'nopath';
    const c = cand[0];
    const r = await walkTo(c.x, c.y, opts);
    if (r !== 'arrived') return r;
    await waitIdle();
    L().input.press(c.dir); await frames(1); L().input.release(c.dir); await frames(8); L().input.releaseAll();
    await tap('a', 1);
    return 'talked';
  }
  window.bot = { talkAt, frames, tap, waitUntil, waitIdle, advance, bfs, walkTo, autoHandle, step, idle, isBattle, isWorld, top, pickMenu, tap_choose, fightStep };
})();
// --- aides de debug ---
window.bot.tp = (mapId, x, y, dir = 'down') => { const w = window.__lumina.world; w.loadMap(mapId, x, y, dir); w.cameraSnap(); };
window.bot.give = (sp, lv) => { const L = window.__lumina; return L.mk(sp, lv); };
