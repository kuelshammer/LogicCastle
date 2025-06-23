/**
 * MoveValidator - Validates moves and identifies dangerous positions
 * 
 * Core responsibility: Analyze move safety and identify positions to avoid
 */
class MoveValidator {
    constructor(game) {
        this.game = game;
    }

    /**
     * Validate if a move is safe (doesn't give opponent immediate advantage)
     * @param {number} column - Column to validate
     * @param {number} player - Player making the move
     * @returns {Object} Validation result with safety analysis
     */
    validateMove(column, player = null) {
        const currentPlayer = player || this.game.currentPlayer;
        const opponent = currentPlayer === 1 ? 2 : 1;
        
        // Check if move is valid
        const validMoves = this.game.getValidMoves();
        if (!validMoves.includes(column)) {
            return {
                isValid: false,
                isSafe: false,
                reason: 'Invalid move - column full or out of bounds',
                risk: 'invalid'
            };
        }

        // Simulate the move
        const moveResult = this.game.simulateMove(column, currentPlayer);
        if (!moveResult) {
            return {
                isValid: false,
                isSafe: false,
                reason: 'Move simulation failed',
                risk: 'invalid'
            };
        }

        // If it's a winning move, it's always safe
        if (moveResult.isWin) {
            return {
                isValid: true,
                isSafe: true,
                reason: 'Winning move',
                risk: 'none',
                outcome: 'win'
            };
        }

        // Analyze what happens after this move
        const safetyAnalysis = this.analyzeMoveAftermath(moveResult.newBoard, column, moveResult.row, opponent);
        
        return {
            isValid: true,
            isSafe: !safetyAnalysis.givesOpponentAdvantage,
            ...safetyAnalysis
        };
    }

    /**
     * Analyze the aftermath of a move for safety
     * @private
     */
    analyzeMoveAftermath(newBoard, column, row, opponent) {
        // Create temporary game state with the new board
        const gameState = this.game.createGameStateFromBoard(newBoard, opponent);
        
        // Check if opponent gets immediate winning moves
        const opponentWins = this.countOpponentWinningMoves(newBoard, opponent);
        
        // Check if we created a trap for opponent
        const trapAnalysis = this.analyzeForTraps(newBoard, column, row, opponent);
        
        // Check positional value
        const positionalValue = this.evaluatePositionalValue(newBoard, column, row);
        
        let risk = 'low';
        let reason = 'Safe move';
        let givesOpponentAdvantage = false;
        
        if (opponentWins > 0) {
            risk = 'high';
            reason = `Gives opponent ${opponentWins} winning move(s)`;
            givesOpponentAdvantage = true;
        } else if (trapAnalysis.createsOpponentTrap) {
            risk = 'medium';
            reason = 'Creates opportunity for opponent';
            givesOpponentAdvantage = true;
        } else if (positionalValue.isWeak) {
            risk = 'medium';
            reason = 'Weak positional move';
        }
        
        return {
            risk,
            reason,
            givesOpponentAdvantage,
            opponentWinningMoves: opponentWins,
            trapAnalysis,
            positionalValue
        };
    }

    /**
     * Count winning moves available to opponent after our move
     * @private
     */
    countOpponentWinningMoves(board, opponent) {
        let winningMoves = 0;
        const validMoves = this.game.getValidMoves();
        
        for (const col of validMoves) {
            const moveResult = this.simulateMoveOnBoard(board, col, opponent);
            if (moveResult && moveResult.isWin) {
                winningMoves++;
            }
        }
        
        return winningMoves;
    }

    /**
     * Simulate a move on a given board (helper method)
     * @private
     */
    simulateMoveOnBoard(board, column, player) {
        // Create a copy of the board
        const newBoard = board.map(row => [...row]);
        
        // Find the lowest empty row in the column
        for (let row = this.game.ROWS - 1; row >= 0; row--) {
            if (newBoard[row][column] === 0) {
                newBoard[row][column] = player;
                
                // Check for win
                const isWin = this.checkWinOnBoard(newBoard, row, column, player);
                
                return {
                    newBoard,
                    row,
                    column,
                    player,
                    isWin
                };
            }
        }
        
        return null; // Column is full
    }

    /**
     * Check for win condition on a board
     * @private
     */
    checkWinOnBoard(board, row, col, player) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        for (const [dRow, dCol] of directions) {
            let count = 1;
            
            // Count in positive direction
            let r = row + dRow, c = col + dCol;
            while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && board[r][c] === player) {
                count++;
                r += dRow;
                c += dCol;
            }
            
