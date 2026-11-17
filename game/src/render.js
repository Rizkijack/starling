// render.js — every pixel: five painted skies, the trailing murmuration, gates, hawks, HUD and
// the title / win / lose screens. System fonts only; all motion derives from world.time.

import { CANVAS_W as W, CANVAS_H as H, WAVES } from './config.js';
import { PALETTES, WAVE_NAMES, blendPalette, rgba } from './palette.js';
import { getTelegraphs } from './hawks.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSE,
} from './world.js';

const TAU = Math.PI * 2;
const GOLD = '#FFF2A8';
const ROSE = '#FF6E8A';

function paletteFor(world) {
  const cur = (WAVES[world.wave] || WAVES[WAVES.length - 1]).paletteKey;
  const from = world.wave > 0 ? WAVES[world.wave - 1].paletteKey : cur;
  if (world.morph > 0 && from !== cur) return blendPalette(from, cur, 1 - world.morph);
  return PALETTES[cur];
}

function tracked(ctx, text, x, y, spacing = 2, align = 'left') {
  const chars = Array.from(text);
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cx, y);
    cx += widths[i] + spacing;
  }
  ctx.textAlign = prevAlign;
  return total;
}

function panel(ctx, x, y, w, h, accent, alpha = 0.55) {
  ctx.fillStyle = 'rgba(11,8,32,' + alpha + ')';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, 3);
}

function keycap(ctx, x, y, w, h, label, accent) {
  ctx.fillStyle = 'rgba(6,4,18,0.8)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = accent;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Wordmark: the A is drawn as a bird chevron, the game's central image.
function wordmark(ctx, text, cx, y, spacing, grad) {
  const chars = Array.from(text);
  ctx.font = '900 104px system-ui, sans-serif';
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.fillStyle = grad;
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === 'A') {
      const mx = x + widths[i] / 2;
      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.shadowColor = ROSE;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(mx - 30, y + 8);
      ctx.lineTo(mx, y - 40);
      ctx.lineTo(mx + 30, y + 8);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillText(chars[i], x, y);
    }
    x += widths[i] + spacing;
  }
}

export function drawSky(ctx, world, t) {
  const p = paletteFor(world);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, p.skyTop);
  g.addColorStop(0.62, p.skyBottom);
  g.addColorStop(1, p.skyTop);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // A high, cool wash gives the top of every sky a little structure.
  const wash = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  wash.addColorStop(0, 'rgba(10,6,30,0.55)');
  wash.addColorStop(1, 'rgba(10,6,30,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H * 0.5);
}

