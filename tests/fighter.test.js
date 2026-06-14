'use strict';
const FC = require('../js/constants.js');
const Fighter = require('../js/fighter.js');
const Moves = require('../js/moves.js');
let fails = 0;
function ok(c, m) { if (c) console.log('ok - ' + m); else { fails++; console.error('FAIL - ' + m); } }
const NEUTRAL = { dir: 5, jump: false, attack: null };

let k = Fighter.create('kate', 300, 1);
let b = Fighter.create('bungus', 600, -1);
ok(k.onGround && k.y === FC.FLOOR_Y, 'starts grounded on the floor');
ok(k.facing === 1 && b.facing === -1, 'initial facings set');

// walking forward moves toward opponent
const x0 = k.x;
Fighter.step(k, { dir: 6, jump: false, attack: null }, b);
ok(k.x > x0, 'walk forward (dir 6, facing right) increases x');
ok(k.state === 'walkF', 'state is walkF while walking toward opp');

// facing flips when opponent crosses over (only while grounded & neutral)
k = Fighter.create('kate', 700, 1);
b = Fighter.create('bungus', 300, -1);
Fighter.step(k, NEUTRAL, b);
ok(k.facing === -1, 'faces left when opponent is to the left');

// jump leaves ground and gravity returns it
k = Fighter.create('kate', 300, 1);
Fighter.step(k, { dir: 8, jump: true, attack: null }, b);
ok(!k.onGround && k.vy < 0, 'jump leaves ground rising');
for (let i = 0; i < 120 && !k.onGround; i++) Fighter.step(k, NEUTRAL, b);
ok(k.onGround && k.y === FC.FLOOR_Y, 'gravity returns fighter to floor');

// crouch
k = Fighter.create('kate', 300, 1);
Fighter.step(k, { dir: 2, jump: false, attack: null }, b);
ok(k.state === 'crouch', 'down -> crouch');

// wall clamp
k = Fighter.create('kate', FC.STAGE_LEFT, 1);
b = Fighter.create('bungus', 800, -1);
Fighter.step(k, { dir: 4, jump: false, attack: null }, b);  // walk back into left wall
ok(k.x >= FC.STAGE_LEFT, 'cannot walk past the left wall');

// starting a move locks into attack state for startup+active+recovery, then idle
k = Fighter.create('kate', 300, 1);
Fighter.start(k, 'kate.LP');
const mv = Moves.TABLE['kate.LP'];
const total = mv.startup + mv.active + mv.recovery;
ok(k.state === 'attack' && k.move === 'kate.LP', 'start() enters attack state');
for (let i = 0; i < total; i++) Fighter.step(k, NEUTRAL, b);
ok(k.state === 'idle' && k.move === null, 'returns to idle after move recovers');

// hitstun ticks down to idle
k = Fighter.create('kate', 300, 1);
Fighter.applyHit(k, Moves.TABLE['kate.LP'], 600);
ok(k.state === 'hitstun', 'applyHit sets hitstun');
ok(k.health < FC.MAX_HEALTH, 'applyHit reduces health');
for (let i = 0; i < Moves.TABLE['kate.LP'].hitstun + 1; i++) Fighter.step(k, NEUTRAL, b);
ok(k.state === 'idle', 'recovers from hitstun');

if (fails) { console.error(fails + ' failed'); process.exit(1); }
console.log('All fighter tests passed.');
