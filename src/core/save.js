import { SAVE_KEY, SAVE_VERSION } from '../config.js';

// Migrations : ajouter { from: n, to: n+1, run(data) } quand le format change.
const MIGRATIONS = [];

export function migrate(data) {
  let d = data;
  for (const m of MIGRATIONS) if (d.version === m.from) { d = m.run(d); d.version = m.to; }
  return d;
}
export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}
export function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = migrate(JSON.parse(raw));
    if (d.version !== SAVE_VERSION) return null;
    return d;
  } catch { return null; }
}
export function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION, savedAt: Date.now() })); return true; } catch { return false; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
// Réglages (volume...) hors sauvegarde de progression
export function loadSettings() {
  try { return JSON.parse(localStorage.getItem('lumina_settings')) || {}; } catch { return {}; }
}
export function saveSettings(s) { try { localStorage.setItem('lumina_settings', JSON.stringify(s)); } catch { /* ignore */ } }
