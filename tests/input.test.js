'use strict';
const Input = require('../js/input.js');
let fails = 0;
function ok(c, m) { if (c) console.log('ok - ' + m); else { fails++; console.error('FAIL - ' + m); } }

// numpad derivation
ok(Input.dirFromKeys({ right: true }) === 6, 'right -> 6');
ok(Input.dirFromKeys({ left: true }) === 4, 'left -> 4');
ok(Input.dirFromKeys({ down: true, right: true }) === 3, 'down-right -> 3');
ok(Input.dirFromKeys({ up: true, left: true }) === 7, 'up-left -> 7');
ok(Input.dirFromKeys({}) === 5, 'nothing -> 5 (neutral)');
ok(Input.dirFromKeys({ left: true, right: true }) === 5, 'opposite cancels -> 5');

// motion buffer: QCF (2,3,6) facing right
let ms = Input.createMotion();
[2, 3, 6].forEach((d, i) => Input.pushDir(ms, d, i));
ok(Input.matchMotion(ms, [2, 3, 6], 2, 12, 1), 'QCF detected facing right');
ok(!Input.matchMotion(ms, [2, 1, 4], 2, 12, 1), 'QCB not falsely detected');

// buffer window expires
ms = Input.createMotion();
Input.pushDir(ms, 2, 0); Input.pushDir(ms, 3, 1); Input.pushDir(ms, 6, 30);
ok(!Input.matchMotion(ms, [2, 3, 6], 30, 12, 1), 'motion rejected when spread beyond buffer');

// mirroring when facing left: forward is 4, so QCF input becomes 2,1,4 absolute
ms = Input.createMotion();
[2, 1, 4].forEach((d, i) => Input.pushDir(ms, d, i));
ok(Input.matchMotion(ms, [2, 3, 6], 2, 12, -1), 'QCF detected facing left (mirrored)');

// subsequence leniency: extra dirs between motion beats are tolerated
ms = Input.createMotion();
[2, 5, 3, 6].forEach((d, i) => Input.pushDir(ms, d, i));
ok(Input.matchMotion(ms, [2, 3, 6], 3, 12, 1), 'QCF tolerates an intervening neutral');

if (fails) { console.error(fails + ' failed'); process.exit(1); }
console.log('All input tests passed.');
