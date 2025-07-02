/**
 * LogicCastle Coordinate Utilities
 * 
 * Standard utilities for coordinate transformations across all games.
 * Eliminates coordinate mapping bugs through consistent conventions.
 * 
 * Convention: (row, col) 0-based indexing for all games
 * - Connect4: rows 0-5, cols 0-6
 * - Gomoku: rows 0-14, cols 0-14  
 * - Trio: rows 0-6, cols 0-6
 * 
 * Based on Architectural Guidelines from GEMINI Analysis (2025-07-02)
 */

export const CoordUtils = {
  /**
   * Convert grid coordinates to linear array index
   * @param {number} row - Row index (0-based)
   * @param {number} col - Column index (0-based)
   * @param {number} cols - Total number of columns
   * @returns {number} Linear array index
   */
  gridToIndex: (row, col, cols) => {
    if (typeof row !== 'number' || typeof col !== 'number' || typeof cols !== 'number') {
      throw new Error('gridToIndex: All parameters must be numbers');
    }
    return row * cols + col;
  },

  /**
   * Convert linear array index to grid coordinates
   * @param {number} index - Linear array index
   * @param {number} cols - Total number of columns
   * @returns {Array<number>} [row, col] coordinates
   */
  indexToGrid: (index, cols) => {
    if (typeof index !== 'number' || typeof cols !== 'number') {
      throw new Error('indexToGrid: All parameters must be numbers');
    }
    if (cols <= 0) {
      throw new Error('indexToGrid: cols must be greater than 0');
    }
    return [Math.floor(index / cols), index % cols];
  },

  /**
   * Validate grid coordinates are within bounds
   * @param {number} row - Row index (0-based)
   * @param {number} col - Column index (0-based)
   * @param {number} maxRow - Maximum row index (exclusive)
   * @param {number} maxCol - Maximum column index (exclusive)
   * @returns {boolean} True if coordinates are valid
   */
  validateCoords: (row, col, maxRow, maxCol) => {
    if (typeof row !== 'number' || typeof col !== 'number' || 
        typeof maxRow !== 'number' || typeof maxCol !== 'number') {
      return false;
    }
    return row >= 0 && row < maxRow && col >= 0 && col < maxCol;
  },

  /**
   * Clamp coordinates to valid bounds
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} maxRow - Maximum row index (exclusive)
   * @param {number} maxCol - Maximum column index (exclusive)
   * @returns {Array<number>} [clampedRow, clampedCol]
   */
  clampCoords: (row, col, maxRow, maxCol) => {
    const clampedRow = Math.max(0, Math.min(row, maxRow - 1));
    const clampedCol = Math.max(0, Math.min(col, maxCol - 1));
    return [clampedRow, clampedCol];
  },

  /**
   * Get neighboring coordinates (4-directional)
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} maxRow - Maximum row index (exclusive)
   * @param {number} maxCol - Maximum column index (exclusive)
   * @returns {Array<Array<number>>} Array of valid [row, col] neighbors
   */
  getNeighbors: (row, col, maxRow, maxCol) => {
    const directions = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1]   // right
    ];
    
    return directions
      .map(([dr, dc]) => [row + dr, col + dc])
      .filter(([r, c]) => CoordUtils.validateCoords(r, c, maxRow, maxCol));
  },

  /**
   * Get neighboring coordinates (8-directional, including diagonals)
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} maxRow - Maximum row index (exclusive)
   * @param {number} maxCol - Maximum column index (exclusive)
   * @returns {Array<Array<number>>} Array of valid [row, col] neighbors
   */
  getNeighbors8: (row, col, maxRow, maxCol) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], // top row
      [0, -1],           [0, 1],  // middle row (excluding center)
      [1, -1],  [1, 0],  [1, 1]   // bottom row
    ];
    
    return directions
      .map(([dr, dc]) => [row + dr, col + dc])
      .filter(([r, c]) => CoordUtils.validateCoords(r, c, maxRow, maxCol));
  },

  /**
   * Calculate distance between two coordinates (Manhattan distance)
   * @param {number} row1 - First row
   * @param {number} col1 - First column
   * @param {number} row2 - Second row
   * @param {number} col2 - Second column
   * @returns {number} Manhattan distance
   */
  manhattanDistance: (row1, col1, row2, col2) => {
    return Math.abs(row1 - row2) + Math.abs(col1 - col2);
  },

  /**
   * Calculate distance between two coordinates (Euclidean distance)
   * @param {number} row1 - First row
   * @param {number} col1 - First column
   * @param {number} row2 - Second row
   * @param {number} col2 - Second column
   * @returns {number} Euclidean distance
   */
  euclideanDistance: (row1, col1, row2, col2) => {
    const dr = row1 - row2;
    const dc = col1 - col2;
    return Math.sqrt(dr * dr + dc * dc);
  },

  /**
   * Convert DOM element data attributes to coordinates
   * @param {HTMLElement} element - DOM element with data-row and data-col
   * @returns {Array<number>|null} [row, col] or null if invalid
   */
  elementToCoords: (element) => {
    if (!element || !element.dataset) {
      return null;
    }
    
    const row = parseInt(element.dataset.row, 10);
    const col = parseInt(element.dataset.col, 10);
    
    if (isNaN(row) || isNaN(col)) {
      return null;
    }
    
    return [row, col];
  },

  /**
   * Set DOM element data attributes from coordinates
   * @param {HTMLElement} element - DOM element to update
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  coordsToElement: (element, row, col) => {
    if (!element || typeof row !== 'number' || typeof col !== 'number') {
      throw new Error('coordsToElement: Invalid parameters');
    }
    
    element.dataset.row = row.toString();
    element.dataset.col = col.toString();
  },

  // Debug and Development Utilities
  
  /**
   * Log coordinate transformation for debugging
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} cols - Total columns
   * @param {string} context - Debug context (optional)
   */
  logCoordTransform: (row, col, cols, context = '') => {
    const index = CoordUtils.gridToIndex(row, col, cols);
    const prefix = context ? `[${context}] ` : '';
    console.log(`${prefix}(${row},${col}) → index ${index}`);
  },

  /**
   * Validate array index corresponds to expected coordinates
   * @param {number} index - Array index
   * @param {number} expectedRow - Expected row
   * @param {number} expectedCol - Expected column
   * @param {number} cols - Total columns
   * @returns {boolean} True if index matches expected coordinates
   */
  validateIndexMapping: (index, expectedRow, expectedCol, cols) => {
    const [actualRow, actualCol] = CoordUtils.indexToGrid(index, cols);
    return actualRow === expectedRow && actualCol === expectedCol;
  },

  /**
   * Generate debug grid for coordinate validation
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @returns {Array<Array<Object>>} 2D grid with coordinate info
   */
  generateDebugGrid: (rows, cols) => {
    const grid = [];
    for (let row = 0; row < rows; row++) {
      const rowArray = [];
      for (let col = 0; col < cols; col++) {
        rowArray.push({
          row,
          col,
          index: CoordUtils.gridToIndex(row, col, cols),
          notation: `${String.fromCharCode(65 + col)}${row + 1}` // A1, B2, etc.
        });
      }
      grid.push(rowArray);
    }
    return grid;
  },

  // Game-specific coordinate helpers

  /**
   * Connect4 specific: Convert column to drop position
   * @param {number} col - Column index (0-6)
   * @param {Array<Array>} board - 2D board array
   * @returns {number|null} Row where piece would land, or null if column full
   */
  connect4DropPosition: (col, board) => {
    if (!board || !Array.isArray(board) || col < 0 || col >= board[0].length) {
      return null;
    }
    
    // Find lowest empty position in column
    for (let row = board.length - 1; row >= 0; row--) {
      if (board[row][col] === 0 || board[row][col] === null || board[row][col] === undefined) {
        return row;
      }
    }
    return null; // Column is full
  },

  /**
   * Gomoku specific: Convert pixel coordinates to grid intersection
   * @param {number} pixelX - X pixel coordinate
   * @param {number} pixelY - Y pixel coordinate
   * @param {number} boardSize - Board size in pixels
   * @param {number} padding - Board padding in pixels
   * @param {number} gridSize - Grid size (15 for Gomoku)
   * @returns {Array<number>|null} [row, col] or null if outside grid
   */
  gomokuPixelToGrid: (pixelX, pixelY, boardSize, padding, gridSize = 15) => {
    const gridArea = boardSize - (2 * padding);
    const cellSize = gridArea / (gridSize - 1);
    
    const gridX = (pixelX - padding) / cellSize;
    const gridY = (pixelY - padding) / cellSize;
    
    // Round to nearest intersection
    const col = Math.round(gridX);
    const row = Math.round(gridY);
    
    if (CoordUtils.validateCoords(row, col, gridSize, gridSize)) {
      return [row, col];
    }
    
    return null;
  },

  /**
   * Gomoku specific: Convert grid coordinates to pixel position
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} boardSize - Board size in pixels
   * @param {number} padding - Board padding in pixels
   * @param {number} gridSize - Grid size (15 for Gomoku)
   * @returns {Array<number>} [pixelX, pixelY]
   */
  gomokuGridToPixel: (row, col, boardSize, padding, gridSize = 15) => {
    const gridArea = boardSize - (2 * padding);
    const cellSize = gridArea / (gridSize - 1);
    
    const pixelX = padding + (col * cellSize);
    const pixelY = padding + (row * cellSize);
    
    return [pixelX, pixelY];
  }
};

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoordUtils };
}