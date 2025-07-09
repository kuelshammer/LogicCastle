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
     * Apply CSS Grid styles and responsive constraints to board
     * @private
     */
    _applyBoardStyles() {
        // Use UI-Module System with Tailwind classes - container handles sizing
        this.gameBoard.className = 'game-board connect4-board game-board-cells';
        
        // Apply Connect4-specific styles with responsive constraints
        Object.assign(this.gameBoard.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            gap: '8px',
            aspectRatio: '7/6',
            background: '#1976d2',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.2)',
            width: '100%',
            height: 'auto',
            maxWidth: 'min(80vw, calc(70vh * 7 / 6))',
            maxHeight: 'min(70vh, calc(80vw * 6 / 7))'
        });
        
        console.log('🎨 Applied CSS Grid styles directly to ensure proper layout');
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
     * Create individual cell with disc placeholder
     * @private
     */
    _createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'cell game-slot'; // Both 'cell' for tests and 'game-slot' for functionality
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.index = row * this.cols + col;
        
        // Apply cell styles directly
        Object.assign(cell.style, {
            background: '#2196F3',
            borderRadius: '50%',
            border: '3px solid #1976D2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            aspectRatio: '1'
        });
        
        // Add empty disc placeholder
        const disc = document.createElement('div');
        disc.className = 'disc empty';
        
        // Apply only essential layout styles, let CSS handle colors and visibility
        Object.assign(disc.style, {
            width: '85%',
            height: '85%',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            position: 'relative',
            aspectRatio: '1',
            zIndex: '1'
        });
        
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
     * Apply CSS Grid styles to coordinate containers
     * @private
     */
    _applyCoordinateGridStyles(coordElement) {
        Object.assign(coordElement.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            width: '100%',
            maxWidth: 'min(80vw, calc(70vh * 7 / 6))',
            maxHeight: 'min(70vh, calc(80vw * 6 / 7))',
            padding: '20px', // CRITICAL: Match gameBoard padding exactly
            margin: '0.25rem auto',
            boxSizing: 'border-box'
        });
        
        console.log(`🎯 Forced CSS Grid alignment for ${coordElement.id}:`, coordElement.style);
    }

    /**
     * Create individual coordinate label
     * @private
     */
    _createCoordinateLabel(col) {
        const coord = document.createElement('div');
        coord.className = 'coord text-center font-bold text-sm';
        coord.dataset.col = col - 1; // 0-indexed for interactions
        
        Object.assign(coord.style, {
            color: '#666',
            transition: 'all 0.3s ease',
            padding: '0.25rem',
            cursor: 'pointer'
        });
        
        coord.textContent = col;
        return coord;
    }

    /**
     * Update the board display with current game state
     * Extracted from Connect4UINew.updateBoard()
     */
    updateBoard(game) {
        if (!this.initialized || !game) return;
        
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
     * Update board visual representation after move
     * Extracted from Connect4UINew.updateBoardVisual()
     */
    updateBoardVisual(row, col, player) {
        const slot = this.getCellAt(row, col);
        
        if (slot) {
            const disc = slot.querySelector('.disc');
            if (disc) {
                disc.classList.remove('empty', 'preview');
                disc.classList.add(player === 1 ? 'yellow' : 'red');
                
                // Apply player-specific colors directly
                if (player === 1) {
                    Object.assign(disc.style, {
                        background: '#FFD700', // Yellow
                        border: '3px solid #FFA000',
                        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.6)'
                    });
                } else {
                    Object.assign(disc.style, {
                        background: '#F44336', // Red
                        border: '3px solid #D32F2F',
                        boxShadow: '0 2px 8px rgba(244, 67, 54, 0.6)'
                    });
                }
                
                console.log(`🔴 Disc placed at (${row}, ${col}) for player ${player}`);
            }
        }
    }

    /**
     * Update individual disc visual based on cell value
     * @private
     */
    _updateDiscVisual(disc, cellValue) {
        if (cellValue === 0) {
            // Empty cell
            disc.className = 'disc empty';
            disc.style.background = 'transparent';
            disc.style.border = 'none';
            disc.style.boxShadow = 'none';
        } else if (cellValue === 1) {
            // Yellow player
            disc.className = 'disc yellow';
            Object.assign(disc.style, {
                background: '#FFD700',
                border: '3px solid #FFA000',
                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.6)'
            });
        } else if (cellValue === 2) {
            // Red player
            disc.className = 'disc red';
            Object.assign(disc.style, {
                background: '#F44336',
                border: '3px solid #D32F2F',
                boxShadow: '0 2px 8px rgba(244, 67, 54, 0.6)'
            });
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
     * Clear all board visual state
     */
    clearBoard() {
        for (const disc of this.discs) {
            disc.className = 'disc empty';
            disc.style.background = 'transparent';
            disc.style.border = 'none';
            disc.style.boxShadow = 'none';
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