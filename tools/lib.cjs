// Utilitaires de test navigateur (Playwright global)
const { chromium } = require('playwright');
exports.launch = async function (opts = {}) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 960, height: 576 }, hasTouch: !!opts.touch, isMobile: !!opts.mobile, deviceScaleFactor: opts.dpr || 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await p.goto(opts.url || 'http://localhost:5173/?speed=' + (opts.speed || 3));
  await p.waitForFunction(() => window.__lumina && window.__lumina.scenes.stack.length > 0);
  const api = {
    b, p, errors,
    press: async (k, ms = 60) => { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); await p.waitForTimeout(40); },
    hold: async (k, ms) => { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); },
    ev: (fn, arg) => p.evaluate(fn, arg),
    shot: (path) => p.screenshot({ path }),
    wait: (ms) => p.waitForTimeout(ms),
    until: (fn, arg, timeout = 15000) => p.waitForFunction(fn, arg, { timeout, polling: 50 }),
    close: () => b.close(),
  };
  return api;
};
