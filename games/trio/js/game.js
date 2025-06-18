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
        this.gameMode = 'multiplayer'; // 'multiplayer', 'single', 'vs-ai'
        this.difficulty = 'medium';
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
     * Generate target number chips based on difficulty mode
     */
    generateTargetChips() {
        this.targetChips = [];
        
        // Define target pools by difficulty
        const targetPools = {
            easy: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            medium: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
            hard: [25, 30, 35, 40, 42, 45, 48, 50, 54, 56, 60, 63, 70, 72, 81, 90]
        };
        
        // Get target pool based on current difficulty
        let possibleTargets;
        switch (this.difficulty) {
            case 'easy':
                possibleTargets = [...targetPools.easy];
                break;
            case 'hard':
                possibleTargets = [...targetPools.hard];
                break;
            case 'medium':
            default:
                possibleTargets = [...targetPools.medium];
                break;
        }
        
        // For single player mode, select all targets from the chosen difficulty
        const chipCount = Math.min(15, possibleTargets.length);
        
        // Shuffle and take the required amount
        for (let i = possibleTargets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possibleTargets[i], possibleTargets[j]] = [possibleTargets[j], possibleTargets[i]];
        }
        
        this.targetChips = possibleTargets.slice(0, chipCount);
        
        // Sort chips by value for progression feel
        this.targetChips.sort((a, b) => a - b);
        
        console.log(`Generated ${chipCount} target chips for ${this.difficulty} difficulty:`, this.targetChips);
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