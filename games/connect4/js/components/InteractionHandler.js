/**
 * InteractionHandler - Connect4 User Interaction Management
 * 
 * Extracted from Connect4UINew for focused responsibility.
 * Handles all user interactions: clicks, hover, keyboard, drag & drop.
 * 
 * Responsibilities:
 * - Column click & hover handling
 * - Drop preview system
 * - Keyboard interactions (1-7 keys)
 * - Touch/mobile interaction support
 * - Column validation & feedback
 */

export class InteractionHandler {
    constructor(boardRenderer, gameBoard) {
        this.boardRenderer = boardRenderer;
        this.gameBoard = gameBoard;
        
        // Interaction state
        this.hoveredColumn = null;
        this.previewDisc = null;
        this.isProcessingMove = false;
        
        // Event listeners for cleanup
        this.eventListeners = [];
        
        // Callback functions
        this.onColumnClickCallback = null;
        this.onColumnHoverCallback = null;
        this.onColumnHoverLeaveCallback = null;
    }

    /**
     * Setup all column interactions (click, hover)
     * Now uses coordinate labels instead of redundant hover zones
     */
    setupColumnInteractions() {
        if (!this.gameBoard) return;

        // Setup coordinate click handlers (replaces hover zones)
        this.setupCoordinateInteractions();
        
        // Handle board clicks for column selection (fallback)
        this._setupBoardClickHandler();
        
        console.log('🎯 Column interactions set up (coordinate labels + board clicks)');
    }

    /**
     * Setup coordinate label interactions
     * Replaces redundant hover zones with coordinate-based interaction
     */
    setupCoordinateInteractions() {
        const topCoords = document.getElementById('topCoords');
        const bottomCoords = document.getElementById('bottomCoords');
        
        if (topCoords) {
            this._setupCoordinateLabelHandlers(topCoords);
        }
        if (bottomCoords) {
            this._setupCoordinateLabelHandlers(bottomCoords);
        }
        
        console.log('🎯 Setup coordinate label interactions for column selection');
    }

    /**
     * Setup board click event handler
     * @private
     */
    _setupBoardClickHandler() {
        const clickHandler = (event) => {
            const slot = event.target.closest('.game-slot');
            if (slot) {
                const col = parseInt(slot.dataset.col);
                this.handleColumnClick(col);
            }
        };
        
        this.gameBoard.addEventListener('click', clickHandler);
        this._trackEventListener(this.gameBoard, 'click', clickHandler);
    }

    /**
     * Setup coordinate label event handlers
     * @private
     */
    _setupCoordinateLabelHandlers(coordContainer) {
        // Find or create coordinate labels
        const coords = coordContainer.querySelectorAll('.coord');
        
        if (coords.length === 0) {
            // Generate coordinate labels if they don't exist
            this._generateCoordinateLabels(coordContainer);
            return this._setupCoordinateLabelHandlers(coordContainer);
        }
        
        coords.forEach((coord, index) => {
            const col = index; // Columns 0-6 for internal use, display as 1-7
            
            const clickHandler = () => this.handleColumnClick(col);
            const mouseEnterHandler = () => this.handleColumnHover(col);
            const mouseLeaveHandler = () => this.handleColumnHoverLeave();
            
            coord.addEventListener('click', clickHandler);
            coord.addEventListener('mouseenter', mouseEnterHandler);
            coord.addEventListener('mouseleave', mouseLeaveHandler);
            
            this._trackEventListener(coord, 'click', clickHandler);
            this._trackEventListener(coord, 'mouseenter', mouseEnterHandler);
            this._trackEventListener(coord, 'mouseleave', mouseLeaveHandler);
        });
    }

    /**
     * Generate coordinate labels if they don't exist
     * @private
     */
    _generateCoordinateLabels(coordContainer) {
        // Clear existing content
        coordContainer.innerHTML = '';
        
        for (let col = 0; col < 7; col++) {
            const coord = document.createElement('div');
            coord.className = 'coord';
            coord.textContent = (col + 1).toString(); // Display 1-7
            coord.dataset.col = col;
            coordContainer.appendChild(coord);
        }
    }

    /**
     * Handle column hover for preview
     * Extracted from Connect4UINew.onColumnHover()
     */
    handleColumnHover(col) {
        if (this.isProcessingMove) return;
        
        this.hoveredColumn = col;
        this.showDropPreview(col);
        
        // Callback for external handling
        if (this.onColumnHoverCallback) {
            this.onColumnHoverCallback(col);
        }
    }

    /**
     * Handle column hover leave
     * Extracted from Connect4UINew.onColumnHoverLeave()
     */
    handleColumnHoverLeave() {
        this.hoveredColumn = null;
        this.hideDropPreview();
        
        // Callback for external handling
        if (this.onColumnHoverLeaveCallback) {
            this.onColumnHoverLeaveCallback();
        }
    }

