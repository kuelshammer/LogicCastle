/**
 * Regression Tests for State Corruption Prevention
 * 
 * CRITICAL BUG HISTORY:
 * - Helper functions directly manipulated game.currentPlayer
 * - AI functions modified live game board during analysis
 * - Event system triggered unintended cascades
 * 
 * These tests ensure state isolation is maintained
 */
function runRegressionStateCorruptionTests(testSuite) {
    
    // Test that helper functions never modify live game state
    testSuite.test('Regression-State-Corruption', 'Helper functions state isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create test state
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(4);
        
        const immutableState = {
            board: JSON.stringify(game.board),
            currentPlayer: game.currentPlayer,
            gameOver: game.gameOver,
            winner: game.winner,
            moveHistory: JSON.stringify(game.moveHistory),
            winningCells: JSON.stringify(game.winningCells)
        };
        
        // Test all helper functions that previously corrupted state
        helpers.hasOpponentBuiltTrap();
        helpers.analyzeMoveConsequences(1);
        helpers.countThreatsAfterMove(2);
        helpers.analyzeEvenOddThreats();
        helpers.detectZugzwang();
        helpers.analyzeForkOpportunities();
        helpers.getEnhancedStrategicEvaluation();
        
        // Verify COMPLETE state isolation
        testSuite.assertEqual(JSON.stringify(game.board), immutableState.board, 
            'Game board should never be modified by helper functions');
        testSuite.assertEqual(game.currentPlayer, immutableState.currentPlayer, 
            'Current player should never be modified by helper functions');
        testSuite.assertEqual(game.gameOver, immutableState.gameOver, 
            'Game over status should never be modified by helper functions');
        testSuite.assertEqual(game.winner, immutableState.winner, 
            'Winner should never be modified by helper functions');
        testSuite.assertEqual(JSON.stringify(game.moveHistory), immutableState.moveHistory, 
            'Move history should never be modified by helper functions');
        testSuite.assertEqual(JSON.stringify(game.winningCells), immutableState.winningCells, 
            'Winning cells should never be modified by helper functions');
    });
    
    // Test that AI functions use board copies, not live board
    testSuite.test('Regression-State-Corruption', 'AI functions use board simulation', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Create complex position
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(3);
        game.makeMove(4);
        
        const safeBoardState = game.getBoard();
        const originalBoardString = JSON.stringify(safeBoardState);
        
        // AI analysis should use copies
        const move = ai.getBestMove(game, helpers);
        
        // Verify original board unchanged
        const finalBoardString = JSON.stringify(game.getBoard());
        testSuite.assertEqual(finalBoardString, originalBoardString, 
            'AI analysis should not modify original game board');
        
        // Verify board copy independence
        const testCopy = game.getBoard();
        testCopy[0][0] = game.PLAYER2; // Modify copy
        testSuite.assertNotEqual(game.board[0][0], testCopy[0][0], 
            'Board copies should be independent of original');
    });
    
    // Test that findBlockingMove doesn't manipulate currentPlayer
    testSuite.test('Regression-State-Corruption', 'findBlockingMove player isolation', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        
        // Create blocking scenario
        game.board[5][0] = game.PLAYER1; // Red threat
        game.board[5][1] = game.PLAYER1; // Red threat
        game.board[5][2] = game.PLAYER1; // Red threat
        game.currentPlayer = game.PLAYER2; // Yellow to move
        
        const originalPlayer = game.currentPlayer;
        
        // This previously manipulated currentPlayer directly
        const blockingMove = ai.findBlockingMove(game);
        
        testSuite.assertEqual(game.currentPlayer, originalPlayer, 
            'findBlockingMove should not change currentPlayer');
        testSuite.assertEqual(blockingMove, 3, 
            'Should find correct blocking move without state corruption');
    });
    
    // Test that strategic analysis doesn't trigger game events
    testSuite.test('Regression-State-Corruption', 'Strategic analysis event isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        let eventsFired = [];
        
        // Monitor all possible events
        const eventTypes = ['moveMade', 'playerChanged', 'gameWon', 'gameDraw', 
                           'gameReset', 'fullReset', 'boardStateChanged', 'moveUndone'];
        
        eventTypes.forEach(eventType => {
            game.on(eventType, () => {
                eventsFired.push(eventType);
            });
        });
        
        // Run all strategic analysis functions
        helpers.analyzeEvenOddThreats();
        helpers.detectZugzwang();
        helpers.analyzeForkOpportunities();
        helpers.getEnhancedStrategicEvaluation();
        
        testSuite.assertEqual(eventsFired.length, 0, 
            `Strategic analysis should not trigger events. Fired: ${eventsFired.join(', ')}`);
    });
    
    // Test that makeMove vs simulateMove behavior is isolated
    testSuite.test('Regression-State-Corruption', 'makeMove vs simulateMove isolation', () => {
        const game = new Connect4Game();
        
        // Test real move
        const realResult = game.makeMove(3);
        testSuite.assertTruthy(realResult.success, 'Real move should succeed');
        testSuite.assertEqual(game.board[5][3], game.PLAYER1, 'Real move should place piece');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Real move should switch player');
        
        // Test simulation on same game
        const simResult = game.simulateMove(2);
        testSuite.assertTruthy(simResult.success, 'Simulation should succeed');
        testSuite.assertEqual(game.board[5][2], game.EMPTY, 'Simulation should not place piece on real board');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Simulation should not change current player');
        
        // Verify simulation returns correct data
        testSuite.assertEqual(simResult.row, 5, 'Simulation should report correct landing row');
        testSuite.assertEqual(simResult.col, 2, 'Simulation should report correct column');
        testSuite.assertEqual(simResult.player, game.PLAYER2, 'Simulation should use current player');
    });
    
    // Test that undoMove functionality is protected from corruption
    testSuite.test('Regression-State-Corruption', 'undoMove state protection', () => {
        const game = new Connect4Game();
        
        // Make several moves
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(4);
        
        const beforeUndo = {
            moveCount: game.moveHistory.length,
            currentPlayer: game.currentPlayer
        };
        
        // Undo last move
        const undoResult = game.undoMove();
        
        testSuite.assertTruthy(undoResult.success, 'Undo should succeed');
        testSuite.assertEqual(game.moveHistory.length, beforeUndo.moveCount - 1, 
            'Move count should decrease by 1');
        testSuite.assertEqual(game.board[5][4], game.EMPTY, 
            'Undone move should clear board position');
        
        // Verify undo doesn't corrupt other state
        testSuite.assertFalsy(game.gameOver, 'Game should not be over after undo');
        testSuite.assertNull(game.winner, 'Winner should be null after undo');
    });
    
    // Test protection against cascading state changes
    testSuite.test('Regression-State-Corruption', 'Cascading state change prevention', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position where multiple analyses might cascade
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(3);
        game.makeMove(4);
        game.makeMove(3);
        game.makeMove(1);
        
        const checkpointState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver,
            moveHistory: game.moveHistory.length
        };
        
        // Run nested analysis that might cause cascades
        const evenOdd = helpers.analyzeEvenOddThreats();
        const forks = helpers.analyzeForkOpportunities();
        
        // Nested calls within strategic evaluation
        for (let i = 0; i < 5; i++) {
            helpers.getEnhancedStrategicEvaluation();
        }
        
        // Verify no cascading changes
        testSuite.assertEqual(JSON.stringify(game.board), checkpointState.board, 
            'Board should resist cascading changes');
        testSuite.assertEqual(game.currentPlayer, checkpointState.player, 
            'Player should resist cascading changes');
        testSuite.assertEqual(game.gameOver, checkpointState.gameOver, 
            'Game over status should resist cascading changes');
        testSuite.assertEqual(game.moveHistory.length, checkpointState.moveHistory, 
            'Move history should resist cascading changes');
    });
    
    // Test that error conditions don't corrupt state
    testSuite.test('Regression-State-Corruption', 'Error condition state protection', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create stable state
        game.makeMove(3);
        const stableState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver
        };
        
        // Try operations that might cause errors
        try {
            helpers.evaluateThreatAtPosition(-1, -1, game.PLAYER1); // Invalid position
        } catch (e) {
            // Error handling
        }
        
        try {
            helpers.countThreatsAfterMove(10); // Invalid column
        } catch (e) {
            // Error handling
        }
        
        try {
            game.simulateMove(-5); // Invalid simulation
        } catch (e) {
            // Error handling
        }
        
        // Verify state unchanged despite errors
        testSuite.assertEqual(JSON.stringify(game.board), stableState.board, 
            'Board should be unchanged despite error conditions');
        testSuite.assertEqual(game.currentPlayer, stableState.player, 
            'Player should be unchanged despite error conditions');
        testSuite.assertEqual(game.gameOver, stableState.gameOver, 
            'Game over status should be unchanged despite error conditions');
    });
    
    // Test memory isolation between multiple game instances
    testSuite.test('Regression-State-Corruption', 'Multiple game instance isolation', () => {
        const game1 = new Connect4Game();
        const game2 = new Connect4Game();
        const helpers1 = new Connect4Helpers(game1, null);
        const helpers2 = new Connect4Helpers(game2, null);
        
        // Create different states
        game1.makeMove(3);
        game2.makeMove(1);
        
        const game1State = JSON.stringify(game1.board);
        const game2State = JSON.stringify(game2.board);
        
        // Cross-analyze (should not affect each other)
        helpers1.getEnhancedStrategicEvaluation();
        helpers2.getEnhancedStrategicEvaluation();
        
        // Verify isolation
        testSuite.assertEqual(JSON.stringify(game1.board), game1State, 
            'Game 1 should be isolated from Game 2 analysis');
        testSuite.assertEqual(JSON.stringify(game2.board), game2State, 
            'Game 2 should be isolated from Game 1 analysis');
        testSuite.assertNotEqual(game1State, game2State, 
            'Games should have different states for test validity');
    });
    
    // Test that AI analysis doesn't affect subsequent real moves
    testSuite.test('Regression-State-Corruption', 'AI analysis doesn\\'t affect real moves', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Analyze position multiple times
        for (let i = 0; i < 5; i++) {
            ai.getBestMove(game, helpers);
        }
        
        // Make real move - should work normally
        const realMove = game.makeMove(3);
        
        testSuite.assertTruthy(realMove.success, 'Real move should succeed after AI analysis');
        testSuite.assertEqual(realMove.col, 3, 'Real move should use specified column');
        testSuite.assertEqual(game.board[5][3], game.PLAYER1, 'Real move should place piece correctly');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Real move should switch players correctly');
    });
    
    // Test concurrent analysis protection (simulate rapid UI calls)
    testSuite.test('Regression-State-Corruption', 'Concurrent analysis protection', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Create position
        game.makeMove(3);
        const baselineState = JSON.stringify(game.board);
        
        // Simulate rapid concurrent calls (like user rapidly clicking UI)
        const analysisPromises = [];
        for (let i = 0; i < 10; i++) {
            // Simulate async AI calls
            analysisPromises.push(Promise.resolve(ai.getBestMove(game, helpers)));
        }
        
        // Wait for all analyses to complete
        Promise.all(analysisPromises).then(moves => {
            // All moves should be valid
            moves.forEach((move, index) => {
                testSuite.assert(game.getValidMoves().includes(move), 
                    `Concurrent analysis ${index + 1} should return valid move`);
            });
            
            // State should be unchanged
            testSuite.assertEqual(JSON.stringify(game.board), baselineState, 
                'Board should be unchanged after concurrent analysis');
        });
    });
}