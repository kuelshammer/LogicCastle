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
     * Apply modern Tailwind CSS Grid styles with glassmorphism
     * @private
     */
    _applyBoardStyles() {
        // Modern Tailwind approach with glassmorphism
        this.gameBoard.className = 'grid grid-cols-7 grid-rows-6 gap-2 p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 shadow-2xl max-w-2xl mx-auto aspect-[7/6]';
        
        // Add glassmorphism overlay effect
        this.gameBoard.style.backdropFilter = 'blur(10px)';
        this.gameBoard.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(29, 78, 216, 0.9))';
        this.gameBoard.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        
        console.log('🎨 Applied modern Tailwind CSS Grid with glassmorphism');
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
     * Create individual cell with disc placeholder using Tailwind classes
     * @private
     */
    _createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'cell game-slot flex items-center justify-center relative cursor-pointer aspect-square rounded-full bg-blue-500 border-4 border-blue-800 hover:bg-blue-400 transition-all duration-200';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.index = row * this.cols + col;
        
        // Add glassmorphism effect for cells
        cell.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.9), rgba(29, 78, 216, 0.8))';
        cell.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
        
        // Add empty disc placeholder with Tailwind
        const disc = document.createElement('div');
        disc.className = 'disc empty w-[85%] h-[85%] rounded-full transition-all duration-300 relative';
        
        // Modern glassmorphism for empty disc slots
        disc.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))';
        disc.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        disc.style.backdropFilter = 'blur(8px)';
        disc.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.1)';
        
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