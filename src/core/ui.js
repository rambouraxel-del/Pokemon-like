// Interface commune : texte pixel, panneaux, boîte de dialogue à machine à écrire, menus de choix (promesses).
import { W, H } from '../config.js';
import { input } from './input.js';
import { audio } from './audio.js';

export const FONT = '8px "Press Start 2P", monospace';
export const COL = { text: '#2a2a44', dim: '#7a7a96', white: '#ffffff', navy: '#2c3a78', blue: '#4a6ad0', cream: '#fbf8ee', sel: '#e8f0ff', red: '#d84a4a', green: '#3aa05a', gold: '#e8b830' };

export function text(g, str, x, y, color = COL.text, shadow = null, align = 'left') {
  g.font = FONT; g.textBaseline = 'top'; g.textAlign = align;
  if (shadow) { g.fillStyle = shadow; g.fillText(str, x + 1, y + 1); }
  g.fillStyle = color; g.fillText(str, x, y);
}
export const textWidth = (str) => str.length * 8;

export function panel(g, x, y, w, h, o = {}) {
  const border = o.border || COL.navy, inner = o.inner || '#9ab4f0', fill = o.fill || COL.cream;
  g.fillStyle = border; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = inner; g.fillRect(x + 2, y + 1, w - 4, h - 2); g.fillRect(x + 1, y + 2, w - 2, h - 4);
  g.fillStyle = fill; g.fillRect(x + 3, y + 2, w - 6, h - 4); g.fillRect(x + 2, y + 3, w - 4, h - 6);
}
export function cursor(g, x, y, color = COL.red) {
  g.fillStyle = color; g.fillRect(x, y, 2, 7); g.fillRect(x + 2, y + 1, 2, 5); g.fillRect(x + 4, y + 2, 2, 3); g.fillRect(x + 6, y + 3, 1, 1);
}
export function arrowDown(g, x, y, color = COL.red) { g.fillStyle = color; g.fillRect(x, y, 7, 2); g.fillRect(x + 1, y + 2, 5, 2); g.fillRect(x + 2, y + 4, 3, 2); g.fillRect(x + 3, y + 6, 1, 1); }

export function wrap(str, max = 36) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (!line.length) line = word;
      else if ((line + ' ' + word).length <= max) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}

class UI {
  constructor() { this.box = null; this.menu = null; this.toastMsg = null; this.t = 0; }
  get active() { return !!(this.box || this.menu); }
  get blocking() { return !!(this.box && this.box.waiting) || !!this.menu; }

  // Dialogue : attend une validation par page. Ferme la boîte à la fin sauf keep.
  async say(content, speaker = null, opts = {}) {
    const items = Array.isArray(content) ? content : [content];
    for (let i = 0; i < items.length; i++) {
      const lines = wrap(items[i]);
      for (let p = 0; p < lines.length; p += 2) {
        const page = lines.slice(p, p + 2);
        const last = i === items.length - 1 && p + 2 >= lines.length;
        await this._page(page, speaker, { ...opts, last });
      }
    }
    if (!opts.keep) this.hide();
  }
  _page(lines, speaker, opts) {
    return new Promise((res) => {
      this.box = { lines, speaker, shown: 0, total: lines.join('').length, waiting: false, resolve: res, auto: opts.auto ?? null, timer: 0, y: opts.y, noWait: !!opts.noWait };
    });
  }
  // message de combat : s'avance seul (ou avec A), reste affiché
  msg(content, sec = 0.85) {
    const lines = wrap(content);
    return new Promise((res) => { this.box = { lines: lines.slice(0, 2), speaker: null, shown: 0, total: lines.slice(0, 2).join('').length, waiting: false, resolve: res, auto: sec, timer: 0, battle: true }; });
  }
  hide() { this.box = null; }
  // menu de choix ; renvoie l'index ou -1 si annulé
  choose(options, o = {}) {
    return new Promise((res) => {
      const opts = options.map((v) => (typeof v === 'string' ? { label: v } : v));
      const cols = o.cols || 1;
      const rows = Math.ceil(opts.length / cols);
      const cw = o.colWidth || (Math.max(...opts.map((a) => a.label.length)) * 8 + 20);
      const w = o.w || cw * cols + 12;
      const h = o.h || rows * (o.lineH || 14) + 10;
      this.menu = { opts, index: o.index || 0, cols, rows, cw, w, h, x: o.x ?? (W - w - 6), y: o.y ?? (H - 56 - h - 4), lineH: o.lineH || 14, cancel: o.cancel === undefined ? -1 : o.cancel, resolve: res, title: o.title, noPanel: o.noPanel, onMove: o.onMove, draw: o.draw };
      if (this.menu.onMove) this.menu.onMove(this.menu.index);
    });
  }
  async ask(question, options = ['Oui', 'Non'], speaker = null) {
    const lines = wrap(question).slice(0, 2);
    this.box = { lines, speaker, shown: 999, total: 999, waiting: false, resolve: () => {}, auto: null, timer: 0, noWait: true };
    const r = await this.choose(options, { cancel: options.length - 1 });
    this.hide();
    return r;
  }
  toast(msg, sec = 1.6) { this.toastMsg = { msg, t: sec }; }

