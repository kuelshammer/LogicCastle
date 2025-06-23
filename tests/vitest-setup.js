/**
 * Vitest Setup File
 * Configures global environment for tests
 */

import { beforeEach, afterEach } from 'vitest';

// Note: Game class loading removed for now due to ES module complexity
// We'll focus on DOM-based tests and simple logic tests

// Configure JSDOM environment
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// Mock console methods for cleaner test output
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only log in verbose mode or for specific test messages
  if (process.env.VITEST_VERBOSE || args[0]?.includes?.('Test')) {
    originalConsoleLog(...args);
  }
};

// Global test environment setup
beforeEach(() => {
  // Setup minimal DOM structure for UI tests
  if (!document.getElementById('gameBoard')) {
    document.body.innerHTML = `
      <div id="gameBoard"></div>
      <select id="gameMode">
        <option value="two-player">Two Player</option>
        <option value="vs-bot-easy">vs Bot (Easy)</option>
        <option value="vs-bot-medium">vs Bot (Medium)</option>
        <option value="vs-bot-strong">vs Bot (Strong)</option>
      </select>
      <div id="player1Name">Player 1</div>
      <div id="player2Name">Player 2</div>
      <button id="newGameBtn">New Game</button>
    `;
  }
  
  // Reset any global state
  if (typeof window !== 'undefined') {
    window.CI_ENVIRONMENT = true;
    window.CI_TIMEOUT_MULTIPLIER = 1; // Faster for unit tests
    
    // Mock Connect4AI for legacy tests
    if (!window.Connect4AI) {
      window.Connect4AI = class MockConnect4AI {
        constructor(difficulty = 'medium') {
          this.difficulty = difficulty;
        }
        
        getBestMove(game, helpers) {
          // Return center column as default
          return 3;
        }
        
        setDifficulty(difficulty) {
          this.difficulty = difficulty;
        }
      };
    }
  }
});

afterEach(() => {
  // Preserve DOM structure, just reset values
  const gameMode = document.getElementById('gameMode');
  if (gameMode) gameMode.value = 'two-player';
  
  const player1Name = document.getElementById('player1Name');
  if (player1Name) player1Name.textContent = 'Player 1';
  
  const player2Name = document.getElementById('player2Name');
  if (player2Name) player2Name.textContent = 'Player 2';
  
  // Clear any event listeners
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    if (element.replaceWith) {
      const newElement = element.cloneNode(true);
      element.replaceWith(newElement);
    }
  });
});