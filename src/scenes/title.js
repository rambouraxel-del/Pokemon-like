import { W, H, GAME_TITLE, GAME_SUBTITLE } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL, FONT } from '../core/ui.js';
import { scenes, fx } from '../core/scenes.js';
import { clock } from '../core/clock.js';
import { G } from '../systems/game.js';
import { clearSave } from '../core/save.js';
import { creatureSprite } from '../gfx/creatures.js';
import { OptionsScene } from './options.js';
import { smallText } from './common.js';
import { INTRO_PAGES } from '../data/story.js';

export class TitleScene {
  get sceneId() { return 'title'; }
  constructor(startGame) { this.startGame = startGame; this.t = 0; this.phase = 'press'; this.i = 0; this.busy = false; this.stars = Array.from({ length: 50 }, (_, k) => ({ x: (k * 97) % W, y: (k * 41) % 110, s: (k % 3) + 1 })); }
  enter() { audio.music('title'); }
  items() { return G.hasSave() ? ['Continuer', 'Nouvelle partie', 'Options'] : ['Nouvelle partie', 'Options']; }
  update(dt) {
    this.t += dt; if (this.busy) return;
    if (this.phase === 'press') { if (input.anyPressed()) { audio.init(); audio.music('title'); audio.sfx('confirm'); this.phase = 'menu'; } return; }
    const it = this.items();
    if (input.pressed('down')) { this.i = (this.i + 1) % it.length; audio.sfx('select'); }
    if (input.pressed('up')) { this.i = (this.i + it.length - 1) % it.length; audio.sfx('select'); }
    if (input.pressed('a')) this.choose(it[this.i]);
  }
  async choose(label) {
    this.busy = true;
    try {
      audio.sfx('confirm');
      if (label === 'Continuer') { if (G.load()) await this.startGame('continue'); else await ui.say(["Impossible de lire la sauvegarde."]); }
      else if (label === 'Nouvelle partie') {
        if (G.hasSave()) {
          const r = await ui.ask("Écraser la sauvegarde et recommencer ?", ['Non', 'Oui, effacer']);
          if (r !== 1) return;
          clearSave();
        }
        G.newGame(); await this.startGame('new');
      } else if (label === 'Options') await new Promise((res) => scenes.push(new OptionsScene(res, null)));
    } finally { this.busy = false; }
  }
  render(g) {
    const t = this.t;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0e1240'); sky.addColorStop(0.55, '#3a3a8a'); sky.addColorStop(1, '#8a6aa8');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (const s of this.stars) { g.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.abs(Math.sin(t * 1.5 + s.x))})`; g.fillRect(s.x, s.y, s.s > 2 ? 2 : 1, s.s > 2 ? 2 : 1); }
    // lune
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(286, 74, 12, 0, 6.3); g.fill(); g.fillStyle = '#e8dcb8'; g.beginPath(); g.arc(282, 70, 3, 0, 6.3); g.fill();
    // collines + phare
    g.fillStyle = '#2a2a6a'; g.beginPath(); g.moveTo(0, 130); for (let x = 0; x <= W; x += 8) g.lineTo(x, 112 + Math.sin(x * 0.03 + 1) * 10); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    const px = 70, py = 104;
    g.fillStyle = '#1a1a4a'; g.beginPath(); g.moveTo(px - 8, py + 20); g.lineTo(px - 4, py - 34); g.lineTo(px + 4, py - 34); g.lineTo(px + 8, py + 20); g.fill();
    g.fillStyle = '#2a2a6a'; g.fillRect(px - 6, py - 40, 12, 7); g.fillStyle = '#1a1a4a'; g.beginPath(); g.moveTo(px - 7, py - 40); g.lineTo(px, py - 48); g.lineTo(px + 7, py - 40); g.fill();
    const flick = (Math.sin(t * 7) > 0.92) ? 0.7 : 0.15 + 0.1 * Math.sin(t * 2);
    g.fillStyle = `rgba(255,230,140,${flick})`; g.fillRect(px - 3, py - 39, 6, 5);
    g.fillStyle = '#16164a'; g.beginPath(); g.moveTo(0, 150); for (let x = 0; x <= W; x += 8) g.lineTo(x, 136 + Math.sin(x * 0.05 + 3) * 8); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // lucioles
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 14; k++) { const x = (k * 71 + Math.sin(t * 0.7 + k) * 20) % W, y = 120 + ((k * 23) % 60) + Math.cos(t * 0.9 + k) * 8; const gr = g.createRadialGradient(x, y, 0, x, y, 8); gr.addColorStop(0, `rgba(255,240,150,${0.5 + 0.4 * Math.sin(t * 3 + k)})`); gr.addColorStop(1, 'rgba(255,240,150,0)'); g.fillStyle = gr; g.fillRect(x - 8, y - 8, 16, 16); }
    g.restore();
    // créatures
    ['feuillin', 'braisillon', 'gouttelin'].forEach((id, k) => g.drawImage(creatureSprite(id, 'front'), 190 + k * 40, 142 + Math.sin(t * 2.4 + k * 1.3) * 2, 40, 40));
    // titre
    g.font = '28px "Press Start 2P"'; g.textAlign = 'center'; g.textBaseline = 'top';
    const ty = 22 + Math.sin(t * 1.5) * 1.5;
    g.fillStyle = '#2a1860'; g.fillText(GAME_TITLE, W / 2 + 3, ty + 3);
    const tg = g.createLinearGradient(0, ty, 0, ty + 28); tg.addColorStop(0, '#fff6b0'); tg.addColorStop(1, '#ffb040'); g.fillStyle = tg; g.fillText(GAME_TITLE, W / 2, ty);
    g.strokeStyle = '#5a2a8a'; g.lineWidth = 1; g.strokeText(GAME_TITLE, W / 2, ty);
    text(g, GAME_SUBTITLE, W / 2, ty + 36, '#ffffff', '#2a1860', 'center');
    if (this.phase === 'press') {
      if (Math.floor(t * 2) % 2 === 0) text(g, 'Appuie sur A / touche pour jouer', W / 2, 118, '#ffffff', '#2a1860', 'center');
    } else {
      const it = this.items(); const h = it.length * 16 + 12;
      panel(g, W / 2 - 62, 94, 124, h);
      it.forEach((s, k) => { const y = 101 + k * 16; text(g, s, W / 2 - 38, y, COL.text); if (k === this.i) cursor(g, W / 2 - 50, y); });
    }
    smallText(g, 'v0.1 - Premier prototype jouable', W / 2, H - 9, 'rgba(255,255,255,0.7)', 'center');
  }
}

