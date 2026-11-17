// input.js — keyboard + mouse to edge-triggered actions and a logical-coordinate aim point.

import { CANVAS_W, CANVAS_H } from './config.js';

export function createInput(canvas) {
  let aimX = CANVAS_W / 2, aimY = CANVAS_H / 2;
  let gesture = false;
  const down = new Set();
  const edge = { dazzle: false, start: false, pause: false, restart: false, mute: false };

  function point(e) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    aimX = (e.clientX - r.left) / r.width * CANVAS_W;
    aimY = (e.clientY - r.top) / r.height * CANVAS_H;
  }

  function onMove(e) { point(e); }
  function onDown(e) {
    gesture = true;
    point(e);
    if (e.button === 0) { edge.dazzle = true; edge.start = true; }
  }
  function onKey(e) {
    gesture = true;
    const k = e.key.toLowerCase();
    if (!e.repeat) {
      if (k === ' ' || k === 'spacebar') { edge.dazzle = true; edge.start = true; }
      else if (k === 'enter') edge.start = true;
      else if (k === 'p' || k === 'escape') edge.pause = true;
      else if (k === 'r') edge.restart = true;
      else if (k === 'm') edge.mute = true;
    }
    down.add(k);
    if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
  }
  function onUp(e) { down.delete(e.key.toLowerCase()); }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onUp);

  return {
    poll(dt = 1 / 60) {
      let dx = 0, dy = 0;
      if (down.has('a') || down.has('arrowleft')) dx -= 1;
      if (down.has('d') || down.has('arrowright')) dx += 1;
      if (down.has('w') || down.has('arrowup')) dy -= 1;
      if (down.has('s') || down.has('arrowdown')) dy += 1;
      if (dx || dy) {
        const n = Math.hypot(dx, dy);
        aimX = Math.max(24, Math.min(CANVAS_W - 24, aimX + dx / n * 540 * dt));
        aimY = Math.max(24, Math.min(CANVAS_H - 24, aimY + dy / n * 540 * dt));
      }
      const out = {
        aimX, aimY,
        dazzle: edge.dazzle, start: edge.start, pause: edge.pause,
        restart: edge.restart, mute: edge.mute, gesture,
      };
      edge.dazzle = edge.start = edge.pause = edge.restart = edge.mute = false;
      gesture = false;
      return out;
    },
    destroy() {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onUp);
    },
  };
}
