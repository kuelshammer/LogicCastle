/**
 * TrioGame - Core game logic for Trio mathematical game by Ravensburger
 * Find three numbers in a 7x7 grid that solve: target = a×b+c or target = a×b-c
 */

// WASM import - will be dynamically loaded
let WasmGame = null;
let WasmTrioGame = null;

// Initialize WASM module
export async function initTrioWasm() {
    if (!WasmGame && typeof window !== 'undefined' && window.WasmGame) {
        WasmGame = window.WasmGame;
    }
    // Import TrioGame from WASM module 
    if (typeof window !== 'undefined' && window.TrioGame) {
        WasmTrioGame = window.TrioGame;
    }
}

export class TrioGame {
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

        // WASM game instance
        this.wasmGame = null;

        this.initializeGame();
    }

    /**
     * Initialize the complete game
     */
    initializeGame() {
        // Wait for WASM to be available
        if (!WasmTrioGame) {
            console.error('WASM TrioGame not available yet');
            setTimeout(() => this.initializeGame(), 100);
            return;
        }

        try {
            // Create proper TrioGame instance using dedicated WASM TrioGame class
            let difficultyValue = 1; // Default to easy
            switch (this.difficulty) {
                case 'kinderfreundlich':
                    difficultyValue = 1;
                    break;
                case 'vollspektrum':
                    difficultyValue = 2;
                    break;
                case 'strategisch':
                case 'analytisch':
                    difficultyValue = 3;
                    break;
            }
            
            this.wasmGame = new WasmTrioGame(difficultyValue);
            
            // Get board and target from proper TrioGame WASM
            this.numberGrid = this.convertWasmBoardToJsGrid(this.wasmGame.get_board());
            this.currentTarget = this.wasmGame.get_target_number();
            
            // For now, generate additional targets - we'll enhance this later
            this.targetChips = [this.currentTarget];
            this.resetGameState();
            
            console.log('✅ Trio WASM game initialized successfully with target:', this.currentTarget);
        } catch (error) {
            console.error('❌ Failed to initialize Trio WASM game:', error);
        }
    }

    convertWasmBoardToJsGrid(wasmBoard) {
        const grid = [];
        let index = 0;
        
        // Convert Int8Array to regular array if needed
        const boardArray = wasmBoard instanceof Int8Array ? Array.from(wasmBoard) : wasmBoard;
        
        for (let row = 0; row < this.ROWS; row++) {
            grid[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                grid[row][col] = boardArray[index++];
            }
        }
        return grid;
    }

    /**
     * Generate a 7x7 grid with numbers 1-9
     */
    generateNumberGrid() {
        // This is now handled by the WASM module
        // The numberGrid is populated in initializeGame
    }

    /**
     * Generate a simple target number for testing
     */
    generateSimpleTarget() {
        // Generate a target between 10-50 for kinderfreundlich mode
        switch (this.difficulty) {
            case 'kinderfreundlich':
                return Math.floor(Math.random() * 40) + 10; // 10-50
            case 'vollspektrum':
                return Math.floor(Math.random() * 80) + 10; // 10-90
            case 'strategisch':
            case 'analytisch':
                return Math.floor(Math.random() * 60) + 20; // 20-80
            default:
                return Math.floor(Math.random() * 40) + 10;
        }
    }

    

    /**
     * Generate target number chips based on intelligent difficulty mode
     */
    generateTargetChips() {
        // This is now handled by the WASM module
        // The targetChips are populated in initializeGame
    }

    /**
     * Get number at specific grid position
     */
    getNumberAt(row, col) {
        if (row < 0 || row >= this.ROWS || col < 0 || col >= this.COLS) {
            return null;
        }
        return this.numberGrid[row][col];
    }

    /**
     * Find all possible solutions for a target number
     */
    findAllSolutions(target) {
        const solutions = [];
        
        // Check all combinations of three numbers from the grid
        for (let i = 0; i < this.ROWS; i++) {
            for (let j = 0; j < this.COLS; j++) {
                for (let k = 0; k < this.ROWS; k++) {
                    for (let l = 0; l < this.COLS; l++) {
                        for (let m = 0; m < this.ROWS; m++) {
                            for (let n = 0; n < this.COLS; n++) {
                                // Skip if same position used twice
                                if ((i === k && j === l) || (i === m && j === n) || (k === m && l === n)) {
                                    continue;
                                }
                                
                                const a = this.numberGrid[i][j];
                                const b = this.numberGrid[k][l];
                                const c = this.numberGrid[m][n];
                                
                                // Check both formulas: a×b+c and a×b-c
                                if (a * b + c === target) {
                                    solutions.push({
                                        numbers: [a, b, c],
                                        positions: [{row: i, col: j}, {row: k, col: l}, {row: m, col: n}],
                                        formula: `${a} × ${b} + ${c} = ${target}`,
                                        operation: 'add'
                                    });
                                }
                                if (a * b - c === target) {
                                    solutions.push({
                                        numbers: [a, b, c],
                                        positions: [{row: i, col: j}, {row: k, col: l}, {row: m, col: n}],
                                        formula: `${a} × ${b} - ${c} = ${target}`,
                                        operation: 'subtract'
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Remove duplicates (same numbers in different order)
        const uniqueSolutions = [];
        for (const solution of solutions) {
            const sortedNumbers = [...solution.numbers].sort((a, b) => a - b);
            const exists = uniqueSolutions.some(existing => {
                const existingSorted = [...existing.numbers].sort((a, b) => a - b);
                return JSON.stringify(sortedNumbers) === JSON.stringify(existingSorted) &&
                       existing.operation === solution.operation;
            });
            if (!exists) {
                uniqueSolutions.push(solution);
            }
        }
        
        return uniqueSolutions;
    }

    /**
     * Calculate difficulty ratio for strategic analysis
     */
    calculateDifficultyRatio(target) {
        const solutions = this.findAllSolutions(target);
        const totalPossibleCombinations = this.TOTAL_CARDS * (this.TOTAL_CARDS - 1) * (this.TOTAL_CARDS - 2) * 2; // 2 operations
        
        return {
            realizedSolutions: solutions.length,
            theoreticalCombinations: totalPossibleCombinations,
            difficultyRatio: solutions.length / totalPossibleCombinations,
            complexity: solutions.length < 5 ? 'hard' : solutions.length < 15 ? 'medium' : 'easy'
        };
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
        // Generate a new WASM TrioGame instance for the next round
        let difficultyValue = 1; // Default to easy
        switch (this.difficulty) {
            case 'kinderfreundlich':
                difficultyValue = 1;
                break;
            case 'vollspektrum':
                difficultyValue = 2;
                break;
            case 'strategisch':
            case 'analytisch':
                difficultyValue = 3;
                break;
        }
        this.wasmGame = new WasmTrioGame(difficultyValue);
        this.numberGrid = this.convertWasmBoardToJsGrid(this.wasmGame.get_board());
        this.currentTarget = this.wasmGame.get_target_number();

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
     * Uses WASM TrioGame for efficient validation
     */
    validateSolution(a, b, c, target) {
        // Find positions of the numbers in the grid
        const positions = [];
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const value = this.numberGrid[row][col];
                if (value === a && positions.length === 0) {
                    positions.push({row, col});
                } else if (value === b && positions.length === 1) {
                    positions.push({row, col});
                } else if (value === c && positions.length === 2) {
                    positions.push({row, col});
                    break;
                }
            }
            if (positions.length === 3) break;
        }

        // If we can't find all three numbers, fall back to manual validation
        if (positions.length !== 3 || !this.wasmGame.check_combination) {
            return this.validateSolutionManual(a, b, c, target);
        }

        try {
            // Use WASM TrioGame's efficient combination checking
            const isValid = this.wasmGame.check_combination(
                positions[0].row, positions[0].col,
                positions[1].row, positions[1].col,
                positions[2].row, positions[2].col
            );

            if (isValid) {
                // Figure out the correct formula by testing both operations
                if (a * b + c === target) {
                    return {
                        isValid: true,
                        formula: `${a} × ${b} + ${c} = ${target}`,
                        operation: 'add',
                        numbers: [a, b, c]
                    };
                } else if (a * b - c === target) {
                    return {
                        isValid: true,
                        formula: `${a} × ${b} - ${c} = ${target}`,
                        operation: 'subtract',
                        numbers: [a, b, c]
                    };
                }
                // Try other permutations...
                return this.validateSolutionManual(a, b, c, target);
            }
        } catch (error) {
            console.warn('WASM validation failed, falling back to manual:', error);
        }

        return {
            isValid: false,
            attempted: `No valid formula found for ${a}, ${b}, ${c} = ${target}`
        };
    }

    /**
     * Manual solution validation fallback
     */
    validateSolutionManual(a, b, c, target) {
        // Check all permutations and both operations
        const permutations = [
            [a, b, c], [a, c, b], [b, a, c], 
            [b, c, a], [c, a, b], [c, b, a]
        ];

        for (const [x, y, z] of permutations) {
            // Try addition: x × y + z = target
            if (x * y + z === target) {
                return {
                    isValid: true,
                    formula: `${x} × ${y} + ${z} = ${target}`,
                    operation: 'add',
                    numbers: [x, y, z]
                };
            }
            // Try subtraction: x × y - z = target
            if (x * y - z === target) {
                return {
                    isValid: true,
                    formula: `${x} × ${y} - ${z} = ${target}`,
                    operation: 'subtract',
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

// ES6 Module export - no global assignment needed
// Class is exported as named export: TrioGame
