// config.js — every tuning number and the five-sky progression table. No logic here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const STEP = 1 / 60;

export const BIRD_COUNT = 160;
export const MIN_FLOCK = 30;
export const GATES_TOTAL = 8;

export const DAZZLE_CD = 3;          // seconds between DAZZLE bursts
export const DAZZLE_WINDOW = 0.4;    // a strike inside this window is a PERFECT DODGE
export const COMBO_WINDOW = 6;       // seconds between scoring events before combo resets

export const GOAL_GATE_POINTS = 100; // multiplied by current combo
export const GOAL_PERFECT_DODGE = 150;
export const GOAL_DAYLIGHT_RESTORE = 6;   // percent per gate claim
export const GOAL_GATE_GATHER = 8;        // scattered birds gathered back per claim
export const GOAL_HAWK_SNATCH = 14;       // maximum birds a hawk can carry off
export const GOAL_SURVIVOR_BONUS = 20;    // per surviving bird on a win
export const GOAL_FLAWLESS_BONUS = 200;   // per sky cleared without losing a bird

export const HAWK_TELEGRAPH = 0.8;   // seconds of warning before a dive
export const HAWK_DIVE = 0.38;       // seconds of the dive itself
export const HAWK_SPAWN_MIN = 4.5;   // seconds between dive attempts
export const HAWK_SPAWN_MAX = 7.0;

// One entry per sky. duskRate is daylight percent drained per second.
export const WAVES = [
  { name: 'DAWNROSE', gates: 1, hawks: 0, duskRate: 0.70, paletteKey: 'dawnrose' },
  { name: 'GOLDHAZE', gates: 1, hawks: 1, duskRate: 0.95, paletteKey: 'goldhaze' },
  { name: 'FUCHSIA',  gates: 2, hawks: 2, duskRate: 1.30, paletteKey: 'fuchsia'  },
  { name: 'TIDAL',    gates: 2, hawks: 2, duskRate: 1.65, paletteKey: 'tidal'    },
  { name: 'SOLAR',    gates: 2, hawks: 3, duskRate: 2.05, paletteKey: 'solar'    },
];

export const WAVE_COUNT = WAVES.length;
export const SKY_BANNER_TIME = 1.2;

// Event bits returned by stepWorld so callers can react without polling state.
export const EV_GATE = 1;
export const EV_DAZZLE = 2;
export const EV_HAWK_HIT = 4;
export const EV_PERFECT = 8;
export const EV_WAVE = 16;
export const EV_WIN = 32;
export const EV_LOSE = 64;
export const EV_START = 128;
export const EV_RESTART = 256;
