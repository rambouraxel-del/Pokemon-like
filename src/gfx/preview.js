import { creatureSprite } from './creatures.js';
import { SPECIES_LIST } from '../data/species.js';
const c = document.getElementById('c'), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
SPECIES_LIST.forEach((s, i) => {
  g.drawImage(creatureSprite(s.id, 'front'), (i % 4) * 128, Math.floor(i / 4) * 128 * 1, 128, 128);
  g.drawImage(creatureSprite(s.id, 'back'), 512 + (i % 4) * 100, Math.floor(i / 4) * 128, 96, 96);
});
window.__done = true;
