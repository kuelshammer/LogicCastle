/**
 * TrioGameBitPacked - JavaScript Wrapper for WASM Trio Engine
 * 
 * Follows Connect4's 3-layer architecture pattern:
 * - Layer 3: UI/Frontend -> TrioUI
 * - Layer 2: Game Logic -> TrioGameBitPacked (this file)
 * - Layer 1: WASM/Rust -> TrioGame + BitPackedBoard<7,7,4>
 * 
 * Features:
 * - BitPackedBoard<7,7,4> for 49% memory efficiency
 * - Trio calculation: a×b+c or a×b-c = target
 * - 7×7 board with numbers 1-9
 * - No AI needed - pure puzzle game
 * - Difficulty levels: kinderfreundlich, vollspektrum, strategisch, analytisch
 */

import init, { TrioGame, difficulty_to_number, difficulty_to_string } from '../../../game_engine/pkg/game_engine.js';

export class TrioGameBitPacked {
    constructor(difficulty = 'kinderfreundlich') {
        this.engine = null;
        this.initialized = false;
        
        // Game state
        this.difficulty = difficulty;
        this.difficultyNumber = this.mapDifficultyToNumber(difficulty);
        this.currentTarget = 0;
        this.selectedPositions = [];
        this.solutionHistory = [];
        this.gameActive = false;
        
        // Statistics
        this.solutionsFound = 0;
        this.totalMoves = 0;
        
        // Event callbacks
        this.onGameStateChange = null;
        this.onSolutionFound = null;
        this.onBoardGenerated = null;
        this.onError = null;
    }
    
    /**
     * Initialize the WASM Trio engine
     */
    async init() {
        try {
            console.log('🚀 Initializing TrioGame BitPacked Engine...');
            
            // Initialize WASM module
            await init();
            
            // Create TrioGame instance
            this.engine = new TrioGame(this.difficultyNumber);
            this.currentTarget = this.engine.get_target_number();
            this.initialized = true;
            this.gameActive = true;
            
            console.log('✅ TrioGame BitPacked initialized successfully');
            console.log(`📊 Memory usage: ${this.engine.memory_usage()} bytes`);
            console.log(`🎯 Memory efficiency: ${this.engine.memory_efficiency().toFixed(1)}% savings`);
            console.log(`🎯 Target number: ${this.currentTarget}`);
            console.log(`🎮 Difficulty: ${this.difficulty} (${this.difficultyNumber})`);
            
            // Notify listeners
            this.triggerCallback('onBoardGenerated', {
                target: this.currentTarget,
                difficulty: this.difficulty,
                board: this.getBoard()
            });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize TrioGame:', error);
            this.triggerCallback('onError', { error: error.message });
            return false;
        }
    }
    
    /**
     * Get number at specific board position
     */
    getNumber(row, col) {
        if (!this.initialized) {
            console.warn('⚠️ TrioGame not initialized');
            return 0;
        }
        
        if (row < 0 || row >= 7 || col < 0 || col >= 7) {
            console.warn(`⚠️ Invalid position: (${row}, ${col})`);
            return 0;
        }
        
        return this.engine.get_number(row, col);
    }
    
    /**
     * Get entire board as 7×7 array
     */
    getBoard() {
        if (!this.initialized) {
            console.warn('⚠️ TrioGame not initialized');
            return Array(7).fill().map(() => Array(7).fill(0));
        }
        
        const board = [];
        for (let row = 0; row < 7; row++) {
            board[row] = [];
            for (let col = 0; col < 7; col++) {
                board[row][col] = this.engine.get_number(row, col);
            }
        }
        return board;
    }
    
    /**
     * Get board as flat array (for UI convenience)
     */
    getBoardFlat() {
        if (!this.initialized) {
            console.warn('⚠️ TrioGame not initialized');
            return Array(49).fill(0);
        }
        
        return this.engine.get_board_array();
    }
    
    /**
     * Get current target number
     */
    getTargetNumber() {
        if (!this.initialized) {
            console.warn('⚠️ TrioGame not initialized');
            return 0;
        }
        
        return this.currentTarget;
    }
    
