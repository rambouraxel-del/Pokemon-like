import '@fontsource/press-start-2p/latin-400.css';
import { W, H } from './config.js';
import { input } from './core/input.js';
import { audio } from './core/audio.js';
import { clock } from './core/clock.js';
import { ui } from './core/ui.js';
import { scenes, fx } from './core/scenes.js';
import { G, START_POS } from './systems/game.js';
import { WorldScene } from './scenes/world.js';
import { TitleScene, IntroScene } from './scenes/title.js';
import { applySettings } from './scenes/options.js';
import { loadSettings, saveSettings } from './core/save.js';

const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;
const params = new URLSearchParams(location.search);
if (params.get('speed')) clock.speed = parseFloat(params.get('speed')) || 1;

// ---------- mise à l'échelle ----------
let touchMode = false;
function setTouch(on) { touchMode = on; document.body.classList.toggle('touch', on); resize(); }
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight, dpr = window.devicePixelRatio || 1;
  const portrait = vh > vw;
  let availW = vw, availH = vh;
  if (touchMode) { if (portrait) availH = vh - 190; else availW = vw - 2 * 142; }
  let s = Math.min(availW / W, availH / H);
  const sd = Math.floor(s * dpr) / dpr;
  s = (sd >= 1 && sd >= s * 0.85) ? sd : Math.max(0.5, Math.floor(s * 20) / 20);   // échelle entière si elle perd peu, sinon fractionnaire
  const w = Math.floor(W * s), h = Math.floor(H * s);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const stage = document.getElementById('stage');
  stage.style.left = Math.floor((vw - w) / 2) + 'px';
  stage.style.top = (portrait && touchMode ? Math.max(8, Math.floor((availH - h) / 2)) : Math.floor((vh - h) / 2)) + 'px';
  document.getElementById('rotate').hidden = !(touchMode && portrait && !rotateDismissed);
}
let rotateDismissed = false;
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
setTimeout(() => { rotateDismissed = true; resize(); }, 9000);
if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) setTouch(true); else resize();
window.addEventListener('touchstart', () => { if (!touchMode) setTouch(true); }, { passive: true });

// ---------- anti-scroll / zoom ----------
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
['gesturestart', 'gesturechange', 'gestureend', 'contextmenu'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => { const now = Date.now(); if (now - lastTouchEnd < 300) e.preventDefault(); lastTouchEnd = now; }, { passive: false });

// ---------- commandes tactiles ----------
function bindButton(el, name) {
  const down = (e) => { e.preventDefault(); audio.init(); input.press(name); el.classList.add('on'); el.setPointerCapture && el.setPointerCapture(e.pointerId); };
  const up = (e) => { e.preventDefault(); input.release(name); el.classList.remove('on'); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
bindButton(document.getElementById('btn-a'), 'a');
bindButton(document.getElementById('btn-b'), 'b');
bindButton(document.getElementById('btn-menu'), 'start');
(function dpad() {
  const el = document.getElementById('dpad'); const cells = [...el.querySelectorAll('.dp[data-dir]')];
  const active = new Map();
  const apply = (pid, dir) => { const prev = active.get(pid); if (prev === dir) return; if (prev) input.release(prev); if (dir) input.press(dir); active.set(pid, dir); cells.forEach((c) => c.classList.toggle('on', [...active.values()].includes(c.dataset.dir))); };
  const calc = (e) => { const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); if (Math.hypot(dx, dy) < r.width * 0.12) return null; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); };
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); el.setPointerCapture(e.pointerId); apply(e.pointerId, calc(e)); });
  el.addEventListener('pointermove', (e) => { if (active.has(e.pointerId)) apply(e.pointerId, calc(e)); });
  const end = (e) => { if (active.has(e.pointerId)) { apply(e.pointerId, null); active.delete(e.pointerId); } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();
// bouton son rapide
const sndBtn = document.getElementById('btn-sound');
function refreshSnd() { sndBtn.classList.toggle('off', audio.muted); }
sndBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); audio.init(); const s = { volume: 0.7, ...loadSettings() }; s.muted = !audio.muted; audio.setMuted(s.muted); saveSettings(s); refreshSnd(); });
// déblocage audio au premier geste
['pointerdown', 'keydown', 'touchend', 'click'].forEach((ev) => window.addEventListener(ev, () => audio.init(), { passive: true }));
canvas.addEventListener('pointerdown', (e) => { if (!touchMode) { /* clic souris : valider */ input.press('a'); setTimeout(() => input.release('a'), 60); } });

input.init();
applySettings(); refreshSnd();

// ---------- démarrage de partie ----------
let world = null;
async function startGame(mode) {
  await fx.out('fade', 0.4);
  if (mode === 'new') {
    await new Promise((res) => scenes.replace(new IntroScene(res)));
    await fx.out('fade', 0.4);
  }
  world = new WorldScene();
  scenes.replace(world);
  world.start();
  world.cameraSnap();
  G.playing = true;
  if (mode === 'new') G.save();
  await fx.in(0.5);
  if (!world.map.indoor) world.showBanner(world.map.name);
}
export function returnToTitle() { G.playing = false; ui.hide(); ui.menu = null; fx.clear(); scenes.replace(new TitleScene(startGame)); }
window.addEventListener('lumina:title', returnToTitle);

// ---------- boucle principale ----------
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  dt *= clock.speed;
  input.update(dt);
  clock.tick(dt);
  if (G.playing) G.s.playtime += dt / Math.max(1, clock.speed);
  const consumed = ui.update(dt);
  if (!consumed) scenes.update(dt);
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  scenes.render(g);
  ui.draw(g);
  fx.draw(g);
  input.endFrame();
  requestAnimationFrame(frame);
}

async function boot() {
  try { await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise((r) => setTimeout(r, 2500))]); } catch { /* ignore */ }
  scenes.push(new TitleScene(startGame));
  requestAnimationFrame(frame);
}
boot();

// aides pour les tests automatisés
import { MOVES } from './data/moves.js';
window.__movesData = MOVES; window.__movesName = (id) => MOVES[id].name;
import { makeCreature, maxHp } from './systems/creatures.js';
window.__maxHp = maxHp;
import { effectiveness } from './data/types.js';
import { SPECIES } from './data/species.js';
window.__types = { effectiveness, SPECIES };
window.__lumina = { mkc: makeCreature, mk: (sp, lv) => { const c = makeCreature(sp, lv); G.addCreature(c); return c; }, G, scenes, ui, clock, input, fx, audio, get world() { return world; }, START_POS };
