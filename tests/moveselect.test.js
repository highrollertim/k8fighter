'use strict';
const MoveSelect = require('../js/moveselect.js');
let fails = 0;
function ok(c, m) { if (c) console.log('ok - ' + m); else { fails++; console.error('FAIL - ' + m); } }

const F = (over) => Object.assign({ id:'kate', onGround:true, facing:1 }, over);
const I = (over) => Object.assign({ dir:5, heavy:false, button:'A', throw:false }, over);

ok(MoveSelect.normalKey(F(), I({button:'A'})) === 'kate.LP', 'standing A light -> LP');
ok(MoveSelect.normalKey(F(), I({button:'A', heavy:true})) === 'kate.HP', 'standing A heavy -> HP');
ok(MoveSelect.normalKey(F(), I({button:'S'})) === 'kate.LK', 'standing S light -> LK');
ok(MoveSelect.normalKey(F(), I({button:'S', heavy:true})) === 'kate.HK', 'standing S heavy -> HK');
ok(MoveSelect.normalKey(F(), I({button:'A', dir:2})) === 'kate.cLP', 'crouch A -> cLP');
ok(MoveSelect.normalKey(F(), I({button:'S', dir:2})) === 'kate.cLK', 'crouch S -> cLK');
ok(MoveSelect.normalKey(F({onGround:false}), I({button:'A'})) === 'kate.jP', 'air A -> jP');
ok(MoveSelect.normalKey(F({onGround:false}), I({button:'S'})) === 'kate.jK', 'air S -> jK');
ok(MoveSelect.normalKey(F({id:'bungus'}), I({button:'A'})) === 'bungus.LP', 'bungus A -> LP');
ok(MoveSelect.normalKey(F({id:'bungus'}), I({button:'S'})) === 'bungus.LK', 'bungus S -> LK (low)');

ok(MoveSelect.throwKey('kate') === 'kate.throw' && MoveSelect.throwKey('bungus') === 'bungus.throw', 'throw keys');

if (fails) { console.error(fails + ' failed'); process.exit(1); }
console.log('All moveselect tests passed.');
