/**
 * TrioGame - Core game logic for Trio mathematical game by Ravensburger
 * Find three numbers in a 7x7 grid that solve: target = a×b+c or target = a×b-c
 */
class TrioGame {
    constructor() {
        this.ROWS = 7;
        this.COLS = 7;
        this.TOTAL_CARDS = 49;
        
        // Game state
        this.numberGrid = [];
        this.targetChips = [];
        this.currentTarget = null;
        this.usedChips = [];
        this.gameOver = false;
        this.winner = null;
        
        // Player management
        this.players = [];
        this.currentPlayerIndex = 0;
        this.scores = {}; // playerId: chipCount
        
        // Game configuration
        this.gameMode = 'single'; // Single player mode
        this.difficulty = 'kinderfreundlich'; // Default to child-friendly mode
        this.timeLimit = 30; // seconds per round
        
        // Event system (must be initialized before initializeGame)
        this.eventListeners = {};
        
        this.initializeGame();
    }
    
    /**
     * Initialize the complete game
     */
    initializeGame() {
        this.generateNumberGrid();
        this.generateTargetChips();
        this.resetGameState();
    }
    
    /**
     * Generate a 7x7 grid with numbers 1-9
     */
    generateNumberGrid() {
        this.numberGrid = [];
        
        // Create array with appropriate distribution of numbers 1-9
        const numbers = [];
        for (let i = 1; i <= 9; i++) {
            // Each number appears 5-6 times to fill 49 slots
            const count = i <= 4 ? 6 : 5; // Numbers 1-4 appear 6 times, 5-9 appear 5 times
            for (let j = 0; j < count; j++) {
                numbers.push(i);
            }
        }
        
        // Shuffle the numbers
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        // Fill the 7x7 grid
        let index = 0;
        for (let row = 0; row < this.ROWS; row++) {
            this.numberGrid[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                this.numberGrid[row][col] = numbers[index++];
            }
        }
    }
    
    /**
     * Find strategic targets: few theoretical combinations, many realized on current grid
     * @param {Array} grid - Current 7×7 number grid (optional)
     * @param {number} count - Number of targets to find (default: 15)
     * @returns {Array} - Array of strategic target numbers
     */
    findStrategicTargets(grid = null, count = 15) {
        const candidates = [];
        
        // Test numbers 1-90 for strategic potential
        for (let target = 1; target <= 90; target++) {
            const analysis = this.calculateDifficultyRatio(target, grid);
            
            // Strategic: few theoretical (≤8), high realization ratio (≥0.4), at least 2 realized
            if (analysis.theoreticalCount <= 8 && analysis.ratio >= 0.4 && analysis.realizedCount >= 2) {
                candidates.push({
                    target: target,
                    score: analysis.ratio * analysis.realizedCount, // Prioritize high ratio + many realized
                    analysis: analysis
                });
            }
        }
        
        // Sort by score (best strategic targets first)
        candidates.sort((a, b) => b.score - a.score);
        
        return candidates.slice(0, count).map(c => c.target);
    }
    
    /**
     * Find analytical targets: many theoretical combinations, few realized on current grid
     * @param {Array} grid - Current 7×7 number grid (optional)
     * @param {number} count - Number of targets to find (default: 15)
     * @returns {Array} - Array of analytical target numbers
     */
    findAnalyticalTargets(grid = null, count = 15) {
        const candidates = [];
        
        // Test numbers 1-90 for analytical potential
        for (let target = 1; target <= 90; target++) {
            const analysis = this.calculateDifficultyRatio(target, grid);
            
            // Analytical: many theoretical (≥12), low realization ratio (≤0.25), at least 1 realized
            if (analysis.theoreticalCount >= 12 && analysis.ratio <= 0.25 && analysis.realizedCount >= 1) {
                candidates.push({
                    target: target,
                    score: analysis.theoreticalCount * (1 - analysis.ratio), // Prioritize many theoretical + low ratio
                    analysis: analysis
                });
            }
        }
        
        // Sort by score (best analytical targets first)
        candidates.sort((a, b) => b.score - a.score);
        
        return candidates.slice(0, count).map(c => c.target);
    }
    
