/**
 * L-Game Coordinate Utilities
 * 
 * Specialized coordinate handling for L-Game's 4x4 board.
 * Handles L-piece positioning, neutral piece placement, and UI coordinate mapping.
 * 
 * L-Game specific requirements:
 * - 4x4 board (16 positions)
 * - L-piece shapes (4 cells each, 8 orientations)
 * - Neutral pieces (1 cell each, 2 pieces)
 * - Precise positioning for UI interactions
 */

import { CoordUtils } from '../../../assets/js/coord-utils.js';

// L-piece shape definitions (8 orientations)
// Each orientation is an array of [row_offset, col_offset] from anchor point
export const L_SHAPES = [
    [[0, 0], [1, 0], [2, 0], [2, 1]], // Standard L
    [[0, 0], [0, 1], [0, 2], [1, 0]], // 90° rotated
    [[0, 0], [0, 1], [1, 1], [2, 1]], // 180° rotated
    [[0, 2], [1, 0], [1, 1], [1, 2]], // 270° rotated
    [[0, 1], [1, 1], [2, 0], [2, 1]], // Mirrored standard
    [[0, 0], [1, 0], [1, 1], [1, 2]], // Mirrored 90°
    [[0, 0], [0, 1], [1, 0], [2, 0]], // Mirrored 180°
    [[0, 0], [0, 1], [0, 2], [1, 2]]  // Mirrored 270°
];

