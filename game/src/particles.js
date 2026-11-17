// particles.js — one pooled list for drifting motes, gate sparks, hit bursts and DAZZLE glints.

import { CANVAS_W, CANVAS_H } from './config.js';
import { randRange, pick } from './rng.js';

const MOTE_COLORS = ['#FFF6E8', '#FFD9A0', '#BFE9FF', '#FFB0D8'];

export function createParticles(rng) {
  return { items: [], rng };
}

export function emitMotes(p, count) {
  for (let i = 0; i < count; i++) {
    p.items.push({
      kind: 'mote',
      x: randRange(p.rng, 0, CANVAS_W),
      y: randRange(p.rng, 0, CANVAS_H),
      vx: randRange(p.rng, -9, 9),
      vy: randRange(p.rng, -6, 6),
      life: Infinity, maxLife: Infinity,
      size: randRange(p.rng, 0.6, 2.1),
      color: pick(p.rng, MOTE_COLORS),
      drag: 0, glow: 6,
    });
  }
}

export function emitBurst(p, x, y, hex, count, opts = {}) {
  const speed = opts.speed ?? 210;
  const life = opts.life ?? 0.75;
  const size = opts.size ?? 2.6;
  const angle = opts.angle ?? 0;
  const spread = opts.spread ?? Math.PI * 2;
  const drag = opts.drag ?? 1.8;
  for (let i = 0; i < count; i++) {
    const a = angle + randRange(p.rng, -spread / 2, spread / 2);
    const s = randRange(p.rng, speed * 0.25, speed);
    const l = randRange(p.rng, life * 0.55, life);
    p.items.push({
      kind: 'spark', x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: l, maxLife: l,
      size: randRange(p.rng, size * 0.6, size * 1.4),
      color: hex, drag, glow: 8,
    });
  }
}

export function updateParticles(p, dt) {
  const out = [];
  for (const it of p.items) {
    if (it.kind === 'mote') {
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      if (it.x < 0) it.x += CANVAS_W;
      if (it.x > CANVAS_W) it.x -= CANVAS_W;
      if (it.y < 0) it.y += CANVAS_H;
      if (it.y > CANVAS_H) it.y -= CANVAS_H;
      out.push(it);
      continue;
    }
    it.x += it.vx * dt;
    it.y += it.vy * dt;
    const damp = 1 / (1 + it.drag * dt);
    it.vx *= damp;
    it.vy *= damp;
    it.life -= dt;
    if (it.life > 0) out.push(it);
  }
  p.items = out;
}
