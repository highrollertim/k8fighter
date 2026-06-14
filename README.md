# Kate vs. Bungus (k8fighter)

A Street Fighter-style 1v1. Play Kate against **Bungus**, an oozing fungal
death-rabbit. Best of 3 rounds. Everything — art, music, voice — is generated
live in the browser; there are no asset files.

## Play

Open `index.html` in any modern browser (or serve the folder with any static
server). **Enter** to fight. **Arrows** move, **↓** crouch, **↑/Space** jump,
**A** punch, **S** kick (tap = light, hold = heavy). Hold **away** to block
(crouch-block lows). **A+S** to throw. **H** shows the move list. Mute is
bottom-right.

Specials (Kate, facing right): Fireball ↓↘→ + A · Uppercut →↓↘ + A ·
Spin Kick ↓↙← + S · Super ↓↘→↓↘→ + A (full meter).

## Layout

- `js/constants.js` — tuning constants
- `js/input.js` — keys + motion detection (`node tests/input.test.js`)
- `js/moves.js` — frame data for every move
- `js/moveselect.js` — intent → move key (`node tests/moveselect.test.js`)
- `js/fighter.js` — physics + state machine (`node tests/fighter.test.js`)
- `js/combat.js` — hit/block/throw resolution (`node tests/combat.test.js`)
- `js/specials.js` — special motions + projectiles (`node tests/specials.test.js`)
- `js/bungus-ai.js` — opponent AI (`node tests/bungus-ai.test.js`)
- `js/match.js` — rounds/timer (`node tests/match.test.js`)
- `js/art-*.js` — Kate, Bungus, stages, FX/HUD rendering
- `js/audio.js` (Sound), `js/voice.js` — music/SFX and taunts
- `js/main.js` — fixed-timestep loop + wiring

Run all logic tests: `for f in tests/*.test.js; do node "$f"; done`
