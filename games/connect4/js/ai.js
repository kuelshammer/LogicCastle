/**
 * Connect4AI - AI opponents for Connect 4 game
 */
class Connect4AI {
    constructor(difficulty = 'smart-random') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.cache = new Map();
    }
    
    /**
     * Get maximum search depth based on difficulty
     */
    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'smart-random': return 2; // Light lookahead for trap avoidance
            default: return 2;
        }
    }
    
    /**
     * Get the best move for the current game state
     * @param {Connect4Game} game - Current game instance
     * @param {Connect4Helpers} helpers - Optional helpers instance for smart random mode
     * @returns {number} - Column index for the best move
     */
    getBestMove(game, helpers = null) {
        // Smart Bot always uses smart-random strategy with helpers system
        return this.getSmartRandomMove(game, helpers);
    }
    
    /**
     * Smart Random AI: Uses Level 1 help system to block threats, otherwise random
     * @param {Connect4Game} game - Current game instance  
     * @param {Connect4Helpers} helpers - Helpers instance for threat detection
     * @returns {number} - Column index for the move
     */
    getSmartRandomMove(game, helpers) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) return null;
        
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
     * Simple random move (used as fallback by smart-random AI)
     */
    getRandomMove(game) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) return null;
        
        // Random move
        return validMoves[Math.floor(Math.random() * validMoves.length)];
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
                    
                    if (beta <= alpha) break; // Alpha-beta pruning
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
                    
                    if (beta <= alpha) break; // Alpha-beta pruning
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
        
        if (aiWin) return 1000000;
        if (humanWin) return -1000000;
        
        // Evaluate position strength
        let score = 0;
        
        // Center column preference
        for (let row = 0; row < game.ROWS; row++) {
            if (board[row][3] === aiPlayer) score += 3;
            if (board[row][3] === humanPlayer) score -= 3;
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