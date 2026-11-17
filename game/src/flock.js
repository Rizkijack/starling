// flock.js — the murmuration. Boids (separation / alignment / cohesion) around a steered lead
// bird, with glowing trails, DAZZLE scatter, hawk snatches and regrowth. DOM-free.

import { BIRD_COUNT, CANVAS_W, CANVAS_H, DAZZLE_WINDOW } from './config.js';
import { randRange } from './rng.js';

const TRAIL_LEN = 5;
const NEIGHBOR_R2 = 46 * 46;
const SEPARATE_R2 = 19 * 19;
const MAX_SPEED = 330;
const MIN_SPEED = 70;

function makeBird(rng, x, y) {
  const a = rng() * Math.PI * 2;
  const s = randRange(rng, 40, 130);
  return {
    x, y,
    vx: Math.cos(a) * s, vy: Math.sin(a) * s,
    trail: [], tint: null, tintTime: 0,
  };
}

export function createFlock(rng) {
  const lead = {
    x: CANVAS_W * 0.42, y: CANVAS_H * 0.58,
    vx: 80, vy: 0, trail: [],
  };
  const birds = [];
  for (let i = 0; i < BIRD_COUNT; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * 95;
    birds.push(makeBird(rng, lead.x + Math.cos(a) * r, lead.y + Math.sin(a) * r));
  }
  return { birds, lead, dazzleWindow: 0, dazzlePulse: 0, rng };
}

export function flockCentroid(flock) {
  const b = flock.birds;
  if (!b.length) return { x: flock.lead.x, y: flock.lead.y };
  let x = 0, y = 0;
  for (let i = 0; i < b.length; i++) { x += b[i].x; y += b[i].y; }
  return { x: x / b.length, y: y / b.length };
}

function clampToField(body) {
  const m = 26;
  if (body.x < m) { body.x = m; body.vx = Math.abs(body.vx) * 0.6; }
  if (body.x > CANVAS_W - m) { body.x = CANVAS_W - m; body.vx = -Math.abs(body.vx) * 0.6; }
  if (body.y < m) { body.y = m; body.vy = Math.abs(body.vy) * 0.6; }
  if (body.y > CANVAS_H - m) { body.y = CANVAS_H - m; body.vy = -Math.abs(body.vy) * 0.6; }
}

function pushTrail(body) {
  body.trail.push({ x: body.x, y: body.y });
  if (body.trail.length > TRAIL_LEN) body.trail.shift();
}

export function updateFlock(flock, dt, aim) {
  const rng = flock.rng;

  // The lead bird eases toward the aim point, with a speed that falls off up close.
  const lead = flock.lead;
  const ldx = aim.x - lead.x, ldy = aim.y - lead.y;
  const ld = Math.hypot(ldx, ldy) || 1;
  const want = Math.min(360, ld * 2.6);
  const dvx = (ldx / ld) * want, dvy = (ldy / ld) * want;
  const ease = Math.min(1, dt * 6.5);
  lead.vx += (dvx - lead.vx) * ease;
  lead.vy += (dvy - lead.vy) * ease;
  lead.x += lead.vx * dt;
  lead.y += lead.vy * dt;
  clampToField(lead);
  pushTrail(lead);

  // Aim the flock at a point just behind the lead so it streams rather than piles up.
  const ax = lead.x - lead.vx * 0.16;
  const ay = lead.y - lead.vy * 0.16;

  const birds = flock.birds;
  for (let i = 0; i < birds.length; i++) {
    const b = birds[i];
    let sx = 0, sy = 0, axSum = 0, aySum = 0, cx = 0, cy = 0, n = 0;

    for (let j = 0; j < birds.length; j++) {
      if (i === j) continue;
      const o = birds[j];
      const dx = o.x - b.x, dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > NEIGHBOR_R2 || d2 < 0.0001) continue;
      axSum += o.vx; aySum += o.vy;
      cx += o.x; cy += o.y;
      n++;
      if (d2 < SEPARATE_R2) {
        const inv = 1 / d2;
        sx -= dx * inv; sy -= dy * inv;
      }
    }

    let fx = sx * 1400, fy = sy * 1400;
    if (n > 0) {
      fx += (axSum / n - b.vx) * 1.1 + (cx / n - b.x) * 0.9;
      fy += (aySum / n - b.vy) * 1.1 + (cy / n - b.y) * 0.9;
    }
    // Lead attraction, stronger the further a bird drifts.
    const tdx = ax - b.x, tdy = ay - b.y;
    const td = Math.hypot(tdx, tdy) || 1;
    const pull = Math.min(2.4, 0.35 + td / 260);
    fx += (tdx / td) * pull * 120;
    fy += (tdy / td) * pull * 120;
    // A whisper of wander keeps the ribbon alive without breaking determinism.
    fx += (rng() - 0.5) * 34;
    fy += (rng() - 0.5) * 34;

    b.vx += fx * dt;
    b.vy += fy * dt;
    let sp = Math.hypot(b.vx, b.vy) || 1;
    if (sp > MAX_SPEED) { b.vx = b.vx / sp * MAX_SPEED; b.vy = b.vy / sp * MAX_SPEED; }
    else if (sp < MIN_SPEED) { b.vx = b.vx / sp * MIN_SPEED; b.vy = b.vy / sp * MIN_SPEED; }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    clampToField(b);
    pushTrail(b);
    if (b.tintTime > 0) {
      b.tintTime -= dt;
      if (b.tintTime <= 0) b.tint = null;
    }
  }

  if (flock.dazzleWindow > 0) flock.dazzleWindow = Math.max(0, flock.dazzleWindow - dt);
  if (flock.dazzlePulse > 0) flock.dazzlePulse = Math.max(0, flock.dazzlePulse - dt * 3.2);
}

export function dazzleFlock(flock, center, rng) {
  flock.dazzleWindow = DAZZLE_WINDOW;
  flock.dazzlePulse = 1;
  for (const b of flock.birds) {
    let dx = b.x - center.x, dy = b.y - center.y;
    let d = Math.hypot(dx, dy);
    if (d < 1) { dx = rng() - 0.5; dy = rng() - 0.5; d = Math.hypot(dx, dy) || 1; }
    const impulse = 250 + rng() * 130;
    b.vx += (dx / d) * impulse;
    b.vy += (dy / d) * impulse;
    b.x += (dx / d) * 10;
    b.y += (dy / d) * 10;
  }
}

export function snatchBirds(flock, n, center, rng) {
  const scored = flock.birds.map((b, index) => ({
    index, x: b.x, y: b.y, d: (b.x - center.x) ** 2 + (b.y - center.y) ** 2,
  }));
  scored.sort((a, b) => a.d - b.d);
  const take = scored.slice(0, Math.min(n, scored.length));
  const taken = new Set(take.map(t => t.index));
  flock.birds = flock.birds.filter((_, i) => !taken.has(i));
  return take.map(t => ({ x: t.x + (rng() - 0.5) * 8, y: t.y + (rng() - 0.5) * 8 }));
}

export function regrowFlock(flock, n, rng) {
  const lead = flock.lead;
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const r = randRange(rng, 20, 70);
    flock.birds.push(makeBird(rng, lead.x + Math.cos(a) * r, lead.y + Math.sin(a) * r));
  }
}

export function tintFlock(flock, hex, seconds) {
  for (let i = 0; i < flock.birds.length; i++) {
    if (i % 3 === 0) {
      flock.birds[i].tint = hex;
      flock.birds[i].tintTime = seconds;
    }
  }
}
