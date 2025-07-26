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
        
        // Enhanced Keyboard Navigation
        this.selectedColumn = null;     // Currently selected column via keyboard
        this.keyboardMode = false;      // true = keyboard active, prevents mouse conflicts
        this.keyboardPreviewDisc = null; // Selected disc element for keyboard preview
        
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
        
        // Setup board hover events for mouse preview
        this._setupBoardHoverHandler();
        
        console.log('🎯 Column interactions set up (coordinate labels + board clicks + hover)');
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
     * Setup board hover event handler for mouse preview
     * @private
     */
    _setupBoardHoverHandler() {
        const mouseEnterHandler = (event) => {
            const slot = event.target.closest('.game-slot');
            if (slot) {
                const col = this._getColumnFromSlot(slot);
                if (col !== null) {
                    this.handleColumnHover(col);
                }
            }
        };

        const mouseLeaveHandler = (event) => {
            // Only clear hover if we're leaving the entire board
            if (!event.relatedTarget || !this.gameBoard.contains(event.relatedTarget)) {
                this.handleColumnHoverLeave();
            }
        };

        this.gameBoard.addEventListener('mouseenter', mouseEnterHandler, true);
        this.gameBoard.addEventListener('mouseleave', mouseLeaveHandler);
        
        this._trackEventListener(this.gameBoard, 'mouseenter', mouseEnterHandler);
        this._trackEventListener(this.gameBoard, 'mouseleave', mouseLeaveHandler);
    }

    /**
     * Get column index from game slot element
     * @private
     */
    _getColumnFromSlot(slot) {
        // Get slot position from data attributes or DOM position
        const col = slot.dataset.col;
        if (col !== undefined) {
            return parseInt(col);
        }

        // Fallback: Calculate from DOM position (6x7 grid)
        const slots = Array.from(this.gameBoard.querySelectorAll('.game-slot'));
        const index = slots.indexOf(slot);
        if (index >= 0) {
            return index % 7; // 7 columns
        }

        return null;
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
        if (this.isProcessingMove || this.keyboardMode) return; // Prevent mouse hover during keyboard mode
        
        this.hoveredColumn = col;
        this.showDropPreview(col);
        
        // Set data attribute for CSS styling
        this.gameBoard.setAttribute('data-hover-col', col);
        
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
        if (this.keyboardMode) return; // Don't clear during keyboard mode
        
        this.hoveredColumn = null;
        this.hideDropPreview();
        
        // Remove data attribute for CSS styling
        this.gameBoard.removeAttribute('data-hover-col');
        
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
     * Show drop preview for column with modern glassmorphism
     * Modernized with Tailwind CSS and glassmorphism effects
     */
    showDropPreview(col) {
        this.hideDropPreview(); // Clear any existing preview
        
        // Find the lowest empty slot in the column
        const slot = this._findLowestEmptySlot(col);
        if (!slot) return; // Column is full
        
        const disc = slot.querySelector('.disc');
        if (disc && disc.classList.contains('empty')) {
            // Add Tailwind classes for modern preview effect
            disc.classList.add('preview', 'ring-2', 'ring-white', 'ring-opacity-60', 'animate-pulse');
            this.previewDisc = disc;
            
            // Modern glassmorphism preview styling
            disc.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))';
            disc.style.backdropFilter = 'blur(8px)';
            disc.style.border = '2px dashed rgba(255, 255, 255, 0.7)';
            disc.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)';
        }
    }

    /**
     * Hide drop preview with clean Tailwind class removal
     * Modernized to work with Tailwind CSS classes
     */
    hideDropPreview() {
        if (this.previewDisc) {
            // Remove Tailwind classes
            this.previewDisc.classList.remove('preview', 'ring-2', 'ring-white', 'ring-opacity-60', 'animate-pulse');
            
            // Reset to original glassmorphism styling
            this.previewDisc.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))';
            this.previewDisc.style.backdropFilter = 'blur(8px)';
            this.previewDisc.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            this.previewDisc.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.1)';
            
            this.previewDisc = null;
        }
    }

    // === ENHANCED KEYBOARD NAVIGATION ===
    
    /**
     * Show keyboard selection preview (different from mouse hover)
     * @param {number} col - Column index (0-6)
     */
    showKeyboardSelection(col) {
        this.clearKeyboardSelection(); // Clear any existing keyboard selection
        
        // Enter keyboard mode
        this.keyboardMode = true;
        this.selectedColumn = col;
        
        // Temporarily disable mouse hover if active
        if (this.previewDisc) {
            this.hideDropPreview();
        }
        
        // Find the lowest empty slot in the column
        const slot = this._findLowestEmptySlot(col);
        if (!slot) return; // Column is full
        
        const disc = slot.querySelector('.disc');
        if (disc && disc.classList.contains('empty')) {
            // Add enhanced keyboard selection styling
            disc.classList.add('keyboard-selected', 'ring-4', 'ring-blue-400', 'ring-opacity-80', 'animate-pulse');
            this.keyboardPreviewDisc = disc;
            
            // Enhanced keyboard selection styling with blue theme
            disc.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0.2))';
            disc.style.backdropFilter = 'blur(12px)';
            disc.style.border = '3px solid rgba(59, 130, 246, 0.8)';
            disc.style.boxShadow = '0 0 25px rgba(59, 130, 246, 0.6), inset 0 2px 6px rgba(59, 130, 246, 0.3)';
            disc.style.transform = 'scale(1.05)';
            
            console.log(`⌨️ Keyboard selection shown for column ${col + 1}`);
        }
    }
    
    /**
     * Clear keyboard selection preview
     */
    clearKeyboardSelection() {
        if (this.keyboardPreviewDisc) {
            // Remove keyboard selection classes
            this.keyboardPreviewDisc.classList.remove('keyboard-selected', 'ring-4', 'ring-blue-400', 'ring-opacity-80', 'animate-pulse');
            
            // Reset to original glassmorphism styling
            this.keyboardPreviewDisc.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))';
            this.keyboardPreviewDisc.style.backdropFilter = 'blur(8px)';
            this.keyboardPreviewDisc.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            this.keyboardPreviewDisc.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.1)';
            this.keyboardPreviewDisc.style.transform = 'scale(1.0)';
            
            this.keyboardPreviewDisc = null;
            console.log(`⌨️ Keyboard selection cleared`);
        }
        
        // Reset keyboard mode
        this.keyboardMode = false;
        this.selectedColumn = null;
    }
    
    /**
     * Set keyboard interaction mode (prevents mouse conflicts)
     * @param {boolean} active - true to enable keyboard mode
     */
    setKeyboardMode(active) {
        this.keyboardMode = active;
        
        if (active && this.previewDisc) {
            // Hide mouse preview when keyboard becomes active
            this.hideDropPreview();
        }
        
        console.log(`⌨️ Keyboard mode: ${active ? 'ACTIVE' : 'INACTIVE'}`);
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