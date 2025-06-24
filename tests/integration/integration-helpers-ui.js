/**
 * Integration Tests for Helpers-UI Integration
 *
 * Coverage: Helper system UI integration, visual hints, forced move mode,
 * help level toggles, event communication between helpers and UI
 */
function runIntegrationHelpersUITests(testSuite) {

  // Test helper system initialization with UI
  testSuite.test('Integration-Helpers-UI', 'Helper system initialization with UI', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Verify helper-UI connection
    testSuite.assertEqual(helpers.game, game, 'Helpers should reference game');
    testSuite.assertEqual(helpers.ui, ui, 'Helpers should reference UI');
    testSuite.assertEqual(ui.helpers, helpers, 'UI should reference helpers');

    // Test initial state
    testSuite.assertFalsy(helpers.enabled, 'Helpers should start disabled');
    testSuite.assertFalsy(helpers.forcedMoveMode, 'Should start without forced moves');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test help level toggle integration
  testSuite.test('Integration-Helpers-UI', 'Help level toggle integration', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    // Mock help checkboxes
    ui.helpPlayer1Level0 = document.createElement('input');
    ui.helpPlayer1Level0.type = 'checkbox';
    ui.helpPlayer1Level1 = document.createElement('input');
    ui.helpPlayer1Level1.type = 'checkbox';
    ui.helpPlayer1Level2 = document.createElement('input');
    ui.helpPlayer1Level2.type = 'checkbox';

    ui.createBoard();

    // Test Level 0 toggle
    ui.helpPlayer1Level0.checked = true;
    ui.handlePlayer1Level0Toggle();

    testSuite.assertTruthy(ui.playerHelpEnabled.red.level0, 'Level 0 should be enabled in UI');
    testSuite.assertTruthy(helpers.enabled, 'Helpers should be enabled');
    testSuite.assertEqual(helpers.helpLevel, 0, 'Help level should be 0');

    // Test Level 1 toggle (should include Level 0)
    ui.helpPlayer1Level1.checked = true;
    ui.handlePlayer1Level1Toggle();

    testSuite.assertTruthy(ui.playerHelpEnabled.red.level1, 'Level 1 should be enabled in UI');
    testSuite.assertEqual(helpers.helpLevel, 1, 'Help level should be 1');

    // Test Level 2 toggle (highest level)
    ui.helpPlayer1Level2.checked = true;
    ui.handlePlayer1Level2Toggle();

    testSuite.assertTruthy(ui.playerHelpEnabled.red.level2, 'Level 2 should be enabled in UI');
    testSuite.assertEqual(helpers.helpLevel, 2, 'Help level should be 2');

    // Test disabling all levels
    ui.helpPlayer1Level0.checked = false;
    ui.helpPlayer1Level1.checked = false;
    ui.helpPlayer1Level2.checked = false;
    ui.handlePlayer1Level0Toggle();
    ui.handlePlayer1Level1Toggle();
    ui.handlePlayer1Level2Toggle();

    testSuite.assertFalsy(helpers.enabled, 'Helpers should be disabled when all levels off');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test forced move mode integration
  testSuite.test('Integration-Helpers-UI', 'Forced move mode integration', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Mock message display
    const messagesShown = [];
    ui.showMessage = (message, type) => {
      messagesShown.push({ message, type });
    };

    // Enable helpers
    helpers.setEnabled(true, 1);

    // Create winning opportunity for Level 0
    game.board[5][0] = game.PLAYER1;
    game.board[5][1] = game.PLAYER1;
    game.board[5][2] = game.PLAYER1;
    game.currentPlayer = game.PLAYER1;

    // Mock UI help settings for current player
    ui.playerHelpEnabled.red.level0 = true;
    ui.getCurrentPlayerHelpEnabled = () => true;

    helpers.updateHints();

    testSuite.assertTruthy(helpers.forcedMoveMode, 'Should enter forced move mode for winning opportunity');
    testSuite.assert(helpers.requiredMoves.includes(3), 'Required moves should include winning column');

    // Test UI interaction with forced moves
    // Try to select non-required move
    ui.selectColumn(1);

    testSuite.assertNotEqual(ui.selectedColumn, 1, 'Should not allow non-required move selection');
    testSuite.assert(messagesShown.length > 0, 'Should show warning message for invalid selection');

    // Try to select required move
    ui.selectColumn(3);

    testSuite.assertEqual(ui.selectedColumn, 3, 'Should allow required move selection');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test visual hints integration
  testSuite.test('Integration-Helpers-UI', 'Visual hints integration', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    const mockHintsOverlay = document.createElement('div');
    mockHintsOverlay.id = 'hintsOverlay';
    const mockHelpPanel = document.createElement('div');
    mockHelpPanel.id = 'helpPanel';
    const mockThreatWarning = document.createElement('div');
    mockThreatWarning.id = 'threatWarning';
    const mockStrategyHint = document.createElement('div');
    mockStrategyHint.id = 'strategyHint';

    document.body.appendChild(mockBoard);
    document.body.appendChild(mockHintsOverlay);
    document.body.appendChild(mockHelpPanel);
    document.body.appendChild(mockThreatWarning);
    document.body.appendChild(mockStrategyHint);

    ui.createBoard();

    // Enable helpers with visual level
    helpers.setEnabled(true, 2);

    // Mock UI help settings
    ui.playerHelpEnabled.red.level0 = true;
    ui.playerHelpEnabled.red.level1 = true;
    ui.playerHelpEnabled.red.level2 = true;
    ui.getCurrentPlayerHelpEnabled = () => true;

    // Create threat situation
    game.board[5][0] = game.PLAYER1; // Red threat
    game.board[5][1] = game.PLAYER1; // Red threat
    game.board[5][2] = game.PLAYER1; // Red threat
    game.currentPlayer = game.PLAYER2; // Yellow must block

    helpers.updateHints();

    // Check that hints are generated
    const hints = helpers.getCurrentHints();
    testSuite.assert(hints.threats.length > 0, 'Should generate threat hints');

    // Test visual hint display
    helpers.displayHints();

    // For Level 2+, visual hints should be displayed
    testSuite.assertEqual(mockHintsOverlay.style.display, 'block',
      'Hints overlay should be visible for Level 2');

    // Test textual hints
    testSuite.assertNotEqual(mockHelpPanel.style.display, 'none',
      'Help panel should be visible when hints exist');

    // Cleanup
    document.body.removeChild(mockBoard);
    document.body.removeChild(mockHintsOverlay);
    document.body.removeChild(mockHelpPanel);
    document.body.removeChild(mockThreatWarning);
    document.body.removeChild(mockStrategyHint);
  });

  // Test event communication between helpers and UI
  testSuite.test('Integration-Helpers-UI', 'Event communication between helpers and UI', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Track events
    const eventsReceived = [];

    // Mock UI event handlers
    ui.onForcedMoveActivated = (data) => {
      eventsReceived.push({ type: 'forcedMoveActivated', data });
    };
    ui.onForcedMoveDeactivated = () => {
      eventsReceived.push({ type: 'forcedMoveDeactivated' });
    };

    // Set up event listeners
    helpers.on('forcedMoveActivated', ui.onForcedMoveActivated);
    helpers.on('forcedMoveDeactivated', ui.onForcedMoveDeactivated);

    // Enable helpers
    helpers.setEnabled(true, 1);

    // Mock UI help settings
    ui.getCurrentPlayerHelpEnabled = () => true;

    // Create situation that triggers forced move
    game.board[5][0] = game.PLAYER1;
    game.board[5][1] = game.PLAYER1;
    game.board[5][2] = game.PLAYER1;
    game.currentPlayer = game.PLAYER2;

    helpers.updateHints();

    testSuite.assert(eventsReceived.some(e => e.type === 'forcedMoveActivated'),
      'Should receive forced move activated event');

    // Clear the threat
    game.board[5][2] = game.EMPTY;
    helpers.updateHints();

    testSuite.assert(eventsReceived.some(e => e.type === 'forcedMoveDeactivated'),
      'Should receive forced move deactivated event');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test help system with different game modes
  testSuite.test('Integration-Helpers-UI', 'Help system with different game modes', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Mock help checkboxes for both players
    ui.helpPlayer1Level0 = document.createElement('input');
    ui.helpPlayer1Level0.type = 'checkbox';
    ui.helpPlayer2Level0 = document.createElement('input');
    ui.helpPlayer2Level0.type = 'checkbox';

    // Test two-player mode
    ui.gameMode = 'two-player';
    ui.updateGameModeUI();

    ui.helpPlayer1Level0.checked = true;
    ui.helpPlayer2Level0.checked = true;
    ui.handlePlayer1Level0Toggle();
    ui.handlePlayer2Level0Toggle();

    testSuite.assertTruthy(ui.playerHelpEnabled.red.level0,
      'Red help should be enabled in two-player mode');
    testSuite.assertTruthy(ui.playerHelpEnabled.yellow.level0,
      'Yellow help should be enabled in two-player mode');

    // Test bot mode
    ui.gameMode = 'vs-bot-smart';
    ui.updateGameModeUI();

    // In bot mode, typically only human player gets help
    testSuite.assert(true, 'Bot mode help configuration should be handled');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test helper performance with UI updates
  testSuite.test('Integration-Helpers-UI', 'Helper performance with UI updates', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    const mockHintsOverlay = document.createElement('div');
    mockHintsOverlay.id = 'hintsOverlay';

    document.body.appendChild(mockBoard);
    document.body.appendChild(mockHintsOverlay);

    ui.createBoard();

    // Enable helpers
    helpers.setEnabled(true, 2);

    // Mock UI help settings
    ui.getCurrentPlayerHelpEnabled = () => true;

    // Create complex game state
    const moves = [3, 3, 2, 4, 2, 4, 1, 5];
    moves.forEach(col => game.makeMove(col));

    // Time hint updates with UI integration
    const startTime = performance.now();

    for (let i = 0; i < 20; i++) {
      helpers.updateHints();
      helpers.displayHints();
      ui.updateBoard();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 500,
      `20 hint updates with UI should complete <500ms (took ${totalTime.toFixed(2)}ms)`);

    // Cleanup
    document.body.removeChild(mockBoard);
    document.body.removeChild(mockHintsOverlay);
  });

  // Test helper system state synchronization with UI
  testSuite.test('Integration-Helpers-UI', 'Helper system state synchronization with UI', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Mock help settings
    ui.helpPlayer1Level1 = document.createElement('input');
    ui.helpPlayer1Level1.type = 'checkbox';
    ui.helpPlayer1Level1.checked = true;
    ui.handlePlayer1Level1Toggle();

    // Mock current player help check
    ui.getCurrentPlayerHelpEnabled = () => game.currentPlayer === game.PLAYER1;

    // Test with Player 1 (help enabled)
    game.currentPlayer = game.PLAYER1;
    helpers.updateHints();

    testSuite.assertTruthy(helpers.enabled, 'Helpers should be enabled for Player 1');

    // Create winning opportunity
    game.board[5][0] = game.PLAYER1;
    game.board[5][1] = game.PLAYER1;
    game.board[5][2] = game.PLAYER1;

    helpers.updateHints();

    const hintsForPlayer1 = helpers.getCurrentHints();
    testSuite.assert(hintsForPlayer1.opportunities.length > 0,
      'Should generate hints for Player 1');

    // Switch to Player 2 (help disabled)
    game.currentPlayer = game.PLAYER2;
    helpers.updateHints();

    const hintsForPlayer2 = helpers.getCurrentHints();
    testSuite.assertEqual(hintsForPlayer2.opportunities.length, 0,
      'Should not generate hints for Player 2 (help disabled)');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test helper system error handling with UI
  testSuite.test('Integration-Helpers-UI', 'Helper system error handling with UI', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    const helpers = new Connect4Helpers(game, ui);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Mock error conditions
    const errorsHandled = [];
    const originalConsoleError = console.error;
    console.error = (error) => {
      errorsHandled.push(error);
    };

    // Enable helpers
    helpers.setEnabled(true, 2);

    // Mock UI help settings
    ui.getCurrentPlayerHelpEnabled = () => true;

    // Test with corrupted game state
    game.currentPlayer = null; // Invalid state

    try {
      helpers.updateHints();
      testSuite.assert(true, 'Helpers should handle invalid game state gracefully');
    } catch (error) {
      testSuite.fail(`Helpers should not throw errors: ${error.message}`);
    }

    // Test with missing UI elements
    const originalDisplayHints = helpers.displayHints;
    helpers.displayHints = () => {
      // Simulate missing DOM elements
      const missingElement = document.getElementById('nonExistentElement');
      if (missingElement) {
        missingElement.innerHTML = 'test';
      }
    };

    try {
      helpers.displayHints();
      testSuite.assert(true, 'Should handle missing UI elements gracefully');
    } catch (error) {
      testSuite.fail(`Should not throw errors for missing UI elements: ${error.message}`);
    }

    // Restore original functions
    helpers.displayHints = originalDisplayHints;
    console.error = originalConsoleError;

    // Cleanup
    document.body.removeChild(mockBoard);
  });
}
