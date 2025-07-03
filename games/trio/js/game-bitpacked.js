/**
 * Trio BitPackedBoard Integration
 * 
 * High-performance Trio game using BitPackedBoard<7,7,4> for memory optimization.
 * Memory efficiency: 25 bytes instead of 49 bytes (49% reduction).
 * 4 bits per cell allows values 0-15, perfect for numbers 1-9.
 */

import init, { TrioBoardBitPacked } from '../../../game_engine/pkg/game_engine.js';

export class TrioGameBitPacked {
    constructor(difficulty = 'kinderfreundlich') {
        this.board = null;
        this.initialized = false;
        this.difficulty = difficulty;
        
        // Game state
        this.selectedCells = [];
        this.solutionHistory = [];
        this.currentTarget = 0;
        
        // Event callbacks
        this.onGameStateChange = null;
        this.onSolutionFound = null;
        this.onBoardGenerate = null;
    }
    
    /**
     * Initialize the BitPackedBoard WASM engine
     */
    async init() {
        try {
            console.log('🚀 Initializing BitPackedBoard<7,7,4> Trio Engine...');
            
            // Initialize WASM module
            await init();
            
            // Create BitPackedBoard instance
            const difficultyValue = this.getDifficultyValue(this.difficulty);
            this.board = new TrioBoardBitPacked(difficultyValue);
            this.currentTarget = this.board.get_target_number();
            this.initialized = true;
            
            console.log('✅ BitPackedBoard Trio initialized successfully');
            console.log(`📊 Memory usage: ${this.board.memory_usage()} bytes (vs 49 bytes naive implementation)`);
            console.log(`🔢 Memory efficiency: ${this.getMemoryEfficiency()}% savings`);
            console.log(`🎯 Target number: ${this.currentTarget}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize BitPackedBoard Trio:', error);
            throw error;
        }
    }
    
    /**
     * Convert difficulty string to numeric value
     */
    getDifficultyValue(difficulty) {
        switch (difficulty) {
            case 'kinderfreundlich':
                return 1;
            case 'vollspektrum':
                return 2;
            case 'strategisch':
            case 'analytisch':
                return 3;
            default:
                return 2; // Medium
        }
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        if (!this.initialized) {
            return null;
        }
        
        return {
            board: this.board.get_board(),
            targetNumber: this.board.get_target_number(),
            difficulty: this.board.get_difficulty(),
            memoryUsage: this.board.memory_usage(),
            selectedCells: [...this.selectedCells],
            solutionHistory: [...this.solutionHistory]
        };
    }
    
    /**
     * Get cell value at position
     * @param {number} row - Row (0-6)
     * @param {number} col - Column (0-6)
     * @returns {number} Number value (1-9)
     */
    getCellValue(row, col) {
        if (!this.initialized) {
            return 0;
        }
        
        return this.board.get_cell(row, col);
    }
    
    /**
     * Check if position is valid
     */
    isValidPosition(row, col) {
        if (!this.initialized) {
            return false;
        }
        
        return this.board.is_valid_position(row, col);
    }
    
    /**
     * Get target number
     */
    getTargetNumber() {
        if (!this.initialized) {
            return 0;
        }
        
        return this.board.get_target_number();
    }
    
    /**
     * Check if three positions form a valid solution
     */
    checkSolution(positions) {
        if (!this.initialized || positions.length !== 3) {
            return false;
        }
        
        const [pos1, pos2, pos3] = positions;
        
        return this.board.check_combination(
            pos1.row, pos1.col,
            pos2.row, pos2.col,
            pos3.row, pos3.col
        );
    }
    
    /**
     * Validate solution and get details
     */
    validateSolution(positions) {
        if (!this.checkSolution(positions)) {
            return { isValid: false };
        }
        
        const values = positions.map(pos => this.getCellValue(pos.row, pos.col));
        const [a, b, c] = values;
        const target = this.getTargetNumber();
        
        // Find the correct formula
        const permutations = [
            [a, b, c], [a, c, b], [b, a, c], 
            [b, c, a], [c, a, b], [c, b, a]
        ];
        
        for (const [x, y, z] of permutations) {
            // Try addition: x * y + z = target
            if (x * y + z === target) {
                return {
                    isValid: true,
                    formula: `${x} × ${y} + ${z} = ${target}`,
                    operation: 'add',
                    numbers: [x, y, z]
                };
            }
            // Try subtraction: x * y - z = target
            if (x * y >= z && x * y - z === target) {
                return {
                    isValid: true,
                    formula: `${x} × ${y} - ${z} = ${target}`,
                    operation: 'subtract',
                    numbers: [x, y, z]
                };
            }
        }
        
        return { isValid: false };
    }
    
    /**
     * Add solution to history
     */
    addSolution(positions, formula) {
        const solution = {
            positions: [...positions],
            formula,
            timestamp: Date.now()
        };
        
        this.solutionHistory.push(solution);
        
        if (this.onSolutionFound) {
            this.onSolutionFound(solution);
        }
    }
    
    /**
     * Generate new board with same difficulty
     */
    regenerateBoard() {
        if (!this.initialized) {
            return;
        }
        
        const difficultyValue = this.getDifficultyValue(this.difficulty);
        this.board.regenerate(difficultyValue);
        this.currentTarget = this.board.get_target_number();
        this.selectedCells = [];
        this.solutionHistory = [];
        
        if (this.onBoardGenerate) {
            this.onBoardGenerate({ target: this.currentTarget });
        }
        
        if (this.onGameStateChange) {
            this.onGameStateChange(this.getGameState());
        }
        
        console.log('🔄 Board regenerated with target:', this.currentTarget);
    }
    
    /**
     * Change difficulty and regenerate
     */
    changeDifficulty(newDifficulty) {
        this.difficulty = newDifficulty;
        this.regenerateBoard();
    }
    
    /**
     * Get board as 2D array
     */
    getBoardAs2D() {
        if (!this.initialized) {
            return [];
        }
        
        const board = this.board.get_board();
        const grid = [];
        
        for (let row = 0; row < 7; row++) {
            grid[row] = [];
            for (let col = 0; col < 7; col++) {
                const index = row * 7 + col;
                grid[row][col] = board[index];
            }
        }
        
        return grid;
    }
    
    /**
     * Get memory usage in bytes
     */
    getMemoryUsage() {
        if (!this.initialized) {
            return 0;
        }
        
        return this.board.memory_usage();
    }
    
    /**
     * Get memory efficiency percentage
     */
    getMemoryEfficiency() {
        const memoryUsage = this.getMemoryUsage();
        const naiveMemory = 49; // 7x7 array of bytes
        return ((naiveMemory - memoryUsage) / naiveMemory * 100).toFixed(1);
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        if (!this.initialized) {
            return null;
        }
        
        try {
            const statsJson = this.board.get_performance_stats();
            return JSON.parse(statsJson);
        } catch (error) {
            // Fallback if JSON parsing fails
            const memoryUsage = this.getMemoryUsage();
            return {
                memoryUsage,
                naiveMemory: 49,
                memorySavings: this.getMemoryEfficiency() + '%',
                boardSize: '7×7',
                bitsPerCell: 4,
                engineType: 'BitPackedBoard<7,7,4>'
            };
        }
    }
    
    /**
     * Select/deselect cell
     */
    toggleCellSelection(row, col) {
        if (!this.isValidPosition(row, col)) {
            return false;
        }
        
        const cellIndex = this.selectedCells.findIndex(
            cell => cell.row === row && cell.col === col
        );
        
        if (cellIndex >= 0) {
            // Deselect cell
            this.selectedCells.splice(cellIndex, 1);
        } else {
            // Select cell (max 3 selections)
            if (this.selectedCells.length < 3) {
                this.selectedCells.push({ row, col });
            } else {
                return false; // Max selections reached
            }
        }
        
        if (this.onGameStateChange) {
            this.onGameStateChange(this.getGameState());
        }
        
        return true;
    }
    
    /**
     * Clear all selections
     */
    clearSelections() {
        this.selectedCells = [];
        
        if (this.onGameStateChange) {
            this.onGameStateChange(this.getGameState());
        }
    }
    
    /**
     * Check if cell is selected
     */
    isCellSelected(row, col) {
        return this.selectedCells.some(cell => cell.row === row && cell.col === col);
    }
    
    /**
     * Get number of selected cells
     */
    getSelectionCount() {
        return this.selectedCells.length;
    }
}

export default TrioGameBitPacked;