/**
 * GomokuInteractionHandler - Gomoku User Interaction Management
 * 
 * Adapted from Connect4 InteractionHandler for 15x15 Gomoku board.
 * Handles all user interactions: clicks, hover, keyboard.
 * 
 * Responsibilities:
 * - Intersection click & hover handling
 * - Stone preview system
 * - Keyboard interactions
 * - Touch/mobile interaction support
 * - Position validation & feedback
 */

export class GomokuInteractionHandler {
    constructor(game, boardRenderer, elements) {
        this.game = game;
        this.boardRenderer = boardRenderer;
        this.elements = elements;
        
        // Interaction state
        this.hoveredPosition = null;
        this.previewStone = null;
        this.isProcessingMove = false;
        
        // Event listeners for cleanup
        this.eventListeners = [];
        
        // Callback functions
        this.onPositionClickCallback = null;
        this.onPositionHoverCallback = null;
        this.onPositionHoverLeaveCallback = null;
    }

    /**
     * Setup all intersection interactions (click, hover)
     */
    setupEventHandlers(onMoveCallback) {
        this.onPositionClickCallback = onMoveCallback;
        
        if (!this.boardRenderer || !this.boardRenderer.gameBoard) {
            console.warn('⚠️ BoardRenderer not available for interaction setup');
            return;
        }

        // Setup intersection click handlers
        this._setupIntersectionClickHandlers();
        
        // Setup intersection hover handlers for stone preview
        this._setupIntersectionHoverHandlers();
        
        // Setup keyboard interactions
        this._setupKeyboardHandlers();
        
        console.log('🎯 Gomoku interaction handlers set up (intersections + keyboard + hover)');
    }

    /**
     * Setup intersection click event handlers
     * @private
     */
    _setupIntersectionClickHandlers() {
        const clickHandler = (event) => {
            const intersection = event.target.closest('.intersection');
            if (intersection) {
                const row = parseInt(intersection.dataset.row);
                const col = parseInt(intersection.dataset.col);
                this.handlePositionClick(row, col);
            }
        };

        this.boardRenderer.gameBoard.addEventListener('click', clickHandler);
        this._addEventListener(this.boardRenderer.gameBoard, 'click', clickHandler);
        
        console.log('🎯 Setup intersection click handlers for 15x15 board');
    }

    /**
     * Setup intersection hover event handlers for stone preview
     * @private
     */
    _setupIntersectionHoverHandlers() {
        const mouseEnterHandler = (event) => {
            const intersection = event.target.closest('.intersection');
            if (intersection && !intersection.querySelector('.stone')) {
                const row = parseInt(intersection.dataset.row);
                const col = parseInt(intersection.dataset.col);
                this.handlePositionHover(row, col);
            }
        };

        const mouseLeaveHandler = (event) => {
            const intersection = event.target.closest('.intersection');
            if (intersection) {
                this.handlePositionHoverLeave();
            }
        };

        this.boardRenderer.gameBoard.addEventListener('mouseenter', mouseEnterHandler, true);
        this.boardRenderer.gameBoard.addEventListener('mouseleave', mouseLeaveHandler, true);
        
        this._addEventListener(this.boardRenderer.gameBoard, 'mouseenter', mouseEnterHandler, true);
        this._addEventListener(this.boardRenderer.gameBoard, 'mouseleave', mouseLeaveHandler, true);
        
        console.log('🎯 Setup intersection hover handlers for stone preview');
    }

    /**
     * Setup keyboard interactions
     * @private
     */
    _setupKeyboardHandlers() {
        const keyHandler = (event) => {
            // Handle number keys for quick column focus (1-9, 0 for 10)
            if (event.key >= '1' && event.key <= '9') {
                const col = parseInt(event.key) - 1;
                if (col < 15) {
                    this.focusColumn(col);
                    event.preventDefault();
                }
            } else if (event.key === '0') {
                this.focusColumn(9); // 0 maps to column 10 (index 9)
                event.preventDefault();
            }
            
            // Handle letter keys for columns 11-15
            const letterColumnMap = {
                'q': 10, 'w': 11, 'e': 12, 'r': 13, 't': 14
            };
            
            if (letterColumnMap[event.key.toLowerCase()]) {
                this.focusColumn(letterColumnMap[event.key.toLowerCase()]);
                event.preventDefault();
            }
        };

        document.addEventListener('keydown', keyHandler);
        this._addEventListener(document, 'keydown', keyHandler);
        
        console.log('🎯 Setup keyboard handlers for quick column focus');
    }

