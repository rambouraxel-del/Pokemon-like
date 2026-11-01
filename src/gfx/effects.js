// Effets visuels de combat : chaque effet est une fonction de dessin (g, p∈[0,1], from, to) appelée à chaque frame.
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

function burst(g, x, y, p, color, n = 8, r = 22) {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.4, d = r * p, s = Math.max(1, 4 * (1 - p));
    g.fillRect(Math.round(x + Math.cos(a) * d - s / 2), Math.round(y + Math.sin(a) * d - s / 2), s, s);
  }
}
function star(g, x, y, r, color) {
  g.fillStyle = color; g.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.4 : r, a = (i / 8) * TAU - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.fill();
}

export const ATTACK_FX = {
  normal(g, p, a, b) {
    if (p < 0.25) return;
    const q = (p - 0.25) / 0.75; star(g, b.x, b.y, 24 * (1 - q * 0.6), q < 0.5 ? '#ffffff' : '#ffe880'); burst(g, b.x, b.y, q, '#fff6c0', 8, 26);
  },
  braise(g, p, a, b) {
    for (let i = 0; i < 5; i++) {
      const q = Math.max(0, Math.min(1, (p - i * 0.06) / 0.55)); if (q <= 0 || q >= 1) continue;
      const x = lerp(a.x, b.x, q), y = lerp(a.y, b.y, q) - Math.sin(q * Math.PI) * 14;
      g.fillStyle = '#ff5a1a'; g.beginPath(); g.arc(x, y, 6 - i * 0.6, 0, TAU); g.fill();
      g.fillStyle = '#ffd23c'; g.beginPath(); g.arc(x, y, 3.2 - i * 0.3, 0, TAU); g.fill();
    }
    if (p > 0.55) { const q = (p - 0.55) / 0.45; burst(g, b.x, b.y, q, '#ff7a2a', 12, 28); for (let i = 0; i < 6; i++) { g.fillStyle = '#ffd23c'; g.fillRect(Math.round(b.x - 14 + i * 5), Math.round(b.y - q * 26 - hash(i) * 8), 3, 3); } }
  },
  onde(g, p, a, b) {
    for (let i = 0; i < 7; i++) {
      const q = Math.max(0, Math.min(1, (p - i * 0.05) / 0.5)); if (q <= 0 || q >= 1) continue;
      const x = lerp(a.x, b.x, q), y = lerp(a.y, b.y, q) - Math.sin(q * Math.PI) * 18;
      g.fillStyle = '#5ab0ff'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); g.fillStyle = '#d8f0ff'; g.fillRect(Math.round(x - 1), Math.round(y - 2), 2, 2);
    }
    if (p > 0.5) { const q = (p - 0.5) / 0.5; g.strokeStyle = `rgba(120,200,255,${1 - q})`; g.lineWidth = 3; g.beginPath(); g.ellipse(b.x, b.y + 8, 10 + q * 28, 4 + q * 9, 0, 0, TAU); g.stroke(); burst(g, b.x, b.y, q, '#a8e0ff', 10, 24); }
  },
  flore(g, p, a, b) {
    for (let i = 0; i < 8; i++) {
      const q = Math.max(0, Math.min(1, (p - i * 0.04) / 0.6)); if (q <= 0 || q > 1) continue;
      const ang = q * 9 + i, x = lerp(a.x, b.x, q) + Math.cos(ang) * 10 * (1 - q), y = lerp(a.y, b.y, q) + Math.sin(ang) * 12 * (1 - q);
      g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = i % 2 ? '#7ae05a' : '#3ea04a'; g.fillRect(-4, -2, 8, 4); g.fillStyle = '#c8ffa0'; g.fillRect(-4, -1, 3, 1); g.restore();
    }
    if (p > 0.6) { const q = (p - 0.6) / 0.4; star(g, b.x, b.y, 18 * (1 - q * 0.5), '#b8f088'); burst(g, b.x, b.y, q, '#58b848', 8, 24); }
  },
  eclat(g, p, a, b) {
    const q = Math.min(1, p / 0.45);
    if (p < 0.8) {
      const x = lerp(a.x, b.x, q), y = lerp(a.y, b.y, q);
      g.strokeStyle = '#fff6a0'; g.lineWidth = 5; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(x, y); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(x, y); g.stroke();
    }
    if (p > 0.35) { const r = (p - 0.35) / 0.65; g.fillStyle = `rgba(255,250,200,${(1 - r) * 0.8})`; g.beginPath(); g.arc(b.x, b.y, 8 + r * 34, 0, TAU); g.fill(); burst(g, b.x, b.y, r, '#fff', 10, 30); }
  },
  ombre(g, p, a, b) {
    if (p < 0.5) for (let i = 0; i < 6; i++) { const ang = (i / 6) * TAU + p * 6, r = 40 * (1 - p / 0.5); g.fillStyle = i % 2 ? '#6a3ab0' : '#2a1850'; g.beginPath(); g.arc(b.x + Math.cos(ang) * r, b.y + Math.sin(ang) * r, 5, 0, TAU); g.fill(); }
    else { const q = (p - 0.5) / 0.5; g.strokeStyle = `rgba(200,160,255,${1 - q * 0.5})`; g.lineWidth = 3;
      for (let i = 0; i < 3; i++) { const o = i * 8 - 8, t = Math.min(1, Math.max(0, q * 1.6 - i * 0.25)); g.beginPath(); g.moveTo(b.x - 18 + o, b.y - 22); g.lineTo(b.x - 18 + o + 30 * t, b.y - 22 + 40 * t); g.stroke(); }
      g.fillStyle = `rgba(60,20,110,${0.4 * (1 - q)})`; g.beginPath(); g.arc(b.x, b.y, 34, 0, TAU); g.fill(); }
  },
  heal(g, p, a) {
    for (let i = 0; i < 9; i++) { const x = a.x - 24 + hash(i) * 48, y = a.y + 18 - p * 54 - hash(i + 9) * 14; g.fillStyle = i % 2 ? '#7aff9a' : '#d8ffe0'; g.fillRect(Math.round(x), Math.round(y), 3, 3); g.fillRect(Math.round(x) - 1, Math.round(y) + 1, 5, 1); g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 5); }
  },
  buff(g, p, a, b, o) {
    const col = o.color || '#ffd23c';
    for (let i = 0; i < 5; i++) { const x = a.x - 22 + i * 11, y = a.y + 14 - p * 40 - (i % 2) * 8; g.fillStyle = col; g.fillRect(Math.round(x) + 2, Math.round(y), 3, 8); g.fillRect(Math.round(x), Math.round(y) + 2, 7, 2); g.fillRect(Math.round(x) + 1, Math.round(y), 5, 2); }
  },
  debuff(g, p, a, b, o) {
    const col = o.color || '#8a8aff';
    for (let i = 0; i < 5; i++) { const x = b.x - 22 + i * 11, y = b.y - 20 + p * 36 + (i % 2) * 8; g.fillStyle = col; g.fillRect(Math.round(x) + 2, Math.round(y), 3, 8); g.fillRect(Math.round(x), Math.round(y) + 5, 7, 2); g.fillRect(Math.round(x) + 1, Math.round(y) + 6, 5, 2); }
  },
};
