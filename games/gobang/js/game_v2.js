// Gobang Game Logic Wrapper for WASM Engine (RUST ONLY!)
// CRITICAL: NO JavaScript fallback - WASM/Rust implementation only!

class GobangGame {
  constructor() {
    this.wasmGame = null;
    this.isInitialized = false;
    this.listeners = {};
    this.gameHistory = [];
    this.currentMove = 0;
    this.usingWASM = false; // Will be true after successful WASM init
    
    // Game configuration for Gobang
    this.rows = 15;
    this.cols = 15;
    this.winCondition = 5;
    this.gravityEnabled = false; // Gobang uses free placement
    
    // UI compatibility properties
    this.BOARD_SIZE = 15;
    this.BLACK = 1;
    this.WHITE = 2;
    this.currentPlayer = this.BLACK;
    this.gameOver = false;
    this.winner = null;
    this.scores = { black: 0, white: 0 };
    this.moveHistory = [];
    
    // Starter rotation tracking
    this.lastWinner = null; // Track last game winner
    this.defaultStarter = 'black'; // Default starting player (Black starts in Gobang)
    this.scores = { black: 0, white: 0 }; // Track scores for rotation logic
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
      console.log('🔧 Loading Rust/WASM game engine for Gobang...');
      
      const wasmSuccess = await this.initWASM();
      if (wasmSuccess) {
        console.log('✅ Gobang Rust/WASM engine initialized successfully');
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
      
      // Try different WASM paths for GitHub Pages with cache busting
      const cacheBuster = '?v=gobang_advanced_' + Date.now();
      const wasmPaths = [
        '/LogicCastle/game_engine/pkg/game_engine_bg.wasm' + cacheBuster, // GitHub Pages absolute path
        '../../../game_engine/pkg/game_engine_bg.wasm' + cacheBuster, // Local relative path
        'https://www.maxkuelshammer.de/LogicCastle/game_engine/pkg/game_engine_bg.wasm' + cacheBuster // Full URL
      ];
      
      // Import the WASM module with GitHub Pages path
      console.log('📦 Importing WASM JavaScript wrapper...');
      const wasmModule = await import('/LogicCastle/game_engine/pkg/game_engine.js');
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
      
      // Create game instance for Gobang (15x15, win_condition=5, gravity=false)
      console.log('🎮 Creating WASM Gobang instance...');
      this.wasmGame = new Game(this.rows, this.cols, this.winCondition, this.gravityEnabled);
      this.isInitialized = true;
      this.usingWASM = true;
      
      // Save initial state
      this.saveGameState();
      console.log('✅ WASM Gobang engine fully initialized - VERSION 2025-06-29 21:45');
      
      // Verify critical Gobang functions are available
      const criticalFunctions = [
        'make_move_gobang_js', 
        'get_legal_moves_gobang',
        'detect_open_three',
        'detect_closed_four', 
        'detect_double_three_forks',
        'get_threat_level',
        'get_winning_moves_gobang',
        'get_blocking_moves_gobang',
        'get_dangerous_moves_gobang'
      ];
      const missingFunctions = criticalFunctions.filter(func => typeof this.wasmGame[func] !== 'function');
      if (missingFunctions.length > 0) {
        console.warn('⚠️ Missing WASM functions:', missingFunctions);
      } else {
        console.log('✅ All critical Gobang WASM functions available');
      }
      
      return true;
    } catch (error) {
      console.error('❌ WASM initialization failed:', error);
      console.error('Stack trace:', error.stack);
      return false;
    }
  }

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

  // Make a move in Gobang (row, col)
  makeMove(row, col) {
    if (!this.isInitialized) {
      throw new Error('Game not initialized');
    }

    if (this.isGameOver()) {
      throw new Error('Game is already over');
    }

    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error('Invalid position');
    }

