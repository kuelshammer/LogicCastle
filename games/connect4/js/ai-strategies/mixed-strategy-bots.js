/**
 * Mixed Strategy Bots - Offensive and Defensive weighted combinations
 * 
 * These bots combine multiple strategic approaches with different weightings
 * to create balanced but distinct playing styles.
 */

/**
 * OffensiveMixedBot - Aggressive play with 2x offensive weighting
 */
class OffensiveMixedBot extends BaseBotStrategy {
    constructor(gameConstants) {
        super(gameConstants);
        this.name = 'offensiv-gemischt';
        this.description = '2x offensive weighting for aggressive play';
        this.weights = {
            offensive: 2.0,
            defensive: 1.0,
            center: 1.5,
            randomness: 0.3
        };
    }

    /**
     * Select move from safe columns using offensive-weighted strategy
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @param {Object} helpers - Helpers instance
     * @returns {number} Selected column index
     */
    selectFromSafeColumns(game, safeColumns, helpers) {
        // Phase 1: Look for offensive opportunities
        const offensiveMove = this.findOffensiveOpportunity(game, safeColumns);
        if (offensiveMove !== null) {
            return offensiveMove;
        }

        // Phase 2: Weighted move evaluation
        return this.getWeightedBestMove(game, safeColumns, helpers);
    }

    /**
     * Find offensive opportunities (threat creation, forks)
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number|null} Offensive move or null
     */
    findOffensiveOpportunity(game, safeColumns) {
        const opportunities = [];
        
        for (const col of safeColumns) {
            const result = game.simulateMove(col);
            const threats = this.countThreatsAfterMove(result.game, game.currentPlayer);
            
            if (threats > 0) {
                opportunities.push({ col, threats });
            }
        }
        
        if (opportunities.length > 0) {
            // Sort by threat count (most threatening first)
            opportunities.sort((a, b) => b.threats - a.threats);
            return opportunities[0].col;
        }
        
        return null;
    }

    /**
     * Count threats after making a move
     * @param {Object} game - Game instance
     * @param {number} player - Player number
     * @returns {number} Number of winning threats
     */
    countThreatsAfterMove(game, player) {
        let threatCount = 0;
        const validMoves = game.getValidMoves();
        
        for (const col of validMoves) {
            const result = game.simulateMove(col);
            if (result.winner === player) {
                threatCount++;
            }
        }
        
        return threatCount;
    }

    /**
     * Get weighted best move combining multiple factors
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @param {Object} helpers - Helpers instance
     * @returns {number} Selected column index
     */
    getWeightedBestMove(game, safeColumns, helpers) {
        const moveScores = safeColumns.map(col => ({
            col: col,
            score: this.evaluateMove(game, col, helpers)
        }));
        
        // Sort by score (highest first)
        moveScores.sort((a, b) => b.score - a.score);
        
        return moveScores[0].col;
    }

    /**
     * Evaluate move using offensive-weighted criteria
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @param {Object} helpers - Helpers instance
     * @returns {number} Move score
     */
    evaluateMove(game, col, helpers) {
        let score = 0;
        const center = Math.floor(this.COLS / 2);
        
        // Offensive factors (2x weight)
        score += this.evaluateOffensivePotential(game, col) * this.weights.offensive;
        
        // Defensive factors (1x weight)
        score += this.evaluateDefensivePotential(game, col) * this.weights.defensive;
        
        // Center control (1.5x weight)
        const centerBonus = Math.max(0, 3 - Math.abs(col - center));
        score += centerBonus * this.weights.center;
        
        // Helper system bonus
        if (helpers) {
            score += this.getHelperBonus(helpers, col);
        }
        
        // Small randomness for unpredictability
        score += (Math.random() - 0.5) * this.weights.randomness;
        
        return score;
    }

