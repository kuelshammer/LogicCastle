import { BaseGameUI } from './modules/core/BaseGameUI.js';
import { BoardRenderer } from './components/BoardRenderer.js';
import { Connect4GameBitPacked } from './game.js';
import { createConnect4Config } from './connect4-config.js';

class ModularConnect4Game extends BaseGameUI {
  constructor() {
    const config = createConnect4Config('two-player');
    const wasmGame = new Connect4GameBitPacked();
    super(wasmGame, config);

    this.board = Array(6).fill(null).map(() => Array(7).fill(0));
    this.currentPlayer = 1;
    this.gameOver = false;
    this.winner = null;
    this.moveCount = 0;
    this.gameHistory = [];
    this.scores = { yellow: 0, red: 0 };
    this.boardRenderer = null;

    console.log('🎮 ModularConnect4Game created with BaseGameUI + BoardRenderer + WASM');
  }

  async init() {
    console.log('🔄 Initializing modular Connect4...');

    try {
      await this.wasmGame.init();
      console.log('✅ WASM Backend initialized successfully');
    } catch (error) {
      console.error('❌ WASM Backend initialization failed:', error);
      console.log('🔄 Continuing with legacy game logic...');
    }

    await super.init();
    this.initializeBoardRenderer();
    this.createBoard();
    this.setupEventListeners();
    this.updateUI();

    console.log('✅ Modular Connect4 initialized successfully');
    return true;
  }

  initializeBoardRenderer() {
    const gameBoard = document.getElementById('gameBoard');
    const topCoords = document.getElementById('topCoords');
    const bottomCoords = document.getElementById('bottomCoords');

    if (gameBoard) {
      this.boardRenderer = new BoardRenderer(gameBoard, topCoords, bottomCoords);
      console.log('🎯 BoardRenderer initialized');
    } else {
      console.error('❌ GameBoard element not found for BoardRenderer');
    }
  }

  createBoard() {
    if (this.boardRenderer) {
      const success = this.boardRenderer.initializeBoard();
      if (success) {
        this.boardRenderer.createCoordinateLabels();
        console.log('🎯 Board created using BoardRenderer');
      } else {
        console.error('❌ BoardRenderer initialization failed');
        this.fallbackCreateBoard();
      }
    } else {
      console.warn('⚠️ BoardRenderer not available, using fallback');
      this.fallbackCreateBoard();
    }
  }

  fallbackCreateBoard() {
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) {
      console.error('❌ Game board element not found');
      return;
    }

    gameBoard.innerHTML = '';

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = document.createElement('div');
        cell.className = 'game-slot relative bg-blue-500 rounded-full border-2 border-blue-700 cursor-pointer aspect-square flex items-center justify-center';
        cell.dataset.row = row;
        cell.dataset.col = col;

        const disc = document.createElement('div');
        disc.className = 'disc empty w-[85%] h-[85%] rounded-full';