    /**
     * Validate a trio combination
     * @param {Array} positions - Array of {row, col} objects
     * @returns {Object} - {valid: boolean, result: number, calculation: string}
     */
    validateTrio(positions) {
        if (!this.initialized) {
            console.warn('⚠️ TrioGame not initialized');
            return { valid: false, result: -1, calculation: '' };
        }
        
        if (!positions || positions.length !== 3) {
            console.warn('⚠️ Invalid trio: need exactly 3 positions');
            return { valid: false, result: -1, calculation: '' };
        }
        
        const [pos1, pos2, pos3] = positions;
        
        // Validate positions
        for (let i = 0; i < 3; i++) {
            const pos = positions[i];
            if (!pos || pos.row < 0 || pos.row >= 7 || pos.col < 0 || pos.col >= 7) {
                console.warn(`⚠️ Invalid position ${i}: (${pos?.row}, ${pos?.col})`);
                return { valid: false, result: -1, calculation: '' };
            }
        }
        
        // Check for duplicate positions
        for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 3; j++) {
                if (positions[i].row === positions[j].row && positions[i].col === positions[j].col) {
                    console.warn(`⚠️ Duplicate positions: ${i} and ${j}`);
                    return { valid: false, result: -1, calculation: '' };
                }
            }
        }
        
        // Validate with WASM engine
        const result = this.engine.validate_trio(
            pos1.row, pos1.col,
            pos2.row, pos2.col,
            pos3.row, pos3.col
        );
        
        const isValid = result !== -1;
        
        // Build calculation string for display
        let calculation = '';
        if (isValid) {
            const a = this.engine.get_number(pos1.row, pos1.col);
            const b = this.engine.get_number(pos2.row, pos2.col);
            const c = this.engine.get_number(pos3.row, pos3.col);
            
            // Try both operations to see which one worked
            const addResult = a * b + c;
            const subResult = a * b - c;
            
            if (addResult === this.currentTarget) {
                calculation = `${a} × ${b} + ${c} = ${addResult}`;
            } else if (subResult === this.currentTarget) {
                calculation = `${a} × ${b} - ${c} = ${subResult}`;
            } else {
                calculation = `${a} × ${b} ± ${c} = ${result}`;
            }
        }
        
        return {
            valid: isValid,
            result: result,
            calculation: calculation
        };
    }
    
    /**
     * Submit a trio solution
     */
    submitTrio(positions) {
        const validation = this.validateTrio(positions);
        
        if (validation.valid) {
            // Record solution
            this.solutionHistory.push({
                positions: positions.map(p => ({...p})),
                result: validation.result,
                calculation: validation.calculation,
                timestamp: Date.now(),
                moveNumber: this.totalMoves + 1
            });
            
            this.solutionsFound++;
            this.totalMoves++;
            
            console.log(`✅ Solution found: ${validation.calculation}`);
            
            // Notify listeners
            this.triggerCallback('onSolutionFound', {
                validation: validation,
                solutionsFound: this.solutionsFound,
                totalMoves: this.totalMoves
            });
            
            this.triggerCallback('onGameStateChange', {
                type: 'solution_found',
                data: validation
            });
            
            return true;
        } else {
            console.log(`❌ Invalid trio attempt`);
            this.totalMoves++;
            
            this.triggerCallback('onGameStateChange', {
                type: 'invalid_attempt',
                data: validation
            });
            
            return false;
        }
    }
    
    /**
     * Generate new board with specified difficulty
     */
    generateNewBoard(difficulty) {
        if (!this.initialized) {
            console.warn('⚠️ TrioGame not initialized');
            return false;
        }
        
        try {
            this.difficulty = difficulty || this.difficulty;
            this.difficultyNumber = this.mapDifficultyToNumber(this.difficulty);
            
            // Generate new board
            this.currentTarget = this.engine.generate_new_board(this.difficultyNumber);
            
            // Reset game state
            this.selectedPositions = [];
            this.solutionHistory = [];
            this.solutionsFound = 0;
            this.totalMoves = 0;
            this.gameActive = true;
            
            console.log(`🎲 New board generated: Target ${this.currentTarget}, Difficulty ${this.difficulty}`);
            
            // Notify listeners
            this.triggerCallback('onBoardGenerated', {
                target: this.currentTarget,
                difficulty: this.difficulty,
                board: this.getBoard()
            });
            
            this.triggerCallback('onGameStateChange', {
                type: 'new_board',
                data: {
                    target: this.currentTarget,
                    difficulty: this.difficulty
                }
            });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to generate new board:', error);
            this.triggerCallback('onError', { error: error.message });
            return false;
        }
    }
    
    /**
     * Find all possible solutions on current board
     */
    findAllSolutions() {
        if (!this.initialized) {
            console.warn('⚠️ TrioGame not initialized');
            return [];
        }
        
        try {
            console.log('🔍 Finding all solutions...');
            const solutionArray = this.engine.find_all_solutions();
            
            // Convert flat array to solution objects
            const solutions = [];
            for (let i = 0; i < solutionArray.length; i += 7) {
                const solution = {
                    positions: [
                        { row: solutionArray[i], col: solutionArray[i + 1] },
                        { row: solutionArray[i + 2], col: solutionArray[i + 3] },
                        { row: solutionArray[i + 4], col: solutionArray[i + 5] }
                    ],
                    result: solutionArray[i + 6]
                };
                
                // Add calculation string
                const validation = this.validateTrio(solution.positions);
                solution.calculation = validation.calculation;
                
                solutions.push(solution);
            }
            
            console.log(`✅ Found ${solutions.length} solutions`);
            return solutions;
        } catch (error) {
            console.error('❌ Failed to find solutions:', error);
            this.triggerCallback('onError', { error: error.message });
            return [];
        }
    }
    
    /**
     * Get game statistics
     */
    getGameStats() {
        return {
            difficulty: this.difficulty,
            difficultyNumber: this.difficultyNumber,
            target: this.currentTarget,
            solutionsFound: this.solutionsFound,
            totalMoves: this.totalMoves,
            gameActive: this.gameActive,
            memoryUsage: this.initialized ? this.engine.memory_usage() : 0,
            memoryEfficiency: this.initialized ? this.engine.memory_efficiency() : 0
        };
    }
    
    /**
     * Reset game state
     */
    resetGame() {
        this.selectedPositions = [];
        this.solutionHistory = [];
        this.solutionsFound = 0;
        this.totalMoves = 0;
        this.gameActive = true;
        
        this.triggerCallback('onGameStateChange', {
            type: 'reset',
            data: this.getGameStats()
        });
    }
    
    /**
     * Map difficulty string to number
     */
    mapDifficultyToNumber(difficulty) {
        switch (difficulty.toLowerCase()) {
            case 'kinderfreundlich':
                return 1;
            case 'vollspektrum':
                return 2;
            case 'strategisch':
                return 3;
            case 'analytisch':
                return 4;
            default:
                console.warn(`⚠️ Unknown difficulty: ${difficulty}, defaulting to vollspektrum`);
                return 2;
        }
    }
    
    /**
     * Map difficulty number to string
     */
    mapDifficultyToString(difficultyNumber) {
        switch (difficultyNumber) {
            case 1:
                return 'kinderfreundlich';
            case 2:
                return 'vollspektrum';
            case 3:
                return 'strategisch';
            case 4:
                return 'analytisch';
            default:
                console.warn(`⚠️ Unknown difficulty number: ${difficultyNumber}, defaulting to vollspektrum`);
                return 'vollspektrum';
        }
    }
    
    /**
     * Trigger event callback if defined
     */
    triggerCallback(callbackName, data) {
        if (this[callbackName] && typeof this[callbackName] === 'function') {
            try {
                this[callbackName](data);
            } catch (error) {
                console.error(`❌ Error in ${callbackName} callback:`, error);
            }
        }
    }
    
    /**
     * Set event callback
     */
    setCallback(callbackName, callback) {
        if (typeof callback === 'function') {
            this[callbackName] = callback;
        } else {
            console.warn(`⚠️ Invalid callback for ${callbackName}`);
        }
    }
    
    /**
     * Get current difficulty
     */
    getCurrentDifficulty() {
        return this.difficulty;
    }
    
    /**
     * Check if game is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * Check if game is active
     */
    isGameActive() {
        return this.gameActive;
    }
    
    /**
     * Get solution history
     */
    getSolutionHistory() {
        return [...this.solutionHistory];
    }
    
    /**
     * Get memory usage information
     */
    getMemoryInfo() {
        if (!this.initialized) {
            return { usage: 0, efficiency: 0 };
        }
        
        return {
            usage: this.engine.memory_usage(),
            efficiency: this.engine.memory_efficiency()
        };
    }
}