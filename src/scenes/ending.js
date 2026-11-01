import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { text, panel, COL, wrap } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { G } from '../systems/game.js';
import { creatureSprite } from '../gfx/creatures.js';
import { smallText } from './common.js';

const PAGES = [
  "Au village d'Aubépine, le Phare des Lueurs brille de nouveau.",
  "Les Lumins, guidés par sa lumière, retrouvent leur chemin. Ténébrume veille à nouveau sur le Sanctuaire, et Vesper l'aide à réparer ses erreurs.",
  "Mais le Prisme cache encore bien des secrets... D'autres Lumins attendent, au-delà de la forêt.",
];

export class EndingScene {
  constructor(done) { this.done = done; this.t = 0; this.page = 0; this.shown = 0; this.phase = 'story'; this.finished = false; }
  enter() { audio.music('ending'); }
  update(dt) {
    this.t += dt;
    if (this.phase === 'story') {
      const full = PAGES[this.page].length;
      if (this.shown < full) { this.shown = Math.min(full, this.shown + dt * 30); if (input.pressed('a') || input.pressed('b')) this.shown = full; return; }
      if (input.pressed('a') || input.pressed('b')) { audio.sfx('select'); this.page++; this.shown = 0; if (this.page >= PAGES.length) { this.phase = 'fin'; this.t = 0; } }
    } else if (this.t > 1.5 && input.pressed('a') && !this.finished) { this.finished = true; audio.sfx('confirm'); scenes.pop(); this.done(); }
  }
  render(g) {
    const t = this.t + (this.phase === 'fin' ? 20 : 0);
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#10124a'); sky.addColorStop(0.6, '#5a4a9a'); sky.addColorStop(1, '#f0a868');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 2 + k)})`; g.fillRect((k * 83) % W, (k * 37) % 90, 1, 1); }
    // faisceau du phare
    const px = 110, py = 108;
    g.save(); g.globalCompositeOperation = 'lighter'; const ang = Math.sin(t * 0.7) * 0.5 - 0.5;
    g.fillStyle = 'rgba(255,240,170,0.28)'; g.beginPath(); g.moveTo(px, py - 44); g.lineTo(px + Math.cos(ang - 0.12) * 260, py - 44 + Math.sin(ang - 0.12) * 260); g.lineTo(px + Math.cos(ang + 0.12) * 260, py - 44 + Math.sin(ang + 0.12) * 260); g.fill();
    g.fillStyle = 'rgba(255,240,170,0.28)'; g.beginPath(); g.moveTo(px, py - 44); g.lineTo(px - Math.cos(ang - 0.12) * 260, py - 44 - Math.sin(ang - 0.12) * 260); g.lineTo(px - Math.cos(ang + 0.12) * 260, py - 44 - Math.sin(ang + 0.12) * 260); g.fill();
    const gr = g.createRadialGradient(px, py - 44, 0, px, py - 44, 40); gr.addColorStop(0, 'rgba(255,240,170,0.9)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(px - 40, py - 84, 80, 80);
    g.restore();
    g.fillStyle = '#3a2a6a'; g.beginPath(); g.moveTo(0, 140); for (let x = 0; x <= W; x += 8) g.lineTo(x, 122 + Math.sin(x * 0.03 + 1) * 10); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#2a1e50'; g.beginPath(); g.moveTo(px - 9, py + 22); g.lineTo(px - 5, py - 36); g.lineTo(px + 5, py - 36); g.lineTo(px + 9, py + 22); g.fill();
    g.fillStyle = '#ffe9a0'; g.fillRect(px - 5, py - 44, 10, 8); g.fillStyle = '#2a1e50'; g.beginPath(); g.moveTo(px - 8, py - 44); g.lineTo(px, py - 52); g.lineTo(px + 8, py - 44); g.fill();
    g.fillStyle = '#24184a'; g.beginPath(); g.moveTo(0, 160); for (let x = 0; x <= W; x += 8) g.lineTo(x, 148 + Math.sin(x * 0.05 + 3) * 6); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // l'équipe se tient sur la colline
    G.s.team.slice(0, 6).forEach((c, k) => g.drawImage(creatureSprite(c.species, 'front'), 150 + (k % 3) * 46, 128 + Math.floor(k / 3) * 8 + Math.sin(t * 2.4 + k) * 1.5, 40, 40));
    if (this.phase === 'story') {
      panel(g, 8, 8, W - 16, 66, { fill: 'rgba(251,248,238,0.95)' });
      let left = Math.floor(this.shown);
      wrap(PAGES[this.page], 34).forEach((l, i) => { text(g, l.slice(0, Math.max(0, left)), 18, 16 + i * 14, COL.text); left -= l.length + 1; });
    } else {
      g.font = '32px "Press Start 2P"'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = '#2a1860'; g.fillText('FIN', W / 2 + 2, 14 + 2); g.fillStyle = '#ffe9a0'; g.fillText('FIN', W / 2, 14);
      panel(g, 40, 56, W - 80, 62, { fill: 'rgba(251,248,238,0.95)' });
      const secs = Math.floor(G.s.playtime), hh = Math.floor(secs / 3600), mm = Math.floor((secs % 3600) / 60);
      const caught = Object.values(G.s.dex).filter((v) => v === 'caught').length;
      text(g, `Temps de jeu : ${hh}h${String(mm).padStart(2, '0')}`, 52, 64, COL.text);
      text(g, `Bestiaire : ${caught}/8 capturés`, 52, 78, COL.text);
      text(g, `Combats : ${G.s.stats.battles}`, 52, 92, COL.text);
      text(g, `Captures : ${G.s.stats.captures}`, 52, 106, COL.text);
      if (this.t > 1.5 && Math.floor(this.t * 2) % 2 === 0) text(g, "Merci d'avoir joué ! (A : continuer)", W / 2, H - 14, '#ffffff', '#2a1860', 'center');
    }
  }
}
