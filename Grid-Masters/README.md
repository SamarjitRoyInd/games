# Grid Masters 🟡

> A polished, mobile-friendly **Dots & Boxes** game built in pure vanilla JavaScript — no frameworks, no build tools.

![Grid Masters](assets/wood-bg.jpg)

---
## Live Preview

https://games-five-rust.vercel.app/

## Features

- **Two game modes** — Play solo against a Smart Bot, or challenge a friend locally (pass-and-play)
- **Smart AI** — Three-tier bot: completes boxes first, avoids gifting thirds, then double-crosses chains
- **Easy AI** — Grabs open boxes but otherwise plays randomly — a fair casual opponent
- **Configurable board** — 2 × 2 all the way up to 12 × 12
- **Bot thinking delay** — 2–8 second random delay with a live countdown so it feels natural
- **Background music + SFX** — Loops ambient music, plays a click on every line draw; mutable globally
- **External audio API** — Control mute state from the browser console or a parent page
- **Save & Resume** — Game state persisted to `localStorage`; resume mid-game after closing the tab
- **Confetti on win** — CSS particle burst fires when any player wins
- **Responsive layout** — Works on mobile and scales up to large desktop boards
- **Wood-grain aesthetic** — Warm walnut background, dark board, gold dots, teal vs orange colour scheme

---

## How to Play

Dots & Boxes is a classic pencil-and-paper game:

1. Players take turns drawing one line between two adjacent dots.
2. If your line **completes a box** (the 4th side), you claim it and get to draw again.
3. The player with the **most boxes** when the board is full wins.

---

## Game Modes

| Mode | Description |
|------|-------------|
| **vs Bot — Easy** | Bot completes any open box but otherwise plays randomly |
| **vs Bot — Smart** | Full three-tier AI: complete → safe → minimise chain damage |
| **vs Friend** | Two humans share the screen and alternate turns (pass-and-play) |

---

## Controls

| Action | Input |
|--------|-------|
| Draw a line | Click or tap a gap between two dots |
| Mute / unmute | Button (top-right corner) |
| Quit mid-game | × button in the game header (state is auto-saved) |
| Resume | "Resume Game" on the main menu |

---

## External Audio API

Grid Masters exposes a global API so a parent page or integration can control audio:

```js
// Toggle mute — returns true if now muted
GridMasters.toggleMute();

// Explicit mute / unmute
GridMasters.mute();
GridMasters.unmute();

// Query current state
GridMasters.isMuted(); // → boolean
```

---

## Tech Stack

| Layer | Details |
|-------|---------|
| Language | Vanilla JavaScript (ES6+), no frameworks |
| Styling | Tailwind CSS (CDN), custom CSS animations |
| Fonts | Rubik (Google Fonts), Material Symbols Outlined |
| Animation | CSS keyframes for confetti; Lottie (CDN) for optional overlay |
| Audio | Web Audio API via `<audio>` elements |
| Board | SVG, fully re-rendered each turn |
| Persistence | `localStorage` |

---

## Folder Structure

```
Grid-Masters/
├── index.html          # Single-page app — all four screens
├── README.md
├── assets/
│   ├── music.mp3       # Background music (loops)
│   ├── sfx.mp3         # Line-draw sound effect
│   ├── confetti.json   # Lottie confetti animation data
│   └── wood-bg.jpg     # Tiled wood-grain background (8 KB)
├── css/
│   ├── base.css        # Screen system, animations, layout tokens
│   └── game.css        # Board SVG, score cards, victory screen styles
└── js/
    ├── utils.js        # Grid helpers (line IDs, box-side counting)
    ├── bot.js          # Easy & Smart AI
    ├── audio.js        # Music/SFX manager + GridMasters external API
    ├── board.js        # SVG renderer
    ├── game.js         # State management & turn loop
    └── main.js         # Screen routing, setup form, result display
```

---

## Running Locally

No build step needed — just open the file:

```bash
# Option 1: open directly
open index.html   # macOS
start index.html  # Windows

# Option 2: serve with any static server (avoids audio autoplay restrictions)
npx serve .
# or
python3 -m http.server 8080
```

> **Tip:** Some browsers block audio autoplay on `file://` URLs. Serving via a local HTTP server (option 2) ensures music starts correctly on the first click.

---

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

*Built with ❤️ using vanilla JS — no dependencies, no bundler, no fuss.*
