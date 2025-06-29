/**
 * Enhanced GobangAI - WASM-Powered Smart Bot with Threat-Awareness
 * Integrates advanced Rust/WASM analysis for superior strategic decisions
 */

class EnhancedGobangAI {
    constructor(difficulty = 'wasm-smart', wasmIntegration = null) {
        this.difficulty = difficulty;
        this.wasmIntegration = wasmIntegration;
        this.evaluator = null;
        
        // AI Configuration
        this.config = {
            useWasmEngine: true,
            threatAwareness: true,
            patternRecognition: true,
            strategicDepth: 3,
            randomnessFactor: 0.1,
            
            // Weight factors for move evaluation
            weights: {
                immediateWin: 10000,
                blockOpponentWin: 5000,
                createDoubleThreeFork: 3000,
                createClosedFour: 2000,
                createOpenThree: 1500,
                blockOpponentFork: 1200,
                centerBonus: 100,
                cornerPenalty: -50,
                avoidDangerous: -800
            }
        };
        
        // Performance tracking
        this.metrics = {
            movesEvaluated: 0,
            wasmCallTime: 0,
            totalThinkTime: 0,
            lastMoveStrength: 0
        };
        
        console.log('🦀 Enhanced AI initialized with WASM integration');
    }

    /**
     * Get the best move using advanced WASM-powered analysis
     * @param {Object} game - Game instance (either JS or WASM)
     * @param {Object} helpers - Helpers system (optional)
     * @returns {Object} - Best move {row, col, strength, reasoning}
     */
    async getBestMove(game, helpers = null) {
        const startTime = performance.now();
        
        try {
            console.log('🤖 Enhanced AI: Analyzing position...');
            
            // Use WASM analysis if available
            if (this.wasmIntegration && this.wasmIntegration.isWasmEnabled) {
                const move = await this.getWasmEnhancedMove(game);
                this.updateMetrics(startTime, move);
                return move;
            } else {
                // Fallback to enhanced JavaScript analysis
                const move = this.getEnhancedJavaScriptMove(game, helpers);
                this.updateMetrics(startTime, move);
                return move;
            }
            
        } catch (error) {
            console.error('❌ Enhanced AI error:', error);
            // Fallback to simple move
            return this.getSimpleFallbackMove(game);
        }
    }

    /**
     * WASM-powered move analysis
     */
    async getWasmEnhancedMove(game) {
        console.log('🦀 Using WASM-enhanced analysis...');
        const wasmStartTime = performance.now();
        
        try {
            // Sync game state and get comprehensive analysis
            await this.wasmIntegration.syncGameState();
            const analysis = await this.wasmIntegration.getMoveAnalysis();
            
            this.metrics.wasmCallTime = performance.now() - wasmStartTime;
            
            // Evaluate moves using WASM analysis
            const candidateMoves = this.evaluateMovesWithWasm(analysis);
            
            if (candidateMoves.length === 0) {
                return this.getRandomValidMove(game);
            }
            
            // Select best move with some randomness for variety
            const bestMove = this.selectBestMoveWithRandomness(candidateMoves);
            
            console.log(`🎯 WASM AI selected: ${this.wasmIntegration.positionToNotation(bestMove.row, bestMove.col)} (strength: ${bestMove.strength})`);
            console.log(`📊 Reasoning: ${bestMove.reasoning}`);
            
            return bestMove;
            
        } catch (error) {
            console.error('❌ WASM analysis failed:', error);
            throw error;
        }
    }

