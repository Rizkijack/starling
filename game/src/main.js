// main.js — boot, fixed-step loop, screen transitions and the one-frame shot-mode capture.

import { STEP } from './config.js';
import { createWorld, resetWorld, stepWorld } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

window.__frameErrs = [];

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = parseInt(params.get('seed') || '7', 10) || 7;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const world = createWorld();

world.seed = seed;
resetWorld(world, seed);

if (shotName) {
  // Exactly one genuine render, no requestAnimationFrame and no AudioContext.
  try {
    stageShot(shotName, world);
    render(ctx, world, world.time);
  } catch (e) {
    if (window.__frameErrs.length < 20) window.__frameErrs.push(String(e));
  }
  window.__shotReady = true;
} else {
  const input = createInput(canvas);
  const audio = createAudio();
  let unlocked = false;
  let previous = 0;
  let accumulator = 0;

  function frame(now) {
    try {
      if (!previous) previous = now;
      let elapsed = (now - previous) / 1000;
      previous = now;
      if (elapsed > 0.25) elapsed = 0.25;
      const controls = input.poll(elapsed);
      if (controls.gesture && !unlocked) { audio.unlock(); unlocked = true; }
      if (unlocked) audio.setMuted(world.muted);

      accumulator += elapsed;
      let first = true;
      while (accumulator >= STEP) {
        stepWorld(world, STEP, controls, audio);
        accumulator -= STEP;
        if (first) {
          // Edge-triggered actions fire once, not once per fixed step in a long frame.
          controls.dazzle = controls.start = controls.pause = false;
          controls.restart = controls.mute = false;
          first = false;
        }
      }
      render(ctx, world, world.time);
    } catch (e) {
      if (window.__frameErrs.length < 20) window.__frameErrs.push(String(e));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
