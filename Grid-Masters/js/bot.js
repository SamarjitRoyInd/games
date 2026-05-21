/**
 * bot.js - Dots & Boxes AI
 *
 * Easy mode:  Completes a box if one is available, otherwise picks randomly.
 *             This gives it a basic score without being a strategic threat.
 *
 * Smart mode: Three-tier priority
 *   1. Complete a box immediately (grab any free point).
 *   2. Avoid giving away a box (don't draw the 3rd side of any cell).
 *   3. Double-cross: when forced into unsafe territory, pick the move that
 *      opens the shortest chain — sacrifice as few boxes as possible.
 */
const Bot = (() => {

  /** Public: return the line ID the bot wants to play, or null if no moves left. */
  function getMove(state) {
    const available = getAvailable(state);
    if (available.length === 0) return null;

    if (state.botDifficulty === 'easy') {
      return getEasyMove(state, available);
    }
    return getSmartMove(state, available);
  }

  /* -- Easy logic: complete boxes, otherwise random ----------- */

  function getEasyMove(state, available) {
    // Still grabs a box if one is sitting there — but does nothing defensive
    const completers = available.filter(l => wouldCompleteBox(l, state));
    if (completers.length > 0) return randomFrom(completers);
    return randomFrom(available);
  }

  /* -- Smart logic -------------------------------------------- */

  function getSmartMove(state, available) {
    // P1: Complete a box right now
    const completers = available.filter(l => wouldCompleteBox(l, state));
    if (completers.length > 0) return randomFrom(completers);

    // P2: Safe moves - don't create a 3rd side on any cell
    const safe = available.filter(l => !wouldGive3rdSide(l, state));
    if (safe.length > 0) return randomFrom(safe);

    // P3: All remaining moves will gift the opponent at least one box.
    //     Pick the move that opens the shortest chain (minimise damage).
    return minimiseDamage(available, state);
  }

  /** Returns true if drawing `line` would complete any box (4th side). */
  function wouldCompleteBox(line, state) {
    return Utils.getAffectedBoxes(line, state.gridSize)
      .some(([r, c]) => Utils.countBoxSides(r, c, state.lines) === 3);
  }

  /**
   * Returns true if drawing `line` would create a 3rd side on any unclaimed box.
   * (That gives the opponent an easy point next turn.)
   */
  function wouldGive3rdSide(line, state) {
    return Utils.getAffectedBoxes(line, state.gridSize)
      .some(([r, c]) => {
        const boxId = 'b-' + r + '-' + c;
        const alreadyClaimed = state.boxes.has(boxId);
        return !alreadyClaimed && Utils.countBoxSides(r, c, state.lines) === 2;
      });
  }

  /**
   * Among unsafe moves, pick the one that gives the opponent the fewest
   * immediately-chainable boxes. This is the "double-cross" heuristic.
   */
  function minimiseDamage(available, state) {
    let bestMove = available[0];
    let bestScore = Infinity;

    for (const line of available) {
      const score = chainScore(line, state);
      if (score < bestScore) {
        bestScore = score;
        bestMove  = line;
      }
    }
    return bestMove;
  }

  /**
   * Estimate how many boxes become immediately capturable (3-sided) after
   * drawing `line`. Lower is better for the bot.
   */
  function chainScore(line, state) {
    const tempLines = new Set(state.lines);
    tempLines.add(line);
    let count = 0;
    const N = state.gridSize;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!state.boxes.has('b-' + r + '-' + c) &&
            Utils.countBoxSides(r, c, tempLines) === 3) {
          count++;
        }
      }
    }
    return count;
  }

  /* -- Helpers ----------------------------------------------- */

  function getAvailable(state) {
    return Utils.getAllLines(state.gridSize).filter(l => !state.lines.has(l));
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  return { getMove };
})();
