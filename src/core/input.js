// Entrées unifiées : clavier + boutons tactiles -> up/down/left/right, a (valider), b (retour/courir), start (menu)
const KEYMAP = {
  arrowup: 'up', w: 'up', z: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', q: 'left',
  arrowright: 'right', d: 'right',
  ' ': 'a', enter: 'a', e: 'a', j: 'a', x: 'b', backspace: 'b', shift: 'b', k: 'b',
  escape: 'start', tab: 'start', m: 'start',
};
const CODEMAP = { KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right' };
const DIRS = ['up', 'down', 'left', 'right'];

const held = new Map();      // nom -> temps maintenu
const edge = new Set();      // appuis détectés cette frame (avec répétition pour les directions)
const pendingRelease = new Set();
let lastRepeat = {};

export const input = {
  press(n) { if (!held.has(n)) { held.set(n, 0); edge.add(n); lastRepeat[n] = 0; } pendingRelease.delete(n); },
  release(n) { if (held.has(n)) pendingRelease.add(n); },
  isDown(n) { return held.has(n); },
  pressed(n) { return edge.has(n); },
  // direction maintenue (priorité à la plus récente non gérée : simple ordre fixe)
  heldDir() { for (const d of DIRS) if (held.has(d)) return d; return null; },
  anyPressed() { return edge.size > 0; },
  // appelé en début de frame
  update(dt) {
    for (const [n, t] of held) {
      held.set(n, t + dt);
      if (DIRS.includes(n) && t > 0.38) {          // répétition pour les menus
        const k = Math.floor((t - 0.38) / 0.11);
        if (k > lastRepeat[n]) { lastRepeat[n] = k; edge.add(n); }
      }
    }
  },
  // appelé en fin de frame
  endFrame() {
    edge.clear();
    for (const n of pendingRelease) held.delete(n);
    pendingRelease.clear();
  },
  releaseAll() { held.clear(); edge.clear(); pendingRelease.clear(); },
  init() {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = CODEMAP[e.code] || KEYMAP[e.key.toLowerCase()];
      if (!n) return;
      e.preventDefault();
      if (!e.repeat) this.press(n);
    });
    window.addEventListener('keyup', (e) => {
      const n = CODEMAP[e.code] || KEYMAP[e.key.toLowerCase()];
      if (n) this.release(n);
    });
    window.addEventListener('blur', () => this.releaseAll());
  },
};
