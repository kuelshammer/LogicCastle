/**
 * L-Game BitPacked Engine Integration
 * 
 * High-performance L-Game using 3 separate BitPackedBoard<4,4,1> instances.
 * Following Connect4 goldstandard pattern for 3-layer architecture.
 * Memory efficiency: Separate boards for player1, player2, and neutral pieces.
 * 
 * Architecture: WASM/Rust ↔ JavaScript Engine ↔ UI Components
 */

import init, { LGame } from '../../../game_engine/pkg/game_engine.js';

export class LGameEngineBitPacked {
    constructor() {
        this.game = null;
        this.initialized = false;
        
        // Game configuration
        this.rows = 4;
        this.cols = 4;
        
        // Game state tracking
        this.gameHistory = [];
        this.currentMoveIndex = -1;
        
        // Event system
        this.eventListeners = new Map();
        
        // Performance tracking
        this.moveStartTime = null;
        this.totalMoves = 0;
        this.averageMoveTime = 0;
        
        // L-Game specific state
        this.selectedPiece = null; // 'l-piece' or coordinates for neutral piece
        this.movePhase = 'l-piece'; // 'l-piece' or 'neutral' or 'complete'
        this.pendingMove = null;
    }
    
    /**
     * Initialize the BitPackedBoard WASM L-Game engine
     */
    async init() {
        try {
            console.log('🧩 Initializing BitPacked L-Game Engine...');
            
            // Initialize WASM module
            await init();
            
            // Create LGame instance
            this.game = new LGame();
            this.initialized = true;
            
            console.log('✅ BitPacked L-Game initialized successfully');
            
            // L-Game uses 3 separate BitPackedBoard<4,4,1> instances
            const memoryUsage = this.estimateMemoryUsage();
            const naiveMemoryUsage = 48; // 4 * 4 * 3 bytes for naive implementation
            
            console.log(`📊 Memory usage: ~${memoryUsage} bytes (vs ${naiveMemoryUsage} bytes naive implementation)`);
            
            if (memoryUsage <= naiveMemoryUsage) {
                const efficiency = ((naiveMemoryUsage - memoryUsage) / naiveMemoryUsage * 100).toFixed(1);
                console.log(`🔢 Memory efficiency: ${efficiency}% savings`);
            }
            
            console.log(`⚡ Performance optimized for ${this.rows}x${this.cols} L-Game board`);
            console.log(`🎯 3-Layer Architecture: player1_board + player2_board + neutral_board`);
            
            this.emit('initialized', { memoryUsage });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize BitPacked L-Game:', error);
            throw error;
        }
    }
    
    /**
     * Estimate memory usage for 3 BitPackedBoard<4,4,1> instances
     */
    estimateMemoryUsage() {
        // Each BitPackedBoard<4,4,1> uses: 16 cells / 64 bits per u64 = 1 u64 = 8 bytes
        // Plus metadata overhead ~8 bytes per board
        return 3 * (8 + 8); // 3 boards * (data + metadata)
    }
    