        cell.appendChild(disc);
        gameBoard.appendChild(cell);
      }
    }

    console.log('🎯 Fallback board created with 42 cells');
  }

  setupEventListeners() {
    document.getElementById('gameBoard').addEventListener('click', (e) => {
      const cell = e.target.closest('.game-slot');
      if (cell && !this.gameOver) {
        const col = parseInt(cell.dataset.col);
        this.makeMove(col);
      }
    });

    document.querySelectorAll('.coord').forEach((coord, index) => {
      coord.addEventListener('click', () => {
        if (!this.gameOver) {
          this.makeMove(index);
        }
      });
    });

    document.getElementById('newGameBtn').addEventListener('click', () => {
      this.resetGame();
    });

    document.getElementById('undoBtn').addEventListener('click', () => {
      this.undoMove();
    });

    document.getElementById('resetScoreBtn').addEventListener('click', () => {
      this.resetScore();
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
      this.showModal('helpModal');
    });

    document.getElementById('assistanceBtn').addEventListener('click', () => {
      this.showModal('assistanceModal');
    });

    document.getElementById('closeHelpModal').addEventListener('click', () => {
      this.hideModal('helpModal');
    });

    document.getElementById('closeAssistanceModal').addEventListener('click', () => {
      this.hideModal('assistanceModal');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '7' && !this.gameOver) {
        const col = parseInt(e.key) - 1;
        this.makeMove(col);
      } else if (e.key === 'n' || e.key === 'N') {
        this.resetGame();
      } else if (e.key === 'u' || e.key === 'U') {
        this.undoMove();
      } else if (e.key === 'F1') {
        e.preventDefault();
        this.toggleModal('helpModal');
      } else if (e.key === 'F2') {
        e.preventDefault();
        this.toggleModal('assistanceModal');
      } else if (e.key === 'F3') {
        e.preventDefault();
        this.resetScore();
      } else if (e.key === 'Escape') {
        this.hideModal('helpModal');
        this.hideModal('assistanceModal');
      }
    });

    document.getElementById('helpModal').addEventListener('click', (e) => {
      if (e.target.id === 'helpModal') {
        this.hideModal('helpModal');
      }
    });

    document.getElementById('assistanceModal').addEventListener('click', (e) => {
      if (e.target.id === 'assistanceModal') {
        this.hideModal('assistanceModal');
      }
    });

    console.log('🎮 Event listeners set up');
  }

  makeMove(col) {
    if (this.gameOver || col < 0 || col >= 7) return false;

    if (this.wasmGame && this.wasmGame.initialized) {
      try {
        const moveResult = this.wasmGame.makeMove(col);

        this.board = moveResult.board;
        this.currentPlayer = moveResult.player === 1 ? 2 : 1;
        this.moveCount = moveResult.moveNumber;
        this.gameOver = moveResult.isGameOver;
        this.winner = moveResult.winner;

        const targetRow = this.findMoveRow(col, moveResult.board);
        if (targetRow !== -1) {
          this.updateCell(targetRow, col, moveResult.player);
        }

        if (moveResult.isGameOver) {
          if (moveResult.winner) {
            this.showWin(targetRow, col);
            this.updateScore();
          } else {
            this.showDraw();
          }
        }

        this.updateUI();
        return true;

      } catch (error) {
        console.error('❌ WASM move failed:', error);
        console.log('🔄 Falling back to legacy move logic...');
      }
    }

    return this.legacyMakeMove(col);
  }

  findMoveRow(col, board) {
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] !== 0) {
        return row;
      }
    }
    return -1;
  }

  legacyMakeMove(col) {
    let targetRow = -1;
    for (let row = 5; row >= 0; row--) {
      if (this.board[row][col] === 0) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) return false;

    this.gameHistory.push({
      row: targetRow,
      col: col,
      player: this.currentPlayer,
      board: this.board.map(row => [...row])
    });

    this.board[targetRow][col] = this.currentPlayer;
    this.moveCount++;

    this.updateCell(targetRow, col, this.currentPlayer);

    if (this.checkWin(targetRow, col)) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      this.showWin(targetRow, col);
      this.updateScore();
    } else if (this.moveCount === 42) {
      this.gameOver = true;
      this.winner = 0;
      this.showDraw();
    } else {
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    this.updateUI();
    return true;
  }

  checkWin(row, col) {
    const player = this.board[row][col];
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      const line = [[row, col]];

      for (let i = 1; i < 4; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) {
          count++;
          line.push([r, c]);
        } else {
          break;
        }
      }

      for (let i = 1; i < 4; i++) {
        const r = row - i * dr;
        const c = col - i * dc;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) {
          count++;
          line.push([r, c]);
        } else {
          break;
        }
      }

      if (count >= 4) {
        this.winningLine = line;
        return true;
      }
    }

    return false;
  }

  updateCell(row, col, player) {
    if (this.boardRenderer) {
      this.boardRenderer.updateBoardVisual(row, col, player);
    } else {
      const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (cell) {
        const disc = cell.querySelector('.disc');
        if (disc) {
          disc.classList.remove('empty', 'yellow', 'red');
          disc.classList.add(player === 1 ? 'yellow' : 'red');
        }
      }
    }
  }

  showWin(row, col) {
    const winnerName = this.currentPlayer === 1 ? 'Spieler 1 (Gelb)' : 'Spieler 2 (Rot)';

    if (this.winningLine) {
      this.winningLine.forEach(([r, c]) => {
        const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          const disc = cell.querySelector('.disc');
          if (disc) {
            disc.classList.add('winning-disc');
          }
        }
      });
    }

    const gameStatus = document.getElementById('gameStatus');
    if (gameStatus) {
      gameStatus.textContent = `${winnerName} gewinnt!`;
      gameStatus.className = 'font-semibold text-yellow-400';
    }

    console.log(`🏆 ${winnerName} gewinnt!`);
  }

  showDraw() {
    const gameStatus = document.getElementById('gameStatus');
    if (gameStatus) {
      gameStatus.textContent = 'Unentschieden!';
      gameStatus.className = 'font-semibold text-gray-400';
    }

    console.log('🤝 Unentschieden!');
  }

  updateScore() {
    if (this.winner === 1) {
      this.scores.yellow++;
    } else if (this.winner === 2) {
      this.scores.red++;
    }

    document.getElementById('yellowScore').textContent = this.scores.yellow;
    document.getElementById('redScore').textContent = this.scores.red;
  }

  resetScore() {
    this.scores = { yellow: 0, red: 0 };
    document.getElementById('yellowScore').textContent = '0';
    document.getElementById('redScore').textContent = '0';
    console.log('🔄 Score reset');
  }

  undoMove() {
    if (this.wasmGame && this.wasmGame.initialized && this.wasmGame.canUndo()) {
      try {
        const undoResult = this.wasmGame.undoMove();

        this.board = undoResult.currentState.board;
        this.currentPlayer = undoResult.currentState.currentPlayer;
        this.moveCount = undoResult.currentState.moveCount;
        this.gameOver = undoResult.currentState.isGameOver;
        this.winner = undoResult.currentState.winner;

        this.updateBoardFromState();
        this.updateUI();
        return true;

      } catch (error) {
        console.error('❌ WASM undo failed:', error);
        console.log('🔄 Falling back to legacy undo logic...');
      }
    }

    return this.legacyUndoMove();
  }

  legacyUndoMove() {
    if (this.gameHistory.length === 0) return false;

    const lastMove = this.gameHistory.pop();
    this.board = lastMove.board;
    this.currentPlayer = lastMove.player;
    this.moveCount--;
    this.gameOver = false;
    this.winner = null;

    this.updateBoardFromState();
    this.updateUI();
    return true;
  }

  updateBoardFromState() {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          const disc = cell.querySelector('.disc');
          if (disc) {
            disc.classList.remove('empty', 'yellow', 'red', 'winning-disc');
            if (this.board[row][col] === 0) {
              disc.classList.add('empty');
            } else if (this.board[row][col] === 1) {
              disc.classList.add('yellow');
            } else if (this.board[row][col] === 2) {
              disc.classList.add('red');
            }
          }
        }
      }
    }
  }

  resetGame() {
    if (this.wasmGame && this.wasmGame.initialized) {
      try {
        this.wasmGame.newGame();

        this.board = Array(6).fill(null).map(() => Array(7).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.moveCount = 0;
        this.gameHistory = [];
        this.winningLine = null;

        console.log('🔄 New game started using WASM backend');

      } catch (error) {
        console.error('❌ WASM reset failed:', error);
        console.log('🔄 Falling back to legacy reset logic...');
      }
    } else {
      this.board = Array(6).fill(null).map(() => Array(7).fill(0));
      this.currentPlayer = 1;
      this.gameOver = false;
      this.winner = null;
      this.moveCount = 0;
      this.gameHistory = [];
      this.winningLine = null;

      console.log('🔄 New game started using legacy logic');
    }

    if (this.boardRenderer) {
      this.boardRenderer.clearBoard();
    } else {
      const cells = document.querySelectorAll('.game-slot');
      cells.forEach(cell => {
        const disc = cell.querySelector('.disc');
        if (disc) {
          disc.classList.remove('yellow', 'red', 'winning-disc');
          disc.classList.add('empty');
        }
      });
    }

    this.updateUI();
  }

  updateUI() {
    const indicator = document.getElementById('currentPlayerIndicator');
    if (indicator) {
      const disc = indicator.querySelector('.player-disc');
      const name = indicator.querySelector('.player-name');
      if (disc && name) {
        if (this.currentPlayer === 1) {
          disc.className = 'player-disc w-8 h-8 rounded-full mr-3 bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg';
          name.textContent = 'Spieler 1';
        } else {
          disc.className = 'player-disc w-8 h-8 rounded-full mr-3 bg-gradient-to-br from-red-500 to-red-700 shadow-lg';
          name.textContent = 'Spieler 2';
        }
      }
    }

    const moveCounter = document.getElementById('moveCounter');
    if (moveCounter) {
      moveCounter.textContent = this.moveCount;
    }

    if (!this.gameOver) {
      const gameStatus = document.getElementById('gameStatus');
      if (gameStatus) {
        gameStatus.textContent = 'Spiel läuft';
        gameStatus.className = 'font-semibold text-green-400';
      }
    }

    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
      undoBtn.disabled = this.gameHistory.length === 0;
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (modal.classList.contains('hidden')) {
        this.showModal(modalId);
      } else {
        this.hideModal(modalId);
      }
    }
  }
}

(async () => {
  try {
    const game = new ModularConnect4Game();
    await game.init();

    window.game = game;

    console.log('🎮 STEP 3 Complete: BaseGameUI + BoardRenderer + WASM Backend activated!');
  } catch (error) {
    console.error('❌ STEP 3 Failed:', error);

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; left: 20px; right: 20px; background: #f44336; color: white; padding: 15px; border-radius: 8px; z-index: 1000; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
    errorDiv.textContent = `STEP 3 Error: ${error.message}`;
    document.body.appendChild(errorDiv);
  }
})();