    /**
     * Select target number based on difficulty mode and current grid
     * @param {string} mode - Difficulty mode
     * @param {Array} grid - Current 7×7 number grid (optional)
     * @returns {number} - Selected target number
     */
    selectTargetByDifficulty(mode, grid = null) {
        switch (mode) {
            case 'kinderfreundlich':
                // Random number 1-50
                return Math.floor(Math.random() * 50) + 1;
                
            case 'vollspektrum':
                // Random number 1-90
                return Math.floor(Math.random() * 90) + 1;
                
            case 'strategisch':
                // Find strategic targets and pick one randomly
                const strategicTargets = this.findStrategicTargets(grid, 10);
                if (strategicTargets.length > 0) {
                    return strategicTargets[Math.floor(Math.random() * strategicTargets.length)];
                }
                // Fallback to random 1-50
                return Math.floor(Math.random() * 50) + 1;
                
            case 'analytisch':
                // Find analytical targets and pick one randomly  
                const analyticalTargets = this.findAnalyticalTargets(grid, 10);
                if (analyticalTargets.length > 0) {
                    return analyticalTargets[Math.floor(Math.random() * analyticalTargets.length)];
                }
                // Fallback to random 1-90
                return Math.floor(Math.random() * 90) + 1;
                
            default:
                return Math.floor(Math.random() * 50) + 1;
        }
    }
    
    /**
     * Generate target number chips based on intelligent difficulty mode
     */
    generateTargetChips() {
        this.targetChips = [];
        
        console.log(`Generating target chips for difficulty: ${this.difficulty}`);
        
        // For initial load, use simple generation to avoid blocking UI
        if (!this.numberGrid || this.numberGrid.length === 0) {
            console.log('Grid not ready, using fallback generation');
            switch (this.difficulty) {
                case 'kinderfreundlich':
                case 'strategisch':
                    for (let i = 0; i < 15; i++) {
                        this.targetChips.push(Math.floor(Math.random() * 50) + 1);
                    }
                    break;
                case 'vollspektrum':
                case 'analytisch':
                default:
                    for (let i = 0; i < 15; i++) {
                        this.targetChips.push(Math.floor(Math.random() * 90) + 1);
                    }
                    break;
            }
            
            this.targetChips.sort((a, b) => a - b);
            console.log(`Generated ${this.targetChips.length} fallback target chips:`, this.targetChips);
            return;
        }
        
        switch (this.difficulty) {
            case 'kinderfreundlich':
                // Generate 15 random numbers 1-50
                for (let i = 0; i < 15; i++) {
                    this.targetChips.push(Math.floor(Math.random() * 50) + 1);
                }
                break;
                
            case 'vollspektrum':
                // Generate 15 random numbers 1-90
                for (let i = 0; i < 15; i++) {
                    this.targetChips.push(Math.floor(Math.random() * 90) + 1);
                }
                break;
                
            case 'strategisch':
                try {
                    // Generate strategic targets based on current grid
                    const strategicTargets = this.findStrategicTargets(this.numberGrid, 15);
                    this.targetChips = strategicTargets.length > 0 ? strategicTargets : 
                        Array.from({length: 15}, () => Math.floor(Math.random() * 50) + 1);
                } catch (error) {
                    console.warn('Error generating strategic targets, using fallback:', error);
                    for (let i = 0; i < 15; i++) {
                        this.targetChips.push(Math.floor(Math.random() * 50) + 1);
                    }
                }
                break;
                
            case 'analytisch':
                try {
                    // Generate analytical targets based on current grid
                    const analyticalTargets = this.findAnalyticalTargets(this.numberGrid, 15);
                    this.targetChips = analyticalTargets.length > 0 ? analyticalTargets :
                        Array.from({length: 15}, () => Math.floor(Math.random() * 90) + 1);
                } catch (error) {
                    console.warn('Error generating analytical targets, using fallback:', error);
                    for (let i = 0; i < 15; i++) {
                        this.targetChips.push(Math.floor(Math.random() * 90) + 1);
                    }
                }
                break;
                
            default:
                // Fallback: kinderfreundlich
                for (let i = 0; i < 15; i++) {
                    this.targetChips.push(Math.floor(Math.random() * 50) + 1);
                }
        }
        
        // Remove duplicates and ensure minimum count
        this.targetChips = [...new Set(this.targetChips)];
        while (this.targetChips.length < 10) {
            const newTarget = this.selectTargetByDifficulty(this.difficulty, this.numberGrid);
            if (!this.targetChips.includes(newTarget)) {
                this.targetChips.push(newTarget);
            }
        }
        
        // Sort chips by value for progression feel
        this.targetChips.sort((a, b) => a - b);
        
        console.log(`Generated ${this.targetChips.length} target chips for ${this.difficulty} difficulty:`, this.targetChips);
        
        // Debug: Show analysis for first few targets (async to avoid blocking)
        if (this.difficulty === 'strategisch' || this.difficulty === 'analytisch') {
            setTimeout(() => {
                console.log('Target analysis for first 3 chips:');
                this.targetChips.slice(0, 3).forEach(target => {
                    try {
                        const analysis = this.calculateDifficultyRatio(target);
                        console.log(`Target ${target}: ${analysis.realizedCount}/${analysis.theoreticalCount} combinations (${(analysis.ratio * 100).toFixed(1)}%) - ${analysis.difficulty}`);
                    } catch (error) {
                        console.warn(`Error analyzing target ${target}:`, error);
                    }
                });
            }, 100);
        }
    }
    
