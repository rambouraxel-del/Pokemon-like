// Pile de scènes + transitions plein écran (fondu, spirale de combat, éclair).
import { W, H } from '../config.js';
import { clock } from './clock.js';
import { easeInOut } from './util.js';

export const scenes = {
  stack: [],
  get top() { return this.stack[this.stack.length - 1]; },
  push(s) { this.stack.push(s); s.enter && s.enter(); },
  pop() { const s = this.stack.pop(); s && s.exit && s.exit(); return s; },
  replace(s) { while (this.stack.length) this.pop(); this.push(s); },
  update(dt) { const s = this.top; if (s && s.update) s.update(dt); },
  render(g) {
    // rend toutes les scènes depuis la dernière opaque
    let start = this.stack.length - 1;
    while (start > 0 && this.stack[start].transparent) start--;
    for (let i = Math.max(0, start); i < this.stack.length; i++) this.stack[i].render(g);
  },
};

export const fx = {
  mode: null, t: 0, color: '#000',
  // à rendre par-dessus tout
  draw(g) {
    if (!this.mode) return;
    const t = this.t;
    if (this.mode === 'fade') { g.fillStyle = this.color; g.globalAlpha = t; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    else if (this.mode === 'battle') {      // bandes qui se referment + flash
      const n = 12, hh = H / n;
      g.fillStyle = '#000';
      for (let i = 0; i < n; i++) {
        const p = Math.max(0, Math.min(1, t * 1.6 - (i / n) * 0.6));
        const w = W * p; if (i % 2) g.fillRect(W - w, i * hh, w, hh + 1); else g.fillRect(0, i * hh, w, hh + 1);
      }
      if (t < 0.35) { g.fillStyle = '#fff'; g.globalAlpha = Math.abs(Math.sin(t * 28)) * 0.7; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    } else if (this.mode === 'flash') { g.fillStyle = '#fff'; g.globalAlpha = t; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    else if (this.mode === 'iris') {
      const r = (1 - t) * 210; g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H / 2, Math.max(0, r), 0, 6.3, true); g.fill('evenodd');
    }
  },
  async out(mode = 'fade', sec = 0.35, color = '#000') { this.mode = mode; this.color = color; await clock.tween(sec, (t) => { this.t = easeInOut(t); }); this.t = 1; },
  async in(sec = 0.35) { const m = this.mode; if (!m) return; await clock.tween(sec, (t) => { this.t = 1 - easeInOut(t); }); this.mode = null; },
  clear() { this.mode = null; },
};
