# k8fighter Round 2 — Cinematic Super, Harder Bungus, Polish

**Date:** 2026-06-14
**Status:** Approved
**Base:** existing merged game at `/Volumes/Dock/Code/k8fighter` (main).

## Directives

### A. Remove the Spin Kick
Delete `kate.spinkick` everywhere: the `Moves.TABLE` entry, the `Specials.SPECIALS`
motion entry, the `E` shortcut key (input.js mapping `spSpin` + main.js
`playerIntent` branch), and the move-list overlay entry in `main.js`. `E` becomes
unbound. No references may remain (grep `spinkick`/`spSpin` → none).

### B. Degender Bungus (she is female)
Bungus is female. Fix gendered language: in `voice.js` the line
"Okay fungus boy, let's go." becomes a female/neutral line (e.g.
"Okay fungus girl, let's go." or "Alright, you fungal freak — let's go."). Audit
all taunts and the win/lose messages for he/him/boy referring to Bungus; use
she/her or neutral. Kate herself is unchanged.

## Cinematic Super (`moves.js`, `main.js`, `art-fx.js`, `audio.js`)

- **Damage:** `kate.super` damage 30 → 42 (keep `meterGain:0`, `knockdown:true`,
  full-meter cost). May increase `hits` for a denser rush.
- **Activation cinematic:** on super start, trigger a short window (~0.5–0.7s real)
  of: slow-motion (global `timeScale` ≈ 0.3 ramping back to 1), a screen darken
  vignette + bright flash, and a dramatic audio sting (enhance `Sound.super()`).
- **Impact:** bigger hit-sparks/flash per hit, stronger hitstop on the final hit.
- Reads as a finisher, not just a fast combo. Hurtbox/blocking rules unchanged
  (still blockable with chip as today).

## Harder Bungus (`bungus-ai.js`)

Retune `DIFFICULTY` to "solidly challenging" and add whiff-punish:
- blockProb ↑ (~0.6), antiAirProb ↑ (~0.6), aggression ↑ (~0.55),
  reactFrames ↓ (~7), specialProb modest ↑.
- **Whiff-punish:** when Kate is in attack RECOVERY (in `attack` state, past her
  move's active frames) and in range, Bungus attacks (punish). Add this branch to
  `decide()`.
- Keep it beatable with real effort — not unfair, no input-reading omniscience,
  health stays 100 each. No difficulty menu.

## Polish

### Combat juice (`art-fx.js`, `main.js`)
- Stronger hitstop on heavy/special connects (scale by move).
- Screen-flash overlay on big hits and KO.
- More/better hit-spark + dust particles; a subtle camera punch (short directional
  shove of the view on heavy hits, distinct from random shake).

### KO drama (`main.js`, `art-kate.js`, `art-bungus.js`)
- On the finishing blow (round-ending KO), slow-motion (timeScale ramp) for ~1s,
  a flash, and a brief zoom-in toward the loser.
- The loser ragdolls into the knockdown (exaggerated tumble/limp pose).

### Combo counter (`combat.js`, `art-fx.js`)
- `combat.js`: in `resolve`/`applyProjectileHit`, when the defender is hit while
  already in `hitstun` (a true combo), increment a combo count; reset to 1 on a
  fresh hit (defender not already in hitstun). Expose the current combo count in
  the returned event (e.g. `ev.combo`). Node-tested.
- `art-fx.js`: show a "N HITS!" popup that grows/fades, when combo ≥ 2.

### Intros & victory (`main.js`, `art-kate.js`, `art-bungus.js`, `voice.js`)
- **Intro:** before round 1 only (round ≥ 2 uses the normal quick banner), a short
  face-off — both fighters in an intro/ready pose, a "VS" or name flash, and a Kate
  voice line — during the existing `roundStart` window (render-side; no match.js
  logic change required). Keep it brief (≤ ~1.5s) so rematches aren't tedious.
- **Victory:** on match win, the winner shows a victory pose (new pose in the
  art rig) and Kate says a win line (already wired for matchWinner==='kate'; ensure
  it still fires and the pose renders on the end screen / final frame).

## Technical notes

- **Slow-motion:** add a `timeScale` in `main.js` applied to the fixed-timestep
  accumulator so the sim runs slower while visuals/audio continue; ramps back to 1.
  Must not break the accumulator (clamp steps as today).
- Screen darken/flash/zoom/camera-punch are render-layer transforms/overlays in
  `art-fx.js` + `main.js` render; they do not affect hitboxes or logic.
- Combo state is the only logic addition; everything else is render/audio/AI-tuning.

## Verification

- All node suites pass (`for f in tests/*.test.js; do node "$f"; done`), including
  a new combo-counter assertion in `tests/combat.test.js`.
- `node --check` on every changed JS file.
- Browser (Playwright) verification per task: super cinematic (slow-mo + darken +
  flash) and bigger damage; Bungus visibly tougher (blocks/punishes/anti-airs);
  combo counter shows on chained hits; KO slow-mo + ragdoll; round-1 intro + victory
  pose; spin kick gone; no "boy" reference; zero console errors.
- Human playtest for feel and difficulty is the real acceptance check.

## Out of scope

No new specials to replace the spin kick, no difficulty menu, no online/2P, no new
stages or characters, no asset files. Audible music/voice quality remains a
human-only check.
