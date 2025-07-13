/**
 * LGameBoardRenderer - L-Game Board Rendering & Visual Updates
 * 
 * Adapted from Connect4/Gomoku BoardRenderer for 4x4 L-Game board.
 * Handles L-piece visualization, neutral pieces, and board state management.
 * 
 * Responsibilities:
 * - 4x4 Board DOM creation & styling
 * - L-piece rendering with 8 orientations (4 rotations + 4 mirrored)
 * - Neutral piece management
 * - Move validation highlighting
 * - Board state visual updates
 */

export class LGameBoardRenderer {
    constructor(gameBoard) {
        this.gameBoard = gameBoard;
        
        // Board configuration
        this.boardSize = 4;  // 4x4 L-Game board
        this.cells = [];
        
        // Piece state tracking
        this.pieces = {
            player1: { type: 'lpiece', cells: [], orientation: 0 },
            player2: { type: 'lpiece', cells: [], orientation: 0 },
            neutral1: { type: 'neutral', cell: null },
            neutral2: { type: 'neutral', cell: null }
        };
        
        // Visual state
        this.initialized = false;
        this.selectedPiece = null;
        this.highlightedCells = new Set();
    }

    /**
     * Initialize method for compatibility with ui-production.js
     */
    async init() {
        return this.initializeBoard();
    }

    /**
     * Create board method for compatibility with ui-production.js
     */
    async createBoard() {
        return this.initializeBoard();
    }

    /**
     * Initialize the L-Game board (4x4 grid)
     */
    initializeBoard() {
        if (!this.gameBoard) {
            console.error('❌ Game board element not found');
            return false;
        }

        // Clear existing board
        this.gameBoard.innerHTML = '';
        this.cells = [];
        
        // Apply L-Game board styles
        this._applyBoardStyles();
        
        // Create 4x4 grid (16 cells total)
        this._createBoardCells();
        
        console.log(`🧩 L-Game board initialized (${this.boardSize}x${this.boardSize} grid, ${this.cells.length} cells)`);
        
        this.initialized = true;
        return true;
    }

    /**
     * Apply CSS Grid styles for 4x4 L-Game board
     * @private
     */
    _applyBoardStyles() {
        this.gameBoard.className = 'game-board lgame-board';
        
        // Apply L-Game specific styles
        Object.assign(this.gameBoard.style, {
            display: 'grid',
            gridTemplateColumns: `repeat(${this.boardSize}, 1fr)`,
            gridTemplateRows: `repeat(${this.boardSize}, 1fr)`,
            gap: '4px',
            aspectRatio: '1/1',
            background: 'linear-gradient(45deg, #8B4513, #A0522D)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '3px solid #654321',
            width: '320px',
            height: '320px',
            margin: '1rem auto',
            position: 'relative'
        });
        
        console.log('🎨 Applied CSS Grid styles for 4x4 L-Game board');
    }