    /**
     * Evaluate offensive potential of a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Offensive score
     */
    evaluateOffensivePotential(game, col) {
        const result = game.simulateMove(col);
        let score = 0;
        
        // Count immediate threats created
        const threats = this.countThreatsAfterMove(result.game, game.currentPlayer);
        score += threats * 5;
        
        // Count 2-in-a-row formations created
        const formations = this.countFormations(result.game.board, game.currentPlayer, 2);
        score += formations * 2;
        
        // Count 3-in-a-row formations created
        const strongFormations = this.countFormations(result.game.board, game.currentPlayer, 3);
        score += strongFormations * 4;
        
        return score;
    }

    /**
     * Evaluate defensive potential of a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Defensive score
     */
    evaluateDefensivePotential(game, col) {
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const result = game.simulateMove(col);
        let score = 0;
        
        // Count opponent threats blocked
        const currentThreats = this.getOpponentWinningMoves(game, opponent);
        const futureThreats = this.getOpponentWinningMoves(result.game, opponent);
        const threatsBlocked = currentThreats.length - futureThreats.length;
        score += threatsBlocked * 3;
        
        // Count opponent formations disrupted
        const currentFormations = this.countFormations(game.board, opponent, 3);
        const futureFormations = this.countFormations(result.game.board, opponent, 3);
        const formationsDisrupted = currentFormations - futureFormations;
        score += formationsDisrupted * 2;
        
        return score;
    }

    /**
     * Count formations of a specific length for a player
     * @param {Array} board - Game board
     * @param {number} player - Player number
     * @param {number} length - Formation length to count
     * @returns {number} Number of formations
     */
    countFormations(board, player, length) {
        let count = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                for (const [dRow, dCol] of directions) {
                    if (this.checkFormation(board, row, col, dRow, dCol, player, length)) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }

    /**
     * Check for formation of specific length at position
     * @param {Array} board - Game board
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} dRow - Row direction
     * @param {number} dCol - Column direction
     * @param {number} player - Player number
     * @param {number} length - Formation length
     * @returns {boolean} True if formation found
     */
    checkFormation(board, row, col, dRow, dCol, player, length) {
        let consecutiveCount = 0;
        
        for (let i = 0; i < 4; i++) {
            const r = row + (dRow * i);
            const c = col + (dCol * i);
            
            if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
                if (board[r][c] === player) {
                    consecutiveCount++;
                    if (consecutiveCount >= length) {
                        return true;
                    }
                } else {
                    consecutiveCount = 0;
                }
            }
        }
        
        return false;
    }

    /**
     * Get helper bonus for move
     * @param {Object} helpers - Helpers instance
     * @param {number} col - Column to evaluate
     * @returns {number} Helper bonus score
     */
    getHelperBonus(helpers, col) {
        try {
            helpers.setEnabled(true, 1);
            helpers.updateHints();
            
            if (helpers.requiredMoves) {
                const requiredMove = helpers.requiredMoves.find(move => move.column === col);
                if (requiredMove) {
                    return 8; // High bonus for helper-required moves
                }
            }
            
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get strategy info
     * @returns {Object} Strategy information
     */
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            type: 'mixed-offensive',
            difficulty: 'medium',
            features: [
                '2x offensive weighting',
                'Threat creation focus',
                'Formation building',
                'Helper system integration',
                'Center control preference'
            ],
            weights: this.weights,
            expectedWinRate: 55
        };
    }
}

/**
 * DefensiveMixedBot - Cautious play with 2x defensive weighting
 */
class DefensiveMixedBot extends BaseBotStrategy {
    constructor(gameConstants) {
        super(gameConstants);
        this.name = 'defensiv-gemischt';
        this.description = '2x defensive weighting for cautious play';
        this.weights = {
            offensive: 1.0,
            defensive: 2.0,
            safety: 1.5,
            randomness: 0.2
        };
    }

    /**
     * Select move from safe columns using defensive-weighted strategy
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @param {Object} helpers - Helpers instance
     * @returns {number} Selected column index
     */
    selectFromSafeColumns(game, safeColumns, helpers) {
        // Phase 1: Look for critical defensive moves
        const defensiveMove = this.findCriticalDefensiveMove(game, safeColumns);
        if (defensiveMove !== null) {
            return defensiveMove;
        }

        // Phase 2: Weighted move evaluation with defensive focus
        return this.getWeightedSafestMove(game, safeColumns, helpers);
    }

