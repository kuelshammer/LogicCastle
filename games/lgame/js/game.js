/**
 * L-Game JavaScript ES6 Module
 * 
 * Edward de Bono's L-Game implementation using Rust/WASM core engine.
 * This module provides a clean JavaScript wrapper around the WASM LGame implementation.
 * 
 * Architecture: JavaScript UI layer + Rust/WASM core logic
 * Based on ULTRATHINK principles: pragmatic over academic optimizations
 */

import { CoordUtils } from '../../../assets/js/coord-utils.js';

export class LGameJS {
    constructor() {
        this.wasmGame = null;
        this.initialized = false;
        this.gameStateCallbacks = [];
        this.moveHistory = [];
        
        // L-Game specific constants
        this.BOARD_SIZE = 4;
        this.PLAYERS = {
            PLAYER1: 'Player 1',
            PLAYER2: 'Player 2'
        };
        
        // Game state
        this.currentPlayer = this.PLAYERS.PLAYER1;
        this.gameOver = false;
        this.winner = null;
        this.selectedPiece = null;
        this.availableMoves = [];
    }
    
    /**
     * Initialize the L-Game with WASM engine
     * @param {Object} wasmModule - Initialized WASM module
     * @returns {Promise<void>}
     */
    async initialize(wasmModule) {
        if (!wasmModule || !wasmModule.LGame) {
            throw new Error('Invalid WASM module: LGame class not found');
        }
        
        try {
            // Create new L-Game instance
            this.wasmGame = wasmModule.LGame.new();
            this.initialized = true;
            
            // Sync initial state
            await this.syncGameState();
            
            console.log('✅ L-Game initialized successfully');
            this.notifyStateChange('initialized');
            
        } catch (error) {
            console.error('❌ L-Game initialization failed:', error);
            throw new Error(`L-Game initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Sync game state from WASM engine
     * @returns {Promise<void>}
     */
    async syncGameState() {
        if (!this.initialized) {
            throw new Error('L-Game not initialized');
        }
        
        try {
            // Get current game state from WASM
            const wasmPlayer = this.wasmGame.getCurrentPlayer();
            const wasmGameOver = this.wasmGame.isGameOver();
            const wasmWinner = this.wasmGame.getWinner();
            
            // Map WASM player enum to JavaScript
            this.currentPlayer = wasmPlayer === 0 ? this.PLAYERS.PLAYER1 : this.PLAYERS.PLAYER2;
            this.gameOver = wasmGameOver;
            this.winner = wasmWinner ? (wasmWinner === 0 ? this.PLAYERS.PLAYER1 : this.PLAYERS.PLAYER2) : null;
            
            // Update available moves
            this.availableMoves = this.getLegalMoves();
            
        } catch (error) {
            console.error('❌ Failed to sync game state:', error);
            throw error;
        }
    }
    
    /**
     * Get current board state
     * @returns {Array<Array<number>>} 2D board array
     */
    getBoard() {
        if (!this.initialized) {
            throw new Error('L-Game not initialized');
        }
        
        const flatBoard = this.wasmGame.getBoard();
        const board = [];
        
        // Convert flat array to 2D array (4x4)
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            board[row] = [];
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const index = CoordUtils.gridToIndex(row, col, this.BOARD_SIZE);
                board[row][col] = flatBoard[index];
            }
        }
        
        return board;
    }
    
    /**
     * Get legal moves for current player
     * @returns {Array<Object>} Array of move objects
     */
    getLegalMoves() {
        if (!this.initialized) {
            throw new Error('L-Game not initialized');
        }
        
        const wasmMoves = this.wasmGame.getLegalMoves();
        const moves = [];
        
        // Convert WASM moves to JavaScript objects
        for (let i = 0; i < wasmMoves.length; i++) {
            const wasmMove = wasmMoves[i];
            const move = {
                lPiece: {
                    anchorRow: wasmMove.lPieceAnchorRow,
                    anchorCol: wasmMove.lPieceAnchorCol,
                    orientation: wasmMove.lPieceOrientation
                },
                neutralPiece: null
            };
            
            // Add neutral piece move if present
            if (wasmMove.neutralPieceId !== undefined) {
                move.neutralPiece = {
                    id: wasmMove.neutralPieceId,
                    newRow: wasmMove.neutralNewRow,
                    newCol: wasmMove.neutralNewCol
                };
            }
            
            moves.push(move);
        }
        
        return moves;
    }
    
    /**
     * Make a move in the game
     * @param {Object} move - Move object with L-piece and optional neutral piece
     * @returns {Promise<boolean>} True if move was successful
     */
    async makeMove(move) {
        if (!this.initialized) {
            throw new Error('L-Game not initialized');
        }
        
        if (this.gameOver) {
            throw new Error('Game is already over');
        }
        
        try {
            // Validate move format
            if (!move || !move.lPiece) {
                throw new Error('Invalid move: L-piece move required');
            }
            
            const { lPiece, neutralPiece } = move;
            
            // Prepare move parameters
            const neutralId = neutralPiece ? neutralPiece.id : null;
            const neutralRow = neutralPiece ? neutralPiece.newRow : null;
            const neutralCol = neutralPiece ? neutralPiece.newCol : null;
            
            // Execute move in WASM
            await this.wasmGame.makeMove(
                lPiece.anchorRow,
                lPiece.anchorCol,
                lPiece.orientation,
                neutralId,
                neutralRow,
                neutralCol
            );
            
            // Add to move history
            this.moveHistory.push({
                player: this.currentPlayer,
                move: move,
                timestamp: Date.now()
            });
            
            // Sync state after move
            await this.syncGameState();
            
            console.log(`✅ Move executed: ${this.currentPlayer}`, move);
            this.notifyStateChange('move_made');
            
            return true;
            
        } catch (error) {
            console.error('❌ Move failed:', error);
            throw new Error(`Move failed: ${error.message}`);
        }
    }
    
    /**
     * Reset the game to initial state
     * @returns {Promise<void>}
     */
    async resetGame() {
        if (!this.initialized) {
            throw new Error('L-Game not initialized');
        }
        
        try {
            // Create new WASM game instance
            this.wasmGame = this.wasmGame.constructor.new();
            
            // Reset JavaScript state
            this.moveHistory = [];
            this.selectedPiece = null;
            this.availableMoves = [];
            
            // Sync state
            await this.syncGameState();
            
            console.log('✅ L-Game reset successfully');
            this.notifyStateChange('reset');
            
        } catch (error) {
            console.error('❌ Game reset failed:', error);
            throw error;
        }
    }
    
    /**
     * Get game statistics
     * @returns {Object} Game statistics
     */
    getGameStats() {
        return {
            moveCount: this.moveHistory.length,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            availableMovesCount: this.availableMoves.length,
            boardSize: this.BOARD_SIZE
        };
    }
    
    /**
     * Register callback for game state changes
     * @param {Function} callback - Callback function
     */
    onStateChange(callback) {
        if (typeof callback === 'function') {
            this.gameStateCallbacks.push(callback);
        }
    }
    
    /**
     * Notify all registered callbacks of state change
     * @param {string} eventType - Type of state change
     */
    notifyStateChange(eventType) {
        const gameState = this.getGameStats();
        this.gameStateCallbacks.forEach(callback => {
            try {
                callback(eventType, gameState);
            } catch (error) {
                console.error('❌ State change callback error:', error);
            }
        });
    }
    
    /**
     * Validate coordinate is within board bounds
     * @param {number} row - Row coordinate
     * @param {number} col - Column coordinate
     * @returns {boolean} True if valid
     */
    isValidCoordinate(row, col) {
        return CoordUtils.validateCoords(row, col, this.BOARD_SIZE, this.BOARD_SIZE);
    }
    
    /**
     * Get move history
     * @returns {Array<Object>} Array of historical moves
     */
    getMoveHistory() {
        return [...this.moveHistory];
    }
    
    /**
     * Check if current player has any legal moves
     * @returns {boolean} True if player can move
     */
    canCurrentPlayerMove() {
        return this.availableMoves.length > 0;
    }
    
    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            wasmEngineAvailable: !!this.wasmGame,
            gameStats: this.getGameStats(),
            boardState: this.initialized ? this.getBoard() : null,
            moveHistory: this.moveHistory,
            selectedPiece: this.selectedPiece
        };
    }
}

// Export for ES6 module compatibility
export default LGameJS;