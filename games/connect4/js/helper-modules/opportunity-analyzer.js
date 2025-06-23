/**
 * OpportunityAnalyzer - Identifies strategic opportunities, forks, and setup moves
 * 
 * Core responsibility: Analyze board for strategic advantages beyond immediate wins/blocks
 */
class OpportunityAnalyzer {
    constructor(game) {
        this.game = game;
    }

    /**
     * Analyze all strategic opportunities for current player
     * @returns {Object} {forks, setups, chains, traps}
     */
    analyzeOpportunities(player = null) {
        const currentPlayer = player || this.game.currentPlayer;
        
        return {
            forks: this.detectForks(currentPlayer),
            setups: this.detectSetupMoves(currentPlayer),
            chains: this.detectChainOpportunities(currentPlayer),
            traps: this.detectTrapOpportunities(currentPlayer)
        };
    }

    /**
     * Detect fork opportunities (Zwickmühle) - moves that create multiple threats
     * @param {number} player - Player to analyze for
     * @returns {Array} Array of fork opportunities
     */
    detectForks(player) {
        const forks = [];
        const validMoves = this.game.getValidMoves();

        for (const col of validMoves) {
            const moveResult = this.game.simulateMove(col, player);
            if (moveResult && !moveResult.isWin) {
                // After this move, count how many winning moves we'd have next turn
                const gameState = this.game.createGameStateFromBoard(moveResult.newBoard, player === 1 ? 2 : 1);
                const nextTurnWins = this.countWinningMovesFromState(gameState, player);
                
                if (nextTurnWins >= 2) {
                    forks.push({
                        column: col,
                        row: moveResult.row,
                        player,
                        winningMovesCreated: nextTurnWins,
                        type: 'fork',
                        priority: nextTurnWins >= 3 ? 'high' : 'medium'
                    });
                }
            }
        }

        return forks;
    }

    /**
     * Detect setup moves that prepare future forks or chains
     * @param {number} player - Player to analyze for  
     * @returns {Array} Array of setup move opportunities
     */
    detectSetupMoves(player) {
        const setups = [];
        const validMoves = this.game.getValidMoves();

        for (const col of validMoves) {
            const setupValue = this.evaluateSetupMove(col, player);
            if (setupValue.isSetup) {
                setups.push({
                    column: col,
                    player,
                    ...setupValue
                });
            }
        }

        return setups;
    }

    /**
     * Evaluate a move for its setup potential
     * @private
     */
    evaluateSetupMove(col, player) {
        const moveResult = this.game.simulateMove(col, player);
        if (!moveResult) return { isSetup: false };

        const board = moveResult.newBoard;
        const row = moveResult.row;
        
        // Check if this move sets up future opportunities
        const futureForks = this.countPotentialForksFromPosition(board, row, col, player);
        const connectedThreats = this.countConnectedThreats(board, row, col, player);
        
        const isSetup = futureForks > 0 || connectedThreats >= 2;
        
        return {
            isSetup,
            futureForks,
            connectedThreats,
            type: 'setup',
            priority: futureForks > 1 ? 'high' : 'medium'
        };
    }

