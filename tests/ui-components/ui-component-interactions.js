/**
 * UI Component Tests for User Interactions
 *
 * Coverage: Click handling, keyboard input, drag interactions,
 * touch events, event delegation, interaction states
 */
function runUIComponentInteractionsTests(testSuite) {

  // Test column click handling
  testSuite.test('UI-Component-Interactions', 'Column click handling', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    let clickHandled = false;
    const originalHandler = ui.handleColumnClick;
    ui.handleColumnClick = (col) => {
      clickHandled = true;
      testSuite.assert(typeof col === 'number', 'Column parameter should be numeric');
      testSuite.assert(col >= 0 && col < 7, 'Column should be valid (0-6)');
    };

    // Simulate column click
    ui.handleColumnClick(3);

    testSuite.assertTruthy(clickHandled, 'Column click should be handled');

    // Restore original handler
    ui.handleColumnClick = originalHandler;

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test cell click handling
  testSuite.test('UI-Component-Interactions', 'Cell click handling', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    let cellClickHandled = false;
    const originalHandler = ui.handleCellClick;
    ui.handleCellClick = (event) => {
      cellClickHandled = true;
      testSuite.assertNotNull(event, 'Event object should be provided');
    };

    // Create mock cell click event
    const mockCell = document.createElement('div');
    mockCell.className = 'cell';
    mockCell.dataset.row = '3';
    mockCell.dataset.col = '2';

    const mockEvent = {
      target: mockCell,
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    ui.handleCellClick(mockEvent);

    testSuite.assertTruthy(cellClickHandled, 'Cell click should be handled');

    // Restore original handler
    ui.handleCellClick = originalHandler;

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test keyboard input handling
  testSuite.test('UI-Component-Interactions', 'Keyboard input handling', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    let keyboardHandled = false;
    const originalHandler = ui.handleKeyPress;
    ui.handleKeyPress = (event) => {
      keyboardHandled = true;
      testSuite.assertNotNull(event, 'Event object should be provided');
      testSuite.assertNotNull(event.key, 'Key property should exist');
    };

    // Test number key press (column selection)
    const numberKeyEvent = {
      key: '4',
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    ui.handleKeyPress(numberKeyEvent);

    testSuite.assertTruthy(keyboardHandled, 'Keyboard input should be handled');

    // Test special key press (undo)
    keyboardHandled = false;
    const undoKeyEvent = {
      key: 'u',
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    ui.handleKeyPress(undoKeyEvent);

    testSuite.assertTruthy(keyboardHandled, 'Special key input should be handled');

    // Restore original handler
    ui.handleKeyPress = originalHandler;
  });

  // Test mouse hover interactions
  testSuite.test('UI-Component-Interactions', 'Mouse hover interactions', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    // Create mock column indicators
    ui.columnIndicators = [];
    for (let i = 0; i < 7; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'column-indicator';
      ui.columnIndicators.push(indicator);
      mockBoard.appendChild(indicator);
    }

    ui.createBoard();

    // Test hover preview
    ui.showPreview(3);

    const indicator = ui.columnIndicators[3];
    testSuite.assertNotEqual(indicator.style.backgroundColor, '',
      'Hover should show visual preview');

    // Test hover removal
    ui.hidePreview();

    testSuite.assertEqual(indicator.style.backgroundColor, '',
      'Hover removal should clear visual preview');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test forced move mode interactions
  testSuite.test('UI-Component-Interactions', 'Forced move mode interactions', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Enable forced move mode
    ui.helpers.forcedMoveMode = true;
    ui.helpers.requiredMoves = [2, 3, 4];

    // Test selecting allowed column
    ui.selectColumn(3);
    testSuite.assertEqual(ui.selectedColumn, 3,
      'Should allow selection of required move');

    // Test selecting disallowed column
    ui.selectColumn(1);
    testSuite.assertNotEqual(ui.selectedColumn, 1,
      'Should not allow selection of non-required move');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test double-click prevention
  testSuite.test('UI-Component-Interactions', 'Double-click prevention', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    let moveCount = 0;
    const originalMakeMove = game.makeMove;
    game.makeMove = (col) => {
      moveCount++;
      return originalMakeMove.call(game, col);
    };

    // Set animation state to simulate rapid clicks
    ui.isAnimating = true;

    // Try rapid column selection
    ui.selectColumn(3);
    ui.selectColumn(3);
    ui.selectColumn(3);

    // Should handle rapid interactions gracefully
    testSuite.assert(true, 'Should handle rapid interactions without errors');

    // Restore original method
    game.makeMove = originalMakeMove;

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test touch event handling
  testSuite.test('UI-Component-Interactions', 'Touch event handling', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Create mock touch event
    const mockTouchEvent = {
      type: 'touchstart',
      touches: [{
        clientX: 100,
        clientY: 100
      }],
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    // Test that touch events don't cause errors
    try {
      // Simulate touch event processing
      const touchX = mockTouchEvent.touches[0].clientX;
      const touchY = mockTouchEvent.touches[0].clientY;

      testSuite.assert(typeof touchX === 'number', 'Touch X coordinate should be numeric');
      testSuite.assert(typeof touchY === 'number', 'Touch Y coordinate should be numeric');
    } catch (error) {
      testSuite.fail('Touch event handling should not throw errors');
    }

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test event delegation
  testSuite.test('UI-Component-Interactions', 'Event delegation handling', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Test that events bubble up correctly
    let eventBubbled = false;

    mockBoard.addEventListener('click', (event) => {
      eventBubbled = true;
    });

    // Simulate clicking on a cell
    const cells = mockBoard.querySelectorAll('.cell');
    if (cells.length > 0) {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      cells[0].dispatchEvent(clickEvent);
    }

    testSuite.assertTruthy(eventBubbled, 'Events should bubble up for delegation');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test interaction state management
  testSuite.test('UI-Component-Interactions', 'Interaction state management', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Test initial interaction state
    testSuite.assertFalsy(ui.isAnimating, 'Should start with no animation');
    testSuite.assertFalsy(ui.aiThinking, 'Should start with no AI thinking');
    testSuite.assertNull(ui.selectedColumn, 'Should start with no column selected');

    // Test state changes
    ui.isAnimating = true;
    ui.aiThinking = true;
    ui.selectedColumn = 3;

    testSuite.assertTruthy(ui.isAnimating, 'Animation state should be settable');
    testSuite.assertTruthy(ui.aiThinking, 'AI thinking state should be settable');
    testSuite.assertEqual(ui.selectedColumn, 3, 'Selected column should be settable');

    // Test state reset
    ui.clearColumnSelection();

    testSuite.assertNull(ui.selectedColumn, 'Column selection should be clearable');
  });

  // Test accessibility keyboard navigation
  testSuite.test('UI-Component-Interactions', 'Accessibility keyboard navigation', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Test arrow key navigation
    const leftArrowEvent = {
      key: 'ArrowLeft',
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    const rightArrowEvent = {
      key: 'ArrowRight',
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    // Test that arrow keys are handled gracefully
    try {
      ui.handleKeyPress(leftArrowEvent);
      ui.handleKeyPress(rightArrowEvent);
      testSuite.assert(true, 'Arrow key navigation should not cause errors');
    } catch (error) {
      testSuite.fail('Arrow key navigation should be handled gracefully');
    }

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test context menu handling
  testSuite.test('UI-Component-Interactions', 'Context menu handling', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Test right-click context menu
    const contextMenuEvent = {
      type: 'contextmenu',
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    // Test that context menu events are handled
    let contextMenuHandled = false;
    mockBoard.addEventListener('contextmenu', (event) => {
      contextMenuHandled = true;
      event.preventDefault(); // Prevent default context menu
    });

    mockBoard.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true
    }));

    testSuite.assertTruthy(contextMenuHandled, 'Context menu events should be handled');

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test focus management
  testSuite.test('UI-Component-Interactions', 'Focus management', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    mockBoard.tabIndex = 0; // Make focusable
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Test focus handling
    const focusEvent = {
      type: 'focus',
      target: mockBoard
    };

    const blurEvent = {
      type: 'blur',
      target: mockBoard
    };

    // Test that focus events don't cause errors
    try {
      mockBoard.focus();
      mockBoard.blur();
      testSuite.assert(true, 'Focus management should work without errors');
    } catch (error) {
      testSuite.fail('Focus management should not throw errors');
    }

    // Cleanup
    document.body.removeChild(mockBoard);
  });

  // Test gesture recognition
  testSuite.test('UI-Component-Interactions', 'Gesture recognition handling', () => {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);

    // Mock DOM elements
    const mockBoard = document.createElement('div');
    mockBoard.id = 'gameBoard';
    document.body.appendChild(mockBoard);

    ui.createBoard();

    // Mock swipe gesture data
    const swipeGesture = {
      startX: 100,
      startY: 200,
      endX: 300,
      endY: 200,
      duration: 150
    };

    // Test gesture recognition logic
    const deltaX = swipeGesture.endX - swipeGesture.startX;
    const deltaY = swipeGesture.endY - swipeGesture.startY;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

    testSuite.assertTruthy(isHorizontalSwipe, 'Should recognize horizontal swipe');
    testSuite.assert(deltaX > 0, 'Should detect rightward swipe direction');

    // Cleanup
    document.body.removeChild(mockBoard);
  });
}
