/**
 * Connect4AI - AI opponents for Connect 4 game
 */
class Connect4AI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.cache = new Map();
        this.forkDetector = null; // Will be initialized when needed
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
     * Initialize fork detector if needed
     */
    initializeForkDetector(game) {
        if (!this.forkDetector) {
            // Check if Connect4ForkDetection is available (will be loaded separately)
            if (typeof Connect4ForkDetection !== 'undefined') {
                this.forkDetector = new Connect4ForkDetection(game);
            }
        }
    }

    /**
     * Check for critical fork situations that require immediate response
     * MINIMALIST VERSION: Only triggers for truly critical patterns
     */
    checkForCriticalForks(game) {
        // Only check forks in mid-to-late game when they become relevant
        if (game.moveHistory.length < 8) {
            return null; // Too early for meaningful fork threats
        }

        // Simple fork check: look for immediate _ x _ x _ patterns in bottom 2 rows only
        return this.checkImmediateForkThreats(game);
    }

    /**
     * Ultra-conservative fork detection: only for immediate unblockable threats
     */
    checkImmediateForkThreats(game) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        
        // ONLY check bottom row for immediate fork threats (most conservative)
        const row = game.ROWS - 1;
        for (let col = 0; col <= game.COLS - 4; col++) {
            const window = [
                game.board[row][col],
                game.board[row][col + 1],
                game.board[row][col + 2],
                game.board[row][col + 3]
            ];
            
            // Only check for exact pattern: _ x _ x (critical fork)
            if (this.isExactForkPattern(window, opponent)) {
                // This creates two immediate threats - must block one
                for (let i = 0; i < 4; i++) {
                    if (window[i] === game.EMPTY) {
                        const targetCol = col + i;
                        // Check if this position is actually playable
                        if (game.getValidMoves().includes(targetCol)) {
                            console.log('🚨 CRITICAL FORK THREAT: Blocking column', targetCol + 1);
                            return targetCol;
                        }
                    }
                }
            }
        }
        
        return null; // No immediate fork threats found
    }

    /**
     * Check for only the most dangerous fork pattern: _ x _ x
     */
    isExactForkPattern(window, player) {
        // Must be EXACT pattern: [empty, player, empty, player]
        return window[0] === 0 && 
               window[1] === player && 
               window[2] === 0 && 
               window[3] === player;
    }

    /**
     * 4-STAGE UNIVERSAL BOT LOGIC
     * ALL bots must follow these stages before their specific strategy:
     * Stage 1: Direct win possible - play winning move
     * Stage 2: ALWAYS block - prevent opponent wins and forks  
     * Stage 3: Identify trapped columns - avoid moves that give opponent a win
     * Stage 4: Bot-specific selection from remaining safe columns
     */
    getUniversalBestMove(game, helpers = null) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }

        // STAGE 1: Direct win possible
        const winningMove = this.findWinningMove(game);
        if (winningMove !== null) {
            console.log(`🎯 STAGE 1: Direct win at column ${winningMove + 1}`);
            return winningMove;
        }

        // STAGE 2: ALWAYS block (includes forks and immediate threats)
        const blockingMove = this.findComprehensiveBlockingMove(game);
        if (blockingMove !== null) {
            console.log(`🛡️ STAGE 2: Blocking threat at column ${blockingMove + 1}`);
            return blockingMove;
        }

        // STAGE 3: Identify trapped columns
        const safeColumns = this.findSafeColumns(game, validMoves);
        console.log(`🔒 STAGE 3: Safe columns from traps: [${safeColumns.map(c => c + 1).join(', ')}]`);

        // STAGE 4: Bot-specific selection from safe columns
        const finalMove = this.selectFromSafeColumns(game, safeColumns, helpers);
        console.log(`🎲 STAGE 4: ${this.difficulty} bot selected column ${finalMove + 1}`);
        return finalMove;
    }

    /**
     * Get the best move for the current game state
     * @param {Connect4Game} game - Current game instance
     * @param {Connect4Helpers} helpers - Optional helpers instance for smart random mode
     * @returns {number} - Column index for the best move
     */
    getBestMove(game, helpers = null) {
        // Route each bot type to its specific strategy method
        switch (this.difficulty) {
            case 'smart-random':
                return this.getSmartRandomMove(game, helpers);
            
            case 'offensiv-gemischt':
                return this.getOffensiveMixedMove(game, helpers);
            
            case 'defensiv-gemischt':
                return this.getDefensiveMixedMove(game, helpers);
            
            case 'enhanced-smart':
                return this.getEnhancedSmartMove(game, helpers);
            
            case 'defensive':
                // Note: 'defensive' maps to the pure defensive strategy (different from defensiv-gemischt)
                return this.getDefensiveMove(game, helpers);
            
            case 'monte-carlo':
                return this.getMonteCarloMove(game, helpers);
            
            case 'easy':
                return this.getRandomMove(game);
            
            case 'medium':
                return this.getRuleBasedMove(game);
            
            case 'hard':
            case 'expert':
                return this.getMinimaxMove(game);
            
            default:
                // Fallback to universal logic for unknown types
                console.warn(`Unknown bot difficulty: ${this.difficulty}, using universal logic`);
                return this.getUniversalBestMove(game, helpers);
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
     * Defensive AI: Prioritizes destroying opponent's winning opportunities
     * Strategy: Win > Block > Avoid Traps > Destroy Opponent 4-in-a-row Potential
     */
    getDefensiveMove(game, helpers = null) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        // PRIORITY 0: If board is empty, play center column
        const totalMoves = game.moveHistory.length;
        if (totalMoves === 0) {
            return 3; // Center column (0-indexed)
        }

        // Use helpers system for Level 0 + 1 analysis (same as smart-random)
        if (helpers) {
            // Store original helpers state
            const wasEnabled = helpers.enabled;
            const wasLevel = helpers.helpLevel;

            // PRIORITY 1: Check Level 0 - Own winning opportunities
            helpers.setEnabled(true, 0);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🛡️ Defensive Bot: WINNING at columns', helpers.requiredMoves);
                const winningMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * winningMoves.length);
                return winningMoves[randomIndex];
            }

            // PRIORITY 2: Check Level 1 - Block opponent's threats
            helpers.setEnabled(true, 1);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🛡️ Defensive Bot: BLOCKING threat at columns', helpers.requiredMoves);
                const blockingMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * blockingMoves.length);
                return blockingMoves[randomIndex];
            }

            // PRIORITY 3: Check Level 2 - Avoid traps (safe moves only)
            helpers.setEnabled(true, 2);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🛡️ Defensive Bot: AVOIDING TRAPS, safe moves:', helpers.requiredMoves);
                const safeMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * safeMoves.length);
                return safeMoves[randomIndex];
            }

            // Restore original helpers state
            helpers.setEnabled(wasEnabled, wasLevel);
        }

        // PRIORITY 4: DEFENSIVE STRATEGY - Destroy opponent's 4-in-a-row potential
        console.log('🛡️ Defensive Bot: Analyzing defensive potential...');
        const defensiveMoves = validMoves.map(col => {
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            return {
                column: col,
                defensiveValue: defensiveValue,
                offensiveValue: offensiveValue,
                combinedValue: defensiveValue * 2 + offensiveValue // Defensive focus
            };
        });

        console.log('🛡️ Defensive moves analysis:', defensiveMoves.map(m => 
            `Col ${m.column + 1}: D=${m.defensiveValue}, O=${m.offensiveValue}, Combined=${m.combinedValue}`
        ));

        // Find moves with highest combined value (defense-weighted)
        const maxCombinedValue = Math.max(...defensiveMoves.map(m => m.combinedValue));
        const bestDefensiveMoves = defensiveMoves.filter(m => m.combinedValue === maxCombinedValue);

        if (bestDefensiveMoves.length > 0 && maxCombinedValue > 0) {
            const randomIndex = Math.floor(Math.random() * bestDefensiveMoves.length);
            const chosenMove = bestDefensiveMoves[randomIndex];
            console.log(`🛡️ Defensive Bot: Chose column ${chosenMove.column + 1} (defensive: ${chosenMove.defensiveValue}, offensive: ${chosenMove.offensiveValue}, combined: ${chosenMove.combinedValue})`);
            return chosenMove.column;
        }

        // PRIORITY 5: No defensive advantage found - make center-biased random move
        console.log('🛡️ Defensive Bot: No defensive advantage, playing center-biased random');
        const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col => validMoves.includes(col));
        return centerMoves.length > 0 ? centerMoves[0] : this.getRandomMove(game);
    }

    /**
     * Offensiv-Gemischt AI: Weighted random based on offensive potential
     * Each offensive 4-possibility adds column 2x, each defensive block adds column 1x
     */
    getOffensiveMixedMove(game, helpers = null) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        // PRIORITY 0: If board is empty, play center column
        const totalMoves = game.moveHistory.length;
        if (totalMoves === 0) {
            return 3; // Center column (0-indexed)
        }

        // Use helpers system for critical moves (same as other bots)
        if (helpers) {
            const wasEnabled = helpers.enabled;
            const wasLevel = helpers.helpLevel;

            // PRIORITY 1: Check Level 0 - Own winning opportunities (immediate wins)
            helpers.setEnabled(true, 0);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('⚔️ Offensiv-Gemischt Bot: WINNING at columns', helpers.requiredMoves);
                const winningMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * winningMoves.length);
                return winningMoves[randomIndex];
            }

            // PRIORITY 2: Check Level 1 - Block opponent's threats (immediate blocks)
            helpers.setEnabled(true, 1);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('⚔️ Offensiv-Gemischt Bot: BLOCKING threat at columns', helpers.requiredMoves);
                const blockingMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * blockingMoves.length);
                return blockingMoves[randomIndex];
            }

            // PRIORITY 3: Check Level 2 - Avoid traps (safe moves only)
            helpers.setEnabled(true, 2);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('⚔️ Offensiv-Gemischt Bot: AVOIDING TRAPS, safe moves:', helpers.requiredMoves);
                const safeMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * safeMoves.length);
                return safeMoves[randomIndex];
            }

            helpers.setEnabled(wasEnabled, wasLevel);
        }

        // PRIORITY 4: WEIGHTED RANDOM - Offensive Focus
        console.log('⚔️ Offensiv-Gemischt Bot: Analyzing weighted offensive potential...');
        const weightedColumns = [];

        for (const col of validMoves) {
            // Calculate offensive potential (how many 4-possibilities this move creates)
            const offensivePotential = this.evaluatePositionPotential(game, col, game.currentPlayer);
            
            // Calculate defensive value (how many opponent patterns this move disrupts)
            const defensivePotential = this.evaluateDefensivePotential(game, col);

            console.log(`⚔️ Column ${col + 1}: Offensive=${offensivePotential}, Defensive=${defensivePotential}`);

            // OFFENSIVE FOCUS: Each offensive 4-possibility adds column 2x, each defensive block adds column 1x
            for (let i = 0; i < offensivePotential * 2; i++) {
                weightedColumns.push(col);
            }
            for (let i = 0; i < defensivePotential * 1; i++) {
                weightedColumns.push(col);
            }

            // Base weight: add each column at least once
            if (offensivePotential === 0 && defensivePotential === 0) {
                weightedColumns.push(col);
            }
        }

        if (weightedColumns.length > 0) {
            const chosenMove = weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
            console.log(`⚔️ Offensiv-Gemischt Bot: Chose column ${chosenMove + 1} from weighted list (${weightedColumns.length} options)`);
            return chosenMove;
        }

        // PRIORITY 5: Fallback
        console.log('⚔️ Offensiv-Gemischt Bot: Fallback to center-biased random');
        const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col => validMoves.includes(col));
        return centerMoves.length > 0 ? centerMoves[0] : this.getRandomMove(game);
    }

    /**
     * Defensiv-Gemischt AI: Weighted random based on defensive potential  
     * Each defensive block adds column 2x, each offensive 4-possibility adds column 1x
     */
    getDefensiveMixedMove(game, helpers = null) {
        const validMoves = game.getValidMoves();

        if (validMoves.length === 0) {
            return null;
        }

        // PRIORITY 0: If board is empty, play center column
        const totalMoves = game.moveHistory.length;
        if (totalMoves === 0) {
            return 3; // Center column (0-indexed)
        }

        // Use helpers system for critical moves (same as other bots)
        if (helpers) {
            const wasEnabled = helpers.enabled;
            const wasLevel = helpers.helpLevel;

            // PRIORITY 1: Check Level 0 - Own winning opportunities (immediate wins)
            helpers.setEnabled(true, 0);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🛡️ Defensiv-Gemischt Bot: WINNING at columns', helpers.requiredMoves);
                const winningMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * winningMoves.length);
                return winningMoves[randomIndex];
            }

            // PRIORITY 2: Check Level 1 - Block opponent's threats (immediate blocks)
            helpers.setEnabled(true, 1);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🛡️ Defensiv-Gemischt Bot: BLOCKING threat at columns', helpers.requiredMoves);
                const blockingMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * blockingMoves.length);
                return blockingMoves[randomIndex];
            }

            // PRIORITY 3: Check Level 2 - Avoid traps (safe moves only)
            helpers.setEnabled(true, 2);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🛡️ Defensiv-Gemischt Bot: AVOIDING TRAPS, safe moves:', helpers.requiredMoves);
                const safeMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * safeMoves.length);
                return safeMoves[randomIndex];
            }

            helpers.setEnabled(wasEnabled, wasLevel);
        }

        // PRIORITY 4: WEIGHTED RANDOM - Defensive Focus
        console.log('🛡️ Defensiv-Gemischt Bot: Analyzing weighted defensive potential...');
        const weightedColumns = [];

        for (const col of validMoves) {
            // Calculate offensive potential (how many 4-possibilities this move creates)
            const offensivePotential = this.evaluatePositionPotential(game, col, game.currentPlayer);
            
            // Calculate defensive value (how many opponent patterns this move disrupts)
            const defensivePotential = this.evaluateDefensivePotential(game, col);

            console.log(`🛡️ Column ${col + 1}: Offensive=${offensivePotential}, Defensive=${defensivePotential}`);

            // DEFENSIVE FOCUS: Each defensive block adds column 2x, each offensive 4-possibility adds column 1x
            for (let i = 0; i < defensivePotential * 2; i++) {
                weightedColumns.push(col);
            }
            for (let i = 0; i < offensivePotential * 1; i++) {
                weightedColumns.push(col);
            }

            // Base weight: add each column at least once
            if (offensivePotential === 0 && defensivePotential === 0) {
                weightedColumns.push(col);
            }
        }

        if (weightedColumns.length > 0) {
            const chosenMove = weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
            console.log(`🛡️ Defensiv-Gemischt Bot: Chose column ${chosenMove + 1} from weighted list (${weightedColumns.length} options)`);
            return chosenMove;
        }

        // PRIORITY 5: Fallback
        console.log('🛡️ Defensiv-Gemischt Bot: Fallback to center-biased random');
        const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col => validMoves.includes(col));
        return centerMoves.length > 0 ? centerMoves[0] : this.getRandomMove(game);
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
     * STAGE 1: Find direct winning move for current player
     */
    findWinningMove(game) {
        const validMoves = game.getValidMoves();

        for (const col of validMoves) {
            const result = game.simulateMove(col);
            if (result.success && result.wouldWin) {
                return col;
            }
        }

        return null;
    }

    /**
     * STAGE 2: Comprehensive blocking - includes immediate threats AND forks
     * Specifically includes the _ x _ x _ pattern mentioned by user
     */
    findComprehensiveBlockingMove(game) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        const validMoves = game.getValidMoves();

        // First check immediate wins (3-in-a-row threats)
        for (const col of validMoves) {
            const boardCopy = this.copyBoard(game.board);
            const row = this.getLowestEmptyRow(boardCopy, col, game);
            
            if (row !== -1) {
                boardCopy[row][col] = opponent;
                if (this.checkWinOnBoardAtPosition(boardCopy, row, col, opponent, game)) {
                    console.log(`🛡️ BLOCKING immediate threat at column ${col + 1}`);
                    return col;
                }
            }
        }

        // Then check for fork patterns (_ x _ x _)
        const forkBlock = this.findForkBlockingMove(game, opponent);
        if (forkBlock !== null) {
            console.log(`🛡️ BLOCKING fork pattern at column ${forkBlock + 1}`);
            return forkBlock;
        }

        return null;
    }

    /**
     * Find move to block dangerous fork patterns like _ x _ x _
     */
    findForkBlockingMove(game, opponent) {
        const validMoves = game.getValidMoves();
        
        // Check for dangerous fork patterns in all directions
        const directions = [
            [0, 1],   // Horizontal
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        for (const [deltaRow, deltaCol] of directions) {
            for (let row = 0; row < game.ROWS; row++) {
                for (let col = 0; col <= game.COLS - 4; col++) {
                    const forkMove = this.checkForkPattern(game, row, col, deltaRow, deltaCol, opponent, validMoves);
                    if (forkMove !== null) {
                        return forkMove;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Check for specific fork pattern: _ x _ x (creates double threat)
     */
    checkForkPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, validMoves) {
        const window = [];
        const positions = [];
        
        // Build 4-cell window
        for (let i = 0; i < 4; i++) {
            const checkRow = startRow + i * deltaRow;
            const checkCol = startCol + i * deltaCol;
            
            if (checkRow >= 0 && checkRow < game.ROWS && checkCol >= 0 && checkCol < game.COLS) {
                window.push(game.board[checkRow][checkCol]);
                positions.push({ row: checkRow, col: checkCol });
            } else {
                return null; // Window goes out of bounds
            }
        }

        // Check for _ x _ x pattern (empty-opponent-empty-opponent)
        if (window[0] === game.EMPTY && 
            window[1] === opponent && 
            window[2] === game.EMPTY && 
            window[3] === opponent) {
            
            // Check which empty positions are actually playable
            const emptyPos0 = positions[0];
            const emptyPos2 = positions[2];
            
            // For vertical moves, check if positions are reachable
            const canPlay0 = this.isPositionPlayable(game, emptyPos0.row, emptyPos0.col, validMoves);
            const canPlay2 = this.isPositionPlayable(game, emptyPos2.row, emptyPos2.col, validMoves);
            
            if (canPlay0 && canPlay2) {
                // This is a dangerous fork - opponent can win by playing either position
                // Block by playing one of the empty positions
                if (validMoves.includes(emptyPos0.col)) {
                    return emptyPos0.col;
                }
                if (validMoves.includes(emptyPos2.col)) {
                    return emptyPos2.col;
                }
            }
        }

        return null;
    }

    /**
     * Check if a board position is actually playable (piece would land there)
     */
    isPositionPlayable(game, targetRow, targetCol, validMoves) {
        if (!validMoves.includes(targetCol)) {
            return false;
        }
        
        // Find where piece would actually land in this column
        const landingRow = this.getLowestEmptyRow(game.board, targetCol, game);
        return landingRow === targetRow;
    }

    /**
     * STAGE 3: Find safe columns (avoid moves that give opponent immediate wins)
     */
    findSafeColumns(game, validMoves) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        const safeColumns = [];
        
        for (const col of validMoves) {
            if (this.isSafeMove(game, col, opponent)) {
                safeColumns.push(col);
            }
        }
        
        // CRITICAL FIX: If no moves are safe, use center-biased preference
        // Never return ALL validMoves as this allows dangerous Monte Carlo simulation
        if (safeColumns.length === 0) {
            console.log('⚠️ No safe moves found, using center-biased fallback');
            const centerOrder = [3, 2, 4, 1, 5, 0, 6];
            for (const col of centerOrder) {
                if (validMoves.includes(col)) {
                    return [col]; // Return only safest available choice
                }
            }
            return validMoves; // Absolute last resort
        }
        
        return safeColumns;
    }

    /**
     * Check if a move is safe (doesn't give opponent an immediate win next turn)
     */
    isSafeMove(game, col, opponent) {
        // Simulate our move
        const boardCopy = this.copyBoard(game.board);
        const row = this.simulateMove(boardCopy, col, game.currentPlayer);
        
        if (row === -1) {
            return false; // Invalid move
        }
        
        // Check if opponent can win after our move
        const opponentValidMoves = this.getValidMovesForBoard(boardCopy, game);
        
        for (const opponentCol of opponentValidMoves) {
            const opponentRow = this.simulateMove(boardCopy, opponentCol, opponent);
            if (opponentRow !== -1) {
                if (this.checkWinOnBoardAtPosition(boardCopy, opponentRow, opponentCol, opponent, game)) {
                    // This opponent move would win - our move creates a trap
                    boardCopy[opponentRow][opponentCol] = game.EMPTY; // Undo
                    return false; // Move is NOT safe
                }
                // Undo opponent move
                boardCopy[opponentRow][opponentCol] = game.EMPTY;
            }
        }
        
        // If we get here, no opponent move creates an immediate win
        return true;
    }

    /**
     * STAGE 4: Bot-specific selection from safe columns
     */
    selectFromSafeColumns(game, safeColumns, helpers) {
        if (safeColumns.length === 0) {
            return null;
        }
        
        if (safeColumns.length === 1) {
            return safeColumns[0];
        }
        
        // Bot-specific strategies
        switch (this.difficulty) {
            case 'easy':
                // Easy: Random from safe columns
                return safeColumns[Math.floor(Math.random() * safeColumns.length)];
                
            case 'medium':
                // Medium: Center-biased selection from safe columns
                return this.selectCenterBiased(safeColumns);
                
            case 'hard':
            case 'expert':
                // Hard/Expert: Evaluate position potential from safe columns
                return this.selectBestPotential(game, safeColumns);
            
            case 'smart-random':
                // Smart Random: Helpers-based selection with randomness
                return this.selectSmartRandomFromSafe(game, safeColumns, helpers);
            
            case 'offensiv-gemischt':
                // Offensive Mixed: Weighted selection favoring offensive potential
                return this.selectOffensiveWeighted(game, safeColumns);
            
            case 'defensiv-gemischt':
                // Defensive Mixed: Weighted selection favoring defensive disruption
                return this.selectDefensiveWeighted(game, safeColumns);
            
            case 'enhanced-smart':
                // Enhanced Smart: Advanced strategic evaluation
                return this.selectEnhancedStrategic(game, safeColumns, helpers);
            
            case 'defensive':
                // Defensive: Focus on disrupting opponent patterns
                return this.selectDefensivePriority(game, safeColumns);
            
            case 'monte-carlo':
                // Monte Carlo: Use simulation-based evaluation
                return this.selectMonteCarloFromSafe(game, safeColumns);
                
            default:
                // Fallback to random
                return safeColumns[Math.floor(Math.random() * safeColumns.length)];
        }
    }

    /**
     * Select move with center bias from safe columns
     */
    selectCenterBiased(safeColumns) {
        const centerOrder = [3, 2, 4, 1, 5, 0, 6];
        
        for (const col of centerOrder) {
            if (safeColumns.includes(col)) {
                return col;
            }
        }
        
        return safeColumns[0]; // Fallback
    }

    /**
     * Select move with best position potential from safe columns
     */
    selectBestPotential(game, safeColumns) {
        let bestCol = safeColumns[0];
        let bestPotential = -1;
        
        for (const col of safeColumns) {
            const potential = this.evaluatePositionPotential(game, col, game.currentPlayer);
            if (potential > bestPotential) {
                bestPotential = potential;
                bestCol = col;
            }
        }
        
        return bestCol;
    }

    /**
     * Helper methods (existing)
     */
    findWinningMoveForPlayer(game, player) {
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
        const validMoves = game.getValidMoves();

        // Check each valid move to see if it blocks an opponent win
        for (const col of validMoves) {
            // Simulate opponent move
            const boardCopy = this.copyBoard(game.board);
            const row = this.getLowestEmptyRow(boardCopy, col, game);
            
            if (row !== -1) {
                boardCopy[row][col] = opponent;
                if (this.checkWinOnBoardAtPosition(boardCopy, row, col, opponent, game)) {
                    return col; // This move blocks opponent's win
                }
            }
        }

        return null;
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

    /**
     * Evaluate defensive potential of a move - how many opponent 4-in-a-row patterns it disrupts
     * @param {Connect4Game} game - Current game instance  
     * @param {number} col - Column to analyze
     * @returns {number} - Number of opponent patterns disrupted
     */
    evaluateDefensivePotential(game, col) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        
        // Find where our piece would land
        let row = game.ROWS - 1;
        while (row >= 0 && game.board[row][col] !== game.EMPTY) {
            row--;
        }

        if (row < 0) {
            return 0; // Column full
        }

        let defensiveValue = 0;
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical  
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        // For each direction, count how many opponent 4-in-a-row patterns we would disrupt
        for (const [deltaRow, deltaCol] of directions) {
            defensiveValue += this.countDisruptedOpponentPatterns(game, row, col, opponent, deltaRow, deltaCol);
        }

        return defensiveValue;
    }

    /**
     * Count how many opponent 4-in-a-row patterns would be disrupted in a specific direction
     */
    countDisruptedOpponentPatterns(game, row, col, opponent, deltaRow, deltaCol) {
        let disruptedPatterns = 0;

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

                // Check if this window contains a potential opponent pattern that we would disrupt
                if (this.wouldDisruptOpponentPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, row, col)) {
                    disruptedPatterns++;
                }
            }
        }

        return disruptedPatterns;
    }

    /**
     * Check if placing our piece would disrupt an opponent pattern in this 4-cell window
     */
    wouldDisruptOpponentPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, ourRow, ourCol) {
        let opponentPieces = 0;
        let emptySpaces = 0;
        let wouldBlockPattern = false;

        for (let i = 0; i < 4; i++) {
            const checkRow = startRow + i * deltaRow;
            const checkCol = startCol + i * deltaCol;

            if (checkRow === ourRow && checkCol === ourCol) {
                // This is where we would place our piece
                wouldBlockPattern = true;
            } else if (game.board[checkRow][checkCol] === opponent) {
                opponentPieces++;
            } else if (game.board[checkRow][checkCol] === game.EMPTY) {
                emptySpaces++;
                
                // For vertical direction, check if this empty space is actually reachable
                if (deltaRow === 1 && deltaCol === 0) {
                    if (checkRow < game.ROWS - 1 && game.board[checkRow + 1][checkCol] === game.EMPTY) {
                        // This would be a floating piece, so this pattern isn't viable anyway
                        return false;
                    }
                }
            } else {
                // Contains our pieces, so opponent can't use this pattern anyway
                return false;
            }
        }

        // We disrupt a pattern if:
        // 1. The pattern was viable for the opponent (had opponent pieces + empty spaces)
        // 2. Our piece would be placed in this pattern
        // 3. The opponent had at least 1 piece in this pattern (making it worth disrupting)
        return wouldBlockPattern && opponentPieces >= 1 && (opponentPieces + emptySpaces === 4);
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

    /**
     * Enhanced Smart AI: Uses advanced strategic analysis (Even/Odd, Zugzwang, Forks)
     * Priority: Win > Block > Fork > Zugzwang > Even/Odd Strategy > Safe Random
     */
    getEnhancedSmartMove(game, helpers = null) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }

        // PRIORITY 0: If board is empty, play center column
        const totalMoves = game.moveHistory.length;
        if (totalMoves === 0) {
            console.log('🚀 Enhanced Bot: Opening with center column');
            return 3; // Center column (0-indexed)
        }

        // Use helpers system for basic analysis (win, block, trap avoidance)
        if (helpers) {
            // Store original helpers state
            const wasEnabled = helpers.enabled;
            const wasLevel = helpers.helpLevel;

            // PRIORITY 1: Check Level 0 - Own winning opportunities
            helpers.setEnabled(true, 0);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🚀 Enhanced Bot: WINNING at columns', helpers.requiredMoves);
                const winningMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * winningMoves.length);
                return winningMoves[randomIndex];
            }

            // PRIORITY 2: Check Level 1 - Block opponent's threats
            helpers.setEnabled(true, 1);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🚀 Enhanced Bot: BLOCKING threat at columns', helpers.requiredMoves);
                const blockingMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * blockingMoves.length);
                return blockingMoves[randomIndex];
            }

            // Restore original helpers state for advanced analysis
            helpers.setEnabled(wasEnabled, wasLevel);
        }

        // PRIORITY 3: Advanced Strategic Analysis using enhanced evaluation
        if (helpers) {
            console.log('🚀 Enhanced Bot: Running advanced strategic analysis...');
            
            try {
                const strategicEval = helpers.getEnhancedStrategicEvaluation();
                
                console.log('🚀 Strategic Analysis:', {
                    evenOdd: strategicEval.evenOddAnalysis.parity,
                    forks: strategicEval.forkOpportunities.length,
                    recommended: strategicEval.recommendedMove,
                    confidence: strategicEval.confidence
                });

                // PRIORITY 3A: Enhanced fork opportunities (immediate + setup moves)
                if (strategicEval.forkOpportunities.length > 0) {
                    const bestFork = strategicEval.forkOpportunities[0];
                    const forkType = bestFork.setupMove ? 'SETUP FORK' : 'IMMEDIATE FORK';
                    console.log(`🚀 Enhanced Bot: ${forkType} at column ${bestFork.column + 1} (threats: ${bestFork.threats}, total value: ${bestFork.totalValue.toFixed(1)}, priority: ${bestFork.priority})`);
                    return bestFork.column;
                }

                // PRIORITY 3B: Even/Odd threat strategy
                const evenOddAnalysis = strategicEval.evenOddAnalysis;
                if (evenOddAnalysis.parity === 'player_winning_odd' && evenOddAnalysis.player.odd.length > 0) {
                    const oddThreat = evenOddAnalysis.player.odd[0];
                    console.log('🚀 Enhanced Bot: ODD THREAT strategy at column', oddThreat.column + 1);
                    return oddThreat.column;
                }

                if (evenOddAnalysis.parity === 'player_even_advantage' && evenOddAnalysis.player.even.length > 0) {
                    const evenThreat = evenOddAnalysis.player.even[0];
                    console.log('🚀 Enhanced Bot: EVEN THREAT strategy at column', evenThreat.column + 1);
                    return evenThreat.column;
                }

                // PRIORITY 3C: Zugzwang opportunities (forcing sequences)
                if (strategicEval.zugzwangOpportunities && strategicEval.zugzwangOpportunities.length > 0) {
                    const bestZugzwang = strategicEval.zugzwangOpportunities[0];
                    console.log(`🚀 Enhanced Bot: ZUGZWANG OPPORTUNITY at column ${bestZugzwang.column + 1} (value: ${bestZugzwang.value}, type: ${bestZugzwang.type})`);
                    return bestZugzwang.column;
                }

                // PRIORITY 3D: Use recommended move if confidence is decent
                if (strategicEval.recommendedMove !== null && strategicEval.confidence >= 0.3) {
                    console.log('🚀 Enhanced Bot: STRATEGIC RECOMMENDATION at column', strategicEval.recommendedMove + 1, `(confidence: ${strategicEval.confidence})`);
                    return strategicEval.recommendedMove;
                }

            } catch (error) {
                console.error('🚀 Enhanced Bot: Strategic analysis failed:', error.message);
                console.error('🚀 Enhanced Bot: Stack trace:', error.stack);
                console.warn('🚀 Enhanced Bot: Strategic features not working - needs debugging!');
                // Continue with fallback strategy below
            }

            // PRIORITY 4: Check Level 2 - Avoid traps (safe moves only)
            helpers.setEnabled(true, 2);
            helpers.updateHints();

            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                console.log('🚀 Enhanced Bot: AVOIDING TRAPS, safe moves:', helpers.requiredMoves);
                const safeMoves = [...helpers.requiredMoves];
                helpers.setEnabled(wasEnabled, wasLevel);
                const randomIndex = Math.floor(Math.random() * safeMoves.length);
                return safeMoves[randomIndex];
            }

            // Restore original helpers state
            helpers.setEnabled(wasEnabled, wasLevel);
        }

        // PRIORITY 5: DEFENSIVE PATTERN ANALYSIS (like Defensive Bot)
        console.log('🚀 Enhanced Bot: Analyzing defensive patterns + offensive potential...');
        const enhancedMoves = validMoves.map(col => {
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            
            // Enhanced Smart: Balanced approach (1.5x defensive, 1x offensive)
            const combinedValue = defensiveValue * 1.5 + offensiveValue;
            
            return {
                column: col,
                defensiveValue: defensiveValue,
                offensiveValue: offensiveValue,
                combinedValue: combinedValue
            };
        });

        console.log('🚀 Enhanced moves analysis:', enhancedMoves.map(m => 
            `Col ${m.column + 1}: D=${m.defensiveValue}, O=${m.offensiveValue}, Combined=${m.combinedValue.toFixed(1)}`
        ));

        // Find moves with highest combined value
        const maxCombinedValue = Math.max(...enhancedMoves.map(m => m.combinedValue));
        const bestEnhancedMoves = enhancedMoves.filter(m => m.combinedValue === maxCombinedValue);

        if (bestEnhancedMoves.length > 0 && maxCombinedValue > 0) {
            const randomIndex = Math.floor(Math.random() * bestEnhancedMoves.length);
            const chosenMove = bestEnhancedMoves[randomIndex];
            console.log(`🚀 Enhanced Bot: Strategic choice column ${chosenMove.column + 1} (defensive: ${chosenMove.defensiveValue}, offensive: ${chosenMove.offensiveValue}, combined: ${chosenMove.combinedValue.toFixed(1)})`);
            return chosenMove.column;
        }

        // PRIORITY 6: Fallback to weighted center-preferring random
        console.log('🚀 Enhanced Bot: No strategic advantages found, using weighted center preference');
        return this.getWeightedCenterMove(game);
    }

    /**
     * Get a move with preference for center columns
     */
    getWeightedCenterMove(game) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }

        // Weight moves by distance from center (column 3)
        const weights = validMoves.map(col => {
            const distanceFromCenter = Math.abs(col - 3);
            const weight = 7 - distanceFromCenter; // Center gets weight 7, edges get weight 4
            return { column: col, weight: weight };
        });

        // Weighted random selection
        const totalWeight = weights.reduce((sum, move) => sum + move.weight, 0);
        let randomValue = Math.random() * totalWeight;

        for (const move of weights) {
            randomValue -= move.weight;
            if (randomValue <= 0) {
                console.log(`🚀 Enhanced Bot: Weighted center move - column ${move.column + 1} (weight ${move.weight})`);
                return move.column;
            }
        }

        // Fallback
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    /**
     * Monte Carlo AI: Uses universal stages 1-3, then Monte Carlo simulations for stage 4
     * Strategy: Win > Block > Avoid Traps > Monte Carlo Tree Search
     */
    getMonteCarloMove(game, helpers = null) {
        console.log('🎯 Monte Carlo Bot: Starting analysis...');
        
        if (game.moveHistory.length === 0) {
            console.log('🎯 Monte Carlo: Opening with center column');
            return 3; // Center opening
        }
        
        // Use the full universal 4-stage logic with Monte Carlo Stage 4
        return this.getUniversalBestMove(game, helpers);
    }

    /**
     * Run Monte Carlo simulations to evaluate each safe column
     * @param {Connect4Game} game - Current game instance
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number} - Best column based on simulation results
     */
    selectMonteCarloFromSafe(game, safeColumns) {
        if (safeColumns.length === 0) {
            return null;
        }
        
        if (safeColumns.length === 1) {
            console.log('🎯 Monte Carlo: Only one safe column, no simulation needed');
            return safeColumns[0];
        }

        console.log(`🎯 Monte Carlo: Evaluating ${safeColumns.length} safe columns: [${safeColumns.map(c => c + 1).join(', ')}]`);
        
        const simulationsPerColumn = Math.min(100, Math.max(50, Math.floor(500 / safeColumns.length)));
        const startTime = performance.now();
        const timeLimit = 1000; // 1 second maximum
        
        const results = {};
        
        // Initialize results for each safe column
        for (const col of safeColumns) {
            results[col] = { wins: 0, losses: 0, draws: 0, total: 0 };
        }
        
        // Run simulations for each safe column
        for (const col of safeColumns) {
            const elapsedTime = performance.now() - startTime;
            if (elapsedTime > timeLimit) {
                console.log('🎯 Monte Carlo: Time limit reached, using partial results');
                break;
            }
            
            console.log(`🎯 Monte Carlo: Simulating column ${col + 1} (${simulationsPerColumn} games)...`);
            const columnResults = this.runSimulationsForColumn(game, col, simulationsPerColumn, timeLimit - elapsedTime);
            results[col] = columnResults;
        }
        
        // Analyze results and select best column
        const bestColumn = this.selectBestColumnFromResults(results, safeColumns);
        
        const totalTime = performance.now() - startTime;
        console.log(`🎯 Monte Carlo: Analysis complete in ${totalTime.toFixed(1)}ms`);
        console.log('🎯 Monte Carlo Results:', this.formatResults(results));
        console.log(`🎯 Monte Carlo: Selected column ${bestColumn + 1}`);
        
        return bestColumn;
    }

    /**
     * Run Monte Carlo simulations for a specific starting column
     * @param {Connect4Game} game - Current game instance
     * @param {number} startColumn - Column to start simulation from
     * @param {number} maxSimulations - Maximum number of simulations
     * @param {number} timeLimit - Time limit in milliseconds
     * @returns {Object} - Simulation results {wins, losses, draws, total}
     */
    runSimulationsForColumn(game, startColumn, maxSimulations, timeLimit) {
        const results = { wins: 0, losses: 0, draws: 0, total: 0 };
        const startTime = performance.now();
        
        // Create defensive AI instances for simulation
        const ai1 = new Connect4AI('defensive');
        const ai2 = new Connect4AI('defensive');
        
        for (let i = 0; i < maxSimulations; i++) {
            // Check time limit
            if (performance.now() - startTime > timeLimit) {
                break;
            }
            
            const result = this.simulateGame(game, startColumn, ai1, ai2);
            results.total++;
            
            if (result === 'win') {
                results.wins++;
            } else if (result === 'loss') {
                results.losses++;
            } else {
                results.draws++;
            }
        }
        
        return results;
    }

    /**
     * Simulate a complete game starting with a move in the specified column
     * @param {Connect4Game} originalGame - Original game state
     * @param {number} startColumn - Column for first move
     * @param {Connect4AI} ai1 - AI for current player (our perspective)
     * @param {Connect4AI} ai2 - AI for opponent
     * @returns {string} - 'win', 'loss', or 'draw'
     */
    simulateGame(originalGame, startColumn, ai1, ai2) {
        // Create a copy of the game state for simulation
        const simGame = this.createGameCopy(originalGame);
        
        // Make the initial move in the specified column
        const firstMoveResult = simGame.makeMove(startColumn);
        if (!firstMoveResult.success) {
            return 'draw'; // Invalid move
        }
        
        // Track which player we're evaluating for (the player who made the first move)
        const ourPlayer = originalGame.currentPlayer;
        let moveCount = 1;
        const maxMoves = simGame.ROWS * simGame.COLS; // Prevent infinite loops
        
        // Continue simulation until game ends
        while (!simGame.gameOver && moveCount < maxMoves) {
            const currentAI = (simGame.currentPlayer === ourPlayer) ? ai1 : ai2;
            const move = currentAI.getBestMove(simGame);
            
            if (move === null) {
                break; // No valid moves
            }
            
            const result = simGame.makeMove(move);
            if (!result.success) {
                break; // Invalid move
            }
            
            moveCount++;
        }
        
        // Determine result from our perspective
        if (simGame.gameOver && simGame.winner !== null) {
            return (simGame.winner === ourPlayer) ? 'win' : 'loss';
        } else {
            return 'draw';
        }
    }

    /**
     * Create a deep copy of the game state for simulation
     * @param {Connect4Game} originalGame - Original game to copy
     * @returns {Connect4Game} - Deep copy of the game
     */
    createGameCopy(originalGame) {
        const copy = new Connect4Game();
        
        // Copy board state
        copy.board = originalGame.board.map(row => [...row]);
        copy.currentPlayer = originalGame.currentPlayer;
        copy.gameOver = originalGame.gameOver;
        copy.winner = originalGame.winner;
        copy.winningCells = [...originalGame.winningCells];
        copy.moveHistory = [...originalGame.moveHistory];
        
        return copy;
    }

    /**
     * Select the best column based on simulation results
     * @param {Object} results - Results object with win/loss/draw counts per column
     * @param {Array} safeColumns - Array of safe column indices
     * @returns {number} - Best column index
     */
    selectBestColumnFromResults(results, safeColumns) {
        let bestColumn = safeColumns[0];
        let bestScore = -1;
        
        for (const col of safeColumns) {
            const result = results[col];
            if (result.total === 0) continue;
            
            // Calculate win percentage with draw bonus
            const winRate = result.wins / result.total;
            const drawRate = result.draws / result.total;
            const score = winRate + (drawRate * 0.5); // Draws count as half points
            
            if (score > bestScore) {
                bestScore = score;
                bestColumn = col;
            }
        }
        
        return bestColumn;
    }

    /**
     * Format simulation results for logging
     * @param {Object} results - Results object
     * @returns {string} - Formatted results string
     */
    formatResults(results) {
        const formatted = [];
        for (const [col, result] of Object.entries(results)) {
            if (result.total > 0) {
                const winRate = ((result.wins / result.total) * 100).toFixed(1);
                const drawRate = ((result.draws / result.total) * 100).toFixed(1);
                formatted.push(`Col ${parseInt(col) + 1}: ${winRate}% wins, ${drawRate}% draws (${result.total} games)`);
            }
        }
        return formatted.join('; ');
    }

    /**
     * STAGE 4 SELECTION METHODS - Strategic bot-specific selection from safe columns
     */

    /**
     * Smart Random selection from safe columns
     */
    selectSmartRandomFromSafe(game, safeColumns, helpers) {
        // Smart random: prefer center, but with randomness
        const centerOrder = [3, 2, 4, 1, 5, 0, 6];
        const availableCenterMoves = centerOrder.filter(col => safeColumns.includes(col));
        
        // 70% chance to pick from center-ordered moves, 30% completely random
        if (Math.random() < 0.7 && availableCenterMoves.length > 0) {
            return availableCenterMoves[0];
        } else {
            return safeColumns[Math.floor(Math.random() * safeColumns.length)];
        }
    }

    /**
     * Offensive weighted selection from safe columns
     */
    selectOffensiveWeighted(game, safeColumns) {
        const weightedColumns = [];
        
        for (const col of safeColumns) {
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            
            // Offensive focus: 2x offensive weight, 1x defensive weight
            for (let i = 0; i < Math.max(1, offensiveValue * 2); i++) {
                weightedColumns.push(col);
            }
            for (let i = 0; i < Math.max(1, defensiveValue); i++) {
                weightedColumns.push(col);
            }
        }
        
        return weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
    }

    /**
     * Defensive weighted selection from safe columns
     */
    selectDefensiveWeighted(game, safeColumns) {
        const weightedColumns = [];
        
        for (const col of safeColumns) {
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            
            // Defensive focus: 1x offensive weight, 2x defensive weight
            for (let i = 0; i < Math.max(1, offensiveValue); i++) {
                weightedColumns.push(col);
            }
            for (let i = 0; i < Math.max(1, defensiveValue * 2); i++) {
                weightedColumns.push(col);
            }
        }
        
        return weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
    }

    /**
     * Enhanced strategic selection from safe columns
     */
    selectEnhancedStrategic(game, safeColumns, helpers) {
        // Use enhanced strategic analysis if available
        if (helpers) {
            try {
                const strategicEval = helpers.getEnhancedStrategicEvaluation();
                
                // If strategic evaluation provides good recommendations, use them
                if (strategicEval.recommendedMove !== null && 
                    safeColumns.includes(strategicEval.recommendedMove) &&
                    strategicEval.confidence >= 0.4) {
                    return strategicEval.recommendedMove;
                }
            } catch (error) {
                // Enhanced features not available, continue with fallback
            }
        }
        
        // Fallback: balanced offensive/defensive evaluation
        let bestCol = safeColumns[0];
        let bestValue = -1;
        
        for (const col of safeColumns) {
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            const combinedValue = offensiveValue * 1.2 + defensiveValue * 1.5; // Slight defensive bias
            
            if (combinedValue > bestValue) {
                bestValue = combinedValue;
                bestCol = col;
            }
        }
        
        return bestCol;
    }

    /**
     * Defensive priority selection from safe columns
     */
    selectDefensivePriority(game, safeColumns) {
        let bestCol = safeColumns[0];
        let bestDefensiveValue = -1;
        
        for (const col of safeColumns) {
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            
            // Defensive bot: prioritize defense heavily, offense as tiebreaker
            const priority = defensiveValue * 3 + offensiveValue;
            
            if (priority > bestDefensiveValue) {
                bestDefensiveValue = priority;
                bestCol = col;
            }
        }
        
        return bestCol;
    }
}