    try {
      const currentPlayer = this.getCurrentPlayer();
      
      // Make move using WASM engine only
      if (!this.usingWASM || !this.wasmGame) {
        throw new Error('WASM engine not initialized');
      }
      
      // Debug: Check position validity
      console.log(`🔍 Gobang move: row=${row}, col=${col}`);
      console.log(`🔍 Board dimensions: ${this.rows}x${this.cols}`);
      console.log(`🔍 Gravity enabled: ${this.gravityEnabled}`);
      
      const currentBoard = this.getBoard();
      const cellIndex = row * this.cols + col;
      console.log(`🔍 Cell at (${row},${col}) = ${currentBoard[cellIndex]}`);
      
      // Rust function returns Result<(), JsValue> - on success returns undefined, on error throws
      try {
        this.wasmGame.make_move_gobang_js(row, col);
        console.log(`✅ WASM move successful at (${row}, ${col})`);
      } catch (wasmError) {
        console.error(`❌ WASM move failed at (${row}, ${col}):`, wasmError);
        console.error(`❌ WASM error details:`, wasmError.toString());
        throw new Error(`Invalid move: ${wasmError}`);
      }
      
      // Add to move history
      const moveData = {
        row,
        col,
        player: currentPlayer,
        moveNumber: this.moveHistory.length + 1
      };
      this.moveHistory.push(moveData);
      
      // Save state after move
      this.saveGameState();
      
      // Update internal state
      this.updateInternalState();
      
      // Prepare full move data for events
      const fullMoveData = {
        ...moveData,
        board: this.getBoard(),
        winner: this.winner,
        isGameOver: this.gameOver
      };

      this.emit('move', fullMoveData);
      this.emit('moveMade', fullMoveData); // Legacy compatibility event
      
      // Emit player change event for UI
      const nextPlayer = this.getCurrentPlayer();
      this.emit('playerChanged', nextPlayer);

      if (this.gameOver) {
        // Track winner for starter rotation
        if (this.winner) {
          this.lastWinner = this.wasmPlayerToString(this.winner);
          // Update scores
          this.scores[this.lastWinner]++;
        } else {
          this.lastWinner = 'draw';
        }
        
        const gameOverData = {
          winner: this.winner,
          isDraw: !this.winner,
          board: this.getBoard(),
          scores: this.scores
        };
        this.emit('gameOver', gameOverData);
        
        if (this.winner) {
          this.emit('gameWon', { 
            winner: this.winner, 
            winningStones: this.getWinningPositions() 
          });
        } else {
          this.emit('gameDraw');
        }
      }

      return fullMoveData;
    } catch (error) {
      console.error('Failed to make move:', error);
      throw new Error(`Invalid move: ${error.message}`);
    }
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

  // Get valid moves for Gobang (all empty positions)
  getValidMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    const flatMoves = Array.from(this.wasmGame.get_legal_moves_gobang());
    const moves = [];
    
    // Convert flattened array to (row, col) pairs
    for (let i = 0; i < flatMoves.length; i += 2) {
      moves.push({ row: flatMoves[i], col: flatMoves[i + 1] });
    }
    
