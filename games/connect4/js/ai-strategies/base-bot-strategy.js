/**
 * BaseBotStrategy - Abstract base class for all Connect4 bot strategies
 *
 * Defines the common interface and universal 4-stage logic that all bots must follow:
 * Stage 1: Direct win possible - play winning move
 * Stage 2: ALWAYS block - prevent opponent wins and forks
 * Stage 3: Identify trapped columns - avoid moves that give opponent a win
 * Stage 4: Bot-specific selection from remaining safe columns
 */
class BaseBotStrategy {
    constructor(gameConstants) {
        this.ROWS = gameConstants.ROWS;
        this.COLS = gameConstants.COLS;
        this.EMPTY = gameConstants.EMPTY;
        this.PLAYER1 = gameConstants.PLAYER1;
        this.PLAYER2 = gameConstants.PLAYER2;

        this.name = 'base';
        this.description = 'Base strategy class';
    }

    /**
     * Main entry point - get the best move using universal logic
     * @param {Object} game - Game instance
     * @param {Object} helpers - Helpers instance (optional)
     * @returns {number|null} Column index for best move
     */
    getBestMove(game, helpers) {
        const winningMove = this.findWinningMove(game);
        if (winningMove !== null) {
            return winningMove;
        }

        const blockingMove = this.findBlockingMove(game);
        if (blockingMove !== null) {
            return blockingMove;
        }

        if (game.moveHistory.length === 0) {
            return Math.floor(this.COLS / 2);
        }

        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) {
            return null;
        }

        const safeColumns = this.findSafeColumns(game, validMoves);
        if (safeColumns.length === 0) {
            const centerBiased = this.getCenterBiasedMove(validMoves);
            return centerBiased !== null ? centerBiased : validMoves[0];
        }

