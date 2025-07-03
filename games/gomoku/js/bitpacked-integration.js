/**
 * BitPackedBoard Integration for Gomoku UI
 * 
 * This module integrates the high-performance BitPackedBoard<15,15,2> engine
 * with the existing Gomoku UI, providing seamless performance improvements
 * for AI algorithms while maintaining full UI compatibility.
 */

import { GomokuGameBitPacked } from './game-bitpacked.js';

export class BitPackedGomokuIntegration {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.bitPackedGame = null;
        this.isEnabled = false;
        this.performanceMode = true; // Always use BitPackedBoard for performance
        
        // Performance tracking
        this.metrics = {
            movesProcessed: 0,
            totalMemorySaved: 0,
            averageMoveTime: 0,
            lastMoveTime: 0
        };
        
        this.initializeBitPackedEngine();
    }
    
    /**
     * Initialize the BitPackedBoard engine
     */
    async initializeBitPackedEngine() {
        try {
            console.log('🚀 Initializing BitPackedBoard integration...');
            
            this.bitPackedGame = new GomokuGameBitPacked();
            await this.bitPackedGame.init();
            
            // Set up event handlers
            this.bitPackedGame.onMoveComplete = (moveData) => {
                this.handleMoveComplete(moveData);
            };
            
            this.bitPackedGame.onGameStateChange = (gameState) => {
                this.handleGameStateChange(gameState);
            };
            
            this.bitPackedGame.onGameEnd = (endData) => {
                this.handleGameEnd(endData);
            };
            
            this.isEnabled = true;
            this.updateUI();
            
            console.log('✅ BitPackedBoard integration enabled');
            console.log('📊 Performance stats:', this.bitPackedGame.getPerformanceStats());
            
        } catch (error) {
            console.error('❌ Failed to initialize BitPackedBoard:', error);
            this.isEnabled = false;
        }
    }
    
    /**
     * Make a move using BitPackedBoard
     */
    async makeMove(row, col) {
        if (!this.isEnabled) {
            throw new Error('BitPackedBoard not initialized');
        }
        
        const startTime = performance.now();
        
        try {
            const gameWon = this.bitPackedGame.makeMove(row, col);
            
            // Update performance metrics
            const moveTime = performance.now() - startTime;
            this.updatePerformanceMetrics(moveTime);
            
            return {
                success: true,
                gameWon,
                moveTime,
                gameState: this.bitPackedGame.getGameState()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get game state from BitPackedBoard
     */
    getGameState() {
        if (!this.isEnabled) {
            return null;
        }
        
        return this.bitPackedGame.getGameState();
    }
    
    /**
     * Reset game
     */
    resetGame() {
        if (!this.isEnabled) {
            return;
        }
        
        this.bitPackedGame.resetGame();
        this.resetMetrics();
        this.updateUI();
    }
    
    /**
     * Get cell value at position
     */
    getCellValue(row, col) {
        if (!this.isEnabled) {
            return 0;
        }
        
        return this.bitPackedGame.getCellValue(row, col);
    }
    
    /**
     * Check if position is valid
     */
    isValidPosition(row, col) {
        if (!this.isEnabled) {
            return true; // Default to valid
        }
        
        return this.bitPackedGame.isValidPosition(row, col);
    }
    
    /**
     * Get legal moves
     */
    getLegalMoves() {
        if (!this.isEnabled) {
            return [];
        }
        
        return this.bitPackedGame.getLegalMoves();
    }
    
    /**
     * Get current player
     */
    getCurrentPlayer() {
        if (!this.isEnabled) {
            return 1;
        }
        
        return this.bitPackedGame.getCurrentPlayer();
    }
    
    /**
     * Check if game is over
     */
    isGameOver() {
        if (!this.isEnabled) {
            return false;
        }
        
        return this.bitPackedGame.isGameOver();
    }
    
    /**
     * Get winner
     */
    getWinner() {
        if (!this.isEnabled) {
            return null;
        }
        
        return this.bitPackedGame.getWinner();
    }
    
    /**
     * Handle move completion
     */
    handleMoveComplete(moveData) {
        // Update UI with move result
        if (this.gameUI && this.gameUI.updateGameDisplay) {
            this.gameUI.updateGameDisplay();
        }
        
        console.log('✅ Move completed:', moveData);
    }
    
    /**
     * Handle game state change
     */
    handleGameStateChange(gameState) {
        // Sync UI with new game state
        if (this.gameUI && this.gameUI.updateGameDisplay) {
            this.gameUI.updateGameDisplay();
        }
        
        this.updatePerformanceDisplay(gameState);
    }
    
    /**
     * Handle game end
     */
    handleGameEnd(endData) {
        console.log('🎉 Game ended:', endData);
        
        if (this.gameUI && this.gameUI.showGameEndMessage) {
            this.gameUI.showGameEndMessage(endData.winner);
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(moveTime) {
        this.metrics.movesProcessed++;
        this.metrics.lastMoveTime = moveTime;
        
        // Calculate running average
        const oldAvg = this.metrics.averageMoveTime;
        const count = this.metrics.movesProcessed;
        this.metrics.averageMoveTime = (oldAvg * (count - 1) + moveTime) / count;
        
        // Calculate memory savings
        const stats = this.bitPackedGame.getPerformanceStats();
        this.metrics.totalMemorySaved = parseFloat(stats.memorySavings.replace('%', ''));
    }
    
    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.metrics = {
            movesProcessed: 0,
            totalMemorySaved: 0,
            averageMoveTime: 0,
            lastMoveTime: 0
        };
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        this.updateStatusIndicator();
        this.updatePerformanceDisplay();
    }
    
    /**
     * Update status indicator
     */
    updateStatusIndicator() {
        const statusElement = document.getElementById('bitpacked-status');
        if (statusElement) {
            if (this.isEnabled) {
                statusElement.textContent = 'BitPackedBoard Active';
                statusElement.className = 'font-bold text-green-600';
            } else {
                statusElement.textContent = 'Standard Board';
                statusElement.className = 'font-bold text-blue-600';
            }
        }
    }
    
    /**
     * Update performance display
     */
    updatePerformanceDisplay(gameState = null) {
        // Update memory usage
        const memoryElement = document.getElementById('memory-usage');
        if (memoryElement && this.isEnabled) {
            const stats = this.bitPackedGame.getPerformanceStats();
            memoryElement.textContent = `${stats.memoryUsage} bytes`;
        }
        
        // Update memory savings
        const savingsElement = document.getElementById('memory-savings');
        if (savingsElement && this.isEnabled) {
            const stats = this.bitPackedGame.getPerformanceStats();
            savingsElement.textContent = stats.memorySavings;
        }
        
        // Update move count
        const moveCountElement = document.getElementById('move-count');
        if (moveCountElement && this.isEnabled) {
            moveCountElement.textContent = this.bitPackedGame.getMoveCount();
        }
        
        // Update performance metrics
        const avgTimeElement = document.getElementById('avg-move-time');
        if (avgTimeElement) {
            avgTimeElement.textContent = `${this.metrics.averageMoveTime.toFixed(2)}ms`;
        }
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
            movesProcessed: this.metrics.movesProcessed,
            averageMoveTime: this.metrics.averageMoveTime.toFixed(2) + 'ms',
            lastMoveTime: this.metrics.lastMoveTime.toFixed(2) + 'ms',
            aiOptimized: true
        };
    }
    
    /**
     * Check if engine supports advanced AI
     */
    supportsAdvancedAI() {
        return this.isEnabled && this.bitPackedGame.supportsAdvancedAI();
    }
    
    /**
     * Enable/disable performance mode
     */
    setPerformanceMode(enabled) {
        this.performanceMode = enabled;
        console.log(`🔧 Performance mode: ${enabled ? 'enabled' : 'disabled'}`);
    }
}

export default BitPackedGomokuIntegration;