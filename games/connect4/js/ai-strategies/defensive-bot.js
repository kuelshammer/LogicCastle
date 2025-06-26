import { BaseBotStrategy } from './base-bot-strategy.js';
class DefensiveBot extends BaseBotStrategy {
    constructor(gameConstants) {
        super(gameConstants);
        this.name = 'defensive';
        this.description = 'Pattern disruption and defensive positioning';
        this.defensiveWeights = {
            patternBreaking: 20,
            keyPositionControl: 4,
            opponentRestriction: 5,
            safetyMargin: 3,
            safeBuilding: 8
        };
    }

    /**
     * Select move from safe columns using defensive strategy
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @param {Object} helpers - Helpers instance
     * @returns {number} Selected column index
     */
    selectFromSafeColumns(game, safeColumns, _helpers) {
        const moveScores = safeColumns.map(col => {
            const score = this.evaluateDefensiveMove(game, col);
            return { col, score };
        });

        // Sort by score (highest first)
        moveScores.sort((a, b) => b.score - a.score);

        return moveScores[0].col;
    }

    /**
     * Evaluate a move based on all defensive criteria.
     */
    evaluateDefensiveMove(game, col) {
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        let totalScore = 0;

        // 1. Safety (Does this move lead to a loss?)
        const result = game.simulateMove(col);
        if (!result.success) return -Infinity; // Should not happen with safeColumns

        const opponentWinningMovesAfter = this.getOpponentWinningMoves(result.game, opponent);
        if (opponentWinningMovesAfter.length > 0) {
            return -1000; // Heavily penalize moves that give the opponent a win
        }

        // 2. Threat Blocking
        const threatsBlocked = this.countThreatsBlocked(game, col, opponent);
        totalScore += threatsBlocked * 100; // High weight for blocking

        // 3. Pattern Disruption
        totalScore += this.evaluatePatternDisruption(game, col, opponent);

        // 4. Key Position Control
        totalScore += this.evaluateKeyPositionControl(game, col);

        // 5. Opponent Restriction
        totalScore += this.evaluateOpponentRestriction(game, col);

        // 6. Safe Building
        totalScore += this.evaluateSafeBuilding(game, col);

        // 7. Future Threat Anticipation (penalty)
        totalScore -= this.evaluateFutureThreats(game, col);

        return totalScore;
    }

    /**
     * Find critical defensive moves (urgent blocks)
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number|null} Critical defensive move or null
     */
    findCriticalDefensiveMove(game, safeColumns) {
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;

        // Check for immediate multiple threats from opponent
        const urgentBlocks = [];

        for (const col of safeColumns) {
            const threatsBlocked = this.countThreatsBlocked(game, col, opponent);
            if (threatsBlocked > 0) {
                urgentBlocks.push({ col, threatsBlocked });
            }
        }

        if (urgentBlocks.length > 0) {
            // Sort by number of threats blocked
            urgentBlocks.sort((a, b) => b.threatsBlocked - a.threatsBlocked);
            return urgentBlocks[0].col;
        }

        return null;
    }

    /**
     * Count how many threats a move blocks
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @param {number} opponent - Opponent player number
     * @returns {number} Number of threats blocked
     */
    countThreatsBlocked(game, col, opponent) {
        const currentThreats = this.getOpponentWinningMoves(game, opponent);
        const result = game.simulateMove(col);
        const threatsAfterMove = this.getOpponentWinningMoves(result.game, opponent);

        return currentThreats.length - threatsAfterMove.length;
    }

    /**
     * Find best pattern disruption move
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number|null} Best pattern disruption move or null
     */
    findBestPatternDisruption(game, safeColumns) {
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const disruptionScores = [];

        for (const col of safeColumns) {
            const disruptionScore = this.evaluatePatternDisruption(game, col, opponent);
            disruptionScores.push({ col, score: disruptionScore });
        }

        // Sort by disruption score
        disruptionScores.sort((a, b) => b.score - a.score);

        // Return best if significantly better than others
        if (
            disruptionScores.length > 1 &&
            disruptionScores[0].score > disruptionScores[1].score + 3
        ) {
            return disruptionScores[0].col;
        }

        return null;
    }

    /**
     * Evaluate pattern disruption potential of a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @param {number} opponent - Opponent player number
     * @returns {number} Disruption score
     */
    evaluatePatternDisruption(game, col, opponent) {
        let score = 0;
        const result = game.simulateMove(col);
        const row = this.getLowestEmptyRow(game.board, col);

        if (row === -1) return 0;

        // Check how many opponent patterns we disrupt
        score += this.countDisruptedPatterns(game.board, result.game.board, row, col, opponent);

        // Bonus for disrupting central patterns
        const center = Math.floor(this.COLS / 2);
        if (Math.abs(col - center) <= 1) {
            score += 2;
        }

        // Bonus for disrupting in key rows (bottom 3 rows are most important)
        if (row >= this.ROWS - 3) {
            score += 3;
        }

        return score * this.defensiveWeights.patternBreaking;
    }