        return this.selectFromSafeColumns(game, safeColumns, helpers);
    }

    /**
     * Find direct winning move for current player
     * @param {Object} game - Game instance
     * @returns {number|null} Winning column or null
     */
    findWinningMove(game) {
        const validMoves = game.getValidMoves();

        for (const col of validMoves) {
            const result = game.simulateMove(col);
            if (result.winner === game.currentPlayer) {
                return col;
            }
        }

        return null;
    }

    /**
     * Find move to block opponent's winning threat
     * @param {Object} game - Game instance
     * @returns {number|null} Blocking column or null
     */
    findBlockingMove(game) {
        const validMoves = game.getValidMoves();
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;

        for (const col of validMoves) {
            // Simulate opponent move
            const tempBoard = this.deepCopyBoard(game.board);
            const row = this.getLowestEmptyRow(tempBoard, col);

            if (row !== -1) {
                tempBoard[row][col] = opponent;

                if (this.checkWinOnBoard(tempBoard, row, col, opponent)) {
                    return col; // Block this winning move
                }
            }
        }

        // Check for critical fork patterns
        return this.checkForCriticalForks(game);
    }

    /**
     * Find columns that don't lead to immediate opponent wins
     * @param {Object} game - Game instance
     * @param {Array} validMoves - Array of valid column indices
     * @returns {Array} Array of safe column indices
     */
    findSafeColumns(game, validMoves) {
        const safeColumns = [];
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;

        for (const col of validMoves) {
            const result = game.simulateMove(col);

            // Check if this move gives opponent an immediate win
            const opponentWinningMoves = this.getOpponentWinningMoves(result.game, opponent);

            if (opponentWinningMoves.length === 0) {
                safeColumns.push(col);
            }
        }

        // If no safe moves, prefer center columns as fallback
        if (safeColumns.length === 0) {
            const center = Math.floor(this.COLS / 2);
            const centerBiased = validMoves.slice().sort((a, b) => {
                return Math.abs(a - center) - Math.abs(b - center);
            });
            return [centerBiased[0]];
        }

        return safeColumns;
    }

    /**
     * Bot-specific move selection from safe columns
     * Must be implemented by each bot strategy
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @param {Object} helpers - Helpers instance
     * @returns {number} Selected column index
     */
    selectFromSafeColumns(_game, _safeColumns, _helpers) {
        throw new Error('selectFromSafeColumns must be implemented by bot strategy');
    }

    /**
     * Get opponent's winning moves from current position
     * @param {Object} game - Game instance
     * @param {number} opponent - Opponent player number
     * @returns {Array} Array of winning column indices for opponent
     */
    getOpponentWinningMoves(game, opponent) {
        const winningMoves = [];
        const validMoves = game.getValidMoves();

        for (const col of validMoves) {
            const tempBoard = this.deepCopyBoard(game.board);
            const row = this.getLowestEmptyRow(tempBoard, col);

            if (row !== -1) {
                tempBoard[row][col] = opponent;

                if (this.checkWinOnBoard(tempBoard, row, col, opponent)) {
                    winningMoves.push(col);
                }
            }
        }

        return winningMoves;
    }

    /**
     * Check for critical fork situations (minimal implementation)
     * @param {Object} game - Game instance
     * @returns {number|null} Column to block fork or null
     */
    checkForCriticalForks(game) {
        // Only check forks in mid-to-late game
        if (game.moveHistory.length < 8) {
            return null;
        }

        // Simple fork check: look for _ x _ x patterns in bottom 2 rows
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;

        for (let row = this.ROWS - 2; row < this.ROWS; row++) {
            for (let col = 0; col <= this.COLS - 4; col++) {
                const window = [
                    game.board[row][col],
                    game.board[row][col + 1],
                    game.board[row][col + 2],
                    game.board[row][col + 3]
                ];

                if (this.isExactForkPattern(window, opponent)) {
                    // Block the first empty position
                    for (let i = 0; i < 4; i++) {
                        if (window[i] === this.EMPTY) {
                            const targetCol = col + i;
                            if (game.getValidMoves().includes(targetCol)) {
                                return targetCol;
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Check if pattern is exact fork: [empty, player, empty, player]
     * @param {Array} window - 4-element array
     * @param {number} player - Player number
     * @returns {boolean} True if exact fork pattern
     */
    isExactForkPattern(window, player) {
        return (
            window[0] === this.EMPTY &&
            window[1] === player &&
            window[2] === this.EMPTY &&
            window[3] === player
        );
    }

    /**
     * Utility: Deep copy board
     * @param {Array} board - Game board
     * @returns {Array} Deep copy of board
     */
    deepCopyBoard(board) {
        // Unused parameter prefixed
        return board.map(row => [...row]);
    }

    /**
     * Utility: Get lowest empty row in column
     * @param {Array} board - Game board
     * @param {number} col - Column index
     * @returns {number} Row index or -1 if column full
     */
    getLowestEmptyRow(board, col) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === this.EMPTY) {
                return row;
            }
        }
        return -1;
    }

    /**
     * Utility: Check win on board at position
     * @param {Array} board - Game board
     * @param {number} row - Row position
     * @param {number} col - Column position
     * @param {number} player - Player number
     * @returns {boolean} True if win detected
     */
    checkWinOnBoard(board, row, col, player) {
        const directions = [
            [0, 1], // horizontal
            [1, 0], // vertical
            [1, 1], // diagonal \
            [1, -1] // diagonal /
        ];

        for (const [dRow, dCol] of directions) {
            let count = 1;

            // Check positive direction
            let r = row + dRow;
            let c = col + dCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === player) {
                count++;
                r += dRow;
                c += dCol;
            }

            // Check negative direction
            r = row - dRow;
            c = col - dCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === player) {
                count++;
                r -= dRow;
                c -= dCol;
            }

            if (count >= 4) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get strategy metadata
     * @returns {Object} Strategy information
     */
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            type: 'base',
            difficulty: 'unknown'
        };
    }
}

export { BaseBotStrategy };
