import React, { useState, useEffect } from 'react';
import './App.css';

// --- Theme Colors (from requirements) ---
const COLORS = {
  primary: '#1976D2',
  secondary: '#90CAF9',
  accent: '#FFC107',
  win: '#43A047',
  draw: '#B0BEC5',
  x: '#1976D2',
  o: '#FFC107',
  boardBg: '#fcfcfd',
  tileBg: '#f5faff'
};

const BOARD_SIZE = 3;

const getEmptyBoard = () => Array(BOARD_SIZE * BOARD_SIZE).fill(null);

// --- Utility: Winner calculation
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let [a, b, c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function isBoardFull(squares) {
  return squares.every(x => x);
}

// --- Computer move: simple AI (random empty square or basic block/win)
function getComputerMove(squares, myMark, humanMark) {
  // First: win if possible
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      const copy = squares.slice();
      copy[i] = myMark;
      if (calculateWinner(copy)) return i;
    }
  }
  // Block opponent win
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      const copy = squares.slice();
      copy[i] = humanMark;
      if (calculateWinner(copy)) return i;
    }
  }
  // Otherwise: pick center, corner, or random empty
  if (!squares[4]) return 4;
  const corners = [0, 2, 6, 8].filter(i => !squares[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const empties = squares.map((v, i) => v ? null : i).filter(v => v !== null);
  return empties[Math.floor(Math.random() * empties.length)];
}

// --- COMPONENTS ---

// PUBLIC_INTERFACE
function App() {
  // -------- State --------
  const [mode, setMode] = useState("pvc"); // "pvp" or "pvc"
  const [board, setBoard] = useState(getEmptyBoard());
  const [xIsNext, setXIsNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState(null); // {winner, line}
  const [draw, setDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [animating, setAnimating] = useState(false); // For minimal tile animation
  const [startingPlayer, setStartingPlayer] = useState("X"); // Alternates after reset

  // Theme for accessibility (shares previous toggler logic)
  const [theme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // -------- Handlers --------

  // PUBLIC_INTERFACE
  function handleModeChange(evt) {
    const m = evt.target.value;
    setMode(m);
    resetGame(m);
  }

  // PUBLIC_INTERFACE
  function handleClick(idx) {
    if (board[idx] || winnerInfo || draw || (mode === "pvc" && !xIsNext)) return;
    const squares = board.slice();
    squares[idx] = xIsNext ? "X" : "O";
    animateSquare(idx);
    applyMove(squares);
  }

  // Apply new board and check win/draw
  function applyMove(squares) {
    setBoard(squares);
    const result = calculateWinner(squares);
    if (result) {
      setWinnerInfo(result);
      setTimeout(() => setScores(s => ({
        ...s,
        [result.winner]: s[result.winner] + 1
      })), 300);
    } else if (isBoardFull(squares)) {
      setDraw(true);
    } else {
      setXIsNext(x => !x);
    }
  }

  // Minimal tile animation trigger
  function animateSquare(idx) {
    setAnimating(idx);
    setTimeout(() => setAnimating(false), 160);
  }

  // Computer move (delayed for animation)
  useEffect(() => {
    if (
      mode === "pvc" &&
      !winnerInfo &&
      !draw &&
      !xIsNext
    ) {
      const timeout = setTimeout(() => {
        const move = getComputerMove(board, "O", "X");
        if (move !== undefined) {
          const squares = board.slice();
          squares[move] = "O";
          animateSquare(move);
          applyMove(squares);
        }
      }, 380);
      return () => clearTimeout(timeout);
    }
  }, [board, winnerInfo, draw, mode, xIsNext]);

  // Reset game, alternate start player in PvC for fairness
  // PUBLIC_INTERFACE
  function resetGame(newMode) {
    setBoard(getEmptyBoard());
    setWinnerInfo(null);
    setDraw(false);
    const nextStart =
      newMode === "pvp"
        ? startingPlayer === "X" ? "O" : "X"
        : startingPlayer === "X" ? "O" : "X";
    setStartingPlayer(nextStart);
    setXIsNext(newMode ? true : nextStart === "X");
    // In PvC, O (computer) can start
    if (newMode === "pvc" && nextStart === "O") {
      setTimeout(() => {
        const move = getComputerMove(getEmptyBoard(), "O", "X");
        const squares = getEmptyBoard();
        squares[move] = "O";
        animateSquare(move);
        setBoard(squares);
        setXIsNext(true); // X goes after computer
      }, 500);
    }
  }

  // PUBLIC_INTERFACE
  function handleResetScores() {
    setScores({ X: 0, O: 0 });
    resetGame(mode);
  }

  // --------- RENDER ---------
  return (
    <div className="App" style={{
      fontFamily: 'system-ui, Segoe UI, Arial, sans-serif',
      background: COLORS.boardBg,
      minHeight: '100vh'
    }}>
      <main className="ttt-container">
        <header className="ttt-header">
          <h1 className="ttt-title" style={{
            fontWeight: 700,
            fontSize: '2.1rem',
            color: COLORS.primary,
            marginBottom: 4,
            letterSpacing: 1,
          }}>
            Tic Tac Toe
          </h1>
          <p className="ttt-subtitle" style={{
            color: '#333',
            marginBottom: 8,
            fontWeight: 300,
            fontSize: 16,
            opacity: 0.85
          }}>
            Modern & Minimalist • {mode === "pvp" ? "Player vs Player" : "Player vs Computer"}
          </p>
          <div className="ttt-scoreboard" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '16px 0 12px 0',
            gap: 30,
          }}>
            <ScoreCard
              label="X"
              value={scores.X}
              color={COLORS.x}
              active={xIsNext && !winnerInfo && !draw}
            />
            <span style={{
              fontSize: 18, letterSpacing: 2, color: COLORS.secondary,
              fontWeight: 500,
              opacity: 0.5
            }}>–</span>
            <ScoreCard
              label="O"
              value={scores.O}
              color={COLORS.o}
              active={!xIsNext && !winnerInfo && !draw}
            />
          </div>
        </header>

        <section aria-label="Tic Tac Toe board" className="ttt-board-section">
          <GameBoard
            board={board}
            winningLine={winnerInfo ? winnerInfo.line : null}
            onTileClick={handleClick}
            animatingIndex={animating}
            disabled={Boolean(winnerInfo) || draw || (mode === "pvc" && !xIsNext)}
          />
        </section>

        <section className="ttt-info-section">
          {winnerInfo ? (
            <div className="ttt-info-message"
              style={{
                background: COLORS.win,
                color: '#fff',
                borderRadius: 7,
                letterSpacing: 1,
                fontSize: 20,
                fontWeight: 600,
                minHeight: '2.5em',
                padding: '9px 18px',
                margin: '18px 0'
              }}>
              {/* Winner animation */}
              🥳 {winnerInfo.winner} wins!
            </div>
          ) : draw ? (
            <div className="ttt-info-message"
              style={{
                background: COLORS.draw,
                color: COLORS.primary,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 19,
                minHeight: '2.5em',
                padding: '8px 16px',
                margin: '18px 0'
              }}>
              🤝 It’s a draw!
            </div>
          ) : (
            <div style={{
              marginTop: 22,
              minHeight: '2.5em',
              color: COLORS.secondary,
              fontWeight: 500,
              fontSize: 17
            }}>
              {mode === "pvp"
                ? (
                  <span>
                    <strong style={{ color: xIsNext ? COLORS.x : COLORS.o }}>
                      {xIsNext ? 'X' : 'O'}
                    </strong>’s turn
                  </span>
                )
                : (
                  <span>
                    {xIsNext ? (
                      <span><strong style={{ color: COLORS.x }}>You (X)</strong> – your move</span>
                    ) : (
                      <span><strong style={{ color: COLORS.o }}>Computer (O)</strong> is thinking…</span>
                    )}
                  </span>
                )
              }
            </div>
          )}
        </section>

        <section className="ttt-controls-section"
          style={{
            margin: '30px 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 14
          }}>
          <div className="ttt-modes">
            <label style={{ marginRight: 15, fontWeight: 500, fontSize: 15 }}>
              <input
                type="radio"
                name="mode"
                value="pvc"
                checked={mode === "pvc"}
                onChange={handleModeChange}
                style={{
                  accentColor: COLORS.accent,
                  marginRight: 7
                }} />
              Player vs Computer
            </label>
            <label style={{ fontWeight: 500, fontSize: 15 }}>
              <input
                type="radio"
                name="mode"
                value="pvp"
                checked={mode === "pvp"}
                onChange={handleModeChange}
                style={{
                  accentColor: COLORS.accent,
                  marginRight: 7
                }} />
              Player vs Player
            </label>
          </div>
          <div className="ttt-action-btns" style={{ marginTop: 6, display: 'flex', gap: 14 }}>
            <Button onClick={() => resetGame(mode)} color={COLORS.primary} ariaLabel="Restart game">
              🔄 Reset Game
            </Button>
            <Button onClick={handleResetScores} color={COLORS.accent} ariaLabel="Reset scores">
              🗑️ Reset Scores
            </Button>
          </div>
        </section>
        <footer className="ttt-footer" style={{
          marginTop: 40,
          fontSize: 14,
          color: "#B0BEC5",
          textAlign: 'center',
          fontWeight: 300
        }}>
          © {new Date().getFullYear()} Modern Tic Tac Toe
        </footer>
      </main>
    </div>
  );
}

// --- Score display card ---
function ScoreCard({ label, value, color, active }) {
  return (
    <div style={{
      minWidth: 60,
      borderRadius: 9,
      padding: '10px 18px',
      boxShadow: active ? `0 0 0 2px ${color}` : '0 1px 8px #ececec',
      background: active ? '#fffde7' : '#fafafd',
      border: active ? `2px solid ${color}` : '1px solid #e0e0e0',
      transition: '0.15s all',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <span style={{
        fontSize: 22,
        fontWeight: 700,
        color
      }}>{label}</span>
      <span style={{
        fontSize: 22,
        fontWeight: 600,
        color: '#495968',
        marginTop: 1
      }}>{value}</span>
    </div>
  )
}

// --- Game Board and Tile ---
function GameBoard({ board, winningLine, onTileClick, animatingIndex, disabled }) {
  return (
    <div className="ttt-board" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${BOARD_SIZE}, 68px)`,
      gridTemplateRows: `repeat(${BOARD_SIZE}, 68px)`,
      gap: 7,
      justifyContent: 'center',
      margin: '0 auto',
      padding: 13,
      background: COLORS.secondary + "12",
      borderRadius: 12,
      boxShadow: '0 8px 32px 0 rgba(60,90,130,0.09), 0 1.5px 2px 0 rgba(127,127,127,0.03)',
      border: `2.5px solid ${COLORS.primary}29`
    }}>
      {board.map((cell, idx) => (
        <Tile
          key={idx}
          value={cell}
          highlighted={winningLine && winningLine.includes(idx)}
          onClick={() => onTileClick(idx)}
          isAnimating={animatingIndex === idx}
          disabled={!!disabled || !!cell}
        />
      ))}
    </div>
  );
}

function Tile({ value, highlighted, onClick, isAnimating, disabled }) {
  return (
    <button
      className="ttt-tile"
      style={{
        background: highlighted
          ? COLORS.accent + '22'
          : COLORS.tileBg,
        border: highlighted
          ? `2.5px solid ${COLORS.accent}`
          : `1.5px solid #e0e0e0`,
        color: value === "X" ? COLORS.x : value === "O" ? COLORS.o : "#aaa",
        fontWeight: 700,
        fontSize: 30,
        borderRadius: 11,
        outline: 'none',
        boxShadow: '0 2px 16px 0 rgba(60,90,130,0.10)',
        cursor: disabled ? "not-allowed" : "pointer",
        transition: 'background 0.18s, border 0.20s, box-shadow 0.23s, color 0.18s, transform 0.18s',
        transform: isAnimating ? 'scale(1.11)' : 'scale(1.0)',
        opacity: disabled && !highlighted ? 0.60 : 1.0,
        zIndex: highlighted ? 2 : 1,
        boxSizing: 'border-box'
      }}
      onClick={onClick}
      aria-label={`Board position: ${value ? value : 'empty'}`}
      disabled={disabled}
      tabIndex={0}
    >{value ? value : ""}</button>
  );
}

// --- Reusable Button ---
function Button({ children, onClick, color, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      className="ttt-btn"
      style={{
        background: color,
        border: 'none',
        color: '#fff',
        borderRadius: 7,
        fontWeight: 600,
        fontSize: 15.5,
        letterSpacing: 0.2,
        padding: '10px 23px',
        boxShadow: '0 1px 14px 0 rgba(25,118,210,0.09)',
        cursor: 'pointer',
        transition: 'background 0.13s, transform 0.13s',
        outline: 'none'
      }}
      aria-label={ariaLabel}
      tabIndex={0}
    >{children}</button>
  )
}

export default App;
