// Connect4 Game Logic Wrapper for WASM Engine
import init, { Game, Player } from '../../../game_engine/pkg/game_engine.js';

class Connect4Game {
  constructor() {
    this.wasmGame = null;
    this.isInitialized = false;
    this.listeners = {};
    this.gameHistory = [];
    this.currentMove = 0;
    
    // Game configuration
    this.rows = 6;
    this.cols = 7;
    this.winCondition = 4;
    this.gravityEnabled = true;
  }

  // Event handling
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }

  // Initialize WASM module
  async init() {
    try {
      // Initialize WASM module
      await init();
      
      // Create new game instance
      this.wasmGame = new Game(this.rows, this.cols, this.winCondition, this.gravityEnabled);
      this.isInitialized = true;
      
      // Save initial state
      this.saveGameState();
      
      this.emit('initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize WASM game:', error);
      this.emit('error', { message: 'Failed to initialize game engine', error });
      return false;
    }
  }

  // Game state management
  saveGameState() {
    if (!this.isInitialized) return;
    
    const gameState = {
      board: Array.from(this.wasmGame.get_board()),
      currentPlayer: this.wasmGame.get_current_player(),
      moveNumber: this.currentMove
    };
    
    // Remove any future moves if we're not at the end
    this.gameHistory = this.gameHistory.slice(0, this.currentMove + 1);
    this.gameHistory.push(gameState);
    this.currentMove = this.gameHistory.length - 1;
  }

  // Make a move
  makeMove(col) {
    if (!this.isInitialized) {
      throw new Error('Game not initialized');
    }

    if (this.isGameOver()) {
      throw new Error('Game is already over');
    }

    if (col < 0 || col >= this.cols) {
      throw new Error('Invalid column');
    }

    try {
      const currentPlayer = this.wasmGame.get_current_player();
      
      // Make move in WASM engine
      this.wasmGame.make_move_connect4_js(col);
      
      // Save state after move
      this.saveGameState();
      
      // Check for win condition
      const winner = this.wasmGame.check_win();
      const isGameOver = this.wasmGame.is_game_over();
      
      const moveData = {
        col,
        player: currentPlayer,
        board: this.getBoard(),
        winner: winner || null,
        isGameOver,
        moveNumber: this.currentMove
      };

      this.emit('move', moveData);

      if (isGameOver) {
        this.emit('gameOver', {
          winner: winner || null,
          isDraw: !winner,
          board: this.getBoard()
        });
      }

      return moveData;
    } catch (error) {
      console.error('Failed to make move:', error);
      throw new Error(`Invalid move: ${error.message}`);
    }
  }

  // Undo last move
  undoMove() {
    if (this.currentMove <= 0) {
      throw new Error('No moves to undo');
    }

    this.currentMove--;
    const previousState = this.gameHistory[this.currentMove];
    
    // Recreate game with previous state
    this.wasmGame.free();
    this.wasmGame = new Game(this.rows, this.cols, this.winCondition, this.gravityEnabled);
    
    // Replay moves up to the previous state
    for (let i = 1; i <= this.currentMove; i++) {
      const state = this.gameHistory[i];
      // Find the move that led to this state by comparing with previous state
      if (i > 0) {
        const prevBoard = this.gameHistory[i - 1].board;
        const currBoard = state.board;
        
        // Find the column where a piece was added
        for (let col = 0; col < this.cols; col++) {
          for (let row = this.rows - 1; row >= 0; row--) {
            const prevCell = prevBoard[row * this.cols + col];
            const currCell = currBoard[row * this.cols + col];
            
            if (prevCell === 0 && currCell !== 0) {
              this.wasmGame.make_move_connect4_js(col);
              break;
            }
          }
        }
      }
    }

    this.emit('undo', {
      board: this.getBoard(),
      currentPlayer: this.getCurrentPlayer(),
      canUndo: this.canUndo(),
      moveNumber: this.currentMove
    });

    return true;
  }

  // Game state queries
  getBoard() {
    if (!this.isInitialized) return new Array(this.rows * this.cols).fill(0);
    return Array.from(this.wasmGame.get_board());
  }

  getCurrentPlayer() {
    if (!this.isInitialized) return Player.Yellow;
    return this.wasmGame.get_current_player();
  }

  isGameOver() {
    if (!this.isInitialized) return false;
    return this.wasmGame.is_game_over();
  }

  getWinner() {
    if (!this.isInitialized) return null;
    return this.wasmGame.check_win() || null;
  }

  canUndo() {
    return this.currentMove > 0;
  }

  getMoveCount() {
    return this.currentMove;
  }

  // Get valid moves (columns that aren't full)
  getValidMoves() {
    const board = this.getBoard();
    const validMoves = [];
    
    for (let col = 0; col < this.cols; col++) {
      // Check if top row of this column is empty
      if (board[col] === 0) {
        validMoves.push(col);
      }
    }
    
    return validMoves;
  }

  // Check if column is full
  isColumnFull(col) {
    if (col < 0 || col >= this.cols) return true;
    const board = this.getBoard();
    return board[col] !== 0; // Top row is not empty
  }

  // Get the row where a piece would land in a column
  getDropRow(col) {
    if (this.isColumnFull(col)) return -1;
    
    const board = this.getBoard();
    for (let row = this.rows - 1; row >= 0; row--) {
      if (board[row * this.cols + col] === 0) {
        return row;
      }
    }
    return -1;
  }

  // Start new game
  newGame() {
    if (!this.isInitialized) {
      throw new Error('Game not initialized');
    }

    // Free old game and create new one
    this.wasmGame.free();
    this.wasmGame = new Game(this.rows, this.cols, this.winCondition, this.gravityEnabled);
    
    // Reset game state
    this.gameHistory = [];
    this.currentMove = 0;
    this.saveGameState();

    this.emit('newGame', {
      board: this.getBoard(),
      currentPlayer: this.getCurrentPlayer()
    });
  }

  // Get board cell value at position
  getCell(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return 0;
    }
    const board = this.getBoard();
    return board[row * this.cols + col];
  }

  // Check if board is full (draw condition)
  isBoardFull() {
    const board = this.getBoard();
    return !board.includes(0);
  }

  // Get game statistics
  getGameStats() {
    return {
      rows: this.rows,
      cols: this.cols,
      winCondition: this.winCondition,
      moveCount: this.getMoveCount(),
      currentPlayer: this.getCurrentPlayer(),
      isGameOver: this.isGameOver(),
      winner: this.getWinner(),
      validMoves: this.getValidMoves(),
      canUndo: this.canUndo()
    };
  }

  // Cleanup
  destroy() {
    if (this.wasmGame) {
      this.wasmGame.free();
      this.wasmGame = null;
    }
    this.isInitialized = false;
    this.listeners = {};
    this.gameHistory = [];
    this.currentMove = 0;
  }
}

// Export for use in other modules
window.Connect4Game = Connect4Game;
export { Connect4Game, Player };