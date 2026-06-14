'use strict';
const Fighter = require('../js/fighter.js');
const AI = require('../js/bungus-ai.js');
let fails = 0;
function ok(c, m) { if (c) console.log('ok - ' + m); else { fails++; console.error('FAIL - ' + m); } }
const seq = (vals) => { let i = 0; return () => vals[(i++) % vals.length]; };
const DIFF = AI.DIFFICULTY;

let b = Fighter.create('bungus', 200, 1);
let k = Fighter.create('kate', 800, -1);
let dec = AI.decide(b, k, seq([0.99]), DIFF, 0);
ok(dec.dir === 6 || dec.dir === 3 || dec.dir === 9, 'walks toward distant Kate');

b = Fighter.create('bungus', 400, 1);
k = Fighter.create('kate', 460, -1);
dec = AI.decide(b, k, seq([0.0]), DIFF, 0);
ok(dec.attack && (dec.attack.button || dec.attack.special), 'attacks when close');

b = Fighter.create('bungus', 420, 1);
k = Fighter.create('kate', 470, -1);
Fighter.start(k, 'kate.LP'); k.stateFrame = 0;
dec = AI.decide(b, k, seq([0.0]), DIFF, 0);
ok(dec.dir === 4 || dec.dir === 1, 'holds away (blocks) vs an incoming attack');

b = Fighter.create('bungus', 500, 1);
k = Fighter.create('kate', 520, -1);
for (let i = 0; i < 200; i++) {
  dec = AI.decide(b, k, Math.random, DIFF, i);
  if (![1,2,3,4,5,6,7,8,9].includes(dec.dir)) { ok(false, 'dir always valid'); break; }
  if (i === 199) ok(true, 'dir always valid across 200 frames');
}

if (fails) { console.error(fails + ' failed'); process.exit(1); }
console.log('All AI tests passed.');
