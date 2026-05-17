# Dots & Boxes — Game Plan

## 1. Concept Overview

A browser-based, native JavaScript implementation of the classic **Dots & Boxes** pen-and-paper game.  
Players take turns drawing lines between adjacent dots. Completing the 4th side of a box earns a point and an extra turn. The player with the most boxes when the grid is full wins.

**Launch Scope:** Single-player vs Smart Bot (1v1)  
**Visual Style:** Clean & Minimal  
**Default Grid:** 5×5 (user-selectable up to 12×12)  
**Tech:** Vanilla HTML + CSS + JS — no frameworks, no build tools

---

## 2. Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1 (MVP)** | 1 vs 1 — Player vs Smart Bot | 🔨 Plan Ready |
| **Phase 2** | 1 vs 1 — Player vs Remote Player (WebSocket/WebRTC) | Future |
| **Phase 3** | 2–4 Players (mixed human + bot) on shared board | Future |

---

## 3. File Structure

```
/
├── index.html          # Entry point — landing/main menu screen
├── game.html           # Game board screen
├── css/
│   ├── base.css        # Reset, CSS variables, typography
│   ├── menu.css        # Main menu & setup screen styles
│   └── game.css        # Board, dots, lines, score panel
├── js/
│   ├── main.js         # Menu logic, game setup, screen routing
│   ├── game.js         # Core game loop & state management
│   ├── board.js        # Board rendering (canvas or SVG)
│   ├── bot.js          # Smart bot AI
│   └── utils.js        # Shared helpers (line ID, neighbour checks)
└── assets/
    └── sounds/         # (optional) soft click, box-claim chime
```

Single-file alternative: all screens in one `index.html` with JS-toggled views — easier to host anywhere without a server. **Recommended for MVP.**

---

## 4. Screens & User Flow

```
[Landing / Main Menu]
        |
        ▼
[Setup Screen]
  · Board size picker (5×5 → 12×12, step by 1)
  · Player 1 name (optional)
  · Bot difficulty (Easy / Smart) — Smart is default
        |
        ▼
[Game Board]
  · Live score panel (Player vs Bot)
  · Turn indicator
  · Board (dots + lines + filled boxes)
        |
    Game Over?
        |
        ▼
[Result Screen]
  · Winner announcement
  · Final score breakdown
  · [Play Again] [Change Settings] [Menu]
```

---

## 5. Core Game Logic

### 5.1 Data Model

The entire game state lives in a single plain JS object — easy to snapshot for undo/resume later.

```js
state = {
  gridSize: 5,            // N — creates an N×N box grid with (N+1)×(N+1) dots
  lines: Set<lineId>,     // all drawn lines (both players)
  boxes: Map<boxId, owner>, // claimed boxes: 0 = player, 1 = bot
  scores: [0, 0],
  currentTurn: 0,         // 0 = player, 1 = bot
  gameOver: false
}
```

**Line ID convention:** `"h-r-c"` for a horizontal line at row r, col c  
and `"v-r-c"` for a vertical line. This gives every edge a unique, derivable key — no arrays to index into.

**Box ID convention:** `"b-r-c"` for the box whose top-left dot is at (r, c).

### 5.2 Line → Box Resolution

When a line is drawn, check each box that shares that edge (1 or 2 boxes). For each:
1. Count how many of its 4 sides are in `state.lines`.
2. If count === 4 → mark as claimed, add to score, grant extra turn.

This is the only check needed after every move. O(1) per move.

### 5.3 Turn Flow

```
Player clicks a line
  → Validate (not already drawn, correct turn)
  → Draw line → check boxes → update score
  → If box claimed: player goes again
  → Else: switch turn to Bot
    → Bot calculates move (see §6)
    → Draw bot line → check boxes → update score
    → If box claimed: bot goes again (loop)
    → Else: switch turn to Player
  → Check if all boxes filled → game over
```

---

## 6. Smart Bot AI

The bot uses a **greedy chain-aware strategy** — not full game-tree search, but good enough to feel like a real opponent.

### Priority Order (evaluated every turn):

1. **Win a box now** — if any single line completes a box, play it immediately.  
2. **Avoid 3-sided boxes** — never draw the 3rd side of an open box (handing opponent an easy point).  
3. **Safe random** — if all remaining moves risk giving away boxes, apply the *double-cross* heuristic:  
   - Find the shortest chain of 3-sided boxes and offer *only* 2 of them to the opponent (sacrifice minimum), forcing them to open a longer chain back.
4. **Fallback** — random safe move.

This covers ~80% of intermediate play without tree search. Upgrade to minimax in Phase 2 for "Hard" mode.

---

## 7. Board Rendering