    /**
     * Find critical defensive moves
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number|null} Critical defensive move or null
     */
    findCriticalDefensiveMove(game, safeColumns) {
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const criticalMoves = [];
        
        for (const col of safeColumns) {
            const threatsBlocked = this.countThreatsBlocked(game, col, opponent);
            if (threatsBlocked > 0) {
                criticalMoves.push({ col, threatsBlocked });
            }
        }
        
        if (criticalMoves.length > 0) {
            criticalMoves.sort((a, b) => b.threatsBlocked - a.threatsBlocked);
            return criticalMoves[0].col;
        }
        
        return null;
    }

    /**
     * Count threats blocked by a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @param {number} opponent - Opponent player
     * @returns {number} Threats blocked
     */
    countThreatsBlocked(game, col, opponent) {
        const currentThreats = this.getOpponentWinningMoves(game, opponent);
        const result = game.simulateMove(col);
        const futureThreats = this.getOpponentWinningMoves(result.game, opponent);
        
        return currentThreats.length - futureThreats.length;
    }

    /**
     * Get weighted safest move
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @param {Object} helpers - Helpers instance
     * @returns {number} Selected column index
     */
    getWeightedSafestMove(game, safeColumns, helpers) {
        const moveScores = safeColumns.map(col => ({
            col: col,
            score: this.evaluateDefensiveMove(game, col, helpers)
        }));
        
        // Sort by score (highest first)
        moveScores.sort((a, b) => b.score - a.score);
        
        return moveScores[0].col;
    }

    /**
     * Evaluate move using defensive-weighted criteria
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @param {Object} helpers - Helpers instance
     * @returns {number} Move score
     */
    evaluateDefensiveMove(game, col, helpers) {
        let score = 0;
        
        // Defensive factors (2x weight)
        score += this.evaluateDefensiveValue(game, col) * this.weights.defensive;
        
        // Safety factors (1.5x weight)
        score += this.evaluateSafety(game, col) * this.weights.safety;
        
        // Offensive factors (1x weight)
        score += this.evaluateOffensiveValue(game, col) * this.weights.offensive;
        
        // Helper system bonus
        if (helpers) {
            score += this.getHelperBonus(helpers, col);
        }
        
        // Minimal randomness for slight unpredictability
        score += (Math.random() - 0.5) * this.weights.randomness;
        
        return score;
    }

    /**
     * Evaluate defensive value of a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Defensive score
     */
    evaluateDefensiveValue(game, col) {
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const result = game.simulateMove(col);
        let score = 0;
        
        // Threats blocked
        const threatsBlocked = this.countThreatsBlocked(game, col, opponent);
        score += threatsBlocked * 6;
        
        // Opponent formations disrupted
        const formationsDisrupted = this.countFormationsDisrupted(game, result.game, opponent);
        score += formationsDisrupted * 3;
        
        // Key position denial
        score += this.evaluateKeyPositionDenial(game, col, opponent);
        
        return score;
    }

    /**
     * Count formations disrupted by move
     * @param {Object} originalGame - Original game state
     * @param {Object} resultGame - Game state after move
     * @param {number} opponent - Opponent player
     * @returns {number} Formations disrupted
     */
    countFormationsDisrupted(originalGame, resultGame, opponent) {
        const originalFormations = this.countFormations(originalGame.board, opponent, 2) +
                                  this.countFormations(originalGame.board, opponent, 3);
        const resultFormations = this.countFormations(resultGame.board, opponent, 2) +
                                this.countFormations(resultGame.board, opponent, 3);
        
        return Math.max(0, originalFormations - resultFormations);
    }

    /**
     * Evaluate key position denial
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @param {number} opponent - Opponent player
     * @returns {number} Position denial score
     */
    evaluateKeyPositionDenial(game, col, opponent) {
        let score = 0;
        const center = Math.floor(this.COLS / 2);
        const row = this.getLowestEmptyRow(game.board, col);
        
        if (row === -1) return 0;
        
        // Deny center control
        if (Math.abs(col - center) <= 1) {
            score += 3;
        }
        
        // Deny bottom positions
        if (row >= this.ROWS - 2) {
            score += 2;
        }
        
        return score;
    }

