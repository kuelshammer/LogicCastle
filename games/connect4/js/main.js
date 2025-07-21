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
    
    // AI Mode properties
    this.gameMode = 'two-player';
    this.isBot = false;
    this.isProcessingMove = false;

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

    // Game Mode selector
    document.getElementById('gameMode').addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      this.isBot = e.target.value.includes('bot');
      console.log(`🎮 Game mode changed to: ${this.gameMode}, AI enabled: ${this.isBot}`);
      console.log(`🎮 Current game state: player=${this.currentPlayer}, gameOver=${this.gameOver}, isProcessingMove=${this.isProcessingMove}`);
      this.resetGame(); // Reset game when changing mode
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
      this.showModal('helpModal');
    });

    document.getElementById('assistanceBtn').addEventListener('click', () => {
      this.showModal('assistanceModal');
    });

    // 2XL Sidebar Event Listeners (if elements exist)
    const newGameBtn2xl = document.getElementById('newGameBtn2xl');
    const undoBtn2xl = document.getElementById('undoBtn2xl');
    const resetScoreBtn2xl = document.getElementById('resetScoreBtn2xl');
    const assistanceBtn2xl = document.getElementById('assistanceBtn2xl');
    const helpBtn2xl = document.getElementById('helpBtn2xl');

    if (newGameBtn2xl) {
      newGameBtn2xl.addEventListener('click', () => this.resetGame());
    }
    if (undoBtn2xl) {
      undoBtn2xl.addEventListener('click', () => this.undoMove());
    }
    if (resetScoreBtn2xl) {
      resetScoreBtn2xl.addEventListener('click', () => this.resetScore());
    }
    if (assistanceBtn2xl) {
      assistanceBtn2xl.addEventListener('click', () => this.showModal('assistanceModal'));
    }
    if (helpBtn2xl) {
      helpBtn2xl.addEventListener('click', () => this.showModal('helpModal'));
    }

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

        // CRITICAL BUG FIX: Board state synchronization debugging
        console.log(`🔍 BEFORE UPDATE - Col ${col}, Player ${moveResult.player}`);
        console.log(`🔍 WASM Board:`, moveResult.board);
        console.log(`🔍 Local Board:`, this.board);

        this.board = moveResult.board;
        this.currentPlayer = moveResult.player === 1 ? 2 : 1;
        this.moveCount = moveResult.moveNumber;
        this.gameOver = moveResult.isGameOver;
        this.winner = moveResult.winner;

        console.log(`🔍 AFTER SYNC - Local Board:`, this.board);

        // CRITICAL BUG FIX: Use ONLY full board update to prevent race conditions
        // Individual updates can conflict with full board refresh from WASM state
        
        if (moveResult.isGameOver) {
          const targetRow = this.findMoveRow(col, moveResult.board);
          if (moveResult.winner && targetRow !== -1) {
            this.showWin(targetRow, col);
            this.updateScore();
          } else {
            this.showDraw();
          }
        }

        // Single comprehensive update from WASM board state
        console.log(`🔄 Calling updateBoardFromState() - SINGLE UPDATE STRATEGY`);
        this.updateBoardFromState();
        
        console.log(`🔄 Calling updateUI() for UI elements`);
        this.updateUI();
        
        // Trigger AI move after human player's move (WASM version)
        console.log(`🎮 WASM Move completed: isBot=${this.isBot}, currentPlayer=${this.currentPlayer}, gameOver=${this.gameOver}, isProcessingMove=${this.isProcessingMove}`);
        if (this.isBot && this.currentPlayer === 2 && !this.gameOver) {
          console.log(`🤖 Triggering WASM AI move in 500ms...`);
          setTimeout(() => this.makeAIMove(), 500);
        } else {
          console.log(`🎮 WASM AI move NOT triggered: isBot=${this.isBot}, currentPlayer=${this.currentPlayer}, gameOver=${this.gameOver}`);
        }
        
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

    // CRITICAL BUG FIX: Use single board update strategy in legacy mode too
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

    console.log(`🔄 Legacy: updateBoardFromState() called`);
    this.updateBoardFromState();
    this.updateUI();
    
    // Trigger AI move after human player's move
    console.log(`🎮 Move completed: isBot=${this.isBot}, currentPlayer=${this.currentPlayer}, gameOver=${this.gameOver}, isProcessingMove=${this.isProcessingMove}`);
    if (this.isBot && this.currentPlayer === 2 && !this.gameOver) {
      console.log(`🤖 Triggering AI move in 500ms...`);
      setTimeout(() => this.makeAIMove(), 500);
    } else {
      console.log(`🎮 AI move NOT triggered: isBot=${this.isBot}, currentPlayer=${this.currentPlayer}, gameOver=${this.gameOver}`);
    }
    
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
    const winnerColor = this.currentPlayer === 1 ? 'yellow' : 'red';
    const winnerHex = this.currentPlayer === 1 ? '#fde047' : '#ef4444';

    console.log(`🏆 ${winnerName} gewinnt! Starting 3-phase victory sequence...`);

    // PHASE 1: Highlight winning line for 1 second (0-1000ms)
    this.showVictoryPhase1(winnerColor, winnerName);

    // PHASE 2: Confetti fireworks for 0.5 seconds (1000-1500ms)
    setTimeout(() => {
      this.showVictoryPhase2(winnerColor, winnerHex);
    }, 1000);

    // PHASE 3: Score update and clean transition (1500ms+)
    setTimeout(() => {
      this.showVictoryPhase3(winnerName, winnerColor);
    }, 1500);
  }

  showVictoryPhase1(winnerColor, winnerName) {
    console.log(`🎯 PHASE 1: Highlighting winning line for 1s... winnerColor=${winnerColor}, winnerName=${winnerName}`);
    const timestamp = Date.now();

    // Enhanced winning line animation with staggered appearance
    if (this.winningLine) {
      console.log(`🎯 PHASE 1: Animating ${this.winningLine.length} winning discs:`, this.winningLine);
      
      this.winningLine.forEach(([r, c], index) => {
        setTimeout(() => {
          const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          if (cell) {
            const disc = cell.querySelector('.disc');
            if (disc) {
              console.log(`🎯 PHASE 1: Highlighting disc at (${r},${c}) - disc found:`, disc.className);
              
              // Pure Tailwind victory animation
              disc.classList.add(
                'animate-pulse', 
                'scale-125', 
                'z-50',
                'drop-shadow-2xl',
                winnerColor === 'yellow' ? 'shadow-yellow-400' : 'shadow-red-400',
                'transition-all',
                'duration-500'
              );
              disc.style.filter = `drop-shadow(0 0 20px ${winnerColor === 'yellow' ? '#fde047' : '#ef4444'})`;
            } else {
              console.warn(`🎯 PHASE 1: No disc found at (${r},${c})`);
            }
          } else {
            console.warn(`🎯 PHASE 1: No cell found at (${r},${c})`);
          }
        }, index * 150); // Staggered animation every 150ms
      });
    } else {
      console.warn(`🎯 PHASE 1: No winning line found!`);
    }

    // Update game status with Tailwind classes
    const gameStatus = document.getElementById('gameStatus');
    if (gameStatus) {
      gameStatus.textContent = `${winnerName} gewinnt!`;
      gameStatus.className = `font-bold text-2xl ${winnerColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'} animate-bounce`;
      console.log(`🎯 PHASE 1: Game status updated - ${winnerName} gewinnt!`);
    }
    
    console.log(`🎯 PHASE 1: Setup complete, elapsed: ${Date.now() - timestamp}ms`);
  }

  showVictoryPhase2(winnerColor, winnerHex) {
    console.log(`🎆 PHASE 2: Confetti fireworks for 0.5s... winnerColor=${winnerColor}`);
    const timestamp = Date.now();

    // Remove phase1 highlighting with Tailwind cleanup
    const phase1Elements = document.querySelectorAll('.animate-pulse');
    console.log(`🧹 PHASE 2: Cleaning ${phase1Elements.length} phase1 elements`);
    
    phase1Elements.forEach(disc => {
      disc.classList.remove('animate-pulse', 'scale-125', 'z-50', 'drop-shadow-2xl', 'shadow-yellow-400', 'shadow-red-400', 'transition-all', 'duration-500');
      disc.style.filter = '';
    });

    // Create CSS confetti with enhanced debugging
    console.log(`🎆 PHASE 2: Creating Tailwind confetti with color=${winnerColor}`);
    this.createTailwindConfetti(winnerColor);

    // Create victory background with pure Tailwind
    const victoryBg = document.createElement('div');
    victoryBg.className = `fixed inset-0 pointer-events-none z-30 ${winnerColor === 'yellow' ? 'bg-gradient-to-br from-yellow-400/30 via-yellow-500/20 to-yellow-600/30' : 'bg-gradient-to-br from-red-400/30 via-red-500/20 to-red-600/30'} animate-pulse`;
    victoryBg.id = 'victoryBackground';
    document.body.appendChild(victoryBg);
    
    console.log(`🎆 PHASE 2: Victory background created, elapsed: ${Date.now() - timestamp}ms`);
  }

  showVictoryPhase3(winnerName, winnerColor) {
    console.log(`✨ PHASE 3: Score update and clean transition... winnerName=${winnerName}, winnerColor=${winnerColor}`);
    const timestamp = Date.now();

    // Update score with Tailwind animation
    this.updateScoreWithAnimation();

    // Clean up all victory effects with logging
    setTimeout(() => {
      console.log(`🧹 PHASE 3: Starting cleanup after 1s...`);
      
      // Remove all Tailwind victory classes
      const victoryDiscs = document.querySelectorAll('.disc');
      console.log(`🧹 PHASE 3: Cleaning ${victoryDiscs.length} discs...`);
      
      victoryDiscs.forEach(disc => {
        disc.classList.remove('animate-pulse', 'scale-125', 'z-50', 'drop-shadow-2xl', 'shadow-yellow-400', 'shadow-red-400', 'transition-all', 'duration-500');
        disc.style.filter = '';
      });
      
      // Clean game status animation
      const gameStatus = document.getElementById('gameStatus');
      if (gameStatus) {
        gameStatus.classList.remove('animate-bounce');
        console.log(`🧹 PHASE 3: Game status animation cleared`);
      }
      
      // Remove victory background
      const victoryBg = document.getElementById('victoryBackground');
      if (victoryBg) {
        victoryBg.remove();
        console.log(`🧹 PHASE 3: Victory background removed`);
      }
      
      console.log(`🧹 PHASE 3: Cleanup complete, elapsed: ${Date.now() - timestamp + 1000}ms`);
    }, 1000);

    // Show ready state after 2 seconds
    setTimeout(() => {
      console.log(`🔄 PHASE 3: Victory sequence complete. Ready for new game!`);
      
      // AUTO-RESET: Start new game automatically after victory sequence
      console.log(`🔄 PHASE 3: Auto-starting new game...`);
      this.newGame();
      
      console.log(`✅ VICTORY SEQUENCE COMPLETE: Total time ${Date.now() - timestamp + 2000}ms`);
    }, 2000);
  }

  createTailwindConfetti(winnerColor) {
    console.log(`🎆 Creating confetti container...`);
    
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'fixed inset-0 pointer-events-none z-[9999]';
    confettiContainer.id = 'tailwind-confetti';
    confettiContainer.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 9999 !important;
      pointer-events: none !important;
    `;
    document.body.appendChild(confettiContainer);
    
    console.log(`🎆 Confetti container created, now creating 50 pieces...`);

    // Create 50 confetti pieces with enhanced visibility
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      
      // Random position and timing
      const startX = Math.random() * 100;
      const duration = 1500 + Math.random() * 1000;
      const delay = Math.random() * 200;
      
      // FIXED: Use inline CSS instead of Tailwind classes for dynamic confetti
      const colorValues = winnerColor === 'yellow' ? [
        '#fbbf24', '#f59e0b', '#f3f4f6', '#fbbf24', '#fb923c'
      ] : [
        '#f87171', '#ef4444', '#fca5a5', '#ec4899', '#f43f5e'
      ];
      
      const randomColor = colorValues[Math.floor(Math.random() * colorValues.length)];
      const sizes = [
        {width: 12, height: 12}, 
        {width: 16, height: 16}, 
        {width: 8, height: 24}, 
        {width: 24, height: 8}
      ];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      
      // ULTIMATE FIX: Force all properties with !important
      confetti.className = '';
      confetti.style.cssText = `
        left: ${startX}% !important;
        top: -20px !important;
        width: ${randomSize.width}px !important;
        height: ${randomSize.height}px !important;
        background-color: ${randomColor} !important;
        border-radius: 50% !important;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
        z-index: 10000 !important;
        position: absolute !important;
        animation: confetti-fall ${duration}ms ease-out ${delay}ms forwards !important;
        transform: rotate(${Math.random() * 360}deg) !important;
        opacity: 0.9 !important;
        display: block !important;
        pointer-events: none !important;
      `;
      
      confettiContainer.appendChild(confetti);
    }

    console.log(`🎆 All 50 confetti pieces created and animated`);

    // Clean up confetti after animation
    setTimeout(() => {
      if (confettiContainer && confettiContainer.parentNode) {
        confettiContainer.parentNode.removeChild(confettiContainer);
        console.log(`🎆 Tailwind confetti cleanup complete!`);
      }
    }, 2500);
  }

  updateScoreWithAnimation() {
    // CRITICAL BUGFIX: Score bereits in updateScore() erhöht - nur Animation hier
    console.log(`🎯 PHASE 3: Score animation for winner ${this.winner} - current scores:`, this.scores);
    
    if (this.winner === 1) {
      this.animateScoreUpdate('yellowScore', 'yellowScore2xl');
    } else if (this.winner === 2) {
      this.animateScoreUpdate('redScore', 'redScore2xl');
    }
  }

  animateScoreUpdate(scoreId, score2xlId) {
    const scoreElement = document.getElementById(scoreId);
    const score2xlElement = document.getElementById(score2xlId);
    
    [scoreElement, score2xlElement].forEach(el => {
      if (el) {
        // Tailwind bounce animation for score update
        el.classList.add('animate-bounce', 'scale-125', 'text-2xl', 'font-bold');
        el.textContent = this.winner === 1 ? this.scores.yellow : this.scores.red;
        
        // Remove animation after 1 second
        setTimeout(() => {
          el.classList.remove('animate-bounce', 'scale-125', 'text-2xl', 'font-bold');
        }, 1000);
      }
    });
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

    // Update both main and 2XL sidebar scores
    document.getElementById('yellowScore').textContent = this.scores.yellow;
    document.getElementById('redScore').textContent = this.scores.red;
    
    const yellowScore2xl = document.getElementById('yellowScore2xl');
    const redScore2xl = document.getElementById('redScore2xl');
    if (yellowScore2xl) yellowScore2xl.textContent = this.scores.yellow;
    if (redScore2xl) redScore2xl.textContent = this.scores.red;
  }

  resetScore() {
    this.scores = { yellow: 0, red: 0 };
    
    // Update both main and 2XL sidebar scores
    document.getElementById('yellowScore').textContent = '0';
    document.getElementById('redScore').textContent = '0';
    
    const yellowScore2xl = document.getElementById('yellowScore2xl');
    const redScore2xl = document.getElementById('redScore2xl');
    if (yellowScore2xl) yellowScore2xl.textContent = '0';
    if (redScore2xl) redScore2xl.textContent = '0';
    
    console.log('🔄 Score reset');
  }

  undoMove() {
    // WASM-first approach for undo
    if (this.wasmGame && this.wasmGame.initialized) {
      try {
        if (this.wasmGame.canUndo()) {
          console.log('🔄 Undoing move using WASM backend');
          const undoResult = this.wasmGame.undoMove();

          // Sync state from WASM undo result
          if (undoResult && undoResult.currentState) {
            this.board = undoResult.currentState.board;
            this.currentPlayer = undoResult.currentState.currentPlayer;
            this.moveCount = undoResult.currentState.moveCount;
            this.gameOver = undoResult.currentState.isGameOver;
            this.winner = undoResult.currentState.winner;

            this.updateBoardFromState();
            this.updateUI();
            
            console.log('✅ Move undone using WASM backend');
            console.log(`🔄 WASM state after undo: player=${this.currentPlayer}, moves=${this.moveCount}`);
            return true;
          } else {
            throw new Error('WASM undo returned invalid result');
          }
        } else {
          console.log('🔄 No moves to undo in WASM backend');
          return false;
        }
      } catch (error) {
        console.error('❌ WASM undo failed:', error);
        console.log('🔄 Falling back to legacy undo logic...');
        return this.legacyUndoMove();
      }
    } else {
      console.log('🔄 WASM not available, using legacy undo');
      return this.legacyUndoMove();
    }
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
    console.log(`🔄 updateBoardFromState() called`);
    console.log(`🔍 Current local board state:`, this.board);
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          const disc = cell.querySelector('.disc');
          if (disc) {
            const oldClasses = disc.className;
            disc.classList.remove('empty', 'yellow', 'red', 'winning-disc');
            
            let newClass = '';
            if (this.board[row][col] === 0) {
              disc.classList.add('empty');
              newClass = 'empty';
            } else if (this.board[row][col] === 1) {
              disc.classList.add('yellow');
              newClass = 'yellow';
            } else if (this.board[row][col] === 2) {
              disc.classList.add('red');
              newClass = 'red';
            }
            
            if (this.board[row][col] !== 0) {
              console.log(`🎨 Position (${row},${col}): value=${this.board[row][col]} → ${newClass}`);
              if (oldClasses !== disc.className) {
                console.log(`🔄 Classes changed: "${oldClasses}" → "${disc.className}"`);
              }
            }
          }
        }
      }
    }
  }

  resetGame() {
    // WASM-first approach: Use WASM if available, fallback to legacy only if necessary
    if (this.wasmGame && this.wasmGame.initialized) {
      try {
        console.log('🔄 Resetting game using WASM backend');
        this.wasmGame.newGame();
        
        // Sync state from WASM
        const wasmState = this.wasmGame.getGameState();
        if (wasmState) {
          this.board = wasmState.board;
          this.currentPlayer = wasmState.currentPlayer;
          this.gameOver = wasmState.isGameOver;
          this.winner = wasmState.winner;
          this.moveCount = wasmState.moveCount;
          this.gameHistory = [];
          this.winningLine = null;
          
          console.log('✅ Game reset using WASM backend');
          console.log(`🔄 WASM Game state: player=${this.currentPlayer}, moves=${this.moveCount}, gameOver=${this.gameOver}`);
        } else {
          throw new Error('WASM getGameState() returned null');
        }
      } catch (error) {
        console.error('❌ WASM reset failed, falling back to legacy:', error);
        this.legacyResetGame();
      }
    } else {
      console.log('🔄 WASM not available, using legacy reset');
      this.legacyResetGame();
    }

    // Remove victory background effect
    const victoryBg = document.getElementById('victoryBackground');
    if (victoryBg) {
      victoryBg.remove();
    }

    // Update visual board
    this.updateBoardVisual();
    this.updateUI();
  }

  legacyResetGame() {
    this.board = Array(6).fill(null).map(() => Array(7).fill(0));
    this.currentPlayer = 1;
    this.gameOver = false;
    this.winner = null;
    this.moveCount = 0;
    this.gameHistory = [];
    this.winningLine = null;

    console.log('🔄 New game started using legacy logic');
    console.log(`🔄 Legacy game state: player=${this.currentPlayer}, moves=${this.moveCount}, gameOver=${this.gameOver}`);
  }

  updateBoardVisual() {
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
  }

  updateUI() {
    // Update main current player indicator
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

    // Update 2XL current player indicator
    const indicator2xl = document.getElementById('currentPlayerIndicator2xl');
    if (indicator2xl) {
      const disc = indicator2xl.querySelector('.player-disc');
      const name = indicator2xl.querySelector('.player-name');
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

    // Update move counters
    const moveCounter = document.getElementById('moveCounter');
    const moveCounter2xl = document.getElementById('moveCounter2xl');
    if (moveCounter) moveCounter.textContent = this.moveCount;
    if (moveCounter2xl) moveCounter2xl.textContent = this.moveCount;

    // Update game status
    if (!this.gameOver) {
      const gameStatus = document.getElementById('gameStatus');
      const gameStatus2xl = document.getElementById('gameStatus2xl');
      if (gameStatus) {
        gameStatus.textContent = 'Spiel läuft';
        gameStatus.className = 'font-semibold text-green-400';
      }
      if (gameStatus2xl) {
        gameStatus2xl.textContent = 'Spiel läuft';
        gameStatus2xl.className = 'font-semibold text-green-400';
      }
    }

    // Update undo buttons
    const undoBtn = document.getElementById('undoBtn');
    const undoBtn2xl = document.getElementById('undoBtn2xl');
    const canUndo = this.gameHistory.length === 0;
    if (undoBtn) undoBtn.disabled = canUndo;
    if (undoBtn2xl) undoBtn2xl.disabled = canUndo;
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

  // ==================== AI FUNCTIONALITY ====================

  /**
   * Make AI move
   */
  async makeAIMove() {
    console.log(`🤖 makeAIMove() called: isBot=${this.isBot}, gameOver=${this.gameOver}, isProcessingMove=${this.isProcessingMove}`);
    if (!this.isBot || this.gameOver || this.isProcessingMove) {
      console.log(`🤖 makeAIMove() aborted: isBot=${this.isBot}, gameOver=${this.gameOver}, isProcessingMove=${this.isProcessingMove}`);
      return;
    }

    try {
      this.isProcessingMove = true;
      console.log('🤖 KI denkt nach...');

      // Use WASM AI if available
      let bestMove = null;
      if (this.wasmGame && this.wasmGame.initialized) {
        try {
          bestMove = this.wasmGame.getAIMove();
          console.log(`🤖 WASM AI suggests move: ${bestMove}`);
        } catch (error) {
          console.error('❌ WASM AI failed:', error);
          bestMove = null;
        }
      } else {
        console.log('🤖 WASM not initialized, using fallback AI');
      }

      // Fallback to simple AI if WASM fails
      if (bestMove === null || bestMove < 0 || bestMove >= 7) {
        bestMove = this.getFallbackAIMove();
        console.log(`🤖 Fallback AI suggests move: ${bestMove}`);
      }

      // Validate and execute move
      if (bestMove !== null && bestMove >= 0 && bestMove < 7) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for thinking animation
        
        const success = this.makeMove(bestMove);
        if (success) {
          console.log(`✅ AI move executed successfully: ${bestMove}`);
        } else {
          console.error(`❌ AI move failed: ${bestMove}`);
        }
      } else {
        console.warn('⚠️ No valid AI move found');
      }

    } catch (error) {
      console.error('❌ AI move error:', error);
    } finally {
      this.isProcessingMove = false;
    }
  }

  /**
   * Simple fallback AI - basic strategy
   */
  getFallbackAIMove() {
    console.log('🤖 Calculating fallback AI move...');
    
    // Get all valid columns
    const validColumns = [];
    for (let col = 0; col < 7; col++) {
      if (this.board[0][col] === 0) {
        validColumns.push(col);
      }
    }

    if (validColumns.length === 0) {
      console.log('🤖 No valid columns found');
      return null;
    }

    console.log(`🤖 Valid columns: ${validColumns.join(', ')}`);

    // Simple strategy: 
    // 1. Check if AI can win in one move
    for (let col of validColumns) {
      if (this.canWinInColumn(col, 2)) { // Player 2 is AI
        console.log(`🤖 AI can win in column ${col}`);
        return col;
      }
    }

    // 2. Check if AI needs to block human player
    for (let col of validColumns) {
      if (this.canWinInColumn(col, 1)) { // Player 1 is human
        console.log(`🤖 AI blocks human win in column ${col}`);
        return col;
      }
    }

    // 3. Prefer center columns
    const centerCols = validColumns.filter(col => col >= 2 && col <= 4);
    const preferredCols = centerCols.length > 0 ? centerCols : validColumns;
    
    const chosenCol = preferredCols[Math.floor(Math.random() * preferredCols.length)];
    console.log(`🤖 AI chooses column ${chosenCol} (strategy: center preference)`);
    return chosenCol;
  }

  /**
   * Check if a player can win by playing in a specific column
   */
  canWinInColumn(col, player) {
    // Find the row where the disc would land
    let targetRow = -1;
    for (let row = 5; row >= 0; row--) {
      if (this.board[row][col] === 0) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) return false; // Column is full

    // Temporarily place the disc
    this.board[targetRow][col] = player;
    
    // Check if this creates a winning line
    const isWin = this.checkWin(targetRow, col);
    
    // Remove the temporary disc
    this.board[targetRow][col] = 0;
    
    return isWin;
  }

  /**
   * Check if current mode is AI mode
   */
  isAIMode() {
    return this.isBot && this.gameMode.includes('bot');
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