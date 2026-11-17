// shots.js — deterministic screenshot staging. Every frame is produced by forward-simulating the
// real rules with a fixed-step autopilot; nothing is hand-drawn or faked.

import { STEP } from './config.js';
import { resetWorld, stepWorld, SCREEN_TITLE, SCREEN_PLAY } from './world.js';

function pilot(world, mode) {
  const lead = world.flock.lead;
  let aimX = 640, aimY = 360;
  let best = null, bd = Infinity;
  for (const g of world.gates) {
    if (g.claimed) continue;
    const d = (g.x - lead.x) ** 2 + (g.y - lead.y) ** 2;
    if (d < bd) { bd = d; best = g; }
  }

  if (mode === 'reckless' && world.wave >= 1) {
    aimX = 120 + Math.sin(world.time * 0.5) * 40;
    aimY = 616 + Math.cos(world.time * 0.5) * 40;
  } else if (mode === 'play' && world.wave >= 2) {
    // From sky 3 on, orbit the next gate until a hawk shows up, then cut straight through
    // it so the captured frame holds the claim burst AND a live telegraph together.
    if (hasThreat(world) && best) {
      aimX = best.x;
      aimY = best.y;
    } else if (best) {
      const a = world.time * 2.2;
      aimX = best.x + Math.cos(a) * 130;
      aimY = best.y + Math.sin(a) * 92;
    } else {
      aimX = 640 + Math.cos(world.time) * 260;
      aimY = 360 + Math.sin(world.time) * 160;
    }
  } else if (best) {
    aimX = best.x;
    aimY = best.y;
  } else {
    aimX = 640 + Math.cos(world.time) * 260;
    aimY = 360 + Math.sin(world.time) * 160;
  }

  let dazzle = false;
  if (mode !== 'reckless' && world.dazzleCd <= 0) {
    for (const h of world.hawkState.hawks) {
      if (h.state === 'dive' && Math.hypot(h.tx - lead.x, h.ty - lead.y) < 230) {
        dazzle = true;
        break;
      }
    }
  }
  return { aimX, aimY, dazzle, start: false, pause: false, restart: false, mute: false };
}

function hasThreat(world) {
  return world.hawkState.hawks.some(h => h.state === 'telegraph' || h.state === 'dive');
}

export function stageShot(name, world) {
  const seed = world.seed || 7;
  resetWorld(world, seed);

  if (name === 'title') {
    world.screen = SCREEN_TITLE;
    for (let i = 0; i < 360; i++) stepWorld(world, STEP, {}, null);
    return { screen: world.screen };
  }

  world.screen = SCREEN_PLAY;

  if (name === 'win') {
    for (let i = 0; i < 12960 && world.screen === SCREEN_PLAY; i++) {
      stepWorld(world, STEP, pilot(world, 'skilled'), null);
    }
    return { screen: world.screen };
  }

  if (name === 'lose') {
    for (let i = 0; i < 12960 && world.screen === SCREEN_PLAY; i++) {
      stepWorld(world, STEP, pilot(world, 'reckless'), null);
    }
    return { screen: world.screen };
  }

  // Default: a mid-flight action frame in sky 3 or 4, just after a gate claim.
  let lastClaim = 0;
  let seen = 0;
  for (let i = 0; i < 12960 && world.screen === SCREEN_PLAY; i++) {
    stepWorld(world, STEP, pilot(world, 'play'), null);
    if (world.gatesClaimed !== seen) { seen = world.gatesClaimed; lastClaim = i; }
    if (world.wave >= 2 && world.combo >= 4 && i - lastClaim <= 9 && hasThreat(world)) break;
    if (world.wave >= 3 && i - lastClaim <= 9) break;
  }
  return { screen: world.screen };
}
