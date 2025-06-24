/**
 * GobangHelpers - Helper system for Gobang strategic assistance
 * Provides winning opportunities, threat detection, and trap avoidance
 */
class _GobangHelpers {
  constructor(game, ui = null) {
    this.game = game;
    this.ui = ui;
    this.enabled = false;
    this.level = 0; // 0 = winning moves, 1 = block threats, 2 = avoid traps

    // Forced move system
    this.forcedMoveMode = false;
    this.requiredMoves = [];

    // Event system
    this.eventListeners = {};

    // Directions for line checking
    this.directions = [
      [0, 1],   // Horizontal →
      [1, 0],   // Vertical ↓
      [1, 1],   // Diagonal ↘
      [1, -1]   // Diagonal ↙
    ];
  }

  /**
     * Enable/disable helpers with specific level
     */
  setEnabled(enabled, level = 0) {
    this.enabled = enabled;
    this.level = level;

    if (enabled) {
      this.updateHints();
    } else {
      this.clearForcedMoves();
    }
  }

  /**
     * Update hints based on current game state and level
     */
  updateHints() {
    if (!this.enabled) {
      this.clearForcedMoves();
      return;
    }

    let requiredMoves = [];

    switch (this.level) {
    case 0:
      // Level 0: Find winning moves
      requiredMoves = this.findWinningMoves();
      break;

    case 1:
      // Level 1: Find moves to block opponent threats
      requiredMoves = this.findBlockingMoves();
      break;

    case 2:
      // Level 2: Find safe moves (avoid creating traps)
      requiredMoves = this.findSafeMoves();
      break;
    }

    if (requiredMoves.length > 0) {
      this.setForcedMoves(requiredMoves);
    } else {
      this.clearForcedMoves();
    }
  }

  /**
     * Find winning moves (complete 5-in-a-row)
     */
  findWinningMoves() {
    const winningMoves = [];
    const currentPlayer = this.game.currentPlayer;
    const board = this.game.getBoard(); // Get a copy instead of manipulating original

    // Check all empty positions on the board
    for (let row = 0; row < this.game.BOARD_SIZE; row++) {
      for (let col = 0; col < this.game.BOARD_SIZE; col++) {
        if (board[row][col] === this.game.EMPTY) {
          // Temporarily place the piece on the copy
          board[row][col] = currentPlayer;

          // Check if this completes a 5-in-a-row
          if (this.checkWinAt(row, col, currentPlayer, board)) {
            winningMoves.push({ row, col });
          }

          // Remove the temporary piece from the copy
          board[row][col] = this.game.EMPTY;
        }
      }
    }

    console.log(`🏆 Level 0: Found ${winningMoves.length} winning moves`);
    return winningMoves;
  }

  /**
     * Find moves to block opponent threats (4-in-a-row with one gap)
     */
  findBlockingMoves() {
    const blockingMoves = [];
    const opponent = this.game.currentPlayer === this.game.BLACK ? this.game.WHITE : this.game.BLACK;
    const board = this.game.getBoard(); // Get a copy instead of manipulating original

    // Check all empty positions on the board
    for (let row = 0; row < this.game.BOARD_SIZE; row++) {
      for (let col = 0; col < this.game.BOARD_SIZE; col++) {
        if (board[row][col] === this.game.EMPTY) {
          // Temporarily place opponent piece on the copy
          board[row][col] = opponent;

          // Check if this would complete opponent's 5-in-a-row
          if (this.checkWinAt(row, col, opponent, board)) {
            blockingMoves.push({ row, col });
          }

          // Remove the temporary piece from the copy
          board[row][col] = this.game.EMPTY;
        }
      }
    }

    console.log(`🛡️ Level 1: Found ${blockingMoves.length} blocking moves`);
    return blockingMoves;
  }

