// js/match.js — round/match state machine + timer. Pure. Dual export.
(function (root) {
  'use strict';
  const FC = (typeof module !== 'undefined') ? require('./constants.js') : root.FC;
  const ROUND_START_FRAMES = 90;
  const ROUND_END_FRAMES = 120;

  function create() {
    return {
      phase: 'roundStart', round: 1, wins: { kate: 0, bungus: 0 },
      timer: FC.ROUND_TIME, _t: 0, phaseFrame: 0,
      lastWinner: null, matchWinner: null,
    };
  }

  function endRound(m, winner) {
    m.lastWinner = winner;
    if (winner === 'kate') m.wins.kate++;
    else if (winner === 'bungus') m.wins.bungus++;
    m.phase = 'roundEnd'; m.phaseFrame = 0;
    // Immediately check for match win on the same frame
    if (m.wins.kate >= FC.ROUNDS_TO_WIN) { m.phase = 'matchEnd'; m.matchWinner = 'kate'; }
    else if (m.wins.bungus >= FC.ROUNDS_TO_WIN) { m.phase = 'matchEnd'; m.matchWinner = 'bungus'; }
  }

  function step(m, kateHP, bungusHP) {
    m.phaseFrame++;
    if (m.phase === 'roundStart') {
      if (m.phaseFrame >= ROUND_START_FRAMES) { m.phase = 'fight'; m.phaseFrame = 0; m.timer = FC.ROUND_TIME; m._t = 0; }
      return;
    }
    if (m.phase === 'fight') {
      m._t += FC.DT;
      if (m._t >= 1) { m._t -= 1; m.timer = Math.max(0, m.timer - 1); }
      if (kateHP <= 0 && bungusHP <= 0) return endRound(m, 'draw');
      if (bungusHP <= 0) return endRound(m, 'kate');
      if (kateHP <= 0) return endRound(m, 'bungus');
      if (m.timer <= 0) {
        if (kateHP > bungusHP) return endRound(m, 'kate');
        if (bungusHP > kateHP) return endRound(m, 'bungus');
        return endRound(m, 'draw');
      }
      return;
    }
    if (m.phase === 'roundEnd') {
      if (m.wins.kate >= FC.ROUNDS_TO_WIN) { m.phase = 'matchEnd'; m.matchWinner = 'kate'; return; }
      if (m.wins.bungus >= FC.ROUNDS_TO_WIN) { m.phase = 'matchEnd'; m.matchWinner = 'bungus'; return; }
      if (m.phaseFrame >= ROUND_END_FRAMES) {
        m.round++; m.phase = 'roundStart'; m.phaseFrame = 0;
      }
      return;
    }
  }

  const API = { create, step, ROUND_START_FRAMES, ROUND_END_FRAMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Match = API;
})(typeof window !== 'undefined' ? window : globalThis);
