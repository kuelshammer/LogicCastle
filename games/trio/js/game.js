/**
 * TrioGame - Core game logic for Trio mathematical game by Ravensburger
 * Find three numbers in a 7x7 grid that solve: target = a×b+c or target = a×b-c
 */
class _TrioGame {
    constructor(WasmTrioGame) {
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
        this.WasmTrioGame = WasmTrioGame; // Store the WASM class

        this.initializeGame();
    }

    /**
     * Initialize the complete game
     */
    initializeGame() {
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
        this.wasmGame = new this.WasmTrioGame(difficultyValue);
        this.numberGrid = this.convertWasmBoardToJsGrid(this.wasmGame.get_board());
        this.targetChips = [this.wasmGame.get_target_number()]; // Initial target from WASM
        this.resetGameState();
    }

    convertWasmBoardToJsGrid(wasmBoard) {
        const grid = [];
        let index = 0;
        for (let row = 0; row < this.ROWS; row++) {
            grid[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                grid[row][col] = wasmBoard[index++];
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
     * Generate target number chips based on intelligent difficulty mode
     */
    generateTargetChips() {
        // This is now handled by the WASM module
        // The targetChips are populated in initializeGame
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
        // Generate a new WASM game instance for the next round
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
        this.wasmGame = new this.WasmTrioGame(difficultyValue);
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
     */
    validateSolution(a, b, c, target) {
        // The WASM module handles the permutations and operations
        const isValid = this.wasmGame.check_combination(
            this.numberGrid.findIndex(row => row.includes(a)),
            this.numberGrid.find(row => row.includes(a)).indexOf(a),
            this.numberGrid.findIndex(row => row.includes(b)),
            this.numberGrid.find(row => row.includes(b)).indexOf(b),
            this.numberGrid.findIndex(row => row.includes(c)),
            this.numberGrid.find(row => row.includes(c)).indexOf(c)
        );

        if (isValid) {
            return {
                isValid: true,
                formula: `${a} × ${b} + ${c} = ${target}`, // Placeholder, WASM doesn't return formula
                operation: 'unknown',
                numbers: [a, b, c]
            };
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

// Make class available globally for tests
if (typeof window !== 'undefined') {
    window.TrioGame = _TrioGame;
}

// Make class available globally for tests
if (typeof window !== 'undefined') {
    window.TrioGame = _TrioGame;
}
