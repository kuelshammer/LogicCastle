/**
 * GomokuKeyboardController - Keyboard Navigation for Gomoku
 * 
 * Adapted from Connect4 KeyboardController for Gomoku intersection-based gameplay.
 * Provides comprehensive keyboard shortcuts and accessibility features.
 * 
 * Features:
 * - Modal shortcuts (F1=Help, F2=Assistance)
 * - Game actions (N=New Game, U=Undo)
 * - Grid navigation (Arrow keys, 1-15 shortcuts)
 * - Accessibility support
 * - Conflict prevention with browser shortcuts
 */

export class GomokuKeyboardController {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
        
        // Keyboard state
        this.enabled = true;
        this.focusPosition = { row: 7, col: 7 }; // Center of 15x15 board
        this.showFocusIndicator = false;
        
        // Key bindings
        this.keyBindings = {
            // Modal shortcuts
            'F1': () => this.ui.toggleModal?.('help'),
            'F2': () => this.ui.toggleModal?.('assistance'),
            
            // Game actions
            'KeyN': () => this.ui.newGame?.(),
            'KeyU': () => this.ui.undoMove?.(),
            'Escape': () => this.ui.closeModal?.(),
            
            // Grid navigation (Arrow keys)
            'ArrowUp': () => this.moveFocus(0, -1),
            'ArrowDown': () => this.moveFocus(0, 1),
            'ArrowLeft': () => this.moveFocus(-1, 0),
            'ArrowRight': () => this.moveFocus(1, 0),
            
            // Direct position shortcuts (1-9 for columns 0-8)
            'Digit1': () => this.focusPosition.col = 0,
            'Digit2': () => this.focusPosition.col = 1,
            'Digit3': () => this.focusPosition.col = 2,
            'Digit4': () => this.focusPosition.col = 3,
            'Digit5': () => this.focusPosition.col = 4,
            'Digit6': () => this.focusPosition.col = 5,
            'Digit7': () => this.focusPosition.col = 6,
            'Digit8': () => this.focusPosition.col = 7,
            'Digit9': () => this.focusPosition.col = 8,
            'Digit0': () => this.focusPosition.col = 9,
            
            // Additional columns (Q-T for columns 10-14)
            'KeyQ': () => this.focusPosition.col = 10,
            'KeyW': () => this.focusPosition.col = 11,
            'KeyE': () => this.focusPosition.col = 12,
            'KeyR': () => this.focusPosition.col = 13,
            'KeyT': () => this.focusPosition.col = 14,
            
            // Enter/Space to place stone
            'Enter': () => this.makeMove(),
            'Space': () => this.makeMove()
        };
        
        // Special combinations (Ctrl+Z for undo)
        this.combinationBindings = {
            'ctrl+KeyZ': () => this.ui.undoMove?.()
        };
        
        // Initialize
        this.setupEventListeners();
        