    /**
     * Handle intersection click
     */
    handlePositionClick(row, col) {
        if (this.isProcessingMove) {
            console.log('⚠️ Move already in progress, ignoring click');
            return;
        }

        console.log(`🎯 Intersection clicked: (${row}, ${col})`);

        // Validate position
        if (!this.boardRenderer.isValidPosition(row, col)) {
            console.warn(`⚠️ Invalid position: (${row}, ${col})`);
            return;
        }

        // Check if position is empty
        if (!this.boardRenderer.isPositionEmpty(row, col)) {
            console.warn(`⚠️ Position already occupied: (${row}, ${col})`);
            return;
        }

        // Execute move callback
        if (this.onPositionClickCallback) {
            this.onPositionClickCallback(row, col);
        }
    }

    /**
     * Handle intersection hover
     */
    handlePositionHover(row, col) {
        if (this.isProcessingMove) return;

        this.hoveredPosition = { row, col };
        
        // Show stone preview
        this.showStonePreview(row, col);
        
        // Execute hover callback if provided
        if (this.onPositionHoverCallback) {
            this.onPositionHoverCallback(row, col);
        }
    }

    /**
     * Handle intersection hover leave
     */
    handlePositionHoverLeave() {
        this.hoveredPosition = null;
        
        // Hide stone preview
        this.hideStonePreview();
        
        // Execute hover leave callback if provided
        if (this.onPositionHoverLeaveCallback) {
            this.onPositionHoverLeaveCallback();
        }
    }

    /**
     * Show stone preview at position
     */
    showStonePreview(row, col) {
        if (!this.game || !this.boardRenderer) return;

        // Hide previous preview
        this.hideStonePreview();

        // Get current player for preview
        const currentPlayer = this.game.getCurrentPlayer ? this.game.getCurrentPlayer() : 1;
        
        // Show preview through BoardRenderer
        this.boardRenderer.showStonePreview(row, col, currentPlayer);
    }

    /**
     * Hide stone preview
     */
    hideStonePreview() {
        if (this.boardRenderer) {
            this.boardRenderer.hideStonePreview();
        }
    }

    /**
     * Focus on specific column (visual highlight)
     */
    focusColumn(col) {
        if (col < 0 || col >= 15) {
            console.warn(`⚠️ Invalid column for focus: ${col}`);
            return;
        }

        // Clear previous focus
        this._clearColumnFocus();

        // Highlight all intersections in the column
        for (let row = 0; row < 15; row++) {
            const intersection = this.boardRenderer.getIntersectionAt(row, col);
            if (intersection && this.boardRenderer.isPositionEmpty(row, col)) {
                intersection.classList.add('column-focus');
                
                // Add temporary styles for focus indication
                intersection.style.background = 'linear-gradient(45deg, #F0E68C, #FFFFE0)';
                intersection.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.6)';
            }
        }

        // Auto-clear focus after 2 seconds
        setTimeout(() => {
            this._clearColumnFocus();
        }, 2000);

        console.log(`🎯 Focused on column ${col + 1}`);
    }

    /**
     * Clear column focus styling
     * @private
     */
    _clearColumnFocus() {
        const focusedIntersections = this.boardRenderer.gameBoard.querySelectorAll('.column-focus');
        focusedIntersections.forEach(intersection => {
            intersection.classList.remove('column-focus');
            intersection.style.background = '';
            intersection.style.boxShadow = '';
        });
    }

    /**
     * Set processing state
     */
    setProcessingMove(processing) {
        this.isProcessingMove = processing;
        
        if (processing) {
            this.hideStonePreview();
        }
    }

    /**
     * Add event listener and track for cleanup
     * @private
     */
    _addEventListener(element, event, handler, useCapture = false) {
        this.eventListeners.push({ element, event, handler, useCapture });
    }

    /**
     * Clean up all event listeners
     */
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler, useCapture }) => {
            element.removeEventListener(event, handler, useCapture);
        });
        this.eventListeners = [];
        
        console.log('🧹 GomokuInteractionHandler cleaned up');
    }

    /**
     * Enable interactions
     */
    enable() {
        this.isProcessingMove = false;
        
        // Re-enable hover effects
        if (this.boardRenderer && this.boardRenderer.gameBoard) {
            this.boardRenderer.gameBoard.style.pointerEvents = 'auto';
        }
    }

    /**
     * Disable interactions
     */
    disable() {
        this.isProcessingMove = true;
        this.hideStonePreview();
        
        // Disable hover effects
        if (this.boardRenderer && this.boardRenderer.gameBoard) {
            this.boardRenderer.gameBoard.style.pointerEvents = 'none';
        }
    }

    /**
     * Get current hovered position
     */
    getHoveredPosition() {
        return this.hoveredPosition;
    }

    /**
     * Check if position is being processed
     */
    isPositionProcessing() {
        return this.isProcessingMove;
    }
}