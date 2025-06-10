/**
 * TrioAI - AI player for Trio game
 */
class TrioAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth();
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
            default: return 2;
        }
    }
    
    /**
     * Get the best move for the current player
     * @param {TrioGame} game - Game instance
     * @returns {Object} - Best move {row, col}
     */
    getBestMove(game) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }
        
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove(validMoves);
            case 'medium':
                return this.getMediumMove(game, validMoves);
            case 'hard':
                return this.getHardMove(game, validMoves);
            default:
                return this.getMediumMove(game, validMoves);
        }
    }
    
    /**
     * Get a random valid move (easy difficulty)
     * @param {Array} validMoves - Array of valid moves
     * @returns {Object} - Random move
     */
    getRandomMove(validMoves) {
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        return validMoves[randomIndex];
    }
    
    /**
     * Get a move using simple heuristics (medium difficulty)
     * @param {TrioGame} game - Game instance
     * @param {Array} validMoves - Array of valid moves
     * @returns {Object} - Best move found
     */
    getMediumMove(game, validMoves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of validMoves) {
            const score = this.evaluateMove(game, move.row, move.col);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || this.getRandomMove(validMoves);
    }
    
    /**
     * Get a move using minimax algorithm (hard difficulty)
     * @param {TrioGame} game - Game instance
     * @param {Array} validMoves - Array of valid moves
     * @returns {Object} - Best move found
     */
    getHardMove(game, validMoves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        const currentPlayer = game.currentPlayer;
        
        for (const move of validMoves) {
            // Create a copy of the game state
            const gameState = game.getGameState();
            const testGame = new TrioGame();
            testGame.loadGameState(gameState);
            
            // Make the move
            testGame.makeMove(move.row, move.col);
            
            // Evaluate using minimax
            const score = this.minimax(testGame, this.maxDepth - 1, false, currentPlayer, -Infinity, Infinity);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || this.getRandomMove(validMoves);
    }
    
    /**
     * Evaluate a single move
     * @param {TrioGame} game - Game instance
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
            return 1000;
        }
        
        // Check for blocking opponent wins
        const opponents = this.getOpponents(currentPlayer);
        for (const opponent of opponents) {
            // Temporarily change current player to check opponent's winning moves
            const originalPlayer = game.currentPlayer;
            game.currentPlayer = opponent;
            const opponentSimulation = game.simulateMove(row, col);
            game.currentPlayer = originalPlayer;
            
            if (opponentSimulation.wouldWin) {
                score += 500; // High priority to block
            }
        }
        
        // Positional scoring
        score += this.getPositionalScore(row, col, game);
        
        // Pattern recognition
        score += this.getPatternScore(game, row, col, currentPlayer);
        
        return score;
    }
    
    /**
     * Get opponents for a given player
     * @param {number} player - Player number
     * @returns {Array} - Array of opponent player numbers
     */
    getOpponents(player) {
        const allPlayers = [1, 2, 3];
        return allPlayers.filter(p => p !== player);
    }
    
    /**
     * Get positional score for a move
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {TrioGame} game - Game instance
     * @returns {number} - Positional score
     */
    getPositionalScore(row, col, game) {
        let score = 0;
        
        // Center positions are generally better
        const centerDistance = Math.abs(row - 2.5) + Math.abs(col - 2.5);
        score += (7 - centerDistance) * 5;
        
        // Corner and edge bonuses
        if ((row === 0 || row === 5) && (col === 0 || col === 5)) {
            score += 3; // Corner bonus
        } else if (row === 0 || row === 5 || col === 0 || col === 5) {
            score += 1; // Edge bonus
        }
        
        return score;
    }
    
    /**
     * Get pattern score for building lines
     * @param {TrioGame} game - Game instance
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player number
     * @returns {number} - Pattern score
     */
    getPatternScore(game, row, col, player) {
        let score = 0;
        const board = game.getBoard();
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            const lineScore = this.evaluateLine(board, row, col, deltaRow, deltaCol, player);
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
     * @returns {number} - Line score
     */
    evaluateLine(board, row, col, deltaRow, deltaCol, player) {
        let score = 0;
        let playerCount = 0;
        let emptyCount = 0;
        let opponentCount = 0;
        
        // Check a 3-cell window around the position
        for (let i = -1; i <= 1; i++) {
            const r = row + i * deltaRow;
            const c = col + i * deltaCol;
            
            if (r >= 0 && r < 6 && c >= 0 && c < 6) {
                if (i === 0) {
                    playerCount++; // The move we're evaluating
                } else if (board[r][c] === player) {
                    playerCount++;
                } else if (board[r][c] === 0) {
                    emptyCount++;
                } else {
                    opponentCount++;
                }
            }
        }
        
        // Score based on potential
        if (opponentCount === 0) {
            if (playerCount === 3) {
                score += 100; // Winning line
            } else if (playerCount === 2) {
                score += 10; // Two in a row
            }
        }
        
        return score;
    }
    
    /**
     * Minimax algorithm with alpha-beta pruning
     * @param {TrioGame} game - Game instance
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
        
        const validMoves = game.getValidMoves();
        
        if (maximizing) {
            let maxScore = -Infinity;
            
            for (const move of validMoves) {
                const gameState = game.getGameState();
                const testGame = new TrioGame();
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
            
            for (const move of validMoves) {
                const gameState = game.getGameState();
                const testGame = new TrioGame();
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
     * @param {TrioGame} game - Game instance
     * @param {number} player - Player to evaluate for
     * @returns {number} - Game state score
     */
    evaluateGameState(game, player) {
        if (game.gameOver) {
            if (game.winner === player) {
                return 1000;
            } else if (game.winner !== null) {
                return -1000;
            } else {
                return 0; // Draw
            }
        }
        
        // Evaluate based on position control and threats
        let score = 0;
        const board = game.getBoard();
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (board[row][col] === player) {
                    score += this.getPositionalScore(row, col, game);
                } else if (board[row][col] !== 0) {
                    score -= this.getPositionalScore(row, col, game) * 0.5;
                }
            }
        }
        
        return score;
    }
}