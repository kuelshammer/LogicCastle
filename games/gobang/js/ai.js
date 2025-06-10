/**
 * GobangAI - AI player for Gobang game
 */
class GobangAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth();
        this.searchRadius = this.getSearchRadius();
    }
    
    /**
     * Get maximum search depth based on difficulty
     * @returns {number} - Maximum depth
     */
    getMaxDepth() {
        switch (this.difficulty) {
            case 'easy': return 1;
            case 'medium': return 2;
            case 'hard': return 3;
            case 'expert': return 4;
            default: return 2;
        }
    }
    
    /**
     * Get search radius for move generation
     * @returns {number} - Search radius
     */
    getSearchRadius() {
        switch (this.difficulty) {
            case 'easy': return 1;
            case 'medium': return 2;
            case 'hard': return 2;
            case 'expert': return 3;
            default: return 2;
        }
    }
    
    /**
     * Get the best move for the current player
     * @param {GobangGame} game - Game instance
     * @returns {Object} - Best move {row, col}
     */
    getBestMove(game) {
        const relevantMoves = this.getRelevantMoves(game);
        
        if (relevantMoves.length === 0) {
            // If no relevant moves, play in center
            const center = Math.floor(game.BOARD_SIZE / 2);
            return { row: center, col: center };
        }
        
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove(relevantMoves);
            case 'medium':
                return this.getMediumMove(game, relevantMoves);
            case 'hard':
            case 'expert':
                return this.getHardMove(game, relevantMoves);
            default:
                return this.getMediumMove(game, relevantMoves);
        }
    }
    
    /**
     * Get relevant moves (positions near existing stones)
     * @param {GobangGame} game - Game instance
     * @returns {Array} - Array of relevant moves
     */
    getRelevantMoves(game) {
        const moves = new Set();
        const board = game.getBoard();
        
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
                    for (let dr = -this.searchRadius; dr <= this.searchRadius; dr++) {
                        for (let dc = -this.searchRadius; dc <= this.searchRadius; dc++) {
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
    
    /**
     * Get a random move from available moves (easy difficulty)
     * @param {Array} moves - Array of available moves
     * @returns {Object} - Random move
     */
    getRandomMove(moves) {
        const randomIndex = Math.floor(Math.random() * moves.length);
        return moves[randomIndex];
    }
    
    /**
     * Get a move using simple heuristics (medium difficulty)
     * @param {GobangGame} game - Game instance
     * @param {Array} moves - Array of available moves
     * @returns {Object} - Best move found
     */
    getMediumMove(game, moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const score = this.evaluateMove(game, move.row, move.col);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || this.getRandomMove(moves);
    }
    
    /**
     * Get a move using minimax algorithm (hard/expert difficulty)
     * @param {GobangGame} game - Game instance
     * @param {Array} moves - Array of available moves
     * @returns {Object} - Best move found
     */
    getHardMove(game, moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        const currentPlayer = game.currentPlayer;
        
        // First, check for immediate win or block
        for (const move of moves) {
            const gameState = game.getGameState();
            const testGame = new GobangGame();
            testGame.loadGameState(gameState);
            
            const result = testGame.makeMove(move.row, move.col);
            if (result.gameWon) {
                return move; // Immediate win
            }
            
            // Check if opponent can win on next move
            const opponentMoves = this.getRelevantMoves(testGame);
            for (const opponentMove of opponentMoves) {
                const opponentResult = testGame.makeMove(opponentMove.row, opponentMove.col);
                if (opponentResult.gameWon) {
                    return move; // Block opponent win
                }
                testGame.undoMove(); // Undo opponent move
            }
        }
        
        // Use minimax for strategic evaluation
        for (const move of moves.slice(0, Math.min(20, moves.length))) { // Limit search space
            const gameState = game.getGameState();
            const testGame = new GobangGame();
            testGame.loadGameState(gameState);
            
            testGame.makeMove(move.row, move.col);
            
            const score = this.minimax(testGame, this.maxDepth - 1, false, currentPlayer, -Infinity, Infinity);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || this.getRandomMove(moves);
    }
    
    /**
     * Evaluate a single move
     * @param {GobangGame} game - Game instance
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number} - Move score
     */
    evaluateMove(game, row, col) {
        const currentPlayer = game.currentPlayer;
        let score = 0;
        
        // Check for immediate win
        const simulation = game.simulateMove(row, col);
        if (simulation.wouldWin) {
            return 10000;
        }
        
        // Check for blocking opponent win
        const opponent = currentPlayer === game.BLACK ? game.WHITE : game.BLACK;
        const originalPlayer = game.currentPlayer;
        game.currentPlayer = opponent;
        const opponentSimulation = game.simulateMove(row, col);
        game.currentPlayer = originalPlayer;
        
        if (opponentSimulation.wouldWin) {
            score += 5000; // High priority to block
        }
        
        // Positional scoring
        score += this.getPositionalScore(game, row, col, currentPlayer);
        
        // Pattern recognition
        score += this.getPatternScore(game, row, col, currentPlayer);
        
        return score;
    }
    
    /**
     * Get positional score for a move
     * @param {GobangGame} game - Game instance
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player number
     * @returns {number} - Positional score
     */
    getPositionalScore(game, row, col, player) {
        let score = 0;
        
        // Center preference
        const centerRow = Math.floor(game.BOARD_SIZE / 2);
        const centerCol = Math.floor(game.BOARD_SIZE / 2);
        const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        score += (game.BOARD_SIZE - distanceFromCenter) * 3;
        
        // Edge penalty
        if (row === 0 || row === game.BOARD_SIZE - 1 || col === 0 || col === game.BOARD_SIZE - 1) {
            score -= 5;
        }
        
        return score;
    }
    
    /**
     * Get pattern score for building lines
     * @param {GobangGame} game - Game instance
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player number
     * @returns {number} - Pattern score
     */
    getPatternScore(game, row, col, player) {
        let score = 0;
        const board = game.getBoard();
        const opponent = player === game.BLACK ? game.WHITE : game.BLACK;
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            // Evaluate line in both directions
            const lineScore = this.evaluateLine(board, row, col, deltaRow, deltaCol, player, opponent);
            score += lineScore;
        }
        
        return score;
    }
    
    /**
     * Evaluate a line for pattern formation
     * @param {Array} board - Game board
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} deltaRow - Row direction
     * @param {number} deltaCol - Column direction
     * @param {number} player - Player number
     * @param {number} opponent - Opponent number
     * @returns {number} - Line score
     */
    evaluateLine(board, row, col, deltaRow, deltaCol, player, opponent) {
        let score = 0;
        
        // Check patterns of length 5 around the position
        for (let start = -4; start <= 0; start++) {
            let playerCount = 0;
            let emptyCount = 0;
            let opponentCount = 0;
            let hasPosition = false;
            
            for (let i = start; i < start + 5; i++) {
                const r = row + i * deltaRow;
                const c = col + i * deltaCol;
                
                if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) {
                    opponentCount++; // Treat out of bounds as opponent
                    continue;
                }
                
                if (i === 0) {
                    playerCount++; // The position we're evaluating
                    hasPosition = true;
                } else if (board[r][c] === player) {
                    playerCount++;
                } else if (board[r][c] === 0) {
                    emptyCount++;
                } else {
                    opponentCount++;
                }
            }
            
            if (hasPosition && opponentCount === 0) {
                // Evaluate based on potential
                if (playerCount === 5) {
                    score += 100000; // Winning line
                } else if (playerCount === 4) {
                    score += 1000; // Four in a row
                } else if (playerCount === 3) {
                    score += 100; // Three in a row
                } else if (playerCount === 2) {
                    score += 10; // Two in a row
                }
            }
        }
        
        return score;
    }
    
    /**
     * Minimax algorithm with alpha-beta pruning
     * @param {GobangGame} game - Game instance
     * @param {number} depth - Current depth
     * @param {boolean} maximizing - Whether this is a maximizing player
     * @param {number} originalPlayer - The original AI player
     * @param {number} alpha - Alpha value for pruning
     * @param {number} beta - Beta value for pruning
     * @returns {number} - Best score
     */
    minimax(game, depth, maximizing, originalPlayer, alpha, beta) {
        if (depth === 0 || game.gameOver) {
            return this.evaluateGameState(game, originalPlayer);
        }
        
        const relevantMoves = this.getRelevantMoves(game).slice(0, 10); // Limit for performance
        
        if (maximizing) {
            let maxScore = -Infinity;
            
            for (const move of relevantMoves) {
                const gameState = game.getGameState();
                const testGame = new GobangGame();
                testGame.loadGameState(gameState);
                
                testGame.makeMove(move.row, move.col);
                
                const score = this.minimax(testGame, depth - 1, false, originalPlayer, alpha, beta);
                maxScore = Math.max(maxScore, score);
                
                alpha = Math.max(alpha, score);
                if (beta <= alpha) {
                    break; // Alpha-beta pruning
                }
            }
            
            return maxScore;
        } else {
            let minScore = Infinity;
            
            for (const move of relevantMoves) {
                const gameState = game.getGameState();
                const testGame = new GobangGame();
                testGame.loadGameState(gameState);
                
                testGame.makeMove(move.row, move.col);
                
                const score = this.minimax(testGame, depth - 1, true, originalPlayer, alpha, beta);
                minScore = Math.min(minScore, score);
                
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    break; // Alpha-beta pruning
                }
            }
            
            return minScore;
        }
    }
    
    /**
     * Evaluate the current game state
     * @param {GobangGame} game - Game instance
     * @param {number} player - Player to evaluate for
     * @returns {number} - Game state score
     */
    evaluateGameState(game, player) {
        if (game.gameOver) {
            if (game.winner === player) {
                return 100000;
            } else if (game.winner !== null) {
                return -100000;
            } else {
                return 0; // Draw (very rare in Gobang)
            }
        }
        
        // Evaluate based on position control and threats
        let score = 0;
        const board = game.getBoard();
        const opponent = player === game.BLACK ? game.WHITE : game.BLACK;
        
        // Count stones and evaluate positions
        for (let row = 0; row < game.BOARD_SIZE; row++) {
            for (let col = 0; col < game.BOARD_SIZE; col++) {
                if (board[row][col] === player) {
                    score += this.getPositionalScore(game, row, col, player);
                } else if (board[row][col] === opponent) {
                    score -= this.getPositionalScore(game, row, col, opponent) * 0.5;
                }
            }
        }
        
        return score;
    }
    
    /**
     * Detect immediate threats (4 in a row with one empty space)
     * @param {GobangGame} game - Game instance
     * @param {number} player - Player to check threats for
     * @returns {Array} - Array of threat positions
     */
    detectThreats(game, player) {
        const threats = [];
        const board = game.getBoard();
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];
        
        for (let row = 0; row < game.BOARD_SIZE; row++) {
            for (let col = 0; col < game.BOARD_SIZE; col++) {
                if (board[row][col] === game.EMPTY) {
                    // Check if placing a stone here would create a threat
                    for (const [deltaRow, deltaCol] of directions) {
                        const count = this.countThreatPattern(board, row, col, deltaRow, deltaCol, player);
                        if (count >= 4) {
                            threats.push({ row, col, count });
                            break;
                        }
                    }
                }
            }
        }
        
        return threats;
    }
    
    /**
     * Count threat pattern in a direction
     * @param {Array} board - Game board
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} deltaRow - Row direction
     * @param {number} deltaCol - Column direction
     * @param {number} player - Player to count for
     * @returns {number} - Pattern count
     */
    countThreatPattern(board, row, col, deltaRow, deltaCol, player) {
        let count = 1; // Count the position itself
        
        // Check positive direction
        let r = row + deltaRow;
        let c = col + deltaCol;
        while (r >= 0 && r < board.length && c >= 0 && c < board[0].length && board[r][c] === player) {
            count++;
            r += deltaRow;
            c += deltaCol;
        }
        
        // Check negative direction
        r = row - deltaRow;
        c = col - deltaCol;
        while (r >= 0 && r < board.length && c >= 0 && c < board[0].length && board[r][c] === player) {
            count++;
            r -= deltaRow;
            c -= deltaCol;
        }
        
        return count;
    }
}