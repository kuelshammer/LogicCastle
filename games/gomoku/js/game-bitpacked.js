/**
 * Gomoku BitPackedBoard Integration
 * 
 * High-performance Gomoku game using BitPackedBoard<15,15,2> for AI optimization.
 * Memory efficiency: 57 bytes instead of 225 bytes (75% reduction).
 * Performance benefits for Monte Carlo Tree Search and Alpha-Beta Pruning.
 */

import init, { GomokuGame } from '../../../game_engine/pkg/game_engine.js';

export class GomokuGameBitPacked {
    constructor() {
        this.board = null;
        this.initialized = false;
        
        // Game state tracking
        this.gameHistory = [];
        this.currentMoveIndex = -1;
        
        // Event callbacks
        this.onGameStateChange = null;
        this.onMoveComplete = null;
        this.onGameEnd = null;
    }
    
    /**
     * Initialize the BitPackedBoard WASM engine
     */
    async init() {
        try {
            console.log('🚀 Initializing BitPackedBoard<15,15,2> Gomoku Engine...');
            
            // Initialize WASM module
            await init();
            
            // Create BitPackedBoard instance
            this.board = new GomokuGame();
            this.initialized = true;
            
            console.log('✅ BitPackedBoard Gomoku initialized successfully');
            // Memory usage tracking would be here if available in WASM API
            console.log('✅ BitPackedBoard Gomoku ready for 15x15 gameplay');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize BitPackedBoard Gomoku:', error);
            throw error;
        }
    }
    
    /**
     * Make a move at the specified position
     * @param {number} row - Row (0-14)
     * @param {number} col - Column (0-14)
     * @returns {boolean} True if game is won
     */
    makeMove(row, col) {
        if (!this.initialized) {
            throw new Error('Game not initialized');
        }
        
        try {
            // Make move using BitPackedBoard
            const gameWon = this.board.make_move(row, col);
            
            // Record move in history
            this.gameHistory.push({ row, col, player: this.board.current_player() });
            this.currentMoveIndex++;
            
            // Trigger callbacks
            if (this.onMoveComplete) {
                this.onMoveComplete({ row, col, gameWon });
            }
            
            if (gameWon && this.onGameEnd) {
                this.onGameEnd({ winner: this.board.winner() });
            }
            
            if (this.onGameStateChange) {
                this.onGameStateChange(this.getGameState());
            }
            
            return { success: true, gameWon, row, col };
        } catch (error) {
            console.warn(`Invalid move at (${row}, ${col}):`, error.message);
            return { success: false, reason: error.message };
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
            board: this.getBoardState(),
            currentPlayer: this.board.current_player(),
            moveCount: this.board.move_count(),
            isGameOver: this.isGameOver(),
            winner: this.board.winner(),
            legalMoves: this.getLegalMoves()
        };
    }
    
    /**
     * Get legal moves as array of {row, col} objects
     */
    getLegalMoves() {
        if (!this.initialized) {
            return [];
        }
        
        const moves = [];
        // For Gomoku, any empty position is a legal move
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (this.board.is_valid_move(row, col)) {
                    moves.push({ row, col });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get cell value at position
     * @param {number} row - Row (0-14)
     * @param {number} col - Column (0-14)
     * @returns {number} 0=empty, 1=player1, 2=player2
     */
    getCellValue(row, col) {
        if (!this.initialized) {
            return 0;
        }
        
        return this.board.get_cell(row, col);
    }
    
    /**
     * Check if move is valid (required by UI)
     */
    isValidMove(row, col) {
        return this.isValidPosition(row, col);
    }
    
    /**
     * Check if position is valid
     */
    isValidPosition(row, col) {
        if (!this.initialized) {
            return false;
        }
        
        return this.board.is_valid_move(row, col);
    }
    
    /**
     * Reset game to starting state
     */
    resetGame() {
        if (!this.initialized) {
            return;
        }
        
        this.board.reset();
        this.gameHistory = [];
        this.currentMoveIndex = -1;
        
        if (this.onGameStateChange) {
            this.onGameStateChange(this.getGameState());
        }
        
        console.log('🔄 Game reset to starting position');
    }
    
    /**
     * Start new game (alias for resetGame to match UI expectations)
     */
    newGame() {
        this.resetGame();
    }
    
    /**
     * Undo last move (placeholder - WASM doesn't support undo yet)
     */
    undoMove() {
        // TODO: Implement undo functionality
        // For now, return failure since WASM API doesn't support undo
        console.warn('⚠️ Undo not supported by WASM API yet');
        return { success: false, reason: 'Undo not supported by WASM API' };
    }
    
    /**
     * Get current player (1 or 2)
     */
    getCurrentPlayer() {
        if (!this.initialized) {
            return 1;
        }
        
        return this.board.current_player();
    }
    
    /**
     * Check if game is over
     */
    isGameOver() {
        if (!this.initialized) {
            return false;
        }
        
        // Game is over if there's a winner
        return this.board.winner() !== undefined;
    }
    
    /**
     * Get winner (1, 2, or null)
     */
    getWinner() {
        if (!this.initialized) {
            return null;
        }
        
        const winner = this.board.winner();
        return winner !== undefined ? winner : null;
    }
    
    /**
     * Count stones for a player
     */
    countStones(player) {
        if (!this.initialized) {
            return 0;
        }
        
        // Count stones manually since API doesn't provide this
        let count = 0;
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (this.board.get_cell(row, col) === player) {
                    count++;
                }
            }
        }
        return count;
    }
    
    /**
     * Get move count
     */
    getMoveCount() {
        if (!this.initialized) {
            return 0;
        }
        
        return this.board.move_count();
    }
    
    /**
     * Get game history
     */
    getGameHistory() {
        return [...this.gameHistory];
    }
    
    /**
     * Get memory usage in bytes
     */
    getMemoryUsage() {
        if (!this.initialized) {
            return 0;
        }
        
        // Memory usage not available in current API
        return 57; // Estimated BitPacked size
    }
    
    /**
     * Get current board state as 2D array
     */
    getBoardState() {
        if (!this.initialized) {
            return Array(15).fill().map(() => Array(15).fill(0));
        }
        
        const board = [];
        for (let row = 0; row < 15; row++) {
            const rowArray = [];
            for (let col = 0; col < 15; col++) {
                rowArray.push(this.board.get_cell(row, col));
            }
            board.push(rowArray);
        }
        return board;
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        const memoryUsage = this.getMemoryUsage();
        const naiveMemory = 225; // 15x15 array of bytes
        const savings = ((naiveMemory - memoryUsage) / naiveMemory * 100);
        
        return {
            memoryUsage,
            naiveMemory,
            memorySavings: savings.toFixed(1) + '%',
            boardSize: '15×15',
            bitsPerCell: 2,
            totalCells: 225,
            engineType: 'BitPackedBoard<15,15,2>'
        };
    }
    
    /**
     * Check if current game supports AI analysis
     */
    supportsAdvancedAI() {
        return this.initialized; // BitPackedBoard is optimized for AI
    }
}

export default GomokuGameBitPacked;