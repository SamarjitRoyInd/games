/**
 * utils.js — Grid helpers for Dots & Boxes
 *
 * Coordinate convention
 * ─────────────────────
 * An N×N game has (N+1)×(N+1) dots and N×N boxes.
 *
 * Line IDs
 *   Horizontal: "h-{row}-{col}"  row ∈ [0..N],   col ∈ [0..N-1]
 *   Vertical:   "v-{row}-{col}"  row ∈ [0..N-1],  col ∈ [0..N]
 *
 * Box IDs
 *   "b-{row}-{col}"  row ∈ [0..N-1],  col ∈ [0..N-1]
 *   The four sides of box(r,c):
 *     top    → h-(r)-(c)
 *     bottom → h-(r+1)-(c)
 *     left   → v-(r)-(c)
 *     right  → v-(r)-(c+1)
 */
const Utils = (() => {

  /** Build a line ID string */
  function lineId(type, row, col) {
    return `${type}-${row}-${col}`;
  }

  /** Decompose a line ID string */
  function parseLineId(id) {
    const [type, r, c] = id.split('-');
    return { type, row: +r, col: +c };
  }

  /**
   * Return every possible line for an N×N grid.
   * Total: (N+1)*N horizontal  +  N*(N+1) vertical  =  2*N*(N+1) lines.
   */
  function getAllLines(N) {
    const lines = [];
    // Horizontal lines
    for (let r = 0; r <= N; r++) {
      for (let c = 0; c < N; c++) {
        lines.push(lineId('h', r, c));
      }
    }
    // Vertical lines
    for (let r = 0; r < N; r++) {
      for (let c = 0; c <= N; c++) {
        lines.push(lineId('v', r, c));
      }
    }
    return lines;
  }

  /** Return the four side-IDs for box at (r, c) */
  function getBoxSides(r, c) {
    return [
      lineId('h', r,   c),    // top
      lineId('h', r+1, c),    // bottom
      lineId('v', r,   c),    // left
      lineId('v', r,   c+1),  // right
    ];
  }

  /**
   * Return the (up to 2) boxes that share this line edge.
   * Each entry is [row, col].
   */
  function getAffectedBoxes(id, N) {
    const { type, row: r, col: c } = parseLineId(id);
    const boxes = [];
    if (type === 'h') {
      if (r > 0)  boxes.push([r - 1, c]); // box above
      if (r < N)  boxes.push([r,     c]); // box below
    } else {
      if (c > 0)  boxes.push([r, c - 1]); // box to the left
      if (c < N)  boxes.push([r, c    ]); // box to the right
    }
    return boxes;
  }

  /** Count how many of a box's four sides are in the drawn-lines Set */
  function countBoxSides(r, c, linesSet) {
    return getBoxSides(r, c).filter(s => linesSet.has(s)).length;
  }

  return { lineId, parseLineId, getAllLines, getBoxSides, getAffectedBoxes, countBoxSides };
})();
