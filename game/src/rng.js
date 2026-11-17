// rng.js — seeded pseudo-random numbers so any screenshot seed replays exactly.
// No Math.random / Date.now: shot frames must be byte-identical across captures.

export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(rng, a, b) {
  return a + (b - a) * rng();
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}
