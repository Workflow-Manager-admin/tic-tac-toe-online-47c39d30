import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * MAIN APP COMPONENT
 * Implements a full-featured Tic Tac Toe game with theme toggle, score, mode, and win/draw logic.
 */

// Styling constants for theme and animations
const PRIMARY = "#1976D2";
const SECONDARY = "#90CAF9";
const ACCENT = "#FFC107";

// PUBLIC_INTERFACE
function App() {
  // Game state
  const [theme, setTheme] = useState("light");
  const [mode, setMode] = useState("pvp"); // 'pvp' or 'pvc'
  const [board, setBoard] = useState(Array(9).fill(null)); // 3x3
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, Draw: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("");
  const [animateBoard, setAnimateBoard] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Inject theme variables for custom palette
    document.documentElement.style.setProperty("--ttt-primary", PRIMARY);
    document.documentElement.style.setProperty("--ttt-secondary", SECONDARY);
    document.documentElement.style.setProperty("--ttt-accent", ACCENT);
  }, [theme]);

  // Helper to reset the board
  // PUBLIC_INTERFACE
  function handleReset() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setGameOver(false);
    setStatus("");
    setAnimateBoard(true); // triggers slight board animation
    setTimeout(() => setAnimateBoard(false), 350);
  }

  // Helper to change mode and reset game
  // PUBLIC_INTERFACE
  function handleModeChange(newMode) {
    setMode(newMode);
    handleReset();
    setScores({ X: 0, O: 0, Draw: 0 });
  }

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }

  // Handle a board square click
  // PUBLIC_INTERFACE
  function handleClick(i) {
    if (board[i] || gameOver) return;
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? "X" : "O";
    setBoard(newBoard);

    const result = calculateWinner(newBoard);
    if (result) {
      // Win detected
      setScores((s) => ({
        ...s,
        [result.winner]: s[result.winner] + 1,
      }));
      setStatus(
        result.winner === "Draw"
          ? "It's a draw!"
          : `Player ${result.winner} wins!`
      );
      setGameOver(true);
    } else {
      setXIsNext(!xIsNext);
    }
  }

  // Computer move logic (basic AI: pick random available, or block/win if possible)
  useEffect(() => {
    if (
      mode === "pvc" &&
      !gameOver &&
      !xIsNext &&
      board.filter((sq) => !sq).length > 0
    ) {
      const timeout = setTimeout(() => {
        const move = computerMove(board, "O", "X");
        handleClick(move);
      }, 600);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [board, xIsNext, mode, gameOver]);

  // Restart game on game over if board changes
  useEffect(() => {
    const result = calculateWinner(board);
    if (result && !gameOver) {
      setGameOver(true);
      setScores((s) => ({
        ...s,
        [result.winner]: s[result.winner] + 1,
      }));
      setStatus(
        result.winner === "Draw"
          ? "It's a draw!"
          : `Player ${result.winner} wins!`
      );
    }
    // Show status during play
    if (!result && !gameOver) {
      setStatus(
        `Turn: ${mode === "pvp"
          ? xIsNext
            ? "Player X"
            : "Player O"
          : xIsNext
          ? "You (X)"
          : "Computer (O)"
        }`
      );
    }
    // eslint-disable-next-line
  }, [board, xIsNext, mode]);

  // PUBLIC_INTERFACE
  return (
    <div className="App ttt-app">
      <header className="App-header ttt-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <ScoreBoard scores={scores} mode={mode} />
        <div className="ttt-status" style={{ marginBottom: 16 }}>
          {status}
        </div>
        <ModeToggle current={mode} setMode={handleModeChange} />
        <div
          className={`ttt-board-container${animateBoard ? " ttt-animate" : ""}`}
        >
          <Board
            squares={board}
            onClick={handleClick}
            winLine={calculateWinner(board)?.line}
            disabled={gameOver || (mode === "pvc" && !xIsNext)}
          />
        </div>
        <div className="ttt-controls">
          <button className="ttt-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
        <footer className="ttt-footer">
          <span>
            {mode === "pvp"
              ? "Player vs Player"
              : "Player vs Computer (You = X, Computer = O)"}
          </span>
        </footer>
      </header>
    </div>
  );
}

// PUBLIC_INTERFACE
function ScoreBoard({ scores, mode }) {
  return (
    <div className="ttt-scoreboard">
      <div>
        <span className="ttt-x-ind">X</span> {scores.X}
      </div>
      <div>
        <span className="ttt-draw-ind">Draw</span> {scores.Draw}
      </div>
      <div>
        <span className="ttt-o-ind">O</span> {scores.O}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function ModeToggle({ current, setMode }) {
  return (
    <div className="ttt-mode-toggle">
      <button
        className={`ttt-btn${current === "pvp" ? " ttt-btn-selected" : ""}`}
        onClick={() => setMode("pvp")}
        aria-pressed={current === "pvp"}
      >
        PvP
      </button>
      <button
        className={`ttt-btn${current === "pvc" ? " ttt-btn-selected" : ""}`}
        onClick={() => setMode("pvc")}
        aria-pressed={current === "pvc"}
      >
        PvC
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function Board({ squares, onClick, winLine = [], disabled }) {
  // Animate winning line - pass class on winning cells
  return (
    <div className="ttt-board">
      {squares.map((val, i) => (
        <Square
          key={i}
          value={val}
          onClick={() => onClick(i)}
          animated={winLine.includes(i)}
          disabled={!!val || disabled}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function Square({ value, onClick, animated, disabled }) {
  return (
    <button
      className={`ttt-square${animated ? " ttt-square-win" : ""}`}
      onClick={onClick}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-label={`Board cell: ${value ? value : "empty"}`}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function calculateWinner(squares) {
  // Returns {winner: 'X'|'O'|'Draw', line: [indexes]}
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line };
    }
  }
  if (squares.every((sq) => !!sq)) {
    return { winner: "Draw", line: [] };
  }
  return null;
}

// PUBLIC_INTERFACE
function computerMove(board, ai, player) {
  // Win if possible
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const test = board.slice();
      test[i] = ai;
      if (calculateWinner(test)?.winner === ai) return i;
    }
  }
  // Block if player about to win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const test = board.slice();
      test[i] = player;
      if (calculateWinner(test)?.winner === player) return i;
    }
  }
  // Default: pick random available
  const moves = [];
  for (let i = 0; i < 9; i++) if (!board[i]) moves.push(i);
  return moves[Math.floor(Math.random() * moves.length)];
}

export default App;
