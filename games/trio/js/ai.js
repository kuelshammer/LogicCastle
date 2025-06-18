/**
 * TrioAI - AI system for Trio mathematical game
 * Finds solutions for target numbers using a×b+c or a×b-c formulas
 */
class TrioAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.searchDepth = this.getSearchDepth(difficulty);
        this.cache = new Map();
    }
    
    /**
     * Get search parameters based on difficulty
     */
    getSearchDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return { maxSolutions: 1, timeLimit: 500 };
            case 'medium': return { maxSolutions: 3, timeLimit: 1000 };
            case 'hard': return { maxSolutions: 5, timeLimit: 2000 };
            default: return { maxSolutions: 3, timeLimit: 1000 };
        }
    }
    
    /**
     * Find the best solution for a target number
     * @param {TrioGame} game - Current game instance
     * @param {number} target - Target number to solve
     * @returns {Object|null} - Best solution or null if none found
     */
    findBestSolution(game, target) {
        if (!target || !game.numberGrid) {
            return null;
        }
        
        // Check cache first
        const cacheKey = `${target}_${this.gridHash(game.numberGrid)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const startTime = Date.now();
        const solutions = [];
        
        // Find all possible solutions
        for (let r1 = 0; r1 < game.ROWS && solutions.length < this.searchDepth.maxSolutions; r1++) {
            for (let c1 = 0; c1 < game.COLS && solutions.length < this.searchDepth.maxSolutions; c1++) {
                for (let r2 = 0; r2 < game.ROWS && solutions.length < this.searchDepth.maxSolutions; r2++) {
                    for (let c2 = 0; c2 < game.COLS && solutions.length < this.searchDepth.maxSolutions; c2++) {
                        for (let r3 = 0; r3 < game.ROWS && solutions.length < this.searchDepth.maxSolutions; r3++) {
                            for (let c3 = 0; c3 < game.COLS && solutions.length < this.searchDepth.maxSolutions; c3++) {
                                // Skip if positions are the same
                                if ((r1 === r2 && c1 === c2) || 
                                    (r1 === r3 && c1 === c3) || 
                                    (r2 === r3 && c2 === c3)) {
                                    continue;
                                }
                                
                                // Check time limit
                                if (Date.now() - startTime > this.searchDepth.timeLimit) {
                                    break;
                                }
                                
                                const positions = [
                                    { row: r1, col: c1 },
                                    { row: r2, col: c2 },
                                    { row: r3, col: c3 }
                                ];
                                
                                const numbers = positions.map(pos => game.numberGrid[pos.row][pos.col]);
                                const solution = game.validateSolution(numbers[0], numbers[1], numbers[2], target);
                                
                                if (solution.isValid) {
                                    solutions.push({
                                        positions: positions,
                                        numbers: numbers,
                                        solution: solution,
                                        score: this.scoreSolution(solution, numbers, positions)
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (solutions.length === 0) {
            this.cache.set(cacheKey, null);
            return null;
        }
        
        // Sort solutions by score and pick the best one based on difficulty
        solutions.sort((a, b) => b.score - a.score);
        
        const bestSolution = this.selectSolutionByDifficulty(solutions);
        this.cache.set(cacheKey, bestSolution);
        
        return bestSolution;
    }
    
    /**
     * Score a solution based on various factors
     */
    scoreSolution(solution, numbers, positions) {
        let score = 0;
        
        // Prefer simpler operations (addition over subtraction)
        if (solution.operation === 'multiplication_addition') {
            score += 10;
        } else {
            score += 5;
        }
        
        // Prefer smaller numbers (easier to spot)
        const avgNumber = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        score += Math.max(0, 10 - avgNumber);
        
        // Prefer positions that are closer together (easier to see pattern)
        const distance = this.calculatePositionDistance(positions);
        score += Math.max(0, 10 - distance);
        
        // Add some randomness to avoid predictable patterns
        score += Math.random() * 3;
        
        return score;
    }
    
    /**
     * Calculate average distance between positions
     */
    calculatePositionDistance(positions) {
        let totalDistance = 0;
        let pairCount = 0;
        
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const dx = positions[i].col - positions[j].col;
                const dy = positions[i].row - positions[j].row;
                totalDistance += Math.sqrt(dx * dx + dy * dy);
                pairCount++;
            }
        }
        
        return pairCount > 0 ? totalDistance / pairCount : 0;
    }
    
    /**
     * Select solution based on AI difficulty
     */
    selectSolutionByDifficulty(solutions) {
        if (solutions.length === 0) return null;
        
        switch (this.difficulty) {
            case 'easy':
                // Pick a random solution from top 50%
                const easyIndex = Math.floor(Math.random() * Math.ceil(solutions.length / 2));
                return solutions[easyIndex];
                
            case 'medium':
                // Pick a random solution from top 25%
                const mediumIndex = Math.floor(Math.random() * Math.ceil(solutions.length / 4));
                return solutions[mediumIndex];
                
            case 'hard':
                // Always pick the best solution
                return solutions[0];
                
            default:
                return solutions[0];
        }
    }
    
    /**
     * Generate a simple hash of the grid for caching
     */
    gridHash(grid) {
        return grid.flat().join(',');
    }
    
    /**
     * Make an AI move (find and submit a solution)
     * @param {TrioGame} game - Current game instance
     * @param {string} playerId - AI player ID
     * @returns {Object} - Result of the move attempt
     */
    makeMove(game, playerId) {
        if (!game.currentTarget) {
            return { success: false, reason: 'No active target' };
        }
        
        // Add some thinking delay for realism
        const thinkingTime = this.getThinkingTime();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const solution = this.findBestSolution(game, game.currentTarget);
                
                if (solution) {
                    const result = game.submitSolution(playerId, solution.positions);
                    resolve(result);
                } else {
                    // AI couldn't find a solution - this shouldn't happen if target chips are valid
                    console.warn(`AI couldn't find solution for target ${game.currentTarget}`);
                    resolve({ success: false, reason: 'No solution found' });
                }
            }, thinkingTime);
        });
    }
    
    /**
     * Get AI thinking time based on difficulty
     */
    getThinkingTime() {
        const baseTime = {
            'easy': 1000,
            'medium': 2000, 
            'hard': 3000
        }[this.difficulty] || 2000;
        
        // Add random variation
        return baseTime + Math.random() * 1000;
    }
    
    /**
     * Analyze the current game state
     * @param {TrioGame} game - Current game instance
     * @returns {Object} - Analysis results
     */
    analyzeGameState(game) {
        const analysis = {
            totalSolutions: 0,
            averageDifficulty: 0,
            recommendedStrategy: 'balanced'
        };
        
        // Analyze remaining target chips
        game.targetChips.forEach(target => {
            const solutions = game.findAllSolutions(target);
            analysis.totalSolutions += solutions.length;
        });
        
        if (game.targetChips.length > 0) {
            analysis.averageDifficulty = analysis.totalSolutions / game.targetChips.length;
            
            if (analysis.averageDifficulty < 2) {
                analysis.recommendedStrategy = 'aggressive'; // Few solutions, need to be fast
            } else if (analysis.averageDifficulty > 5) {
                analysis.recommendedStrategy = 'patient'; // Many solutions, can take time
            }
        }
        
        return analysis;
    }
    
    /**
     * Clear the solution cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
        };
    }
}