    /**
     * Count potential forks that could be created from a position
     * @private
     */
    countPotentialForksFromPosition(board, row, col, player) {
        // Simulate placing more pieces and check for future fork opportunities
        // This is a simplified heuristic - in practice, would need deeper analysis
        let forkPotential = 0;
        
        // Check adjacent positions for potential threats that could be connected
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dRow, dCol] of directions) {
            const threatCount = this.countThreatsInDirection(board, row, col, dRow, dCol, player);
            if (threatCount >= 2) {
                forkPotential++;
            }
        }
        
        return forkPotential;
    }

    /**
     * Count connected threats from a position
     * @private
     */
    countConnectedThreats(board, row, col, player) {
        let connectedCount = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dRow, dCol] of directions) {
            const lineLength = this.countLineLength(board, row, col, dRow, dCol, player);
            if (lineLength >= 2) {
                connectedCount++;
            }
        }
        
        return connectedCount;
    }

    /**
     * Count line length in a direction
     * @private
     */
    countLineLength(board, row, col, dRow, dCol, player) {
        let count = 1; // The position itself
        const ROWS = this.game.ROWS;
        const COLS = this.game.COLS;

        // Count in positive direction
        let r = row + dRow, c = col + dCol;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
            count++;
            r += dRow;
            c += dCol;
        }

        // Count in negative direction
        r = row - dRow;
        c = col - dCol;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
            count++;
            r -= dRow;
            c -= dCol;
        }

        return count;
    }

    /**
     * Count threats in a specific direction
     * @private
     */
    countThreatsInDirection(board, row, col, dRow, dCol, player) {
        // Simplified threat counting for performance
        const lineLength = this.countLineLength(board, row, col, dRow, dCol, player);
        return Math.max(0, lineLength - 2); // Threats are 3+ length lines
    }

    /**
     * Detect chain opportunities (multiple connected threats)
     * @param {number} player - Player to analyze for
     * @returns {Array} Array of chain opportunities
     */
    detectChainOpportunities(player) {
        const chains = [];
        const validMoves = this.game.getValidMoves();

        for (const col of validMoves) {
            const moveResult = this.game.simulateMove(col, player);
            if (moveResult && !moveResult.isWin) {
                const chainValue = this.evaluateChainPotential(moveResult.newBoard, moveResult.row, col, player);
                if (chainValue.isChain) {
                    chains.push({
                        column: col,
                        row: moveResult.row,
                        player,
                        ...chainValue
                    });
                }
            }
        }

        return chains;
    }

    /**
     * Evaluate chain potential of a move
     * @private
     */
    evaluateChainPotential(board, row, col, player) {
        const connectedLines = this.countConnectedLines(board, row, col, player);
        const maxLineLength = this.getMaxLineLength(board, row, col, player);
        
        return {
            isChain: connectedLines >= 2 && maxLineLength >= 3,
            connectedLines,
            maxLineLength,
            type: 'chain',
            priority: maxLineLength >= 3 ? 'high' : 'medium'
        };
    }

    /**
     * Count connected lines from a position
     * @private
     */
    countConnectedLines(board, row, col, player) {
        let lineCount = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dRow, dCol] of directions) {
            const length = this.countLineLength(board, row, col, dRow, dCol, player);
            if (length >= 2) lineCount++;
        }
        
        return lineCount;
    }

    /**
     * Get maximum line length from a position
     * @private
     */
    getMaxLineLength(board, row, col, player) {
        let maxLength = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dRow, dCol] of directions) {
            const length = this.countLineLength(board, row, col, dRow, dCol, player);
            maxLength = Math.max(maxLength, length);
        }
        
        return maxLength;
    }

    /**
     * Detect trap opportunities (moves that force opponent into bad positions)
     * @param {number} player - Player to analyze for
     * @returns {Array} Array of trap opportunities
     */
    detectTrapOpportunities(player) {
        const traps = [];
        const validMoves = this.game.getValidMoves();
        const opponent = player === 1 ? 2 : 1;

        for (const col of validMoves) {
            const moveResult = this.game.simulateMove(col, player);
            if (moveResult && !moveResult.isWin) {
                // Check if this move limits opponent's good options
                const gameState = this.game.createGameStateFromBoard(moveResult.newBoard, opponent);
                const opponentOptions = this.evaluateOpponentOptionsFromState(gameState, opponent);
                
                if (opponentOptions.limitedGoodMoves) {
                    traps.push({
                        column: col,
                        row: moveResult.row,
                        player,
                        type: 'trap',
                        ...opponentOptions
                    });
                }
            }
        }

        return traps;
    }

    /**
     * Evaluate opponent's options from a game state
     * @private
     */
    evaluateOpponentOptionsFromState(gameState, opponent) {
        const validMoves = gameState.getValidMoves ? gameState.getValidMoves() : this.game.getValidMoves();
        let goodMoves = 0;
        let badMoves = 0;
        
        for (const col of validMoves) {
            const moveResult = this.game.simulateMove(col, opponent);
            if (moveResult) {
                // Simple heuristic: center moves are generally better
                const isCenterMove = col >= 2 && col <= 4;
                if (isCenterMove) {
                    goodMoves++;
                } else {
                    badMoves++;
                }
            }
        }
        
        return {
            limitedGoodMoves: goodMoves <= 1,
            goodMoves,
            badMoves,
            totalMoves: validMoves.length
        };
    }

    /**
     * Count winning moves from a game state
     * @private
     */
    countWinningMovesFromState(gameState, player) {
        const validMoves = gameState.getValidMoves ? gameState.getValidMoves() : this.game.getValidMoves();
        let winningMoves = 0;
        
        for (const col of validMoves) {
            const moveResult = this.game.simulateMove(col, player);
            if (moveResult && moveResult.isWin) {
                winningMoves++;
            }
        }
        
        return winningMoves;
    }
}

// Export for modular usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OpportunityAnalyzer };
}

// Global access for backward compatibility  
if (typeof window !== 'undefined') {
    window.OpportunityAnalyzer = OpportunityAnalyzer;
}