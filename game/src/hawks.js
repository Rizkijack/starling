// hawks.js — periodic dives with a visible telegraph cone, strike resolution and snatches.
// Calls snatchBirds from flock.js. DOM-free.

import {
  CANVAS_W, CANVAS_H, WAVES, HAWK_TELEGRAPH, HAWK_DIVE,
  HAWK_SPAWN_MIN, HAWK_SPAWN_MAX, GOAL_HAWK_SNATCH,
} from './config.js';
import { randRange } from './rng.js';
import { flockCentroid, snatchBirds } from './flock.js';

export function createHawks() {
  return { hawks: [], timer: 3.0 };
}

function spawnHawk(state, waveIndex, flock, rng) {
  const edge = Math.floor(rng() * 4);
  let x, y;
  if (edge === 0) { x = randRange(rng, 80, CANVAS_W - 80); y = -50; }
  else if (edge === 1) { x = CANVAS_W + 50; y = randRange(rng, 80, CANVAS_H - 80); }
  else if (edge === 2) { x = randRange(rng, 80, CANVAS_W - 80); y = CANVAS_H + 50; }
  else { x = -50; y = randRange(rng, 80, CANVAS_H - 80); }

  const c = flockCentroid(flock);
  const aimLead = rng() < 0.6;
  const tx = aimLead ? flock.lead.x + flock.lead.vx * 0.18 : c.x;
  const ty = aimLead ? flock.lead.y + flock.lead.vy * 0.18 : c.y;

  state.hawks.push({
    state: 'telegraph',
    sx: x, sy: y, x, y,
    tx: Math.max(60, Math.min(CANVAS_W - 60, tx)),
    ty: Math.max(60, Math.min(CANVAS_H - 60, ty)),
    vx: 0, vy: 0, angle: 0,
    timer: HAWK_TELEGRAPH,
  });
}

export function updateHawks(state, dt, waveIndex, flock, rng) {
  const result = { warned: false, struck: false, perfectDodge: false, snatches: [] };
  const maxHawks = WAVES[waveIndex] ? WAVES[waveIndex].hawks : 0;

  if (maxHawks > 0) {
    state.timer -= dt;
    const inFlight = state.hawks.filter(h => h.state !== 'recover').length;
    if (state.timer <= 0 && inFlight < maxHawks) {
      spawnHawk(state, waveIndex, flock, rng);
      state.timer = randRange(rng, HAWK_SPAWN_MIN, HAWK_SPAWN_MAX);
    }
  }

  const survivors = [];
  for (const h of state.hawks) {
    let keep = true;
    if (h.state === 'telegraph') {
      result.warned = true;
      h.timer -= dt;
      h.angle = Math.atan2(h.ty - h.sy, h.tx - h.sx);
      if (h.timer <= 0) {
        h.state = 'dive';
        h.timer = HAWK_DIVE;
        h.vx = (h.tx - h.sx) / HAWK_DIVE;
        h.vy = (h.ty - h.sy) / HAWK_DIVE;
      }
    } else if (h.state === 'dive') {
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.angle = Math.atan2(h.vy, h.vx);
      h.timer -= dt;
      if (h.timer <= 0) {
        result.struck = true;
        if (flock.dazzleWindow > 0) {
          result.perfectDodge = true;
        } else {
          result.snatches = snatchBirds(flock, GOAL_HAWK_SNATCH, { x: h.x, y: h.y }, rng);
        }
        h.state = 'recover';
        h.timer = 0.8;
      }
    } else {
      h.x += h.vx * dt * 0.7;
      h.y += h.vy * dt * 0.7;
      h.timer -= dt;
      if (h.timer <= 0 || h.x < -120 || h.x > CANVAS_W + 120 || h.y < -120 || h.y > CANVAS_H + 120) keep = false;
    }
    if (keep) survivors.push(h);
  }
  state.hawks = survivors;
  return result;
}

export function getTelegraphs(state) {
  return state.hawks
    .filter(h => h.state === 'telegraph')
    .map(h => ({
      x: h.sx, y: h.sy, tx: h.tx, ty: h.ty,
      progress: 1 - h.timer / HAWK_TELEGRAPH,
    }));
}
