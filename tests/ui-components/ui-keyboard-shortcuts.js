/**
 * UI Keyboard Shortcuts Tests
 *
 * Tests für erweiterte Keyboard-Shortcuts für Buttons und Navigation
 * Coverage: F5, F9, F10, Ctrl+N, Ctrl+U, Ctrl+Backspace
 */
function runUIKeyboardShortcutsTests(testSuite) {

  // Test F5 for new game
  testSuite.test('UI-Keyboard-Shortcuts', 'F5 triggers new game', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Make some moves first
    game.makeMove(3);
    game.makeMove(2);
    testSuite.assert(game.moveHistory.length > 0, 'Game should have move history');

    // Simulate F5 press
    const f5Event = new KeyboardEvent('keydown', { key: 'F5', bubbles: true });

    // Override handleNewGame to track if it was called
    let newGameCalled = false;
    const originalHandleNewGame = ui.handleNewGame;
    ui.handleNewGame = () => {
      newGameCalled = true;
      originalHandleNewGame.call(ui);
    };

    ui.handleKeyPress(f5Event);

    testSuite.assertTruthy(newGameCalled, 'F5 should trigger new game');
    testSuite.assertEqual(game.moveHistory.length, 0, 'Move history should be cleared');
  });

  // Test F9 for undo
  testSuite.test('UI-Keyboard-Shortcuts', 'F9 triggers undo', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Make some moves
    game.makeMove(3);
    game.makeMove(2);
    const moveCountBefore = game.moveHistory.length;

    // Simulate F9 press
    const f9Event = new KeyboardEvent('keydown', { key: 'F9', bubbles: true });

    let undoCalled = false;
    const originalHandleUndo = ui.handleUndo;
    ui.handleUndo = () => {
      undoCalled = true;
      originalHandleUndo.call(ui);
    };

    ui.handleKeyPress(f9Event);

    testSuite.assertTruthy(undoCalled, 'F9 should trigger undo');
    testSuite.assertEqual(game.moveHistory.length, moveCountBefore - 1,
      'Move count should be reduced by 1');
  });

  // Test F10 for reset score
  testSuite.test('UI-Keyboard-Shortcuts', 'F10 triggers reset score', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Set some scores
    game.score.red = 3;
    game.score.yellow = 2;

    // Simulate F10 press
    const f10Event = new KeyboardEvent('keydown', { key: 'F10', bubbles: true });

    let resetScoreCalled = false;
    const originalHandleResetScore = ui.handleResetScore;
    ui.handleResetScore = () => {
      resetScoreCalled = true;
      originalHandleResetScore.call(ui);
    };

    ui.handleKeyPress(f10Event);

    testSuite.assertTruthy(resetScoreCalled, 'F10 should trigger reset score');
    testSuite.assertEqual(game.score.red, 0, 'Red score should be reset');
    testSuite.assertEqual(game.score.yellow, 0, 'Yellow score should be reset');
  });

  // Test Ctrl+N for new game
  testSuite.test('UI-Keyboard-Shortcuts', 'Ctrl+N triggers new game', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Make some moves
    game.makeMove(3);
    testSuite.assert(game.moveHistory.length > 0, 'Game should have move history');

    // Simulate Ctrl+N press
    const ctrlNEvent = new KeyboardEvent('keydown', {
      key: 'N',
      ctrlKey: true,
      bubbles: true
    });

    let newGameCalled = false;
    const originalHandleNewGame = ui.handleNewGame;
    ui.handleNewGame = () => {
      newGameCalled = true;
      originalHandleNewGame.call(ui);
    };

    ui.handleKeyPress(ctrlNEvent);

    testSuite.assertTruthy(newGameCalled, 'Ctrl+N should trigger new game');
    testSuite.assertEqual(game.moveHistory.length, 0, 'Move history should be cleared');
  });

  // Test Ctrl+U for undo
  testSuite.test('UI-Keyboard-Shortcuts', 'Ctrl+U triggers undo', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Make some moves
    game.makeMove(3);
    game.makeMove(2);
    const moveCountBefore = game.moveHistory.length;

    // Simulate Ctrl+U press
    const ctrlUEvent = new KeyboardEvent('keydown', {
      key: 'U',
      ctrlKey: true,
      bubbles: true
    });

    let undoCalled = false;
    const originalHandleUndo = ui.handleUndo;
    ui.handleUndo = () => {
      undoCalled = true;
      originalHandleUndo.call(ui);
    };

    ui.handleKeyPress(ctrlUEvent);

    testSuite.assertTruthy(undoCalled, 'Ctrl+U should trigger undo');
    testSuite.assertEqual(game.moveHistory.length, moveCountBefore - 1,
      'Move count should be reduced by 1');
  });

  // Test Ctrl+Backspace for back navigation
  testSuite.test('UI-Keyboard-Shortcuts', 'Ctrl+Backspace triggers back navigation', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Simulate Ctrl+Backspace press
    const ctrlBackspaceEvent = new KeyboardEvent('keydown', {
      key: 'Backspace',
      ctrlKey: true,
      bubbles: true
    });

    let backCalled = false;
    const originalHandleBack = ui.handleBack;
    ui.handleBack = () => {
      backCalled = true;
      // Don't actually navigate in test
    };

    ui.handleKeyPress(ctrlBackspaceEvent);

    testSuite.assertTruthy(backCalled, 'Ctrl+Backspace should trigger back navigation');
  });

  // Test case sensitivity (lowercase and uppercase)
  testSuite.test('UI-Keyboard-Shortcuts', 'Shortcuts work with lowercase and uppercase', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    let newGameCount = 0;
    let undoCount = 0;

    const originalHandleNewGame = ui.handleNewGame;
    const originalHandleUndo = ui.handleUndo;

    ui.handleNewGame = () => {
      newGameCount++;
      originalHandleNewGame.call(ui);
    };

    ui.handleUndo = () => {
      undoCount++;
      originalHandleUndo.call(ui);
    };

    // Test lowercase
    const ctrlNLower = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true
    });
    ui.handleKeyPress(ctrlNLower);

    // Test uppercase
    const ctrlNUpper = new KeyboardEvent('keydown', {
      key: 'N',
      ctrlKey: true,
      bubbles: true
    });
    ui.handleKeyPress(ctrlNUpper);

    // Test undo lowercase
    game.makeMove(3); // Add a move to undo
    const ctrlULower = new KeyboardEvent('keydown', {
      key: 'u',
      ctrlKey: true,
      bubbles: true
    });
    ui.handleKeyPress(ctrlULower);

    testSuite.assertEqual(newGameCount, 2, 'Both lowercase and uppercase N should work');
    testSuite.assertEqual(undoCount, 1, 'Lowercase u should work');
  });

  // Test Meta key (Cmd on Mac) support
  testSuite.test('UI-Keyboard-Shortcuts', 'Meta key (Cmd) support', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    let actionCount = 0;

    const originalHandleNewGame = ui.handleNewGame;
    ui.handleNewGame = () => {
      actionCount++;
      originalHandleNewGame.call(ui);
    };

    // Test Cmd+N (Mac)
    const cmdNEvent = new KeyboardEvent('keydown', {
      key: 'N',
      metaKey: true,
      bubbles: true
    });
    ui.handleKeyPress(cmdNEvent);

    testSuite.assertEqual(actionCount, 1, 'Meta key (Cmd) should work like Ctrl');
  });

  // Test preventDefault behavior
  testSuite.test('UI-Keyboard-Shortcuts', 'Shortcuts prevent default browser behavior', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Test F5 (normally refreshes page)
    const f5Event = new KeyboardEvent('keydown', { key: 'F5', bubbles: true });
    let defaultPrevented = false;

    f5Event.preventDefault = () => {
      defaultPrevented = true;
    };

    ui.handleKeyPress(f5Event);

    testSuite.assertTruthy(defaultPrevented, 'F5 should prevent default browser refresh');

    // Test Ctrl+R (normally refreshes page)
    const ctrlREvent = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      bubbles: true
    });
    defaultPrevented = false;

    ctrlREvent.preventDefault = () => {
      defaultPrevented = true;
    };

    ui.handleKeyPress(ctrlREvent);

    testSuite.assertTruthy(defaultPrevented, 'Ctrl+R should prevent default browser refresh');
  });

  // Test existing shortcuts still work
  testSuite.test('UI-Keyboard-Shortcuts', 'Existing shortcuts still functional', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock modal elements
    const mockHelpModal = document.createElement('div');
    mockHelpModal.id = 'helpModal';
    const mockHintsModal = document.createElement('div');
    mockHintsModal.id = 'hintsModal';

    document.body.appendChild(mockHelpModal);
    document.body.appendChild(mockHintsModal);

    ui.helpModal = mockHelpModal;
    ui.hintsModal = mockHintsModal;

    // Test F1 for help
    const f1Event = new KeyboardEvent('keydown', { key: 'F1', bubbles: true });
    ui.handleKeyPress(f1Event);

    testSuite.assertTruthy(mockHelpModal.classList.contains('active'),
      'F1 should still open help modal');

    // Test F2 for hints
    const f2Event = new KeyboardEvent('keydown', { key: 'F2', bubbles: true });
    ui.handleKeyPress(f2Event);

    testSuite.assertTruthy(mockHintsModal.classList.contains('active'),
      'F2 should still open hints modal');

    // Cleanup
    document.body.removeChild(mockHelpModal);
    document.body.removeChild(mockHintsModal);
  });

  // Test keyboard shortcuts during game states
  testSuite.test('UI-Keyboard-Shortcuts', 'Shortcuts work during different game states', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    let actionsCalled = 0;

    const originalHandleNewGame = ui.handleNewGame;
    ui.handleNewGame = () => {
      actionsCalled++;
      originalHandleNewGame.call(ui);
    };

    // Test during normal gameplay
    game.makeMove(3);
    const f5Event = new KeyboardEvent('keydown', { key: 'F5', bubbles: true });
    ui.handleKeyPress(f5Event);

    testSuite.assertEqual(actionsCalled, 1, 'Shortcuts should work during gameplay');

    // Test when game is over
    game.gameOver = true;
    ui.handleKeyPress(f5Event);

    testSuite.assertEqual(actionsCalled, 2, 'Shortcuts should work when game is over');

    // Test when AI is thinking (should still work for non-move actions)
    ui.aiThinking = true;
    ui.handleKeyPress(f5Event);

    testSuite.assertEqual(actionsCalled, 3, 'Non-move shortcuts should work during AI thinking');
  });
}
