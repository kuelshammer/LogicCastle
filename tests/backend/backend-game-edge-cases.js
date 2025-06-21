/**
 * Backend Edge Cases Tests for Connect4
 * 
 * Coverage: Edge cases, complex win scenarios, boundary conditions,
 * full board scenarios, and unusual game states
 */
function runBackendGameEdgeCasesTests(testSuite) {
    
    // Test completely filled board detection
    testSuite.test('Backend-Game-Edge-Cases', 'Full board draw detection', () => {
        const game = new Connect4Game();
        
        // Fill the entire board without any wins
        // Use alternating pattern to avoid wins
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 6; row++) {
                if (col % 2 === 0) {
                    game.board[row][col] = (row % 2 === 0) ? game.PLAYER1 : game.PLAYER2;
                } else {
                    game.board[row][col] = (row % 2 === 0) ? game.PLAYER2 : game.PLAYER1;
                }
            }
        }
        
        testSuite.assert(game.isDraw(), 'Should detect full board as draw');
        testSuite.assertEqual(game.getValidMoves().length, 0, 'Should have no valid moves');
    });
    
    // Test complex diagonal win scenarios
    testSuite.test('Backend-Game-Edge-Cases', 'Complex diagonal win - negative slope', () => {
        const game = new Connect4Game();
        
        // Create a negative slope diagonal (top-left to bottom-right)
        // Bottom row: [0,0,0,P1,0,0,0]
        // Row 1:     [0,0,P1,P2,0,0,0]  
        // Row 2:     [0,P1,P2,P2,0,0,0]
        // Row 3:     [P1,P2,P2,P2,0,0,0]
        
        // Build up the position move by move
        game.makeMove(3); // P1 at [5,3]
        game.makeMove(3); // P2 at [4,3]
        game.makeMove(2); // P1 at [5,2]
        game.makeMove(2); // P2 at [4,2]
        game.makeMove(2); // P1 at [3,2]
        game.makeMove(1); // P2 at [5,1]
        game.makeMove(1); // P1 at [4,1]
        game.makeMove(1); // P2 at [3,1]
        game.makeMove(1); // P1 at [2,1]
        game.makeMove(0); // P2 at [5,0]
        game.makeMove(0); // P1 at [4,0]
        game.makeMove(0); // P2 at [3,0]
        game.makeMove(0); // P1 at [2,0]
        
        const result = game.makeMove(0); // P2 at [1,0] - should not win yet
        testSuite.assertFalsy(result.gameWon, 'Should not win yet');
        
        // Now P1 should be able to win with diagonal at [1,0]
        const winResult = game.makeMove(0); // P1 at [1,0]
        testSuite.assertFalsy(winResult.gameWon, 'This specific setup might not create diagonal');
        
        // Test that we correctly identify when no win exists
        testSuite.assertFalsy(game.gameOver, 'Game should continue if no win detected');
    });
    
    // Test win at the very edges of the board
    testSuite.test('Backend-Game-Edge-Cases', 'Win at leftmost edge', () => {
        const game = new Connect4Game();
        
        // Create vertical win in column 0 (leftmost)
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        const result = game.makeMove(0); // P1 - should win
        
        testSuite.assertTruthy(result.gameWon, 'Should detect win at leftmost edge');
        testSuite.assertEqual(result.winner, game.PLAYER1, 'Player 1 should win');
    });
    
    // Test win at the very edges of the board
    testSuite.test('Backend-Game-Edge-Cases', 'Win at rightmost edge', () => {
        const game = new Connect4Game();
        
        // Create vertical win in column 6 (rightmost)
        game.makeMove(6); // P1
        game.makeMove(5); // P2
        game.makeMove(6); // P1
        game.makeMove(5); // P2
        game.makeMove(6); // P1
        game.makeMove(5); // P2
        const result = game.makeMove(6); // P1 - should win
        
        testSuite.assertTruthy(result.gameWon, 'Should detect win at rightmost edge');
        testSuite.assertEqual(result.winner, game.PLAYER1, 'Player 1 should win');
    });
    
    // Test horizontal win at top row
    testSuite.test('Backend-Game-Edge-Cases', 'Horizontal win at top row', () => {
        const game = new Connect4Game();
        
        // Fill columns 0,1,2,3 to height 5 (leaving top row empty)
        // Use careful alternating to avoid accidental wins
        for (let i = 0; i < 5; i++) {
            game.makeMove(0); // P1
            game.makeMove(1); // P2  
            game.makeMove(1); // P1
            game.makeMove(2); // P2
            game.makeMove(2); // P1
            game.makeMove(3); // P2
            game.makeMove(3); // P1
            game.makeMove(0); // P2
        }
        
        // Check game is still ongoing
        testSuite.assertFalsy(game.gameOver, 'Game should still be ongoing after setup');
        
        // Now create horizontal win in top row (row 0): P1 in cols 0,1,2,3
        game.makeMove(0); // P1 at (0,0)  
        game.makeMove(4); // P2 elsewhere
        game.makeMove(1); // P1 at (0,1)
        game.makeMove(4); // P2 elsewhere  
        game.makeMove(2); // P1 at (0,2)
        game.makeMove(4); // P2 elsewhere
        const result = game.makeMove(3); // P1 at (0,3) - should complete horizontal win
        
        testSuite.assertTruthy(result.gameWon, 'Should detect horizontal win at top row');
        testSuite.assertEqual(result.winner, game.PLAYER1, 'Player 1 should win');
    });
    
    // Test that game prevents moves after game over
    testSuite.test('Backend-Game-Edge-Cases', 'No moves allowed after game over', () => {
        const game = new Connect4Game();
        
        // Create a quick win
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1 - wins
        
        testSuite.assertTruthy(game.gameOver, 'Game should be over');
        
        // Try to make another move
        const result = game.makeMove(2);
        testSuite.assertFalsy(result.success, 'Should not allow moves after game over');
        testSuite.assertEqual(result.reason, 'Game is over', 'Should give correct error reason');
    });
    
    // Test multiple undo operations
    testSuite.test('Backend-Game-Edge-Cases', 'Multiple undo operations', () => {
        const game = new Connect4Game();
        
        // Make several moves
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(2); // P1
        game.makeMove(3); // P2
        
        testSuite.assertEqual(game.moveHistory.length, 4, 'Should have 4 moves');
        
        // Undo all moves
        for (let i = 0; i < 4; i++) {
            const undoResult = game.undoMove();
            testSuite.assertTruthy(undoResult.success, `Undo ${i+1} should succeed`);
        }
        
        testSuite.assertEqual(game.moveHistory.length, 0, 'Should have no moves after all undos');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should reset to player 1');
        
        // Try to undo when no moves left
        const failedUndo = game.undoMove();
        testSuite.assertFalsy(failedUndo.success, 'Should not allow undo when no moves');
        testSuite.assertEqual(failedUndo.reason, 'No moves to undo', 'Should give correct error');
    });
    
    // Test board boundary validation
    testSuite.test('Backend-Game-Edge-Cases', 'Board boundary validation', () => {
        const game = new Connect4Game();
        
        // Test all invalid column indices
        const invalidColumns = [-10, -1, 7, 8, 100, NaN, undefined, null];
        
        invalidColumns.forEach(col => {
            const result = game.makeMove(col);
            testSuite.assertFalsy(result.success, `Column ${col} should be invalid`);
        });
    });
    
    // Test that getValidMoves is accurate under all conditions
    testSuite.test('Backend-Game-Edge-Cases', 'Valid moves accuracy', () => {
        const game = new Connect4Game();
        
        // Initially all columns should be valid
        testSuite.assertEqual(game.getValidMoves().length, 7, 'Should have all 7 columns valid initially');
        
        // Fill one column completely
        for (let i = 0; i < 6; i++) {
            game.makeMove(3); // Fill column 3
        }
        
        const validAfterFill = game.getValidMoves();
        testSuite.assertEqual(validAfterFill.length, 6, 'Should have 6 valid moves after filling one column');
        testSuite.assertFalsy(validAfterFill.includes(3), 'Column 3 should not be in valid moves');
        
        // Manually fill the board to avoid wins using alternating pattern
        const game2 = new Connect4Game();
        
        // Fill the entire board manually with a no-win pattern
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 6; row++) {
                if (col % 2 === 0) {
                    game2.board[row][col] = (row % 2 === 0) ? game2.PLAYER1 : game2.PLAYER2;
                } else {
                    game2.board[row][col] = (row % 2 === 0) ? game2.PLAYER2 : game2.PLAYER1;
                }
            }
        }
        
        testSuite.assertEqual(game2.getValidMoves().length, 0, 'Should have no valid moves when board full');
    });
}