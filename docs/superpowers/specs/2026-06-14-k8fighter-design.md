# k8fighter — Design

**Date:** 2026-06-14
**Status:** Approved

## Concept

A Street Fighter-style 1v1 fighting game for the web. The player controls Kate
(the flat-vector anime character from the kateClaude runner) against **Bungus**,
a diseased, decaying fungal rabbit covered in oozing, glowing pustules. Matches
are best-of-3 rounds with a per-round timer. Static site, zero dependencies,
no build step — same proven shape as kateClaude.

## Controls

- **← →** walk toward / away from the opponent.
- **↓** crouch. **↑** or **Space** jump (up / forward / back depending on held direction).
- **A** punch, **S** kick. **Tap = light, hold = heavy** (so two keys cover four
  normals per stance). Hold threshold ~120 ms.
- **Block:** hold the direction *away* from the opponent. Standing block stops
  high/mid attacks; crouch + away blocks low. Blocking the wrong height gets hit.
- **Throw:** A + S together while adjacent.
- A **move-list / help overlay** is reachable from the title and pause (Esc),
  showing the special-move motions.

## Combat (mid-depth)

Frame-data driven. Every attack is defined by startup / active / recovery frame
counts, a hitbox (offset + size + active window), damage, hitstun, blockstun,
knockback, height (high/mid/low/overhead), meter gain, and cancel flags.

- **Normals:** standing light/heavy punch & kick, crouching light/heavy punch &
  kick, jumping punch & kick. (Heavy = held button.)
- **Throw:** close-range A+S; unblockable; throws opponent to the other side.
- **Blocking:** correct-height block → blockstun + chip damage on specials only
  (normals do no chip). Pushback on block.
- **Combos:** emerge from cancel windows + frame advantage. Light normals are
  chainable; specific normals are special-cancellable (e.g. crouch light punch →
  fireball). No mandatory long combos — short links are enough.
- **Super meter:** 0–100, fills from dealing and taking damage; spent on the
  super move.
- **Hitstun/knockdown:** heavy and special hits can knock down; wakeup is neutral.

### Kate's specials (classic motions; generous buffering)

Motion inputs use a forgiving buffer (~12-frame window, partial-motion leniency)
so they are learnable; the help overlay lists them. Directions are written for
Kate facing right (mirrored when she faces left).

- **Fireball** — ↓ ↘ → + A — travels forward; one on screen at a time.
- **Rising Uppercut** — → ↓ ↘ + A (dragon-punch motion) — invincible-ish
  startup anti-air, knocks down.
- **Spinning Kick** — ↓ ↙ ← + S — advances, multi-hit, ends with knockback.
- **Super (Flurry)** — ↓↘→ ↓↘→ + A with full meter — multi-hit rushing
  combo, large damage, consumes 100 meter.

### Bungus

Own kit, AI-driven:

- **Swipe** — slow heavy claw, big hurtbox commitment (punishable on whiff).
- **Lunging Bite** — forward lunge gap-closer.
- **Spore Cloud** — slow short-range projectile (zoning).
- **Body Slam** — jumping crush, hits on the way down; must be blocked or avoided.

AI is reactive: approaches, whiff-punishes, blocks on reaction *sometimes*,
anti-airs jump-ins *sometimes*, pressures when the player is cornered, throws
to open up blockers. Tuned **a notch above "beatable in a few tries"** — a
determined player wins within several attempts. Difficulty knobs: reaction-delay
frames, block probability, anti-air probability, aggression, special frequency.

## Match flow

- Best of 3 rounds. Round timer (default 60 s). Round ends on K.O. or, at time
  out, the higher-health fighter wins the round (double-KO / exact tie → both
  lose the round, replay if neither has 2).
- Banners: "ROUND 1 — FIGHT!", "K.O.!" / "TIME!", "ROUND WON", and a final
  match **WIN** (Kate victory pose + taunt line) or **LOSE** (try-again) screen.
- HUD: two health bars (drain with a lag-trail), super-meter bars, round-win
  pips per fighter, centered countdown timer.
- Restart from win/lose returns to a fresh match with a new random stage.

## Stages

Three stages, **randomly assigned each match**, each with multi-layer parallax,
drawn procedurally (no image assets):

1. **Rotting forest clearing** — dusk woods, dead trees, drifting glowing spores,
   fungal ground. Matches Bungus.
2. **Neon street** — Street-Fighter-II city backdrop, neon signs, night sky.
3. **Anime convention hall** — con floor with booths and banners (ties to Kate's
   cosplay personality; Bungus crashing the con).

## Visual style

Flat vector with depth (gradients, soft shadows, glow), matching kateClaude's
quality bar. Kate keeps her bob, piercings, choker, dark top — redrawn in
fighting poses. Bungus is the approved **oozing-pustule bulky brute**: sickly
green body, glowing toxic boils that drip, exposed ribs through a gash, drooling
jagged maw, mushroom crown, drifting spores, glowing sunken eyes.

Pose sets (each fighter):
- Kate: idle, walk fwd/back, crouch, jump, block (stand/crouch), hitstun,
  knockdown, light/heavy punch, light/heavy kick, crouch punch/kick, jump
  attack, fireball, uppercut, spin kick, super, victory.
