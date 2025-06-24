/**
 * GobangEvaluation - Position evaluation for Gobang
 *
 * Evaluates positions by counting how many possible 5-in-a-row combinations
 * can still be made through a given position.
 */
class _GobangEvaluation {
  constructor() {
    this.BOARD_SIZE = 15;
    this.EMPTY = 0;
    this.BLACK = 1;
    this.WHITE = 2;
    this.WIN_COUNT = 5;

    // All four directions for 5-in-a-row
    this.directions = [
      [0, 1],   // Horizontal →
      [1, 0],   // Vertical ↓
      [1, 1],   // Diagonal ↘
      [1, -1]   // Diagonal ↙
    ];
  }

  /**
     * Evaluate a position by counting possible 5-in-a-row combinations
     * @param {Array} board - 2D array representing the game board
     * @param {number} row - Row of the position to evaluate
     * @param {number} col - Column of the position to evaluate
     * @param {number} player - Player number (1 or 2)
     * @returns {number} Score representing how many 5-combinations are possible
     */
  evaluatePosition(board, row, col, player) {
    let score = 0;

    // For each direction, check all possible 5-sequences that pass through (row, col)
    for (const [deltaRow, deltaCol] of this.directions) {
      // A position can be part of up to 5 different 5-sequences in each direction
      // offset -4: position is 5th in sequence
      // offset -3: position is 4th in sequence
      // offset -2: position is 3rd in sequence
      // offset -1: position is 2nd in sequence
      // offset  0: position is 1st in sequence
      for (let offset = -4; offset <= 0; offset++) {
        const startRow = row + offset * deltaRow;
        const startCol = col + offset * deltaCol;

        // Check if this 5-sequence is still possible
        if (this.isFiveSequencePossible(board, startRow, startCol, deltaRow, deltaCol, player)) {
          score++;
        }
      }
    }

    return score;
  }

  /**
     * Check if a 5-in-a-row sequence is still possible
     * @param {Array} board - 2D array representing the game board
     * @param {number} startRow - Starting row of the sequence
     * @param {number} startCol - Starting column of the sequence
     * @param {number} deltaRow - Row direction (+1, 0, -1)
     * @param {number} deltaCol - Column direction (+1, 0, -1)
     * @param {number} player - Player number (1 or 2)
     * @returns {boolean} True if the sequence is still possible
     */
  isFiveSequencePossible(board, startRow, startCol, deltaRow, deltaCol, player) {
    const opponent = player === this.BLACK ? this.WHITE : this.BLACK;

    // Check all 5 positions in the sequence
    for (let i = 0; i < this.WIN_COUNT; i++) {
      const r = startRow + i * deltaRow;
      const c = startCol + i * deltaCol;

      // Outside board bounds = impossible
      if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE) {
        return false;
      }

      // Opponent stone = impossible
      if (board[r][c] === opponent) {
        return false;
      }

      // Empty or own stone = still possible
    }

    return true;
  }

  /**
     * Evaluate all valid moves for the current player
     * @param {GobangGame} game - The game instance
     * @returns {Array} Array of {row, col, score} objects sorted by score (descending)
     */
  evaluateAllMoves(game) {
    const validMoves = this.getRelevantMoves(game);
    const evaluations = [];

    for (const move of validMoves) {
      const { row, col } = move;
      const score = this.evaluatePosition(game.board, row, col, game.currentPlayer);
      evaluations.push({ row, col, score });
    }

    // Sort by score (highest first)
    evaluations.sort((a, b) => b.score - a.score);

    return evaluations;
  }

  /**
     * Get relevant moves (empty positions near existing pieces)
     * @param {GobangGame} game - The game instance
     * @returns {Array} Array of {row, col} objects
     */
  getRelevantMoves(game) {
    const moves = [];
    const radius = 2; // Search radius around existing pieces

    if (game.moveHistory.length === 0) {
      // First move: center of board
      const center = Math.floor(this.BOARD_SIZE / 2);
      return [{ row: center, col: center }];
    }

    const considered = new Set();

    // Look around all existing pieces
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (game.board[row][col] !== this.EMPTY) {
          // Check positions around this piece
          for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              const key = `${newRow},${newCol}`;

              if (this.isValidPosition(newRow, newCol) &&
                                game.board[newRow][newCol] === this.EMPTY &&
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
    return row >= 0 && row < this.BOARD_SIZE &&
               col >= 0 && col < this.BOARD_SIZE;
  }

  /**
     * Get the best move based on evaluation
     * @param {GobangGame} game - The game instance
     * @returns {Object|null} {row, col} for best move, or null if no valid moves
     */
  getBestMove(game) {
    const evaluations = this.evaluateAllMoves(game);

    if (evaluations.length === 0) {
      return null;
    }

    // Return the position with highest score
    return { row: evaluations[0].row, col: evaluations[0].col };
  }

  /**
     * Get weighted random move based on evaluation scores
     * @param {GobangGame} game - The game instance
     * @returns {Object|null} {row, col} for selected move, or null if no valid moves
     */
  getWeightedRandomMove(game) {
    const evaluations = this.evaluateAllMoves(game);

    if (evaluations.length === 0) {
      return null;
    }

    // Create weighted list: add each move 'score' times to the list
    const weightedList = [];

    for (const evaluation of evaluations) {
      // Ensure minimum weight of 1 (so all moves are at least possible)
      const weight = Math.max(1, evaluation.score);

      for (let i = 0; i < weight; i++) {
        weightedList.push({ row: evaluation.row, col: evaluation.col });
      }
    }

    console.log('🎯 Gobang weighted selection:');
    evaluations.slice(0, 10).forEach(evaluation => { // Show top 10
      const weight = Math.max(1, evaluation.score);
      console.log(`  (${evaluation.row + 1}, ${String.fromCharCode(65 + evaluation.col)}): Score ${evaluation.score} → Weight ${weight}`);
    });
    console.log(`🎯 Total weighted options: ${weightedList.length}`);

    // Select randomly from weighted list
    const selectedIndex = Math.floor(Math.random() * weightedList.length);
    const selectedMove = weightedList[selectedIndex];

    console.log(`🎯 Selected: (${selectedMove.row + 1}, ${String.fromCharCode(65 + selectedMove.col)}) (index ${selectedIndex})`);

    return selectedMove;
  }

  /**
     * Debug function to print evaluation scores for top moves
     * @param {GobangGame} game - The game instance
     * @param {number} topN - Number of top moves to show
     */
  debugEvaluations(game, topN = 10) {
    const evaluations = this.evaluateAllMoves(game);

    console.log('=== Gobang Position Evaluations ===');
    console.log('Player:', game.currentPlayer === game.BLACK ? 'Black' : 'White');
    console.log(`Showing top ${Math.min(topN, evaluations.length)} moves:`);

    for (let i = 0; i < Math.min(topN, evaluations.length); i++) {
      const evaluation = evaluations[i];
      const coord = `(${evaluation.row + 1}, ${String.fromCharCode(65 + evaluation.col)})`;
      console.log(`${i + 1}. ${coord}: Score ${evaluation.score}`);
    }

    if (evaluations.length > 0) {
      const best = evaluations[0];
      const bestCoord = `(${best.row + 1}, ${String.fromCharCode(65 + best.col)})`;
      console.log(`Best move: ${bestCoord} with score ${best.score}`);
    }
  }
}


// Make available globally for backward compatibility  
if (typeof window !== "undefined") {
  window.GobangEvaluation = _GobangEvaluation;
}
