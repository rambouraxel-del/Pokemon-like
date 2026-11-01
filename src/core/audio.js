// Audio synthétisé (WebAudio) : musiques en boucle + effets. Aucun fichier externe.
const NOTE_IDX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(note) {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) return 0;
  return 440 * Math.pow(2, (NOTE_IDX[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69) / 12);
}

// Chaque piste : bpm, lead/bass (1 jeton = 1 double-croche ; "." prolonge, "-" silence), drums (k=grosse caisse, s=caisse claire, h=charley)
export const TRACKS = {
  title: {
    bpm: 84, leadWave: 'triangle', leadVol: 0.5,
    lead: 'E5 . . . G5 . . . A5 . . . G5 . E5 . D5 . . . E5 . . . C5 . . . - . . . E5 . . . G5 . . . B5 . . . A5 . G5 . A5 . . . G5 . . . E5 . . . - . . .',
    bass: 'C3 . . . . . . . G2 . . . . . . . A2 . . . . . . . E2 . . . . . . . C3 . . . . . . . G2 . . . . . . . F2 . . . . . . . G2 . . . . . . .',
    drums: '',
  },
  village: {
    bpm: 112, leadWave: 'square', leadVol: 0.22,
    lead: 'G4 . A4 . B4 . D5 . C5 . . . B4 . A4 . G4 . A4 . B4 . G4 . E4 . . . - . . . A4 . B4 . C5 . E5 . D5 . . . C5 . B4 . A4 . B4 . G4 . A4 . G4 . . . - . . .',
    bass: 'G2 . . . D3 . . . G2 . . . D3 . . . E2 . . . B2 . . . E2 . . . B2 . . . A2 . . . E3 . . . A2 . . . E3 . . . D3 . . . A2 . . . D3 . . . A2 . . .',
    drums: 'k . h . s . h . k . h . s . h h',
  },
  forest: {
    bpm: 98, leadWave: 'triangle', leadVol: 0.45,
    lead: 'A4 . . C5 . . E5 . D5 . . . C5 . . . B4 . . D5 . . F5 . E5 . . . - . . . A4 . . C5 . . E5 . G5 . . . F5 . E5 . D5 . . . C5 . . . A4 . . . - . . .',
    bass: 'A2 . . . . . E3 . A2 . . . . . E3 . F2 . . . . . C3 . F2 . . . . . C3 . G2 . . . . . D3 . G2 . . . . . D3 . E2 . . . . . B2 . E2 . . . . . B2 .',
    drums: 'k . . . h . . . s . . . h . h .',
  },
  ruins: {
    bpm: 76, leadWave: 'sawtooth', leadVol: 0.12,
    lead: 'D4 . . . . . F4 . . . A4 . . . . . G4 . . . . . F4 . . . E4 . . . - . . . D4 . . . . . F4 . . . A4 . . . C5 . . . . . B4 . . . A4 . . . - . . .',
    bass: 'D2 . . . . . . . D2 . . . A2 . . . Bb2 . . . . . . . Bb2 . . . F2 . . . C2 . . . . . . . C2 . . . G2 . . . A2 . . . . . . . A2 . . . E2 . . .'.replace(/Bb/g, 'A#'),
    drums: 'k . . . . . . . . . h . . . . .',
  },
  battle: {
    bpm: 148, leadWave: 'square', leadVol: 0.2,
    lead: 'E5 . E5 G5 . E5 . D5 E5 . E5 G5 . A5 . G5 D5 . D5 F5 . D5 . C5 D5 . D5 F5 . A5 . F5 C5 . C5 E5 . C5 . B4 C5 . E5 G5 . B5 . A5',
    bass: 'E2 E2 . E2 E2 . E2 . E2 E2 . E2 E2 . E2 . D2 D2 . D2 D2 . D2 . D2 D2 . D2 D2 . D2 . C2 C2 . C2 C2 . C2 . C2 C2 . C2 C2 . C2 . B1 B1 . B1 B1 . B1 .',
    drums: 'k h s h k h s h k k s h k h s s',
  },
  boss: {
    bpm: 164, leadWave: 'sawtooth', leadVol: 0.14,
    lead: 'A4 . A4 C5 . A4 . E5 . D5 . C5 . B4 . A4 G#4 . G#4 B4 . G#4 . D5 . C5 . B4 . A4 . G#4 A4 . A4 C5 . E5 . A5 . G5 . E5 . C5 . E5 F5 . E5 D5 . C5 . B4 . E5 . G#4 . B4 .',
    bass: 'A2 A2 . A2 A2 . A2 A2 A2 A2 . A2 A2 . A2 A2 E2 E2 . E2 E2 . E2 E2 E2 E2 . E2 E2 . E2 E2 F2 F2 . F2 F2 . F2 F2 D2 D2 . D2 D2 . D2 D2 E2 E2 . E2 E2 . E2 E2 E2 E2 E2 E2 E2 E2 E2 E2',
    drums: 'k h k h s h k h k h k k s h s s',
  },
  inside: {
    bpm: 100, leadWave: 'triangle', leadVol: 0.4,
    lead: 'C5 . E5 . G5 . E5 . F5 . A5 . G5 . E5 . D5 . F5 . A5 . F5 . E5 . G5 . C5 . . . - . . .',
    bass: 'C3 . . . G2 . . . F2 . . . C3 . . . D3 . . . A2 . . . G2 . . . C3 . . . . . . .',
    drums: '',
  },
  ending: {
    bpm: 90, leadWave: 'triangle', leadVol: 0.5,
    lead: 'C5 . . . E5 . . . G5 . . . C6 . . . B5 . . . G5 . . . E5 . . . G5 . . . A5 . . . C6 . . . E6 . . . D6 . . . C6 . . . G5 . . . C6 . . . . . . .',
    bass: 'C3 . . . . . . . G2 . . . . . . . A2 . . . . . . . E2 . . . . . . . F2 . . . . . . . C3 . . . . . . . G2 . . . . . . . C3 . . . . . . .',
    drums: '',
  },
};

