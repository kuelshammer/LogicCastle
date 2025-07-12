/**
 * LGameInteractionHandler - L-Game User Interaction Management
 * 
 * Adapted from Connect4 InteractionHandler for L-Game specific needs.
 * Handles all user interactions: clicks, hover, keyboard, L-piece selection and placement.
 * 
 * Responsibilities:
 * - Cell click & hover handling (4x4 grid)
 * - L-piece selection and placement preview
 * - Neutral piece placement
 * - L-piece rotation and orientation
 * - Touch/mobile interaction support
 * - Move validation & feedback
 */

export class LGameInteractionHandler {
    constructor(boardRenderer, gameBoard) {
        this.boardRenderer = boardRenderer;
        this.gameBoard = gameBoard;
        
        // Interaction state
        this.hoveredCell = null;
        this.selectedLPiece = null; // Which L-piece is selected (1 or 2)
        this.previewElements = [];
        this.isProcessingMove = false;
        this.interactionMode = 'L_PIECE'; // 'L_PIECE' or 'NEUTRAL_PIECE'
        this.currentOrientation = 0; // L-piece rotation (0-7)
        
        // Event listeners for cleanup
        this.eventListeners = [];
        
        // Callback functions
        this.onCellClickCallback = null;
        this.onCellHoverCallback = null;
        this.onCellHoverLeaveCallback = null;
        this.onLPieceSelectCallback = null;
        this.onNeutralPiecePlaceCallback = null;
    }

    /**
     * Setup all cell interactions (click, hover) for 4x4 L-Game board
     */
    setupCellInteractions() {
        if (!this.gameBoard) return;

        // Setup cell click and hover handlers
        this._setupBoardClickHandler();
        this._setupBoardHoverHandler();
        
        console.log('🎯 L-Game cell interactions set up (4x4 grid clicks + hover)');
    }

    /**
     * Setup board click event handler for L-Game
     * @private
     */
    _setupBoardClickHandler() {
        const clickHandler = (event) => {
            const cell = event.target.closest('.cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.handleCellClick(row, col);
            }
        };
        
        this.gameBoard.addEventListener('click', clickHandler);
        this._trackEventListener(this.gameBoard, 'click', clickHandler);
    }

    /**
     * Setup board hover event handler for move preview
     * @private
     */
    _setupBoardHoverHandler() {
        const mouseEnterHandler = (event) => {
            const cell = event.target.closest('.cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                if (!isNaN(row) && !isNaN(col)) {
                    this.handleCellHover(row, col);
                }
            }
        };

        const mouseLeaveHandler = (event) => {
            // Only clear hover if we're leaving the entire board
            if (!event.relatedTarget || !this.gameBoard.contains(event.relatedTarget)) {
                this.handleCellHoverLeave();
            }
        };

        this.gameBoard.addEventListener('mouseenter', mouseEnterHandler, true);
        this.gameBoard.addEventListener('mouseleave', mouseLeaveHandler);
        
