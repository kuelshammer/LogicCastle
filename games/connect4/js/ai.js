/**
 * Connect4AI - AI opponents for Connect 4 game
 */
class Connect4AI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.cache = new Map();
    }

    /**
     * Get maximum search depth based on difficulty
     */
    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 1;
            case 'medium': return 3;
            case 'hard': return 5;
            case 'expert': return 7;
            default: return 3;
        }
    }

    /**
     * Get the best move for the current game state
     * @param {Connect4Game} game - Current game instance
     * @param {Connect4Helpers} helpers - Optional helpers instance for smart random mode
     * @returns {number} - Column index for the best move
     */
    getBestMove(game, helpers = null) {
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove(game);
            case 'smart-random':
                return this.getSmartRandomMove(game, helpers);
            case 'medium':
                return this.getRuleBasedMove(game);
            case 'hard':
            case 'expert':
                return this.getMinimaxMove(game);
            default:
                return this.getRuleBasedMove(game);
        }
    }

    /**
     * Smart Random AI: Uses Level 1 help system to block threats, otherwise random
     * @param {Connect4Game} game - Current game instance
     * @param {Connect4Helpers} helpers - Helpers instance for threat detection
     * @returns {number} - Column index for the move
     */
    getSmartRandomMove(game, helpers) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        // PRIORITY 0: If board is empty, play center column (best opening move)
        const totalMoves = game.moveHistory.length;
        if (totalMoves === 0) {
            return 3; // Center column (0-indexed)
        }

        // Use helpers system for Level 0 + 1 analysis
        if (helpers) {
            // Store original helpers state
            const wasEnabled = helpers.enabled;
            const wasLevel = helpers.helpLevel;

            // PRIORITY 1: Check Level 0 - Own winning opportunities
            helpers.setEnabled(true, 0);
            helpers.updateHints(); // Force update to get current state

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🤖 Smart Bot: WINNING at columns', helpers.requiredMoves);

                // IMPORTANT: Copy the moves array BEFORE restoring state
                const winningMoves = [...helpers.requiredMoves];
                console.log('🤖 Smart Bot: Copied winning moves:', winningMoves, 'length:', winningMoves.length);

                // Restore original helpers state
                helpers.setEnabled(wasEnabled, wasLevel);

                // Choose randomly among winning moves if multiple exist
                const randomIndex = Math.floor(Math.random() * winningMoves.length);
                const chosenMove = winningMoves[randomIndex];
                console.log('🤖 Smart Bot: Random index:', randomIndex, 'chosen move:', chosenMove);
                return chosenMove;
            }

            // PRIORITY 2: Check Level 1 - Block opponent's threats
            helpers.setEnabled(true, 1);
            helpers.updateHints(); // Force update to get current threats

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🤖 Smart Bot: BLOCKING threat at columns', helpers.requiredMoves);

                // IMPORTANT: Copy the moves array BEFORE restoring state
                const blockingMoves = [...helpers.requiredMoves];
                console.log('🤖 Smart Bot: Copied blocking moves:', blockingMoves, 'length:', blockingMoves.length);

                // Restore original helpers state
                helpers.setEnabled(wasEnabled, wasLevel);

                // Choose randomly among required blocking moves if multiple exist
                const randomIndex = Math.floor(Math.random() * blockingMoves.length);
                const chosenMove = blockingMoves[randomIndex];
                console.log('🤖 Smart Bot: Random index:', randomIndex, 'chosen move:', chosenMove);
                return chosenMove;
            }

            // PRIORITY 3: Check Level 2 - Avoid traps (safe moves only)
            helpers.setEnabled(true, 2);
            helpers.updateHints(); // Force update to get trap analysis

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🤖 Smart Bot: AVOIDING TRAPS, safe moves:', helpers.requiredMoves);

                // IMPORTANT: Copy the moves array BEFORE restoring state
                const safeMoves = [...helpers.requiredMoves];
                console.log('🤖 Smart Bot: Copied safe moves:', safeMoves, 'length:', safeMoves.length);

                // Restore original helpers state
                helpers.setEnabled(wasEnabled, wasLevel);

                // Choose randomly among safe moves if multiple exist
                const randomIndex = Math.floor(Math.random() * safeMoves.length);
                const chosenMove = safeMoves[randomIndex];
                console.log('🤖 Smart Bot: Random safe move index:', randomIndex, 'chosen move:', chosenMove);
                return chosenMove;
            }

            // Restore original helpers state
            helpers.setEnabled(wasEnabled, wasLevel);
        }

        // PRIORITY 4: No critical moves found - make random move
        console.log('🤖 Smart Bot: No critical moves, playing RANDOM');
        return this.getRandomMove(game);
    }

    /**
     * Easy AI: Random moves with basic blocking
     */
    getRandomMove(game) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        // 30% chance to block immediate threats
        if (Math.random() < 0.3) {
            const blockingMove = this.findBlockingMove(game);
            if (blockingMove !== null) {
                return blockingMove;
            }
        }

        // Otherwise random move
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    /**
     * Smart weighted move selection based on position potential
     */
    getWeightedMove(game) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        if (validMoves.length === 1) {
            return validMoves[0];
        }

        // Evaluate each move's potential
        const moveWeights = validMoves.map(col => {
            const potential = this.evaluatePositionPotential(game, col, game.currentPlayer);
            return {
                column: col,
                weight: potential
            };
        });

        console.log('🤖 Move weights:', moveWeights);

        // Calculate total weight
        const totalWeight = moveWeights.reduce((sum, move) => sum + move.weight, 0);

        // If all moves have zero weight, use equal weighting
        if (totalWeight === 0) {
            console.log('🤖 All moves have zero weight, choosing randomly');
            return validMoves[Math.floor(Math.random() * validMoves.length)];
        }

        // Weighted random selection
        let randomValue = Math.random() * totalWeight;

        for (const move of moveWeights) {
            randomValue -= move.weight;
            if (randomValue <= 0) {
                console.log(`🤖 Selected column ${move.column + 1} with weight ${move.weight}`);
                return move.column;
            }
        }

        // Fallback to last move
        return moveWeights[moveWeights.length - 1].column;
    }

    /**
     * Medium AI: Rule-based strategy
     */
    getRuleBasedMove(game) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        // 1. Check for winning moves
        const winningMove = this.findWinningMove(game, game.currentPlayer);
        if (winningMove !== null) {
            return winningMove;
        }

        // 2. Block opponent's winning moves
        const blockingMove = this.findBlockingMove(game);
        if (blockingMove !== null) {
            return blockingMove;
        }

        // 3. Create threats (moves that create multiple win opportunities)
        const threatMove = this.findThreatMove(game);
        if (threatMove !== null) {
            return threatMove;
        }

        // 4. Control center columns (prioritize 3, 2, 4, 1, 5, 0, 6)
        const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col =>
            validMoves.includes(col)
        );

        if (centerMoves.length > 0) {
            return centerMoves[0];
        }

        // 5. Fallback to random
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    /**
     * Evaluate the potential of a position for creating 4-in-a-row combinations
     * Returns the number of potential 4-in-a-row patterns this move could contribute to
     */
    evaluatePositionPotential(game, col, player) {
        // Find where the piece would land
        let row = game.ROWS - 1;
        while (row >= 0 && game.board[row][col] !== game.EMPTY) {
            row--;
        }

        if (row < 0) {
            return 0; // Column full
        }

        let potential = 0;
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        // Check each direction for potential 4-in-a-row patterns
        for (const [deltaRow, deltaCol] of directions) {
            potential += this.countPotentialInDirection(game, row, col, player, deltaRow, deltaCol);
        }

        return potential;
    }

    /**
     * Count potential 4-in-a-row patterns in a specific direction
     */
    countPotentialInDirection(game, row, col, player, deltaRow, deltaCol) {
        let potential = 0;

        // Check all possible 4-cell windows that include this position
        for (let startOffset = -3; startOffset <= 0; startOffset++) {
            const startRow = row + startOffset * deltaRow;
            const startCol = col + startOffset * deltaCol;

            // Check if this 4-cell window is valid (within board bounds)
            const endRow = startRow + 3 * deltaRow;
            const endCol = startCol + 3 * deltaCol;

            if (startRow >= 0 && startRow < game.ROWS &&
                startCol >= 0 && startCol < game.COLS &&
                endRow >= 0 && endRow < game.ROWS &&
                endCol >= 0 && endCol < game.COLS) {

                // Check if this window could potentially form a 4-in-a-row
                if (this.isWindowViable(game, startRow, startCol, deltaRow, deltaCol, player)) {
                    potential++;
                }
            }
        }

        return potential;
    }

    /**
     * Check if a 4-cell window is viable for the player (no opponent pieces blocking)
     */
    isWindowViable(game, startRow, startCol, deltaRow, deltaCol, player) {
        const opponent = player === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;

        for (let i = 0; i < 4; i++) {
            const checkRow = startRow + i * deltaRow;
            const checkCol = startCol + i * deltaCol;

            // If there's an opponent piece in this window, it's not viable
            if (game.board[checkRow][checkCol] === opponent) {
                return false;
            }

            // For vertical direction, check if position is reachable
            if (deltaRow === 1 && deltaCol === 0) {
                // Check if this cell is reachable (no floating pieces)
                if (game.board[checkRow][checkCol] === game.EMPTY) {
                    // Check if there's support below (or it's the bottom row)
                    if (checkRow < game.ROWS - 1 && game.board[checkRow + 1][checkCol] === game.EMPTY) {
                        return false; // Would be floating
                    }
                }
            }
        }

        return true;
    }

    /**
     * Hard/Expert AI: Minimax with alpha-beta pruning
     */
    getMinimaxMove(game) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        // Quick wins/blocks first
        const winningMove = this.findWinningMove(game, game.currentPlayer);
        if (winningMove !== null) {
            return winningMove;
        }

        const blockingMove = this.findBlockingMove(game);
        if (blockingMove !== null) {
            return blockingMove;
        }

        // Use minimax for deeper analysis
        let bestMove = null;
        let bestScore = -Infinity;

        // Order moves from center out for better pruning
        const orderedMoves = this.orderMoves(validMoves);

        for (const col of orderedMoves) {
            const boardCopy = this.copyBoard(game.board);
            const row = this.simulateMove(boardCopy, col, game.currentPlayer);

            if (row !== -1) {
                const score = this.minimax(
                    boardCopy,
                    this.maxDepth - 1,
                    false,
                    -Infinity,
                    Infinity,
                    game
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = col;
                }

                // Undo simulated move
                boardCopy[row][col] = game.EMPTY;
            }
        }

        return bestMove || validMoves[0];
    }

    /**
     * Minimax algorithm with alpha-beta pruning
     */
    minimax(board, depth, isMaximizing, alpha, beta, game) {
        // Terminal conditions
        const gameState = this.evaluateBoard(board, game);

        if (depth === 0 || Math.abs(gameState) === 1000000) {
            return gameState;
        }

        const validMoves = this.getValidMovesForBoard(board, game);
        if (validMoves.length === 0) {
            return 0; // Draw
        }

        if (isMaximizing) {
            let maxScore = -Infinity;

            for (const col of this.orderMoves(validMoves)) {
                const row = this.simulateMove(board, col, game.currentPlayer);
                if (row !== -1) {
                    const score = this.minimax(board, depth - 1, false, alpha, beta, game);
                    board[row][col] = game.EMPTY; // Undo move

                    maxScore = Math.max(maxScore, score);
                    alpha = Math.max(alpha, score);

                    if (beta <= alpha) {
                        break;
                    } // Alpha-beta pruning
                }
            }

            return maxScore;
        } else {
            let minScore = Infinity;
            const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;

            for (const col of this.orderMoves(validMoves)) {
                const row = this.simulateMove(board, col, opponent);
                if (row !== -1) {
                    const score = this.minimax(board, depth - 1, true, alpha, beta, game);
                    board[row][col] = game.EMPTY; // Undo move

                    minScore = Math.min(minScore, score);
                    beta = Math.min(beta, score);

                    if (beta <= alpha) {
                        break;
                    } // Alpha-beta pruning
                }
            }

            return minScore;
        }
    }

    /**
     * Evaluate board position
     */
    evaluateBoard(board, game) {
        const aiPlayer = game.currentPlayer;
        const humanPlayer = aiPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;

        // Check for wins
        const aiWin = this.checkWinOnBoard(board, aiPlayer, game);
        const humanWin = this.checkWinOnBoard(board, humanPlayer, game);

        if (aiWin) {
            return 1000000;
        }
        if (humanWin) {
            return -1000000;
        }

        // Evaluate position strength
        let score = 0;

        // Center column preference
        for (let row = 0; row < game.ROWS; row++) {
            if (board[row][3] === aiPlayer) {
                score += 3;
            }
            if (board[row][3] === humanPlayer) {
                score -= 3;
            }
        }

        // Evaluate all possible 4-in-a-row windows
        score += this.evaluateWindows(board, aiPlayer, humanPlayer, game);

        return score;
    }

    /**
     * Evaluate all 4-cell windows on the board
     */
    evaluateWindows(board, aiPlayer, humanPlayer, game) {
        let score = 0;

        // Horizontal windows
        for (let row = 0; row < game.ROWS; row++) {
            for (let col = 0; col <= game.COLS - 4; col++) {
                const window = [
                    board[row][col], board[row][col + 1],
                    board[row][col + 2], board[row][col + 3]
                ];
                score += this.evaluateWindow(window, aiPlayer, humanPlayer, game);
            }
        }

        // Vertical windows
        for (let col = 0; col < game.COLS; col++) {
            for (let row = 0; row <= game.ROWS - 4; row++) {
                const window = [
                    board[row][col], board[row + 1][col],
                    board[row + 2][col], board[row + 3][col]
                ];
                score += this.evaluateWindow(window, aiPlayer, humanPlayer, game);
            }
        }

        // Diagonal windows (positive slope)
        for (let row = 0; row <= game.ROWS - 4; row++) {
            for (let col = 0; col <= game.COLS - 4; col++) {
                const window = [
                    board[row][col], board[row + 1][col + 1],
                    board[row + 2][col + 2], board[row + 3][col + 3]
                ];
                score += this.evaluateWindow(window, aiPlayer, humanPlayer, game);
            }
        }

        // Diagonal windows (negative slope)
        for (let row = 3; row < game.ROWS; row++) {
            for (let col = 0; col <= game.COLS - 4; col++) {
                const window = [
                    board[row][col], board[row - 1][col + 1],
                    board[row - 2][col + 2], board[row - 3][col + 3]
                ];
                score += this.evaluateWindow(window, aiPlayer, humanPlayer, game);
            }
        }

        return score;
    }

    /**
     * Evaluate a 4-cell window
     */
    evaluateWindow(window, aiPlayer, humanPlayer, game) {
        let score = 0;

        const aiCount = window.filter(cell => cell === aiPlayer).length;
        const humanCount = window.filter(cell => cell === humanPlayer).length;
        const emptyCount = window.filter(cell => cell === game.EMPTY).length;

        if (aiCount === 4) {
            score += 100000;
        } else if (aiCount === 3 && emptyCount === 1) {
            score += 50;
        } else if (aiCount === 2 && emptyCount === 2) {
            score += 10;
        }

        if (humanCount === 4) {
            score -= 100000;
        } else if (humanCount === 3 && emptyCount === 1) {
            score -= 80;
        } else if (humanCount === 2 && emptyCount === 2) {
            score -= 5;
        }

        return score;
    }

    /**
     * Helper methods
     */
    findWinningMove(game, player) {
        const validMoves = game.getValidMoves();

        for (const col of validMoves) {
            const result = game.simulateMove(col);
            if (result.success && result.wouldWin) {
                return col;
            }
        }

        return null;
    }

    findBlockingMove(game) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;

        // Temporarily switch current player to check opponent's winning moves
        const originalPlayer = game.currentPlayer;
        game.currentPlayer = opponent;

        const blockingMove = this.findWinningMove(game, opponent);

        // Restore original player
        game.currentPlayer = originalPlayer;

        return blockingMove;
    }

    findThreatMove(game) {
        const validMoves = game.getValidMoves();

        for (const col of validMoves) {
            const boardCopy = this.copyBoard(game.board);
            const row = this.simulateMove(boardCopy, col, game.currentPlayer);

            if (row !== -1) {
                // Count potential wins from this position
                const threats = this.countThreats(boardCopy, col, game);
                if (threats >= 2) {
                    return col;
                }
            }
        }

        return null;
    }

    countThreats(board, lastCol, game) {
        // Count how many ways we can win from this position
        let threats = 0;

        for (let col = 0; col < game.COLS; col++) {
            if (this.isValidMoveOnBoard(board, col, game)) {
                const row = this.getLowestEmptyRow(board, col, game);
                if (this.checkWinOnBoardAtPosition(board, row, col, game.currentPlayer, game)) {
                    threats++;
                }
            }
        }

        return threats;
    }

    /**
     * Count threats after making a specific move
     */
    countThreatsAfterMove(game, col, player) {
        // Simulate the move
        const boardCopy = this.copyBoard(game.board);
        const row = this.simulateMove(boardCopy, col, player);
        
        if (row === -1) {
            return 0; // Invalid move
        }
        
        // Count threats from the new position
        let threats = 0;
        
        for (let checkCol = 0; checkCol < game.COLS; checkCol++) {
            if (this.isValidMoveOnBoard(boardCopy, checkCol, game)) {
                const checkRow = this.getLowestEmptyRow(boardCopy, checkCol, game);
                if (this.checkWinOnBoardAtPosition(boardCopy, checkRow, checkCol, player, game)) {
                    threats++;
                }
            }
        }
        
        return threats;
    }

    orderMoves(moves) {
        // Order moves from center outward for better alpha-beta pruning
        const center = 3;
        return moves.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    }

    copyBoard(board) {
        return board.map(row => [...row]);
    }

    simulateMove(board, col, player) {
        for (let row = board.length - 1; row >= 0; row--) {
            if (board[row][col] === 0) {
                board[row][col] = player;
                return row;
            }
        }
        return -1; // Column full
    }

    getValidMovesForBoard(board, game) {
        const validMoves = [];
        for (let col = 0; col < game.COLS; col++) {
            if (board[0][col] === game.EMPTY) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }

    isValidMoveOnBoard(board, col, game) {
        return board[0][col] === game.EMPTY;
    }

    getLowestEmptyRow(board, col, game) {
        for (let row = game.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === game.EMPTY) {
                return row;
            }
        }
        return -1;
    }

    checkWinOnBoard(board, player, game) {
        // Check all positions for a win
        for (let row = 0; row < game.ROWS; row++) {
            for (let col = 0; col < game.COLS; col++) {
                if (board[row][col] === player) {
                    if (this.checkWinOnBoardAtPosition(board, row, col, player, game)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    checkWinOnBoardAtPosition(board, row, col, player, game) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;

            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < game.ROWS && c >= 0 && c < game.COLS && board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }

            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < game.ROWS && c >= 0 && c < game.COLS && board[r][c] === player) {
                count++;
                r -= deltaRow;
                c -= deltaCol;
            }

            if (count >= 4) {
                return true;
            }
        }

        return false;
    }
}
