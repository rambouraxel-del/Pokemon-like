// Scène de combat 1 contre 1 : tour par tour, capture, objets, changement, fuite, expérience.
import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL, FONT } from '../core/ui.js';
import { clock } from '../core/clock.js';
import { scenes, fx } from '../core/scenes.js';
import { clamp, chance, rand, randRange, lerp, easeOut } from '../core/util.js';
import { G } from '../systems/game.js';
import { SPECIES } from '../data/species.js';
import { MOVES, STAT_NAMES, moveInfo } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { TYPES, effectiveness } from '../data/types.js';
import { BATTLE_TIPS } from '../data/story.js';
import { calcStats, addExp, expProgress, aliveCount, firstAlive, maxHp } from '../systems/creatures.js';
import { creatureSprite } from '../gfx/creatures.js';
import { ATTACK_FX } from '../gfx/effects.js';
import { pickTeam } from './team.js';
import { pickBattleItem } from './bag.js';

const POS = { e: { x: 234, ground: 86, cy: 54 }, p: { x: 92, ground: 134, cy: 94 } };
const stageMult = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

function makeBackground(kind) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const pal = {
    village: { sky: ['#8ccaf8', '#d8f0ff'], far: '#7cc47a', mid: '#5aaa4e', ground: ['#76c256', '#5aa844'] },
    forest: { sky: ['#4e8a70', '#9acaa0'], far: '#2e6a4a', mid: '#27573e', ground: ['#4a9650', '#35783e'] },
    ruins: { sky: ['#2a2860', '#8a78c0'], far: '#4a4a82', mid: '#383868', ground: ['#6a8a78', '#4e6e64'] },
  }[kind] || null;
  const P = pal || { sky: ['#8ccaf8', '#d8f0ff'], far: '#7cc47a', mid: '#5aaa4e', ground: ['#76c256', '#5aa844'] };
  const sky = g.createLinearGradient(0, 0, 0, 110); sky.addColorStop(0, P.sky[0]); sky.addColorStop(1, P.sky[1]);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // collines / silhouettes
  g.fillStyle = P.far; g.beginPath(); g.moveTo(0, 80); for (let x = 0; x <= W; x += 8) g.lineTo(x, 64 + Math.sin(x * 0.04) * 10 + Math.sin(x * 0.11) * 5); g.lineTo(W, 110); g.lineTo(0, 110); g.fill();
  if (kind === 'forest') { g.fillStyle = '#1e4a34'; for (let x = 6; x < W; x += 22) { const h = 40 + ((x * 7) % 25); g.beginPath(); g.moveTo(x, 94); g.lineTo(x + 11, 94 - h); g.lineTo(x + 22, 94); g.fill(); } }
  if (kind === 'ruins') { g.fillStyle = '#2a2a58'; for (let x = 20; x < W; x += 58) { g.fillRect(x, 50 + (x % 3) * 6, 10, 50); g.fillRect(x - 3, 46 + (x % 3) * 6, 16, 5); } g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 24; i++) g.fillRect((i * 53) % W, (i * 29) % 50, 1, 1); }
  g.fillStyle = P.mid; g.beginPath(); g.moveTo(0, 96); for (let x = 0; x <= W; x += 8) g.lineTo(x, 90 + Math.sin(x * 0.07 + 1) * 4); g.lineTo(W, 120); g.lineTo(0, 120); g.fill();
  const gr = g.createLinearGradient(0, 96, 0, H); gr.addColorStop(0, P.ground[0]); gr.addColorStop(1, P.ground[1]);
  g.fillStyle = gr; g.fillRect(0, 100, W, H - 100);
  for (let y = 104; y < 144; y += 6) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y, W, 2); }
  return c;
}

