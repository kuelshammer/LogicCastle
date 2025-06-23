/**
 * Advanced Fork Detection and Counter-Training for Connect4 Bots
 * 
 * Implements comprehensive Zwickmühle (fork) detection and counter-strategies
 * that all bots should master for competitive play against humans.
 */

class Connect4ForkDetection {
    constructor(game) {
        this.game = game;
        this.EMPTY = 0;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
    }

    /**
     * Detect all possible fork setups for a player
     * Format: _ x _ x _ (horizontal), diagonal patterns, etc.
     */
    detectForkSetups(player, board = null) {
        const gameBoard = board || this.game.board;
        const forkSetups = [];

        // Check horizontal forks
        forkSetups.push(...this.detectHorizontalForks(player, gameBoard));
        
        // Check diagonal forks (both directions)
        forkSetups.push(...this.detectDiagonalForks(player, gameBoard));
        
        // Check vertical "trap" setups (less common but important)
        forkSetups.push(...this.detectVerticalTraps(player, gameBoard));

        return forkSetups;
    }

    /**
     * Detect horizontal fork patterns: _ x _ x _, _ x x _ _, etc.
     */
    detectHorizontalForks(player, board) {
        const forks = [];

        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col <= this.game.COLS - 4; col++) {
                // Check 4-cell windows for fork patterns
                const window = [
                    board[row][col],
                    board[row][col + 1], 
                    board[row][col + 2],
                    board[row][col + 3]
                ];

                const forkPattern = this.analyzeForkPattern(window, player, row, col, 'horizontal');
                if (forkPattern) {
                    forks.push(forkPattern);
                }
            }
        }

        return forks;
    }

    /**
     * Detect diagonal fork patterns
     */
    detectDiagonalForks(player, board) {
        const forks = [];

        // Positive diagonal (/)
        for (let row = 3; row < this.game.ROWS; row++) {
            for (let col = 0; col <= this.game.COLS - 4; col++) {
                const window = [
                    board[row][col],
                    board[row - 1][col + 1],
                    board[row - 2][col + 2],
                    board[row - 3][col + 3]
                ];

                const forkPattern = this.analyzeForkPattern(window, player, row, col, 'diagonal-up');
                if (forkPattern) {
                    forks.push(forkPattern);
                }
            }
        }

        // Negative diagonal (\)
        for (let row = 0; row <= this.game.ROWS - 4; row++) {
            for (let col = 0; col <= this.game.COLS - 4; col++) {
                const window = [
                    board[row][col],
                    board[row + 1][col + 1],
                    board[row + 2][col + 2],
                    board[row + 3][col + 3]
                ];

                const forkPattern = this.analyzeForkPattern(window, player, row, col, 'diagonal-down');
                if (forkPattern) {
                    forks.push(forkPattern);
                }
            }
        }

        return forks;
    }

    /**
     * Detect vertical trap setups (column blocking patterns)
     */
    detectVerticalTraps(player, board) {
        const traps = [];

        for (let col = 0; col < this.game.COLS; col++) {
            for (let row = 0; row <= this.game.ROWS - 4; row++) {
                const window = [
                    board[row][col],
                    board[row + 1][col],
                    board[row + 2][col],
                    board[row + 3][col]
                ];

                const trapPattern = this.analyzeVerticalTrap(window, player, row, col);
                if (trapPattern) {
                    traps.push(trapPattern);
                }
            }
        }

        return traps;
    }

    /**
     * Analyze a 4-cell window for fork patterns
     * Patterns: _ x _ x _, _ x x _ _, x _ _ x, etc.
     */
    analyzeForkPattern(window, player, startRow, startCol, direction) {
        const opponent = player === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const playerCount = window.filter(cell => cell === player).length;
        const opponentCount = window.filter(cell => cell === opponent).length;
        const emptyCount = window.filter(cell => cell === this.EMPTY).length;

        // No fork possible if opponent has pieces in this window
        if (opponentCount > 0) return null;

        // Classic fork patterns
        const forkPatterns = [
            // _ x _ x _ pattern (2 players, 2 empty)
            { pattern: [this.EMPTY, player, this.EMPTY, player], name: 'classic-fork-1', threat: 'high' },
            { pattern: [player, this.EMPTY, player, this.EMPTY], name: 'classic-fork-2', threat: 'high' },
            
            // _ x x _ _ pattern (2 players, 2 empty)  
            { pattern: [this.EMPTY, player, player, this.EMPTY], name: 'double-threat', threat: 'medium' },
            { pattern: [this.EMPTY, this.EMPTY, player, player], name: 'edge-threat', threat: 'medium' },
            { pattern: [player, player, this.EMPTY, this.EMPTY], name: 'edge-threat-2', threat: 'medium' },

            // x _ _ x pattern (2 players, 2 empty, wide gap)
            { pattern: [player, this.EMPTY, this.EMPTY, player], name: 'wide-fork', threat: 'medium' }
        ];

        // Check if window matches any fork pattern
        for (const fp of forkPatterns) {
            if (this.arraysEqual(window, fp.pattern)) {
                return {
                    type: 'fork',
                    pattern: fp.name,
                    threat: fp.threat,
                    player: player,
                    direction: direction,
                    startRow: startRow,
                    startCol: startCol,
                    window: [...window],
                    counterMoves: this.calculateCounterMoves(window, startRow, startCol, direction)
                };
            }
        }

        // Detect partial fork setups (1 player piece with good spacing)
        if (playerCount === 1 && emptyCount === 3) {
            return {
                type: 'fork-setup',
                pattern: 'partial',
                threat: 'low',
                player: player,
                direction: direction,
                startRow: startRow,
                startCol: startCol,
                window: [...window],
                counterMoves: []
            };
        }

        return null;
    }

    /**
     * Analyze vertical trap patterns (less common but important)
     */
    analyzeVerticalTrap(window, player, startRow, startCol) {
        const opponent = player === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const playerCount = window.filter(cell => cell === player).length;
        const opponentCount = window.filter(cell => cell === opponent).length;

        // Vertical trap: player controls bottom, forces opponent moves
        if (playerCount >= 2 && opponentCount === 0) {
            // Check if this creates future horizontal threats
            const trapPotential = this.evaluateVerticalTrapPotential(startRow, startCol, player);
            
            if (trapPotential > 0) {
                return {
                    type: 'vertical-trap',
                    pattern: 'column-control',
                    threat: 'medium',
                    player: player,
                    direction: 'vertical',
                    startRow: startRow,
                    startCol: startCol,
                    trapPotential: trapPotential
                };
            }
        }

        return null;
    }

    /**
     * Calculate the required counter-moves for a fork pattern
     */
    calculateCounterMoves(window, startRow, startCol, direction) {
        const counterMoves = [];

        for (let i = 0; i < window.length; i++) {
            if (window[i] === this.EMPTY) {
                let targetRow, targetCol;

                switch (direction) {
                    case 'horizontal':
                        targetRow = startRow;
                        targetCol = startCol + i;
                        break;
                    case 'diagonal-up':
                        targetRow = startRow - i;
                        targetCol = startCol + i;
                        break;
                    case 'diagonal-down':
                        targetRow = startRow + i;
                        targetCol = startCol + i;
                        break;
                    default:
                        continue;
                }

                // Check if this position is actually playable (gravity)
                if (this.isPositionPlayable(targetRow, targetCol)) {
                    counterMoves.push({
                        row: targetRow,
                        col: targetCol,
                        urgency: this.calculateMoveUrgency(window, i)
                    });
                }
            }
        }

        return counterMoves.sort((a, b) => b.urgency - a.urgency);
    }

    /**
     * Check if a position is playable considering gravity
     */
    isPositionPlayable(row, col) {
        if (row < 0 || row >= this.game.ROWS || col < 0 || col >= this.game.COLS) {
            return false;
        }

        // Check if piece would fall to this exact position
        const lowestEmpty = this.getLowestEmptyRow(this.game.board, col);
        return lowestEmpty === row;
    }

    /**
     * Enhanced fork pattern analysis with gravity constraints
     */
    analyzeRealisticForks(player, board) {
        const realisticForks = [];

        // Only check forks that can actually be played considering gravity
        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col <= this.game.COLS - 4; col++) {
                const window = [
                    board[row][col],
                    board[row][col + 1], 
                    board[row][col + 2],
                    board[row][col + 3]
                ];

                const forkPattern = this.analyzeForkPattern(window, player, row, col, 'horizontal');
                if (forkPattern) {
                    // Verify all empty positions in this fork are actually playable
                    const playableCounters = forkPattern.counterMoves.filter(move => 
                        this.isPositionPlayable(move.row, move.col)
                    );

                    if (playableCounters.length > 0) {
                        forkPattern.counterMoves = playableCounters;
                        forkPattern.playable = true;
                        realisticForks.push(forkPattern);
                    }
                }
            }
        }

        return realisticForks;
    }

    /**
     * Only return high-priority forks that are actually threatening
     */
    getCriticalRealisticForks(player) {
        const opponent = player === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const opponentForks = this.analyzeRealisticForks(opponent, this.game.board);

        // Only forks that are close to completion and immediately threatening
        const criticalForks = opponentForks.filter(fork => {
            // Must be high threat and have multiple playable counter moves
            return fork.threat === 'high' && 
                   fork.counterMoves.length >= 2 &&
                   fork.playable;
        });

        return criticalForks.map(fork => ({
            type: 'critical-fork-counter',
            priority: 100,
            forkPattern: fork,
            requiredMoves: fork.counterMoves,
            description: `Counter opponent ${fork.pattern} pattern`
        }));
    }

    /**
     * Calculate move urgency for counter-play
     */
    calculateMoveUrgency(window, position) {
        // Center positions in fork patterns are usually most urgent
        const centerPositions = [1, 2];
        if (centerPositions.includes(position)) {
            return 10;
        }

        // Edge positions are less urgent but still important
        return 5;
    }

    /**
     * Evaluate vertical trap potential
     */
    evaluateVerticalTrapPotential(row, col, player) {
        let potential = 0;

        // Check horizontal connections from this column
        for (let checkRow = row; checkRow < this.game.ROWS; checkRow++) {
            // Check left and right for potential horizontal threats
            const leftConnections = this.countHorizontalConnections(checkRow, col, player, -1);
            const rightConnections = this.countHorizontalConnections(checkRow, col, player, 1);
            
            if (leftConnections + rightConnections >= 2) {
                potential += 2;
            }
        }

        return potential;
    }

    /**
     * Count horizontal connections in a direction
     */
    countHorizontalConnections(row, col, player, direction) {
        let count = 0;
        let checkCol = col + direction;

        while (checkCol >= 0 && checkCol < this.game.COLS) {
            if (this.game.board[row][checkCol] === player) {
                count++;
            } else if (this.game.board[row][checkCol] !== this.EMPTY) {
                break; // Blocked by opponent
            }
            checkCol += direction;
        }

        return count;
    }

    /**
     * Get highest priority fork counters for immediate action
     */
    getCriticalForkCounters(player) {
        const opponent = player === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        const opponentForks = this.detectForkSetups(opponent);

        const criticalCounters = [];

        opponentForks.forEach(fork => {
            if (fork.threat === 'high' && fork.counterMoves.length > 0) {
                // This is a critical fork that needs immediate counter
                criticalCounters.push({
                    type: 'critical-fork-counter',
                    priority: 100,
                    forkPattern: fork,
                    requiredMoves: fork.counterMoves,
                    description: `Counter opponent ${fork.pattern} pattern`
                });
            }
        });

        return criticalCounters.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get fork opportunities for a player
     */
    getForkOpportunities(player) {
        const playerForks = this.detectForkSetups(player);
        const opportunities = [];

        playerForks.forEach(fork => {
            if (fork.type === 'fork-setup' && fork.counterMoves.length > 0) {
                opportunities.push({
                    type: 'fork-opportunity',
                    priority: fork.threat === 'high' ? 80 : 60,
                    forkPattern: fork,
                    setupMoves: fork.counterMoves,
                    description: `Create ${fork.pattern} fork pattern`
                });
            }
        });

        return opportunities.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Utility functions
     */
    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, i) => val === b[i]);
    }

    getLowestEmptyRow(board, col) {
        for (let row = this.game.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === this.EMPTY) {
                return row;
            }
        }
        return -1;
    }

    evaluateVerticalTrapPotential(row, col, player) {
        // Simplified implementation for now
        return 1;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Connect4ForkDetection;
}