            // Count in negative direction
            r = row - dRow;
            c = col - dCol;
            while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && board[r][c] === player) {
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
     * Analyze if move creates traps for opponent
     * @private
     */
    analyzeForTraps(board, column, row, opponent) {
        // Check if the position above our move would give opponent an advantage
        const aboveRow = row - 1;
        if (aboveRow >= 0 && board[aboveRow][column] === 0) {
            // Simulate opponent playing above us
            const opponentMove = this.simulateMoveOnBoard(board, column, opponent);
            if (opponentMove) {
                // Check if this gives opponent multiple threats
                const threats = this.countThreatsFromPosition(opponentMove.newBoard, opponentMove.row, column, opponent);
                if (threats >= 2) {
                    return {
                        createsOpponentTrap: true,
                        trapType: 'stacking_advantage',
                        threatCount: threats
                    };
                }
            }
        }
        
        return {
            createsOpponentTrap: false,
            trapType: null,
            threatCount: 0
        };
    }

    /**
     * Count threats from a specific position
     * @private
     */
    countThreatsFromPosition(board, row, col, player) {
        let threats = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dRow, dCol] of directions) {
            const lineLength = this.countLineLength(board, row, col, dRow, dCol, player);
            if (lineLength >= 3) {
                threats++;
            }
        }
        
        return threats;
    }

    /**
     * Count line length in a direction
     * @private
     */
    countLineLength(board, row, col, dRow, dCol, player) {
        let count = 1;
        
        // Count in positive direction
        let r = row + dRow, c = col + dCol;
        while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && board[r][c] === player) {
            count++;
            r += dRow;
            c += dCol;
        }
        
        // Count in negative direction
        r = row - dRow;
        c = col - dCol;
        while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && board[r][c] === player) {
            count++;
            r -= dRow;
            c -= dCol;
        }
        
        return count;
    }

    /**
     * Evaluate positional value of a move
     * @private
     */
    evaluatePositionalValue(board, column, row) {
        // Center columns are generally better
        const centerBonus = this.getCenterBonus(column);
        
        // Check height - lower is generally better for Connect 4
        const heightPenalty = row * 0.1;
        
        // Check connectivity to existing pieces
        const connectivity = this.evaluateConnectivity(board, row, column);
        
        const totalValue = centerBonus - heightPenalty + connectivity;
        
        return {
            isWeak: totalValue < 0.5,
            value: totalValue,
            centerBonus,
            heightPenalty,
            connectivity
        };
    }

    /**
     * Get bonus for center columns
     * @private
     */
    getCenterBonus(column) {
        const center = Math.floor(this.game.COLS / 2);
        const distance = Math.abs(column - center);
        return Math.max(0, 1 - distance * 0.2);
    }

    /**
     * Evaluate connectivity to existing pieces
     * @private
     */
    evaluateConnectivity(board, row, column) {
        let connectivity = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dRow, dCol] of directions) {
            // Check adjacent positions
            const adjRow = row + dRow;
            const adjCol = column + dCol;
            
            if (adjRow >= 0 && adjRow < this.game.ROWS && 
                adjCol >= 0 && adjCol < this.game.COLS && 
                board[adjRow][adjCol] !== 0) {
                connectivity += 0.2;
            }
        }
        
        return connectivity;
    }

    /**
     * Get all dangerous moves (moves that should be avoided)
     * @param {number} player - Player to analyze for
     * @returns {Array} Array of dangerous moves with reasons
     */
    getDangerousMoves(player = null) {
        const currentPlayer = player || this.game.currentPlayer;
        const dangerousMoves = [];
        const validMoves = this.game.getValidMoves();
        
        for (const col of validMoves) {
            const validation = this.validateMove(col, currentPlayer);
            if (!validation.isSafe) {
                dangerousMoves.push({
                    column: col,
                    ...validation
                });
            }
        }
        
        return dangerousMoves;
    }

    /**
     * Get all safe moves (moves that don't give opponent advantage)
     * @param {number} player - Player to analyze for
     * @returns {Array} Array of safe moves
     */
    getSafeMoves(player = null) {
        const currentPlayer = player || this.game.currentPlayer;
        const safeMoves = [];
        const validMoves = this.game.getValidMoves();
        
        for (const col of validMoves) {
            const validation = this.validateMove(col, currentPlayer);
            if (validation.isSafe) {
                safeMoves.push({
                    column: col,
                    ...validation
                });
            }
        }
        
        return safeMoves;
    }
}

// Export for modular usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MoveValidator };
}

// Global access for backward compatibility
if (typeof window !== 'undefined') {
    window.MoveValidator = MoveValidator;
}