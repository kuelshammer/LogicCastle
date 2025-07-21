/**
 * TrioKeyboardController - Keyboard Navigation for Trio
 * 
 * Adapted from Connect4/Gomoku KeyboardController for Trio 7×7 grid navigation.
 * Provides comprehensive keyboard shortcuts and accessibility features.
 * 
 * Features:
 * - Arrow key navigation for 7×7 grid
 * - Enter/Space for trio cell selection
 * - Number keys (1-7) for quick column selection
 * - Home/End for row navigation
 * - PageUp/PageDown for rapid navigation
 * - Escape key for deselecting all cells
 * - Keyboard accessibility support
 */

export class TrioKeyboardController {
    constructor(interactionHandler) {
        this.interactionHandler = interactionHandler;
        
        // Keyboard state
        this.enabled = true;
        this.focusedRow = 3; // Start at center (0-6)
        this.focusedCol = 3; // Start at center (0-6)
        this.keyboardActive = false;
        
        // Grid configuration for 7×7 Trio board
        this.gridSize = {
            rows: 7,
            cols: 7
        };
        
        // Visual focus indicator
        this.focusIndicator = null;
        
        // Keyboard shortcuts
        this.shortcuts = {
            // Navigation
            'ArrowUp': () => this.moveFocus(-1, 0),
            'ArrowDown': () => this.moveFocus(1, 0),
            'ArrowLeft': () => this.moveFocus(0, -1),
            'ArrowRight': () => this.moveFocus(0, 1),
            
            // Quick column selection (1-7 keys)
            'Digit1': () => this.jumpToColumn(0),
            'Digit2': () => this.jumpToColumn(1),
            'Digit3': () => this.jumpToColumn(2),
            'Digit4': () => this.jumpToColumn(3),
            'Digit5': () => this.jumpToColumn(4),
            'Digit6': () => this.jumpToColumn(5),
            'Digit7': () => this.jumpToColumn(6),
            
            // Row navigation
            'Home': () => this.jumpToStart(),
            'End': () => this.jumpToEnd(),
            'PageUp': () => this.moveFocus(-3, 0), // Jump 3 rows up
            'PageDown': () => this.moveFocus(3, 0), // Jump 3 rows down
            
            // Selection
            'Enter': () => this.selectCurrentCell(),
            'Space': () => this.selectCurrentCell(),
            
            // Clear selection
            'Escape': () => this.clearSelection(),
            
            // Help
            'F1': () => this.showKeyboardHelp(),
            
            // Quick navigation to center
            'KeyC': () => this.jumpToCenter()
        };
        
        // Initialize keyboard controls
        this.initializeKeyboardControls();
        
        console.log('⌨️ TrioKeyboardController initialized');
    }

    /**
     * Initialize keyboard event handlers
     * @private
     */
    initializeKeyboardControls() {
        // Main keyboard event handler
        document.addEventListener('keydown', (event) => {
            if (!this.enabled) return;
            
            // Activate keyboard mode on first arrow key press
            if (!this.keyboardActive && event.code.startsWith('Arrow')) {
                this.activateKeyboardMode();
            }
            
            // Handle keyboard shortcuts
            const shortcut = this.shortcuts[event.code];
            if (shortcut) {
                event.preventDefault();
                shortcut();
            }
        });
        
        // Deactivate keyboard mode on mouse interaction
        document.addEventListener('mousedown', () => {
            if (this.keyboardActive) {
                this.deactivateKeyboardMode();
            }
        });
        
        // Create focus indicator
        this.createFocusIndicator();
    }

    /**
     * Create visual focus indicator
     * @private
     */
    createFocusIndicator() {
        this.focusIndicator = document.createElement('div');
        this.focusIndicator.id = 'trio-keyboard-focus';
        this.focusIndicator.style.cssText = `
            position: absolute;
            width: 60px;
            height: 60px;
            border: 3px solid #3B82F6;
            border-radius: 8px;
            background: rgba(59, 130, 246, 0.1);
            pointer-events: none;
            z-index: 100;
            display: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
            transition: all 0.2s ease-out;
        `;
        
        document.body.appendChild(this.focusIndicator);
    }

    /**
     * Activate keyboard navigation mode
     */
    activateKeyboardMode() {
        this.keyboardActive = true;
        this.updateFocusVisual();
        
        console.log('⌨️ Keyboard navigation activated');
    }

    /**
     * Deactivate keyboard navigation mode
     */
    deactivateKeyboardMode() {
        this.keyboardActive = false;
        this.hideFocusVisual();
        
        console.log('⌨️ Keyboard navigation deactivated');
    }

    /**
     * Move keyboard focus
     * @private
     */
    moveFocus(deltaRow, deltaCol) {
        if (!this.keyboardActive) return;
        
        const newRow = Math.max(0, Math.min(this.gridSize.rows - 1, this.focusedRow + deltaRow));
        const newCol = Math.max(0, Math.min(this.gridSize.cols - 1, this.focusedCol + deltaCol));
        
        // Only update if position changed
        if (newRow !== this.focusedRow || newCol !== this.focusedCol) {
            this.focusedRow = newRow;
            this.focusedCol = newCol;
            this.updateFocusVisual();
            
            console.log(`⌨️ Focus moved to (${this.focusedRow}, ${this.focusedCol})`);
        }
    }

    /**
     * Jump to specific column
     * @private
     */
    jumpToColumn(col) {
        if (!this.keyboardActive) {
            this.activateKeyboardMode();
        }
        
        this.focusedCol = col;
        this.updateFocusVisual();
        
        console.log(`⌨️ Jumped to column ${col + 1}`);
    }

