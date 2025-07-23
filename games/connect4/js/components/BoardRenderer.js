/**
 * BoardRenderer - Connect4 Board Rendering & Visual Updates
 * 
 * Extracted from Connect4UINew for focused responsibility.
 * Handles all board creation, coordinate labels, and visual updates.
 * 
 * Responsibilities:
 * - Board DOM creation & styling
 * - Coordinate label management
 * - Board state visual updates
 * - Responsive sizing & layout
 */

export class BoardRenderer {
    constructor(gameBoard, topCoords, bottomCoords) {
        this.gameBoard = gameBoard;
        this.topCoords = topCoords;
        this.bottomCoords = bottomCoords;
        
        // Board configuration
        this.rows = 6;
        this.cols = 7;
        this.cells = [];
        this.discs = [];
        
        // Visual state
        this.initialized = false;
    }

    /**
     * Initialize the Connect4 board (6x7 grid)
     * Extracted from Connect4UINew.initializeBoard()
     */
    initializeBoard() {
        if (!this.gameBoard) {
            console.error('❌ Game board element not found');
            return false;
        }

        // Clear existing board
        this.gameBoard.innerHTML = '';
        this.cells = [];
        this.discs = [];
        
        // Apply Connect4 board styles
        this._applyBoardStyles();
        
        // Create 6x7 grid (42 cells total)
        this._createBoardCells();
        
        console.log(`🔴 Connect4 board initialized (${this.rows}x${this.cols} grid, ${this.cells.length} cells)`);
        console.log(`🔍 DEBUG: Created ${this.cells.length} cells and ${this.discs.length} discs`);
        console.log(`🔍 DEBUG: GameBoard innerHTML length: ${this.gameBoard.innerHTML.length}`);
        
        if (this.cells.length > 0) {
            console.log(`🔍 DEBUG: First cell structure: ${this.cells[0].outerHTML}`);
        }
        
        this.initialized = true;
        return true;
    }

    /**
     * Apply pure Tailwind CSS Grid styles - NO inline styles
     * @private
     */
    _applyBoardStyles() {
        // Pure Tailwind approach - no inline styles needed
        this.gameBoard.className = 'game-board grid grid-cols-7 grid-rows-6 gap-2 p-4 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-600 to-blue-800 aspect-[7/6] max-w-2xl mx-auto';
        
        console.log('🎨 Applied pure Tailwind CSS Grid - No inline styles');
    }

    /**
     * Create all board cells and disc placeholders
     * @private
     */
    _createBoardCells() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const { cell, disc } = this._createCell(row, col);
                
