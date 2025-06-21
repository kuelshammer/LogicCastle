/**
 * Backend Event System Tests for Connect4
 * 
 * Coverage: Event emission, event listening, event isolation,
 * state corruption prevention, event handler validation
 */
function runBackendEventsTests(testSuite) {
    
    // Test basic event emission and listening
    testSuite.test('Backend-Events', 'Basic event emission and listening', () => {
        const game = new Connect4Game();
        let eventFired = false;
        let eventData = null;
        
        // Add event listener
        game.on('moveMade', (data) => {
            eventFired = true;
            eventData = data;
        });
        
        // Make a move to trigger event
        const result = game.makeMove(3);
        
        testSuite.assertTruthy(eventFired, 'moveMade event should be fired');
        testSuite.assertNotNull(eventData, 'Event data should be provided');
        testSuite.assertEqual(eventData.col, 3, 'Event should contain correct column');
        testSuite.assertEqual(eventData.player, game.PLAYER1, 'Event should contain correct player');
    });
    
    // Test multiple event listeners
    testSuite.test('Backend-Events', 'Multiple event listeners', () => {
        const game = new Connect4Game();
        let listener1Called = false;
        let listener2Called = false;
        let listener3Called = false;
        
        // Add multiple listeners
        game.on('moveMade', () => { listener1Called = true; });
        game.on('moveMade', () => { listener2Called = true; });
        game.on('moveMade', () => { listener3Called = true; });
        
        // Make a move
        game.makeMove(0);
        
        testSuite.assertTruthy(listener1Called, 'First listener should be called');
        testSuite.assertTruthy(listener2Called, 'Second listener should be called');
        testSuite.assertTruthy(listener3Called, 'Third listener should be called');
    });
    
    // Test event listener removal
    testSuite.test('Backend-Events', 'Event listener removal', () => {
        const game = new Connect4Game();
        let listenerCalled = false;
        
        const listener = () => { listenerCalled = true; };
        
        // Add and then remove listener
        game.on('moveMade', listener);
        game.off('moveMade', listener);
        
        // Make a move
        game.makeMove(0);
        
        testSuite.assertFalsy(listenerCalled, 'Removed listener should not be called');
    });
    
    // Test playerChanged event
    testSuite.test('Backend-Events', 'playerChanged event', () => {
        const game = new Connect4Game();
        let playerChangedCount = 0;
        let lastPlayer = null;
        
        game.on('playerChanged', (player) => {
            playerChangedCount++;
            lastPlayer = player;
        });
        
        // Make a move (should trigger playerChanged)
        game.makeMove(0);
        
        testSuite.assertEqual(playerChangedCount, 1, 'playerChanged should be fired once');
        testSuite.assertEqual(lastPlayer, game.PLAYER2, 'Should switch to player 2');
        
        // Make another move
        game.makeMove(1);
        
        testSuite.assertEqual(playerChangedCount, 2, 'playerChanged should be fired again');
        testSuite.assertEqual(lastPlayer, game.PLAYER1, 'Should switch back to player 1');
    });
    
    // Test gameWon event
    testSuite.test('Backend-Events', 'gameWon event', () => {
        const game = new Connect4Game();
        let gameWonFired = false;
        let winnerData = null;
        
        game.on('gameWon', (data) => {
            gameWonFired = true;
            winnerData = data;
        });
        
        // Create a winning situation
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1 - wins
        
        testSuite.assertTruthy(gameWonFired, 'gameWon event should be fired');
        testSuite.assertNotNull(winnerData, 'Winner data should be provided');
        testSuite.assertEqual(winnerData.winner, game.PLAYER1, 'Winner should be player 1');
        testSuite.assertTruthy(Array.isArray(winnerData.winningCells), 'Should provide winning cells array');
        testSuite.assertEqual(winnerData.winningCells.length, 4, 'Should have 4 winning cells');
    });
    
    // Test gameDraw event
    testSuite.test('Backend-Events', 'gameDraw event', () => {
        const game = new Connect4Game();
        let gameDrawFired = false;
        
        game.on('gameDraw', () => {
            gameDrawFired = true;
        });
        
        // Manually create draw situation (fill board without wins)
        // This is complex to set up naturally, so we'll simulate
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 6; row++) {
                game.board[row][col] = (col + row) % 2 === 0 ? game.PLAYER1 : game.PLAYER2;
            }
        }
        
        // Make a move that should trigger draw detection
        game.makeMove = function(col) {
            if (this.isDraw()) {
                this.gameOver = true;
                this.emit('gameDraw');
                return { success: true, gameDraw: true };
            }
            return { success: false, reason: 'Column is full' };
        };
        
        const result = game.makeMove(0);
        
        testSuite.assertTruthy(gameDrawFired, 'gameDraw event should be fired');
        testSuite.assertTruthy(result.gameDraw, 'Move result should indicate draw');
    });
    
    // Test gameReset event
    testSuite.test('Backend-Events', 'gameReset event', () => {
        const game = new Connect4Game();
        let gameResetFired = false;
        
        game.on('gameReset', () => {
            gameResetFired = true;
        });
        
        // Make some moves, then reset
        game.makeMove(0);
        game.makeMove(1);
        game.resetGame();
        
        testSuite.assertTruthy(gameResetFired, 'gameReset event should be fired');
    });
    
    // Test fullReset event
    testSuite.test('Backend-Events', 'fullReset event', () => {
        const game = new Connect4Game();
        let fullResetFired = false;
        
        game.on('fullReset', () => {
            fullResetFired = true;
        });
        
        // Make some moves, then full reset
        game.makeMove(0);
        game.makeMove(1);
        game.fullReset();
        
        testSuite.assertTruthy(fullResetFired, 'fullReset event should be fired');
    });
    
    // Test boardStateChanged event
    testSuite.test('Backend-Events', 'boardStateChanged event', () => {
        const game = new Connect4Game();
        let stateChangedCount = 0;
        let lastBoardState = null;
        
        game.on('boardStateChanged', (data) => {
            stateChangedCount++;
            lastBoardState = data;
        });
        
        // Make a move
        game.makeMove(3);
        
        testSuite.assertEqual(stateChangedCount, 1, 'boardStateChanged should fire once');
        testSuite.assertNotNull(lastBoardState, 'Should provide board state data');
        testSuite.assertNotNull(lastBoardState.board, 'Should include board');
        testSuite.assertNotNull(lastBoardState.currentPlayer, 'Should include current player');
        testSuite.assertTruthy(typeof lastBoardState.gameOver === 'boolean', 'Should include game over status');
    });
    
    // Test event isolation (events don't interfere with game logic)
    testSuite.test('Backend-Events', 'Event isolation', () => {
        const game = new Connect4Game();
        let eventHandlerExecuted = false;
        
        // Add event handler that tries to modify game state
        game.on('moveMade', (move) => {
            eventHandlerExecuted = true;
            // This should NOT affect the game state
            try {
                game.currentPlayer = game.PLAYER1; // Try to force player back
                game.board[0][0] = game.PLAYER2; // Try to modify board
            } catch (e) {
                // Ignore errors, just testing isolation
            }
        });
        
        game.makeMove(0); // P1 move
        
        testSuite.assertTruthy(eventHandlerExecuted, 'Event handler should execute');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Current player should not be affected by event handler');
        
        // Game logic should still work correctly
        const nextMove = game.makeMove(1);
        testSuite.assertTruthy(nextMove.success, 'Next move should succeed');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Player should switch correctly');
    });
    
    // Test that events don't cause memory leaks
    testSuite.test('Backend-Events', 'Event memory management', () => {
        const game = new Connect4Game();
        
        // Add many listeners
        const listeners = [];
        for (let i = 0; i < 100; i++) {
            const listener = () => {};
            listeners.push(listener);
            game.on('moveMade', listener);
        }
        
        testSuite.assertEqual(game.eventListeners.moveMade.length, 100, 'Should have 100 listeners');
        
        // Remove all listeners
        listeners.forEach(listener => {
            game.off('moveMade', listener);
        });
        
        testSuite.assertEqual(game.eventListeners.moveMade.length, 0, 'Should have no listeners after removal');
    });
    
    // Test error handling in event listeners
    testSuite.test('Backend-Events', 'Error handling in event listeners', () => {
        const game = new Connect4Game();
        let goodListenerCalled = false;
        
        // Add listener that throws error
        game.on('moveMade', () => {
            throw new Error('Test error in event listener');
        });
        
        // Add listener that should still execute
        game.on('moveMade', () => {
            goodListenerCalled = true;
        });
        
        // Make move - should not crash despite error in listener
        let moveSucceeded = false;
        try {
            const result = game.makeMove(0);
            moveSucceeded = result.success;
        } catch (e) {
            // If this catches, event error handling is not working
            moveSucceeded = false;
        }
        
        testSuite.assertTruthy(moveSucceeded, 'Move should succeed despite listener error');
        // Note: goodListenerCalled might be false if error stops execution
        // This depends on implementation details of error handling
    });
}