        this._trackEventListener(this.gameBoard, 'mouseenter', mouseEnterHandler);
        this._trackEventListener(this.gameBoard, 'mouseleave', mouseLeaveHandler);
    }

    /**
     * Handle cell hover for L-piece placement preview
     */
    handleCellHover(row, col) {
        if (this.isProcessingMove) return;
        
        this.hoveredCell = { row, col };
        
        if (this.interactionMode === 'L_PIECE' && this.selectedLPiece) {
            this.showLPiecePreview(row, col, this.selectedLPiece, this.currentOrientation);
        } else if (this.interactionMode === 'NEUTRAL_PIECE') {
            this.showNeutralPiecePreview(row, col);
        }
        
        // Set data attribute for CSS styling
        this.gameBoard.setAttribute('data-hover-row', row);
        this.gameBoard.setAttribute('data-hover-col', col);
        
        // Callback for external handling
        if (this.onCellHoverCallback) {
            this.onCellHoverCallback(row, col);
        }
    }

    /**
     * Handle cell hover leave
     */
    handleCellHoverLeave() {
        this.hoveredCell = null;
        this.hidePreview();
        
        // Remove data attributes for CSS styling
        this.gameBoard.removeAttribute('data-hover-row');
        this.gameBoard.removeAttribute('data-hover-col');
        
        // Callback for external handling
        if (this.onCellHoverLeaveCallback) {
            this.onCellHoverLeaveCallback();
        }
    }

    /**
     * Handle cell click for L-Game moves
     */
    handleCellClick(row, col) {
        if (this.isProcessingMove) {
            console.log('Move already in progress, ignoring input');
            return;
        }

        if (row < 0 || row >= 4 || col < 0 || col >= 4) {
            console.warn(`Invalid cell click: ${row},${col}`);
            return;
        }

        // Callback for external handling (UI will handle actual move logic)
        if (this.onCellClickCallback) {
            this.onCellClickCallback(row, col, this.interactionMode, this.selectedLPiece, this.currentOrientation);
        }
    }

    /**
     * Show L-piece placement preview
     */
    showLPiecePreview(anchorRow, anchorCol, player, orientation) {
        this.hidePreview(); // Clear any existing preview
        
        // Get L-piece shape for current orientation
        const lPiecePositions = this._getLPiecePositions(anchorRow, anchorCol, orientation);
        
        if (!this._isValidLPiecePlacement(lPiecePositions)) {
            return; // Invalid placement
        }
        
        // Create preview elements
        lPiecePositions.forEach((pos, index) => {
            const [row, col] = pos;
            const cell = this.boardRenderer.getCellAt(row, col);
            if (cell) {
                const preview = document.createElement('div');
                preview.className = `l-piece-preview player-${player} ${index === 0 ? 'anchor' : 'segment'}`;
                preview.style.cssText = `
                    position: absolute;
                    top: 5%;
                    left: 5%;
                    right: 5%;
                    bottom: 5%;
                    background: ${player === 1 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
                    border: 2px dashed ${player === 1 ? '#3b82f6' : '#ef4444'};
                    border-radius: 4px;
                    z-index: 10;
                    pointer-events: none;
                `;
                
                cell.appendChild(preview);
                this.previewElements.push(preview);
            }
        });
    }

    /**
     * Show neutral piece placement preview
     */
    showNeutralPiecePreview(row, col) {
        this.hidePreview(); // Clear any existing preview
        
        const cell = this.boardRenderer.getCellAt(row, col);
        if (cell && this._isValidNeutralPiecePlacement(row, col)) {
            const preview = document.createElement('div');
            preview.className = 'neutral-piece-preview';
            preview.style.cssText = `
                position: absolute;
                top: 20%;
                left: 20%;
                right: 20%;
                bottom: 20%;
                background: rgba(255, 255, 255, 0.7);
                border: 2px dashed #ffffff;
                border-radius: 50%;
                z-index: 10;
                pointer-events: none;
            `;
            
            cell.appendChild(preview);
            this.previewElements.push(preview);
        }
    }

    /**
     * Hide all preview elements
     */
    hidePreview() {
        this.previewElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.previewElements = [];
    }

    /**
     * Get L-piece positions for given anchor and orientation
     * @private
     */
    _getLPiecePositions(anchorRow, anchorCol, orientation) {
        // L-piece orientations (relative to anchor point)
        const orientations = [
            [[0, 0], [1, 0], [2, 0], [0, 1]], // L (normal)
            [[0, 0], [0, 1], [0, 2], [1, 0]], // L (rotated 90°)
            [[0, 0], [0, 1], [1, 1], [2, 1]], // L (rotated 180°)
            [[0, 0], [1, 0], [1, -1], [1, -2]], // L (rotated 270°)
            [[0, 0], [1, 0], [2, 0], [0, -1]], // L (flipped)
            [[0, 0], [0, 1], [0, 2], [-1, 0]], // L (flipped + 90°)
            [[0, 0], [0, -1], [1, -1], [2, -1]], // L (flipped + 180°)
            [[0, 0], [-1, 0], [-1, 1], [-1, 2]]  // L (flipped + 270°)
        ];
        
        const relativePositions = orientations[orientation % 8];
        return relativePositions.map(([dRow, dCol]) => [
            anchorRow + dRow,
            anchorCol + dCol
        ]);
    }

    /**
     * Check if L-piece placement is valid
     * @private
     */
    _isValidLPiecePlacement(positions) {
        return positions.every(([row, col]) => {
            // Check bounds
            if (row < 0 || row >= 4 || col < 0 || col >= 4) return false;
            
            // Check if cell is empty (would need to check with game state)
            // For now, just check bounds
            return true;
        });
    }

    /**
     * Check if neutral piece placement is valid
     * @private
     */
    _isValidNeutralPiecePlacement(row, col) {
        // Check bounds
        if (row < 0 || row >= 4 || col < 0 || col >= 4) return false;
        
        // Check if cell is empty (would need to check with game state)
        return true;
    }

    /**
     * Setup keyboard interactions for L-Game
     */
    setupKeyboardInteractions() {
        const keyboardHandler = (event) => {
            const key = event.key.toLowerCase();
            
            switch (key) {
                case 'r':
                    // Rotate L-piece
                    this.rotateCurrentLPiece();
                    event.preventDefault();
                    break;
                case '1':
                    // Select player 1 L-piece
                    this.selectLPiece(1);
                    event.preventDefault();
                    break;
                case '2':
                    // Select player 2 L-piece
                    this.selectLPiece(2);
                    event.preventDefault();
                    break;
                case 'n':
                    // Switch to neutral piece mode
                    this.setInteractionMode('NEUTRAL_PIECE');
                    event.preventDefault();
                    break;
                case 'l':
                    // Switch to L-piece mode
                    this.setInteractionMode('L_PIECE');
                    event.preventDefault();
                    break;
            }
        };
        
        document.addEventListener('keydown', keyboardHandler);
        this._trackEventListener(document, 'keydown', keyboardHandler);
    }

    /**
     * Select which L-piece to place
     */
    selectLPiece(player) {
        this.selectedLPiece = player;
        this.setInteractionMode('L_PIECE');
        
        console.log(`Selected L-piece for player ${player}`);
        
        if (this.onLPieceSelectCallback) {
            this.onLPieceSelectCallback(player);
        }
    }

    /**
     * Rotate current L-piece orientation
     */
    rotateCurrentLPiece() {
        this.currentOrientation = (this.currentOrientation + 1) % 8;
        
        // Update preview if hovering
        if (this.hoveredCell && this.selectedLPiece) {
            this.showLPiecePreview(
                this.hoveredCell.row, 
                this.hoveredCell.col, 
                this.selectedLPiece, 
                this.currentOrientation
            );
        }
        
        console.log(`Rotated L-piece to orientation ${this.currentOrientation}`);
    }

    /**
     * Set interaction mode
     */
    setInteractionMode(mode) {
        this.interactionMode = mode;
        this.hidePreview();
        
        // Update cursor style
        if (mode === 'L_PIECE') {
            this.gameBoard.style.cursor = 'crosshair';
        } else if (mode === 'NEUTRAL_PIECE') {
            this.gameBoard.style.cursor = 'pointer';
        }
        
        console.log(`Interaction mode set to: ${mode}`);
    }

    /**
     * Set processing move state
     */
    setProcessingMove(isProcessing) {
        this.isProcessingMove = isProcessing;
        
        // Update visual feedback
        if (isProcessing) {
            this.hidePreview();
            this.gameBoard.style.cursor = 'wait';
        } else {
            this.gameBoard.style.cursor = this.interactionMode === 'L_PIECE' ? 'crosshair' : 'pointer';
        }
    }

    /**
     * Highlight specific cell
     */
    highlightCell(row, col, className = 'highlight') {
        this.clearCellHighlights(className);
        
        const cell = this.boardRenderer.getCellAt(row, col);
        if (cell) {
            cell.classList.add(className);
        }
    }

    /**
     * Clear cell highlights
     */
    clearCellHighlights(className = 'highlight') {
        const highlightedCells = this.gameBoard.querySelectorAll(`.cell.${className}`);
        highlightedCells.forEach(cell => cell.classList.remove(className));
    }

    /**
     * Set callback functions for external handling
     */
    setCallbacks({ 
        onCellClick, 
        onCellHover, 
        onCellHoverLeave, 
        onLPieceSelect, 
        onNeutralPiecePlace 
    }) {
        this.onCellClickCallback = onCellClick;
        this.onCellHoverCallback = onCellHover;
        this.onCellHoverLeaveCallback = onCellHoverLeave;
        this.onLPieceSelectCallback = onLPieceSelect;
        this.onNeutralPiecePlaceCallback = onNeutralPiecePlace;
    }

    /**
     * Track event listeners for cleanup
     * @private
     */
    _trackEventListener(element, event, handler) {
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * Get current interaction state
     */
    getInteractionState() {
        return {
            mode: this.interactionMode,
            selectedLPiece: this.selectedLPiece,
            orientation: this.currentOrientation,
            hoveredCell: this.hoveredCell
        };
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
        this.hidePreview();
        this.hoveredCell = null;
        this.selectedLPiece = null;
        this.previewElements = [];
        
        // Reset callbacks
        this.onCellClickCallback = null;
        this.onCellHoverCallback = null;
        this.onCellHoverLeaveCallback = null;
        this.onLPieceSelectCallback = null;
        this.onNeutralPiecePlaceCallback = null;
    }
}