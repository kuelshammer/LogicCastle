/**
 * GobangAI - Smart Bot AI for Gobang game
 * Uses helpers system for strategic decisions and weighted random moves
 */
class GobangAI {
  constructor(difficulty = 'smart-random') {
    this.difficulty = difficulty;
    this.evaluator = null; // Will be created when needed
  }

  /**
     * Get the best move for the current player using Smart Bot strategy
     * @param {GobangGame} game - Game instance
     * @param {GobangHelpers} helpers - Helpers system for strategic analysis
     * @returns {Object} - Best move {row, col}
     */
  getBestMove(game, helpers = null) {
    // Smart Bot always uses smart-random strategy with helpers system
    return this.getSmartRandomMove(game, helpers);
  }

  /**
     * Smart-Random strategy: Use helpers for critical moves, weighted random for others
     * @param {GobangGame} game - Game instance
     * @param {GobangHelpers} helpers - Helpers system
     * @returns {Object} - Selected move {row, col}
     */
  getSmartRandomMove(game, helpers) {
    console.log('🤖 Smart Bot thinking...');

    if (helpers) {
      // Store original helpers state
      const wasEnabled = helpers.enabled;
      const wasLevel = helpers.level;

      // PRIORITY 1: Check Level 0 - Winning moves
      helpers.setEnabled(true, 0);
      helpers.updateHints(); // Force update to get winning moves

      if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
        console.log('🤖 Smart Bot: WINNING move available!', helpers.requiredMoves);

        // Copy the moves array BEFORE restoring state
        const winningMoves = [...helpers.requiredMoves];
        console.log('🤖 Smart Bot: Copied winning moves:', winningMoves.length);

        // Restore original helpers state
        helpers.setEnabled(wasEnabled, wasLevel);

        // Choose randomly among winning moves if multiple exist
        const randomIndex = Math.floor(Math.random() * winningMoves.length);
        const chosenMove = winningMoves[randomIndex];
        console.log('🤖 Smart Bot: Winning move chosen:', chosenMove);
        return chosenMove;
      }

      // PRIORITY 2: Check Level 1 - Block opponent threats
      helpers.setEnabled(true, 1);
      helpers.updateHints(); // Force update to get threat analysis

      if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
        console.log('🤖 Smart Bot: BLOCKING threat at positions', helpers.requiredMoves);

        // Copy the moves array BEFORE restoring state
        const blockingMoves = [...helpers.requiredMoves];
        console.log('🤖 Smart Bot: Copied blocking moves:', blockingMoves, 'length:', blockingMoves.length);

        // Restore original helpers state
        helpers.setEnabled(wasEnabled, wasLevel);

        // Choose randomly among required blocking moves if multiple exist
        const randomIndex = Math.floor(Math.random() * blockingMoves.length);
        const chosenMove = blockingMoves[randomIndex];
        console.log('🤖 Smart Bot: Blocking move chosen:', chosenMove);
        return chosenMove;
      }

      // PRIORITY 3: Check Level 2 - Avoid traps (safe moves only)
      helpers.setEnabled(true, 2);
      helpers.updateHints(); // Force update to get trap analysis

      if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
        console.log('🤖 Smart Bot: AVOIDING TRAPS, safe moves:', helpers.requiredMoves);

        // Copy the moves array BEFORE restoring state
        const safeMoves = [...helpers.requiredMoves];
        console.log('🤖 Smart Bot: Copied safe moves:', safeMoves, 'length:', safeMoves.length);

        // Restore original helpers state
        helpers.setEnabled(wasEnabled, wasLevel);

        // Use weighted selection among safe moves
        return this.getWeightedRandomFromMoves(game, safeMoves);
      }

      // Restore original helpers state
      helpers.setEnabled(wasEnabled, wasLevel);
    }

    // PRIORITY 4: No critical moves found - make weighted random move
    console.log('🤖 Smart Bot: No critical moves, using WEIGHTED RANDOM');
    return this.getWeightedRandomMove(game);
  }

  /**
     * Get weighted random move from a specific set of moves
     */
  getWeightedRandomFromMoves(game, moves) {
    if (!this.evaluator && typeof GobangEvaluation !== 'undefined') {
      this.evaluator = new GobangEvaluation();
    }

    const evaluations = [];

    for (const move of moves) {
      const score = this.evaluator.evaluatePosition(game.board, move.row, move.col, game.currentPlayer);
      evaluations.push({ row: move.row, col: move.col, score });
    }

    // Create weighted list
    const weightedList = [];

    for (const evaluation of evaluations) {
      const weight = Math.max(1, evaluation.score);

      for (let i = 0; i < weight; i++) {
        weightedList.push({ row: evaluation.row, col: evaluation.col });
      }
    }

    console.log('🎯 Smart Bot weighted selection from safe moves:');
    evaluations.forEach(evaluation => {
      const weight = Math.max(1, evaluation.score);
      const coord = `(${evaluation.row + 1}, ${String.fromCharCode(65 + evaluation.col)})`;
      console.log(`  ${coord}: Score ${evaluation.score} → Weight ${weight}`);
    });

    // Select randomly from weighted list
    const selectedIndex = Math.floor(Math.random() * weightedList.length);
    const selectedMove = weightedList[selectedIndex];

    const coord = `(${selectedMove.row + 1}, ${String.fromCharCode(65 + selectedMove.col)})`;
    console.log(`🎯 Selected: ${coord} (index ${selectedIndex} from ${weightedList.length} options)`);

    return selectedMove;
  }

  /**
     * Weighted random move using evaluation function
     */
  getWeightedRandomMove(game) {
    // Use evaluation function for weighted selection if available
    if (typeof GobangEvaluation !== 'undefined') {
      if (!this.evaluator) {
        this.evaluator = new GobangEvaluation();
      }

      return this.evaluator.getWeightedRandomMove(game);
    }

    // Fallback to simple random if evaluation not available
    return this.getRandomMove(game);
  }

  /**
     * Simple random move (fallback)
     */
  getRandomMove(game) {
    const validMoves = this.getRelevantMoves(game);

    if (validMoves.length === 0) {
      // If no relevant moves, play in center
      const center = Math.floor(game.BOARD_SIZE / 2);
      return { row: center, col: center };
    }

    // Random move
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  /**
     * Get relevant moves (positions near existing stones)
     */
  getRelevantMoves(game) {
    const moves = new Set();
    const board = game.getBoard();
    const searchRadius = 2;

    // If board is empty, start in center
    if (game.moveHistory.length === 0) {
      const center = Math.floor(game.BOARD_SIZE / 2);
      return [{ row: center, col: center }];
    }

    // Find all positions within search radius of existing stones
    for (let row = 0; row < game.BOARD_SIZE; row++) {
      for (let col = 0; col < game.BOARD_SIZE; col++) {
        if (board[row][col] !== game.EMPTY) {
          // Add empty positions within radius
          for (let dr = -searchRadius; dr <= searchRadius; dr++) {
            for (let dc = -searchRadius; dc <= searchRadius; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;

              if (newRow >= 0 && newRow < game.BOARD_SIZE &&
                                newCol >= 0 && newCol < game.BOARD_SIZE &&
                                board[newRow][newCol] === game.EMPTY) {
                moves.add(`${newRow},${newCol}`);
              }
            }
          }
        }
      }
    }

    // Convert set to array of move objects
    return Array.from(moves).map(pos => {
      const [row, col] = pos.split(',').map(Number);
      return { row, col };
    });
  }
}