export class IntroScene {
  get sceneId() { return 'intro'; }
  constructor(done) { this.done = done; this.page = 0; this.shown = 0; this.t = 0; this.state = 'typing'; this.busy = false; }
  enter() { audio.music('inside'); }
  update(dt) {
    this.t += dt;
    const full = INTRO_PAGES[this.page].length;
    if (this.shown < full) { this.shown = Math.min(full, this.shown + dt * 40); if (input.pressed('a') || input.pressed('b')) this.shown = full; return; }
    if (input.pressed('a') || input.pressed('b')) {
      audio.sfx('select'); this.page++; this.shown = 0;
      if (this.page >= INTRO_PAGES.length) { this.page = INTRO_PAGES.length - 1; this.shown = full; if (!this.busy) { this.busy = true; this.done(); } }
    }
  }
  render(g) {
    g.fillStyle = '#05050f'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(this.t + k)})`; g.fillRect((k * 83) % W, (k * 37) % H, 1, 1); }
    const s = INTRO_PAGES[this.page].slice(0, Math.floor(this.shown));
    const words = INTRO_PAGES[this.page].split(' '); let lines = [], line = '';
    for (const w of words) { if ((line + ' ' + w).trim().length > 34) { lines.push(line); line = w; } else line = (line + ' ' + w).trim(); } lines.push(line);
    let left = Math.floor(this.shown);
    lines.forEach((l, i) => { text(g, l.slice(0, Math.max(0, left)), 22, 62 + i * 16, '#f0ecff'); left -= l.length + 1; });
    if (this.shown >= INTRO_PAGES[this.page].length && Math.floor(this.t * 3) % 2 === 0) text(g, 'A', W - 24, H - 20, '#8a8ac8');
  }
}
