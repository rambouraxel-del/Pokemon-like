// Scène d'exploration : déplacements sur grille, collisions, PNJ, dresseurs, rencontres, dialogues, changements de zone.
import { W, H, T } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, COL } from '../core/ui.js';
import { clock } from '../core/clock.js';
import { scenes, fx } from '../core/scenes.js';
import { DIRS, OPPOSITE, chance, pick, randRange } from '../core/util.js';
import { G } from '../systems/game.js';
import { makeCreature, healFull } from '../systems/creatures.js';
import { getMap } from '../data/maps.js';
import { SCRIPTS } from '../data/story.js';
import { ITEMS } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { drawGround, drawTallFront, objectSprite, drawObjectShadow, buildingSprite, SOLID_GROUND, SOLID_OBJ } from '../gfx/tiles.js';
import { characterSheet } from '../gfx/characters.js';
import { creatureSprite, creatureIcon } from '../gfx/creatures.js';
import { runBattle } from './battle.js';
import { MenuScene } from './menu.js';
import { ShopScene } from './shop.js';
import { BoxScene } from './box.js';
import { EndingScene } from './ending.js';

const WALK = 72, RUN = 120;
const BASEKEY = {};

export class WorldScene {
  constructor() {
    this.map = null; this.mapId = null; this.time = 0; this.busy = false;
    this.player = { x: 0, y: 0, px: 0, py: 0, dir: 'down', moving: null, frame: 0, anim: 0, turn: 0 };
    this.npcs = []; this.cam = { x: 0, y: 0 };
    this.stepsSinceBattle = 5; this.banner = null; this.exclaim = null; this.sheet = characterSheet('player');
    this.pop = []; this.vignette = null; this.baseCanvas = null; this.glowT = 0;
  }

  // ----- chargement de carte -----
  loadMap(id, x, y, dir) {
    const m = getMap(id);
    this.map = m; this.mapId = id;
    const b = m.buildings || [];
    // collisions précalculées
    this.blocked = Array.from({ length: m.h }, (_, j) => Array.from({ length: m.w }, (_, i) => SOLID_GROUND.has(m.ground[j][i]) || SOLID_OBJ.has(m.obj[j][i])));
    this.warps = [...(m.warps || [])];
    for (const bd of b) {
      for (let j = bd.y; j < bd.y + bd.h; j++) for (let i = bd.x; i < bd.x + bd.w; i++) if (i < m.w && j < m.h) this.blocked[j][i] = true;
      const dx = bd.x + bd.door, dy = bd.y + bd.h - 1;
      this.blocked[dy][dx] = false;
      if (bd.warp) this.warps.push({ x: dx, y: dy, ...bd.warp });
    }
    // PNJ : retire les obstacles sous leurs pieds
    this.npcs = (m.npcs || []).map((d) => {
      const e = { def: d, id: d.id, name: d.name, x: d.x, y: d.y, px: d.x * T, py: d.y * T, dir: d.dir, look: d.look, sheet: d.look ? characterSheet(d.look) : null, creature: d.creature, trainer: d.trainer, talk: d.talk, frame: 0, anim: 0, moving: null, hidden: false };
      return e;
    });
    this.items = (m.items || []).filter((it) => !G.s.picked[it.id]);
    this.signAt = {}; (m.signs || []).forEach((s) => { this.signAt[s.x + ',' + s.y] = s; });
    this.player.x = x; this.player.y = y; this.player.px = x * T; this.player.py = y * T; this.player.dir = dir || 'down'; this.player.moving = null;
    this.buildBase();
    this.banner = null; this.exclaim = null;
    audio.music(m.music);
    this.stepsSinceBattle = Math.max(this.stepsSinceBattle, 2);
    G.s.player = { map: id, x, y, dir: this.player.dir };
  }