    /**
     * Handle column click to drop disc
     * Extracted from Connect4UINew.onColumnClick()
     */
    handleColumnClick(col) {
        if (this.isProcessingMove) {
            console.log('Move already in progress, ignoring input');
            return;
        }

        if (col < 0 || col >= 7) {
            console.warn(`Invalid column click: ${col}`);
            return;
        }

        // Callback for external handling (UI will handle actual move)
        if (this.onColumnClickCallback) {
            this.onColumnClickCallback(col);
        }
    }

    /**
     * Show drop preview for column
     * Extracted from Connect4UINew.showDropPreview()
     */
    showDropPreview(col) {
        this.hideDropPreview(); // Clear any existing preview
        
        // Find the lowest empty slot in the column
        const slot = this._findLowestEmptySlot(col);
        if (!slot) return; // Column is full
        
        const disc = slot.querySelector('.disc');
        if (disc && disc.classList.contains('empty')) {
            disc.classList.add('preview');
            this.previewDisc = disc;
            
            // Style preview disc
            Object.assign(disc.style, {
                background: 'rgba(255, 255, 255, 0.5)',
                border: '2px dashed rgba(255, 255, 255, 0.8)',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            });
        }
    }

    /**
     * Hide drop preview
     * Extracted from Connect4UINew.hideDropPreview()
     */
    hideDropPreview() {
        if (this.previewDisc) {
            this.previewDisc.classList.remove('preview');
            
            // Reset preview disc styles
            Object.assign(this.previewDisc.style, {
                background: 'transparent',
                border: 'none',
                boxShadow: 'none'
            });
            
            this.previewDisc = null;
        }
    }

    /**
     * Find lowest empty slot in column
     * @private
     */
    _findLowestEmptySlot(col) {
        for (let row = 5; row >= 0; row--) { // Start from bottom
            const slot = this.boardRenderer.getCellAt(row, col);
            if (slot) {
                const disc = slot.querySelector('.disc');
                if (disc && disc.classList.contains('empty')) {
                    return slot;
                }
            }
        }
        return null; // Column is full
    }

    /**
     * Setup keyboard interactions for column drops (1-7 keys)
     */
    setupKeyboardInteractions() {
        const keyboardHandler = (event) => {
            // Handle number keys 1-7 for column drops
            const key = event.key;
            if (key >= '1' && key <= '7') {
                const col = parseInt(key) - 1; // Convert to 0-indexed
                this.handleColumnClick(col);
                event.preventDefault();
            }
        };
        
        document.addEventListener('keydown', keyboardHandler);
        this._trackEventListener(document, 'keydown', keyboardHandler);
    }

    /**
     * Set processing move state
     */
    setProcessingMove(isProcessing) {
        this.isProcessingMove = isProcessing;
        
        // Update visual feedback
        if (isProcessing) {
            this.hideDropPreview();
            this.gameBoard.style.cursor = 'wait';
        } else {
            this.gameBoard.style.cursor = 'pointer';
        }
    }

    /**
     * Highlight specific column
     */
    highlightColumn(col, className = 'highlight') {
        this.clearColumnHighlights(className);
        
        for (let row = 0; row < 6; row++) {
            const slot = this.boardRenderer.getCellAt(row, col);
            if (slot) {
                slot.classList.add(className);
            }
        }
    }

    /**
     * Clear column highlights
     */
    clearColumnHighlights(className = 'highlight') {
        const highlightedSlots = this.gameBoard.querySelectorAll(`.game-slot.${className}`);
        highlightedSlots.forEach(slot => slot.classList.remove(className));
    }

    /**
     * Set callback functions for external handling
     */
    setCallbacks({ onColumnClick, onColumnHover, onColumnHoverLeave }) {
        this.onColumnClickCallback = onColumnClick;
        this.onColumnHoverCallback = onColumnHover;
        this.onColumnHoverLeaveCallback = onColumnHoverLeave;
    }

    /**
     * Track event listeners for cleanup
     * @private
     */
    _trackEventListener(element, event, handler) {
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * Check if column is valid for move
     */
    isValidColumn(col) {
        if (col < 0 || col >= 7) return false;
        
        // Check if column has empty slots
        const topSlot = this.boardRenderer.getCellAt(0, col);
        if (topSlot) {
            const disc = topSlot.querySelector('.disc');
            return disc && disc.classList.contains('empty');
        }
        
        return false;
    }

    /**
     * Get currently hovered column
     */
    getHoveredColumn() {
        return this.hoveredColumn;
    }

    /**
     * Destroy interaction handler and cleanup all event listeners
     */
    destroy() {
        // Remove all tracked event listeners
        for (const { element, event, handler } of this.eventListeners) {
            element.removeEventListener(event, handler);
        }
        this.eventListeners = [];
        
        // Clear state
        this.hideDropPreview();
        this.hoveredColumn = null;
        this.previewDisc = null;
        
        // Reset callbacks
        this.onColumnClickCallback = null;
        this.onColumnHoverCallback = null;
        this.onColumnHoverLeaveCallback = null;
    }
}