// world.js — rules and state machine. Deliberately DOM-free so it imports in Node for smoke tests.

import {
  BIRD_COUNT, MIN_FLOCK, WAVES, WAVE_COUNT, SKY_BANNER_TIME,
  DAZZLE_CD, COMBO_WINDOW, GOAL_GATE_POINTS, GOAL_PERFECT_DODGE,
  GOAL_DAYLIGHT_RESTORE, GOAL_GATE_GATHER, GOAL_SURVIVOR_BONUS,
  GOAL_FLAWLESS_BONUS,
  EV_GATE, EV_DAZZLE, EV_HAWK_HIT, EV_PERFECT, EV_WAVE,
  EV_WIN, EV_LOSE, EV_START, EV_RESTART,
} from './config.js';
import { makeRng } from './rng.js';
import { WAVE_NAMES } from './palette.js';
import {
  createFlock, updateFlock, dazzleFlock, regrowFlock, tintFlock,
} from './flock.js';
import { createGatesForWave, updateGates, tryClaim } from './gates.js';
import { createHawks, updateHawks } from './hawks.js';
import {
  createParticles, emitMotes, emitBurst, updateParticles,
} from './particles.js';

export const SCREEN_TITLE = 'TITLE';
export const SCREEN_PLAY = 'PLAY';
export const SCREEN_PAUSE = 'PAUSE';
export const SCREEN_WIN = 'WIN';
export const SCREEN_LOSE = 'LOSE';

export function createWorld() {
  return {
    seed: 7,
    screen: SCREEN_TITLE,
    wave: 0, morph: 0,
    gatesClaimed: 0,
    score: 0, combo: 1, bestCombo: 1,
    flockCount: BIRD_COUNT,
    daylight: 100,
    time: 0, best: 0,
    hitFlash: 0, dazzleFlash: 0, perfectFlash: 0,
    dazzleCd: 0, lastScoreTime: -99,
    banner: 0, bannerText: '',
    loseReason: '',
    skyLossless: true,
    muted: false,
    rng: null, flock: null, gates: [], hawkState: null, particles: null,
  };
}

function addScore(world, amount) {
  world.score += amount;
  if (world.score > world.best) world.best = world.score;
}

function enterPlay(world, audio) {
  world.screen = SCREEN_PLAY;
  world.banner = SKY_BANNER_TIME;
  world.bannerText = 'SKY 1 — ' + WAVE_NAMES[0];
  if (audio) audio.setWave(0);
}

export function resetWorld(world, seed) {
  const s = (seed >>> 0) || 7;
  world.seed = s;
  world.rng = makeRng(s);
  world.screen = SCREEN_TITLE;
  world.wave = 0;
  world.morph = 0;
  world.gatesClaimed = 0;
  world.score = 0;
  world.combo = 1;
  world.bestCombo = 1;
  world.flockCount = BIRD_COUNT;
  world.daylight = 100;
  world.time = 0;
  world.hitFlash = 0;
  world.dazzleFlash = 0;
  world.perfectFlash = 0;
  world.dazzleCd = 0;
  world.lastScoreTime = -99;
  world.banner = 0;
  world.bannerText = '';
  world.loseReason = '';
  world.skyLossless = true;
  world.flock = createFlock(world.rng);
  world.gates = createGatesForWave(0, world.rng);
  world.hawkState = createHawks();
  world.particles = createParticles(world.rng);
  emitMotes(world.particles, 42);
  return world;
}

function advanceWave(world, audio) {
  if (world.skyLossless) addScore(world, GOAL_FLAWLESS_BONUS);
  world.skyLossless = true;
  world.wave += 1;
  if (world.wave >= WAVE_COUNT) {
    addScore(world, world.flock.birds.length * GOAL_SURVIVOR_BONUS);
    world.screen = SCREEN_WIN;
    world.banner = 0;
    if (audio) audio.win();
    return EV_WIN;
  }
  world.gates = createGatesForWave(world.wave, world.rng);
  world.morph = 1;
  world.banner = SKY_BANNER_TIME;
  world.bannerText = 'SKY ' + (world.wave + 1) + ' — ' + WAVE_NAMES[world.wave];
  if (audio) { audio.waveClear(); audio.setWave(world.wave); }
  return EV_WAVE;
}

function fallToNight(world, reason, audio) {
  world.screen = SCREEN_LOSE;
  world.loseReason = reason;
  world.banner = 0;
  if (world.score > world.best) world.best = world.score;
  if (audio) audio.lose();
  return EV_LOSE;
}

