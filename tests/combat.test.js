'use strict';
const FC = require('../js/constants.js');
const Fighter = require('../js/fighter.js');
const Moves = require('../js/moves.js');
const Combat = require('../js/combat.js');
let fails = 0;
function ok(c, m) { if (c) console.log('ok - ' + m); else { fails++; console.error('FAIL - ' + m); } }

function attackerInActive(f, key) {
  Fighter.start(f, key);
  const mv = Moves.TABLE[key];
  f.stateFrame = mv.startup;
  return mv;
}

let k = Fighter.create('kate', 300, 1);
Fighter.start(k, 'kate.LP');
k.stateFrame = 0;
ok(Combat.activeHitbox(k) === null, 'no hitbox during startup');
k.stateFrame = Moves.TABLE['kate.LP'].startup;
ok(Combat.activeHitbox(k) !== null, 'hitbox present during active frames');

k = Fighter.create('kate', 300, 1);
let b = Fighter.create('bungus', 360, -1);
attackerInActive(k, 'kate.LP');
let ev = Combat.resolve(k, b);
ok(ev && ev.type === 'hit' && ev.defender === b, 'in-range active move hits');
ok(b.health < FC.MAX_HEALTH, 'defender took damage');
ok(b.state === 'hitstun', 'defender in hitstun');
ok(k.hitThisMove, 'attacker move flagged as having connected');

const hpAfter = b.health;
ev = Combat.resolve(k, b);
ok(ev === null && b.health === hpAfter, 'one active move connects only once');

k = Fighter.create('kate', 300, 1);
b = Fighter.create('bungus', 360, -1);
b.state = 'block';
attackerInActive(k, 'kate.LP');
ev = Combat.resolve(k, b);
ok(ev.type === 'block', 'mid attack blocked while standing-blocking');
ok(b.state === 'blockstun', 'defender in blockstun');
ok(b.health === FC.MAX_HEALTH, 'no chip on a blocked normal');

k = Fighter.create('kate', 300, 1);
b = Fighter.create('bungus', 360, -1);
b.state = 'block';
attackerInActive(k, 'kate.cLK');
ev = Combat.resolve(k, b);
ok(ev.type === 'hit', 'low beats standing block');

k = Fighter.create('kate', 300, 1);
b = Fighter.create('bungus', 360, -1);
b.state = 'crouch'; b.blockingLow = true;
attackerInActive(k, 'kate.cLK');
ev = Combat.resolve(k, b);
ok(ev.type === 'block', 'low blocked while crouch-blocking');

k = Fighter.create('kate', 300, 1);
b = Fighter.create('bungus', 360, -1);
b.state = 'crouch'; b.blockingLow = true;
attackerInActive(k, 'kate.jP');
ev = Combat.resolve(k, b);
ok(ev.type === 'hit', 'overhead beats crouch block');

k = Fighter.create('kate', 300, 1);
b = Fighter.create('bungus', 700, -1);
attackerInActive(k, 'kate.LP');
ok(Combat.resolve(k, b) === null, 'out of range misses');

k = Fighter.create('kate', 300, 1);
b = Fighter.create('bungus', 340, -1);
ev = Combat.tryThrow(k, b, 'kate.throw');
ok(ev && ev.type === 'throw' && b.state === 'knockdown', 'throw connects up close');

// combo counter: hitting a defender already in hitstun increments the combo
k = Fighter.create('kate', 300, 1);
b = Fighter.create('bungus', 360, -1);
attackerInActive(k, 'kate.LP');
let cev = Combat.resolve(k, b);
ok(cev && cev.combo === 1, 'first hit is combo 1');
// second hit while b still in hitstun -> combo 2
k.hitThisMove = false; k.stateFrame = Moves.TABLE['kate.LP'].startup;  // re-arm same move's active window
cev = Combat.resolve(k, b);
ok(b.state === 'hitstun', 'defender still in hitstun for the combo');
ok(cev && cev.combo === 2, 'second hit while in hitstun is combo 2');
// after recovery, next hit resets to 1
for (let i = 0; i < 30; i++) Fighter.step(b, { dir:5, jump:false, attack:null }, k);
ok(b.state !== 'hitstun', 'defender recovered');
k.hitThisMove = false; k.stateFrame = Moves.TABLE['kate.LP'].startup;
cev = Combat.resolve(k, b);
ok(cev && cev.combo === 1, 'hit after recovery resets combo to 1');

if (fails) { console.error(fails + ' failed'); process.exit(1); }
console.log('All combat tests passed.');
