export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (n) => Math.floor(Math.random() * n);          // 0..n-1
export const randRange = (a, b) => a + rand(b - a + 1);            // a..b inclus
export const chance = (p) => Math.random() < p;
export const pick = (arr) => arr[rand(arr.length)];
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
// hash déterministe pour variations de décor
export function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}
export const deepCopy = (o) => JSON.parse(JSON.stringify(o));
export const DIRS = {
  up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 },
};
export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
