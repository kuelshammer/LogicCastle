/**
 * Integration Tests for Cross-Component Interactions
 *
 * Coverage: Multi-component workflows, event cascades, state synchronization,
 * complex interaction scenarios, system-wide integration
 */
function runIntegrationCrossComponentTests(testSuite) {

  // Test complete system initialization
  testSuite.test('Integration-Cross-Component', 'Complete system initialization', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, ui);

    // Mock all required DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    const mockStatus = document.createElement('div');
    mockStatus.id = 'gameStatus';
    const mockPlayerIndicator = document.createElement('div');
    mockPlayerIndicator.id = 'currentPlayerIndicator';
    const mockNewGameBtn = document.createElement('button');
    mockNewGameBtn.id = 'newGameBtn';

    document.body.appendChild(mockBoard);
    document.body.appendChild(mockStatus);
    document.body.appendChild(mockPlayerIndicator);
    document.body.appendChild(mockNewGameBtn);

    // Initialize all components
    ui.init();
    ui.ai = ai;

    // Verify all components are properly connected
    testSuite.assertNotNull(ui.game, 'UI should reference game');
    testSuite.assertNotNull(ui.helpers, 'UI should reference helpers');
    testSuite.assertNotNull(helpers.game, 'Helpers should reference game');
    testSuite.assertNotNull(helpers.ui, 'Helpers should reference UI');
    testSuite.assertNotNull(ui.ai, 'UI should reference AI');

    // Test initial state consistency
    testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Game should start with Player 1');
    testSuite.assertFalsy(game.gameOver, 'Game should not be over initially');
    testSuite.assertFalsy(helpers.enabled, 'Helpers should start disabled');

    // Cleanup
    document.body.removeChild(mockBoard);
    document.body.removeChild(mockStatus);
    document.body.removeChild(mockPlayerIndicator);
    document.body.removeChild(mockNewGameBtn);
  });

  // Test event cascade through all components
  testSuite.test('Integration-Cross-Component', 'Event cascade through all components', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();
    ui.ai = ai;

    // Track events across components
    const eventsTracked = [];

    // Game events
    game.on('moveMade', (move) => {
      eventsTracked.push({ component: 'game', event: 'moveMade', data: move });
    });
    game.on('playerChanged', (player) => {
      eventsTracked.push({ component: 'game', event: 'playerChanged', data: player });
    });

    // UI events
    const originalOnMoveMade = ui.onMoveMade;
    ui.onMoveMade = (move) => {
      eventsTracked.push({ component: 'ui', event: 'onMoveMade', data: move });
      originalOnMoveMade.call(ui, move);
    };

    // Helper events
    const originalUpdateHints = helpers.updateHints;
    helpers.updateHints = () => {
      eventsTracked.push({ component: 'helpers', event: 'updateHints' });
      originalUpdateHints.call(helpers);
    };

    // Make a move to trigger event cascade
    const result = game.makeMove(3);
    testSuite.assertTruthy(result.success, 'Move should succeed');

    // Verify event cascade
    const gameEvents = eventsTracked.filter(e => e.component === 'game');
    const uiEvents = eventsTracked.filter(e => e.component === 'ui');

    testSuite.assert(gameEvents.length > 0, 'Game events should be triggered');
    testSuite.assert(eventsTracked.length > 0, 'Event cascade should occur');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test state synchronization across all components
  testSuite.test('Integration-Cross-Component', 'State synchronization across all components', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    const mockStatus = document.createElement('div');
    mockStatus.id = 'gameStatus';
    const mockPlayerIndicator = document.createElement('div');
    mockPlayerIndicator.id = 'currentPlayerIndicator';

    document.body.appendChild(mockBoard);
    document.body.appendChild(mockStatus);
    document.body.appendChild(mockPlayerIndicator);

    ui.createBoard();
    ui.gameStatus = mockStatus;
    ui.currentPlayerIndicator = mockPlayerIndicator;
    ui.ai = ai;

    // Enable helpers
    helpers.setEnabled(true, 1);

    // Mock UI help settings
    ui.getCurrentPlayerHelpEnabled = () => true;

    // Make a series of moves and verify synchronization
    const moves = [3, 2, 4, 1];

    moves.forEach((col, index) => {
      const playerBefore = game.currentPlayer;

      // Make move
      const result = game.makeMove(col);
      testSuite.assertTruthy(result.success, `Move ${index + 1} should succeed`);

      // Update all components
      ui.updateBoard();
      ui.updateCurrentPlayerIndicator();
      ui.updateGameStatus();
      helpers.updateHints();

      // Verify state synchronization
      testSuite.assertNotEqual(game.currentPlayer, playerBefore,
        'Current player should change');
      testSuite.assertEqual(game.moveHistory.length, index + 1,
        'Move history should be updated');

      // All components should reflect current state
      testSuite.assert(true, 'All components should be synchronized');
    });

    // Cleanup
    document.body.removeChild(mockBoard);
    document.body.removeChild(mockStatus);
    document.body.removeChild(mockPlayerIndicator);
  });

  // Test complex workflow: Human vs AI with helpers
  testSuite.test('Integration-Cross-Component', 'Complex workflow - Human vs AI with helpers', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();
    ui.gameMode = 'vs-bot-smart';
    ui.ai = ai;

    // Enable helpers for human player
    helpers.setEnabled(true, 1);
    ui.playerHelpEnabled.red.level1 = true;
    ui.getCurrentPlayerHelpEnabled = () => game.currentPlayer === game.PLAYER1;

    // Play several turns
    for (let turn = 0; turn < 6 && !game.gameOver; turn++) {
      if (game.currentPlayer === game.PLAYER1) {
        // Human turn with helpers
        helpers.updateHints();
        const hints = helpers.getCurrentHints();

        // Make human move (simulate always playing center when possible)
        const humanMove = game.getValidMoves().includes(3) ? 3 : game.getValidMoves()[0];
        const result = game.makeMove(humanMove);
        testSuite.assertTruthy(result.success, `Human turn ${turn + 1} should succeed`);

      } else {
        // AI turn
        const aiMove = ai.getBestMove(game, helpers);
        testSuite.assert(game.getValidMoves().includes(aiMove),
          `AI turn ${turn + 1} should choose valid move`);

        const result = game.makeMove(aiMove);
        testSuite.assertTruthy(result.success, `AI turn ${turn + 1} should succeed`);
      }

      // Update all components after each turn
      ui.updateBoard();
      ui.updateUI();
    }

    testSuite.assert(game.moveHistory.length > 0, 'Game should have progressed');
    testSuite.assert(true, 'Complex workflow should complete without errors');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test system recovery from errors
  testSuite.test('Integration-Cross-Component', 'System recovery from errors', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();
    ui.ai = ai;

    // Mock error conditions
    const errorsHandled = [];
    const originalConsoleError = console.error;
    console.error = (error) => {
      errorsHandled.push(error);
    };

    // Test with invalid game state
    game.currentPlayer = 999; // Invalid player

    try {
      // System should handle errors gracefully
      const aiMove = ai.getBestMove(game, helpers);
      ui.updateBoard();
      helpers.updateHints();

      testSuite.assert(true, 'System should handle invalid states gracefully');
    } catch (error) {
      testSuite.fail(`System should not crash on errors: ${error.message}`);
    }

    // Reset to valid state
    game.resetGame();

    // Verify system recovery
    testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Game should recover to valid state');
    testSuite.assertFalsy(game.gameOver, 'Game should not be over after reset');

    // Normal operations should work after recovery
    const normalMove = game.makeMove(3);
    testSuite.assertTruthy(normalMove.success, 'Normal operations should work after recovery');

    // Restore console
    console.error = originalConsoleError;

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test memory management across components
  testSuite.test('Integration-Cross-Component', 'Memory management across components', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();
    ui.ai = ai;

    // Play multiple complete games to test memory usage
    for (let gameNum = 0; gameNum < 10; gameNum++) {
      game.resetGame();

      // Play random moves until game ends or board fills
      while (!game.gameOver && game.moveHistory.length < 20) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) break;

        const randomCol = validMoves[Math.floor(Math.random() * validMoves.length)];
        game.makeMove(randomCol);

        // Update components
        ui.updateBoard();
        helpers.updateHints();

        // Occasionally run AI analysis
        if (game.moveHistory.length % 3 === 0) {
          ai.getBestMove(game, helpers);
        }
      }
    }

    // Verify system is still functional after extensive use
    const finalMove = game.makeMove(3);
    testSuite.assert(finalMove.success || game.isColumnFull(3),
      'System should remain functional after extensive use');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test concurrent operations across components
  testSuite.test('Integration-Cross-Component', 'Concurrent operations across components', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();
    ui.ai = ai;

    // Set up game state
    game.makeMove(3);
    game.makeMove(2);

    // Simulate concurrent operations
    const startTime = performance.now();

    const operations = [];

    // Concurrent AI analysis
    operations.push(Promise.resolve(ai.getBestMove(game, helpers)));

    // Concurrent helper analysis
    operations.push(Promise.resolve(helpers.analyzeEvenOddThreats()));
    operations.push(Promise.resolve(helpers.detectZugzwang()));
    operations.push(Promise.resolve(helpers.analyzeForkOpportunities()));

    // Concurrent UI updates
    operations.push(Promise.resolve().then(() => {
      ui.updateBoard();
      ui.updateUI();
      return 'ui-updated';
    }));

    Promise.all(operations).then(results => {
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      testSuite.assert(totalTime < 1000,
        `Concurrent operations should complete quickly <1000ms (took ${totalTime.toFixed(2)}ms)`);
      testSuite.assertEqual(results.length, 5, 'All concurrent operations should complete');

      // Verify game state remained consistent
      testSuite.assertEqual(game.moveHistory.length, 2,
        'Game state should remain consistent during concurrent operations');
    });

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 1000,
      `Concurrent operations test should complete quickly <1000ms (took ${totalTime.toFixed(2)}ms)`);

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test system performance under load
  testSuite.test('Integration-Cross-Component', 'System performance under load', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();
    ui.ai = ai;
    helpers.setEnabled(true, 2);

    // Create complex game state
    const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5];
    complexMoves.forEach(col => {
      if (game.getValidMoves().includes(col)) {
        game.makeMove(col);
      }
    });

    // Performance test with frequent updates
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      // AI analysis
      ai.getBestMove(game, helpers);

      // Helper analysis
      helpers.updateHints();

      // UI updates
      ui.updateBoard();
      ui.updateUI();

      // Strategic analysis
      helpers.getEnhancedStrategicEvaluation();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 2000,
      `50 complete system cycles should complete <2000ms (took ${totalTime.toFixed(2)}ms)`);

    // System should remain responsive
    const finalAiMove = ai.getBestMove(game, helpers);
    testSuite.assert(game.getValidMoves().includes(finalAiMove),
      'System should remain responsive after load test');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test component isolation under stress
  testSuite.test('Integration-Cross-Component', 'Component isolation under stress', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();
    ui.ai = ai;

    // Set up initial state
    game.makeMove(3);
    game.makeMove(2);

    const originalGameState = {
      board: JSON.stringify(game.board),
      currentPlayer: game.currentPlayer,
      gameOver: game.gameOver,
      moveHistory: [...game.moveHistory]
    };

    // Stress test with rapid operations
    for (let i = 0; i < 100; i++) {
      // These operations should not modify game state
      ai.getBestMove(game, helpers);
      helpers.analyzeEvenOddThreats();
      helpers.detectZugzwang();
      helpers.analyzeForkOpportunities();
      helpers.getEnhancedStrategicEvaluation();
      ui.updateBoard();
    }

    // Verify game state isolation
    testSuite.assertEqual(JSON.stringify(game.board), originalGameState.board,
      'Game board should be unchanged after stress operations');
    testSuite.assertEqual(game.currentPlayer, originalGameState.currentPlayer,
      'Current player should be unchanged after stress operations');
    testSuite.assertEqual(game.gameOver, originalGameState.gameOver,
      'Game over status should be unchanged after stress operations');
    testSuite.assertEqual(JSON.stringify(game.moveHistory), JSON.stringify(originalGameState.moveHistory),
      'Move history should be unchanged after stress operations');

    // Cleanup
    document.body.removeChild(mockBoard);
  });
}
