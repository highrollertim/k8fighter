'use strict';
const FC = require('../js/constants.js');
const Match = require('../js/match.js');
let fails = 0;
function ok(c, m) { if (c) console.log('ok - ' + m); else { fails++; console.error('FAIL - ' + m); } }

let m = Match.create();
ok(m.phase === 'roundStart' && m.round === 1 && m.wins.kate === 0 && m.wins.bungus === 0, 'fresh match');

for (let i = 0; i < Match.ROUND_START_FRAMES; i++) Match.step(m, 100, 100);
ok(m.phase === 'fight' && m.timer === FC.ROUND_TIME, 'transitions to fight with full timer');

Match.step(m, 100, 0);
ok(m.phase === 'roundEnd' && m.lastWinner === 'kate' && m.wins.kate === 1, 'KO awards round to kate');

for (let i = 0; i < Match.ROUND_END_FRAMES; i++) Match.step(m, 100, 0);
ok(m.round === 2 && m.phase === 'roundStart', 'advances to round 2');

for (let i = 0; i < Match.ROUND_START_FRAMES; i++) Match.step(m, 100, 100);
Match.step(m, 100, 0);
ok(m.wins.kate === 2 && m.phase === 'matchEnd' && m.matchWinner === 'kate', 'best-of-3 match win');

m = Match.create();
for (let i = 0; i < Match.ROUND_START_FRAMES; i++) Match.step(m, 100, 100);
m.timer = 0;
Match.step(m, 70, 40);
ok(m.phase === 'roundEnd' && m.lastWinner === 'kate', 'timeout awards round to higher health');

m = Match.create();
for (let i = 0; i < Match.ROUND_START_FRAMES; i++) Match.step(m, 100, 100);
Match.step(m, 0, 0);
ok(m.phase === 'roundEnd' && m.lastWinner === 'draw' && m.wins.kate === 0 && m.wins.bungus === 0, 'double KO is a draw');

if (fails) { console.error(fails + ' failed'); process.exit(1); }
console.log('All match tests passed.');