    /**
     * Jump to start of current row
     * @private
     */
    jumpToStart() {
        if (!this.keyboardActive) {
            this.activateKeyboardMode();
        }
        
        this.focusedCol = 0;
        this.updateFocusVisual();
        
        console.log('⌨️ Jumped to start of row');
    }

    /**
     * Jump to end of current row
     * @private
     */
    jumpToEnd() {
        if (!this.keyboardActive) {
            this.activateKeyboardMode();
        }
        
        this.focusedCol = this.gridSize.cols - 1;
        this.updateFocusVisual();
        
        console.log('⌨️ Jumped to end of row');
    }

    /**
     * Jump to center of grid
     * @private
     */
    jumpToCenter() {
        if (!this.keyboardActive) {
            this.activateKeyboardMode();
        }
        
        this.focusedRow = 3; // Center of 7×7 grid
        this.focusedCol = 3;
        this.updateFocusVisual();
        
        console.log('⌨️ Jumped to center (3,3)');
    }

    /**
     * Select currently focused cell
     * @private
     */
    selectCurrentCell() {
        if (!this.keyboardActive) return;
        
        if (this.interactionHandler) {
            // Simulate click on focused cell
            this.interactionHandler.handleCellClick(this.focusedRow, this.focusedCol);
            console.log(`⌨️ Selected cell (${this.focusedRow}, ${this.focusedCol})`);
        }
    }

    /**
     * Clear all selections
     * @private
     */
    clearSelection() {
        if (this.interactionHandler && typeof this.interactionHandler.clearSelection === 'function') {
            this.interactionHandler.clearSelection();
            console.log('⌨️ Cleared all selections');
        }
    }

    /**
     * Show keyboard help
     * @private
     */
    showKeyboardHelp() {
        // This would trigger the help modal with keyboard shortcuts
        console.log('⌨️ Keyboard help requested');
        
        // Try to open help modal if available
        if (window.trioModalManager) {
            window.trioModalManager.open('help');
        }
    }

    /**
     * Update focus visual indicator
     * @private
     */
    updateFocusVisual() {
        if (!this.keyboardActive || !this.focusIndicator) return;
        
        // Find the cell element
        const cell = document.querySelector(`[data-row="${this.focusedRow}"][data-col="${this.focusedCol}"]`);
        if (!cell) {
            this.hideFocusVisual();
            return;
        }
        
        // Get cell position
        const rect = cell.getBoundingClientRect();
        
        // Position focus indicator
        this.focusIndicator.style.display = 'block';
        this.focusIndicator.style.left = `${rect.left - 3}px`;
        this.focusIndicator.style.top = `${rect.top - 3}px`;
        this.focusIndicator.style.width = `${rect.width + 6}px`;
        this.focusIndicator.style.height = `${rect.height + 6}px`;
    }

    /**
     * Hide focus visual indicator
     * @private
     */
    hideFocusVisual() {
        if (this.focusIndicator) {
            this.focusIndicator.style.display = 'none';
        }
    }

    /**
     * Set focused position
     */
    setFocus(row, col) {
        if (row >= 0 && row < this.gridSize.rows && col >= 0 && col < this.gridSize.cols) {
            this.focusedRow = row;
            this.focusedCol = col;
            
            if (this.keyboardActive) {
                this.updateFocusVisual();
            }
        }
    }

    /**
     * Get current focused position
     */
    getFocus() {
        return {
            row: this.focusedRow,
            col: this.focusedCol,
            active: this.keyboardActive
        };
    }

    /**
     * Enable keyboard navigation
     */
    enable() {
        this.enabled = true;
        console.log('⌨️ Keyboard controller enabled');
    }

    /**
     * Disable keyboard navigation
     */
    disable() {
        this.enabled = false;
        this.deactivateKeyboardMode();
        console.log('⌨️ Keyboard controller disabled');
    }

    /**
     * Check if keyboard navigation is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Check if keyboard mode is active
     */
    isActive() {
        return this.keyboardActive;
    }

    /**
     * Get keyboard shortcuts help text
     */
    getShortcutsHelp() {
        return {
            navigation: {
                'Arrow Keys': 'Navigate grid',
                '1-7': 'Jump to column',
                'Home': 'Start of row',
                'End': 'End of row',
                'Page Up/Down': 'Jump 3 rows',
                'C': 'Jump to center'
            },
            selection: {
                'Enter': 'Select cell',
                'Space': 'Select cell',
                'Escape': 'Clear selection'
            },
            help: {
                'F1': 'Show help'
            }
        };
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.keyboardActive) {
            // Delay update to allow layout to settle
            setTimeout(() => {
                this.updateFocusVisual();
            }, 100);
        }
    }

    /**
     * Reset keyboard state
     */
    reset() {
        this.deactivateKeyboardMode();
        this.focusedRow = 3; // Reset to center
        this.focusedCol = 3;
        
        console.log('⌨️ Keyboard controller reset');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.deactivateKeyboardMode();
        
        // Remove focus indicator
        if (this.focusIndicator && this.focusIndicator.parentNode) {
            this.focusIndicator.parentNode.removeChild(this.focusIndicator);
        }
        
        // Clear references
        this.interactionHandler = null;
        this.focusIndicator = null;
        
        console.log('⌨️ TrioKeyboardController destroyed');
    }
}

export default TrioKeyboardController;