/**
 * TrioInteractionHandler - User Interaction Management for Trio
 * 
 * Adapted from Connect4/Gomoku InteractionHandler for Trio puzzle game.
 * Manages clicks, selections, trio validation, and user feedback.
 * 
 * Features:
 * - Cell selection/deselection with 3-cell limit
 * - Trio validation when 3 cells are selected
 * - Touch and mouse interaction support
 * - Keyboard interaction integration
 * - Visual feedback for user actions
 * - Game state synchronization with backend
 */

export class TrioInteractionHandler {
    constructor(boardRenderer, gameState) {
        this.boardRenderer = boardRenderer;
        this.gameState = gameState;
        
        // Selection state
        this.selectedCells = new Set();
        this.maxSelections = 3; // Trio requires exactly 3 cells
        this.interactionEnabled = true;
        
        // Touch handling for mobile
        this.lastTouchTime = 0;
        this.touchTimeout = 300; // ms to prevent double-tap issues
        
        // Animation and feedback managers
        this.animationManager = null;
        this.messageSystem = null;
        
        // Initialize interaction handlers
        this.initializeInteractionHandlers();
        
        console.log('🖱️ TrioInteractionHandler initialized');
    }

    /**
     * Initialize interaction event handlers
     * @private
     */
    initializeInteractionHandlers() {
        if (!this.boardRenderer || !this.boardRenderer.gameBoard) {
            console.error('❌ Board renderer not available for interaction setup');
            return;
        }
        
        const gameBoard = this.boardRenderer.gameBoard;
        
        // Mouse events
        gameBoard.addEventListener('click', (event) => {
            this.handleBoardClick(event);
        });
        
        // Touch events for mobile support
        gameBoard.addEventListener('touchend', (event) => {
            event.preventDefault(); // Prevent mouse events from firing
            this.handleBoardTouch(event);
        });
        
        // Prevent text selection
        gameBoard.addEventListener('selectstart', (event) => {
            event.preventDefault();
        });
        
        // Context menu prevention (optional - allows right-click for advanced users)
        gameBoard.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    /**
     * Handle board click events
     * @private
     */
    handleBoardClick(event) {
        if (!this.interactionEnabled) return;
        
        const cell = event.target.closest('.trio-cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (!isNaN(row) && !isNaN(col)) {
            this.handleCellClick(row, col);
        }
    }

    /**
     * Handle touch events for mobile
     * @private
     */
    handleBoardTouch(event) {
        if (!this.interactionEnabled) return;
        
        // Prevent double-tap zoom and multiple rapid touches
        const currentTime = Date.now();
        if (currentTime - this.lastTouchTime < this.touchTimeout) return;
        this.lastTouchTime = currentTime;
        
        // Get touch target
        const touch = event.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element?.closest('.trio-cell');
        
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (!isNaN(row) && !isNaN(col)) {
            this.handleCellClick(row, col);
        }
    }

    /**
     * Handle individual cell click/touch
     */
    handleCellClick(row, col) {
        if (!this.interactionEnabled) {
            console.log('🖱️ Interaction disabled');
            return;
        }
        
        const cellId = `${row}-${col}`;
        const isSelected = this.selectedCells.has(cellId);
        
        if (isSelected) {
            // Deselect cell
            this.deselectCell(row, col);
        } else {
            // Select cell (if under limit)
            this.selectCell(row, col);
        }
        
        console.log(`🖱️ Cell clicked: (${row}, ${col}), now ${isSelected ? 'deselected' : 'selected'}`);
    }

    /**
     * Select a cell
     * @private
     */
    selectCell(row, col) {
        const cellId = `${row}-${col}`;
        
        // Check if already at maximum selections
        if (this.selectedCells.size >= this.maxSelections) {
            this.showMessage('Maximal 3 Zellen können ausgewählt werden', 'warning');
            return false;
        }
        
        // Add to selection
        this.selectedCells.add(cellId);
        
        // Update visual state
        this.boardRenderer.selectCell(row, col, true);
        
        // Check if we have 3 selections (ready for trio validation)
        if (this.selectedCells.size === this.maxSelections) {
            this.validateTrioAttempt();
        }
        
        // Play selection sound if available
        if (this.animationManager?.soundManager) {
            this.animationManager.soundManager.playSelection();
        }
        
        return true;
    }

    /**
     * Deselect a cell
     * @private
     */
    deselectCell(row, col) {
        const cellId = `${row}-${col}`;
        
        // Remove from selection
        this.selectedCells.delete(cellId);
        
        // Update visual state
        this.boardRenderer.selectCell(row, col, false);
        
        return true;
    }

    /**
     * Validate trio attempt when 3 cells are selected
     * @private
     */
    async validateTrioAttempt() {
        if (this.selectedCells.size !== 3) return;
        
        console.log('🎯 Validating trio attempt with 3 selected cells');
        
        // Get selected positions
        const positions = Array.from(this.selectedCells).map(cellId => {
            const [row, col] = cellId.split('-').map(Number);
            return { row, col };
        });
        
        // Get numbers from selected cells
        const numbers = positions.map(pos => {
            const cell = this.boardRenderer.getCellAt(pos.row, pos.col);
            return parseInt(cell?.textContent || '0');
        });
        
        try {
            // Validate trio through game state/backend
            const isValid = await this.gameState.validateTrio(positions);
            
            if (isValid) {
                // Valid trio found!
                const calculation = `${numbers[0]} + ${numbers[1]} + ${numbers[2]} = ${numbers.reduce((a, b) => a + b, 0)}`;
                await this.handleValidTrio(positions, calculation);
            } else {
                // Invalid trio
                await this.handleInvalidTrio(positions, numbers);
            }
            
        } catch (error) {
            console.error('❌ Error validating trio:', error);
            this.showMessage('Fehler bei der Trio-Validierung', 'error');
        }
    }

    /**
     * Handle valid trio solution
     * @private
     */
    async handleValidTrio(positions, calculation) {
        console.log(`🎯 Valid trio found: ${calculation}`);
        
        // Disable interaction temporarily
        this.setInteractionEnabled(false);
        
        // Show success message
        this.showMessage('Trio-Lösung gefunden!', 'success', { calculation });
        
        // Trigger animation sequence
        if (this.animationManager) {
            // Start 3-phase victory sequence
            this.animationManager.start3PhaseVictorySequence(positions, calculation, this.gameState);
        }
        
        // Update game statistics
        if (this.gameState.updateStatistics) {
            this.gameState.updateStatistics('trioSolved', { positions, calculation });
        }
        
        // Clear selections after animation
        setTimeout(() => {
            this.clearSelection();
            this.setInteractionEnabled(true);
        }, 1500);
    }

    /**
     * Handle invalid trio attempt
     * @private
     */
    async handleInvalidTrio(positions, numbers) {
        const calculation = `${numbers[0]} + ${numbers[1]} + ${numbers[2]} = ${numbers.reduce((a, b) => a + b, 0)}`;
        console.log(`🎯 Invalid trio: ${calculation}`);
        
        // Show error message
        this.showMessage('Ungültige Trio-Kombination', 'error');
        
        // Trigger invalid animation
        if (this.animationManager) {
            this.animationManager.animateInvalidTrio(positions);
        }
        
        // Clear selections after feedback
        setTimeout(() => {
            this.clearSelection();
        }, 800);
    }

    /**
     * Clear all selected cells
     */
    clearSelection() {
        // Clear visual selections
        this.selectedCells.forEach(cellId => {
            const [row, col] = cellId.split('-').map(Number);
            this.boardRenderer.selectCell(row, col, false);
        });
        
        // Clear internal state
        this.selectedCells.clear();
        
        console.log('🧹 All selections cleared');
    }

    /**
     * Set interaction enabled/disabled
     */
    setInteractionEnabled(enabled) {
        this.interactionEnabled = enabled;
        
        // Update visual feedback
        if (this.boardRenderer?.gameBoard) {
            this.boardRenderer.gameBoard.style.pointerEvents = enabled ? 'auto' : 'none';
            this.boardRenderer.gameBoard.style.opacity = enabled ? '1' : '0.7';
        }
        
        console.log(`🖱️ Interaction ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if interaction is enabled
     */
    isInteractionEnabled() {
        return this.interactionEnabled;
    }

    /**
     * Get current selection state
     */
    getSelectionState() {
        return {
            selectedCount: this.selectedCells.size,
            maxSelections: this.maxSelections,
            canSelectMore: this.selectedCells.size < this.maxSelections,
            positions: Array.from(this.selectedCells).map(cellId => {
                const [row, col] = cellId.split('-').map(Number);
                return { row, col };
            })
        };
    }

    /**
     * Set animation manager for feedback
     */
    setAnimationManager(animationManager) {
        this.animationManager = animationManager;
        console.log('🎬 Animation manager connected to interaction handler');
    }

    /**
     * Set message system for user feedback
     */
    setMessageSystem(messageSystem) {
        this.messageSystem = messageSystem;
        console.log('💬 Message system connected to interaction handler');
    }

    /**
     * Show message to user
     * @private
     */
    showMessage(text, type = 'info', options = {}) {
        if (this.messageSystem) {
            this.messageSystem.show(text, type, options);
        } else {
            // Fallback to console
            console.log(`💬 ${type.toUpperCase()}: ${text}`);
        }
    }

    /**
     * Handle board reset/new game
     */
    handleBoardReset() {
        this.clearSelection();
        this.setInteractionEnabled(true);
        
        console.log('🔄 Interaction handler reset for new game');
    }

    /**
     * Force select cells (for testing/demo)
     */
    forceSelectCells(positions) {
        this.clearSelection();
        
        positions.forEach((pos, index) => {
            if (index < this.maxSelections) {
                const cellId = `${pos.row}-${pos.col}`;
                this.selectedCells.add(cellId);
                this.boardRenderer.selectCell(pos.row, pos.col, true);
            }
        });
        
        console.log(`🎯 Force selected ${positions.length} cells`);
    }

    /**
     * Get selected cell numbers
     */
    getSelectedNumbers() {
        return Array.from(this.selectedCells).map(cellId => {
            const [row, col] = cellId.split('-').map(Number);
            const cell = this.boardRenderer.getCellAt(row, col);
            return parseInt(cell?.textContent || '0');
        });
    }

    /**
     * Check if specific cell is selected
     */
    isCellSelected(row, col) {
        return this.selectedCells.has(`${row}-${col}`);
    }

    /**
     * Get interaction statistics
     */
    getInteractionStats() {
        return {
            enabled: this.interactionEnabled,
            selectedCells: this.selectedCells.size,
            maxSelections: this.maxSelections,
            lastInteraction: this.lastTouchTime,
            hasAnimationManager: !!this.animationManager,
            hasMessageSystem: !!this.messageSystem
        };
    }

    /**
     * Handle keyboard selection (called by TrioKeyboardController)
     */
    handleKeyboardSelection(row, col) {
        // Same logic as click, but triggered by keyboard
        this.handleCellClick(row, col);
        
        console.log(`⌨️ Keyboard selection: (${row}, ${col})`);
    }

    /**
     * Set maximum selections (for different game modes)
     */
    setMaxSelections(max) {
        this.maxSelections = Math.max(1, Math.min(7, max)); // Clamp between 1-7
        
        // Clear excess selections if reducing limit
        if (this.selectedCells.size > this.maxSelections) {
            const positions = Array.from(this.selectedCells);
            this.clearSelection();
            
            // Re-select up to new limit
            positions.slice(0, this.maxSelections).forEach(cellId => {
                const [row, col] = cellId.split('-').map(Number);
                this.selectCell(row, col);
            });
        }
        
        console.log(`🎯 Max selections set to ${this.maxSelections}`);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Clear all selections
        this.clearSelection();
        
        // Clear references
        this.boardRenderer = null;
        this.gameState = null;
        this.animationManager = null;
        this.messageSystem = null;
        
        console.log('🖱️ TrioInteractionHandler destroyed');
    }
}

export default TrioInteractionHandler;