    /**
     * Reset game state for new game
     */
    resetGameState() {
        this.usedChips = [];
        this.currentTarget = null;
        this.gameOver = false;
        this.winner = null;
        this.currentPlayerIndex = 0;
        
        // Reset scores
        this.players.forEach(player => {
            this.scores[player.id] = 0;
        });
        
        this.emit('gameReset');
    }
    
    /**
     * Add a player to the game
     */
    addPlayer(playerId, playerName, isAI = false) {
        const player = {
            id: playerId,
            name: playerName,
            isAI: isAI,
            chips: []
        };
        
        this.players.push(player);
        this.scores[playerId] = 0;
        
        this.emit('playerAdded', player);
        return player;
    }
    
    /**
     * Start a new round with a target number
     */
    startNewRound() {
        if (this.targetChips.length === 0) {
            this.endGame();
            return false;
        }
        
        // Get next target chip
        this.currentTarget = this.targetChips.shift();
        this.emit('newRound', { target: this.currentTarget });
        
        return true;
    }
    
    /**
     * Submit a solution attempt
     */
    submitSolution(playerId, positions) {
        if (!this.currentTarget || this.gameOver) {
            return { success: false, reason: 'No active round' };
        }
        
        // Validate that we have exactly 3 positions
        if (positions.length !== 3) {
            return { success: false, reason: 'Must select exactly 3 numbers' };
        }
        
        // Get the three numbers
        const numbers = positions.map(pos => this.numberGrid[pos.row][pos.col]);
        const [a, b, c] = numbers;
        
        // Check if solution is valid
        const solution = this.validateSolution(a, b, c, this.currentTarget);
        
        if (solution.isValid) {
            // Award chip to player
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                player.chips.push(this.currentTarget);
                this.scores[playerId]++;
                
                this.usedChips.push({
                    target: this.currentTarget,
                    solution: solution,
                    positions: positions,
                    playerId: playerId
                });
                
                this.emit('solutionFound', {
                    playerId: playerId,
                    target: this.currentTarget,
                    solution: solution,
                    positions: positions
                });
                
                // Start next round
                this.currentTarget = null;
                setTimeout(() => this.startNewRound(), 2000);
                
                return { success: true, solution: solution };
            }
        }
        