    /**
     * Make L-piece move (mandatory part of turn)
     * @param {number} toRow - Target row (0-3)
     * @param {number} toCol - Target column (0-3)
     * @param {number} orientation - L-piece orientation (0-7)
     * @returns {Object} Move result with game state
     */
    makeMove(toRow, toCol, orientation) {
        if (!this.initialized) {
            throw new Error('Game not initialized');
        }
        
        this.moveStartTime = performance.now();
        
        try {
            // Validate coordinates
            if (toRow < 0 || toRow >= this.rows || toCol < 0 || toCol >= this.cols) {
                throw new Error(`Invalid position: (${toRow}, ${toCol}). Must be within 4x4 grid`);
            }
            
            // Validate orientation
            if (orientation < 0 || orientation > 7) {
                throw new Error(`Invalid orientation: ${orientation}. Must be 0-7`);
            }
            
            const currentPlayer = this.game.current_player;
            
            // Make L-piece move using BitPacked L-Game
            this.game.make_move(toRow, toCol, orientation);
            
            // Calculate move execution time
            const moveTime = performance.now() - this.moveStartTime;
            this.totalMoves++;
            this.averageMoveTime = (this.averageMoveTime * (this.totalMoves - 1) + moveTime) / this.totalMoves;
            
            // Record move in history
            const move = {
                type: 'l-piece',
                toRow,
                toCol,
                orientation,
                player: currentPlayer,
                moveNumber: this.game.move_count,
                timestamp: Date.now(),
                executionTime: moveTime
            };
            
            this.gameHistory.push(move);
            this.currentMoveIndex++;
            
            // Create comprehensive move result
            const result = {
                type: 'l-piece',
                toRow,
                toCol,
                orientation,
                player: currentPlayer,
                board: this.getBoard(),
                currentPlayer: this.game.current_player,
                isGameOver: this.game.game_over,
                winner: this.game.winner,
                moveNumber: this.game.move_count,
                executionTime: moveTime,
                canMoveNeutral: !this.game.game_over // Can move neutral piece if game continues
            };
            
            console.log(`🧩 L-Move ${result.moveNumber}: Player ${this.getPlayerName(currentPlayer)} → (${toRow},${toCol}) orient:${orientation} (${moveTime.toFixed(2)}ms)`);
            
            // Emit events
            this.emit('move', result);
            this.emit('lPieceMove', result);
            
            if (result.isGameOver) {
                const gameEndData = {
                    winner: result.winner,
                    winnerName: this.getPlayerName(result.winner),
                    totalMoves: this.totalMoves,
                    averageMoveTime: this.averageMoveTime
                };
                
                console.log(`🏁 L-Game Over! Winner: ${gameEndData.winnerName}`);
                this.emit('gameOver', gameEndData);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ L-piece move failed to (${toRow},${toCol}) orient:${orientation}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Move neutral piece (optional part of turn)
     * @param {number} fromRow - Source row (0-3)
     * @param {number} fromCol - Source column (0-3)
     * @param {number} toRow - Target row (0-3)
     * @param {number} toCol - Target column (0-3)
     * @returns {Object} Move result
     */
    moveNeutralPiece(fromRow, fromCol, toRow, toCol) {
        if (!this.initialized) {
            throw new Error('Game not initialized');
        }
        
        if (this.game.game_over) {
            throw new Error('Game is over - no neutral moves allowed');
        }
        
        try {
            // Validate coordinates
            if (fromRow < 0 || fromRow >= this.rows || fromCol < 0 || fromCol >= this.cols ||
                toRow < 0 || toRow >= this.rows || toCol < 0 || toCol >= this.cols) {
                throw new Error('Invalid coordinates for neutral piece move');
            }
            
            // Check if there's a neutral piece at source
            if (this.getCell(fromRow, fromCol) !== 3) {
                throw new Error(`No neutral piece at (${fromRow},${fromCol})`);
            }
            
            // Check if target is empty
            if (this.getCell(toRow, toCol) !== 0) {
                throw new Error(`Target position (${toRow},${toCol}) is not empty`);
            }
            
            // Make neutral piece move
            this.game.move_neutral_piece(fromRow, fromCol, toRow, toCol);
            
            const move = {
                type: 'neutral',
                fromRow,
                fromCol,
                toRow,
                toCol,
                timestamp: Date.now()
            };
            
            // Add to last move in history
            if (this.gameHistory.length > 0) {
                this.gameHistory[this.gameHistory.length - 1].neutralMove = move;
            }
            
            const result = {
                type: 'neutral',
                fromRow,
                fromCol,
                toRow,
                toCol,
                board: this.getBoard()
            };
            
            console.log(`🔘 Neutral piece moved: (${fromRow},${fromCol}) → (${toRow},${toCol})`);
            this.emit('neutralMove', result);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Neutral move failed (${fromRow},${fromCol}) → (${toRow},${toCol}):`, error.message);
            throw error;
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
            board: this.getBoard(),
            currentPlayer: this.game.current_player,
            currentPlayerName: this.getPlayerName(this.game.current_player),
            moveCount: this.game.move_count,
            isGameOver: this.game.game_over,
            winner: this.game.winner,
            winnerName: this.getPlayerName(this.game.winner),
            validMovesCount: this.game.get_valid_moves_count(),
            memoryUsage: this.estimateMemoryUsage(),
            performanceStats: {
                totalMoves: this.totalMoves,
                averageMoveTime: this.averageMoveTime
            }
        };
    }
    
    /**
     * Get current board as 2D array
     * @returns {number[][]} Board state (0=empty, 1=player1, 2=player2, 3=neutral)
     */
    getBoard() {
        if (!this.initialized) return null;
        
        const flatBoard = this.game.get_board_state();
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
     * @param {number} row - Row (0-3)
     * @param {number} col - Column (0-3)
     * @returns {number} Cell value (0=empty, 1=player1, 2=player2, 3=neutral)
     */
    getCell(row, col) {
        if (!this.initialized) return 0;
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return 0;
        
        try {
            return this.game.get_cell(row, col);
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Get current player
     * @returns {number} Current player (1=Yellow, 2=Red)
     */
    getCurrentPlayer() {
        if (!this.initialized) return 1;
        return this.game.current_player;
    }
    
    /**
     * Get player name for display
     * @param {number} player - Player number
     * @returns {string} Player name
     */
    getPlayerName(player) {
        if (!player) return 'None';
        return player === 1 ? 'Gelb' : 'Rot';
    }
    
    /**
     * Get move count
     * @returns {number} Number of moves made
     */
    getMoveCount() {
        if (!this.initialized) return 0;
        return this.game.move_count;
    }
    
    /**
     * Check if game is over
     * @returns {boolean} True if game is over
     */
    isGameOver() {
        if (!this.initialized) return false;
        return this.game.game_over;
    }
    
    /**
     * Get game winner
     * @returns {number|null} Winner (1, 2) or null for ongoing
     */
    getWinner() {
        if (!this.initialized) return null;
        return this.game.winner;
    }
    
    /**
     * Get number of valid L-piece moves for current player
     * @returns {number} Number of valid moves
     */
    getValidMovesCount() {
        if (!this.initialized) return 0;
        return this.game.get_valid_moves_count();
    }
    
    /**
     * Check if current player is blocked (cannot move L-piece)
     * @returns {boolean} True if player is blocked
     */
    isCurrentPlayerBlocked() {
        if (!this.initialized) return false;
        return this.game.is_current_player_blocked();
    }
    
    /**
     * Reset game to initial state
     */
    newGame() {
        if (!this.initialized) {
            throw new Error('Game not initialized');
        }
        
        try {
            this.game.reset();
            this.gameHistory = [];
            this.currentMoveIndex = -1;
            this.totalMoves = 0;
            this.averageMoveTime = 0;
            this.selectedPiece = null;
            this.movePhase = 'l-piece';
            this.pendingMove = null;
            
            console.log('🆕 New L-Game started');
            this.emit('newGame', this.getGameState());
            
        } catch (error) {
            console.error('❌ Failed to reset L-Game:', error);
            throw error;
        }
    }
    
    /**
     * Check if neutral piece can be moved from position
     * @param {number} row - Row (0-3)
     * @param {number} col - Column (0-3)
     * @returns {boolean} True if neutral piece can be moved
     */
    canMoveNeutralFrom(row, col) {
        if (!this.initialized || this.game.game_over) return false;
        return this.getCell(row, col) === 3; // Neutral piece
    }
    
    /**
     * Check if position is empty for neutral piece placement
     * @param {number} row - Row (0-3)
     * @param {number} col - Column (0-3)
     * @returns {boolean} True if position is empty
     */
    canPlaceNeutralAt(row, col) {
        if (!this.initialized || this.game.game_over) return false;
        return this.getCell(row, col) === 0; // Empty
    }
    
    /**
     * Find all neutral pieces on board
     * @returns {Array} Array of {row, col} coordinates
     */
    getNeutralPieces() {
        if (!this.initialized) return [];
        
        const neutralPieces = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.getCell(row, col) === 3) {
                    neutralPieces.push({ row, col });
                }
            }
        }
        return neutralPieces;
    }
    
    /**
     * Find all empty positions for neutral piece moves
     * @returns {Array} Array of {row, col} coordinates
     */
    getEmptyPositions() {
        if (!this.initialized) return [];
        
        const emptyPositions = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.getCell(row, col) === 0) {
                    emptyPositions.push({ row, col });
                }
            }
        }
        return emptyPositions;
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
        const memoryUsage = this.estimateMemoryUsage();
        const naiveMemoryUsage = 48; // 4 * 4 * 3 bytes
        
        let memoryEfficiency = '0%';
        if (this.initialized) {
            if (memoryUsage <= naiveMemoryUsage) {
                const efficiency = ((naiveMemoryUsage - memoryUsage) / naiveMemoryUsage * 100).toFixed(1);
                memoryEfficiency = `${efficiency}% savings`;
            } else {
                const overhead = ((memoryUsage - naiveMemoryUsage) / naiveMemoryUsage * 100).toFixed(1);
                memoryEfficiency = `${overhead}% overhead`;
            }
        }
        
        return {
            totalMoves: this.totalMoves,
            averageMoveTime: this.averageMoveTime,
            memoryUsage: memoryUsage,
            memoryEfficiency: memoryEfficiency,
            architecture: '3x BitPackedBoard<4,4,1>'
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
            console.log('🚫 L-Game not initialized');
            return;
        }
        
        const board = this.getBoard();
        console.log('🧩 L-Game Board State:');
        console.log('   1 2 3 4');
        
        for (let row = 0; row < this.rows; row++) {
            let rowStr = `${row + 1}: `;
            for (let col = 0; col < this.cols; col++) {
                const cell = board[row][col];
                let symbol = '.';
                if (cell === 1) symbol = 'G'; // Gelb (Yellow)
                else if (cell === 2) symbol = 'R'; // Rot (Red)
                else if (cell === 3) symbol = 'N'; // Neutral
                rowStr += symbol + ' ';
            }
            console.log(rowStr);
        }
        
        console.log(`Current Player: ${this.getPlayerName(this.getCurrentPlayer())}`);
        console.log(`Move Count: ${this.getMoveCount()}`);
        console.log(`Game Over: ${this.isGameOver()}`);
        console.log(`Winner: ${this.getPlayerName(this.getWinner())}`);
        console.log(`Valid L-Moves: ${this.getValidMovesCount()}`);
        console.log(`Blocked: ${this.isCurrentPlayerBlocked()}`);
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        if (!this.initialized) return null;
        
        return {
            gameState: this.getGameState(),
            performance: this.getPerformanceStats(),
            neutralPieces: this.getNeutralPieces(),
            emptyPositions: this.getEmptyPositions(),
            history: this.getHistory()
        };
    }
    
    /**
     * Destroy game instance and cleanup
     */
    destroy() {
        this.eventListeners.clear();
        this.gameHistory = [];
        this.initialized = false;
        this.game = null;
        this.selectedPiece = null;
        this.pendingMove = null;
        
        console.log('🗑️ LGameEngineBitPacked destroyed');
    }
}