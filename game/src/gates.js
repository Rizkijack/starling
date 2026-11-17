// gates.js — luminous sky-gates: placement, gentle drift, and claim detection. DOM-free.

import { CANVAS_W, CANVAS_H, WAVES } from './config.js';
import { GATE_HUES } from './palette.js';
import { randRange } from './rng.js';

const GATE_R = 54;

export function createGatesForWave(waveIndex, rng) {
  const wave = WAVES[waveIndex] || WAVES[WAVES.length - 1];
  let start = 0;
  for (let i = 0; i < waveIndex; i++) start += WAVES[i].gates;
  const gates = [];
  for (let k = 0; k < wave.gates; k++) {
    const x = wave.gates === 1
      ? CANVAS_W * 0.66
      : CANVAS_W * (0.30 + 0.40 * (k / (wave.gates - 1)));
    const y = (k % 2 === 0 ? 0.36 : 0.62) * CANVAS_H + randRange(rng, -36, 36);
    gates.push({
      baseX: x, baseY: y, x, y,
      r: GATE_R,
      hue: GATE_HUES[(start + k) % GATE_HUES.length],
      number: start + k + 1,
      phase: rng() * Math.PI * 2,
      claimed: false, claimAnim: 0,
    });
  }
  return gates;
}

export function updateGates(gates, dt, t) {
  for (const g of gates) {
    g.x = g.baseX + Math.sin(t * 0.62 + g.phase) * 26;
    g.y = g.baseY + Math.cos(t * 0.47 + g.phase) * 18;
    if (g.claimAnim > 0) g.claimAnim = Math.max(0, g.claimAnim - dt * 1.6);
  }
}

export function tryClaim(gates, leadPos) {
  for (const g of gates) {
    if (g.claimed) continue;
    const dx = leadPos.x - g.x, dy = leadPos.y - g.y;
    if (dx * dx + dy * dy < (g.r + 8) * (g.r + 8)) {
      g.claimed = true;
      g.claimAnim = 1;
      return g;
    }
  }
  return null;
}