    /**
     * Evaluate moves using WASM analysis results
     */
    evaluateMovesWithWasm(analysis) {
        const candidateMoves = [];
        
        // 1. IMMEDIATE WINS (Priority 1)
        if (analysis.winning && analysis.winning.length > 0) {
            analysis.winning.forEach(move => {
                candidateMoves.push({
                    ...move,
                    strength: this.config.weights.immediateWin,
                    reasoning: 'Immediate winning move',
                    priority: 1
                });
            });
            return candidateMoves; // Return immediately for winning moves
        }
        
        // 2. BLOCK OPPONENT WINS (Priority 2)
        if (analysis.blocking && analysis.blocking.length > 0) {
            analysis.blocking.forEach(move => {
                candidateMoves.push({
                    ...move,
                    strength: this.config.weights.blockOpponentWin,
                    reasoning: 'Blocks opponent winning move',
                    priority: 2
                });
            });
        }
        
        // 3. DOUBLE THREE FORKS (Priority 3)
        if (analysis.doubleForks && analysis.doubleForks.length > 0) {
            analysis.doubleForks.forEach(move => {
                candidateMoves.push({
                    ...move,
                    strength: this.config.weights.createDoubleThreeFork,
                    reasoning: 'Creates double three fork',
                    priority: 3
                });
            });
        }
        
        // 4. CLOSED FOUR PATTERNS (Priority 4)
        if (analysis.closedFour && analysis.closedFour.length > 0) {
            analysis.closedFour.forEach(move => {
                candidateMoves.push({
                    ...move,
                    strength: this.config.weights.createClosedFour,
                    reasoning: 'Creates closed four pattern',
                    priority: 4
                });
            });
        }
        
        // 5. OPEN THREE PATTERNS (Priority 5)
        if (analysis.openThree && analysis.openThree.length > 0) {
            analysis.openThree.forEach(move => {
                candidateMoves.push({
                    ...move,
                    strength: this.config.weights.createOpenThree,
                    reasoning: 'Creates open three pattern',
                    priority: 5
                });
            });
        }
        
        // 6. AVOID DANGEROUS MOVES (Negative priority)
        if (analysis.dangerous && analysis.dangerous.length > 0) {
            // Don't add dangerous moves, but mark them for avoidance
            this.dangerousPositions = new Set(
                analysis.dangerous.map(move => `${move.row},${move.col}`)
            );
        }
        
        // 7. If no high-priority moves, evaluate all valid positions with threat levels
        if (candidateMoves.length === 0) {
            this.addThreatAwareMoves(candidateMoves);
        }
        
        return candidateMoves;
    }

    /**
     * Add threat-aware moves for positions without immediate tactical value
     */
    addThreatAwareMoves(candidateMoves) {
        if (!this.wasmIntegration || !this.wasmIntegration.wasmGame) return;
        
        const validMoves = this.wasmIntegration.wasmGame.getValidMoves();
        
        for (let i = 0; i < validMoves.length; i += 2) {
            const row = validMoves[i];
            const col = validMoves[i + 1];
            const posKey = `${row},${col}`;
            
            // Skip dangerous positions
            if (this.dangerousPositions && this.dangerousPositions.has(posKey)) {
                continue;
            }
            
            try {
                // Get threat level for this position
                const threatLevel = this.wasmIntegration.wasmGame.getThreatLevel(row, col);
                
                // Calculate strategic value
                let strength = this.calculateStrategicValue(row, col, threatLevel);
                
                candidateMoves.push({
                    row,
                    col,
                    strength,
                    reasoning: `Strategic move (threat level: ${threatLevel})`,
                    priority: 6,
                    threatLevel
                });
                
            } catch (error) {
                // Skip positions that can't be evaluated
                console.warn(`Could not evaluate position (${row}, ${col}):`, error);
            }
        }
    }

    /**
     * Calculate strategic value for a position
     */
    calculateStrategicValue(row, col, threatLevel) {
        let strength = 0;
        
        // Threat level bonus (higher threat = better position)
        strength += threatLevel * 200;
        
        // Center bias (positions closer to center are generally better)
        const centerRow = 7;
        const centerCol = 7;
        const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        strength += this.config.weights.centerBonus * (15 - distanceFromCenter) / 15;
        
        // Corner penalty
        if ((row <= 1 || row >= 13) && (col <= 1 || col >= 13)) {
            strength += this.config.weights.cornerPenalty;
        }
        
        // Edge penalty
        if (row === 0 || row === 14 || col === 0 || col === 14) {
            strength -= 30;
        }
        
        return strength;
    }