export function drawSun(ctx, world, t) {
  const p = paletteFor(world);
  const sx = 886, sy = 436;
  const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 268);
  glow.addColorStop(0, rgba(p.sun, 0.95));
  glow.addColorStop(0.22, rgba(p.sun, 0.42));
  glow.addColorStop(1, rgba(p.sun, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 280, sy - 280, 560, 560);
  ctx.save();
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = rgba(p.sun, 0.26 - i * 0.07);
    ctx.beginPath();
    ctx.arc(sx, sy, 96 + i * 54 + Math.sin(t * 0.6 + i) * 3, 0, TAU);
    ctx.stroke();
  }
  const core = ctx.createRadialGradient(sx - 12, sy - 14, 2, sx, sy, 62);
  core.addColorStop(0, '#FFFFFF');
  core.addColorStop(0.4, p.sun);
  core.addColorStop(1, rgba(p.sun, 0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(sx, sy, 62, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawHills(ctx, world, t) {
  const p = paletteFor(world);
  const layers = [
    { base: 520, amp: 26, alpha: 0.20, speed: 0.10 },
    { base: 574, amp: 34, alpha: 0.28, speed: 0.16 },
    { base: 636, amp: 30, alpha: 0.36, speed: 0.24 },
    { base: 700, amp: 24, alpha: 0.46, speed: 0.34 },
  ];
  for (let li = 0; li < layers.length; li++) {
    const L = layers[li];
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 32) {
      const y = L.base
        + Math.sin(x * 0.006 + t * L.speed + li * 1.7) * L.amp
        + Math.sin(x * 0.017 - t * L.speed * 0.6) * L.amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = rgba(p.hill, L.alpha);
    ctx.fill();
  }
  ctx.save();
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 500 + i * 43 + Math.sin(t * 0.4 + i) * 3;
    ctx.strokeStyle = rgba(p.accent, 0.13 - i * 0.015);
    ctx.beginPath();
    ctx.moveTo(120 + i * 90, y);
    ctx.lineTo(420 + i * 130, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMotes(ctx, world, t) {
  if (!world.particles) return;
  ctx.save();
  ctx.shadowBlur = 0;
  for (const it of world.particles.items) {
    if (it.kind !== 'mote') continue;
    ctx.shadowColor = it.color;
    ctx.fillStyle = it.color;
    ctx.globalAlpha = 0.42 + 0.28 * Math.sin(t * 1.3 + it.x * 0.05);
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGates(ctx, world, t) {
  for (const g of world.gates) {
    const hue = g.claimed ? '#B7AECB' : g.hue;
    if (g.claimAnim > 0) {
      ctx.save();
      ctx.globalAlpha = g.claimAnim;
      ctx.strokeStyle = g.hue;
      ctx.lineWidth = 7;
      ctx.shadowColor = g.hue;
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r + (1 - g.claimAnim) * 155, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = g.claimed ? 0.20 : 1;
    ctx.strokeStyle = hue;
    ctx.lineWidth = 5;
    ctx.shadowColor = hue;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r - 10, 0, TAU);
    ctx.stroke();
    if (!g.claimed) {
      ctx.strokeStyle = hue;
      ctx.lineWidth = 3;
      for (let k = 0; k < 8; k++) {
        const a = t * 0.5 + k * TAU / 8;
        const c = Math.cos(a), s = Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(g.x + c * (g.r + 9), g.y + s * (g.r + 9));
        ctx.lineTo(g.x + c * (g.r + 21), g.y + s * (g.r + 21));
        ctx.stroke();
      }
      ctx.fillStyle = rgba(hue, 0.8);
      ctx.beginPath();
      const oa = t * 1.1;
      ctx.arc(g.x + Math.cos(oa) * (g.r - 10), g.y + Math.sin(oa) * (g.r - 10), 3.4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = g.claimed ? 'rgba(255,255,255,0.35)' : '#FFF6E8';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(g.number), g.x, g.y + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
}

export function drawHawks(ctx, world, t) {
  if (!world.hawkState) return;
  const tels = getTelegraphs(world.hawkState);
  ctx.save();
  for (const g of tels) {
    const dx = g.tx - g.x, dy = g.ty - g.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * 26, ny = dx / len * 26;
    ctx.fillStyle = 'rgba(255,77,77,' + (0.08 + g.progress * 0.14) + ')';
    ctx.strokeStyle = 'rgba(255,120,120,' + (0.28 + g.progress * 0.3) + ')';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.tx + nx, g.ty + ny);
    ctx.lineTo(g.tx - nx, g.ty - ny);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,90,90,' + (0.4 + g.progress * 0.5) + ')';
    ctx.beginPath();
    ctx.arc(g.tx, g.ty, 16 + (1 - g.progress) * 8, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.tx - 8, g.ty); ctx.lineTo(g.tx + 8, g.ty);
    ctx.moveTo(g.tx, g.ty - 8); ctx.lineTo(g.tx, g.ty + 8);
    ctx.stroke();
  }
  for (const h of world.hawkState.hawks) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    ctx.globalAlpha = h.state === 'telegraph' ? 0.55 + 0.35 * Math.sin(t * 12) : 1;
    ctx.shadowColor = '#FF4D4D';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#FF4D4D';
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(-9, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-9, 9);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8B1A2E';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-5, -3);
    ctx.lineTo(-5, 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,180,180,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-6, -5); ctx.lineTo(-18, -11);
    ctx.moveTo(-6, 5); ctx.lineTo(-18, 11);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawFlock(ctx, world, t) {
  const f = world.flock;
  if (!f) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Luminous ribbons: muted glow keeps the contact sheet readable without bloating the PNG.
  ctx.shadowBlur = 0;
  for (const b of f.birds) {
    if (b.trail.length < 2) continue;
    const col = b.tint || '#7BE8FF';
    ctx.shadowColor = col;
    ctx.strokeStyle = rgba(b.tint || '#FFF6E8', b.tint ? 0.34 : 0.26);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(b.trail[0].x, b.trail[0].y);
    for (let i = 1; i < b.trail.length; i++) ctx.lineTo(b.trail[i].x, b.trail[i].y);
    ctx.stroke();
  }
  ctx.shadowBlur = 2;
  for (const b of f.birds) {
    const ang = Math.atan2(b.vy, b.vx);
    const c = Math.cos(ang), s = Math.sin(ang);
    const col = b.tint || '#FFF6E8';
    ctx.strokeStyle = col;
    ctx.shadowColor = b.tint || '#7BE8FF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(b.x - c * 4 - s * 4.5, b.y - s * 4 + c * 4.5);
    ctx.lineTo(b.x + c * 3, b.y + s * 3);
    ctx.lineTo(b.x - c * 4 + s * 4.5, b.y - s * 4 - c * 4.5);
    ctx.stroke();
  }
  // The lead bird: gold halo, comet tail, a larger chevron.
  const lead = f.lead;
  const halo = ctx.createRadialGradient(lead.x, lead.y, 2, lead.x, lead.y, 28);
  halo.addColorStop(0, 'rgba(255,242,168,0.85)');
  halo.addColorStop(1, 'rgba(255,242,168,0)');
  ctx.shadowBlur = 0;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(lead.x, lead.y, 28, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(GOLD, 0.55);
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < lead.trail.length; i++) {
    const p = lead.trail[i];
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  const la = Math.atan2(lead.vy, lead.vx);
  const lc = Math.cos(la), ls = Math.sin(la);
  ctx.strokeStyle = GOLD;
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(lead.x - lc * 6 - ls * 7, lead.y - ls * 6 + lc * 7);
  ctx.lineTo(lead.x + lc * 5, lead.y + ls * 5);
  ctx.lineTo(lead.x - lc * 6 + ls * 7, lead.y - ls * 6 - lc * 7);
  ctx.stroke();

  if (f.dazzlePulse > 0) {
    const pulse = f.dazzlePulse;
    ctx.strokeStyle = 'rgba(210,255,255,' + (pulse * 0.85) + ')';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#DFFBFF';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(lead.x, lead.y, (1 - pulse) * 140 + 8, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const a = i * TAU / 24 + t * 0.6;
      const r0 = (1 - pulse) * 120 + 12;
      ctx.beginPath();
      ctx.moveTo(lead.x + Math.cos(a) * r0, lead.y + Math.sin(a) * r0);
      ctx.lineTo(lead.x + Math.cos(a) * (r0 + 14), lead.y + Math.sin(a) * (r0 + 14));
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawParticles(ctx, world, t) {
  if (!world.particles) return;
  ctx.save();
  for (const it of world.particles.items) {
    if (it.kind !== 'spark') continue;
    const a = Math.max(0, it.life / it.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = it.color;
    ctx.shadowColor = it.color;
    ctx.shadowBlur = it.glow;
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.size * (0.5 + a * 0.7), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawHud(ctx, world, t) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  panel(ctx, 22, 18, 202, 68, '#7BE8FF');
  ctx.fillStyle = 'rgba(190,225,240,0.75)';
  ctx.font = '700 11px system-ui, sans-serif';
  tracked(ctx, 'STARLINGS', 34, 40, 2);
  ctx.fillStyle = '#FFF6E8';
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText(String(world.flockCount).padStart(3, '0'), 32, 76);

  panel(ctx, 438, 18, 404, 62, GOLD);
  ctx.fillStyle = 'rgba(255,235,190,0.8)';
  ctx.font = '700 11px system-ui, sans-serif';
  tracked(ctx, 'DAYLIGHT', 450, 40, 2);
  const bx = 450, by = 50, bw = 332;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(bx, by, bw, 13);
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, ROSE);
  grad.addColorStop(0.55, GOLD);
  grad.addColorStop(1, '#FFF6C8');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, bw * Math.max(0, Math.min(1, world.daylight / 100)), 13);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + bw * i / 10, by);
    ctx.lineTo(bx + bw * i / 10, by + 13);
    ctx.stroke();
  }
  ctx.fillStyle = '#FFF6E8';
  ctx.font = '800 16px system-ui, sans-serif';
  tracked(ctx, String(Math.ceil(world.daylight)) + '%', bx + bw + 10, by + 12, 0, 'right');

  panel(ctx, 982, 18, 276, 68, ROSE);
  ctx.fillStyle = 'rgba(255,205,215,0.8)';
  ctx.font = '700 11px system-ui, sans-serif';
  tracked(ctx, 'SCORE', 994, 40, 2);
  ctx.fillStyle = '#FFF6E8';
  ctx.font = '800 28px system-ui, sans-serif';
  ctx.fillText(String(world.score).padStart(6, '0'), 992, 72);
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillStyle = world.combo >= 2 ? GOLD : 'rgba(255,255,255,0.4)';
  tracked(ctx, 'COMBO ×' + world.combo, 994, 86, 1);

  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  tracked(ctx, 'MOVE MOUSE / WASD · DAZZLE SPACE', 24, 696, 1);
  ctx.textAlign = 'right';
  tracked(ctx, 'M MUTE · P PAUSE', 1256, 696, 1);
  ctx.textAlign = 'left';

  if (world.banner > 0) {
    const a = Math.min(1, world.banner * 2.2);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD;
    ctx.font = '900 52px system-ui, sans-serif';
    tracked(ctx, world.bannerText, W / 2, 340, 4, 'center');
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  if (world.perfectFlash > 0) {
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, world.perfectFlash * 2);
    ctx.fillStyle = '#BFFFFF';
    ctx.font = '900 40px system-ui, sans-serif';
    tracked(ctx, 'PERFECT DODGE  +150', W / 2, 430, 3, 'center');
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function statCard(ctx, x, y, w, h, label, value, accent) {
  panel(ctx, x, y, w, h, accent, 0.62);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  tracked(ctx, label, x + w / 2, y + 34, 2, 'center');
  ctx.fillStyle = accent;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.fillText(value, x + w / 2, y + 88);
  ctx.textAlign = 'left';
}

export function drawTitleScreen(ctx, world, t) {
  const p = paletteFor(world);
  const vig = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 760);
  vig.addColorStop(0, 'rgba(9,5,26,0.18)');
  vig.addColorStop(1, 'rgba(9,5,26,0.78)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = p.accent;
  ctx.font = '700 13px system-ui, sans-serif';
  tracked(ctx, 'A MURMURATION ARCADE', W / 2, 134, 5, 'center');
  const g = ctx.createLinearGradient(280, 0, 1000, 0);
  g.addColorStop(0, GOLD);
  g.addColorStop(0.55, '#FFC24A');
  g.addColorStop(1, ROSE);
  wordmark(ctx, 'STARLING', W / 2, 266, 6, g);
  ctx.fillStyle = 'rgba(255,246,232,0.82)';
  ctx.font = '600 15px system-ui, sans-serif';
  tracked(ctx, 'LEAD THE MURMURATION · WEAVE THE LIGHT · OUTRUN THE HAWKS',
    W / 2, 310, 2, 'center');

  panel(ctx, 366, 350, 548, 172, p.gate, 0.66);
  const rows = [
    ['MOUSE / WASD', 'STEER THE LEAD STARLING'],
    ['SPACE', 'DAZZLE — BURST PAST A HAWK'],
    ['ENTER', 'CLAIM ALL EIGHT SKY-GATES'],
  ];
  for (let i = 0; i < rows.length; i++) {
    const y = 374 + i * 50;
    keycap(ctx, 388, y, 150, 32, rows[i][0], i === 1 ? '#7BE8FF' : GOLD);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,246,232,0.88)';
    ctx.font = '700 14px system-ui, sans-serif';
    tracked(ctx, rows[i][1], 560, y + 21, 1);
  }

  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.62 + 0.38 * Math.sin(t * 3);
  ctx.fillStyle = '#FFF6E8';
  ctx.font = '800 23px system-ui, sans-serif';
  tracked(ctx, 'CLICK OR PRESS ENTER TO FLY', W / 2, 588, 3, 'center');
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 12px system-ui, sans-serif';
  tracked(ctx, 'BEST  ' + String(world.best).padStart(6, '0'), 1254, 694, 2, 'right');
  ctx.textAlign = 'left';
}

export function drawWinScreen(ctx, world, t) {
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, '#FFF2A8');
  g.addColorStop(0.5, '#FFE36B');
  g.addColorStop(1, '#FF9A5B');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(20,6,24,0.35)';
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = g;
  ctx.font = '900 86px system-ui, sans-serif';
  ctx.shadowColor = '#FFB347';
  ctx.shadowBlur = 30;
  tracked(ctx, 'SKY COMPLETE', W / 2, 142, 7, 'center');
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,246,232,0.9)';
  ctx.font = '700 15px system-ui, sans-serif';
  tracked(ctx, 'EIGHT GATES · FIVE SKIES · ONE MURMURATION', W / 2, 182, 3, 'center');
  statCard(ctx, 54, 258, 276, 122, 'SCORE', String(world.score).padStart(6, '0'), GOLD);
  statCard(ctx, 348, 258, 276, 122, 'GATES', String(world.gatesClaimed) + ' / 8', '#FF6E8A');
  statCard(ctx, 642, 258, 276, 122, 'BIRDS SURVIVING', String(world.flockCount), '#7BE8FF');
  statCard(ctx, 936, 258, 290, 122, 'BEST COMBO', '×' + world.bestCombo, '#47F0D0');
  ctx.fillStyle = 'rgba(10,5,24,0.55)';
  ctx.fillRect(0, 470, W, 250);
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3);
  ctx.fillStyle = GOLD;
  ctx.font = '800 26px system-ui, sans-serif';
  tracked(ctx, 'PRESS R TO FLY AGAIN', W / 2, 566, 4, 'center');
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '700 12px system-ui, sans-serif';
  tracked(ctx, 'BEST  ' + String(world.best).padStart(6, '0'), 1254, 694, 2, 'right');
  ctx.restore();
}

export function drawLoseScreen(ctx, world, t) {
  ctx.fillStyle = 'rgba(14,8,38,0.62)';
  ctx.fillRect(0, 0, W, H);
  const dusk = ctx.createLinearGradient(0, 0, 0, H);
  dusk.addColorStop(0, 'rgba(30,10,60,0.25)');
  dusk.addColorStop(1, 'rgba(90,12,42,0.55)');
  ctx.fillStyle = dusk;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.textAlign = 'center';
  const title = world.loseReason === 'NIGHTFALL' ? 'NIGHTFALL' : 'FLOCK SCATTERED';
  const g = ctx.createLinearGradient(260, 0, 1020, 0);
  g.addColorStop(0, '#FF4D4D');
  g.addColorStop(1, '#B04BE0');
  ctx.fillStyle = g;
  ctx.font = '900 84px system-ui, sans-serif';
  ctx.shadowColor = '#FF4D4D';
  ctx.shadowBlur = 26;
  tracked(ctx, title, W / 2, 158, 6, 'center');
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,220,226,0.85)';
  ctx.font = '700 15px system-ui, sans-serif';
  tracked(ctx, world.loseReason === 'NIGHTFALL'
    ? 'THE LAST LIGHT SLIPS BELOW THE HORIZON'
    : 'THE MURMURATION HAS LOST ITS LEAD', W / 2, 200, 3, 'center');

  statCard(ctx, 168, 272, 290, 130, 'SCORE', String(world.score).padStart(6, '0'), '#FF6E8A');
  statCard(ctx, 495, 272, 290, 130, 'GATES', String(world.gatesClaimed) + ' / 8', GOLD);
  statCard(ctx, 822, 272, 290, 130, 'SKY REACHED',
    String(world.wave + 1) + ' / 5', '#7BE8FF');

  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3);
  ctx.fillStyle = '#FFF6E8';
  ctx.font = '800 26px system-ui, sans-serif';
  tracked(ctx, 'PRESS R TO REGROUP', W / 2, 552, 4, 'center');
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();
}

export function render(ctx, world, t) {
  ctx.save();
  if (world.hitFlash > 0) {
    ctx.translate(Math.sin(t * 57) * world.hitFlash * 6, Math.cos(t * 43) * world.hitFlash * 4);
  }
  drawSky(ctx, world, t);
  drawSun(ctx, world, t);
  drawHills(ctx, world, t);
  drawMotes(ctx, world, t);
  drawGates(ctx, world, t);
  drawHawks(ctx, world, t);
  drawFlock(ctx, world, t);
  drawParticles(ctx, world, t);
  ctx.restore();

  if (world.screen === SCREEN_TITLE) drawTitleScreen(ctx, world, t);
  else if (world.screen === SCREEN_PLAY) drawHud(ctx, world, t);
  else if (world.screen === SCREEN_WIN) drawWinScreen(ctx, world, t);
  else if (world.screen === SCREEN_LOSE) drawLoseScreen(ctx, world, t);

  if (world.hitFlash > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,60,60,' + (world.hitFlash * 0.55) + ')';
    ctx.lineWidth = 18;
    ctx.strokeRect(0, 0, W, H);
    ctx.restore();
  }
}
