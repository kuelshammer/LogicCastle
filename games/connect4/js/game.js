/**
 * Connect4 BitPackedBoard Integration
 * 
 * High-performance Connect4 game using BitPackedBoard<6,7,2> for AI optimization.
 * Memory efficiency: ~12 bytes instead of 84 bytes (85% reduction).
 * Performance benefits for Minimax and Alpha-Beta Pruning.
 * 
 * ULTRATHINK Refactoring: Performance parity with Gomoku goldstandard.
 */

import init, { Connect4Game } from '../../../game_engine/pkg/game_engine.js';

export class Connect4GameBitPacked {
    constructor() {
        this.board = null;
        this.initialized = false;
        
        // Game configuration
        this.rows = 6;
        this.cols = 7;
        
        // Game state tracking
        this.gameHistory = [];
        this.currentMoveIndex = -1;
        
        // Event system
        this.eventListeners = new Map();
        
        // Performance tracking
        this.moveStartTime = null;
        this.totalMoves = 0;
        this.averageMoveTime = 0;
    }
    
    /**
     * Initialize the BitPackedBoard WASM engine
     */
    async init() {
        try {
            console.log('🚀 Initializing BitPackedBoard<6,7,2> Connect4 Engine...');
            
            // Initialize WASM module
            await init();
            
            // Create Connect4Game instance
            this.board = new Connect4Game();
            this.initialized = true;
            
            console.log('✅ BitPackedBoard Connect4 initialized successfully');
            console.log(`📊 Memory usage: ${this.board.memory_usage()} bytes (vs 84 bytes naive implementation)`);
            console.log(`🔢 Memory efficiency: ${((84 - this.board.memory_usage()) / 84 * 100).toFixed(1)}% savings`);
            console.log(`⚡ Performance optimized for ${this.rows}x${this.cols} board`);
            
            this.emit('initialized', { memoryUsage: this.board.memory_usage() });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize BitPackedBoard Connect4:', error);
            throw error;
        }
    }
    
