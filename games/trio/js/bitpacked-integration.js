/**
 * BitPackedBoard Integration for Trio UI
 * 
 * This module integrates the high-performance BitPackedBoard<7,7,4> engine
 * with the existing Trio UI, providing 49% memory savings while maintaining
 * full compatibility with the number puzzle game mechanics.
 */

import { TrioGameBitPacked } from './game-bitpacked.js';

export class TrioBitPackedIntegration {
    constructor(gameInstance) {
        this.originalGame = gameInstance;
        this.bitPackedGame = null;
        this.isEnabled = false;
        this.performanceMode = true;
        
        // Performance tracking
        this.metrics = {
            solutionsFound: 0,
            boardsGenerated: 0,
            totalMemorySaved: 0,
            averageSolutionTime: 0,
            lastOperationTime: 0
        };
        
        this.initializeBitPackedEngine();
    }
    
    /**
     * Initialize the BitPackedBoard engine
     */
    async initializeBitPackedEngine() {
        try {
            console.log('🚀 Initializing Trio BitPackedBoard integration...');
            
            // Get current difficulty from original game
            const currentDifficulty = this.originalGame?.difficulty || 'kinderfreundlich';
            
            this.bitPackedGame = new TrioGameBitPacked(currentDifficulty);
            await this.bitPackedGame.init();
            
            // Set up event handlers
            this.bitPackedGame.onSolutionFound = (solution) => {
                this.handleSolutionFound(solution);
            };
            
            this.bitPackedGame.onBoardGenerate = (data) => {
                this.handleBoardGenerate(data);
            };
            
            this.bitPackedGame.onGameStateChange = (gameState) => {
                this.handleGameStateChange(gameState);
            };
            
            this.isEnabled = true;
            this.updatePerformanceMetrics();
            
            console.log('✅ Trio BitPackedBoard integration enabled');
            console.log('📊 Performance stats:', this.bitPackedGame.getPerformanceStats());
            
        } catch (error) {
            console.error('❌ Failed to initialize Trio BitPackedBoard:', error);
            this.isEnabled = false;
        }
    }
    
    /**
     * Get game state from BitPackedBoard
     */
    getGameState() {
        if (!this.isEnabled) {
            return this.originalGame?.getGameState() || null;
        }
        
        return this.bitPackedGame.getGameState();
    }
    
    /**
     * Get cell value at position
     */
    getCellValue(row, col) {
        if (!this.isEnabled) {
            return this.originalGame?.numberGrid?.[row]?.[col] || 0;
        }
        
        return this.bitPackedGame.getCellValue(row, col);
    }
    
    /**
     * Get target number
     */
    getTargetNumber() {
        if (!this.isEnabled) {
            return this.originalGame?.targetChips?.[0] || 0;
        }
        
        return this.bitPackedGame.getTargetNumber();
    }
    
    /**
     * Get board as 2D array (compatible with existing UI)
     */
    getNumberGrid() {
        if (!this.isEnabled) {
            return this.originalGame?.numberGrid || [];
        }
        
        return this.bitPackedGame.getBoardAs2D();
    }
    
    /**
     * Check if three positions form a valid solution
     */
    checkSolution(positions) {
        if (!this.isEnabled) {
            // Fallback to original game logic
            return this.originalGame?.validateSolution?.(
                positions[0]?.value, positions[1]?.value, positions[2]?.value, 
                this.getTargetNumber()
            )?.isValid || false;
        }
        
        const startTime = performance.now();
        const result = this.bitPackedGame.checkSolution(positions);
        
        // Update performance metrics
        const operationTime = performance.now() - startTime;
        this.updateOperationTime(operationTime);
        
        return result;
    }
    
    /**
     * Validate solution and get detailed result
     */
    validateSolution(positions) {
        if (!this.isEnabled) {
            return { isValid: false };
        }
        
        return this.bitPackedGame.validateSolution(positions);
    }
    
    /**
     * Generate new board
     */
    generateNewBoard(difficulty = null) {
        if (!this.isEnabled) {
            if (this.originalGame?.startNewRound) {
                this.originalGame.startNewRound();
            }
            return;
        }
        
        if (difficulty) {
            this.bitPackedGame.changeDifficulty(difficulty);
        } else {
            this.bitPackedGame.regenerateBoard();
        }
        
        this.metrics.boardsGenerated++;
    }
    
