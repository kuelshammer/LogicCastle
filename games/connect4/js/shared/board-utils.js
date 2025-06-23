/**
 * Board Utilities - Common board manipulation functions
 * 
 * Shared utilities for board operations across all Connect4 modules
 */
import { GAME_CONFIG, PLAYERS, ALL_DIRECTIONS, DIRECTION_NAMES } from './constants.js';

/**
 * Create empty board with standard dimensions
 * @returns {Array[]} Empty 2D board array
 */
export function createEmptyBoard() {
    return Array(GAME_CONFIG.ROWS).fill(null)
        .map(() => Array(GAME_CONFIG.COLS).fill(PLAYERS.NONE));
}

/**
 * Create deep copy of a board
 * @param {Array[]} board - Board to copy
 * @returns {Array[]} Deep copy of the board
 */
export function copyBoard(board) {
    return board.map(row => [...row]);
}

/**
 * Check if a column is valid and not full
 * @param {Array[]} board - Game board
 * @param {number} col - Column to check
 * @returns {boolean} Whether column is valid and has space
 */
export function isValidColumn(board, col) {
    return col >= 0 && col < GAME_CONFIG.COLS && board[0][col] === PLAYERS.NONE;
}

/**
 * Get all valid moves (columns that aren't full)
 * @param {Array[]} board - Game board
 * @returns {number[]} Array of valid column indices
 */
export function getValidMoves(board) {
    const validMoves = [];
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        if (isValidColumn(board, col)) {
            validMoves.push(col);
        }
    }
    return validMoves;
}

/**
 * Find the lowest empty row in a column
 * @param {Array[]} board - Game board
 * @param {number} col - Column to check
 * @returns {number} Row index or -1 if column is full
 */
export function getLowestEmptyRow(board, col) {
    if (!isValidColumn(board, col)) {
        return -1;
    }
    
    for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
        if (board[row][col] === PLAYERS.NONE) {
            return row;
        }
    }
    
    return -1;
}

/**
 * Place a piece on the board
 * @param {Array[]} board - Game board (will be modified)
 * @param {number} col - Column to place piece
 * @param {number} player - Player making the move
 * @returns {number} Row where piece was placed, or -1 if invalid
 */
export function placePiece(board, col, player) {
    const row = getLowestEmptyRow(board, col);
    if (row !== -1) {
        board[row][col] = player;
    }
    return row;
}

/**
 * Simulate a move without modifying the original board
 * @param {Array[]} board - Original board
 * @param {number} col - Column for move
 * @param {number} player - Player making move
 * @returns {Object|null} {newBoard, row, isWin, winningCells} or null if invalid
 */
export function simulateMove(board, col, player) {
    if (!isValidColumn(board, col)) {
        return null;
    }
    
    const newBoard = copyBoard(board);
    const row = placePiece(newBoard, col, player);
    
    if (row === -1) {
        return null;
    }
    
    const winResult = checkWinAtPosition(newBoard, row, col, player);
    
    return {
        newBoard,
        row,
        column: col,
        player,
        isWin: winResult.isWin,
        winType: winResult.winType,
        winningCells: winResult.winningCells
    };
}

/**
 * Check for win condition at a specific position
 * @param {Array[]} board - Game board
 * @param {number} row - Row of the piece
 * @param {number} col - Column of the piece
 * @param {number} player - Player to check for
 * @returns {Object} {isWin, winType, winningCells}
 */
export function checkWinAtPosition(board, row, col, player) {
    for (const direction of ALL_DIRECTIONS) {
        const result = checkLineWin(board, row, col, direction, player);
        if (result.isWin) {
            return {
                isWin: true,
                winType: DIRECTION_NAMES[direction.toString()],
                winningCells: result.winningCells
            };
        }
    }
    
    return { isWin: false, winType: null, winningCells: [] };
}

/**
 * Check for win in a specific direction
 * @param {Array[]} board - Game board
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @param {number[]} direction - Direction vector [dRow, dCol]
 * @param {number} player - Player to check for
 * @returns {Object} {isWin, winningCells}
 */
export function checkLineWin(board, row, col, direction, player) {
    const [dRow, dCol] = direction;
    const winningCells = [{ row, col }];
    
    // Count in positive direction
    let r = row + dRow;
    let c = col + dCol;
    while (isInBounds(r, c) && board[r][c] === player) {
        winningCells.push({ row: r, col: c });
        r += dRow;
        c += dCol;
    }
    
    // Count in negative direction
    r = row - dRow;
    c = col - dCol;
    while (isInBounds(r, c) && board[r][c] === player) {
        winningCells.unshift({ row: r, col: c });
        r -= dRow;
        c -= dCol;
    }
    
    return {
        isWin: winningCells.length >= GAME_CONFIG.WIN_LENGTH,
        winningCells: winningCells.length >= GAME_CONFIG.WIN_LENGTH ? winningCells : []
    };
}

