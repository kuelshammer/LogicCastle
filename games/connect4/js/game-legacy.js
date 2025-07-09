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
      
      // Try different WASM paths for GitHub Pages with cache busting
      const cacheBuster = '?v=ade48fa_fork_detection'; // Force new WASM version
      const wasmPaths = [
        '/LogicCastle/game_engine/pkg/game_engine_bg.wasm' + cacheBuster, // GitHub Pages absolute path
        '../../../game_engine/pkg/game_engine_bg.wasm' + cacheBuster, // Local relative path
        'https://www.maxkuelshammer.de/LogicCastle/game_engine/pkg/game_engine_bg.wasm' + cacheBuster // Full URL
      ];
      
      // Import the WASM module with correct relative path
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
      console.log('✅ WASM game engine fully initialized - VERSION 2025-06-29 16:30');
      
      // Verify critical functions are available
      const criticalFunctions = ['simulate_move_connect4_js', 'analyze_position', 'check_win'];
      const missingFunctions = criticalFunctions.filter(func => typeof this.wasmGame[func] !== 'function');
      if (missingFunctions.length > 0) {
        console.warn('⚠️ Missing WASM functions:', missingFunctions);
      } else {
        console.log('✅ All critical WASM functions available');
      }
      
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

  // NEW ASSISTANCE FUNCTIONS
  
  // Get threat analysis for player assistance
  getThreatAnalysis() {
    if (!this.isInitialized || !this.wasmGame) return null;
    
    try {
      const analysis = this.wasmGame.analyze_position();
      return {
        currentPlayerThreats: analysis.get_current_player_threats(),
        opponentThreats: analysis.get_opponent_threats(),
        totalPieces: analysis.get_total_pieces(),
        gamePhase: analysis.get_game_phase(),
        isCritical: analysis.is_critical(),
        threatAdvantage: analysis.threat_advantage()
      };
    } catch (error) {
      console.warn('Failed to analyze position:', error);
      return null;
    }
  }
  
  // Get columns with winning moves for current player (JavaScript implementation)
  getWinningMoves() {
    if (!this.isInitialized || !this.wasmGame) {
      console.warn('🚫 getWinningMoves: Game not initialized or WASM not available');
      return [];
    }
    
    try {
      const winningCols = [];
      const currentPlayerVal = this.getCurrentPlayer();
      const currentBoard = this.getBoard();
      
      console.log(`🔍 JS getWinningMoves: Analyzing for player ${currentPlayerVal}`);
      console.log(`🔍 Current board state:`, currentBoard);
      
      for (let col = 0; col < this.cols; col++) {
        if (!this.isColumnFull(col)) {
          // Find where the piece would land
          const dropRow = this.getDropRow(col);
          if (dropRow !== -1) {
            // Use WASM simulation to check if this move would win
            try {
              const simulated = this.wasmGame.simulate_move_connect4_js(col);
              if (simulated && simulated.check_win() === currentPlayerVal) {
                winningCols.push(col);
                console.log(`✅ Column ${col + 1} is a WINNING MOVE!`);
              }
            } catch (simulationError) {
              console.warn(`⚠️ Could not simulate move in column ${col}:`, simulationError);
            }
          }
        }
      }
      
      console.log(`🏆 getWinningMoves result: [${winningCols.map(c => c + 1).join(', ')}]`);
      return winningCols;
    } catch (error) {
      console.error('❌ Failed to get winning moves:', error);
      return [];
    }
  }
  
  // Get columns with blocking moves (where I need to play to block opponent threats)
  getBlockingMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const blockingCols = [];
      const currentPlayer = this.getCurrentPlayer();
      const opponentVal = currentPlayer === window.WasmPlayer?.Yellow ? window.WasmPlayer?.Red : window.WasmPlayer?.Yellow;
      
      console.log(`🔍 getBlockingMoves: Current player ${currentPlayer}, Opponent ${opponentVal}`);
      
      // Strategy: Check each column to see if opponent can win by playing there next turn
      for (let col = 0; col < this.cols; col++) {
        if (!this.isColumnFull(col)) {
          try {
            // Simulate placing OPPONENT's piece in this column
            const currentBoard = this.getBoard();
            const dropRow = this.getDropRow(col);
            
            if (dropRow >= 0) {
              const simulatedBoard = [...currentBoard];
              simulatedBoard[dropRow * this.cols + col] = opponentVal;
              
              // Check if this creates a win for opponent
              if (this.checkWinInBoard(simulatedBoard, dropRow, col, opponentVal)) {
                blockingCols.push(col);
                console.log(`🛡️ Found blocking move: Column ${col + 1} (stops opponent win)`);
              }
            }
          } catch (moveError) {
            console.warn(`⚠️ Could not check blocking for column ${col}:`, moveError);
          }
        }
      }
      
      console.log(`🛡️ getBlockingMoves result: [${blockingCols.map(c => c + 1).join(', ')}]`);
      return blockingCols;
    } catch (error) {
      console.warn('Failed to get blocking moves:', error);
      return [];
    }
  }
  
  // Helper function to check if a move creates a win in a given board state
  checkWinInBoard(board, row, col, player) {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical  
      [1, 1],   // diagonal \
      [1, -1]   // diagonal /
    ];
    
    for (const [deltaRow, deltaCol] of directions) {
      let count = 1; // Count the piece we just placed
      
      // Check positive direction
      let checkRow = row + deltaRow;
      let checkCol = col + deltaCol;
      while (checkRow >= 0 && checkRow < this.rows && 
             checkCol >= 0 && checkCol < this.cols && 
             board[checkRow * this.cols + checkCol] === player) {
        count++;
        checkRow += deltaRow;
        checkCol += deltaCol;
      }
      
      // Check negative direction
      checkRow = row - deltaRow;
      checkCol = col - deltaCol;
      while (checkRow >= 0 && checkRow < this.rows && 
             checkCol >= 0 && checkCol < this.cols && 
             board[checkRow * this.cols + checkCol] === player) {
        count++;
        checkRow -= deltaRow;
        checkCol -= deltaCol;
      }
      
      if (count >= 4) {
        return true;
      }
    }
    
    return false;
  }

  // Get fork-blocking moves using WASM (bottom row pattern _ x _ x _)
  getForkBlockingMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const forkBlocks = Array.from(this.wasmGame.get_fork_blocking_moves());
      console.log(`🔱 WASM Fork-blocking moves: [${forkBlocks.map(c => c + 1).join(', ')}]`);
      return forkBlocks;
    } catch (error) {
      console.warn('Failed to get WASM fork-blocking moves:', error);
      return [];
    }
  }

  // Get columns that give opponent immediate winning opportunities (dangerous moves) 
  getDangerousMoves() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const dangerousCols = [];
      const currentPlayer = this.getCurrentPlayer();
      const opponentVal = currentPlayer === window.WasmPlayer?.Yellow ? window.WasmPlayer?.Red : window.WasmPlayer?.Yellow;
      
      console.log(`⚠️ getDangerousMoves: Checking which columns give opponent winning chances`);
      
      // FIRST: Check for immediate fork threats (Zwickmühle pattern _ x _ x _)
      const forkThreats = this.getForkBlockingMoves();
      if (forkThreats.length > 0) {
        console.log(`🔱 Critical fork threats detected! Must play in: [${forkThreats.map(c => c + 1).join(', ')}]`);
        // All other moves are dangerous when fork threats exist
        for (let col = 0; col < this.cols; col++) {
          if (!this.isColumnFull(col) && !forkThreats.includes(col)) {
            dangerousCols.push(col);
          }
        }
      }
      
      // SECOND: Check regular dangerous moves (moves that give opponent winning opportunities)
      for (let col = 0; col < this.cols; col++) {
        if (!this.isColumnFull(col) && !dangerousCols.includes(col)) {
          try {
            // Simulate ME playing in this column
            const myMove = this.wasmGame.simulate_move_connect4_js(col);
            if (myMove) {
              // After my move, check if opponent would have immediate winning moves
              const boardAfterMyMove = Array.from(myMove.get_board());
              
              // Check each column to see if opponent can win immediately
              for (let opponentCol = 0; opponentCol < this.cols; opponentCol++) {
                if (!this.isColumnFullInBoard(boardAfterMyMove, opponentCol)) {
                  const opponentDropRow = this.getDropRowInBoard(boardAfterMyMove, opponentCol);
                  if (opponentDropRow >= 0) {
                    // Simulate opponent's move
                    const testBoard = [...boardAfterMyMove];
                    testBoard[opponentDropRow * this.cols + opponentCol] = opponentVal;
                    
                    // Check if opponent would win
                    if (this.checkWinInBoard(testBoard, opponentDropRow, opponentCol, opponentVal)) {
                      dangerousCols.push(col);
                      console.log(`⚠️ DANGEROUS: Column ${col + 1} gives opponent winning move in column ${opponentCol + 1}`);
                      break; // No need to check more opponent moves for this column
                    }
                  }
                }
              }
            }
          } catch (moveError) {
            console.warn(`⚠️ Could not check dangerous move for column ${col}:`, moveError);
          }
        }
      }
      
      console.log(`⚠️ getDangerousMoves result: [${dangerousCols.map(c => c + 1).join(', ')}]`);
      return dangerousCols;
    } catch (error) {
      console.warn('Failed to get dangerous moves:', error);
      return [];
    }
  }

  // Get columns that are strategically blocked (lead to bad positions - "Fallen")
  getBlockedColumns() {
    if (!this.isInitialized || !this.wasmGame) return [];
    
    try {
      const blockedCols = [];
      const currentPlayer = this.getCurrentPlayer();
      const opponentVal = currentPlayer === window.WasmPlayer?.Yellow ? window.WasmPlayer?.Red : window.WasmPlayer?.Yellow;
      
      console.log(`🔍 getBlockedColumns: Checking for traps/dangerous moves for player ${currentPlayer}`);
      
      for (let col = 0; col < this.cols; col++) {
        if (!this.isColumnFull(col)) {
          try {
            // Check if playing in this column creates a "trap" - opponent gets immediate winning opportunity
            const myMove = this.wasmGame.simulate_move_connect4_js(col);
            if (myMove) {
              // After my move, check if opponent gets immediate winning moves
              const myMoveBoard = Array.from(myMove.get_board());
              const opponentWinningMoves = [];
              
              // Check each column to see if opponent can win immediately after my move
              for (let opponentCol = 0; opponentCol < this.cols; opponentCol++) {
                if (!this.isColumnFullInBoard(myMoveBoard, opponentCol)) {
                  const opponentDropRow = this.getDropRowInBoard(myMoveBoard, opponentCol);
                  if (opponentDropRow >= 0) {
                    // Simulate opponent's move
                    const opponentBoard = [...myMoveBoard];
                    opponentBoard[opponentDropRow * this.cols + opponentCol] = opponentVal;
                    
                    if (this.checkWinInBoard(opponentBoard, opponentDropRow, opponentCol, opponentVal)) {
                      opponentWinningMoves.push(opponentCol);
                    }
                  }
                }
              }
              
              // If my move gives opponent 2 or more winning options (fork), it's a trap
              if (opponentWinningMoves.length >= 2) {
                blockedCols.push(col);
                console.log(`🚫 Found trap: Column ${col + 1} gives opponent ${opponentWinningMoves.length} winning moves: [${opponentWinningMoves.map(c => c + 1).join(', ')}]`);
              }
              
              // If my move gives opponent ANY winning move and I don't have counter-threats, it might be dangerous
              else if (opponentWinningMoves.length === 1) {
                // Check if I have counter-threats after opponent's potential winning move
                const hasCounterThreats = this.hasCounterThreats(myMoveBoard, currentPlayer);
                if (!hasCounterThreats) {
                  // This move gives opponent a winning move and I have no counter - dangerous
                  blockedCols.push(col);
                  console.log(`⚠️ Found dangerous move: Column ${col + 1} gives opponent winning move ${opponentWinningMoves[0] + 1} with no counter-threats`);
                }
              }
            }
          } catch (moveError) {
            console.warn(`⚠️ Could not analyze column ${col} for traps:`, moveError);
          }
        }
      }
      
      console.log(`🚫 getBlockedColumns result: [${blockedCols.map(c => c + 1).join(', ')}]`);
      return blockedCols;
    } catch (error) {
      console.warn('Failed to get blocked columns:', error);
      return [];
    }
  }
  
  // Helper function to check if board column is full
  isColumnFullInBoard(board, col) {
    return board[col] !== 0; // Top row is not empty
  }
  
  // Helper function to get drop row in a board
  getDropRowInBoard(board, col) {
    if (this.isColumnFullInBoard(board, col)) return -1;
    
    for (let row = this.rows - 1; row >= 0; row--) {
      if (board[row * this.cols + col] === 0) {
        return row;
      }
    }
    return -1;
  }
  
  // Helper function to check if player has counter-threats
  hasCounterThreats(board, player) {
    // Simple implementation: check if player has any 3-in-a-row that can be completed
    // This is a simplified version - in practice, this should be more sophisticated
    for (let col = 0; col < this.cols; col++) {
      if (!this.isColumnFullInBoard(board, col)) {
        const dropRow = this.getDropRowInBoard(board, col);
        if (dropRow >= 0) {
          const testBoard = [...board];
          testBoard[dropRow * this.cols + col] = player;
          if (this.checkWinInBoard(testBoard, dropRow, col, player)) {
            return true; // Player has an immediate winning move
          }
        }
      }
    }
    return false;
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