    /**
     * Enhanced JavaScript move analysis (fallback)
     */
    getEnhancedJavaScriptMove(game, helpers) {
        console.log('📝 Using enhanced JavaScript analysis...');
        
        // Use existing helper system if available
        if (helpers) {
            // Try winning moves first
            helpers.setEnabled(true, 0);
            helpers.updateHints();
            
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                const move = helpers.requiredMoves[Math.floor(Math.random() * helpers.requiredMoves.length)];
                return {
                    ...move,
                    strength: this.config.weights.immediateWin,
                    reasoning: 'Winning move (JS analysis)'
                };
            }
            
            // Try blocking moves
            helpers.setEnabled(true, 1);
            helpers.updateHints();
            
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                const move = helpers.requiredMoves[Math.floor(Math.random() * helpers.requiredMoves.length)];
                return {
                    ...move,
                    strength: this.config.weights.blockOpponentWin,
                    reasoning: 'Blocking move (JS analysis)'
                };
            }
        }
        
        // Strategic JavaScript evaluation
        return this.getStrategicJavaScriptMove(game);
    }

    /**
     * Strategic JavaScript move evaluation
     */
    getStrategicJavaScriptMove(game) {
        const validMoves = game.getValidMoves();
        const candidateMoves = [];
        
        validMoves.forEach(move => {
            let strength = this.evaluatePositionJS(game, move.row, move.col);
            
            candidateMoves.push({
                row: move.row,
                col: move.col,
                strength,
                reasoning: 'Strategic JS evaluation'
            });
        });
        
        if (candidateMoves.length === 0) {
            return this.getRandomValidMove(game);
        }
        
        return this.selectBestMoveWithRandomness(candidateMoves);
    }

    /**
     * JavaScript position evaluation
     */
    evaluatePositionJS(game, row, col) {
        let strength = 0;
        
        // Center bias
        const centerRow = 7;
        const centerCol = 7;
        const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        strength += (15 - distanceFromCenter) * 10;
        
        // Check for potential patterns
        const currentPlayer = game.currentPlayer;
        
        // Simulate the move
        const simulation = game.simulateMove(row, col);
        if (simulation.wouldWin) {
            strength += this.config.weights.immediateWin;
        }
        
        // Check if it blocks opponent
        const opponent = currentPlayer === game.BLACK ? game.WHITE : game.BLACK;
        const originalPlayer = game.currentPlayer;
        game.currentPlayer = opponent;
        const opponentSimulation = game.simulateMove(row, col);
        game.currentPlayer = originalPlayer;
        
        if (opponentSimulation.wouldWin) {
            strength += this.config.weights.blockOpponentWin;
        }
        
        return strength;
    }

    /**
     * Select best move with controlled randomness
     */
    selectBestMoveWithRandomness(candidateMoves) {
        if (candidateMoves.length === 0) {
            throw new Error('No candidate moves available');
        }
        
        // Sort by strength
        candidateMoves.sort((a, b) => b.strength - a.strength);
        
        // Get top moves within reasonable strength range
        const bestStrength = candidateMoves[0].strength;
        const threshold = bestStrength * (1 - this.config.randomnessFactor);
        const topMoves = candidateMoves.filter(move => move.strength >= threshold);
        
        // Select randomly among top moves
        const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
        
        this.metrics.movesEvaluated = candidateMoves.length;
        this.metrics.lastMoveStrength = selectedMove.strength;
        
        return selectedMove;
    }

    /**
     * Simple fallback move
     */
    getSimpleFallbackMove(game) {
        console.log('🔄 Using simple fallback move...');
        return this.getRandomValidMove(game);
    }

    /**
     * Get random valid move
     */
    getRandomValidMove(game) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) {
            throw new Error('No valid moves available');
        }
        
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        return {
            ...move,
            strength: 0,
            reasoning: 'Random fallback move'
        };
    }

    /**
     * Update performance metrics
     */
    updateMetrics(startTime, move) {
        this.metrics.totalThinkTime = performance.now() - startTime;
        console.log(`🧠 AI thinking time: ${this.metrics.totalThinkTime.toFixed(2)}ms`);
        console.log(`⚡ WASM call time: ${this.metrics.wasmCallTime.toFixed(2)}ms`);
        console.log(`📊 Moves evaluated: ${this.metrics.movesEvaluated}`);
        console.log(`💪 Move strength: ${this.metrics.lastMoveStrength}`);
    }

    /**
     * Configure AI behavior
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 AI configuration updated:', newConfig);
    }

    /**
     * Get AI performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Set WASM integration
     */
    setWasmIntegration(wasmIntegration) {
        this.wasmIntegration = wasmIntegration;
        if (wasmIntegration) {
            console.log('🦀 WASM integration connected to AI');
        }
    }

    /**
     * Get AI status and capabilities
     */
    getStatus() {
        return {
            difficulty: this.difficulty,
            wasmEnabled: this.wasmIntegration?.isWasmEnabled || false,
            wasmInitialized: this.wasmIntegration?.isInitialized || false,
            config: this.config,
            metrics: this.metrics
        };
    }
}

// Export for global use
window.EnhancedGobangAI = EnhancedGobangAI;