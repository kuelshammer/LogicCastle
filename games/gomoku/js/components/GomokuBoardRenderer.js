/**
 * GomokuBoardRenderer - Gomoku Board Rendering & Visual Updates
 * 
 * Adapted from Connect4 BoardRenderer for 15x15 Gomoku board.
 * Handles all board creation, intersection management, and visual updates.
 * 
 * Responsibilities:
 * - Board DOM creation & styling
 * - Intersection management (15x15 = 225 intersections)
 * - Stone placement and updates
 * - Board state visual updates
 * - Responsive sizing & layout
 */

export class GomokuBoardRenderer {
    constructor(gameBoard) {
        this.gameBoard = gameBoard;
        
        // Board configuration
        this.boardSize = 15;
        this.intersections = [];
        this.stones = [];
        
        // Visual state
        this.initialized = false;
        
        // Star points (traditional Gomoku board markings)
        this.starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];
    }

    /**
     * Initialize the Gomoku board (15x15 grid)
     * Adapted from Connect4 BoardRenderer.initializeBoard()
     */
    initializeBoard() {
        if (!this.gameBoard) {
            console.error('❌ Game board element not found');
            return false;
        }

        // Clear existing board
        this.gameBoard.innerHTML = '';
        this.intersections = [];
        this.stones = [];
        
        // Apply Gomoku board styles
        this._applyBoardStyles();
        
        // Create 15x15 grid (225 intersections total)
        this._createBoardIntersections();
        
        console.log(`⚫ Gomoku board initialized (${this.boardSize}x${this.boardSize} grid, ${this.intersections.length} intersections)`);
        console.log(`🔍 DEBUG: Created ${this.intersections.length} intersections`);
        console.log(`🔍 DEBUG: GameBoard innerHTML length: ${this.gameBoard.innerHTML.length}`);
        
        if (this.intersections.length > 0) {
            console.log(`🔍 DEBUG: First intersection structure: ${this.intersections[0].outerHTML}`);
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
        this.gameBoard.className = 'game-board gomoku-board game-board-intersections';
        
        // Apply Gomoku-specific styles with responsive constraints
        Object.assign(this.gameBoard.style, {
            display: 'grid',
            gridTemplateColumns: `repeat(${this.boardSize}, 1fr)`,
            gridTemplateRows: `repeat(${this.boardSize}, 1fr)`,
            gap: '1px',
            aspectRatio: '1/1',
            background: 'linear-gradient(45deg, #8B4513, #A0522D)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '3px solid #654321',
            width: '600px',
            height: '600px',
            margin: '1rem auto',
            position: 'relative'
        });
        
        console.log('🎨 Applied CSS Grid styles for 15x15 Gomoku board');
    }

    /**
     * Create all board intersections
     * @private
     */
    _createBoardIntersections() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = this._createIntersection(row, col);
                this.intersections.push(intersection);
                this.gameBoard.appendChild(intersection);
            }
        }
    }

    /**
     * Create a single intersection element
     * @private
     */
    _createIntersection(row, col) {
        const intersection = document.createElement('div');
        intersection.className = 'intersection';
        intersection.dataset.row = row;
        intersection.dataset.col = col;
        
        // Add star point marking if applicable
        if (this._isStarPoint(row, col)) {
            intersection.classList.add('star-point');
        }
        
        // Apply intersection styles
        Object.assign(intersection.style, {
            background: 'linear-gradient(45deg, #DEB887, #F5DEB3)',
            border: '1px solid #8B4513',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            userSelect: 'none'
        });
        
        return intersection;
    }

    /**
     * Check if position is a star point
     * @private
     */
    _isStarPoint(row, col) {
        return this.starPoints.some(([starRow, starCol]) => starRow === row && starCol === col);
    }

    /**
     * Place a stone at specific position
     */
    placeStone(row, col, player) {
        const intersection = this.getIntersectionAt(row, col);
        if (!intersection) {
            console.warn(`⚠️ Intersection not found at (${row}, ${col})`);
            return false;
        }

        // Remove any existing stone
        const existingStone = intersection.querySelector('.stone');
        if (existingStone) {
            existingStone.remove();
        }

        // Create new stone
        const stone = this._createStone(player);
        intersection.appendChild(stone);

        // Add last move indicator
        this._clearLastMoveIndicators();
        intersection.classList.add('last-move');

        console.log(`⚫ Stone placed at (${row}, ${col}) for player ${player}`);
        return true;
    }

    /**
     * Create a stone element
     * @private
     */
    _createStone(player) {
        const stone = document.createElement('div');
        stone.className = `stone ${player === 1 ? 'black' : 'white'} placing`;
        
        // Apply stone styles
        Object.assign(stone.style, {
            width: '85%',
            height: '85%',
            borderRadius: '50%',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            position: 'relative'
        });

        if (player === 1) { // Black stone
            Object.assign(stone.style, {
                background: 'radial-gradient(circle at 30% 30%, #444, #000)',
                border: '2px solid #222'
            });
        } else { // White stone
            Object.assign(stone.style, {
                background: 'radial-gradient(circle at 30% 30%, #fff, #ddd)',
                border: '2px solid #ccc'
            });
        }

        return stone;
    }

    /**
     * Get intersection element at specific position
     */
    getIntersectionAt(row, col) {
        return this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Clear all stones from the board
     */
    clearBoard() {
        this.intersections.forEach(intersection => {
            const stone = intersection.querySelector('.stone');
            if (stone) {
                stone.remove();
            }
            intersection.classList.remove('last-move', 'winning-stone', 'threat-highlight', 'assistance-highlight');
        });
        
        console.log('🧹 Gomoku board cleared');
    }

    /**
     * Update board from game state
     */
    updateFromGameState(game) {
        if (!game || !game.getBoard) {
            console.warn('⚠️ Invalid game instance for board update');
            return;
        }

        // Clear existing stones
        this.clearBoard();

        // Get board state from game
        const board = game.getBoard();
        
        // Place stones according to game state
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cellValue = board[row] && board[row][col];
                if (cellValue && cellValue !== 0) {
                    this.placeStone(row, col, cellValue);
                }
            }
        }
    }

    /**
     * Highlight winning line
     */
    highlightWinningLine(positions) {
        if (!Array.isArray(positions)) {
            console.warn('⚠️ Invalid winning positions');
            return;
        }

        positions.forEach(([row, col]) => {
            const intersection = this.getIntersectionAt(row, col);
            if (intersection) {
                intersection.classList.add('winning-stone');
            }
        });

        console.log(`🏆 Highlighted winning line with ${positions.length} stones`);
    }

    /**
     * Clear last move indicators
     * @private
     */
    _clearLastMoveIndicators() {
        this.intersections.forEach(intersection => {
            intersection.classList.remove('last-move');
        });
    }

    /**
     * Show stone preview at position
     */
    showStonePreview(row, col, player) {
        const intersection = this.getIntersectionAt(row, col);
        if (!intersection || intersection.querySelector('.stone')) {
            return; // Position occupied
        }

        intersection.dataset.hoverPreview = player === 1 ? 'black' : 'white';
    }

    /**
     * Hide stone preview
     */
    hideStonePreview() {
        this.intersections.forEach(intersection => {
            delete intersection.dataset.hoverPreview;
        });
    }

    /**
     * Add threat highlight to intersection
     */
    addThreatHighlight(row, col) {
        const intersection = this.getIntersectionAt(row, col);
        if (intersection) {
            intersection.classList.add('threat-highlight');
        }
    }

    /**
     * Add assistance highlight to intersection  
     */
    addAssistanceHighlight(row, col) {
        const intersection = this.getIntersectionAt(row, col);
        if (intersection) {
            intersection.classList.add('assistance-highlight');
        }
    }

    /**
     * Clear all assistance highlights
     */
    clearAssistanceHighlights() {
        this.intersections.forEach(intersection => {
            intersection.classList.remove('threat-highlight', 'assistance-highlight');
        });
    }

    /**
     * Get all intersections
     */
    getAllIntersections() {
        return this.intersections;
    }

    /**
     * Check if position is valid
     */
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    /**
     * Check if position is empty
     */
    isPositionEmpty(row, col) {
        const intersection = this.getIntersectionAt(row, col);
        return intersection && !intersection.querySelector('.stone');
    }
}