  /**
     * Find safe moves (avoid creating immediate threats for opponent)
     */
  findSafeMoves() {
    const safeMoves = [];
    const currentPlayer = this.game.currentPlayer;
    const opponent = currentPlayer === this.game.BLACK ? this.game.WHITE : this.game.BLACK;

    // Get all possible moves
    const allMoves = this.getAllValidMoves();

    for (const move of allMoves) {
      const { row, col } = move;
      const board = this.game.getBoard(); // Get a fresh copy for each move

      // Temporarily place our piece on the copy
      board[row][col] = currentPlayer;

      // Check if this creates an immediate threat for the opponent
      let createsThreat = false;

      // Look for adjacent positions where opponent could create a 4-in-a-row
      for (const [dr, dc] of this.directions) {
        for (let dist = 1; dist <= 2; dist++) {
          const checkRow = row + dr * dist;
          const checkCol = col + dc * dist;

          if (this.isValidPosition(checkRow, checkCol) &&
                        board[checkRow][checkCol] === this.game.EMPTY) {

            // Temporarily place opponent piece on the copy
            board[checkRow][checkCol] = opponent;

            // Check if opponent gets 4-in-a-row
            if (this.count4InARow(checkRow, checkCol, opponent, board) > 0) {
              createsThreat = true;
            }

            // Remove temporary opponent piece from the copy
            board[checkRow][checkCol] = this.game.EMPTY;

            if (createsThreat) {
              break;
            }
          }
        }
        if (createsThreat) {
          break;
        }
      }

      if (!createsThreat) {
        safeMoves.push(move);
      }
    }

    console.log(`⚡ Level 2: Found ${safeMoves.length} safe moves out of ${allMoves.length} total`);
    return safeMoves.length > 0 ? safeMoves : allMoves; // Fallback to all moves if no safe moves
  }

  /**
     * Check if placing a piece at position would create a win
     */
  checkWinAt(row, col, player, board = null) {
    const checkBoard = board || this.game.board;

    for (const [dr, dc] of this.directions) {
      let count = 1; // Count the piece we just placed

      // Count in positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;

        if (!this.isValidPosition(newRow, newCol) ||
                    checkBoard[newRow][newCol] !== player) {
          break;
        }
        count++;
      }

      // Count in negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - dr * i;
        const newCol = col - dc * i;

        if (!this.isValidPosition(newRow, newCol) ||
                    checkBoard[newRow][newCol] !== player) {
          break;
        }
        count++;
      }

      if (count >= 5) {
        return true;
      }
    }

    return false;
  }

  /**
     * Count 4-in-a-row sequences that could be completed
     */
  count4InARow(row, col, player, board = null) {
    const checkBoard = board || this.game.board;
    let count = 0;

    for (const [dr, dc] of this.directions) {
      let sequence = 1; // Count the piece we just placed

      // Count in positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;

        if (!this.isValidPosition(newRow, newCol) ||
                    checkBoard[newRow][newCol] !== player) {
          break;
        }
        sequence++;
      }

      // Count in negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - dr * i;
        const newCol = col - dc * i;

        if (!this.isValidPosition(newRow, newCol) ||
                    checkBoard[newRow][newCol] !== player) {
          break;
        }
        sequence++;
      }

      if (sequence >= 4) {
        count++;
      }
    }

    return count;
  }

  /**
     * Get all valid moves (empty positions adjacent to existing pieces)
     */
  getAllValidMoves() {
    const moves = [];
    const radius = 2; // Search radius around existing pieces
    const board = this.game.getBoard(); // Get a safe copy

    if (this.game.moveHistory.length === 0) {
      // First move: center of board
      const center = Math.floor(this.game.BOARD_SIZE / 2);
      return [{ row: center, col: center }];
    }

    const considered = new Set();

    // Look around all existing pieces
    for (let row = 0; row < this.game.BOARD_SIZE; row++) {
      for (let col = 0; col < this.game.BOARD_SIZE; col++) {
        if (board[row][col] !== this.game.EMPTY) {
          // Check positions around this piece
          for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              const key = `${newRow},${newCol}`;

              if (this.isValidPosition(newRow, newCol) &&
                                board[newRow][newCol] === this.game.EMPTY &&
                                !considered.has(key)) {

                moves.push({ row: newRow, col: newCol });
                considered.add(key);
              }
            }
          }
        }
      }
    }

    return moves;
  }

  /**
     * Check if position is valid on the board
     */
  isValidPosition(row, col) {
    return row >= 0 && row < this.game.BOARD_SIZE &&
               col >= 0 && col < this.game.BOARD_SIZE;
  }

  /**
     * Set forced moves and activate forced move mode
     */
  setForcedMoves(moves) {
    this.forcedMoveMode = true;
    this.requiredMoves = moves;
    this.emit('forcedMoveActivated', { requiredMoves: moves, level: this.level });
  }

  /**
     * Clear forced moves and deactivate forced move mode
     */
  clearForcedMoves() {
    if (this.forcedMoveMode) {
      this.forcedMoveMode = false;
      this.requiredMoves = [];
      this.emit('forcedMoveDeactivated');
    }
  }

  /**
     * Get current hints for display
     */
  getCurrentHints() {
    return {
      forcedMoves: this.forcedMoveMode,
      requiredMoves: this.requiredMoves,
      level: this.level
    };
  }

  // Event system methods
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, data = null) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }
}


// Make available globally for backward compatibility
if (typeof window !== "undefined") {
  window.GobangHelpers = _GobangHelpers;
}