    return moves;
  }

  // Check if position is empty
  isEmpty(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    const board = this.getBoard();
    return board[row * this.cols + col] === 0;
  }

  // Start new game
  newGame() {
    if (!this.isInitialized) {
      throw new Error('WASM game not initialized');
    }

    // Determine starting player based on rotation logic
    const nextStarter = this.getNextStarter();
    
    // Reset game using WASM reset method (more efficient than creating new instance)
    if (this.wasmGame) {
      // Set the starting player in WASM before reset
      if (nextStarter === 'white') {
        this.wasmGame.set_starting_player(2); // White = 2 in WASM
      } else {
        this.wasmGame.set_starting_player(1); // Black = 1 in WASM
      }
      this.wasmGame.reset_game();
    } else {
      // Create new game instance if needed
      this.wasmGame = new Game(this.rows, this.cols, this.winCondition, this.gravityEnabled);
      if (nextStarter === 'white') {
        this.wasmGame.set_starting_player(2);
        this.wasmGame.reset_game();
      }
    }
    
    // Reset game state
    this.gameHistory = [];
    this.currentMove = 0;
    this.saveGameState();

    this.emit('newGame', {
      board: this.getBoard(),
      currentPlayer: this.getCurrentPlayer(),
      startingPlayer: nextStarter
    });
  }

  // Determine next starter based on rotation rules  
  getNextStarter() {
    // First game or no previous winner: use default
    if (this.lastWinner === null) {
      return this.defaultStarter;
    }
    
    // Loser starts next game (competitive rule)
    if (this.lastWinner === 'black') {
      return 'white';
    } else if (this.lastWinner === 'white') {
      return 'black';
    } else {
      // Draw: same starter as previous game
      return this.getStartingPlayer();
    }
  }

  // Get current starting player
  getStartingPlayer() {
    if (!this.wasmGame) return this.defaultStarter;
    
    const startingPlayerNum = this.wasmGame.get_starting_player();
    return startingPlayerNum === 1 ? 'black' : 'white';
  }

  // Convert WASM player number to string
  wasmPlayerToString(wasmPlayer) {
    return wasmPlayer === 1 ? 'black' : 'white';
  }

  // Reset scores and starter rotation
  resetScores() {
    this.scores = { black: 0, white: 0 };
    this.lastWinner = null;
    
    this.emit('scoresReset', {
      scores: this.scores
    });
  }

  // Get current scores
  getScores() {
    return { ...this.scores };
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

  // GOBANG ADVANCED ASSISTANCE FUNCTIONS
  
  // Get positions that would win immediately (5-in-a-row)
  getWinningMoves() {
    if (!this.isInitialized || !this.wasmGame) {
      console.warn('🚫 getWinningMoves: Game not initialized or WASM not available');
      return [];
    }
    
    try {
      const flatMoves = Array.from(this.wasmGame.get_winning_moves_gobang());
      const moves = [];
      
      // Convert flattened array to (row, col) pairs
      for (let i = 0; i < flatMoves.length; i += 2) {
        moves.push({ row: flatMoves[i], col: flatMoves[i + 1] });
      }
      
      console.log(`🏆 getWinningMoves found ${moves.length} winning positions`);
      return moves;
    } catch (error) {
      console.error('❌ Failed to get winning moves:', error);
      return [];
    }
  }
  
  // Get positions that block opponent wins
  getBlockingMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const flatMoves = Array.from(this.wasmGame.get_blocking_moves_gobang());
      const moves = [];
      
      for (let i = 0; i < flatMoves.length; i += 2) {
        moves.push({ row: flatMoves[i], col: flatMoves[i + 1] });
      }
      
      console.log(`🛡️ getBlockingMoves found ${moves.length} blocking positions`);
      return moves;
    } catch (error) {
      console.error('❌ Failed to get blocking moves:', error);
      return [];
    }
  }
  
  // Get positions that give opponent dangerous opportunities
  getDangerousMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const flatMoves = Array.from(this.wasmGame.get_dangerous_moves_gobang());
      const moves = [];
      
      for (let i = 0; i < flatMoves.length; i += 2) {
        moves.push({ row: flatMoves[i], col: flatMoves[i + 1] });
      }
      
      console.log(`⚠️ getDangerousMoves found ${moves.length} dangerous positions`);
      return moves;
    } catch (error) {
      console.error('❌ Failed to get dangerous moves:', error);
      return [];
    }
  }
  
  // Get positions that create open three patterns
  getOpenThreeMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const currentPlayer = this.getCurrentPlayer();
      const flatMoves = Array.from(this.wasmGame.detect_open_three(currentPlayer));
      const moves = [];
      
      for (let i = 0; i < flatMoves.length; i += 2) {
        moves.push({ row: flatMoves[i], col: flatMoves[i + 1] });
      }
      
      console.log(`📈 getOpenThreeMoves found ${moves.length} open three positions`);
      return moves;
    } catch (error) {
      console.error('❌ Failed to get open three moves:', error);
      return [];
    }
  }
  
  // Get positions that create closed four patterns
  getClosedFourMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const currentPlayer = this.getCurrentPlayer();
      const flatMoves = Array.from(this.wasmGame.detect_closed_four(currentPlayer));
      const moves = [];
      
      for (let i = 0; i < flatMoves.length; i += 2) {
        moves.push({ row: flatMoves[i], col: flatMoves[i + 1] });
      }
      
      console.log(`🔒 getClosedFourMoves found ${moves.length} closed four positions`);
      return moves;
    } catch (error) {
      console.error('❌ Failed to get closed four moves:', error);
      return [];
    }
  }
  
  // Get positions that create double three fork patterns
  getDoubleThreeForks() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const currentPlayer = this.getCurrentPlayer();
      const flatMoves = Array.from(this.wasmGame.detect_double_three_forks(currentPlayer));
      const moves = [];
      
      for (let i = 0; i < flatMoves.length; i += 2) {
        moves.push({ row: flatMoves[i], col: flatMoves[i + 1] });
      }
      
      console.log(`🔱 getDoubleThreeForks found ${moves.length} fork positions`);
      return moves;
    } catch (error) {
      console.error('❌ Failed to get double three forks:', error);
      return [];
    }
  }
  
  // Get threat level (0-5) for a specific position
  getThreatLevel(row, col, player = null) {
    if (!this.isInitialized || !this.wasmGame) return 0;
    
    try {
      const checkPlayer = player || this.getCurrentPlayer();
      return this.wasmGame.get_threat_level(row, col, checkPlayer);
    } catch (error) {
      console.error('❌ Failed to get threat level:', error);
      return 0;
    }
  }
  
  // Get comprehensive move analysis for UI
  getMoveAnalysis() {
    return {
      winning: this.getWinningMoves(),
      blocking: this.getBlockingMoves(),
      dangerous: this.getDangerousMoves(),
      openThree: this.getOpenThreeMoves(),
      closedFour: this.getClosedFourMoves(),
      doubleThreeForks: this.getDoubleThreeForks()
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
  
  // UI compatibility methods
  getPlayerColorClass(player) {
    return player === this.BLACK ? 'black' : 'white';
  }
  
  getPlayerName(player) {
    return player === this.BLACK ? 'Spieler 1 (Schwarz)' : 'Spieler 2 (Weiß)';
  }
  
  positionToNotation(row, col) {
    const colLetter = String.fromCharCode(65 + col); // A-O
    const rowNumber = this.BOARD_SIZE - row; // 15-1
    return `${colLetter}${rowNumber}`;
  }
  
  getLastMove() {
    return this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
  }
  
  resetGame() {
    if (this.isInitialized && this.wasmGame) {
      this.wasmGame.new_game();
      this.gameHistory = [];
      this.currentMove = 0;
      this.moveHistory = [];
      this.gameOver = false;
      this.winner = null;
      this.currentPlayer = this.BLACK;
      this.emit('gameReset');
    }
  }
  
  resetScores() {
    this.scores = { black: 0, white: 0 };
    this.emit('scoresReset');
  }
  
  undoMove() {
    if (this.moveHistory.length === 0) {
      return { success: false, reason: 'No moves to undo' };
    }
    
    const lastMove = this.moveHistory.pop();
    if (this.wasmGame) {
      // Reset game state and replay all moves except the last one
      this.wasmGame.new_game();
      const movesToReplay = [...this.moveHistory];
      this.moveHistory = [];
      
      for (const move of movesToReplay) {
        this.wasmGame.make_move_gobang_js(move.row, move.col);
        this.moveHistory.push(move);
      }
      
      this.gameOver = false;
      this.winner = null;
      this.currentPlayer = this.getCurrentPlayer();
      
      this.emit('moveUndone', lastMove);
      this.emit('playerChanged', this.currentPlayer);
    }
    
    return { success: true, move: lastMove };
  }
  
  // Update internal state after moves
  updateInternalState() {
    if (this.isInitialized && this.wasmGame) {
      this.currentPlayer = this.getCurrentPlayer();
      this.gameOver = this.isGameOver();
      this.winner = this.getWinner();
    }
  }
  
  // Get winning positions for UI highlighting
  getWinningPositions() {
    if (!this.isInitialized || !this.wasmGame || !this.isGameOver()) return [];
    
    try {
      const flatPositions = Array.from(this.wasmGame.get_winning_positions());
      const positions = [];
      
      for (let i = 0; i < flatPositions.length; i += 2) {
        positions.push({ row: flatPositions[i], col: flatPositions[i + 1] });
      }
      
      return positions;
    } catch (error) {
      console.warn('Could not get winning positions:', error);
      return [];
    }
  }
}

// Export for use in other modules
window.GobangGame = GobangGame;

// Player enum from WASM only - no JavaScript fallback
window.Player = window.WasmPlayer || { Yellow: 1, Red: 2 };