                this.cells.push(cell);
                this.discs.push(disc);
                this.gameBoard.appendChild(cell);
            }
        }
    }

    /**
     * Create individual cell with disc placeholder using pure Tailwind classes
     * @private
     */
    _createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'game-slot w-full h-full min-h-[30px] rounded-full border-2 border-blue-700 bg-blue-500 flex items-center justify-center relative cursor-pointer aspect-square transition-all duration-200 hover:scale-105';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.index = row * this.cols + col;
        
        // Add empty disc placeholder with pure Tailwind
        const disc = document.createElement('div');
        disc.className = 'disc empty w-[85%] h-[85%] min-w-[25px] min-h-[25px] rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 aspect-square transition-all duration-500';
        
        cell.appendChild(disc);
        
        return { cell, disc };
    }

    /**
     * Create coordinate labels for columns
     * Extracted from Connect4UINew.createCoordinateLabels()
     */
    createCoordinateLabels() {
        // Ensure coordinate containers exist
        this._ensureCoordinateContainers();
        
        // Create top coordinate labels
        this._createTopCoordinates();
        
        // Create bottom coordinate labels
        this._createBottomCoordinates();
        
        console.log('🔢 Coordinate labels created for all 7 columns');
    }

    /**
     * Ensure coordinate containers exist in DOM
     * @private
     */
    _ensureCoordinateContainers() {
        if (!this.topCoords) {
            this.topCoords = document.getElementById('topCoords');
            if (!this.topCoords && this.gameBoard?.parentElement) {
                this.topCoords = this._createCoordinateContainer('topCoords', true);
            }
        }
        
        if (!this.bottomCoords) {
            this.bottomCoords = document.getElementById('bottomCoords');
            if (!this.bottomCoords && this.gameBoard?.parentElement) {
                this.bottomCoords = this._createCoordinateContainer('bottomCoords', false);
            }
        }
    }

    /**
     * Create coordinate container element
     * @private
     */
    _createCoordinateContainer(id, isTop) {
        const container = this.gameBoard.parentElement;
        if (!container) return null;
        
        const coords = document.createElement('div');
        coords.id = id;
        coords.className = `board-coords ${isTop ? 'top' : 'bottom'}`;
        
        if (isTop) {
            container.insertBefore(coords, this.gameBoard);
        } else {
            container.appendChild(coords);
        }
        
        return coords;
    }

    /**
     * Create top coordinate labels
     * @private
     */
    _createTopCoordinates() {
        if (!this.topCoords) return;
        
        this._applyCoordinateGridStyles(this.topCoords);
        this.topCoords.innerHTML = '';
        
        for (let col = 1; col <= this.cols; col++) {
            const coord = this._createCoordinateLabel(col);
            this.topCoords.appendChild(coord);
        }
        
        console.log(`🔢 Created ${this.topCoords.children.length} top coord labels with FORCED CSS Grid alignment`);
    }

    /**
     * Create bottom coordinate labels
     * @private
     */
    _createBottomCoordinates() {
        if (!this.bottomCoords) return;
        
        this._applyCoordinateGridStyles(this.bottomCoords);
        this.bottomCoords.innerHTML = '';
        
        for (let col = 1; col <= this.cols; col++) {
            const coord = this._createCoordinateLabel(col);
            this.bottomCoords.appendChild(coord);
        }
        
        console.log(`🔢 Created ${this.bottomCoords.children.length} bottom coord labels with FORCED CSS Grid alignment`);
    }

    /**
     * Apply pure Tailwind CSS Grid styles to coordinate containers
     * @private
     */
    _applyCoordinateGridStyles(coordElement) {
        // Pure Tailwind approach - no inline styles
        coordElement.className = 'grid grid-cols-7 gap-2 px-4 max-w-2xl mx-auto mb-4';
        
        console.log(`🎯 Applied pure Tailwind Grid alignment for ${coordElement.id}`);
    }

    /**
     * Create individual coordinate label with pure Tailwind
     * @private
     */
    _createCoordinateLabel(col) {
        const coord = document.createElement('div');
        coord.className = 'coord text-center text-white font-bold cursor-pointer hover:bg-white hover:bg-opacity-20 py-2 rounded transition-all duration-200';
        coord.dataset.col = col - 1; // 0-indexed for interactions
        
        coord.textContent = col;
        return coord;
    }

    /**
     * Update the board display with current game state
     * Extracted from Connect4UINew.updateBoard()
     */
    updateBoard(game) {
        if (!this.initialized || !game) return;
        
        // HOTFIX: Check if game is properly initialized and has required methods
        if (!game.initialized || typeof game.getCell !== 'function') {
            console.log('⚠️ Game not ready for board update - skipping update');
            return;
        }
        
        // Update each cell based on game state
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cellValue = game.getCell(row, col);
                const disc = this.getDiscAt(row, col);
                
                if (disc) {
                    this._updateDiscVisual(disc, cellValue);
                }
            }
        }
    }

    /**
     * Update board visual representation after move - FIXED: Consistent CSS class approach
     * Extracted from Connect4UINew.updateBoardVisual()
     */
    updateBoardVisual(row, col, player) {
        const slot = this.getCellAt(row, col);
        
        if (slot) {
            const disc = slot.querySelector('.disc');
            if (disc) {
                // CRITICAL FIX: Remove all color classes to prevent conflicts
                disc.classList.remove('empty', 'yellow', 'red', 'preview', 'winning-disc');
                disc.classList.add(player === 1 ? 'yellow' : 'red');
                
                console.log(`🔴 Disc placed at (${row}, ${col}) for player ${player} using CSS classes`);
            }
        }
    }

    /**
     * Update individual disc visual based on cell value - FIXED: Consistent CSS class approach
     * @private
     */
    _updateDiscVisual(disc, cellValue) {
        // CRITICAL FIX: Use classList instead of className = to prevent Tailwind class conflicts
        // Remove all existing color classes first
        disc.classList.remove('empty', 'yellow', 'red', 'preview', 'winning-disc');
        
        if (cellValue === 0) {
            // Empty cell - only add empty class, preserve positioning
            disc.classList.add('empty');
        } else if (cellValue === 1) {
            // Yellow player - add yellow class, preserve positioning  
            disc.classList.add('yellow');
        } else if (cellValue === 2) {
            // Red player - add red class, preserve positioning
            disc.classList.add('red');
        }
        
        // Ensure base disc classes are always present (fallback)
        if (!disc.classList.contains('disc')) {
            disc.classList.add('disc');
        }
    }

    /**
     * Get cell element at specific position
     */
    getCellAt(row, col) {
        return this.gameBoard?.querySelector(
            `.game-slot[data-row="${row}"][data-col="${col}"]`
        );
    }

    /**
     * Get disc element at specific position
     */
    getDiscAt(row, col) {
        const cell = this.getCellAt(row, col);
        return cell?.querySelector('.disc');
    }

    /**
     * Clear all board visual state - FIXED: Consistent CSS class approach
     */
    clearBoard() {
        for (const disc of this.discs) {
            // CRITICAL FIX: Use classList instead of className = to preserve positioning classes
            disc.classList.remove('yellow', 'red', 'preview', 'winning-disc', 'victory-piece', 'victory-glow');
            disc.classList.add('empty');
            
            // Ensure base disc class is present
            if (!disc.classList.contains('disc')) {
                disc.classList.add('disc');
            }
        }
    }

    /**
     * Destroy board renderer and cleanup
     */
    destroy() {
        this.cells = [];
        this.discs = [];
        this.initialized = false;
        
        if (this.gameBoard) {
            this.gameBoard.innerHTML = '';
        }
    }

    /**
     * Get board dimensions
     */
    getDimensions() {
        return { rows: this.rows, cols: this.cols };
    }

    /**
     * Check if board is initialized
     */
    isInitialized() {
        return this.initialized;
    }
}