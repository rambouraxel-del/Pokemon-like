// Horloge de jeu : toutes les attentes/animations passent par ici (pause en arrière-plan, accélération pour les tests)
const waiters = [];
export const clock = {
  speed: 1,
  time: 0,
  // attend `sec` secondes de temps de jeu
  wait(sec) {
    return new Promise((res) => waiters.push({ t: this.time + sec, res }));
  },
  // anime de 0 à 1 sur `sec` secondes, appelle fn(t)
  async tween(sec, fn) {
    const start = this.time;
    for (;;) {
      await this.nextFrame();
      const t = Math.min(1, (this.time - start) / sec);
      fn(t);
      if (t >= 1) return;
    }
  },
  nextFrame() {
    return new Promise((res) => waiters.push({ t: -1, res, frame: true }));
  },
  tick(dt) {
    this.time += dt;
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      if (w.frame || w.t <= this.time) { waiters.splice(i, 1); w.res(); }
    }
  },
};