  update(dt) {
    this.t += dt;
    if (this.toastMsg) { this.toastMsg.t -= dt; if (this.toastMsg.t <= 0) this.toastMsg = null; }
    const b = this.box;
    if (b && !this.menu) {
      if (b.shown < b.total) {
        const prev = Math.floor(b.shown);
        b.shown = Math.min(b.total, b.shown + dt * 55);
        if (Math.floor(b.shown) !== prev && Math.floor(b.shown) % 3 === 0) audio.sfx('text');
        if (input.pressed('a') || input.pressed('b')) b.shown = b.total;
        if (b.shown >= b.total) b.timer = 0;
      } else if (b.noWait) {
        // reste affichée (ask)
      } else {
        b.waiting = true; b.timer += dt;
        if (input.pressed('a') || input.pressed('b') || (b.auto != null && b.timer >= b.auto)) {
          b.waiting = false; const r = b.resolve; if (b.battle) { /* reste visible */ } else this.box = null; r();
        }
      }
      return true;
    }
    const m = this.menu;
    if (m) {
      const n = m.opts.length;
      const prev = m.index;
      if (input.pressed('up')) m.index = m.cols === 1 ? (m.index + n - 1) % n : (m.index - m.cols >= 0 ? m.index - m.cols : m.index);
      if (input.pressed('down')) m.index = m.cols === 1 ? (m.index + 1) % n : (m.index + m.cols < n ? m.index + m.cols : m.index);
      if (m.cols > 1) {
        if (input.pressed('left') && m.index % m.cols > 0) m.index--;
        if (input.pressed('right') && m.index % m.cols < m.cols - 1 && m.index + 1 < n) m.index++;
      }
      if (m.index !== prev) { audio.sfx('select'); if (m.onMove) m.onMove(m.index); }
      if (input.pressed('a')) {
        if (m.opts[m.index].disabled) audio.sfx('error');
        else { audio.sfx('confirm'); this.menu = null; m.resolve(m.index); }
      } else if ((input.pressed('b') || input.pressed('start')) && m.cancel !== undefined && m.cancel !== null) {
        audio.sfx('back'); this.menu = null; m.resolve(m.cancel);
      }
      return true;
    }
    return !!b;
  }

  draw(g) {
    const b = this.box;
    if (b) {
      const y = b.y ?? (H - 52);
      panel(g, 4, y, W - 8, 48);
      const shown = Math.floor(b.shown);
      let left = shown;
      b.lines.forEach((ln, i) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length; text(g, s, 14, y + 10 + i * 16, COL.text); });
      if (b.waiting && !b.battle && Math.floor(this.t * 3) % 2 === 0) arrowDown(g, W - 20, y + 36);
      if (b.speaker) { panel(g, 8, y - 12, b.speaker.length * 8 + 14, 16, { fill: '#e6eeff' }); text(g, b.speaker, 15, y - 8, COL.navy); }
    }
    const m = this.menu;
    if (m) {
      if (m.draw) m.draw(g, m);
      else {
        if (!m.noPanel) panel(g, m.x, m.y, m.w, m.h);
        if (m.title) text(g, m.title, m.x + 8, m.y - 10, COL.white, COL.navy);
        m.opts.forEach((o, i) => {
          const cx = m.x + 10 + (i % m.cols) * m.cw, cy = m.y + 7 + Math.floor(i / m.cols) * m.lineH;
          text(g, o.label, cx + 8, cy, o.disabled ? COL.dim : COL.text);
          if (i === m.index) cursor(g, cx, cy);
        });
      }
    }
    if (this.toastMsg) {
      const t = this.toastMsg; const w = t.msg.length * 8 + 16;
      panel(g, (W - w) / 2, 6, w, 18, { fill: '#fff8d8' }); text(g, t.msg, (W - w) / 2 + 8, 11, COL.text);
    }
  }
}
export const ui = new UI();