    /**
     * Make a move in the specified column
     * @param {number} col - Column (0-6)
     * @returns {Object} Move result with game state
     */
    makeMove(col) {
        if (!this.initialized) {
            throw new Error('Game not initialized');
        }
        
        this.moveStartTime = performance.now();
        
        try {
            // Validate column
            if (col < 0 || col >= this.cols) {
                throw new Error(`Invalid column: ${col}. Must be 0-${this.cols - 1}`);
            }
            
            // Check if column is full
            if (!this.isValidMove(col)) {
                throw new Error(`Column ${col} is full`);
            }
            
            const currentPlayer = this.board.get_current_player();
            
            // Make move using BitPackedBoard
            const moveResult = this.board.make_move(col);
            
            // Calculate move execution time
            const moveTime = performance.now() - this.moveStartTime;
            this.totalMoves++;
            this.averageMoveTime = (this.averageMoveTime * (this.totalMoves - 1) + moveTime) / this.totalMoves;
            
            // Record move in history
            const move = {
                col,
                player: currentPlayer,
                moveNumber: this.board.get_move_count(),
                timestamp: Date.now(),
                executionTime: moveTime
            };
            
            this.gameHistory.push(move);
            this.currentMoveIndex++;
            
            // Create comprehensive move result
            const result = {
                col,
                player: currentPlayer,
                board: this.getBoard(),
                winner: moveResult.winner,
                isGameOver: moveResult.is_game_over,
                moveNumber: this.board.get_move_count(),
                winningLine: moveResult.winning_line,
                executionTime: moveTime
            };
            
            console.log(`🎮 Move ${result.moveNumber}: Player ${currentPlayer} → Column ${col + 1} (${moveTime.toFixed(2)}ms)`);
            
            // Emit events
            this.emit('move', result);
            this.emit('moveMade', result); // Alias for compatibility
            
            if (result.isGameOver) {
                const gameEndData = {
                    winner: result.winner,
                    winningLine: result.winningLine,
                    totalMoves: this.totalMoves,
                    averageMoveTime: this.averageMoveTime
                };
                
                console.log(`🏁 Game Over! Winner: ${result.winner || 'Draw'}`);
                this.emit('gameOver', gameEndData);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ Move failed in column ${col}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Check if a move is valid in the given column
     * @param {number} col - Column (0-6)
     * @returns {boolean} True if move is valid
     */
    isValidMove(col) {
        if (!this.initialized) return false;
        if (col < 0 || col >= this.cols) return false;
        
        try {
            return this.board.is_valid_move(col);
        } catch (error) {
            return false;
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
            currentPlayer: this.board.get_current_player(),
            moveCount: this.board.get_move_count(),
            isGameOver: this.board.is_game_over(),
            winner: this.board.get_winner(),
            validMoves: this.getValidMoves(),
            memoryUsage: this.board.memory_usage(),
            performanceStats: {
                totalMoves: this.totalMoves,
                averageMoveTime: this.averageMoveTime
            }
        };
    }
    
    /**
     * Get current board as 2D array
     */
    getBoard() {
        if (!this.initialized) return null;
        
        const flatBoard = this.board.get_board();
        const board2D = [];
        
        for (let row = 0; row < this.rows; row++) {
            board2D[row] = [];
            for (let col = 0; col < this.cols; col++) {
                board2D[row][col] = flatBoard[row * this.cols + col];
            }
        }
        
        return board2D;
    }
    
    /**
     * Get cell value at specific position
     * @param {number} row - Row (0-5)
     * @param {number} col - Column (0-6)
     * @returns {number} Cell value (0=empty, 1=player1, 2=player2)
     */
    getCell(row, col) {
        if (!this.initialized) return 0;
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return 0;
        
        try {
            return this.board.get_cell(row, col);
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Get current player
     * @returns {number} Current player (1 or 2)
     */
    getCurrentPlayer() {
        if (!this.initialized) return 1;
        return this.board.get_current_player();
    }
    
    /**
     * Get move count
     * @returns {number} Number of moves made
     */
    getMoveCount() {
        if (!this.initialized) return 0;
        return this.board.get_move_count();
    }
    
    /**
     * Check if game is over
     * @returns {boolean} True if game is over
     */
    isGameOver() {
        if (!this.initialized) return false;
        return this.board.is_game_over();
    }
    
    /**
     * Get game winner
     * @returns {number|null} Winner (1, 2) or null for draw/ongoing
     */
    getWinner() {
        if (!this.initialized) return null;
        return this.board.get_winner();
    }
    
    /**
     * Get all valid moves
     * @returns {number[]} Array of valid column indices
     */
    getValidMoves() {
        if (!this.initialized) return [];
        
        const validMoves = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.isValidMove(col)) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }
    
    /**
     * Reset game to initial state
     */
    newGame() {
        if (!this.initialized) {
            throw new Error('Game not initialized');
        }
        
        try {
            this.board.reset();
            this.gameHistory = [];
            this.currentMoveIndex = -1;
            this.totalMoves = 0;
            this.averageMoveTime = 0;
            
            console.log('🆕 New Connect4 game started');
            this.emit('newGame', this.getGameState());
            
        } catch (error) {
            console.error('❌ Failed to reset game:', error);
            throw error;
        }
    }
    
    /**
     * Check if undo is possible
     * @returns {boolean} True if undo is available
     */
    canUndo() {
        return this.initialized && this.board.can_undo();
    }
    
    /**
     * Undo last move
     * @returns {Object} Undo result
     */
    undoMove() {
        if (!this.initialized) {
            throw new Error('Game not initialized');
        }
        
        if (!this.canUndo()) {
            throw new Error('Cannot undo: no moves to undo');
        }
        
        try {
            const previousState = this.getGameState();
            this.board.undo_move();
            
            // Update history
            if (this.gameHistory.length > 0) {
                this.gameHistory.pop();
                this.currentMoveIndex--;
            }
            
            const undoResult = {
                previousState,
                currentState: this.getGameState()
            };
            
            console.log('↶ Move undone');
            this.emit('undo', undoResult);
            
            return undoResult;
            
        } catch (error) {
            console.error('❌ Failed to undo move:', error);
            throw error;
        }
    }
    
    /**
     * Get AI-optimized board representation for minimax
     */
    getAIBoard() {
        if (!this.initialized) return null;
        return this.board.get_ai_board();
    }
    
    /**
     * Evaluate board position for AI (if implemented in WASM)
     */
    evaluatePosition(player) {
        if (!this.initialized) return 0;
        
        try {
            return this.board.evaluate_position_for_player(player);
        } catch (error) {
            // Fallback to basic evaluation
            return 0;
        }
    }
    
    /**
     * Get threatening moves for player
     */
    getThreateningMoves(player) {
        if (!this.initialized) return [];
        
        try {
            return this.board.get_threatening_moves(player);
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Get winning moves for player
     */
    getWinningMoves(player) {
        if (!this.initialized) return [];
        
        try {
            return this.board.get_winning_moves(player);
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Get blocking moves for player
     */
    getBlockingMoves(player) {
        if (!this.initialized) return [];
        
        try {
            return this.board.get_blocking_moves(player);
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Get AI move suggestion using WASM engine
     * @returns {number|null} Column index (0-6) or null if no move available
     */
    getAIMove() {
        if (!this.initialized) {
            console.warn('⚠️ WASM board not initialized for AI move');
            return null;
        }
        
        try {
            const aiMove = this.board.get_ai_move();
            console.log(`🤖 WASM AI suggests move: ${aiMove}`);
            return aiMove;
        } catch (error) {
            console.error('❌ WASM AI move failed:', error);
            return null;
        }
    }
    
    // ==================== EVENT SYSTEM ====================
    
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event
     * @private
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            for (const callback of listeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Event callback error for '${event}':`, error);
                }
            }
        }
    }
    
    // ==================== PERFORMANCE & DEBUGGING ====================
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            totalMoves: this.totalMoves,
            averageMoveTime: this.averageMoveTime,
            memoryUsage: this.initialized ? this.board.memory_usage() : 0,
            memoryEfficiency: this.initialized ? 
                `${((84 - this.board.memory_usage()) / 84 * 100).toFixed(1)}%` : '0%'
        };
    }
    
    /**
     * Get game history
     */
    getHistory() {
        return [...this.gameHistory]; // Return copy
    }
    
    /**
     * Export game state for analysis
     */
    exportGame() {
        return {
            history: this.getHistory(),
            finalState: this.getGameState(),
            performance: this.getPerformanceStats(),
            timestamp: Date.now()
        };
    }
    
    /**
     * Debug board state
     */
    debugBoard() {
        if (!this.initialized) {
            console.log('🚫 Game not initialized');
            return;
        }
        
        const board = this.getBoard();
        console.log('🎯 Connect4 Board State:');
        console.log('   1 2 3 4 5 6 7');
        
        for (let row = 0; row < this.rows; row++) {
            let rowStr = `${row + 1}: `;
            for (let col = 0; col < this.cols; col++) {
                const cell = board[row][col];
                rowStr += (cell === 0 ? '.' : (cell === 1 ? 'Y' : 'R')) + ' ';
            }
            console.log(rowStr);
        }
        
        console.log(`Current Player: ${this.getCurrentPlayer()}`);
        console.log(`Move Count: ${this.getMoveCount()}`);
        console.log(`Game Over: ${this.isGameOver()}`);
        console.log(`Winner: ${this.getWinner() || 'None'}`);
        console.log(`Valid Moves: [${this.getValidMoves().map(c => c + 1).join(', ')}]`);
    }
    
    /**
     * Destroy game instance and cleanup
     */
    destroy() {
        this.eventListeners.clear();
        this.gameHistory = [];
        this.initialized = false;
        this.board = null;
        
        console.log('🗑️ Connect4GameBitPacked destroyed');
    }
}