    /**
     * Toggle cell selection
     */
    toggleCellSelection(row, col) {
        if (!this.isEnabled) {
            return false;
        }
        
        return this.bitPackedGame.toggleCellSelection(row, col);
    }
    
    /**
     * Clear all selections
     */
    clearSelections() {
        if (!this.isEnabled) {
            return;
        }
        
        this.bitPackedGame.clearSelections();
    }
    
    /**
     * Check if cell is selected
     */
    isCellSelected(row, col) {
        if (!this.isEnabled) {
            return false;
        }
        
        return this.bitPackedGame.isCellSelected(row, col);
    }
    
    /**
     * Get number of selected cells
     */
    getSelectionCount() {
        if (!this.isEnabled) {
            return 0;
        }
        
        return this.bitPackedGame.getSelectionCount();
    }
    
    /**
     * Handle solution found
     */
    handleSolutionFound(solution) {
        this.metrics.solutionsFound++;
        console.log('✅ BitPackedBoard solution found:', solution.formula);
        
        // Notify original game or UI
        if (this.originalGame?.emit) {
            this.originalGame.emit('solutionFound', solution);
        }
    }
    
    /**
     * Handle board generation
     */
    handleBoardGenerate(data) {
        console.log('🔄 BitPackedBoard generated new board with target:', data.target);
        
        // Notify original game or UI
        if (this.originalGame?.emit) {
            this.originalGame.emit('newRound', data);
        }
    }
    
    /**
     * Handle game state change
     */
    handleGameStateChange(gameState) {
        // Sync with any UI state management
        console.log('🔄 BitPackedBoard game state changed');
    }
    
    /**
     * Update operation time metrics
     */
    updateOperationTime(operationTime) {
        this.metrics.lastOperationTime = operationTime;
        
        // Calculate running average
        const oldAvg = this.metrics.averageSolutionTime;
        const count = this.metrics.solutionsFound || 1;
        this.metrics.averageSolutionTime = (oldAvg * (count - 1) + operationTime) / count;
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        if (!this.isEnabled) {
            return;
        }
        
        const stats = this.bitPackedGame.getPerformanceStats();
        this.metrics.totalMemorySaved = parseFloat(stats.memorySavings.replace('%', ''));
    }
    
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        if (!this.isEnabled) {
            return null;
        }
        
        const gameStats = this.bitPackedGame.getPerformanceStats();
        
        return {
            engineType: gameStats.engineType,
            memoryUsage: gameStats.memoryUsage,
            memorySavings: gameStats.memorySavings,
            solutionsFound: this.metrics.solutionsFound,
            boardsGenerated: this.metrics.boardsGenerated,
            averageSolutionTime: this.metrics.averageSolutionTime.toFixed(2) + 'ms',
            lastOperationTime: this.metrics.lastOperationTime.toFixed(2) + 'ms',
            totalMemorySaved: this.metrics.totalMemorySaved + '%'
        };
    }
    
    /**
     * Check if engine is enabled and working
     */
    isEngineEnabled() {
        return this.isEnabled;
    }
    
    /**
     * Enable/disable performance mode
     */
    setPerformanceMode(enabled) {
        this.performanceMode = enabled;
        console.log(`🔧 Trio performance mode: ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get memory usage comparison
     */
    getMemoryComparison() {
        if (!this.isEnabled) {
            return null;
        }
        
        const memoryUsage = this.bitPackedGame.getMemoryUsage();
        const naiveMemory = 49; // 7x7 array of bytes
        const savings = ((naiveMemory - memoryUsage) / naiveMemory * 100);
        
        return {
            bitPackedMemory: memoryUsage,
            naiveMemory,
            savings: savings.toFixed(1) + '%',
            description: `BitPackedBoard<7,7,4> uses ${memoryUsage} bytes instead of ${naiveMemory} bytes`
        };
    }
    
    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.metrics = {
            solutionsFound: 0,
            boardsGenerated: 0,
            totalMemorySaved: 0,
            averageSolutionTime: 0,
            lastOperationTime: 0
        };
    }
}

export default TrioBitPackedIntegration;