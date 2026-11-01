import { W, H } from '../config.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { ui, text, panel, cursor, COL } from '../core/ui.js';
import { scenes } from '../core/scenes.js';
import { saveSettings, loadSettings } from '../core/save.js';
import { drawBackdrop, smallText } from './common.js';

export function applySettings() {
  const s = loadSettings();
  audio.setVolume(s.volume ?? 0.7); audio.setMuted(!!s.muted);
}
export class OptionsScene {
  get sceneId() { return 'options'; }
  constructor(resolve, world) { this.resolve = resolve; this.world = world; this.i = 0; this.t = 0; this.busy = false; this.s = { volume: 0.7, muted: false, ...loadSettings() }; }
  rows() { return world => null; }
  update(dt) {
    this.t += dt; if (this.busy) return;
    const n = 3;
    if (input.pressed('down')) { this.i = (this.i + 1) % n; audio.sfx('select'); }
    if (input.pressed('up')) { this.i = (this.i + n - 1) % n; audio.sfx('select'); }
    if (this.i === 0 && (input.pressed('left') || input.pressed('right'))) { this.s.volume = Math.max(0, Math.min(1, +(this.s.volume + (input.pressed('right') ? 0.1 : -0.1)).toFixed(1))); this.apply(); audio.sfx('confirm'); }
    if (this.i === 1 && (input.pressed('a') || input.pressed('left') || input.pressed('right'))) { this.s.muted = !this.s.muted; this.apply(); audio.sfx('confirm'); }
    if ((this.i === 2 && input.pressed('a')) || input.pressed('b') || input.pressed('start')) { audio.sfx('back'); scenes.pop(); this.resolve(); }
  }
  apply() { audio.setVolume(this.s.volume); audio.setMuted(this.s.muted); saveSettings(this.s); }
  render(g) {
    drawBackdrop(g, this.t, 'OPTIONS');
    panel(g, 20, 40, W - 40, 110, { fill: '#fbf8ee' });
    text(g, 'Volume', 44, 62, COL.text);
    for (let k = 0; k < 10; k++) { g.fillStyle = k < Math.round(this.s.volume * 10) ? '#4a6ad0' : '#c8d0e8'; g.fillRect(150 + k * 14, 60, 11, 10); }
    text(g, 'Son', 44, 88, COL.text); text(g, this.s.muted ? 'COUPÉ' : 'ACTIVÉ', 150, 88, this.s.muted ? '#c83a3a' : '#2a8a4a');
    text(g, 'Retour', 44, 114, COL.text);
    cursor(g, 30, [62, 88, 114][this.i]);
    smallText(g, 'Gauche/droite : régler', W / 2, 136, COL.dim, 'center');
  }
}
