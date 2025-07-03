/**
 * L-Game UI Module
 * 
 * Main UI controller for L-Game. Handles user interactions, board rendering,
 * and integration with the WASM game engine through the ES6 module system.
 * 
 * Features:
 * - Interactive 4x4 board
 * - L-piece and neutral piece visualization
 * - Move input handling
 * - Game state display
 * - Error handling and user feedback
 */

import init, { LGame } from '../../../game_engine/pkg/game_engine.js';
import { LGameCoordUtils } from './coord-utils.js';

class LGameUI {
    constructor() {
        this.game = null;
        this.initialized = false;
        this.selectedPiece = null;
        this.highlightedMoves = [];
        this.boardElement = null;
        this.cellSize = 60; // pixels
        
        // UI state
        this.showingMoves = false;
        this.debugMode = false;
        
        // Bind methods
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleResetGame = this.handleResetGame.bind(this);
        this.handleShowMoves = this.handleShowMoves.bind(this);
        this.handleDebugInfo = this.handleDebugInfo.bind(this);
    }
    
    /**
     * Initialize the L-Game UI
     */
    async initialize() {
        try {
            this.updateLoadingProgress('Initialisiere UI...');
            this.setupEventListeners();
            this.createBoard();
            
            this.updateLoadingProgress('Lade WASM Engine...');
            
            // Initialize WASM module
            await init();
            
            // Create L-Game instance
            this.game = new LGame();
            this.initialized = true;
            
            // Game state will be updated manually after moves
            
            this.updateLoadingProgress('Fertig!');
            await this.delay(500);
            
            // Hide loading overlay and show game
            this.hideLoadingOverlay();
            this.updateGameDisplay();
            this.renderBoard();
            
            console.log('✅ L-Game UI initialized successfully');
            
        } catch (error) {
            console.error('❌ L-Game UI initialization failed:', error);
            this.showError('Fehler beim Laden des L-Games', error.message);
        }
    }
    
    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Game controls
        document.getElementById('reset-game')?.addEventListener('click', this.handleResetGame);
        document.getElementById('show-moves')?.addEventListener('click', this.handleShowMoves);
        document.getElementById('debug-info')?.addEventListener('click', this.handleDebugInfo);
        
        // Error modal
        document.getElementById('close-error')?.addEventListener('click', () => {
            document.getElementById('error-modal').classList.add('hidden');
        });
        