export const LGameCoordUtils = {
    // L-Game specific constants
    BOARD_SIZE: 4,
    L_PIECE_SIZE: 4,
    NEUTRAL_PIECE_COUNT: 2,
    
    /**
     * Get L-piece cells for given anchor position and orientation
     * @param {number} anchorRow - Anchor row (0-3)
     * @param {number} anchorCol - Anchor column (0-3)
     * @param {number} orientation - Orientation index (0-7)
     * @returns {Array<Array<number>>|null} Array of [row, col] positions or null if invalid
     */
    getLPieceCells: (anchorRow, anchorCol, orientation) => {
        if (orientation < 0 || orientation >= L_SHAPES.length) {
            return null;
        }
        
        const shape = L_SHAPES[orientation];
        const cells = [];
        
        for (const [dRow, dCol] of shape) {
            const row = anchorRow + dRow;
            const col = anchorCol + dCol;
            
            // Check if position is within 4x4 board
            if (!CoordUtils.validateCoords(row, col, LGameCoordUtils.BOARD_SIZE, LGameCoordUtils.BOARD_SIZE)) {
                return null; // L-piece extends outside board
            }
            
            cells.push([row, col]);
        }
        
        return cells;
    },
    
    /**
     * Check if L-piece placement is valid (within bounds)
     * @param {number} anchorRow - Anchor row
     * @param {number} anchorCol - Anchor column  
     * @param {number} orientation - Orientation index
     * @returns {boolean} True if placement is valid
     */
    isValidLPiecePlacement: (anchorRow, anchorCol, orientation) => {
        const cells = LGameCoordUtils.getLPieceCells(anchorRow, anchorCol, orientation);
        return cells !== null;
    },
    
    /**
     * Get all valid L-piece placements for given orientation
     * @param {number} orientation - Orientation index (0-7)
     * @returns {Array<Object>} Array of {anchorRow, anchorCol} objects
     */
    getValidLPiecePlacements: (orientation) => {
        const placements = [];
        
        for (let row = 0; row < LGameCoordUtils.BOARD_SIZE; row++) {
            for (let col = 0; col < LGameCoordUtils.BOARD_SIZE; col++) {
                if (LGameCoordUtils.isValidLPiecePlacement(row, col, orientation)) {
                    placements.push({ anchorRow: row, anchorCol: col });
                }
            }
        }
        
        return placements;
    },
    
    /**
     * Get all valid L-piece placements for all orientations
     * @returns {Object} Object with orientation as key, placements array as value
     */
    getAllValidLPiecePlacements: () => {
        const allPlacements = {};
        
        for (let orientation = 0; orientation < L_SHAPES.length; orientation++) {
            allPlacements[orientation] = LGameCoordUtils.getValidLPiecePlacements(orientation);
        }
        
        return allPlacements;
    },
    
    /**
     * Check if two L-pieces overlap
     * @param {Object} piece1 - {anchorRow, anchorCol, orientation}
     * @param {Object} piece2 - {anchorRow, anchorCol, orientation}
     * @returns {boolean} True if pieces overlap
     */
    doLPiecesOverlap: (piece1, piece2) => {
        const cells1 = LGameCoordUtils.getLPieceCells(piece1.anchorRow, piece1.anchorCol, piece1.orientation);
        const cells2 = LGameCoordUtils.getLPieceCells(piece2.anchorRow, piece2.anchorCol, piece2.orientation);
        
        if (!cells1 || !cells2) {
            return true; // Invalid pieces are considered overlapping
        }
        
        // Check for any common cells
        for (const [row1, col1] of cells1) {
            for (const [row2, col2] of cells2) {
                if (row1 === row2 && col1 === col2) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * Check if L-piece overlaps with neutral pieces
     * @param {Object} lPiece - {anchorRow, anchorCol, orientation}
     * @param {Array<Array<number>>} neutralPositions - Array of [row, col] positions
     * @returns {boolean} True if overlap exists
     */
    doesLPieceOverlapNeutrals: (lPiece, neutralPositions) => {
        const lCells = LGameCoordUtils.getLPieceCells(lPiece.anchorRow, lPiece.anchorCol, lPiece.orientation);
        
        if (!lCells) {
            return true; // Invalid L-piece
        }
        
        for (const [lRow, lCol] of lCells) {
            for (const [nRow, nCol] of neutralPositions) {
                if (lRow === nRow && lCol === nCol) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * Get all free positions on board (not occupied by L-pieces or neutral pieces)
     * @param {Object} player1LPiece - Player 1 L-piece
     * @param {Object} player2LPiece - Player 2 L-piece
     * @param {Array<Array<number>>} neutralPositions - Neutral piece positions
     * @returns {Array<Array<number>>} Array of free [row, col] positions
     */
    getFreePositions: (player1LPiece, player2LPiece, neutralPositions) => {
        const occupiedCells = new Set();
        
        // Add L-piece cells
        const p1Cells = LGameCoordUtils.getLPieceCells(player1LPiece.anchorRow, player1LPiece.anchorCol, player1LPiece.orientation);
        const p2Cells = LGameCoordUtils.getLPieceCells(player2LPiece.anchorRow, player2LPiece.anchorCol, player2LPiece.orientation);
        
        if (p1Cells) {
            p1Cells.forEach(([row, col]) => occupiedCells.add(`${row},${col}`));
        }
        if (p2Cells) {
            p2Cells.forEach(([row, col]) => occupiedCells.add(`${row},${col}`));
        }
        
        // Add neutral piece cells
        neutralPositions.forEach(([row, col]) => occupiedCells.add(`${row},${col}`));
        
        // Find free positions
        const freePositions = [];
        for (let row = 0; row < LGameCoordUtils.BOARD_SIZE; row++) {
            for (let col = 0; col < LGameCoordUtils.BOARD_SIZE; col++) {
                if (!occupiedCells.has(`${row},${col}`)) {
                    freePositions.push([row, col]);
                }
            }
        }
        
        return freePositions;
    },
    
    /**
     * Convert pixel coordinates to board coordinates for L-Game UI
     * @param {number} pixelX - X pixel coordinate
     * @param {number} pixelY - Y pixel coordinate
     * @param {number} boardSizePx - Board size in pixels
     * @param {number} paddingPx - Board padding in pixels
     * @returns {Array<number>|null} [row, col] or null if outside
     */
    pixelToBoard: (pixelX, pixelY, boardSizePx, paddingPx = 0) => {
        const cellSize = (boardSizePx - 2 * paddingPx) / LGameCoordUtils.BOARD_SIZE;
        
        const gridX = (pixelX - paddingPx) / cellSize;
        const gridY = (pixelY - paddingPx) / cellSize;
        
        const col = Math.floor(gridX);
        const row = Math.floor(gridY);
        
        if (CoordUtils.validateCoords(row, col, LGameCoordUtils.BOARD_SIZE, LGameCoordUtils.BOARD_SIZE)) {
            return [row, col];
        }
        
        return null;
    },
    
    /**
     * Convert board coordinates to pixel coordinates for L-Game UI
     * @param {number} row - Row coordinate (0-3)
     * @param {number} col - Column coordinate (0-3)
     * @param {number} boardSizePx - Board size in pixels
     * @param {number} paddingPx - Board padding in pixels
     * @returns {Array<number>} [pixelX, pixelY]
     */
    boardToPixel: (row, col, boardSizePx, paddingPx = 0) => {
        const cellSize = (boardSizePx - 2 * paddingPx) / LGameCoordUtils.BOARD_SIZE;
        
        const pixelX = paddingPx + (col * cellSize) + (cellSize / 2);
        const pixelY = paddingPx + (row * cellSize) + (cellSize / 2);
        
        return [pixelX, pixelY];
    },
    
    /**
     * Get visual representation of L-piece for debugging
     * @param {number} orientation - Orientation index
     * @returns {string} ASCII representation
     */
    visualizeOrientation: (orientation) => {
        if (orientation < 0 || orientation >= L_SHAPES.length) {
            return 'Invalid orientation';
        }
        
        const shape = L_SHAPES[orientation];
        const grid = Array(3).fill(null).map(() => Array(3).fill('.'));
        
        shape.forEach(([row, col]) => {
            if (row < 3 && col < 3) {
                grid[row][col] = 'L';
            }
        });
        
        return grid.map(row => row.join(' ')).join('\n');
    },
    
    /**
     * Get debug information about L-piece placement
     * @param {number} anchorRow - Anchor row
     * @param {number} anchorCol - Anchor column
     * @param {number} orientation - Orientation index
     * @returns {Object} Debug information
     */
    debugLPiecePlacement: (anchorRow, anchorCol, orientation) => {
        const cells = LGameCoordUtils.getLPieceCells(anchorRow, anchorCol, orientation);
        const isValid = cells !== null;
        
        return {
            anchor: [anchorRow, anchorCol],
            orientation,
            isValid,
            cells: cells || [],
            visualisation: LGameCoordUtils.visualizeOrientation(orientation)
        };
    }
};

// Export for ES6 module compatibility
export default LGameCoordUtils;