    /**
     * Count disrupted opponent patterns
     * @param {Array} beforeBoard - Board before move
     * @param {Array} afterBoard - Board after move
     * @param {number} row - Move row
     * @param {number} col - Move column
     * @param {number} opponent - Opponent player
     * @returns {number} Number of patterns disrupted
     */
    countDisruptedPatterns(beforeBoard, afterBoard, row, col, opponent) {
        let disrupted = 0;
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1]
        ];

        for (const [dRow, dCol] of directions) {
            // Check 4-cell windows around the move position
            for (let offset = -3; offset <= 0; offset++) {
                const startRow = row + dRow * offset;
                const startCol = col + dCol * offset;

                if (this.isValidWindow(startRow, startCol, dRow, dCol)) {
                    const beforePattern = this.getPattern(
                        beforeBoard,
                        startRow,
                        startCol,
                        dRow,
                        dCol
                    );
                    const afterPattern = this.getPattern(
                        afterBoard,
                        startRow,
                        startCol,
                        dRow,
                        dCol
                    );

                    if (
                        this.isOpponentThreatPattern(beforePattern, opponent) &&
                        !this.isOpponentThreatPattern(afterPattern, opponent)
                    ) {
                        disrupted++;
                    }
                }
            }
        }

        return disrupted;
    }

    /**
     * Check if window position is valid
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {number} dRow - Row direction
     * @param {number} dCol - Column direction
     * @returns {boolean} True if valid window
     */
    isValidWindow(startRow, startCol, dRow, dCol) {
        const endRow = startRow + dRow * 3;
        const endCol = startCol + dCol * 3;

        return (
            startRow >= 0 &&
            startRow < this.ROWS &&
            startCol >= 0 &&
            startCol < this.COLS &&
            endRow >= 0 &&
            endRow < this.ROWS &&
            endCol >= 0 &&
            endCol < this.COLS
        );
    }

    /**
     * Get pattern from board window
     * @param {Array} board - Game board
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {number} dRow - Row direction
     * @param {number} dCol - Column direction
     * @returns {Array} Pattern array
     */
    getPattern(board, startRow, startCol, dRow, dCol) {
        const pattern = [];
        for (let i = 0; i < 4; i++) {
            const row = startRow + dRow * i;
            const col = startCol + dCol * i;
            pattern.push(board[row][col]);
        }
        return pattern;
    }

    /**
     * Check if pattern is an opponent threat
     * @param {Array} pattern - 4-element pattern
     * @param {number} opponent - Opponent player
     * @returns {boolean} True if threat pattern
     */
    isOpponentThreatPattern(pattern, opponent) {
        const opponentCount = pattern.filter(cell => cell === opponent).length;
        const emptyCount = pattern.filter(cell => cell === this.EMPTY).length;

        // Threat if 3 opponent pieces and 1 empty, or 2 opponent pieces and 2 empty
        return (
            (opponentCount === 3 && emptyCount === 1) || (opponentCount === 2 && emptyCount === 2)
        );
    }

    /**
     * Find key position control move
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number|null} Key position move or null
     */
    findKeyPositionMove(game, safeColumns) {
        const keyPositionScores = [];

        for (const col of safeColumns) {
            const score = this.evaluateKeyPositionControl(game, col);
            keyPositionScores.push({ col, score });
        }

        // Sort by key position score
        keyPositionScores.sort((a, b) => b.score - a.score);

        // Return best key position if significantly valuable
        if (keyPositionScores[0].score > 5) {
            return keyPositionScores[0].col;
        }

        return null;
    }

    /**
     * Evaluate key position control value
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Key position score
     */
    evaluateKeyPositionControl(game, col) {
        let score = 0;
        const row = this.getLowestEmptyRow(game.board, col);

        if (row === -1) return 0;

        // Center control bonus
        const center = Math.floor(this.COLS / 2);
        const centerDistance = Math.abs(col - center);
        score += Math.max(0, 4 - centerDistance) * 2;

        // Bottom row control (most valuable)
        if (row === this.ROWS - 1) {
            score += 5;
        }

        // Even position control (useful for tempo)
        if ((row + col) % 2 === 0) {
            score += 1;
        }

        return score * this.defensiveWeights.keyPositionControl;
    }

    /**
     * Find safest move that restricts opponent
     * @param {Object} game - Game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number} Safest restrictive move
     */
    findSafestRestrictiveMove(game, safeColumns) {
        const restrictionScores = [];

        for (const col of safeColumns) {
            const restrictionScore = this.evaluateOpponentRestriction(game, col);
            const safetyScore = this.evaluateMoveSafety(game, col);
            const totalScore = restrictionScore + safetyScore;

            restrictionScores.push({ col, score: totalScore });
        }

        // Sort by total score
        restrictionScores.sort((a, b) => b.score - a.score);

        return restrictionScores[0].col;
    }

    /**
     * Evaluate how much a move restricts opponent options
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Restriction score
     */
    evaluateOpponentRestriction(game, col) {
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const result = game.simulateMove(col);

        const currentOptions = this.countOpponentOptions(game, opponent);
        const futureOptions = this.countOpponentOptions(result.game, opponent);

        const restrictionValue = currentOptions - futureOptions;
        return restrictionValue * this.defensiveWeights.opponentRestriction;
    }

    /**
     * Evaluate safe building potential of a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Safe building score
     */
    evaluateSafeBuilding(game, col) {
        const result = game.simulateMove(col);
        let score = 0;

        // Bonus for creating 2-in-a-row or 3-in-a-row that are not immediately winning
        const currentPlayer = game.currentPlayer;
        const twoInARow = this.countFormations(result.game.board, currentPlayer, 2);
        const threeInARow = this.countFormations(result.game.board, currentPlayer, 3);

        score += twoInARow * 1; // Small bonus for 2-in-a-row
        score += threeInARow * 3; // Medium bonus for 3-in-a-row

        // Bonus for controlling central columns (defensive perspective)
        const center = Math.floor(this.COLS / 2);
        const centerDistance = Math.abs(col - center);
        score += Math.max(0, 2 - centerDistance) * 2; // Prefer closer to center

        return score * this.defensiveWeights.safeBuilding;
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
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1]
        ];

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
            const r = row + dRow * i;
            const c = col + dCol * i;

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
     * Count strategic options for opponent
     * @param {Object} game - Game instance
     * @param {number} opponent - Opponent player
     * @returns {number} Number of good options
     */
    countOpponentOptions(game, _opponent) {
        const validMoves = game.getValidMoves();
        let goodOptions = 0;

        for (const col of validMoves) {
            const result = game.simulateMove(col);

            // Count as good option if it doesn't give us immediate wins
            const currentPlayer = game.currentPlayer;
            const ourWins = this.getOpponentWinningMoves(result.game, currentPlayer);

            if (ourWins.length === 0) {
                goodOptions++;
            }
        }

        return goodOptions;
    }

    /**
     * Evaluate safety margin of a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Safety score
     */
    evaluateMoveSafety(game, col) {
        const result = game.simulateMove(col);
        const _opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;

        let safetyScore = 0;

        // Check future safety (2 moves ahead)
        const opponentMoves = result.game.getValidMoves();
        let safeOpponentMoves = 0;

        for (const opCol of opponentMoves) {
            const opResult = result.game.simulateMove(opCol);
            const ourThreats = this.getOpponentWinningMoves(opResult.game, game.currentPlayer);

            if (ourThreats.length === 0) {
                safeOpponentMoves++;
            }
        }

        // More safety if opponent has fewer safe options
        safetyScore = Math.max(0, opponentMoves.length - safeOpponentMoves);

        return safetyScore * this.defensiveWeights.safetyMargin;
    }

    /**
     * Evaluate future threats created by a move
     * @param {Object} game - Game instance
     * @param {number} col - Column to evaluate
     * @returns {number} Score penalty for creating future threats
     */
    evaluateFutureThreats(game, col) {
        const result = game.simulateMove(col);
        const opponent = game.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        let penalty = 0;

        // Simulate opponent's best response after our move
        const opponentValidMoves = result.game.getValidMoves();
        let bestOpponentMove = null;
        let maxOpponentThreats = 0;

        for (const opCol of opponentValidMoves) {
            const opResult = result.game.simulateMove(opCol);
            const threats = this.getOpponentWinningMoves(opResult.game, opponent).length;

            if (threats > maxOpponentThreats) {
                maxOpponentThreats = threats;
                bestOpponentMove = opCol;
            }
        }

        // If opponent can win in 2 moves, heavily penalize
        if (maxOpponentThreats > 0) {
            penalty += maxOpponentThreats * 500; // Very high penalty
        }

        // Check for forks created for opponent
        // This is a simplified check, a full fork detection would be more complex
        if (bestOpponentMove !== null) {
            const opResult = result.game.simulateMove(bestOpponentMove);
            const ourThreatsAfterOpponent = this.getOpponentWinningMoves(
                opResult.game,
                game.currentPlayer
            ).length;
            if (ourThreatsAfterOpponent >= 2) {
                // If opponent creates 2 threats (a fork)
                penalty += 200; // High penalty for creating a fork
            }
        }

        return penalty;
    }

    /**
     * Get strategy info
     * @returns {Object} Strategy information
     */
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            type: 'defensive',
            difficulty: 'hard',
            features: [
                'Pattern disruption analysis',
                'Key position control',
                'Opponent option restriction',
                'Multi-level threat assessment',
                'Safety margin evaluation',
                'Safe building',
                'Future threat anticipation'
            ],
            defensiveWeights: this.defensiveWeights,
            expectedWinRate: 70 // Against intermediate opponents
        };
    }
}

export { DefensiveBot };