Use **SVG** (not Canvas) for the board — cleaner for hit-testing line clicks, easier to style with CSS.

### SVG Layout

- Dots: `<circle>` elements, evenly spaced
- Lines: `<line>` elements, initially invisible (`opacity: 0`), revealed on click
- Hover lines: thin ghost line follows cursor to show where you'd draw
- Boxes: `<rect>` elements per cell, fill colour changes when claimed
- Each clickable line segment has a transparent hit-area `<line>` (thicker stroke, `opacity: 0`) for easy mouse/touch targeting

### Responsive Sizing

Board SVG uses `viewBox` with `width: 100%` so it scales with the container. Dot spacing is computed as:

```js
cellSize = Math.floor(Math.min(boardContainerWidth, boardContainerHeight) / (gridSize + 1))
```

This ensures the board always fits the window on resize, including on mobile.

---

## 8. UI Design System (Clean & Minimal)

### Colour Palette

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#F5F5F0` | Page background |
| `--board-bg` | `#FFFFFF` | Board card |
| `--dot` | `#2D2D2D` | Grid dots |
| `--line-player` | `#3B82F6` | Player 1 drawn lines (blue) |
| `--line-bot` | `#EF4444` | Bot drawn lines (red) |
| `--box-player` | `#BFDBFE` | Player claimed box fill |
| `--box-bot` | `#FEE2E2` | Bot claimed box fill |
| `--accent` | `#3B82F6` | Buttons, active states |
| `--text` | `#111827` | Primary text |
| `--muted` | `#6B7280` | Score labels, secondary text |

### Typography

- Font: **Inter** (Google Fonts CDN) — clean, no-fuss
- Game title: 2rem bold
- Score: 2.5rem tabular-numbers
- Turn label: 0.875rem uppercase tracked

### Interaction Feedback

- Undrawn line hover: faint ghost line (dashed, 30% opacity)
- Line drawn: smooth `stroke-dashoffset` animation (0.15s)
- Box claimed: `fill` fade-in (0.2s)
- Score update: brief scale pulse on the score counter
- Turn indicator: coloured dot beside player name slides/fades between players

---

## 9. Setup Screen Specs

| Element | Detail |
|---------|--------|
| Board size | Stepper input: `−` / value / `+` buttons, range 2–12, default 5 |
| Player name | Text input, max 12 chars, placeholder "You" |
| Bot difficulty | Toggle: Easy / Smart |
| Start button | Disabled until grid size confirmed |
| Visual preview | Small live dot-grid preview that updates as size changes |

---

## 10. Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| > 768px | Side-by-side: score panel left, board right |
| ≤ 768px | Stacked: score panel top, board below |
| Board max-width | `min(90vw, 90vh)` — always square and visible |

---

## 11. Future Phase Notes (don't build yet, but design for it)

### Phase 2 — Remote 1v1
- Replace `bot.js` with a `network.js` module using **WebSocket** (or Peer.js for P2P)
- Game state already serialisable (plain JS object → JSON) — just broadcast on every move
- Need: room code system, reconnect logic, turn validation server-side

### Phase 3 — Multiplayer (2–4 players)
- `scores` array expands from `[0,0]` to `[0,0,0,0]`
- `currentTurn` becomes an index into player array (mod N)
- Each player gets a distinct colour token (add `--line-p3`, `--line-p4`)
- Bot slots: any player index can be `type: "bot"` — same AI module
- Board size recommendation: 8×8+ for 4 players

---

## 12. Build Order (Phase 1)

1. `index.html` — shell + all screens as hidden `<div>`s  
2. `base.css` + `menu.css` — landing and setup screens  
3. `utils.js` — line/box ID helpers, neighbour lookups  
4. `board.js` — SVG board render from state  
5. `game.js` — state model, move handler, box detection, turn loop  
6. `bot.js` — smart bot (priority 1 → 2 → 3 → fallback)  
7. `game.css` — board styles, animations  
8. `main.js` — screen routing, setup form, game init  
9. Result screen + replay flow  
10. Responsive polish + cross-browser test  

Estimated complexity: **~600–900 lines** of JS across all files, ~300 lines CSS.

---

## 13. Open Decisions (resolve before build)

| # | Question | Recommendation |
|---|----------|---------------|
| 1 | Sound effects? | Start without — add toggle in settings later |
| 2 | Undo move? | No for MVP (bot would need to reverse) |
| 3 | Game save/resume? | `localStorage` snapshot — low effort, high value |
| 4 | Mobile touch? | Yes — SVG hit-areas work with `touchstart` |
| 5 | Animations on bot move? | Small delay (400ms) so bot doesn't feel instant |
