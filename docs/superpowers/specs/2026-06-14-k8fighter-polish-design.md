# k8fighter Polish — Detailed Backgrounds & Acrobatic Animation

**Date:** 2026-06-14
**Status:** Approved
**Scope:** Rendering only — `js/art-stages.js`, `js/art-kate.js`, `js/art-bungus.js`. No changes to logic (`fighter.js`, `combat.js`, `moves.js`, `bungus-ai.js`, `match.js`, `specials.js`, `input.js`), so hitboxes, blocking, throws, AI, and balance are unchanged. The 7 node test suites are untouched and must stay green.

## Goal

Make the three stages noticeably more detailed and make movement feel more
acrobatic — **cosmetic only**. Flips/spins are rendered rotations; collision
boxes (computed by state in `combat.js`) stay upright, so jump-ins connect
exactly as before and the fight stays balanced.

## 1. Detailed backgrounds (`art-stages.js`, still fully procedural)

All three keep their current palette/identity and the floor at `FC.FLOOR_Y`;
add depth and detail, parallax where it reads. Continue to accept
`draw(ctx, idx, vw, vh, t)` with `t` a time value for animated elements.

- **Forest (idx 0):** three parallax depth layers of tree silhouettes (far/mid/near),
  hanging vines, glowing ground mushrooms, a soft fog gradient band, varied-size
  drifting spores/fireflies (slow twinkle), a gnarled foreground branch framing
  the top edge.
- **Street (idx 1):** denser skyline with lit window grids, neon signs that
  flicker (cheap time-based alpha), street lamps with glow, a moon, telephone
  wires, and a subtle wet-asphalt sheen on the floor.
- **Expo (idx 2):** detailed booths with banners (EXPO text retained), a ceiling
  truss with stage-light cones, a dark crowd-silhouette row in the back, and a
  glossy floor reflection sheen.

Performance: keep per-frame cost modest (no thousands of elements); reuse
gradients; animation driven by `t` only. No image assets.

## 2. Acrobatic animation (`art-kate.js`, `art-bungus.js`)

Driven entirely by the existing fighter fields the renderers already read
(`state`, `move`, `stateFrame`, `onGround`, `facing`, plus `vy`/`y` if useful for
air progress). No new fighter fields, no physics changes.

- **Jump/air:** rotate the whole figure through a flip keyed to air progress.
  Kate: a forward somersault (≈360° over the airtime, tucked limbs at apex).
  Bungus: a clumsier partial tumble-spin (less rotation, floppy ears/limbs).
  Rotation is applied around the figure's body center so it reads as a flip,
  not a spin-in-place at the feet.
- **Run/walk:** more pronounced stride length, arm pump, and a slight body
  bob + forward lean (enhance the existing pose, don't replace the rig).
- **Landing:** squash-and-stretch dip for the first few grounded frames after
  touchdown (detect via a short post-land window — e.g. `stateFrame` small and
  `onGround` true coming out of a jump; a simple heuristic in the renderer is
  fine since it's cosmetic).
- **Motion streaks:** faint trailing arcs/ghosts behind fast-moving limbs during
  jumps, attacks, and specials (low-alpha, 2–3 echoes). Cheap, drawn in the
  character renderer.

The hurtbox/hitbox are NOT derived from the rendered rotation, so the flip is
purely visual.

## Verification

- `for f in tests/*.test.js; do node "$f"; done` — all 7 suites still pass
  (rendering changes don't touch logic).
- `node --check` on the three changed files.
- Browser (Playwright) screenshots per stage and of a jump/flip mid-air, run,
  and landing, for both fighters. Human eyeball for "more detailed / more
  acrobatic" is the real acceptance check.

## Out of scope

No new movement mechanics (no double-jump, dash, air-control, wall-jump — those
were explicitly declined), no balance/frame-data changes, no new audio, no asset
files.
