/**
 * Connect4Evaluation - Simple position evaluation for Connect 4
 *
 * This evaluates positions by counting how many possible 4-in-a-row combinations
 * can still be made through a given position.
 */
class Connect4Evaluation {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.EMPTY = 0;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
    }

    /**
     * Evaluate a position by counting possible 4-in-a-row combinations
     * @param {Array} board - 2D array representing the game board
     * @param {number} row - Row of the position to evaluate
     * @param {number} col - Column of the position to evaluate
     * @param {number} player - Player number (1 or 2)
     * @returns {number} Score representing how many 4-combinations are possible
     */
    evaluatePosition(board, row, col, player) {
        let score = 0;

        // All four directions for 4-in-a-row
        const directions = [
            [0, 1],   // Horizontal →
            [1, 0],   // Vertical ↓
            [1, 1],   // Diagonal ↘
            [1, -1]   // Diagonal ↙
        ];

        // For each direction, check all possible 4-sequences that pass through (row, col)
        for (const [deltaRow, deltaCol] of directions) {
            // A position can be part of up to 4 different 4-sequences in each direction
            // offset -3: position is 4th in sequence
            // offset -2: position is 3rd in sequence
            // offset -1: position is 2nd in sequence
            // offset  0: position is 1st in sequence
            for (let offset = -3; offset <= 0; offset++) {
                const startRow = row + offset * deltaRow;
                const startCol = col + offset * deltaCol;

                // Check if this 4-sequence is still possible
                if (this.isFourSequencePossible(board, startRow, startCol, deltaRow, deltaCol, player)) {
                    score++;
                }
            }
        }

        return score;
    }

    /**
     * Check if a 4-in-a-row sequence is still possible
     * @param {Array} board - 2D array representing the game board
     * @param {number} startRow - Starting row of the sequence
     * @param {number} startCol - Starting column of the sequence
     * @param {number} deltaRow - Row direction (+1, 0, -1)
     * @param {number} deltaCol - Column direction (+1, 0, -1)
     * @param {number} player - Player number (1 or 2)
     * @returns {boolean} True if the sequence is still possible
     */
    isFourSequencePossible(board, startRow, startCol, deltaRow, deltaCol, player) {
        const opponent = player === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;

        // Check all 4 positions in the sequence
        for (let i = 0; i < 4; i++) {
            const r = startRow + i * deltaRow;
            const c = startCol + i * deltaCol;

            // Outside board bounds = impossible
            if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) {
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
     * @param {Connect4Game} game - The game instance
     * @returns {Array} Array of {col, score} objects sorted by score (descending)
     */
    evaluateAllMoves(game) {
        const validMoves = game.getValidMoves();
        const evaluations = [];

        for (const col of validMoves) {
            // Find where the piece would land
            let row = -1;
            for (let r = game.ROWS - 1; r >= 0; r--) {
                if (game.board[r][col] === game.EMPTY) {
                    row = r;
                    break;
                }
            }

            if (row !== -1) {
                const score = this.evaluatePosition(game.board, row, col, game.currentPlayer);
                evaluations.push({ col, row, score });
            }
        }

        // Sort by score (highest first)
        evaluations.sort((a, b) => b.score - a.score);

        return evaluations;
    }

    /**
     * Get the best move based on simple evaluation
     * @param {Connect4Game} game - The game instance
     * @returns {number|null} Column number for best move, or null if no valid moves
     */
    getBestMove(game) {
        const evaluations = this.evaluateAllMoves(game);

        if (evaluations.length === 0) {
            return null;
        }

        // Return the column with highest score
        return evaluations[0].col;
    }

    /**
     * Debug function to print evaluation scores for all moves
     * @param {Connect4Game} game - The game instance
     */
    debugEvaluations(game) {
        const evaluations = this.evaluateAllMoves(game);

        console.log('=== Position Evaluations ===');
        console.log('Player:', game.currentPlayer === game.PLAYER1 ? 'Red' : 'Yellow');

        for (const evalItem of evaluations) {
            console.log(`Column ${evalItem.col + 1}: Score ${evalItem.score} (lands at row ${evalItem.row + 1})`);
        }

        if (evaluations.length > 0) {
            console.log(`Best move: Column ${evaluations[0].col + 1} with score ${evaluations[0].score}`);
        }
    }
}