class AudioEngine {
  constructor() {
    this.ctx = null; this.master = null; this.musicBus = null; this.sfxBus = null;
    this.volume = 0.7; this.muted = false;
    this.current = null; this.trackName = null; this.nextTime = 0; this.step = 0; this.timer = null;
    this.parsed = {};
  }
  // à appeler depuis un geste utilisateur (exigence des navigateurs / iOS)
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.5;
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.8;
      this.musicBus.connect(this.master); this.sfxBus.connect(this.master); this.master.connect(this.ctx.destination);
      this.applyVolume();
      this.noiseBuf = this.makeNoise();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.wantTrack !== undefined) { const t = this.wantTrack; this.wantTrack = undefined; this.trackName = null; this.music(t); }
  }
  makeNoise() {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  applyVolume() { if (this.master) this.master.gain.value = this.muted ? 0 : this.volume; }
  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); this.applyVolume(); }
  setMuted(m) { this.muted = !!m; this.applyVolume(); }

  parse(name) {
    if (this.parsed[name]) return this.parsed[name];
    const tr = TRACKS[name];
    const tok = (s) => (s ? s.trim().split(/\s+/) : []);
    const p = { ...tr, leadT: tok(tr.lead), bassT: tok(tr.bass), drumT: tok(tr.drums) };
    p.len = Math.max(p.leadT.length, p.bassT.length, p.drumT.length);
    this.parsed[name] = p;
    return p;
  }
  music(name) {
    if (!this.ctx) { this.wantTrack = name; return; }        // lancée au premier geste utilisateur (init)
    if (name === this.trackName && this.timer) return;
    this.trackName = name;
    clearInterval(this.timer); this.timer = null;
    if (!name) { this.current = null; return; }
    this.current = this.parse(name);
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 40);
  }
  schedule() {
    if (!this.current || !this.ctx) return;
    const p = this.current;
    const stepDur = 60 / p.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      const i = this.step % p.len;
      const lt = p.leadT[i % p.leadT.length], bt = p.bassT[i % p.bassT.length];
      if (p.leadT.length && lt && lt !== '.' && lt !== '-') this.note(lt, this.nextTime, this.holdLen(p.leadT, i, stepDur), p.leadWave, p.leadVol, this.musicBus);
      if (p.bassT.length && bt && bt !== '.' && bt !== '-') this.note(bt, this.nextTime, this.holdLen(p.bassT, i, stepDur), 'triangle', 0.5, this.musicBus);
      if (p.drumT.length) {
        const d = p.drumT[i % p.drumT.length];
        if (d === 'k') this.drum('k', this.nextTime); else if (d === 's') this.drum('s', this.nextTime); else if (d === 'h') this.drum('h', this.nextTime);
      }
      this.nextTime += stepDur; this.step++;
    }
  }
  holdLen(tokens, i, stepDur) {
    let n = 1;
    for (let j = i + 1; j < tokens.length && tokens[j] === '.'; j++) n++;
    return Math.min(n, 8) * stepDur * 0.95;
  }
  note(name, t, dur, wave, vol, bus) {
    const f = freq(name); if (!f) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = wave; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + Math.min(dur, 0.25));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.08);
  }
  drum(kind, t) {
    const c = this.ctx;
    if (kind === 'k') {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.17);
    } else {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = kind === 'h' ? 7000 : 1800;
      const g = c.createGain();
      g.gain.setValueAtTime(kind === 'h' ? 0.12 : 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'h' ? 0.04 : 0.12));
      s.connect(f); f.connect(g); g.connect(this.musicBus); s.start(t); s.stop(t + 0.15);
    }
  }
  // --- effets sonores ---
  tone(f0, f1, dur, wave = 'square', vol = 0.25, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = wave; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, vol = 0.3, hp = 500, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hp;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus); s.start(t); s.stop(t + dur + 0.02);
  }
  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'select': this.tone(660, 660, 0.05, 'square', 0.12); break;
      case 'confirm': this.tone(520, 780, 0.09, 'square', 0.16); break;
      case 'back': this.tone(500, 300, 0.09, 'square', 0.14); break;
      case 'error': this.tone(180, 140, 0.18, 'sawtooth', 0.18); break;
      case 'text': this.tone(900, 900, 0.02, 'square', 0.04); break;
      case 'door': this.tone(300, 150, 0.15, 'triangle', 0.3); this.noise(0.1, 0.1, 300); break;
      case 'bump': this.tone(120, 90, 0.05, 'square', 0.1); break;
      case 'encounter': for (let i = 0; i < 6; i++) this.tone(300 + i * 90, 340 + i * 90, 0.08, 'square', 0.14, i * 0.07); break;
      case 'hit': this.noise(0.12, 0.45, 900); this.tone(220, 80, 0.12, 'square', 0.25); break;
      case 'super': this.noise(0.2, 0.55, 1200); this.tone(400, 90, 0.2, 'sawtooth', 0.3); this.tone(800, 200, 0.1, 'square', 0.2, 0.05); break;
      case 'weak': this.noise(0.08, 0.2, 500); this.tone(150, 100, 0.1, 'square', 0.12); break;
      case 'miss': this.tone(500, 250, 0.2, 'triangle', 0.15); break;
      case 'buff': for (let i = 0; i < 3; i++) this.tone(400 + i * 200, 500 + i * 200, 0.08, 'triangle', 0.2, i * 0.07); break;
      case 'debuff': for (let i = 0; i < 3; i++) this.tone(800 - i * 200, 700 - i * 200, 0.08, 'triangle', 0.2, i * 0.07); break;
      case 'heal': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.12, 'triangle', 0.25, i * 0.09)); break;
      case 'throw': this.tone(300, 900, 0.3, 'triangle', 0.18); break;
      case 'shake': this.tone(260, 200, 0.1, 'square', 0.2); this.noise(0.05, 0.2, 2000); break;
      case 'catch': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, f, 0.12, 'square', 0.18, i * 0.1)); break;
      case 'break': this.noise(0.25, 0.4, 1500); this.tone(600, 150, 0.25, 'sawtooth', 0.2); break;
      case 'levelup': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.14, 'square', 0.17, i * 0.1)); break;
      case 'faint': this.tone(500, 60, 0.6, 'sawtooth', 0.25); break;
      case 'buy': this.tone(900, 1200, 0.07, 'square', 0.15); this.tone(1200, 1500, 0.09, 'square', 0.15, 0.08); break;
      case 'save': [660, 880].forEach((f, i) => this.tone(f, f, 0.1, 'triangle', 0.2, i * 0.1)); break;
      case 'win': [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.14, 'square', 0.17, i * 0.12)); break;
      case 'flash': this.tone(1200, 200, 0.4, 'sawtooth', 0.2); break;
      case 'beacon': [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.5, 'triangle', 0.22, i * 0.18)); break;
      default: break;
    }
  }
}
export const audio = new AudioEngine();