        return { success: false, reason: 'Invalid solution', attempted: solution };
    }
    
    /**
     * Validate if three numbers solve the target using a×b+c or a×b-c
     */
    validateSolution(a, b, c, target) {
        // Try all permutations of the three numbers
        const numbers = [a, b, c];
        const permutations = this.getPermutations(numbers);
        
        for (const [x, y, z] of permutations) {
            // Try x×y+z = target
            if (x * y + z === target) {
                return {
                    isValid: true,
                    formula: `${x} × ${y} + ${z} = ${target}`,
                    operation: 'multiplication_addition',
                    numbers: [x, y, z]
                };
            }
            
            // Try x×y-z = target  
            if (x * y - z === target) {
                return {
                    isValid: true,
                    formula: `${x} × ${y} - ${z} = ${target}`,
                    operation: 'multiplication_subtraction',
                    numbers: [x, y, z]
                };
            }
        }
        
        return {
            isValid: false,
            attempted: `No valid formula found for ${a}, ${b}, ${c} = ${target}`
        };
    }
    
    /**
     * Get all permutations of an array
     */
    getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const permutations = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
            const remainingPermutations = this.getPermutations(remaining);
            
            for (const perm of remainingPermutations) {
                permutations.push([current, ...perm]);
            }
        }
        
        return permutations;
    }
    
    /**
     * Find all possible solutions for a target number
     */
    findAllSolutions(target) {
        const solutions = [];
        
        // Check all possible combinations of 3 numbers from the grid
        for (let r1 = 0; r1 < this.ROWS; r1++) {
            for (let c1 = 0; c1 < this.COLS; c1++) {
                for (let r2 = 0; r2 < this.ROWS; r2++) {
                    for (let c2 = 0; c2 < this.COLS; c2++) {
                        for (let r3 = 0; r3 < this.ROWS; r3++) {
                            for (let c3 = 0; c3 < this.COLS; c3++) {
                                // Skip if positions are the same
                                if ((r1 === r2 && c1 === c2) || 
                                    (r1 === r3 && c1 === c3) || 
                                    (r2 === r3 && c2 === c3)) {
                                    continue;
                                }
                                
                                const positions = [
                                    { row: r1, col: c1 },
                                    { row: r2, col: c2 },
                                    { row: r3, col: c3 }
                                ];
                                
                                const numbers = positions.map(pos => this.numberGrid[pos.row][pos.col]);
                                const solution = this.validateSolution(numbers[0], numbers[1], numbers[2], target);
                                
                                if (solution.isValid) {
                                    solutions.push({
                                        positions: positions,
                                        numbers: numbers,
                                        solution: solution
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return solutions;
    }
    
    /**
     * End the game and determine winner
     */
    endGame() {
        this.gameOver = true;
        
        // Find winner (player with most chips)
        let maxChips = 0;
        let winner = null;
        
        this.players.forEach(player => {
            if (this.scores[player.id] > maxChips) {
                maxChips = this.scores[player.id];
                winner = player;
            }
        });
        
        this.winner = winner;
        this.emit('gameEnded', { winner: winner, scores: this.scores });
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        return {
            numberGrid: this.numberGrid.map(row => [...row]),
            currentTarget: this.currentTarget,
            targetChips: [...this.targetChips],
            usedChips: [...this.usedChips],
            players: [...this.players],
            scores: { ...this.scores },
            gameOver: this.gameOver,
            winner: this.winner,
            currentPlayerIndex: this.currentPlayerIndex
        };
    }
    
    /**
     * Get number at specific position
     */
    getNumberAt(row, col) {
        if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) {
            return this.numberGrid[row][col];
        }
        return null;
    }
    
    /**
     * Calculate all theoretically possible a×b±c combinations for a target number
     * @param {number} target - Target number to analyze
     * @returns {Array} - Array of all possible {a, b, c, operation} combinations
     */
    calculateAllPossibleCombinations(target) {
        const combinations = [];
        
        // Check all possible combinations of a, b, c from 1-9
        for (let a = 1; a <= 9; a++) {
            for (let b = 1; b <= 9; b++) {
                for (let c = 1; c <= 9; c++) {
                    // Check a×b+c = target
                    if (a * b + c === target) {
                        combinations.push({ a, b, c, operation: 'addition', formula: `${a}×${b}+${c}=${target}` });
                    }
                    
                    // Check a×b-c = target
                    if (a * b - c === target) {
                        combinations.push({ a, b, c, operation: 'subtraction', formula: `${a}×${b}-${c}=${target}` });
                    }
                }
            }
        }
        
        return combinations;
    }
    
    /**
     * Calculate how many combinations are actually realizable on current grid
     * @param {number} target - Target number to analyze
     * @param {Array} grid - Current 7×7 number grid (optional, uses this.numberGrid if not provided)
     * @returns {Array} - Array of realizable combinations with positions
     */
    calculateRealizedCombinations(target, grid = null) {
        const currentGrid = grid || this.numberGrid;
        const realizedCombinations = [];
        
        if (!currentGrid || currentGrid.length === 0) {
            return realizedCombinations;
        }
        
        // Check all possible combinations of 3 positions from the grid
        for (let r1 = 0; r1 < this.ROWS; r1++) {
            for (let c1 = 0; c1 < this.COLS; c1++) {
                for (let r2 = 0; r2 < this.ROWS; r2++) {
                    for (let c2 = 0; c2 < this.COLS; c2++) {
                        for (let r3 = 0; r3 < this.ROWS; r3++) {
                            for (let c3 = 0; c3 < this.COLS; c3++) {
                                // Skip if positions are the same
                                if ((r1 === r2 && c1 === c2) || 
                                    (r1 === r3 && c1 === c3) || 
                                    (r2 === r3 && c2 === c3)) {
                                    continue;
                                }
                                
                                const positions = [
                                    { row: r1, col: c1 },
                                    { row: r2, col: c2 },
                                    { row: r3, col: c3 }
                                ];
                                
                                const numbers = positions.map(pos => currentGrid[pos.row][pos.col]);
                                const [a, b, c] = numbers;
                                
                                // Check if this combination solves the target
                                if (a * b + c === target) {
                                    realizedCombinations.push({
                                        a, b, c,
                                        operation: 'addition',
                                        formula: `${a}×${b}+${c}=${target}`,
                                        positions: positions
                                    });
                                }
                                
                                if (a * b - c === target) {
                                    realizedCombinations.push({
                                        a, b, c,
                                        operation: 'subtraction', 
                                        formula: `${a}×${b}-${c}=${target}`,
                                        positions: positions
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return realizedCombinations;
    }
    
    /**
     * Calculate difficulty ratio for a target number
     * @param {number} target - Target number to analyze
     * @param {Array} grid - Current 7×7 number grid (optional)
     * @returns {Object} - Analysis object with theoretical, realized counts and ratio
     */
    calculateDifficultyRatio(target, grid = null) {
        const theoretical = this.calculateAllPossibleCombinations(target);
        const realized = this.calculateRealizedCombinations(target, grid);
        
        const ratio = theoretical.length > 0 ? realized.length / theoretical.length : 0;
        
        return {
            target: target,
            theoreticalCount: theoretical.length,
            realizedCount: realized.length,
            ratio: ratio,
            difficulty: this.categorizeDifficulty(theoretical.length, realized.length, ratio),
            theoretical: theoretical,
            realized: realized
        };
    }
    
    /**
     * Categorize difficulty based on theoretical vs realized combinations
     * @param {number} theoreticalCount - Number of theoretical combinations
     * @param {number} realizedCount - Number of realized combinations  
     * @param {number} ratio - Realized/theoretical ratio
     * @returns {string} - Difficulty category
     */
    categorizeDifficulty(theoreticalCount, realizedCount, ratio) {
        if (realizedCount === 0) return 'impossible';
        if (theoreticalCount <= 5 && ratio >= 0.6) return 'strategic'; // Few theoretical, many realized
        if (theoreticalCount >= 15 && ratio <= 0.3) return 'analytical'; // Many theoretical, few realized
        if (ratio >= 0.5) return 'easy';
        if (ratio >= 0.25) return 'medium';
        return 'hard';
    }
    
    /**
     * Event system methods
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
}