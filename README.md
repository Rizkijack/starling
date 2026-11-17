# STARLING

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Rizkijack/starling/rank.svg)](https://make.fun/bounty/best-game-01/Rizkijack/starling)
[![reward](https://make.fun/badge/best-game-01/Rizkijack/starling/reward.svg)](https://make.fun/bounty/best-game-01/Rizkijack/starling/reward)

**Lead the murmuration. Weave the light. Outrun the hawks.**

STARLING is a pure Canvas 2D arcade game: your health bar is a living flock of ~160 glowing
starlings. Steer the bright lead bird through luminous sky-gates, dodge diving hawks with a
DAZZLE burst, and keep the daylight clock alive across five vivid skies. Claim all 8 gates to
win; lose the flock or run out of daylight and night falls.

## Controls

| Input | Action |
| --- | --- |
| Mouse | Steer the lead bird toward the cursor |
| WASD / Arrows | Alternate steering |
| Space / Left click | DAZZLE — burst outward to dodge a hawk (3 s cooldown) |
| Enter / Click | Start from title |
| P / Esc | Pause / resume |
| R | Restart from win or lose |
| M | Mute / unmute |

## Playing locally

STARLING runs offline from static files — no build step, no dependencies, no network requests.
Serve `game/` with any static server (for example `node serve.ts` on port 8080) and open
`http://localhost:8080/`. ES modules require HTTP rather than `file://`.
