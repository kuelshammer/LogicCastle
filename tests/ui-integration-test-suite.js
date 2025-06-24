/**
 * UI INTEGRATION TEST SUITE - Complete Game Flow Testing
 *
 * This test suite verifies that all UI functionality remains intact during
 * the refactoring process. Tests cover complete user journeys and interactions.
 *
 * CRITICAL: Run before and after each refactoring phase to ensure UI stability.
 */

/**
 * UI Integration Test Suite
 * Tests complete game flows end-to-end
 */
function runUIIntegrationTests(testSuite) {
  testSuite.group('🎮 UI Integration Tests', () => {

    // Test 1: Game Mode Selection
    testSuite.test('Game mode selection and initialization', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);

      // Test all game modes can be selected
      const gameModes = ['2-player', 'vs-bot-easy', 'vs-bot-medium', 'vs-bot-strong', 'vs-bot-monte-carlo'];

      gameModes.forEach(mode => {
        ui.setGameMode(mode);
        testSuite.assert(ui.gameMode === mode, `Should set game mode to ${mode}`);

        // Verify UI reflects the mode
        const modeDisplay = ui.getCurrentModeDisplay();
        testSuite.assert(modeDisplay.includes(mode.replace('-', ' ')), `UI should display ${mode}`);
      });
    });

    // Test 2: Complete Human vs Human Game Flow
    testSuite.test('Complete Human vs Human game flow', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);

      ui.setGameMode('2-player');
      ui.newGame();

      // Simulate a complete game
      const moves = [3, 3, 2, 4, 2, 4, 1, 5]; // Sample winning sequence

      moves.forEach((move, index) => {
        const currentPlayer = game.currentPlayer;

        // Simulate column selection
        ui.selectColumn(move);
        ui.makeMove();

        // Verify move was processed
        testSuite.assert(game.moveHistory.length === index + 1, `Move ${index + 1} should be recorded`);

        // Verify UI updates
        const boardState = ui.getBoardVisualState();
        testSuite.assert(boardState.totalPieces === index + 1, `Board should show ${index + 1} pieces`);
      });

      console.log('✅ Human vs Human game flow completed successfully');
    });

    // Test 3: Human vs Bot Game Flow
    testSuite.test('Human vs Bot game flow (all difficulties)', () => {
      const botDifficulties = ['vs-bot-easy', 'vs-bot-medium', 'vs-bot-strong'];

      botDifficulties.forEach(difficulty => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);

        ui.setGameMode(difficulty);
        ui.newGame();

        // Human makes first move
        ui.selectColumn(3);
        ui.makeMove();

        testSuite.assert(game.moveHistory.length === 1, `Human move should be recorded for ${difficulty}`);

        // Wait for bot response (simulate)
        const botMovePromise = ui.waitForBotMove();
        testSuite.assert(botMovePromise !== null, `Bot should respond for ${difficulty}`);

        // Verify bot made a move
        setTimeout(() => {
          testSuite.assert(game.moveHistory.length === 2, `Bot should have responded for ${difficulty}`);
        }, 100);
      });

      console.log('✅ Human vs Bot flows tested for all difficulties');
    });

    // Test 4: Helper System Integration
    testSuite.test('Helper system UI integration', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);
      const helpers = new Connect4Helpers(game);

      ui.attachHelpers(helpers);

      // Test helper levels
      for (let level = 0; level <= 2; level++) {
        helpers.setEnabled(true, level);
        helpers.updateHints();

        const hintsVisible = ui.areHintsVisible();
        const hintCount = ui.getVisibleHintCount();

        testSuite.assert(typeof hintsVisible === 'boolean', `Helper level ${level} should return hint visibility status`);
        testSuite.assert(typeof hintCount === 'number', `Helper level ${level} should return hint count`);
      }

      console.log('✅ Helper system integration verified');
    });

    // Test 5: Modal Interactions
    testSuite.test('Modal interactions (help, settings)', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);

      // Test help modal
      ui.showHelpModal();
      testSuite.assert(ui.isHelpModalVisible(), 'Help modal should be visible');

      ui.hideHelpModal();
      testSuite.assert(!ui.isHelpModalVisible(), 'Help modal should be hidden');

      // Test settings modal if it exists
      if (ui.showSettingsModal) {
        ui.showSettingsModal();
        testSuite.assert(ui.isSettingsModalVisible(), 'Settings modal should be visible');

        ui.hideSettingsModal();
        testSuite.assert(!ui.isSettingsModalVisible(), 'Settings modal should be hidden');
      }

      console.log('✅ Modal interactions verified');
    });

    // Test 6: Keyboard Shortcuts
    testSuite.test('Keyboard shortcuts functionality', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);

      // Test number key shortcuts (1-7 for columns)
      for (let i = 1; i <= 7; i++) {
        const keyEvent = new KeyboardEvent('keydown', { key: i.toString() });
        const handled = ui.handleKeyboardInput(keyEvent);

        testSuite.assert(handled, `Number key ${i} should be handled`);
        testSuite.assert(ui.selectedColumn === i - 1, `Column ${i - 1} should be selected`);
      }

      // Test special shortcuts
      const shortcuts = [
        { key: 'F1', action: 'help' },
        { key: 'F2', action: 'hints' },
        { key: 'F9', action: 'undo' },
        { key: 'Enter', action: 'confirm' },
        { key: 'Escape', action: 'cancel' }
      ];

      shortcuts.forEach(shortcut => {
        const keyEvent = new KeyboardEvent('keydown', { key: shortcut.key });
        const handled = ui.handleKeyboardInput(keyEvent);

        testSuite.assert(handled, `${shortcut.key} should trigger ${shortcut.action}`);
      });

      console.log('✅ Keyboard shortcuts verified');
    });

    // Test 7: Game State Synchronization
    testSuite.test('Game state and UI synchronization', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);

      // Test that UI reflects game state changes
      const initialState = ui.getCurrentGameState();
      testSuite.assert(initialState.currentPlayer === 1, 'Initial player should be 1');
      testSuite.assert(initialState.moveCount === 0, 'Initial move count should be 0');

      // Make a move and verify synchronization
      game.makeMove(3);
      ui.updateFromGameState();

      const updatedState = ui.getCurrentGameState();
      testSuite.assert(updatedState.currentPlayer === 2, 'Player should switch to 2');
      testSuite.assert(updatedState.moveCount === 1, 'Move count should be 1');

      // Test undo synchronization
      if (game.undoLastMove) {
        game.undoLastMove();
        ui.updateFromGameState();

        const undoState = ui.getCurrentGameState();
        testSuite.assert(undoState.currentPlayer === 1, 'Player should revert to 1');
        testSuite.assert(undoState.moveCount === 0, 'Move count should revert to 0');
      }

      console.log('✅ Game state synchronization verified');
    });

    // Test 8: Error Handling and Edge Cases
    testSuite.test('UI error handling and edge cases', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);

      // Test invalid column selection
      const invalidResult = ui.selectColumn(-1);
      testSuite.assert(!invalidResult, 'Invalid column should be rejected');

      const outOfBoundsResult = ui.selectColumn(7);
      testSuite.assert(!outOfBoundsResult, 'Out of bounds column should be rejected');

      // Test full column handling
      // Fill a column completely
      for (let i = 0; i < 6; i++) {
        game.makeMove(0);
      }

      const fullColumnResult = ui.selectColumn(0);
      testSuite.assert(!fullColumnResult, 'Full column should be rejected');

      // Test game over state handling
      ui.setGameOverState('Red');
      const gameOverMove = ui.selectColumn(1);
      testSuite.assert(!gameOverMove, 'Moves should be rejected when game is over');

      console.log('✅ Error handling and edge cases verified');
    });

    // Test 9: Performance and Responsiveness
    testSuite.test('UI performance and responsiveness', () => {
      const game = new Connect4Game();
      const ui = new Connect4UI(game);

      // Test rapid move execution
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        ui.selectColumn(i % 7);
        ui.makeMove();
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      testSuite.assert(executionTime < 1000, `10 moves should execute in under 1 second (took ${executionTime.toFixed(1)}ms)`);

      // Test animation performance
      const animationStart = performance.now();
      ui.animateMove(3, 5); // Simulate animation
      const animationTime = performance.now() - animationStart;

      testSuite.assert(animationTime < 500, `Move animation should complete quickly (took ${animationTime.toFixed(1)}ms)`);

      console.log('✅ UI performance verified');
    });
  });
}

