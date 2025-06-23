/**
 * UI Undo Conditional Tests
 * 
 * Tests für die bedingte Rückgängig-Funktionalität basierend auf Spielerhilfen
 * Coverage: Undo-Checkboxen, bedingte Button-Aktivierung, Spieler-spezifische Einstellungen
 */
function runUIUndoConditionalTests(testSuite) {
    
    // Test undo checkbox bindings exist
    testSuite.test('UI-Undo-Conditional', 'Undo checkboxes are properly bound', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM elements
        const mockUndoPlayer1 = document.createElement('input');
        mockUndoPlayer1.type = 'checkbox';
        mockUndoPlayer1.id = 'undoEnabledPlayer1';
        
        const mockUndoPlayer2 = document.createElement('input');
        mockUndoPlayer2.type = 'checkbox';
        mockUndoPlayer2.id = 'undoEnabledPlayer2';
        
        document.body.appendChild(mockUndoPlayer1);
        document.body.appendChild(mockUndoPlayer2);
        
        ui.bindElements();
        
        testSuite.assertTruthy(ui.undoEnabledPlayer1, 'Player 1 undo checkbox should be bound');
        testSuite.assertTruthy(ui.undoEnabledPlayer2, 'Player 2 undo checkbox should be bound');
        testSuite.assertEqual(ui.undoEnabledPlayer1.id, 'undoEnabledPlayer1', 'Player 1 checkbox should have correct ID');
        testSuite.assertEqual(ui.undoEnabledPlayer2.id, 'undoEnabledPlayer2', 'Player 2 checkbox should have correct ID');
        
        // Cleanup
        document.body.removeChild(mockUndoPlayer1);
        document.body.removeChild(mockUndoPlayer2);
    });
    
    // Test initial undo state
    testSuite.test('UI-Undo-Conditional', 'Initial undo state is disabled for both players', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        testSuite.assertEqual(ui.undoEnabled.red, false, 'Red player undo should be initially disabled');
        testSuite.assertEqual(ui.undoEnabled.yellow, false, 'Yellow player undo should be initially disabled');
    });
    
    // Test undo toggle handlers
    testSuite.test('UI-Undo-Conditional', 'Undo toggle handlers update state correctly', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock checkboxes
        ui.undoEnabledPlayer1 = { checked: false };
        ui.undoEnabledPlayer2 = { checked: false };
        
        // Mock updateUI method
        let updateUICalled = 0;
        const originalUpdateUI = ui.updateUI;
        ui.updateUI = () => { updateUICalled++; };
        
        // Test Player 1 toggle
        ui.undoEnabledPlayer1.checked = true;
        ui.handleUndoEnabledPlayer1Toggle();
        
        testSuite.assertEqual(ui.undoEnabled.red, true, 'Red player undo should be enabled after toggle');
        testSuite.assertEqual(updateUICalled, 1, 'updateUI should be called after toggle');
        
        // Test Player 2 toggle
        ui.undoEnabledPlayer2.checked = true;
        ui.handleUndoEnabledPlayer2Toggle();
        
        testSuite.assertEqual(ui.undoEnabled.yellow, true, 'Yellow player undo should be enabled after toggle');
        testSuite.assertEqual(updateUICalled, 2, 'updateUI should be called after second toggle');
        
        // Test toggle off
        ui.undoEnabledPlayer1.checked = false;
        ui.handleUndoEnabledPlayer1Toggle();
        
        testSuite.assertEqual(ui.undoEnabled.red, false, 'Red player undo should be disabled after toggle off');
        testSuite.assertEqual(updateUICalled, 3, 'updateUI should be called after toggle off');
    });
    
    // Test undo button state updates
    testSuite.test('UI-Undo-Conditional', 'Undo button state respects conditional settings', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock undo button
        ui.undoBtn = { disabled: false };
        
        // Make some moves to enable undo
        game.makeMove(3);
        game.makeMove(2);
        
        // Test with undo disabled for current player (red)
        ui.undoEnabled.red = false;
        ui.undoEnabled.yellow = true;
        ui.updateControls();
        
        testSuite.assertEqual(ui.undoBtn.disabled, true, 'Undo button should be disabled when undo not allowed for current player');
        
        // Test with undo enabled for current player
        ui.undoEnabled.red = true;
        ui.updateControls();
        
        testSuite.assertEqual(ui.undoBtn.disabled, false, 'Undo button should be enabled when undo allowed for current player');
        
        // Switch to yellow player and test
        game.makeMove(4); // This should make it yellow player's turn
        ui.undoEnabled.yellow = false;
        ui.updateControls();
        
        testSuite.assertEqual(ui.undoBtn.disabled, true, 'Undo button should be disabled for yellow player when not allowed');
        
        ui.undoEnabled.yellow = true;
        ui.updateControls();
        
        testSuite.assertEqual(ui.undoBtn.disabled, false, 'Undo button should be enabled for yellow player when allowed');
    });
    
    // Test handleUndo with conditional logic
    testSuite.test('UI-Undo-Conditional', 'handleUndo respects conditional settings', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock showMessage method
        let messageShown = null;
        ui.showMessage = (message, type) => {
            messageShown = { message, type };
        };
        
        // Make moves to enable undo
        game.makeMove(3);
        game.makeMove(2);
        const initialMoveCount = game.moveHistory.length;
        
        // Test undo blocked for current player (red)
        ui.undoEnabled.red = false;
        ui.undoEnabled.yellow = true;
        
        ui.handleUndo();
        
        testSuite.assertTruthy(messageShown, 'Warning message should be shown when undo not allowed');
        testSuite.assertEqual(messageShown.type, 'warning', 'Message should be warning type');
        testSuite.assertTruthy(messageShown.message.includes('nicht aktiviert'), 'Message should indicate undo not activated');
        testSuite.assertEqual(game.moveHistory.length, initialMoveCount, 'Move should not be undone when not allowed');
        
        // Test undo allowed for current player
        messageShown = null;
        ui.undoEnabled.red = true;
        
        ui.handleUndo();
        
        testSuite.assertEqual(messageShown, null, 'No warning message should be shown when undo allowed');
        testSuite.assertEqual(game.moveHistory.length, initialMoveCount - 1, 'Move should be undone when allowed');
    });
    
    // Test keyboard shortcuts respect undo settings
    testSuite.test('UI-Undo-Conditional', 'Keyboard shortcuts respect undo conditional settings', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock showMessage method
        let messageShown = null;
        ui.showMessage = (message, type) => {
            messageShown = { message, type };
        };
        
        // Make moves to enable undo
        game.makeMove(3);
        game.makeMove(2);
        const initialMoveCount = game.moveHistory.length;
        
        // Test F9 blocked when undo disabled
        ui.undoEnabled.red = false;
        
        const f9Event = new KeyboardEvent('keydown', { key: 'F9', bubbles: true });
        ui.handleKeyPress(f9Event);
        
        testSuite.assertTruthy(messageShown, 'F9 should show warning when undo not allowed');
        testSuite.assertEqual(game.moveHistory.length, initialMoveCount, 'F9 should not undo when not allowed');
        
        // Test Ctrl+U blocked when undo disabled
        messageShown = null;
        const ctrlUEvent = new KeyboardEvent('keydown', { key: 'U', ctrlKey: true, bubbles: true });
        ui.handleKeyPress(ctrlUEvent);
        
        testSuite.assertTruthy(messageShown, 'Ctrl+U should show warning when undo not allowed');
        testSuite.assertEqual(game.moveHistory.length, initialMoveCount, 'Ctrl+U should not undo when not allowed');
        
        // Test keyboard shortcut works when undo enabled
        messageShown = null;
        ui.undoEnabled.red = true;
        
        ui.handleKeyPress(f9Event);
        
        testSuite.assertEqual(messageShown, null, 'No warning should be shown when undo allowed');
        testSuite.assertEqual(game.moveHistory.length, initialMoveCount - 1, 'F9 should undo when allowed');
    });
    
    // Test player-specific undo settings
    testSuite.test('UI-Undo-Conditional', 'Player-specific undo settings work independently', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock undo button
        ui.undoBtn = { disabled: false };
        
        // Mock showMessage method
        let messagesShown = [];
        ui.showMessage = (message, type) => {
            messagesShown.push({ message, type });
        };
        
        // Make moves for both players
        game.makeMove(3); // Red player
        game.makeMove(2); // Yellow player
        game.makeMove(4); // Red player
        
        // Enable undo only for red player
        ui.undoEnabled.red = true;
        ui.undoEnabled.yellow = false;
        
        // Current player should be yellow (after 3 moves)
        const currentPlayer = game.currentPlayer;
        const isYellowTurn = currentPlayer === game.PLAYER2;
        
        if (isYellowTurn) {
            // Yellow player should not be able to undo
            ui.updateControls();
            testSuite.assertEqual(ui.undoBtn.disabled, true, 'Undo button should be disabled for yellow player');
            
            ui.handleUndo();
            testSuite.assertEqual(messagesShown.length, 1, 'Warning message should be shown for yellow player');
            testSuite.assertTruthy(messagesShown[0].message.includes('nicht aktiviert'), 'Warning should indicate undo not activated');
        }
        
        // Switch to red player's turn and test
        game.makeMove(5); // Yellow player move to switch turns
        
        // Now red player should be able to undo
        ui.updateControls();
        testSuite.assertEqual(ui.undoBtn.disabled, false, 'Undo button should be enabled for red player');
        
        const moveCountBefore = game.moveHistory.length;
        ui.handleUndo();
        testSuite.assertEqual(game.moveHistory.length, moveCountBefore - 1, 'Red player should be able to undo');
    });
    
    // Test undo settings persistence in UI
    testSuite.test('UI-Undo-Conditional', 'Undo checkbox states persist in modal', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock checkboxes
        const mockUndoPlayer1 = document.createElement('input');
        mockUndoPlayer1.type = 'checkbox';
        const mockUndoPlayer2 = document.createElement('input');
        mockUndoPlayer2.type = 'checkbox';
        
        ui.undoEnabledPlayer1 = mockUndoPlayer1;
        ui.undoEnabledPlayer2 = mockUndoPlayer2;
        
        // Test initial state
        testSuite.assertEqual(mockUndoPlayer1.checked, false, 'Player 1 checkbox should be initially unchecked');
        testSuite.assertEqual(mockUndoPlayer2.checked, false, 'Player 2 checkbox should be initially unchecked');
        
        // Change states
        mockUndoPlayer1.checked = true;
        ui.handleUndoEnabledPlayer1Toggle();
        
        mockUndoPlayer2.checked = true;
        ui.handleUndoEnabledPlayer2Toggle();
        
        testSuite.assertEqual(ui.undoEnabled.red, true, 'Red player undo state should match checkbox');
        testSuite.assertEqual(ui.undoEnabled.yellow, true, 'Yellow player undo state should match checkbox');
        
        // Change back
        mockUndoPlayer1.checked = false;
        ui.handleUndoEnabledPlayer1Toggle();
        
        testSuite.assertEqual(ui.undoEnabled.red, false, 'Red player undo state should update when checkbox unchecked');
        testSuite.assertEqual(ui.undoEnabled.yellow, true, 'Yellow player undo state should remain unchanged');
    });
    
    // Test undo button tooltip updates
    testSuite.test('UI-Undo-Conditional', 'Undo button reflects conditional state', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock undo button
        ui.undoBtn = { disabled: false, title: '' };
        
        // Make moves to enable testing
        game.makeMove(3);
        
        // Test disabled state shows in button properties
        ui.undoEnabled.red = false;
        ui.updateControls();
        
        testSuite.assertEqual(ui.undoBtn.disabled, true, 'Button should be disabled when undo not allowed');
        
        // Test enabled state
        ui.undoEnabled.red = true;
        ui.updateControls();
        
        testSuite.assertEqual(ui.undoBtn.disabled, false, 'Button should be enabled when undo allowed');
    });
}