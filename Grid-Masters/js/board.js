// board.js - SVG renderer for Grid Masters
// Colour scheme: dark board, gold dots, teal P1, orange P2/bot
const Board = (() => {

  const CELL   = 60;
  const PAD    = 38;
  const DOT_R  = 5.5;
  const HIT_W  = 22;
  const LINE_W = 4.5;

  const C = {
    dot:         '#FFD700',
    linePlayer:  '#75bdd1',   // teal  - player 1
    lineBot:     '#ff6a00',   // orange - player 2 / bot
    lineHover1:  'rgba(117,189,209,0.38)',
    lineHover2:  'rgba(255,106,0,0.38)',
    boxPlayer:   'rgba(117,189,209,0.20)',
    boxBot:      'rgba(255,106,0,0.20)',
    labelPlayer: 'rgba(173,236,255,0.70)',
    labelBot:    'rgba(255,219,204,0.70)',
  };

  // Small dot-grid preview for Setup screen
  function renderPreview(svg, N) {
    const cs = 22, pad = 14;
    const sz = 2 * pad + N * cs;
    svg.setAttribute('viewBox', '0 0 ' + sz + ' ' + sz);
    svg.innerHTML = '';
    for (let r = 0; r <= N; r++) {
      for (let c = 0; c <= N; c++) {
        svg.appendChild(_el('circle', {
          cx: pad + c * cs, cy: pad + r * cs,
          r: 2.2, fill: '#FFD700', opacity: '0.7'
        }));
      }
    }
  }

  // Full re-render of the game board
  function render(svg, state, onLineClick) {
    const N  = state.gridSize;
    const sz = 2 * PAD + N * CELL;

    // In 2P mode every turn is human; in 1P only turn 0 is human
    const isMyTurn = !state.gameOver && (state.twoPlayer || state.currentTurn === 0);

    svg.setAttribute('viewBox', '0 0 ' + sz + ' ' + sz);
    svg.innerHTML = '';

    // Layer 1: Box fills + owner label
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const owner = state.boxes.get('b-' + r + '-' + c);
        const { x, y } = _dot(r, c);

        svg.appendChild(_el('rect', {
          x, y, width: CELL, height: CELL,
          fill: owner === 0 ? C.boxPlayer : owner === 1 ? C.boxBot : 'none',
          rx: 4
        }));

        if (owner !== undefined) {
          const label = _el('text', {
            x: x + CELL / 2, y: y + CELL / 2,
            'text-anchor': 'middle', 'dominant-baseline': 'middle',
            'font-family': 'Rubik, system-ui, sans-serif',
            'font-size': Math.max(9, Math.round(CELL * 0.26)),
            'font-weight': '800',
            fill: owner === 0 ? C.labelPlayer : C.labelBot,
            'pointer-events': 'none', 'user-select': 'none'
          });
          label.textContent = owner === 0
            ? (state.playerInitial  || 'P1')
            : (state.twoPlayer ? (state.player2Initial || 'P2') : 'B');
          svg.appendChild(label);
        }
      }
    }

    // Layer 2: Lines
    for (const lineStr of Utils.getAllLines(N)) {
      _renderLine(svg, lineStr, state, isMyTurn, onLineClick);
    }

    // Layer 3: Dots (always on top)
    for (let r = 0; r <= N; r++) {
      for (let c = 0; c <= N; c++) {
        const { x, y } = _dot(r, c);
        svg.appendChild(_el('circle', {
          cx: x, cy: y, r: DOT_R, fill: C.dot,
          'pointer-events': 'none',
          filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.6))'
        }));
      }
    }
  }

  function _renderLine(svg, lineStr, state, isMyTurn, onLineClick) {
    const { type, row: r, col: c } = Utils.parseLineId(lineStr);
    const drawn = state.lines.has(lineStr);
    const owner = drawn ? state.lineOwners.get(lineStr) : undefined;

    let x1, y1, x2, y2;
    if (type === 'h') {
      ({ x: x1, y: y1 } = _dot(r, c));
      ({ x: x2, y: y2 } = _dot(r, c + 1));
    } else {
      ({ x: x1, y: y1 } = _dot(r, c));
      ({ x: x2, y: y2 } = _dot(r + 1, c));
    }

    const lineEl = _el('line', {
      x1, y1, x2, y2,
      stroke: drawn ? (owner === 0 ? C.linePlayer : C.lineBot) : 'transparent',
      'stroke-width': LINE_W, 'stroke-linecap': 'round',
      'pointer-events': 'none'
    });
    svg.appendChild(lineEl);

    if (!drawn && isMyTurn) {
      // Hover colour reflects which player is about to move
      const hoverColor = (state.twoPlayer && state.currentTurn === 1)
        ? C.lineHover2
        : C.lineHover1;

      const hit = _el('line', {
        x1, y1, x2, y2,
        stroke: 'transparent', 'stroke-width': HIT_W,
        'stroke-linecap': 'round', cursor: 'pointer',
        'data-line': lineStr
      });
      hit.addEventListener('mouseenter', () => {
        lineEl.setAttribute('stroke', hoverColor);
        lineEl.setAttribute('stroke-dasharray', '8 5');
        lineEl.setAttribute('stroke-width', LINE_W - 0.5);
      });
      hit.addEventListener('mouseleave', () => {
        lineEl.setAttribute('stroke', 'transparent');
        lineEl.removeAttribute('stroke-dasharray');
        lineEl.setAttribute('stroke-width', LINE_W);
      });
      hit.addEventListener('click', () => onLineClick(lineStr));
      hit.addEventListener('touchend', (e) => {
        e.preventDefault();
        onLineClick(lineStr);
      }, { passive: false });
      svg.appendChild(hit);
    }
  }

  function _dot(r, c) {
    return { x: PAD + c * CELL, y: PAD + r * CELL };
  }

  function _el(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  return { render, renderPreview };
})();