/**
 * Helper function to create mock UI methods for testing
 */
function createMockUIForTesting() {
  return {
    gameMode: '2-player',
    selectedColumn: null,

    setGameMode: function(mode) { this.gameMode = mode; },
    getCurrentModeDisplay: function() { return this.gameMode; },
    newGame: function() { console.log('New game started'); },
    selectColumn: function(col) {
      if (col >= 0 && col < 7) {
        this.selectedColumn = col;
        return true;
      }
      return false;
    },
    makeMove: function() { console.log('Move made'); },
    getBoardVisualState: function() { return { totalPieces: 0 }; },
    waitForBotMove: function() { return Promise.resolve(); },
    attachHelpers: function(helpers) { this.helpers = helpers; },
    areHintsVisible: function() { return true; },
    getVisibleHintCount: function() { return 0; },
    showHelpModal: function() { this.helpModalVisible = true; },
    hideHelpModal: function() { this.helpModalVisible = false; },
    isHelpModalVisible: function() { return this.helpModalVisible || false; },
    showSettingsModal: function() { this.settingsModalVisible = true; },
    hideSettingsModal: function() { this.settingsModalVisible = false; },
    isSettingsModalVisible: function() { return this.settingsModalVisible || false; },
    handleKeyboardInput: function(event) { return true; },
    getCurrentGameState: function() {
      return { currentPlayer: 1, moveCount: 0 };
    },
    updateFromGameState: function() { console.log('UI updated from game state'); },
    setGameOverState: function(winner) { this.gameOver = true; },
    animateMove: function(col, row) {
      // Simulate animation time
      return new Promise(resolve => setTimeout(resolve, 200));
    }
  };
}

// Export for test runner integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runUIIntegrationTests,
    createMockUIForTesting
  };
}

// Auto-registration with test runner
if (typeof window !== 'undefined' && typeof runUIIntegrationTests === 'function') {
  console.log('UI Integration Test Suite loaded and ready');
}