    /**
     * Create all board cells
     * @private
     */
    _createBoardCells() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this._createCell(row, col);
                this.cells.push(cell);
                this.gameBoard.appendChild(cell);
            }
        }
    }

    /**
     * Create a single board cell
     * @private
     */
    _createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.index = row * this.boardSize + col;
        
        // Apply cell styles
        Object.assign(cell.style, {
            background: 'linear-gradient(45deg, #F5DEB3, #FFEFD5)',
            border: '2px solid #8B4513',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            userSelect: 'none',
            borderRadius: '4px'
        });
        
        return cell;
    }

    /**
     * Get cell at specific position
     */
    getCellAt(row, col) {
        return this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Get cell by index (0-15)
     */
    getCellByIndex(index) {
        return this.gameBoard.querySelector(`[data-index="${index}"]`);
    }

    /**
     * Place L-piece at position with orientation
     */
    placeLPiece(player, positions, orientation = 0) {
        if (!Array.isArray(positions) || positions.length !== 4) {
            console.warn('⚠️ Invalid L-piece positions - need exactly 4 positions');
            return false;
        }

        // Clear previous L-piece for this player
        this.clearLPiece(player);

        // Place new L-piece
        positions.forEach((pos, index) => {
            const [row, col] = pos;
            const cell = this.getCellAt(row, col);
            if (cell) {
                const piece = this._createLPiece(player, index === 0); // first position is the corner
                cell.appendChild(piece);
                
                // Track piece state
                this.pieces[player].cells.push({ row, col, cell });
            }
        });

        this.pieces[player].orientation = orientation;
        console.log(`🧩 Placed L-piece for ${player} at positions:`, positions);
        return true;
    }

    /**
     * Create L-piece element
     * @private
     */
    _createLPiece(player, isCorner = false) {
        const piece = document.createElement('div');
        piece.className = `lpiece ${player} placing`;
        
        // Apply L-piece styles based on player
        const playerStyles = {
            player1: {
                background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                border: '2px solid #1B5E20'
            },
            player2: {
                background: 'linear-gradient(135deg, #2196F3, #1565C0)',
                border: '2px solid #0D47A1'
            }
        };

        Object.assign(piece.style, {
            width: '100%',
            height: '100%',
            borderRadius: '4px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            ...playerStyles[player]
        });

        // Add corner indicator for the corner piece
        if (isCorner) {
            const cornerIndicator = document.createElement('div');
            cornerIndicator.className = 'corner-indicator';
            Object.assign(cornerIndicator.style, {
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '6px',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '50%'
            });
            piece.appendChild(cornerIndicator);
        }

        return piece;
    }

    /**
     * Clear L-piece for player
     */
    clearLPiece(player) {
        this.pieces[player].cells.forEach(({ cell }) => {
            const piece = cell.querySelector('.lpiece');
            if (piece) {
                piece.remove();
            }
        });
        this.pieces[player].cells = [];
    }

    /**
     * Place neutral piece at position
     */
    placeNeutralPiece(neutralId, row, col) {
        const cell = this.getCellAt(row, col);
        if (!cell) {
            console.warn(`⚠️ Cell not found at (${row}, ${col})`);
            return false;
        }

        // Clear previous neutral piece
        this.clearNeutralPiece(neutralId);

        // Create and place neutral piece
        const piece = this._createNeutralPiece();
        cell.appendChild(piece);

        // Track piece state
        this.pieces[neutralId] = { type: 'neutral', cell: { row, col, element: cell } };

        console.log(`🔴 Placed neutral piece ${neutralId} at (${row}, ${col})`);
        return true;
    }

    /**
     * Create neutral piece element
     * @private
     */
    _createNeutralPiece() {
        const piece = document.createElement('div');
        piece.className = 'neutral-piece placing';
        
        Object.assign(piece.style, {
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF5722, #D84315)',
            border: '2px solid #BF360C',
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)'
        });

        return piece;
    }

    /**
     * Clear neutral piece
     */
    clearNeutralPiece(neutralId) {
        if (this.pieces[neutralId] && this.pieces[neutralId].cell) {
            const cell = this.pieces[neutralId].cell.element;
            const piece = cell.querySelector('.neutral-piece');
            if (piece) {
                piece.remove();
            }
            this.pieces[neutralId].cell = null;
        }
    }

    /**
     * Clear all pieces from board
     */
    clearBoard() {
        this.cells.forEach(cell => {
            // Remove all pieces
            const pieces = cell.querySelectorAll('.lpiece, .neutral-piece');
            pieces.forEach(piece => piece.remove());
            
            // Clear all cell states
            cell.classList.remove(
                'highlighted', 'selected', 'valid-move', 'invalid-move',
                'blockade-threat', 'winning-position', 'move-preview'
            );
        });
        
        // Reset piece tracking
        this.pieces = {
            player1: { type: 'lpiece', cells: [], orientation: 0 },
            player2: { type: 'lpiece', cells: [], orientation: 0 },
            neutral1: { type: 'neutral', cell: null },
            neutral2: { type: 'neutral', cell: null }
        };

        this.selectedPiece = null;
        this.highlightedCells.clear();
        
        console.log('🧹 L-Game board cleared');
    }

    /**
     * Highlight valid moves for current selection
     */
    highlightValidMoves(validPositions) {
        this.clearHighlights();
        
        if (!Array.isArray(validPositions)) return;

        validPositions.forEach(position => {
            let row, col;
            if (Array.isArray(position)) {
                [row, col] = position;
            } else {
                row = position.row;
                col = position.col;
            }
            
            const cell = this.getCellAt(row, col);
            if (cell) {
                cell.classList.add('valid-move');
                this.highlightedCells.add(cell);
            }
        });

        console.log(`💡 Highlighted ${validPositions.length} valid moves`);
    }

    /**
     * Show invalid move feedback
     */
    showInvalidMove(row, col) {
        const cell = this.getCellAt(row, col);
        if (cell) {
            cell.classList.add('invalid-move');
            
            // Auto-remove after animation
            setTimeout(() => {
                cell.classList.remove('invalid-move');
            }, 1000);
        }
    }

    /**
     * Select piece at position
     */
    selectPiece(row, col) {
        this.clearSelection();
        
        const cell = this.getCellAt(row, col);
        if (cell) {
            cell.classList.add('selected');
            this.selectedPiece = { row, col, cell };
        }
    }

    /**
     * Clear current selection
     */
    clearSelection() {
        if (this.selectedPiece) {
            this.selectedPiece.cell.classList.remove('selected');
            this.selectedPiece = null;
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        this.highlightedCells.forEach(cell => {
            cell.classList.remove('valid-move', 'highlighted', 'move-preview');
        });
        this.highlightedCells.clear();
    }

    /**
     * Show blockade threat warning
     */
    showBlockadeThreat(positions) {
        if (!Array.isArray(positions)) return;

        positions.forEach(position => {
            const [row, col] = position;
            const cell = this.getCellAt(row, col);
            if (cell) {
                cell.classList.add('blockade-threat');
            }
        });
    }

    /**
     * Show winning position
     */
    showWinningPosition(player) {
        // Highlight the winning player's L-piece
        this.pieces[player].cells.forEach(({ cell }) => {
            cell.classList.add('winning-position');
        });
    }

    /**
     * Update board from game state
     */
    updateFromGameState(gameState) {
        this.clearBoard();
        
        if (!gameState) return;

        // Place L-pieces
        if (gameState.player1_lpiece) {
            this.placeLPiece('player1', gameState.player1_lpiece.positions, gameState.player1_lpiece.orientation);
        }
        if (gameState.player2_lpiece) {
            this.placeLPiece('player2', gameState.player2_lpiece.positions, gameState.player2_lpiece.orientation);
        }

        // Place neutral pieces
        if (gameState.neutral1) {
            this.placeNeutralPiece('neutral1', gameState.neutral1.row, gameState.neutral1.col);
        }
        if (gameState.neutral2) {
            this.placeNeutralPiece('neutral2', gameState.neutral2.row, gameState.neutral2.col);
        }

        console.log('🔄 Board updated from game state');
    }

    /**
     * Get current board state
     */
    getBoardState() {
        return {
            pieces: { ...this.pieces },
            selectedPiece: this.selectedPiece,
            highlightedCells: Array.from(this.highlightedCells)
        };
    }

    /**
     * Check if position is empty
     */
    isPositionEmpty(row, col) {
        const cell = this.getCellAt(row, col);
        return cell && !cell.querySelector('.lpiece, .neutral-piece');
    }

    /**
     * Check if position is valid
     */
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    /**
     * Get piece at position
     */
    getPieceAt(row, col) {
        const cell = this.getCellAt(row, col);
        if (!cell) return null;

        const lpiece = cell.querySelector('.lpiece');
        if (lpiece) {
            const player = lpiece.classList.contains('player1') ? 'player1' : 'player2';
            return { type: 'lpiece', player };
        }

        const neutral = cell.querySelector('.neutral-piece');
        if (neutral) {
            return { type: 'neutral' };
        }

        return null;
    }

    /**
     * Get all cells
     */
    getAllCells() {
        return this.cells;
    }
}