        document.getElementById('retry-button')?.addEventListener('click', () => {
            document.getElementById('error-modal').classList.add('hidden');
            this.initialize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'r' || event.key === 'R') {
                this.handleResetGame();
            } else if (event.key === 'm' || event.key === 'M') {
                this.handleShowMoves();
            } else if (event.key === 'd' || event.key === 'D') {
                this.handleDebugInfo();
            }
        });
    }
    
    /**
     * Create the 4x4 game board
     */
    createBoard() {
        this.boardElement = document.getElementById('game-board');
        if (!this.boardElement) {
            throw new Error('Game board element not found');
        }
        
        // Clear existing content and apply CSS classes
        this.boardElement.innerHTML = '';
        this.boardElement.className = 'lgame-board';
        
        // Create 16 cells for 4x4 board
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = this.createBoardCell(row, col);
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    /**
     * Create a single board cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {HTMLElement} Cell element
     */
    createBoardCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'lgame-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Add click handler
        cell.addEventListener('click', this.handleCellClick);
        
        return cell;
    }
    
    /**
     * Handle cell click events
     * @param {Event} event - Click event
     */
    async handleCellClick(event) {
        if (!this.initialized || !this.game) {
            return;
        }
        
        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        console.log(`Cell clicked: (${row}, ${col})`);
        
        try {
            // Check if it's game over
            if (this.game.isGameOver()) {
                this.showTemporaryMessage('Spiel ist beendet!', 'info');
                return;
            }
            
            console.log(`Cell clicked: (${row}, ${col})`);
            
            // L-Game move: L-piece placement + optional neutral piece move
            // Using correct WASM interface: makeMove(l_anchor_row, l_anchor_col, l_orientation, neutral_id?, neutral_row?, neutral_col?)
            try {
                // Try to make a move with L-piece at clicked position, orientation 0 (no neutral piece move)
                this.game.makeMove(row, col, 0, null, null, null);
                
                // Update UI after successful move
                this.updateGameDisplay();
                this.renderBoard();
                
                // Check for game end
                if (this.game.isGameOver()) {
                    const winner = this.game.getWinner();
                    if (winner !== undefined) {
                        const playerName = winner === 1 ? 'Spieler 1' : 'Spieler 2';
                        this.showTemporaryMessage(`${playerName} gewinnt!`, 'success');
                    }
                }
                
            } catch (moveError) {
                console.warn('Move failed:', moveError.message);
                this.showTemporaryMessage('Ungültiger Zug - L-Stein kann dort nicht platziert werden', 'error');
            }
            
        } catch (error) {
            console.error('Error handling cell click:', error);
            this.showTemporaryMessage('Fehler beim Verarbeiten des Klicks', 'error');
        }
    }
    
    /**
     * Render the current board state
     */
    renderBoard() {
        if (!this.initialized || !this.game || !this.boardElement) {
            return;
        }
        
        try {
            const board = this.game.getBoard();
            const cells = this.boardElement.querySelectorAll('.lgame-cell');
            
            cells.forEach((cell, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const cellValue = board[row * 4 + col];
                
                // Clear previous styling and content
                cell.className = 'lgame-cell';
                cell.innerHTML = '';
                
                // Render cell content based on value
                if (cellValue > 0) {
                    this.renderCellContent(cell, cellValue, row, col);
                }
            });
            
        } catch (error) {
            console.error('Error rendering board:', error);
        }
    }
    
    /**
     * Render content for occupied cell
     * @param {HTMLElement} cell - Cell element
     * @param {number} value - Cell value from game engine
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    renderCellContent(cell, value, row, col) {
        // Value 1 = occupied (could be L-piece or neutral)
        // For now, just show a generic occupied indicator
        const piece = document.createElement('div');
        piece.className = 'lgame-piece player1'; // Default to player1, will be enhanced later
        cell.appendChild(piece);
    }
    
    /**
     * Update game display with current state
     */
    updateGameDisplay() {
        if (!this.game) return;
        
        try {
            // Get current game state from WASM
            const currentPlayer = this.game.getCurrentPlayer();
            const isGameOver = this.game.isGameOver();
            
            // Update current player
            const currentPlayerElement = document.getElementById('current-player');
            if (currentPlayerElement) {
                const playerName = currentPlayer === 1 ? 'Spieler 1' : 'Spieler 2';
                currentPlayerElement.textContent = playerName;
                currentPlayerElement.className = currentPlayer === 1 
                    ? 'text-lg font-bold text-blue-600' 
                    : 'text-lg font-bold text-red-600';
            }
            
            // Update move count (placeholder - L-Game doesn't track move count the same way)
            const moveCountElement = document.getElementById('move-count');
            if (moveCountElement) {
                moveCountElement.textContent = '0'; // TODO: Implement proper move counting
            }
            
            // Update legal moves count
            const legalMovesElement = document.getElementById('legal-moves-count');
            if (legalMovesElement) {
                try {
                    const legalMoves = this.game.getLegalMoves();
                    legalMovesElement.textContent = legalMoves.length;
                } catch (error) {
                    legalMovesElement.textContent = '-';
                }
            }
            
            // Update game status
            const gameStatusElement = document.getElementById('game-status');
            if (gameStatusElement) {
                if (isGameOver) {
                    const winner = this.game.getWinner();
                    if (winner !== undefined) {
                        gameStatusElement.textContent = `Spieler ${winner === 1 ? '1' : '2'} gewinnt!`;
                        gameStatusElement.className = 'font-bold text-green-600';
                    } else {
                        gameStatusElement.textContent = 'Unentschieden';
                        gameStatusElement.className = 'font-bold text-gray-600';
                    }
                } else {
                    gameStatusElement.textContent = 'Läuft';
                    gameStatusElement.className = 'font-bold text-blue-600';
                }
            }
            
            // Update system status
            this.updateSystemStatus();
            
        } catch (error) {
            console.error('Error updating game display:', error);
        }
    }
    
    /**
     * Update system status indicators
     */
    updateSystemStatus() {
        const wasmStatus = document.getElementById('wasm-status');
        const gameEngineStatus = document.getElementById('game-engine-status');
        
        if (wasmStatus) {
            wasmStatus.textContent = this.initialized ? 'Bereit' : 'Loading...';
            wasmStatus.className = this.initialized ? 'font-bold text-green-600' : 'font-bold text-yellow-600';
        }
        
        if (gameEngineStatus) {
            gameEngineStatus.textContent = this.game ? 'Bereit' : 'Initializing...';
            gameEngineStatus.className = this.game ? 'font-bold text-green-600' : 'font-bold text-yellow-600';
        }
    }
    
    /**
     * Handle reset game button
     */
    async handleResetGame() {
        if (!this.game) return;
        
        try {
            // Create new game instance instead of resetGame (which may not exist)
            this.game = new LGame();
            this.updateGameDisplay();
            this.renderBoard();
            this.showTemporaryMessage('Spiel zurückgesetzt', 'success');
        } catch (error) {
            console.error('Error resetting game:', error);
            this.showTemporaryMessage('Fehler beim Zurücksetzen', 'error');
        }
    }
    
    /**
     * Handle show moves button
     */
    handleShowMoves() {
        if (!this.game) return;
        
        try {
            const moves = this.game.getLegalMoves();
            console.log('Legal moves:', moves);
            this.showTemporaryMessage(`${moves.length} legale Züge verfügbar`, 'info');
        } catch (error) {
            console.error('Error getting legal moves:', error);
            this.showTemporaryMessage('Fehler beim Abrufen der Züge', 'error');
        }
    }
    
    /**
     * Handle debug info button
     */
    handleDebugInfo() {
        if (!this.game) return;
        
        try {
            // Get available information from WASM LGame interface
            const currentPlayer = this.game.getCurrentPlayer();
            const isGameOver = this.game.isGameOver();
            const winner = this.game.getWinner();
            const legalMoves = this.game.getLegalMoves();
            const board = this.game.getBoard();
            
            // Show debug info in a formatted way
            const info = `
L-Game Debug Information:
═══════════════════════
Initialized: ${this.initialized}
Current Player: ${currentPlayer === 1 ? 'Spieler 1' : 'Spieler 2'} 
Game Over: ${isGameOver}
Winner: ${winner !== undefined ? `Spieler ${winner}` : 'None'}
Legal Moves: ${legalMoves.length}
Board Size: ${board.length} cells (4x4)
            `.trim();
            
            console.log('L-Game Debug Info:', {
                currentPlayer,
                isGameOver,
                winner,
                legalMovesCount: legalMoves.length,
                boardState: Array.from(board)
            });
            
            alert(info);
        } catch (error) {
            console.error('Error getting debug info:', error);
            this.showTemporaryMessage('Fehler beim Abrufen der Debug-Info', 'error');
        }
    }
    
    /**
     * Show temporary message to user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, info)
     */
    showTemporaryMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // For now, just log to console
        // TODO: Implement toast notifications
    }
    
    /**
     * Update loading progress
     * @param {string} message - Progress message
     */
    updateLoadingProgress(message) {
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.textContent = message;
        }
    }
    
    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    /**
     * Show error modal
     * @param {string} title - Error title
     * @param {string} message - Error message
     */
    showError(title, message) {
        const modal = document.getElementById('error-modal');
        const messageElement = document.getElementById('error-message');
        
        if (modal && messageElement) {
            messageElement.textContent = `${title}: ${message}`;
            modal.classList.remove('hidden');
        }
        
        this.hideLoadingOverlay();
    }
    
    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the L-Game UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    const ui = new LGameUI();
    ui.initialize();
});

// Export for ES6 modules
export default LGameUI;