    /**
     * Evaluate safety of a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Safety score
     */
    evaluateSafety(game, col) {
        const result = game.simulateMove(col);
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        let score = 0;
        
        // Check opponent options after our move
        const opponentOptions = result.game.getValidMoves();
        let safeOpponentMoves = 0;
        
        for (const opCol of opponentOptions) {
            const opResult = result.game.simulateMove(opCol);
            const ourThreats = this.getOpponentWinningMoves(opResult.game, game.currentPlayer);
            
            if (ourThreats.length === 0) {
                safeOpponentMoves++;
            }
        }
        
        // Higher score if opponent has fewer safe options
        score += Math.max(0, opponentOptions.length - safeOpponentMoves) * 2;
        
        // Bonus for maintaining our safety margin
        const ourThreats = this.getOpponentWinningMoves(result.game, game.currentPlayer);
        if (ourThreats.length > 0) {
            score += ourThreats.length;
        }
        
        return score;
    }

    /**
     * Evaluate offensive value (minimal for defensive bot)
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Offensive score
     */
    evaluateOffensiveValue(game, col) {
        const result = game.simulateMove(col);
        const threats = this.countThreatsAfterMove(result.game, game.currentPlayer);
        
        // Minimal offensive consideration
        return threats * 2;
    }

    /**
     * Count threats after move (reuse from offensive bot)
     * @param {Object} game - Game instance
     * @param {number} player - Player number
     * @returns {number} Number of threats
     */
    countThreatsAfterMove(game, player) {
        let threatCount = 0;
        const validMoves = game.getValidMoves();
        
        for (const col of validMoves) {
            const result = game.simulateMove(col);
            if (result.winner === player) {
                threatCount++;
            }
        }
        
        return threatCount;
    }

    /**
     * Count formations (reuse method)
     * @param {Array} board - Game board
     * @param {number} player - Player number
     * @param {number} length - Formation length
     * @returns {number} Formation count
     */
    countFormations(board, player, length) {
        // Reuse implementation from OffensiveMixedBot
        let count = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                for (const [dRow, dCol] of directions) {
                    if (this.checkFormation(board, row, col, dRow, dCol, player, length)) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }

    /**
     * Check formation (reuse method)
     */
    checkFormation(board, row, col, dRow, dCol, player, length) {
        let consecutiveCount = 0;
        
        for (let i = 0; i < 4; i++) {
            const r = row + (dRow * i);
            const c = col + (dCol * i);
            
            if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
                if (board[r][c] === player) {
                    consecutiveCount++;
                    if (consecutiveCount >= length) {
                        return true;
                    }
                } else {
                    consecutiveCount = 0;
                }
            }
        }
        
        return false;
    }

    /**
     * Get helper bonus
     * @param {Object} helpers - Helpers instance
     * @param {number} col - Column to evaluate
     * @returns {number} Helper bonus
     */
    getHelperBonus(helpers, col) {
        try {
            helpers.setEnabled(true, 2); // Use higher level for defensive bot
            helpers.updateHints();
            
            if (helpers.requiredMoves) {
                const requiredMove = helpers.requiredMoves.find(move => move.column === col);
                if (requiredMove) {
                    return 10; // Higher bonus for defensive bot
                }
            }
            
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get strategy info
     * @returns {Object} Strategy information
     */
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            type: 'mixed-defensive',
            difficulty: 'medium',
            features: [
                '2x defensive weighting',
                'Pattern disruption focus',
                'Safety margin evaluation',
                'Key position denial',
                'Threat blocking priority'
            ],
            weights: this.weights,
            expectedWinRate: 58
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OffensiveMixedBot, DefensiveMixedBot };
} else if (typeof window !== 'undefined') {
    window.OffensiveMixedBot = OffensiveMixedBot;
    window.DefensiveMixedBot = DefensiveMixedBot;
}