/**
 * Count consecutive pieces in a line from a position
 * @param {Array[]} board - Game board
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @param {number[]} direction - Direction vector [dRow, dCol]
 * @param {number} player - Player to count for
 * @returns {number} Total count including the starting position
 */
export function countLineLength(board, row, col, direction, player) {
    const [dRow, dCol] = direction;
    let count = 1; // Count the starting position
    
    // Count in positive direction
    let r = row + dRow;
    let c = col + dCol;
    while (isInBounds(r, c) && board[r][c] === player) {
        count++;
        r += dRow;
        c += dCol;
    }
    
    // Count in negative direction
    r = row - dRow;
    c = col - dCol;
    while (isInBounds(r, c) && board[r][c] === player) {
        count++;
        r -= dRow;
        c -= dCol;
    }
    
    return count;
}

/**
 * Check if coordinates are within board bounds
 * @param {number} row - Row coordinate
 * @param {number} col - Column coordinate
 * @returns {boolean} Whether coordinates are in bounds
 */
export function isInBounds(row, col) {
    return row >= 0 && row < GAME_CONFIG.ROWS && col >= 0 && col < GAME_CONFIG.COLS;
}

/**
 * Check if the board is full (draw condition)
 * @param {Array[]} board - Game board
 * @returns {boolean} Whether board is full
 */
export function isBoardFull(board) {
    return getValidMoves(board).length === 0;
}

/**
 * Get opponent player
 * @param {number} player - Current player
 * @returns {number} Opponent player
 */
export function getOpponent(player) {
    return player === PLAYERS.PLAYER1 ? PLAYERS.PLAYER2 : PLAYERS.PLAYER1;
}

/**
 * Convert board to string representation (for debugging)
 * @param {Array[]} board - Game board
 * @returns {string} String representation of board
 */
export function boardToString(board) {
    return board.map(row => 
        row.map(cell => cell === PLAYERS.NONE ? '.' : cell).join(' ')
    ).join('\n');
}

/**
 * Get board statistics
 * @param {Array[]} board - Game board
 * @returns {Object} Board statistics
 */
export function getBoardStats(board) {
    let emptyCells = 0;
    let player1Pieces = 0;
    let player2Pieces = 0;
    
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const cell = board[row][col];
            if (cell === PLAYERS.NONE) {
                emptyCells++;
            } else if (cell === PLAYERS.PLAYER1) {
                player1Pieces++;
            } else if (cell === PLAYERS.PLAYER2) {
                player2Pieces++;
            }
        }
    }
    
    return {
        emptyCells,
        player1Pieces,
        player2Pieces,
        totalPieces: player1Pieces + player2Pieces,
        gamePhase: getGamePhase(player1Pieces + player2Pieces)
    };
}

/**
 * Determine game phase based on piece count
 * @param {number} totalPieces - Total pieces on board
 * @returns {string} Game phase
 */
export function getGamePhase(totalPieces) {
    if (totalPieces < 8) return 'opening';
    if (totalPieces < 20) return 'midgame';
    return 'endgame';
}

/**
 * Get center columns (useful for AI strategies)
 * @returns {number[]} Array of center column indices
 */
export function getCenterColumns() {
    const center = Math.floor(GAME_CONFIG.COLS / 2);
    return [center - 1, center, center + 1].filter(col => col >= 0 && col < GAME_CONFIG.COLS);
}

/**
 * Calculate distance from center for a column
 * @param {number} col - Column index
 * @returns {number} Distance from center
 */
export function getDistanceFromCenter(col) {
    const center = Math.floor(GAME_CONFIG.COLS / 2);
    return Math.abs(col - center);
}

// Global access for backward compatibility
if (typeof window !== 'undefined') {
    window.Connect4BoardUtils = {
        createEmptyBoard,
        copyBoard,
        isValidColumn,
        getValidMoves,
        getLowestEmptyRow,
        placePiece,
        simulateMove,
        checkWinAtPosition,
        checkLineWin,
        countLineLength,
        isInBounds,
        isBoardFull,
        getOpponent,
        boardToString,
        getBoardStats,
        getGamePhase,
        getCenterColumns,
        getDistanceFromCenter
    };
}