const whiteCache = {};
function whiteSprite(spr, key) {
  if (whiteCache[key]) return whiteCache[key];
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height; const g = c.getContext('2d');
  g.drawImage(spr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  return (whiteCache[key] = c);
}

export class BattleScene {
  constructor(o) {
    this.o = o; this.kind = o.kind; this.trainer = o.trainer || null; this.isWild = o.kind === 'wild';
    this.enemies = o.enemies; this.eIndex = 0;
    this.bg = makeBackground(o.bg); this.t = 0; this.shakeT = 0; this.effects = [];
    this.side = { p: this.mkSide(), e: this.mkSide() };
    this.stages = { p: { atk: 0, def: 0, spd: 0 }, e: { atk: 0, def: 0, spd: 0 } };
    this.hpShown = { p: 0, e: 0 }; this.expShown = 0;
    this.pi = -1; this.participants = new Set(); this.runs = 0; this.trainerItems = (this.trainer && this.trainer.items) ? [...this.trainer.items] : [];
    this.over = false; this.result = null; this.ballAnim = null; this.menuDraw = null; this.dark = 0;
  }
  mkSide() { return { visible: false, dx: 0, dy: 0, scale: 1, alpha: 1, white: 0, sink: 0 }; }
  get pc() { return G.s.team[this.pi]; }
  get ec() { return this.enemies[this.eIndex]; }
  cr(side) { return side === 'p' ? this.pc : this.ec; }
  nm(side) { const c = this.cr(side); const n = SPECIES[c.species].name; return side === 'p' ? n : (this.isWild ? `${n} sauvage` : `${n} adverse`); }
  enter() {}
  render(g) {
    g.save();
    if (this.shakeT > 0) g.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 4));
    g.drawImage(this.bg, 0, 0);
    // plates-formes
    this.platform(g, POS.e.x, POS.e.ground - 2, 50, 9, '#5a9a48', '#78b860');
    this.platform(g, POS.p.x, POS.p.ground - 2, 66, 11, '#4e8a3e', '#6aa854');
    this.drawCreature(g, 'e'); this.drawCreature(g, 'p');
    if (this.ballAnim) this.drawBall(g);
    for (const e of this.effects) e.fn(g, clamp((this.t - e.t0) / e.dur, 0, 1));
    this.effects = this.effects.filter((e) => this.t - e.t0 < e.dur);
    if (this.dark > 0) { g.fillStyle = `rgba(0,0,0,${this.dark})`; g.fillRect(0, 0, W, H); }
    g.restore();
    if (this.pi >= 0 && this.side.e.visible !== undefined) { this.infoBox(g, 'e'); this.infoBox(g, 'p'); }
    if (this.menuDraw) this.menuDraw(g);
  }
  update(dt) { this.t += dt; if (this.shakeT > 0) this.shakeT -= dt; }
  platform(g, x, y, rx, ry, c1, c2) {
    g.fillStyle = 'rgba(20,40,20,0.35)'; g.beginPath(); g.ellipse(x, y + 3, rx + 3, ry + 2, 0, 0, 6.3); g.fill();
    g.fillStyle = c1; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.3); g.fill();
    g.fillStyle = c2; g.beginPath(); g.ellipse(x, y - 1, rx - 4, ry - 3, 0, 0, 6.3); g.fill();
  }
  drawCreature(g, side) {
    const s = this.side[side]; const c = side === 'e' ? this.enemies[this.eIndex] : (this.pi >= 0 ? this.pc : null);
    if (!c || !s.visible) return;
    const spr = creatureSprite(c.species, side === 'e' ? 'front' : 'back');
    const sc = (side === 'p' ? 1.5 : 1) * s.scale; const w = 64 * sc, h = 64 * sc;
    const bob = Math.sin(this.t * 2.4 + (side === 'p' ? 1 : 0)) * 1.5;
    const x = POS[side].x + s.dx - w / 2, y = POS[side].ground + s.dy - h + 4 * sc + bob + s.sink;
    g.save(); g.globalAlpha = s.alpha;
    if (s.sink) { g.beginPath(); g.rect(0, 0, W, POS[side].ground + 4); g.clip(); }
    g.drawImage(spr, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    if (s.white > 0) { g.globalAlpha = s.alpha * s.white; g.drawImage(whiteSprite(spr, c.species + side), Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    g.restore();
  }
  drawBall(g) {
    const b = this.ballAnim; const x = Math.round(b.x), y = Math.round(b.y + (b.bounce || 0));
    g.save(); g.translate(x, y); g.rotate(b.rot || 0);
    g.fillStyle = '#241838'; g.beginPath(); g.arc(0, 0, 8, 0, 6.3); g.fill();
    g.fillStyle = b.super ? '#4a78e8' : '#f8c040'; g.beginPath(); g.arc(0, 0, 6.5, 0, 6.3); g.fill();
    g.fillStyle = '#fff6d0'; g.fillRect(-6, -1, 12, 3); g.fillStyle = '#241838'; g.fillRect(-1, -2, 3, 5); g.fillStyle = '#fff'; g.fillRect(-4, -5, 3, 2);
    if (b.glow) { g.fillStyle = `rgba(255,255,200,${b.glow})`; g.beginPath(); g.arc(0, 0, 12, 0, 6.3); g.fill(); }
    g.restore();
  }
  hpColor(r) { return r > 0.5 ? '#38c868' : r > 0.2 ? '#e8c030' : '#e04848'; }
  infoBox(g, side) {
    const c = this.cr(side); if (!c || !this.side[side].visible && !(side === 'e' && this.ballAnim)) return;
    const sp = SPECIES[c.species];
    const isP = side === 'p'; const x = isP ? 168 : 6, y = isP ? 92 : 8, w = 146, h = isP ? 46 : 38;
    panel(g, x, y, w, h, { fill: '#f8f6ea', border: '#2c3a78', inner: '#aac0f0' });
    text(g, sp.name, x + 8, y + 6, COL.text);
    text(g, 'N.' + c.level, x + w - 8, y + 6, COL.text, null, 'right');
    // badge de type
    const tc = TYPES[sp.type];
    g.fillStyle = tc.color; g.fillRect(x + 8, y + 17, tc.name.length * 6 + 6, 9); text(g, '', 0, 0);
    g.font = '6px "Press Start 2P"'; g.fillStyle = '#fff'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillText(tc.name.toUpperCase(), x + 11, y + 19);
    if (!isP && this.isWild && G.s.dex[c.species] === 'caught') { g.fillStyle = '#e8584a'; g.beginPath(); g.arc(x + w - 14, y + 21, 4, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.fillRect(x + w - 18, y + 20, 8, 2); }
    // PV
    const mh = maxHp(c), shown = this.hpShown[side], r = clamp(shown / mh, 0, 1);
    const by = y + (isP ? 28 : 28);
    text(g, 'PV', x + 8, by - 1, COL.dim);
    g.fillStyle = '#2a2a44'; g.fillRect(x + 30, by, 106, 7); g.fillStyle = '#e8e8e8'; g.fillRect(x + 31, by + 1, 104, 5);
    g.fillStyle = this.hpColor(r); g.fillRect(x + 31, by + 1, Math.round(104 * r), 5); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 31, by + 1, Math.round(104 * r), 1);
    if (isP) {
      text(g, `${Math.ceil(shown)}/${mh}`, x + w - 8, y + 17, COL.text, null, 'right');
      g.fillStyle = '#2a2a44'; g.fillRect(x + 8, y + 38, 128, 4); g.fillStyle = '#e8e8e8'; g.fillRect(x + 9, y + 39, 126, 2);
      g.fillStyle = '#48a8f8'; g.fillRect(x + 9, y + 39, Math.round(126 * clamp(this.expShown, 0, 1)), 2);
    }
    // modificateurs de stats
    const st = this.stages[side]; let sx = x + (isP ? 70 : 62);
    if (this.side[side].visible) for (const k of ['atk', 'def', 'spd']) if (st[k]) {
      const label = { atk: 'AT', def: 'DF', spd: 'VT' }[k] + (st[k] > 0 ? '+' : '') + st[k];
      g.font = '6px "Press Start 2P"'; g.fillStyle = st[k] > 0 ? '#d83a3a' : '#3a58d8'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(label, sx, y + 19); sx += label.length * 6 + 4;
    }
  }

  // ----- animations -----
  async tween(sec, fn) { await clock.tween(sec, fn); }
  async setHp(side, target, sec = 0.5) {
    const from = this.hpShown[side];
    await this.tween(sec, (t) => { this.hpShown[side] = lerp(from, target, t); });
    this.hpShown[side] = target;
  }
  effectAt(side) { return { x: POS[side].x, y: POS[side].cy }; }
  async playFx(name, from, to, dur = 0.55, opts = {}) {
    const a = this.effectAt(from), b = this.effectAt(to); const fn = ATTACK_FX[name] || ATTACK_FX.normal;
    this.effects.push({ t0: this.t, dur, fn: (g, p) => fn(g, p, a, b, opts) });
    await clock.wait(dur);
  }
  async lunge(side) {
    const s = this.side[side], dir = side === 'p' ? 1 : -1;
    await this.tween(0.12, (t) => { s.dx = dir * 22 * easeOut(t); s.dy = -dir * 6 * t; });
    await this.tween(0.14, (t) => { s.dx = dir * 22 * (1 - t); s.dy = -dir * 6 * (1 - t); });
    s.dx = 0; s.dy = 0;
  }
  async hitFlash(side) {
    const s = this.side[side];
    for (let i = 0; i < 4; i++) { s.alpha = 0.15; s.white = 0.8; await clock.wait(0.05); s.alpha = 1; s.white = 0; await clock.wait(0.05); }
    s.white = 0; s.alpha = 1;
  }
  async enterAnim(side) {
    const s = this.side[side]; s.visible = true; s.alpha = 1; s.sink = 0;
    audio.sfx('select');
    if (side === 'e') { await this.tween(0.55, (t) => { s.dx = (1 - easeOut(t)) * 140; s.scale = 1; s.white = 0; }); s.dx = 0; }
    else { await this.tween(0.5, (t) => { s.scale = easeOut(t); s.white = 1 - t; s.dx = 0; }); s.scale = 1; s.white = 0; }
  }
  async exitAnim(side) {
    const s = this.side[side];
    await this.tween(0.35, (t) => { s.scale = 1 - t; s.white = t; });
    s.visible = false; s.scale = 1; s.white = 0;
  }
  async faintAnim(side) {
    const s = this.side[side]; audio.sfx('faint');
    await this.tween(0.7, (t) => { s.sink = t * 70; s.alpha = 1 - t * 0.6; });
    s.visible = false; s.sink = 0; s.alpha = 1;
  }
  msg(t, sec) { return ui.msg(t, sec); }

  // ----- déroulement -----
  async run() {
    const first = firstAlive(G.s.team);
    this.pi = first; this.participants.add(this.pc.uid);
    this.hpShown.p = this.pc.hp; this.hpShown.e = this.ec.hp; this.expShown = expProgress(this.pc);
    G.s.stats.battles++;
    G.markSeen(this.ec.species);
    this.hpShown.e = this.ec.hp;
    if (this.isWild) {
      await this.enterAnim('e');
      await this.msg(`Un ${SPECIES[this.ec.species].name} sauvage apparaît !`, 1.0);
    } else {
      const t = this.trainer;
      await this.msg(`${t.cls} ${t.trainerName || ''} veut se battre !`, 1.1);
      await this.msg(`${t.cls} envoie ${SPECIES[this.ec.species].name} !`, 0.8);
      await this.enterAnim('e');
    }
    await this.msg(`Go ! ${SPECIES[this.pc.species].name} !`, 0.7);
    await this.enterAnim('p');
    if (this.o.tutorial) await this.msg(BATTLE_TIPS[0], 3.2);
    else if (this.isWild && !G.s.flags.tipWild) { G.setFlag('tipWild'); await this.msg("Astuce : affaiblis-le puis choisis OBJET > Lanterne pour le capturer !", 3.2); }
    else if (!G.s.flags.tipTypes && this.kind === 'trainer') { G.setFlag('tipTypes'); await this.msg(BATTLE_TIPS[1], 3.2); }

    while (!this.over) await this.turn();
    return { result: this.result };
  }

  async turn() {
    ui.hide();
    const action = await this.chooseAction();
    if (this.over) return;
    const ea = this.aiChoose();
    // ordre : actions "non-attaque" du joueur d'abord
    const queue = [];
    if (action.type !== 'move') queue.push({ side: 'p', a: action });
    if (ea.type === 'item') queue.push({ side: 'e', a: ea });
    const moves = [];
    if (action.type === 'move') moves.push({ side: 'p', a: action });
    if (ea.type === 'move') moves.push({ side: 'e', a: ea });
    moves.sort((x, y) => this.moveOrder(x, y));
    queue.push(...moves);
    for (const q of queue) {
      if (this.over) return;
      if (this.cr(q.side).hp <= 0) continue;
      const ended = await this.execute(q.side, q.a);
      if (this.over) return;
      if (ended === 'ended') return;
      if (await this.checkFaints()) return;
    }
  }
  moveOrder(x, y) {
    const sx = this.effStat(x.side, 'spd'), sy = this.effStat(y.side, 'spd');
    if (sx !== sy) return sy - sx;
    return Math.random() < 0.5 ? -1 : 1;
  }
  effStat(side, stat) { return Math.floor(calcStats(this.cr(side))[stat] * stageMult(this.stages[side][stat])); }

  // ----- choix du joueur -----
  async chooseAction() {
    for (;;) {
      ui.hide();
      const prompt = `Que doit faire ${SPECIES[this.pc.species].name} ?`;
      const idx = await ui.choose(['Attaque', 'Objet', 'Équipe', 'Fuite'], {
        cols: 2, colWidth: 68, x: 172, y: 146, w: 144, h: 44, lineH: 16, cancel: null,
        draw: (g, m) => {
          panel(g, 4, 146, 164, 44); const lines = prompt.length > 20 ? [prompt.slice(0, prompt.lastIndexOf(' ', 20)), prompt.slice(prompt.lastIndexOf(' ', 20) + 1)] : [prompt];
          lines.forEach((l, i) => text(g, l, 12, 156 + i * 14, COL.text));
          panel(g, 172, 146, 144, 44, { fill: '#eef2ff' });
          m.opts.forEach((o, i) => { const cx = 180 + (i % 2) * 66, cy = 155 + Math.floor(i / 2) * 16; text(g, o.label, cx + 8, cy, COL.text); if (i === m.index) cursor(g, cx, cy); });
        },
      });
      if (idx === 0) { const r = await this.chooseMove(); if (r) return r; }
      else if (idx === 1) {
        const r = await pickBattleItem({ wild: this.isWild, activeIndex: this.pi, validate: (id, ti) => this.validateItem(id, ti) });
        if (r) return { type: 'item', id: r.id, target: r.target };
      } else if (idx === 2) {
        const r = await pickTeam({ mode: 'switch', title: 'Envoyer qui ?', active: this.pi, cancel: true });
        if (r >= 0) return { type: 'switch', index: r };
      } else if (idx === 3) {
        if (!this.isWild) { await this.msg("Impossible de fuir un combat de dresseur !", 1.2); continue; }
        return { type: 'run' };
      }
    }
  }
  async chooseMove() {
    const c = this.pc;
    const idx = await ui.choose(c.moves.map((m) => MOVES[m].name), {
      cols: 2, x: 4, y: 146, w: 312, h: 44, lineH: 16, cancel: -1,
      draw: (g, m) => {
        panel(g, 4, 146, 312, 44);
        m.opts.forEach((o, i) => { const cx = 14 + (i % 2) * 100, cy = 154 + Math.floor(i / 2) * 18; text(g, o.label.length > 11 ? o.label.slice(0, 11) : o.label, cx + 8, cy, COL.text); if (i === m.index) cursor(g, cx, cy); });
        const mv = MOVES[c.moves[m.index]], info = moveInfo(c.moves[m.index]), tc = TYPES[mv.type];
        g.fillStyle = COL.navy; g.fillRect(222, 150, 1, 36);
        g.fillStyle = tc.color; g.fillRect(228, 153, 52, 10); g.font = '6px "Press Start 2P"'; g.fillStyle = '#fff'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillText(tc.name.toUpperCase(), 232, 155);
        text(g, info.power ? `Puiss ${info.power}` : mv.kind === 'heal' ? 'Soin' : 'Statut', 228, 166, COL.text);
        g.font = '6px "Press Start 2P"'; g.fillStyle = COL.dim; g.fillText(info.text, 228, 179);
        // affinité contre l'adversaire
        if (mv.kind === 'dmg') { const e = effectiveness(mv.type, SPECIES[this.ec.species].type); g.fillStyle = e > 1 ? '#2a9a4a' : e < 1 ? '#c83a3a' : COL.dim; g.fillText(e > 1 ? 'x2' : e < 1 ? 'x0.5' : 'x1', 292, 155); }
      },
    });
    if (idx < 0) return null;
    return { type: 'move', move: c.moves[idx] };
  }
  validateItem(id, ti) {
    const it = ITEMS[id];
    if (it.kind === 'ball') { if (!this.isWild) return "Tu ne peux pas capturer le Lumin d'un autre dresseur !"; return null; }
    const c = G.s.team[ti]; if (!c) return 'Aucune cible.';
    if (it.kind === 'heal') { if (c.hp <= 0) return `${SPECIES[c.species].name} est K.O. : utilise un Rappel.`; if (c.hp >= maxHp(c)) return `Ça n'aurait aucun effet sur ${SPECIES[c.species].name}.`; }
    if (it.kind === 'revive' && c.hp > 0) return `${SPECIES[c.species].name} n'est pas K.O. !`;
    return null;
  }

  // ----- IA -----
  aiChoose() {
    const e = this.ec, p = this.pc, esp = SPECIES[e.species], psp = SPECIES[p.species];
    const emax = maxHp(e);
    if (!this.isWild && this.trainerItems.length && e.hp < emax * 0.3 && chance(0.7)) return { type: 'item', id: this.trainerItems.shift() };
    const scored = e.moves.map((id) => {
      const m = MOVES[id]; let s = 5;
      if (m.kind === 'dmg') {
        const eff = effectiveness(m.type, psp.type), stab = m.type === esp.type ? 1.5 : 1;
        s = m.power * (m.acc / 100) * eff * stab * 0.5;
        const est = this.estimate(m, 'e', 'p');
        if (est >= p.hp) s += 60;
      } else if (m.kind === 'heal') s = e.hp < emax * 0.4 ? 70 : e.hp >= emax ? -50 : 5;
      else {
        const st = m.effect; const tgt = st.self ? this.stages.e : this.stages.p;
        const cur = tgt[st.stat];
        s = (st.self ? (cur < 2 && e.hp > emax * 0.5 ? 26 : -20) : (cur > -2 && p.hp > maxHp(p) * 0.4 ? 22 : -20));
        if (this.turnCount > 3) s -= 10;
      }
      return { id, s: s * (this.isWild ? 0.6 + Math.random() * 0.8 : 0.85 + Math.random() * 0.3) };
    });
    this.turnCount = (this.turnCount || 0) + 1;
    scored.sort((a, b) => b.s - a.s);
    return { type: 'move', move: scored[0].id };
  }
  estimate(m, from, to) {
    const a = this.cr(from), d = this.cr(to);
    const A = this.effStat(from, 'atk'), D = this.effStat(to, 'def');
    let dmg = Math.floor(Math.floor(((2 * a.level) / 5 + 2) * m.power * A / D) / 50) + 2;
    dmg *= effectiveness(m.type, SPECIES[d.species].type) * (m.type === SPECIES[a.species].type ? 1.5 : 1);
    return Math.floor(dmg * 0.9);
  }

  // ----- exécution -----
  async execute(side, a) {
    if (a.type === 'move') return this.useMove(side, a.move);
    if (a.type === 'switch') return this.doSwitch(a.index, false);
    if (a.type === 'run') return this.tryRun();
    if (a.type === 'item') return this.useItem(side, a);
  }
  async useMove(side, id) {
    const other = side === 'p' ? 'e' : 'p'; const m = MOVES[id];
    const att = this.cr(side), def = this.cr(other);
    await this.msg(`${this.nm(side)} utilise ${m.name} !`, 0.7);
    if (m.kind === 'heal') {
      const mh = maxHp(att);
      if (att.hp >= mh) { await this.msg('Mais ça échoue !', 0.8); return; }
      audio.sfx('heal'); const fxp = this.playFx('heal', side, side, 0.7);
      att.hp = Math.min(mh, att.hp + Math.floor(mh * m.heal));
      await this.setHp(side, att.hp, 0.6); await fxp;
      await this.msg(`${this.nm(side)} récupère des PV !`, 0.8); return;
    }
    if (m.acc && !chance(m.acc / 100)) { audio.sfx('miss'); await this.msg(`L'attaque de ${this.nm(side)} échoue !`, 0.9); return; }
    if (m.kind === 'stat') { await this.applyStatEffect(side, m.effect, true); return; }
    // dégâts
    await this.lunge(side);
    const fxName = ATTACK_FX[m.type] ? m.type : 'normal';
    await this.playFx(fxName, side, other, 0.55);
    const eff = effectiveness(m.type, SPECIES[def.species].type), crit = chance(1 / 16);
    const A = this.effStat(side, 'atk'), D = this.effStat(other, 'def');
    let dmg = Math.floor(Math.floor(((2 * att.level) / 5 + 2) * m.power * A / D) / 50) + 2;
    dmg = Math.floor(dmg * (m.type === SPECIES[att.species].type ? 1.5 : 1) * eff * (crit ? 1.5 : 1) * (0.85 + Math.random() * 0.15));
    dmg = Math.max(1, dmg);
    def.hp = Math.max(0, def.hp - dmg);
    audio.sfx(eff > 1 ? 'super' : eff < 1 ? 'weak' : 'hit');
    this.shakeT = eff > 1 ? 0.3 : 0.15;
    const hf = this.hitFlash(other); await this.setHp(other, def.hp, 0.55); await hf;
    if (crit) await this.msg("Coup critique !", 0.7);
    if (eff > 1) await this.msg("C'est super efficace !", 0.9); else if (eff < 1) await this.msg("Ce n'est pas très efficace...", 0.9);
    if (m.effect && def.hp > 0 && chance(m.effect.chance ?? 1)) await this.applyStatEffect(side, m.effect, false);
  }
  async applyStatEffect(side, e, primary) {
    const target = e.self ? side : (side === 'p' ? 'e' : 'p');
    const st = this.stages[target]; const cur = st[e.stat];
    const name = STAT_NAMES[e.stat];
    if ((e.stages > 0 && cur >= 6) || (e.stages < 0 && cur <= -6)) { await this.msg(`${name} de ${this.nm(target)} ne peut plus ${e.stages > 0 ? 'augmenter' : 'baisser'} !`, 0.9); return; }
    st[e.stat] = clamp(cur + e.stages, -6, 6);
    const col = { atk: '#ff6a4a', def: '#4a9aff', spd: '#ffd23c' }[e.stat];
    audio.sfx(e.stages > 0 ? 'buff' : 'debuff');
    await this.playFx(e.stages > 0 ? 'buff' : 'debuff', target, target, 0.6, { color: col });
    const art = e.stat === 'atk' ? "L'" : 'La ';
    await this.msg(`${art}${name} de ${this.nm(target)} ${e.stages > 0 ? 'augmente' : 'baisse'}${Math.abs(e.stages) > 1 ? ' beaucoup' : ''} !`, 0.9);
  }

  // ----- objets -----
  async useItem(side, a) {
    const it = ITEMS[a.id];
    if (side === 'e') {   // le dresseur utilise un objet
      await this.msg(`${this.trainer.cls} utilise ${it.name} !`, 0.9);
      const c = this.ec, mh = maxHp(c); c.hp = Math.min(mh, c.hp + it.hp); audio.sfx('heal');
      await this.playFx('heal', 'e', 'e', 0.6); await this.setHp('e', c.hp, 0.6);
      await this.msg(`${this.nm('e')} récupère des PV !`, 0.8); return;
    }
    if (it.kind === 'ball') return this.throwBall(a.id);
    const c = G.s.team[a.target]; const n = SPECIES[c.species].name;
    G.useItem(a.id);
    await this.msg(`Tu utilises ${it.name} sur ${n} !`, 0.9);
    audio.sfx('heal');
    const active = a.target === this.pi;
    if (it.kind === 'heal') { c.hp = Math.min(maxHp(c), c.hp + it.hp); if (active) { await this.playFx('heal', 'p', 'p', 0.6); await this.setHp('p', c.hp, 0.6); } await this.msg(`${n} récupère des PV !`, 0.8); }
    else if (it.kind === 'revive') { c.hp = Math.max(1, Math.floor(maxHp(c) * it.frac)); await this.msg(`${n} est de retour sur pied !`, 0.9); }
  }
  async throwBall(id) {
    const it = ITEMS[id], e = this.ec, sp = SPECIES[e.species];
    G.useItem(id);
    await this.msg(`Tu lances ${it.name === 'Lanterne' ? 'une' : 'une'} ${it.name} !`, 0.7);
    const from = { x: POS.p.x + 30, y: POS.p.cy - 10 }, to = { x: POS.e.x, y: POS.e.cy - 6 };
    const ball = this.ballAnim = { x: from.x, y: from.y, rot: 0, super: id === 'super_lanterne' };
    audio.sfx('throw');
    await this.tween(0.6, (t) => { ball.x = lerp(from.x, to.x, t); ball.y = lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * 50; ball.rot = t * 12; });
    // capture : le Lumin est aspiré
    const s = this.side.e; audio.sfx('flash');
    await this.tween(0.4, (t) => { ball.glow = 1 - t; s.scale = 1 - t; s.white = t; });
    s.visible = false; s.scale = 1; s.white = 0; ball.glow = 0;
    const gy = POS.e.ground - 6;
    await this.tween(0.35, (t) => { ball.y = lerp(to.y, gy, t * t); ball.rot = 0; });
    const mh = maxHp(e);
    let a = ((3 * mh - 2 * e.hp) * SPECIES[e.species].catchRate * it.mult) / (3 * mh);
    const p = clamp(a / 255, 0.02, 0.97), ok = Math.random() < p;
    const shakes = ok ? 3 : rand(3);
    for (let i = 0; i < shakes; i++) {
      await clock.wait(0.35); audio.sfx('shake');
      await this.tween(0.4, (t) => { ball.rot = Math.sin(t * Math.PI * 2) * 0.5; });
      ball.rot = 0;
    }
    await clock.wait(0.3);
    if (ok) {
      audio.sfx('catch'); ball.glow = 0.6;
      this.dark = 0.0;
      await this.msg(`Bravo ! ${sp.name} est capturé !`, 1.3);
      ball.glow = 0; this.ballAnim = null;
      e.hp = Math.max(1, e.hp);
      G.s.stats.captures++;
      const where = G.addCreature(e);
      await this.msg(where === 'team' ? `${sp.name} rejoint ton équipe !` : `${sp.name} est envoyé dans la réserve.`, 1.4);
      if (!G.s.flags.firstCatch) { G.setFlag('firstCatch'); await this.msg("Le bestiaire s'est mis à jour. Ouvre le menu pour le consulter !", 2.0); }
      this.result = 'caught'; this.over = true; return 'ended';
    }
    audio.sfx('break');
    this.ballAnim = null; s.visible = true; s.scale = 1; s.white = 0; this.effects.push({ t0: this.t, dur: 0.35, fn: (g, p) => { g.fillStyle = `rgba(255,255,255,${1 - p})`; g.beginPath(); g.arc(POS.e.x, POS.e.cy, 30 * p + 8, 0, 6.3); g.fill(); } });
    await clock.wait(0.2);
    await this.msg(shakes === 0 ? `Oh non ! ${sp.name} s'est libéré tout de suite !` : shakes === 1 ? "Zut ! Il était presque capturé !" : "Dommage ! Il s'en est fallu de peu !", 1.1);
  }

  async tryRun() {
    this.runs++;
    const ps = this.effStat('p', 'spd'), es = this.effStat('e', 'spd');
    const f = Math.floor((ps * 128) / es) + 30 * this.runs;
    if (rand(256) < f || ps >= es) {
      audio.sfx('back'); await this.msg('Tu prends la fuite !', 0.9); this.result = 'run'; this.over = true; return 'ended';
    }
    await this.msg("Impossible de s'échapper !", 0.9);
  }

  // ----- changement de Lumin -----
  async doSwitch(index, forced) {
    if (!forced && this.pc.hp > 0) { await this.msg(`Reviens, ${SPECIES[this.pc.species].name} !`, 0.7); await this.exitAnim('p'); }
    this.pi = index; this.stages.p = { atk: 0, def: 0, spd: 0 };
    this.participants.add(this.pc.uid);
    this.hpShown.p = this.pc.hp; this.expShown = expProgress(this.pc);
    await this.msg(`Go ! ${SPECIES[this.pc.species].name} !`, 0.7);
    await this.enterAnim('p');
  }

  // ----- K.O. -----
  async checkFaints() {
    if (this.ec.hp <= 0) { await this.enemyFainted(); return true; }
    if (this.pc.hp <= 0) { await this.playerFainted(); return true; }
    return false;
  }
  async enemyFainted() {
    await this.faintAnim('e');
    await this.msg(`${this.nm('e')} est K.O. !`, 0.9);
    await this.awardExp(this.ec);
    const next = this.eIndex + 1;
    if (next < this.enemies.length) {
      this.eIndex = next; this.stages.e = { atk: 0, def: 0, spd: 0 }; this.hpShown.e = this.ec.hp;
      this.participants = new Set([this.pc.uid]);
      G.markSeen(this.ec.species);
      await this.msg(`${this.trainer.cls} envoie ${SPECIES[this.ec.species].name} !`, 0.9);
      await this.enterAnim('e');
      return;
    }
    // victoire
    if (this.isWild) { const gold = this.ec.level * 2; G.s.money += gold; await this.msg(`Tu ramasses ${gold} écus.`, 1.0); }
    else { audio.sfx('win'); await this.msg(`Tu as battu ${this.trainer.cls} ${this.trainer.trainerName || ''} !`, 1.4); }
    this.result = 'win'; this.over = true;
  }
  async playerFainted() {
    await this.faintAnim('p');
    await this.msg(`${SPECIES[this.pc.species].name} est K.O. !`, 0.9);
    if (aliveCount(G.s.team) === 0) {
      await this.msg("Tu n'as plus de Lumins en état de se battre !", 1.3);
      this.result = 'lose'; this.over = true; return;
    }
    ui.hide();
    const r = await pickTeam({ mode: 'switch', title: 'Envoyer qui ?', active: this.pi, cancel: false });
    await this.doSwitch(r, true);
  }

  // ----- expérience -----
  async awardExp(enemy) {
    const base = SPECIES[enemy.species].exp;
    const total = Math.max(1, Math.floor((base * enemy.level) / 7 * (this.isWild ? 1 : 1.5)));
    const members = G.s.team.filter((c) => c.hp > 0);
    for (const c of members) {
      const part = this.participants.has(c.uid), share = part ? total : Math.max(1, Math.floor(total * 0.5));
      const active = c === this.pc, n = SPECIES[c.species].name;
      if (part) await this.msg(`${n} gagne ${share} points d'expérience !`, 0.9);
      const before = expProgress(c);
      const events = addExp(c, share);
      if (active) {
        if (events.length) await this.tweenExp(before, 1); else await this.tweenExp(before, expProgress(c));
      }
      for (const ev of events) {
        audio.sfx('levelup');
        if (active) { this.hpShown.p = Math.min(c.hp, this.hpShown.p + 3); this.hpShown.p = c.hp; }
        await this.msg(`${n} passe au niveau ${ev.level} !`, 1.2);
        for (const mv of ev.learn) await this.learnMove(c, mv);
        if (active) { this.expShown = 0; if (ev === events[events.length - 1]) await this.tweenExp(0, expProgress(c)); }
      }
    }
  }
  async tweenExp(a, b) { await this.tween(0.5, (t) => { this.expShown = lerp(a, b, t); }); this.expShown = b; }
  async learnMove(c, mv) {
    const n = SPECIES[c.species].name, m = MOVES[mv];
    if (c.moves.length < 4) { c.moves.push(mv); audio.sfx('confirm'); await this.msg(`${n} apprend ${m.name} !`, 1.2); return; }
    await this.msg(`${n} veut apprendre ${m.name}, mais connaît déjà 4 attaques.`, 1.6);
    ui.hide();
    const idx = await ui.choose([...c.moves.map((x) => MOVES[x].name), 'Ne pas apprendre'], {
      x: 100, y: 40, cancel: 4,
      draw: (g, mm) => { panel(g, 60, 30, 200, 98); text(g, `Oublier laquelle pour`, 70, 38, COL.text); text(g, `${m.name} ?`, 70, 50, COL.text); mm.opts.forEach((o, i) => { text(g, o.label, 86, 66 + i * 12, COL.text); if (i === mm.index) cursor(g, 74, 66 + i * 12); }); },
    });
    if (idx >= 0 && idx < 4) { const old = MOVES[c.moves[idx]].name; c.moves[idx] = mv; await this.msg(`1, 2... et voilà ! ${n} oublie ${old} et apprend ${m.name} !`, 1.8); }
    else await this.msg(`${n} n'apprend pas ${m.name}.`, 1.2);
  }
}

export async function runBattle(o) {
  const s = new BattleScene(o);
  await fx.out('battle', 0.85);
  audio.music(o.boss ? 'boss' : 'battle');
  scenes.push(s);
  await fx.in(0.5);
  let result;
  try { result = await s.run(); }
  finally { ui.hide(); ui.menu = null; }
  if (result.result === 'win' || result.result === 'caught') audio.sfx('win');
  await fx.out('fade', 0.4);
  scenes.pop();
  await fx.in(0.4);
  return result;
}