        console.log('⌨️ GomokuKeyboardController initialized');
    }
    
    /**
     * Set up keyboard event listeners
     * @private
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Focus/blur events for showing/hiding focus indicator
        document.addEventListener('focusin', () => this.showKeyboardFocus());
        document.addEventListener('focusout', () => this.hideKeyboardFocus());
    }
    
    /**
     * Handle keydown events
     * @private
     */
    handleKeyDown(e) {
        if (!this.enabled) return;
        
        // Skip if typing in input fields
        if (this.isTypingInField(e.target)) return;
        
        // Handle combination keys
        const combination = this.getCombination(e);
        if (combination && this.combinationBindings[combination]) {
            e.preventDefault();
            this.combinationBindings[combination]();
            return;
        }
        
        // Handle single keys
        const handler = this.keyBindings[e.code];
        if (handler) {
            // Prevent default for game keys, but allow browser shortcuts like F5, F12
            if (!this.isBrowserShortcut(e.code)) {
                e.preventDefault();
            }
            
            handler();
            
            // Update focus indicator if needed
            if (this.isNavigationKey(e.code)) {
                this.updateFocusIndicator();
            }
        }
    }
    
    /**
     * Handle keyup events
     * @private
     */
    handleKeyUp(e) {
        // Currently no keyup handling needed
    }
    
    /**
     * Get key combination string
     * @private
     */
    getCombination(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.code);
        return parts.join('+');
    }
    
    /**
     * Check if user is typing in an input field
     * @private
     */
    isTypingInField(target) {
        const typingElements = ['INPUT', 'TEXTAREA', 'SELECT'];
        return typingElements.includes(target.tagName) || target.contentEditable === 'true';
    }
    
    /**
     * Check if key is a browser shortcut that should not be prevented
     * @private
     */
    isBrowserShortcut(code) {
        const browserShortcuts = ['F5', 'F12', 'F11']; // Refresh, DevTools, Fullscreen
        return browserShortcuts.includes(code);
    }
    
    /**
     * Check if key is a navigation key
     * @private
     */
    isNavigationKey(code) {
        const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        return navigationKeys.includes(code);
    }
    
    /**
     * Move focus position
     * @private
     */
    moveFocus(deltaCol, deltaRow) {
        const newCol = Math.max(0, Math.min(14, this.focusPosition.col + deltaCol));
        const newRow = Math.max(0, Math.min(14, this.focusPosition.row + deltaRow));
        
        this.focusPosition = { row: newRow, col: newCol };
        this.updateFocusIndicator();
        
        console.log(`⌨️ Focus moved to (${newRow}, ${newCol})`);
    }
    
    /**
     * Make move at current focus position
     * @private
     */
    makeMove() {
        if (!this.game || !this.ui) return;
        
        const { row, col } = this.focusPosition;
        
        // Check if position is valid
        if (this.game.isValidMove && !this.game.isValidMove(row, col)) {
            console.log(`⌨️ Invalid move at (${row}, ${col})`);
            return;
        }
        
        // Make move through UI
        if (this.ui.makeMove) {
            this.ui.makeMove(row, col);
            console.log(`⌨️ Made move at (${row}, ${col})`);
        }
    }
    
    /**
     * Show keyboard focus indicator
     * @private
     */
    showKeyboardFocus() {
        this.showFocusIndicator = true;
        this.updateFocusIndicator();
    }
    
    /**
     * Hide keyboard focus indicator
     * @private
     */
    hideKeyboardFocus() {
        this.showFocusIndicator = false;
        this.clearFocusIndicator();
    }
    
    /**
     * Update focus indicator on game board
     * @private
     */
    updateFocusIndicator() {
        if (!this.showFocusIndicator) return;
        
        // Clear existing indicators
        this.clearFocusIndicator();
        
        // Find target intersection
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) return;
        
        const { row, col } = this.focusPosition;
        const intersection = gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (intersection) {
            intersection.classList.add('keyboard-focus');
            intersection.style.cssText += `
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
                border: 2px solid #3b82f6 !important;
                z-index: 10 !important;
            `;
        }
    }
    
    /**
     * Clear all focus indicators
     * @private
     */
    clearFocusIndicator() {
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) return;
        
        const focusedElements = gameBoard.querySelectorAll('.keyboard-focus');
        focusedElements.forEach(element => {
            element.classList.remove('keyboard-focus');
            // Remove inline styles applied for focus
            const style = element.style;
            style.removeProperty('box-shadow');
            style.removeProperty('border');
            style.removeProperty('z-index');
        });
    }
    
    /**
     * Set focus position manually
     */
    setFocusPosition(row, col) {
        if (row >= 0 && row < 15 && col >= 0 && col < 15) {
            this.focusPosition = { row, col };
            this.updateFocusIndicator();
        }
    }
    
    /**
     * Get current focus position
     */
    getFocusPosition() {
        return { ...this.focusPosition };
    }
    
    /**
     * Enable keyboard control
     */
    enable() {
        this.enabled = true;
        console.log('⌨️ Keyboard control enabled');
    }
    
    /**
     * Disable keyboard control
     */
    disable() {
        this.enabled = false;
        this.clearFocusIndicator();
        console.log('⌨️ Keyboard control disabled');
    }
    
    /**
     * Check if keyboard control is enabled
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Add custom key binding
     */
    addKeyBinding(key, handler) {
        this.keyBindings[key] = handler;
        console.log(`⌨️ Added key binding: ${key}`);
    }
    
    /**
     * Remove key binding
     */
    removeKeyBinding(key) {
        delete this.keyBindings[key];
        console.log(`⌨️ Removed key binding: ${key}`);
    }
    
    /**
     * Get help text for keyboard shortcuts
     */
    getHelpText() {
        return {
            'Modals': {
                'F1': 'Hilfe öffnen/schließen',
                'F2': 'Spielerhilfen öffnen/schließen',
                'Escape': 'Modal schließen'
            },
            'Spiel': {
                'N': 'Neues Spiel',
                'U oder Strg+Z': 'Rückgängig',
                'Enter/Leertaste': 'Stein setzen'
            },
            'Navigation': {
                'Pfeiltasten': 'Fokus bewegen',
                '1-9, 0': 'Spalten 1-10 fokussieren',
                'Q, W, E, R, T': 'Spalten 11-15 fokussieren'
            }
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.clearFocusIndicator();
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('focusin', this.showKeyboardFocus);
        document.removeEventListener('focusout', this.hideKeyboardFocus);
        
        // Clear references
        this.game = null;
        this.ui = null;
        this.keyBindings = {};
        this.combinationBindings = {};
        
        console.log('⌨️ GomokuKeyboardController destroyed');
    }
}

export default GomokuKeyboardController;