export function stepWorld(world, dt, controls, audio) {
  let ev = 0;
  const c = controls || {};
  world.time += dt;
  if (world.hitFlash > 0) world.hitFlash = Math.max(0, world.hitFlash - dt * 2.6);
  if (world.dazzleFlash > 0) world.dazzleFlash = Math.max(0, world.dazzleFlash - dt * 3);
  if (world.perfectFlash > 0) world.perfectFlash = Math.max(0, world.perfectFlash - dt * 2);
  if (world.morph > 0) world.morph = Math.max(0, world.morph - dt * 1.1);
  if (world.banner > 0) world.banner = Math.max(0, world.banner - dt);

  if (c.mute) {
    world.muted = !world.muted;
    if (audio) audio.setMuted(world.muted);
  }

  if (world.screen === SCREEN_TITLE) {
    if (c.start) {
      enterPlay(world, audio);
      ev |= EV_START;
    } else {
      const aim = {
        x: 640 + Math.cos(world.time * 0.62) * 330,
        y: 360 + Math.sin(world.time * 0.83) * 190,
      };
      updateFlock(world.flock, dt, aim);
      updateParticles(world.particles, dt);
    }
    return ev;
  }

  if (world.screen === SCREEN_PAUSE) {
    if (c.pause || c.start) world.screen = SCREEN_PLAY;
    return ev;
  }

  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) {
    if (c.restart) {
      resetWorld(world, world.seed);
      enterPlay(world, audio);
      ev |= EV_RESTART;
      return ev;
    }
    const aim = {
      x: 640 + Math.cos(world.time * 0.5) * 300,
      y: 360 + Math.sin(world.time * 0.7) * 170,
    };
    updateFlock(world.flock, dt, aim);
    updateParticles(world.particles, dt);
    return ev;
  }

  // ---- PLAY ----------------------------------------------------------------
  if (c.pause) {
    world.screen = SCREEN_PAUSE;
    return ev;
  }

  if (world.combo > 1 && world.time - world.lastScoreTime > COMBO_WINDOW) world.combo = 1;

  const dusk = WAVES[world.wave] ? WAVES[world.wave].duskRate : 2.05;
  world.daylight -= dusk * dt;
  if (world.daylight <= 0) {
    world.daylight = 0;
    return ev | fallToNight(world, 'NIGHTFALL', audio);
  }

  const aim = {
    x: Number.isFinite(c.aimX) ? c.aimX : 640,
    y: Number.isFinite(c.aimY) ? c.aimY : 360,
  };
  updateFlock(world.flock, dt, aim);

  world.dazzleCd = Math.max(0, world.dazzleCd - dt);
  if (c.dazzle && world.dazzleCd <= 0) {
    const lead = world.flock.lead;
    dazzleFlock(world.flock, { x: lead.x, y: lead.y }, world.rng);
    world.dazzleCd = DAZZLE_CD;
    world.dazzleFlash = 1;
    emitBurst(world.particles, lead.x, lead.y, '#DFFBFF', 26,
      { speed: 300, life: 0.55, size: 2.4, drag: 2.6 });
    if (audio) audio.dazzle();
    ev |= EV_DAZZLE;
  }

  updateGates(world.gates, dt, world.time);
  const claimed = tryClaim(world.gates, world.flock.lead);
  if (claimed) {
    addScore(world, GOAL_GATE_POINTS * world.combo);
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.lastScoreTime = world.time;
    world.gatesClaimed += 1;
    world.daylight = Math.min(100, world.daylight + GOAL_DAYLIGHT_RESTORE);
    tintFlock(world.flock, claimed.hue, 4);
    regrowFlock(world.flock, GOAL_GATE_GATHER, world.rng);
    world.flockCount = world.flock.birds.length;
    emitBurst(world.particles, claimed.x, claimed.y, claimed.hue, 30,
      { speed: 260, life: 0.95, size: 3.0 });
    emitBurst(world.particles, claimed.x, claimed.y, '#FFF6E8', 10,
      { speed: 150, life: 0.7, size: 2.0 });
    if (audio) audio.gateChime();
    ev |= EV_GATE;
    if (world.gates.every(g => g.claimed)) {
      ev |= advanceWave(world, audio);
      if (world.screen !== SCREEN_PLAY) return ev;
    }
  }

  const hawkRes = updateHawks(world.hawkState, dt, world.wave, world.flock, world.rng);
  if (audio) audio.hawkWarn(hawkRes.warned);
  if (hawkRes.perfectDodge) {
    addScore(world, GOAL_PERFECT_DODGE);
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.lastScoreTime = world.time;
    world.perfectFlash = 1;
    emitBurst(world.particles, world.flock.lead.x, world.flock.lead.y, '#BFFFFF', 22,
      { speed: 320, life: 0.5, size: 2.6 });
    if (audio) audio.gateChime();
    ev |= EV_PERFECT;
  }
  if (hawkRes.snatches.length) {
    for (const s of hawkRes.snatches) {
      emitBurst(world.particles, s.x, s.y, '#FF4D4D', 5,
        { speed: 150, life: 0.45, size: 2.2 });
    }
    world.flockCount = world.flock.birds.length;
    world.combo = 1;
    world.hitFlash = 1;
    world.skyLossless = false;
    if (audio) audio.hawkHit();
    ev |= EV_HAWK_HIT;
    if (world.flockCount < MIN_FLOCK) {
      return ev | fallToNight(world, 'FLOCK SCATTERED', audio);
    }
  }

  updateParticles(world.particles, dt);
  return ev;
}
