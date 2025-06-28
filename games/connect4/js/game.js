// Connect4 Game Logic Wrapper for WASM Engine (RUST ONLY!)
// CRITICAL: NO JavaScript fallback - WASM/Rust implementation only!

class Connect4Game {
  constructor() {
    this.wasmGame = null;
    this.isInitialized = false;
    this.listeners = {};
    this.gameHistory = [];
    this.currentMove = 0;
    this.usingWASM = false; // Will be true after successful WASM init
    
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

  // Initialize game engine (WASM ONLY - NO JavaScript fallback)
  async init() {
    try {
      console.log('🔧 Loading Rust/WASM game engine...');
      
      const wasmSuccess = await this.initWASM();
      if (wasmSuccess) {
        console.log('✅ Rust/WASM engine initialized successfully');
        this.emit('initialized');
        return true;
      }
      
      // NO FALLBACK - WASM is required!
      throw new Error('WASM engine is required for this game. Please use a modern browser that supports WebAssembly.');
      
    } catch (error) {
      console.error('❌ Failed to initialize Rust/WASM engine:', error);
      this.emit('error', { message: 'Rust/WASM engine initialization failed', error });
      return false;
    }
  }

  // Try to initialize WASM engine
  async initWASM() {
    try {
      // Load WASM module using fetch for GitHub Pages compatibility
      console.log('🔧 Loading WASM module...');
      console.log('📍 Current location:', window.location.href);
      
      // Try different WASM paths for different environments
      const wasmPaths = [
        '../../../game_engine/pkg/game_engine_bg.wasm', // Relative path
        '/LogicCastle/game_engine/pkg/game_engine_bg.wasm', // Absolute GitHub Pages path
        './game_engine/pkg/game_engine_bg.wasm' // Alternative relative path
      ];
      
      // Import the WASM module
      console.log('📦 Importing WASM JavaScript wrapper...');
      const wasmModule = await import('../../../game_engine/pkg/game_engine.js');
      console.log('✅ WASM JavaScript wrapper loaded');
      
      const { default: init, Game, Player } = wasmModule;
      
      // Store classes globally for later use
      window.WasmGame = Game;
      window.WasmPlayer = Player;
      
      // Try to initialize WASM with different paths
      let wasmInitialized = false;
      for (const wasmPath of wasmPaths) {
        try {
          console.log(`🔧 Trying WASM path: ${wasmPath}`);
          await init(wasmPath);
          console.log(`✅ WASM binary initialized with path: ${wasmPath}`);
          wasmInitialized = true;
          break;
        } catch (pathError) {
          console.warn(`⚠️ Failed to load WASM from ${wasmPath}:`, pathError.message);
        }
      }
      
      if (!wasmInitialized) {
        // Try without explicit path (let wasm-bindgen handle it)
        console.log('🔧 Trying default WASM initialization...');
        await init();
        console.log('✅ WASM binary initialized with default path');
      }
      
      // Create game instance
      console.log('🎮 Creating WASM game instance...');
      this.wasmGame = new Game(this.rows, this.cols, this.winCondition, this.gravityEnabled);
      this.isInitialized = true;
      this.usingWASM = true;
      
      // Save initial state
      this.saveGameState();
      console.log('✅ WASM game engine fully initialized');
      
      return true;
    } catch (error) {
      console.error('❌ WASM initialization failed:', error);
      console.error('Stack trace:', error.stack);
      return false;
    }
  }

  // NO JavaScript fallback - WASM only!

  // Game state management
  saveGameState() {
    if (!this.isInitialized) return;
    
    const state = {
      board: this.getBoard(),
      currentPlayer: this.getCurrentPlayer(),
      moveCount: this.getMoveCount(),
      isGameOver: this.isGameOver(),
      winner: this.getWinner()
    };
    
    // Trim history if we undid moves
    this.gameHistory = this.gameHistory.slice(0, this.currentMove);
    this.gameHistory.push(state);
    this.currentMove = this.gameHistory.length;
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
      const currentPlayer = this.getCurrentPlayer();
      
      // Make move using WASM engine only
      if (!this.usingWASM || !this.wasmGame) {
        throw new Error('WASM engine not initialized');
      }
      
      // Debug: Check if column is valid and board state
      console.log(`🔍 Board dimensions: ${this.rows}x${this.cols}`);
      console.log(`🔍 Column index: ${col} (valid: ${col >= 0 && col < this.cols})`);
      console.log(`🔍 Gravity enabled: ${this.gravityEnabled}`);
      
      const currentBoard = this.getBoard();
      console.log(`🔍 Current board:`, currentBoard);
      console.log(`🔍 Top row of column ${col}:`, currentBoard[col]);
      
      // Rust function returns Result<(), JsValue> - on success returns undefined, on error throws
      try {
        this.wasmGame.make_move_connect4_js(col);
        console.log(`✅ WASM move successful in column ${col}`);
      } catch (wasmError) {
        console.error(`❌ WASM move failed in column ${col}:`, wasmError);
        console.error(`❌ WASM error details:`, wasmError.toString());
        throw new Error(`Invalid move: ${wasmError}`);
      }
      
      // Save state after move
      this.saveGameState();
      
      // Check for win condition
      const winner = this.getWinner();
      const isGameOver = this.isGameOver();
      
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
    
    if (!this.wasmGame) {
      throw new Error('WASM game not initialized');
    }

    this.currentMove--;
    const previousState = this.gameHistory[this.currentMove];
    
    // Recreate game with previous state using WASM
    this.wasmGame.free();
    this.wasmGame = new window.WasmGame(this.rows, this.cols, this.winCondition, this.gravityEnabled);
    
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

  // Game state queries (WASM only)
  getBoard() {
    if (!this.isInitialized || !this.wasmGame) return new Array(this.rows * this.cols).fill(0);
    return Array.from(this.wasmGame.get_board());
  }

  getCurrentPlayer() {
    if (!this.isInitialized || !this.wasmGame) return window.WasmPlayer?.Yellow || 1;
    return this.wasmGame.get_current_player();
  }

  isGameOver() {
    if (!this.isInitialized || !this.wasmGame) return false;
    return this.wasmGame.is_game_over();
  }

  getWinner() {
    if (!this.isInitialized || !this.wasmGame) return null;
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
    if (!this.isInitialized || !this.wasmGame) {
      throw new Error('WASM game not initialized');
    }

    // Free old game and create new one
    this.wasmGame.free();
    this.wasmGame = new window.WasmGame(this.rows, this.cols, this.winCondition, this.gravityEnabled);
    
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

  // ALL game logic handled by Rust/WASM - no JavaScript implementation!

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

// Player enum from WASM only - no JavaScript fallback
window.Player = window.WasmPlayer || { Yellow: 1, Red: 2 };

export { Connect4Game };
export const Player = window.Player;