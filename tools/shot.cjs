// usage: node tools/shot.cjs <url> <out.png> [waitMs] [w] [h]   (playwright global)
const { chromium } = require('playwright');
(async () => {
  const [url, out, wait = '800', w = '960', h = '560'] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()); });
  p.on('pageerror', (e) => console.log('pageerror:', e.message));
  await p.goto(url); await p.waitForTimeout(+wait); await p.screenshot({ path: out }); await b.close();
})();
