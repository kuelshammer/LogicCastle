/**
 * LogicCastle Game Base Classes
 * 
 * Standard patterns for game implementation across all LogicCastle games.
 * Provides consistent interfaces and eliminates code duplication.
 * 
 * Based on Architectural Guidelines from GEMINI Analysis (2025-07-02)
 */

import { CoordUtils } from './coord-utils.js';

/**
 * Base Game Wrapper class
 * Provides standard interface for WASM game integration
 */
export class GameWrapper {
  constructor(wasmGame, gameType) {
    if (!wasmGame) {
      throw new Error('WASM game instance required');
    }
    
    this.wasm = wasmGame;
    this.gameType = gameType;
    this.eventListeners = new Map();
  }

  /**
   * Make a move in the game
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   * @returns {boolean} Success status
   */
  makeMove(row, col) {
    throw new Error('makeMove must be implemented by subclass');
  }

  /**
   * Get current board state
   * @returns {Array} Board state array
   */
  getBoardState() {
    return this.wasm.get_board();
  }

  /**
   * Check if game is over
   * @returns {boolean} Game over status
   */
  isGameOver() {
    return this.wasm.is_game_over();
  }

  /**
   * Reset game to initial state
   */
  resetGame() {
    this.wasm.reset_game();
    this.emit('gameReset');
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

/**
 * Connect4 Game Wrapper
 */
export class Connect4Wrapper extends GameWrapper {
  constructor(wasmGame) {
    super(wasmGame, 'connect4');
    this.rows = 6;
    this.cols = 7;
  }

  makeMove(col) {
    if (col < 0 || col >= this.cols) {
      return false;
    }

    try {
      this.wasm.make_move_connect4_js(col);
      this.emit('moveMade', { col });
      return true;
    } catch (error) {
      console.error('Connect4 move failed:', error);
      return false;
    }
  }

  getDropPosition(col) {
    const board = this.getBoardState();
    const board2D = this.arrayToGrid(board);
    return CoordUtils.connect4DropPosition(col, board2D);
  }

  arrayToGrid(boardArray) {
    const grid = [];
    for (let row = 0; row < this.rows; row++) {
      const rowArray = [];
      for (let col = 0; col < this.cols; col++) {
        const index = CoordUtils.gridToIndex(row, col, this.cols);
        rowArray.push(boardArray[index]);
      }
      grid.push(rowArray);
    }
    return grid;
  }
}

/**
 * Gomoku Game Wrapper
 */
export class GomokuWrapper extends GameWrapper {
  constructor(wasmGame) {
    super(wasmGame, 'gomoku');
    this.rows = 15;
    this.cols = 15;
  }

  makeMove(row, col) {
    if (!CoordUtils.validateCoords(row, col, this.rows, this.cols)) {
      return false;
    }

    try {
      this.wasm.make_move_gobang_js(row, col);
      this.emit('moveMade', { row, col });
      return true;
    } catch (error) {
      console.error('Gomoku move failed:', error);
      return false;
    }
  }

  /**
   * Get legal moves for current position
   * @returns {Array<Array<number>>} Array of [row, col] coordinates
   */
  getLegalMoves() {
    const legalMoves = this.wasm.get_legal_moves_gobang();
    const moves = [];
    
    // Convert flat array to coordinate pairs
    for (let i = 0; i < legalMoves.length; i += 2) {
      moves.push([legalMoves[i], legalMoves[i + 1]]);
    }
    
    return moves;
  }

  /**
   * Get winning moves for current player
   * @returns {Array<Array<number>>} Array of [row, col] coordinates
   */
  getWinningMoves() {
    const winningMoves = this.wasm.get_winning_moves_gobang();
    const moves = [];
    
    for (let i = 0; i < winningMoves.length; i += 2) {
      moves.push([winningMoves[i], winningMoves[i + 1]]);
    }
    
    return moves;
  }

  /**
   * Get blocking moves (to prevent opponent wins)
   * @returns {Array<Array<number>>} Array of [row, col] coordinates
   */
  getBlockingMoves() {
    const blockingMoves = this.wasm.get_blocking_moves_gobang();
    const moves = [];
    
    for (let i = 0; i < blockingMoves.length; i += 2) {
      moves.push([blockingMoves[i], blockingMoves[i + 1]]);
    }
    
    return moves;
  }
}

/**
 * Trio Game Wrapper
 */
export class TrioWrapper extends GameWrapper {
  constructor(wasmGame) {
    super(wasmGame, 'trio');
    this.rows = 7;
    this.cols = 7;
  }

  makeMove(positions) {
    // Trio uses different move pattern - solution checking
    if (!Array.isArray(positions) || positions.length !== 3) {
      return false;
    }

    try {
      const [pos1, pos2, pos3] = positions;
      const result = this.wasm.check_combination(
        pos1.row, pos1.col,
        pos2.row, pos2.col,
        pos3.row, pos3.col
      );
      
      this.emit('solutionChecked', { positions, result });
      return result;
    } catch (error) {
      console.error('Trio solution check failed:', error);
      return false;
    }
  }

  getTargetNumber() {
    return this.wasm.get_target_number();
  }

  generateNewTarget() {
    // Reset the game to get a new target
    this.resetGame();
    return this.getTargetNumber();
  }
}

/**
 * Base UI Controller class
 * Standard patterns for DOM manipulation and event handling
 */
export class UIController {
  constructor(gameWrapper) {
    if (!gameWrapper) {
      throw new Error('Game wrapper required');
    }
    
    this.game = gameWrapper;
    this.elements = new Map();
    this.boundEventHandlers = new Map();
    
    // Auto-cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Initialize UI elements and event listeners
   */
  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupGameEventListeners();
  }

  /**
   * Setup DOM element references
   * Override in subclasses
   */
  setupElements() {
    // To be implemented by subclasses
  }

  /**
   * Setup DOM event listeners
   * Override in subclasses
   */
  setupEventListeners() {
    // To be implemented by subclasses
  }

  /**
   * Setup game event listeners
   */
  setupGameEventListeners() {
    this.game.on('moveMade', (data) => this.onMoveMade(data));
    this.game.on('gameReset', () => this.onGameReset());
  }

  /**
   * Handle move made
   * @param {Object} data - Move data
   */
  onMoveMade(data) {
    // To be implemented by subclasses
  }

  /**
   * Handle game reset
   */
  onGameReset() {
    // To be implemented by subclasses
  }

  /**
   * Get DOM element with caching
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null}
   */
  getElement(selector) {
    if (!this.elements.has(selector)) {
      const element = document.querySelector(selector);
      this.elements.set(selector, element);
    }
    return this.elements.get(selector);
  }

  /**
   * Add event listener with automatic cleanup tracking
   * @param {HTMLElement|string} elementOrSelector - Element or selector
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  addEventListener(elementOrSelector, event, handler, options = {}) {
    const element = typeof elementOrSelector === 'string' 
      ? this.getElement(elementOrSelector)
      : elementOrSelector;
      
    if (!element) {
      console.warn(`Element not found: ${elementOrSelector}`);
      return;
    }

    const boundHandler = handler.bind(this);
    element.addEventListener(event, boundHandler, options);

    // Track for cleanup
    const key = `${element}_${event}`;
    if (!this.boundEventHandlers.has(key)) {
      this.boundEventHandlers.set(key, []);
    }
    this.boundEventHandlers.get(key).push({ handler: boundHandler, options });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove event listeners
    this.boundEventHandlers.forEach((handlers, key) => {
      const [elementKey, event] = key.split('_');
      const element = this.elements.get(elementKey);
      if (element) {
        handlers.forEach(({ handler, options }) => {
          element.removeEventListener(event, handler, options);
        });
      }
    });

    this.boundEventHandlers.clear();
    this.elements.clear();
  }
}

/**
 * Base Event Handler class
 * Standard patterns for input handling (mouse, keyboard, touch)
 */
export class EventHandler {
  constructor(uiController) {
    if (!uiController) {
      throw new Error('UI controller required');
    }
    
    this.ui = uiController;
    this.game = uiController.game;
    
    // Input state
    this.inputState = {
      mouseDown: false,
      keys: new Set(),
      lastClick: { x: 0, y: 0, time: 0 },
      doubleClickThreshold: 300
    };
  }

  /**
   * Setup event listeners
   */
  init() {
    this.setupKeyboardEvents();
    this.setupMouseEvents();
    this.setupTouchEvents();
  }

  /**
   * Setup keyboard event handlers
   */
  setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  /**
   * Setup mouse event handlers
   */
  setupMouseEvents() {
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    document.addEventListener('click', (e) => this.onClick(e));
  }

  /**
   * Setup touch event handlers
   */
  setupTouchEvents() {
    document.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
  }

  /**
   * Handle keyboard down events
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    this.inputState.keys.add(event.code);
    
    // Prevent browser defaults for game keys
    if (this.isGameKey(event.code)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handle keyboard up events
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    this.inputState.keys.delete(event.code);
  }

  /**
   * Check if key is used for game controls
   * @param {string} code - KeyboardEvent.code
   * @returns {boolean}
   */
  isGameKey(code) {
    const gameKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'Space', 'KeyX', 'Enter', 'Escape', 'Tab'
    ];
    return gameKeys.includes(code);
  }

  /**
   * Handle mouse down events
   * @param {MouseEvent} event
   */
  onMouseDown(event) {
    this.inputState.mouseDown = true;
  }

  /**
   * Handle mouse up events
   * @param {MouseEvent} event
   */
  onMouseUp(event) {
    this.inputState.mouseDown = false;
  }

  /**
   * Handle click events
   * @param {MouseEvent} event
   */
  onClick(event) {
    const now = Date.now();
    const isDoubleClick = (
      now - this.inputState.lastClick.time < this.inputState.doubleClickThreshold &&
      Math.abs(event.clientX - this.inputState.lastClick.x) < 5 &&
      Math.abs(event.clientY - this.inputState.lastClick.y) < 5
    );

    this.inputState.lastClick = {
      x: event.clientX,
      y: event.clientY,
      time: now
    };

    if (isDoubleClick) {
      this.onDoubleClick(event);
    }
  }

  /**
   * Handle double click events
   * @param {MouseEvent} event
   */
  onDoubleClick(event) {
    // To be implemented by subclasses
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} event
   */
  onTouchStart(event) {
    // Prevent mouse events from firing
    event.preventDefault();
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} event
   */
  onTouchEnd(event) {
    // Convert touch to click for game interaction
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const clickEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
      });
      touch.target.dispatchEvent(clickEvent);
    }
  }
}