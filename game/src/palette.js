// palette.js — the five painted skies, the gate hues, and small colour helpers.

export const PALETTES = {
  dawnrose: {
    skyTop: '#1A103C', skyBottom: '#FF8A5B', sun: '#FFD08A',
    gate: '#FF6E8A', accent: '#FFB27A', hill: '#0B0820', tint: '#FF6E8A',
  },
  goldhaze: {
    skyTop: '#241246', skyBottom: '#FFC24A', sun: '#FFE3A0',
    gate: '#FFC24A', accent: '#FFD36B', hill: '#0B0820', tint: '#FFC24A',
  },
  fuchsia: {
    skyTop: '#160B33', skyBottom: '#E0409B', sun: '#FF9BD0',
    gate: '#E857C8', accent: '#FF70C0', hill: '#0B0820', tint: '#E857C8',
  },
  tidal: {
    skyTop: '#062A3A', skyBottom: '#3FE0B0', sun: '#9CFFE0',
    gate: '#47F0D0', accent: '#6CF0D0', hill: '#04141C', tint: '#47F0D0',
  },
  solar: {
    skyTop: '#3A1030', skyBottom: '#FFE36B', sun: '#FFF2B0',
    gate: '#FFE36B', accent: '#FFB347', hill: '#160820', tint: '#FFE36B',
  },
};

export const WAVE_NAMES = ['DAWNROSE', 'GOLDHAZE', 'FUCHSIA', 'TIDAL', 'SOLAR'];

export const GATE_HUES = ['#FF6E8A', '#FFC24A', '#E857C8', '#47F0D0', '#FFE36B'];

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function lerpHex(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(ca.r + (cb.r - ca.r) * k);
  const g = Math.round(ca.g + (cb.g - ca.g) * k);
  const bl = Math.round(ca.b + (cb.b - ca.b) * k);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

export function rgba(hex, alpha) {
  const c = hexToRgb(hex);
  return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
}

export function skyGradientKey(i) {
  return WAVE_NAMES[i] ? PALETTES[WAVE_NAMES[i].toLowerCase()] : PALETTES.solar;
}

// Blend two whole palettes while a sky banner morphs the world from one wave to the next.
export function blendPalette(fromKey, toKey, t) {
  const a = PALETTES[fromKey] || PALETTES.dawnrose;
  const b = PALETTES[toKey] || PALETTES.solar;
  const out = {};
  for (const key of Object.keys(b)) out[key] = lerpHex(a[key], b[key], t);
  return out;
}