  buildBase() {
    const m = this.map;
    const c = document.createElement('canvas'); c.width = m.w * T; c.height = m.h * T;
    const g = c.getContext('2d');
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
      const env = { nb: (dx, dy) => { const x = i + dx, y = j + dy; return x < 0 || y < 0 || x >= m.w || y >= m.h ? null : m.ground[y][x]; } };
      drawGround(g, m.ground[j][i], i * T, j * T, i, j, m.theme, env, 0);
    }
    this.baseCanvas = c; this.baseCtx = g;
    // vignette / ambiance
    const v = document.createElement('canvas'); v.width = W; v.height = H; const vg = v.getContext('2d');
    const grd = vg.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 230);
    const tint = m.indoor ? 'rgba(20,10,40,0.0)' : m.theme === 'forest' ? 'rgba(10,40,30,0.4)' : m.theme === 'ruins' ? 'rgba(20,20,70,0.45)' : 'rgba(40,20,40,0.18)';
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, tint);
    vg.fillStyle = grd; vg.fillRect(0, 0, W, H);
    this.vignette = v;
    this.dark = m.theme === 'ruins' ? 'rgba(30,40,100,0.16)' : m.theme === 'forest' ? 'rgba(10,50,40,0.12)' : null;
  }

  enter() {}
  start(fromSave) {
    const p = G.s.player;
    this.loadMap(p.map, p.x, p.y, p.dir);
    this.time = 0;
  }

  // ----- helpers de scripts (API `w`) -----
  sfx(n) { audio.sfx(n); }
  toast(t) { ui.toast(t); }
  npc(id) { return this.npcs.find((n) => n.id === id); }
  hideNpc(n) { if (n) n.hidden = true; }
  async say(lines, speaker) { await ui.say(lines, speaker || null); }
  ask(q, opts) { return ui.ask(q, opts); }
  give(item, n = 1, silent = false) { G.addItem(item, n); if (!silent) audio.sfx('confirm'); }
  wait(s) { return clock.wait(s); }
  springSpot() { const m = this.map; const sp = (m.interacts || []).find((i) => i.talk === 'spring'); return { map: this.mapId, x: sp.x, y: sp.y + 1, dir: 'down' }; }
  async openShop() { await new Promise((res) => scenes.push(new ShopScene(res))); }
  async openBox() { await new Promise((res) => scenes.push(new BoxScene(res))); }
  async openEnding() { await new Promise((res) => scenes.push(new EndingScene(res))); audio.music(this.map.music); }
  healTeamSilent() { G.healTeam(); }
  async healTeam(spot, auto) {
    audio.sfx('heal');
    this.healFx = 1.2;
    await clock.wait(1.3);
    G.healTeam();
    if (spot) G.s.lastHeal = spot;
    if (auto) { G.save(); }
  }
  async teleportPlayer(x, y, dir) {
    await fx.out('fade', 0.3); this.player.x = x; this.player.y = y; this.player.px = x * T; this.player.py = y * T; this.player.dir = dir || 'up'; await fx.in(0.3);
  }
  async beacon() {
    audio.music(null); audio.sfx('beacon');
    await fx.out('flash', 1.4, '#fff');
    await clock.wait(0.5);
    audio.music('ending');
    await fx.in(1.4);
  }
  async playerWalk(dirs) {
    for (const d of dirs) { this.player.dir = d; if (!this.canMove(this.player.x + DIRS[d].dx, this.player.y + DIRS[d].dy, this.player)) break; await this.stepEntity(this.player, d, WALK); }
  }
  async npcWalk(n, dirs) {
    for (const d of dirs) { n.dir = d; await this.stepEntity(n, d, WALK); }
  }

  // ----- collisions -----
  npcAt(x, y) { return this.npcs.find((n) => !n.hidden && n.x === x && n.y === y && !(n.moving && false)); }
  canMove(x, y, who) {
    const m = this.map;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
    if (this.blocked[y][x]) return false;
    const n = this.npcAt(x, y); if (n && n !== who) return false;
    if (who !== this.player && this.player.x === x && this.player.y === y) return false;
    return true;
  }
  async stepEntity(e, dir, speed) {
    const d = DIRS[dir]; const tx = e.x + d.dx, ty = e.y + d.dy;
    e.dir = dir; e.moving = { tx, ty }; e.scripted = true;
    e.x = tx; e.y = ty; // occupe immédiatement la case cible
    const tpx = tx * T, tpy = ty * T;
    while (e.px !== tpx || e.py !== tpy) {
      await clock.nextFrame();
      const dt = 1 / 60 * clock.speed;
      const stepPx = speed * (dt);
      e.px += Math.sign(tpx - e.px) * Math.min(Math.abs(tpx - e.px), stepPx);
      e.py += Math.sign(tpy - e.py) * Math.min(Math.abs(tpy - e.py), stepPx);
      e.anim += dt * 8;
    }
    e.moving = null; e.anim = 0; e.scripted = false;
  }

  // ----- boucle -----
  update(dt) {
    this.time += dt; this.glowT += dt;
    if (this.healFx > 0) this.healFx -= dt;
    this.updateMoving(this.player, dt);
    for (const n of this.npcs) { n.hidden = n.def.hideIf ? !!n.def.hideIf(G) : false; }
    if (this.busy || ui.active) return;
    const p = this.player;
    if (input.pressed('start')) { this.openMenu(); return; }
    if (p.moving) return;
    const d = input.heldDir();
    if (input.pressed('a')) { this.interact(); return; }
    if (d) {
      if (p.dir !== d) { p.dir = d; p.turn = 0.1; }
      if (p.turn > 0) { p.turn -= dt; return; }
      const dd = DIRS[d]; const nx = p.x + dd.dx, ny = p.y + dd.dy;
      if (this.canMove(nx, ny, p)) {
        p.moving = { tx: nx, ty: ny }; p.x = nx; p.y = ny; p.running = input.isDown('b');
      } else if (!p.bumped) { audio.sfx('bump'); p.bumped = true; setTimeout(() => { p.bumped = false; }, 250); }
    } else p.turn = 0;
  }
  updateMoving(e, dt) {
    if (e !== this.player || !e.moving || e.scripted) return;
    const tpx = e.x * T, tpy = e.y * T, sp = (e.running ? RUN : WALK) * dt;
    e.px += Math.sign(tpx - e.px) * Math.min(Math.abs(tpx - e.px), sp);
    e.py += Math.sign(tpy - e.py) * Math.min(Math.abs(tpy - e.py), sp);
    e.anim += dt * (e.running ? 12 : 8);
    if (e.px === tpx && e.py === tpy) { e.moving = null; e.anim = 0; this.afterStep(); }
  }
  async afterStep() {
    this.busy = true;
    try { await this.onStep(); } finally { this.busy = false; }
  }
  async onStep() {
    const p = this.player; G.s.stats.steps++; this.stepsSinceBattle++;
    G.s.player = { map: this.mapId, x: p.x, y: p.y, dir: p.dir };
    // objet au sol
    const it = this.items.find((i) => i.x === p.x && i.y === p.y);
    if (it) await this.pickItem(it);
    // warp
    const wp = this.warps.find((w) => w.x === p.x && w.y === p.y);
    // événements
    if (await this.checkEvents() === 'block') return;
    if (wp) { await this.doWarp(wp); return; }
    // dresseurs
    const tr = this.checkSight();
    if (tr) { await this.trainerSpotted(tr); return; }
    // rencontres sauvages
    if (this.map.encounters && this.map.ground[p.y][p.x] === ',' && this.stepsSinceBattle >= 3 && G.s.team.length && chance(this.map.encounters.rate)) {
      await this.wildEncounter();
    }
  }
  async checkEvents() {
    const p = this.player;
    const ev = (this.map.events || []).find((e) => e.x === p.x && e.y === p.y && (!e.when || e.when(G)) && (!e.once || !G.s.flags[e.once]));
    if (!ev) return null;
    await this.runScript(ev.talk);
    return ev.talk === 'blockExit' ? 'block' : 'ran';
  }
  async pickItem(it) {
    G.s.picked[it.id] = true; this.items = this.items.filter((i) => i !== it);
    G.addItem(it.item, it.n); audio.sfx('confirm');
    await ui.say([`Tu trouves ${it.n > 1 ? it.n + ' ' : ''}${ITEMS[it.item].name}${it.n > 1 && !ITEMS[it.item].name.endsWith('s') ? 's' : ''} !`]);
  }
  async runScript(key, arg) {
    const [name, param] = String(key).split(':');
    const fn = SCRIPTS[name];
    if (!fn) { console.warn('script manquant', key); return; }
    await fn(this, arg, param);
  }

  // ----- interaction -----
  async interact() {
    const p = this.player, d = DIRS[p.dir];
    const tx = p.x + d.dx, ty = p.y + d.dy;
    let target = this.npcAt(tx, ty);
    if (!target && this.map.obj[ty] && this.map.obj[ty][tx] === 'C') target = this.npcAt(tx + d.dx, ty + d.dy);
    this.busy = true;
    try {
      if (target) {
        if (!target.creature) target.dir = OPPOSITE[p.dir];
        const fn = target.talk;
        if (fn === 'trainer' || fn === 'vesper') await SCRIPTS[fn](this, target);
        else await SCRIPTS[fn](this, target);
      } else {
        const sg = this.signAt[tx + ',' + ty];
        const ia = (this.map.interacts || []).find((i) => i.x === tx && i.y === ty);
        if (sg) await ui.say(sg.text);
        else if (ia) { const [name, param] = ia.talk.split(':'); await SCRIPTS[name](this, param); }
      }
    } finally { this.busy = false; }
  }
  async openMenu() {
    this.busy = true;
    audio.sfx('confirm');
    await new Promise((res) => scenes.push(new MenuScene(this, res)));
    this.busy = false;
  }

  // ----- warps -----
  async doWarp(wp) {
    audio.sfx(this.map.indoor || wp.to === 'home' || ['lab', 'shop', 'heal', 'sanctum'].includes(wp.to) ? 'door' : 'select');
    await fx.out('fade', 0.25);
    const prev = this.mapId;
    this.loadMap(wp.to, wp.tx, wp.ty, wp.dir);
    this.cameraSnap();
    this.stepsSinceBattle = 0;
    const m = this.map;
    await fx.in(0.25);
    if (!m.indoor && prev !== wp.to) this.showBanner(m.name);
    G.save();
    if (await this.checkEvents()) return;
    const tr = this.checkSight(); if (tr) await this.trainerSpotted(tr);
  }
  showBanner(name) { this.banner = { name, t: 2.4 }; }

  // ----- dresseurs -----
  checkSight() {
    const p = this.player;
    for (const n of this.npcs) {
      if (n.hidden || !n.trainer || !n.trainer.sight || G.s.defeated[n.trainer.id]) continue;
      if (n.trainer.id === 'rival2' && G.s.flags.rival2) continue;
      const d = DIRS[n.dir];
      for (let k = 1; k <= n.trainer.sight; k++) {
        const x = n.x + d.dx * k, y = n.y + d.dy * k;
        if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h || this.blocked[y][x]) break;
        if (p.x === x && p.y === y) return n;
      }
    }
    return null;
  }
  async trainerSpotted(n) {
    audio.sfx('select'); this.exclaim = { n, t: 0.7 };
    await clock.wait(0.7); this.exclaim = null;
    // marche jusqu'à être adjacent au joueur
    const p = this.player;
    for (let guard = 0; guard < 12; guard++) {
      const dx = p.x - n.x, dy = p.y - n.y;
      if (Math.abs(dx) + Math.abs(dy) <= 1) break;
      const dir = Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const nd = DIRS[dir];
      if (!this.canMove(n.x + nd.dx, n.y + nd.dy, n)) break;
      await this.stepEntity(n, dir, WALK + 20);
    }
    // se tourne vers le joueur
    const dx = p.x - n.x, dy = p.y - n.y;
    n.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    p.dir = OPPOSITE[n.dir];
    await SCRIPTS[n.talk](this, n);
  }

  // ----- combats -----
  async wildEncounter() {
    const tbl = this.map.encounters.table; const total = tbl.reduce((a, e) => a + e.w, 0);
    let r = Math.random() * total, ent = tbl[0];
    for (const e of tbl) { r -= e.w; if (r <= 0) { ent = e; break; } }
    const enemy = makeCreature(ent.s, randRange(ent.min, ent.max));
    audio.sfx('encounter');
    const res = await this.battle({ kind: 'wild', enemies: [enemy] });
    this.stepsSinceBattle = 0;
    return res;
  }
  // trainerBattle({trainer, npc, tutorial, noDefeat}) -> 'win' | 'lose'
  async trainerBattle(o) {
    const t = o.trainer;
    const enemies = t.team.map(([s, l]) => makeCreature(s, l));
    const prevBusy = this.busy; this.busy = true;
    audio.sfx('encounter');
    const res = await this.battle({ kind: 'trainer', enemies, trainer: t, tutorial: o.tutorial, boss: t.boss, noDefeat: o.noDefeat });
    if (res.result === 'win') {
      G.s.defeated[t.id] = true;
      const gain = t.reward || 0; G.s.money += gain;
      if (t.defeat && o.npc) await ui.say(t.defeat, o.npc.name);
      if (gain) { audio.sfx('confirm'); await ui.say([`Tu remportes ${gain} écus !`]); }
      G.save();
      this.busy = prevBusy; return 'win';
    }
    if (res.result === 'lose' && !o.noDefeat) { await this.handleDefeat(); this.busy = prevBusy; return 'lose'; }
    this.busy = prevBusy;
    return res.result === 'win' ? 'win' : 'lose';
  }
  async battle(o) {
    this.healFx = 0;
    const res = await runBattle({ ...o, bg: this.map.bg, world: this });
    audio.music(this.map.music);
    if (res.result === 'lose' && o.kind === 'wild') { await this.handleDefeat(); }
    return res;
  }
  async handleDefeat() {
    const spot = G.s.lastHeal;
    await ui.say(["Tous tes Lumins sont K.O.... Tout devient noir autour de toi."]);
    await fx.out('fade', 0.6);
    G.healTeam();
    this.loadMap(spot.map, spot.x, spot.y, spot.dir); this.cameraSnap();
    this.stepsSinceBattle = 0;
    await fx.in(0.6);
    await ui.say(["Tu te réveilles près d'un point de soin. Tes Lumins ont été soignés et sont prêts à repartir !"]);
    G.save();
  }

  // ----- caméra & rendu -----
  cameraSnap() { this.updateCamera(true); }
  updateCamera() {
    const m = this.map, mw = m.w * T, mh = m.h * T, p = this.player;
    const axis = (pos, size, view) => (size <= view ? -Math.floor((view - size) / 2) : Math.max(0, Math.min(size - view, Math.round(pos + 8 - view / 2))));
    this.cam.x = axis(p.px, mw, W); this.cam.y = axis(p.py, mh, H);
  }
  render(g) {
    if (!this.map) return;
    this.updateCamera();
    const m = this.map, cx = this.cam.x, cy = this.cam.y;
    g.fillStyle = '#0a0a14'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(-cx, -cy);
    g.drawImage(this.baseCanvas, 0, 0);
    // tuiles animées (eau)
    const x0 = Math.max(0, Math.floor(cx / T) - 1), x1 = Math.min(m.w - 1, Math.ceil((cx + W) / T) + 1);
    const y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(m.h - 1, Math.ceil((cy + H) / T) + 1);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      if (m.ground[j][i] === 'w') {
        const env = { nb: (dx, dy) => { const x = i + dx, y = j + dy; return x < 0 || y < 0 || x >= m.w || y >= m.h ? 'w' : m.ground[y][x]; } };
        drawGround(g, 'w', i * T, j * T, i, j, m.theme, env, this.time);
      }
    }
    // liste triée par profondeur
    const list = [];
    for (let j = y0 - 3; j <= y1 + 3; j++) for (let i = x0 - 2; i <= x1 + 2; i++) {
      if (j < 0 || i < 0 || j >= m.h || i >= m.w) continue;
      const ch = m.obj[j][i]; if (ch === ' ') continue;
      if (ch === 'A' && i > 0 && m.obj[j][i - 1] === 'A') continue;
      list.push({ y: (j + 1) * T, kind: 'obj', ch, i, j });
    }
    for (const b of m.buildings || []) list.push({ y: (b.y + b.h) * T - 0.5, kind: 'bld', b });
    for (const it of this.items) list.push({ y: (it.y + 1) * T - 1, kind: 'item', it });
    for (const n of this.npcs) if (!n.hidden) list.push({ y: n.py + T + 0.1, kind: 'npc', n });
    const p = this.player; list.push({ y: p.py + T + 0.2, kind: 'player' });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) this.drawItem(g, o);
    // éclat de lumière : lampes, runes, source
    this.drawGlows(g, x0, x1, y0, y1);
    g.restore();
    // ambiance
    if (this.dark) { g.fillStyle = this.dark; g.fillRect(0, 0, W, H); }
    g.drawImage(this.vignette, 0, 0);
    if (m.theme === 'forest' && !m.indoor) this.drawRays(g);
    if (m.theme === 'ruins' && !m.indoor) this.drawMotes(g);
    if (this.healFx > 0) { g.fillStyle = `rgba(200,255,220,${Math.min(0.5, this.healFx * 0.4)})`; g.fillRect(0, 0, W, H); }
    // bannière du lieu
    if (this.banner) {
      this.banner.t -= 1 / 60;
      const a = Math.min(1, this.banner.t * 2, (2.4 - this.banner.t) * 3);
      if (this.banner.t <= 0) this.banner = null;
      else { g.globalAlpha = Math.max(0, a); const w = this.banner.name.length * 8 + 24; panel(g, (W - w) / 2, 10, w, 20, { fill: '#fff8e0', border: '#3a2a5a', inner: '#e8c870' }); text(g, this.banner.name, (W - w) / 2 + 12, 16, COL.text); g.globalAlpha = 1; }
    }
  }
  drawItem(g, o) {
    const m = this.map;
    if (o.kind === 'obj') {
      const spr = objectSprite(o.ch, m.theme); if (!spr) return;
      drawObjectShadow(g, o.ch, o.i * T, o.j * T);
      g.drawImage(spr.c, o.i * T + (spr.ox || 0), o.j * T + T - spr.c.height);
      if (o.ch === 'N' && this.mapId === 'lab' && !G.s.flags.starter) {
        const sp = { 3: 'feuillin', 6: 'braisillon', 9: 'gouttelin' }[o.i];
        if (sp) {
          const by = o.j * T - 14 + Math.sin(this.time * 2 + o.i) * 2;
          g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(o.i * T + 8, by + 8, 11, 0, 6.3); g.fill();
          g.strokeStyle = 'rgba(120,160,255,0.9)'; g.lineWidth = 1; g.stroke();
          g.drawImage(creatureIcon(sp), o.i * T - 2, by - 2, 20, 20);
        }
      }
    } else if (o.kind === 'bld') {
      const b = o.b; const c = buildingSprite({ w: b.w, h: b.h, wall: b.wall, roof: b.roof, trim: b.trim, base: b.base, door: b.door, doorC: b.doorC, emblem: b.emblem, awning: b.awning, windows: b.windows });
      g.fillStyle = 'rgba(20,20,50,0.22)'; g.fillRect(b.x * T + 4, (b.y + b.h) * T - 3, b.w * T, 5);
      g.drawImage(c, b.x * T, (b.y + b.h) * T - c.height);
    } else if (o.kind === 'item') {
      const bob = Math.sin(this.time * 4 + o.it.x) * 1.5;
      const x = o.it.x * T + 8, y = o.it.y * T + 9 + bob;
      g.fillStyle = 'rgba(20,20,40,0.3)'; g.beginPath(); g.ellipse(x, o.it.y * T + 14, 5, 2, 0, 0, 6.3); g.fill();
      g.fillStyle = '#241838'; g.beginPath(); g.arc(x, y, 5.5, 0, 6.3); g.fill();
      g.fillStyle = o.it.item.includes('lanterne') ? '#ffd23c' : o.it.item === 'rappel' ? '#a0e8ff' : '#ff7a9a'; g.beginPath(); g.arc(x, y, 4, 0, 6.3); g.fill();
      g.fillStyle = '#fff'; g.fillRect(x - 2, y - 2, 2, 2);
    } else if (o.kind === 'npc') this.drawChar(g, o.n);
    else this.drawChar(g, this.player, true);
  }
  drawChar(g, e, isPlayer) {
    const x = Math.round(e.px), y = Math.round(e.py);
    g.fillStyle = 'rgba(20,20,40,0.28)'; g.beginPath(); g.ellipse(x + 8, y + 14, 6, 2.6, 0, 0, 6.3); g.fill();
    if (e.creature) {
      const bob = Math.sin(this.time * 2) * 1;
      g.drawImage(creatureSprite(e.creature, 'front'), x - 12, y - 26 + bob, 40, 40);
      return;
    }
    const sh = e.sheet || this.sheet;
    const frames = sh[e.dir];
    const f = e.moving ? (Math.floor(e.anim) % 2 === 0 ? 1 : 2) : 0;
    g.drawImage(frames[f], x, y - 8 + (e.moving && f ? -0.0 : 0));
    // herbe haute au-dessus des pieds
    if (this.map.ground[e.y] && this.map.ground[e.y][e.x] === ',' && (!e.moving || Math.abs(e.px - e.x * T) + Math.abs(e.py - e.y * T) < 9)) drawTallFront(g, e.x * T, e.y * T, this.map.theme);
    if (this.exclaim && this.exclaim.n === e) {
      g.fillStyle = '#fff'; g.fillRect(x + 4, y - 20, 8, 11); g.fillStyle = '#d83a3a'; g.fillRect(x + 7, y - 18, 2, 5); g.fillRect(x + 7, y - 11, 2, 2);
    }
  }
  drawGlows(g, x0, x1, y0, y1) {
    const m = this.map;
    g.globalCompositeOperation = 'lighter';
    for (let j = y0 - 2; j <= y1 + 2; j++) for (let i = x0 - 1; i <= x1 + 1; i++) {
      if (j < 0 || i < 0 || j >= m.h || i >= m.w) continue;
      const ch = m.obj[j][i];
      if (ch === 'Y' || ch === 'H' || ch === 'L' || ch === 'A' || ch === 'M' || ch === 'V') {
        const flick = 0.5 + 0.3 * Math.sin(this.glowT * 3 + i * 1.7 + j);
        const cx = i * T + 8, cy = j * T + (ch === 'L' ? -6 : ch === 'H' ? 2 : ch === 'Y' ? 0 : 4);
        const r = ch === 'A' ? 26 : 16;
        const col = ch === 'L' ? '255,230,150' : ch === 'H' ? '120,220,255' : ch === 'A' ? (G.s.flags.ending ? '255,230,140' : '120,100,200') : '120,240,255';
        const gr = g.createRadialGradient(cx, cy, 1, cx, cy, r);
        gr.addColorStop(0, `rgba(${col},${0.5 * flick})`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    }
    g.globalCompositeOperation = 'source-over';
  }
  drawRays(g) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      const x = ((k * 97 + this.time * 3) % (W + 80)) - 40;
      const a = 0.04 + 0.025 * Math.sin(this.time * 0.8 + k);
      g.fillStyle = `rgba(255,255,200,${a})`; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 26, 0); g.lineTo(x + 6, H); g.lineTo(x - 22, H); g.fill();
    }
    g.restore();
  }
  drawMotes(g) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 18; k++) {
      const x = (k * 53 + Math.sin(this.time * 0.6 + k) * 14) % W, y = H - ((k * 37 + this.time * (6 + k % 5)) % (H + 20));
      g.fillStyle = `rgba(160,220,255,${0.25 + 0.2 * Math.sin(this.time * 2 + k)})`; g.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    g.restore();
  }
}