- Bungus: idle, walk, crouch, jump, block, hitstun, knockdown, swipe, bite,
  spore, body slam, defeated.

Effects: hit sparks, block sparks, dust on movement/landing, projectile
visuals, screen shake + hitstop on heavy/special connects, KO flash.

## Audio (all new, all in-browser, no files)

- **Music:** a fresh procedural Web Audio engine — driving, heavier fight-music
  feel, distinct from the runner's upbeat loop. Per-match variety is nice-to-have
  but not required; a strong single loop is acceptable.
- **SFX (synthesized):** light/heavy punch, kick, whiff, block, hit, knockdown,
  fireball cast + travel + impact, super, KO, round bell.
- **Taunts (speechSynthesis):** new lines in Kate's voice (fighting bravado +
  her personality), spoken at round start, on big hits/super, and on win. Draft
  set below; the user will review/edit. Degrade silently if speechSynthesis is
  absent. Mute toggle silences music, SFX, and voice together.

### Draft taunt lines (for user review)

Round start / general:
- "Okay fungus boy, let's go."
- "You're about to get deleted, and not by AI."
- "Ugh, you smell like a wet basement."

On landing a big hit / super:
- "Stand on business!"
- "That's for the spores!"
- "No cap, you're done."

On win:
- "GG. Touch grass — actually, don't, you'll infect it."
- "And THAT is how Kate does it."

On taking a big hit (optional):
- "Gross, gross, GROSS."

## Architecture

Static site, no dependencies, no build step. Plain `<script>` tags (not ES
modules) so it runs from `file://`. Canvas 2D scaled to a virtual resolution
(devicePixelRatio-aware). Fixed-timestep simulation (fighting games need
deterministic frames): accumulate real time, step the sim at a fixed 60 Hz,
render interpolated/last state. The pure-logic core is node-testable (dual
export pattern like kateClaude's `world.js`).

```
k8fighter/
  index.html
  css/style.css
  js/
    input.js        # keyboard state + motion-input buffer/detector (logic)
    moves.js        # frame data: Kate + Bungus normals, specials, super, throw (data)
    fighter.js      # Fighter: state machine, physics, health/meter, facing (logic)
    combat.js       # hitbox/hurtbox resolution, damage, blocking, throws (logic)
    bungus-ai.js    # Bungus decision-making (logic)
    match.js        # round/match/timer state machine (logic)
    art-kate.js     # Kate pose rendering
    art-bungus.js   # Bungus pose rendering
    art-stages.js   # three stages + parallax
    art-fx.js       # sparks, particles, banners, HUD
    audio.js        # procedural music + SFX
    voice.js        # taunt lines
    main.js         # boot, fixed-timestep loop, wiring, state machine
  tests/
    combat.test.js  # hit/block/throw resolution, damage, knockdown
    fighter.test.js # physics, state transitions, facing, cornering
    input.test.js   # motion-input detection (QCF/DP/QCB, buffer, leniency, mirror)
    match.test.js   # round win, timeout, best-of-3, double-KO
```

Plain-node test harness (no framework), run as `node tests/<file>.test.js`,
matching the kateClaude convention.

### Coordinate / sim conventions

- Virtual resolution defined once (e.g. 960×540 logical); renderer scales to the
  canvas, DPR-aware.
- Fixed 60 Hz sim step; `main.js` accumulates `dt` and steps in fixed increments.
- Fighters store position (feet anchor), velocity, facing, state, state-frame
  counter, health, meter. Hitboxes/hurtboxes are AABBs in world space derived
  per state-frame from `moves.js`.
- `combat.js` is pure: given two fighters' boxes + states for a frame, it returns
  hit/block/throw outcomes and the resulting state changes — no rendering/audio.

### Error handling & compatibility

- AudioContext created/resumed on first user gesture; every audio method guards
  a missing context. `speechSynthesis` and `localStorage` feature-checked;
  absence degrades gracefully. Modern evergreen desktop browsers; keyboard-first
  (no mobile tuning).

## Build milestones (each runnable)

1. **Vertical slice:** Kate vs. a stationary dummy Bungus, one normal, working
   hit/hurtboxes, health bars, KO. Fixed-timestep loop + input.
2. **Full normals + movement + blocking + throws** for both fighters.
3. **Specials + super + meter** (motion input + projectiles).
4. **Bungus AI.**
5. **Rounds / match / timer / HUD / banners.**
6. **Full art** — all poses, both fighters, at the quality bar.
7. **Audio + taunts.**
8. **Three stages + random assignment + parallax.**
9. **Tuning + polish** (balance, hitstop, screen shake, difficulty knobs) + README.

## Testing & verification

- Node tests for combat resolution, fighter physics/state, motion-input, match
  flow.
- Per-milestone browser verification (Playwright): the slice is playable; moves
  connect; blocking works; specials come out; AI fights back; rounds resolve;
  KO/win/lose screens show; no console errors. Human playtest for feel and
  difficulty in the final milestone.

## Out of scope (YAGNI)

- Two-player / online, character select (only Kate), multiple opponents, combo
  trials, replays, training mode, gamepad support, mobile/touch controls,
  image/audio asset files, configurable keybindings.
