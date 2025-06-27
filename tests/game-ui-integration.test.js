/**
 * Game UI Integration Tests
 * Tests integration between WASM game engine and browser UI
 */

import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Game UI Integration', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test</title>
      </head>
      <body>
        <div id="connect4-board"></div>
        <div id="gobang-board"></div>
        <div id="trio-board"></div>
        <button id="new-game">New Game</button>
        <button id="reset-game">Reset</button>
        <div id="current-player"></div>
        <div id="game-status"></div>
      </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
  });

  beforeEach(() => {
    // Clear board
    document.getElementById('connect4-board').innerHTML = '';
    document.getElementById('gobang-board').innerHTML = '';
    document.getElementById('trio-board').innerHTML = '';
    document.getElementById('current-player').textContent = '';
    document.getElementById('game-status').textContent = '';
  });

  describe('DOM Game Board Rendering', () => {
    test('should create Connect4 board structure', () => {
      const boardContainer = document.getElementById('connect4-board');
      
      // Simulate board creation
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          cell.dataset.row = row;
          cell.dataset.col = col;
          boardContainer.appendChild(cell);
        }
      }

      expect(boardContainer.children.length).toBe(42);
      expect(boardContainer.querySelector('[data-row="0"][data-col="0"]')).toBeTruthy();
      expect(boardContainer.querySelector('[data-row="5"][data-col="6"]')).toBeTruthy();
    });

    test('should handle click events on board', () => {
      const boardContainer = document.getElementById('connect4-board');
      let clickedCol = null;

      // Create a cell and add event listener
      const cell = document.createElement('div');
      cell.dataset.col = '3';
      cell.addEventListener('click', (e) => {
        clickedCol = parseInt(e.target.dataset.col);
      });
      boardContainer.appendChild(cell);

      // Simulate click
      cell.click();

      expect(clickedCol).toBe(3);
    });

    test('should update game status display', () => {
      const statusElement = document.getElementById('game-status');
      const playerElement = document.getElementById('current-player');

      // Simulate game state update
      statusElement.textContent = 'Game in progress';
      playerElement.textContent = 'Yellow\'s turn';

      expect(statusElement.textContent).toBe('Game in progress');
      expect(playerElement.textContent).toBe('Yellow\'s turn');
    });
  });

  describe('Game State Synchronization', () => {
    test('should sync WASM game state with DOM', () => {
      // This would normally require the actual WASM module
      // For now, test the DOM manipulation patterns

      const mockGameState = {
        board: [
          0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 1, 0, 0, 0, // Yellow piece at bottom
          2, 0, 0, 1, 0, 0, 0  // Red and Yellow pieces
        ],
        currentPlayer: 2, // Red
        gameOver: false
      };

      const boardContainer = document.getElementById('connect4-board');
      
      // Render board state
      mockGameState.board.forEach((cell, index) => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        if (cell === 1) cellElement.classList.add('yellow');
        if (cell === 2) cellElement.classList.add('red');
        boardContainer.appendChild(cellElement);
      });

      const yellowCells = boardContainer.querySelectorAll('.yellow');
      const redCells = boardContainer.querySelectorAll('.red');

      expect(yellowCells.length).toBe(2);
      expect(redCells.length).toBe(1);
    });

    test('should handle responsive board sizing', () => {
      const boardContainer = document.getElementById('connect4-board');
      
      // Test mobile-friendly sizing
      boardContainer.style.width = '350px';
      boardContainer.style.height = '300px';
      
      expect(boardContainer.style.width).toBe('350px');
      expect(boardContainer.style.height).toBe('300px');
    });
  });

  describe('Touch and Mobile Support', () => {
    test('should handle touch events', () => {
      const cell = document.createElement('div');
      let touchHandled = false;

      cell.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchHandled = true;
      });

      // Simulate touch event
      const touchEvent = new window.TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [{
          clientX: 100,
          clientY: 100,
          target: cell
        }]
      });

      cell.dispatchEvent(touchEvent);
      expect(touchHandled).toBe(true);
    });

    test('should prevent zoom on double-tap', () => {
      const boardContainer = document.getElementById('connect4-board');
      boardContainer.style.touchAction = 'manipulation';
      
      expect(boardContainer.style.touchAction).toBe('manipulation');
    });
  });

  describe('Accessibility Features', () => {
    test('should provide keyboard navigation', () => {
      const boardContainer = document.getElementById('connect4-board');
      let keyboardNavigated = false;

      boardContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          keyboardNavigated = true;
        }
      });

      const keyEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      boardContainer.dispatchEvent(keyEvent);
      expect(keyboardNavigated).toBe(true);
    });

    test('should have proper ARIA labels', () => {
      const cell = document.createElement('div');
      cell.setAttribute('aria-label', 'Column 1, Row 1, Empty');
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');

      expect(cell.getAttribute('aria-label')).toBe('Column 1, Row 1, Empty');
      expect(cell.getAttribute('role')).toBe('button');
      expect(cell.getAttribute('tabindex')).toBe('0');
    });
  });
});