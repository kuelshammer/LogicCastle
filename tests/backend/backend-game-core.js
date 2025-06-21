/**
 * Backend Core Game Tests for Connect4
 * Reorganized from legacy connect4-tests.js 
 * 
 * Coverage: Game initialization, board operations, move validation, 
 * win detection, game state management
 */
function runBackendGameCoreTests(testSuite) {
    // Test game initialization
    testSuite.test('Backend-Game-Core', 'Game initialization', () => {
        const game = new Connect4Game();
        testSuite.assertEqual(game.ROWS, 6, 'Should have 6 rows');
        testSuite.assertEqual(game.COLS, 7, 'Should have 7 columns');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should start with player 1');
        testSuite.assertFalsy(game.gameOver, 'Game should not be over initially');
        testSuite.assertNull(game.winner, 'Should have no winner initially');
        testSuite.assertEqual(game.moveHistory.length, 0, 'Should have empty move history');
    });
    
    // Test board initialization
    testSuite.test('Backend-Game-Core', 'Board initialization', () => {
        const game = new Connect4Game();
        const board = game.getBoard();
        testSuite.assertEqual(board.length, 6, 'Board should have 6 rows');
        testSuite.assertEqual(board[0].length, 7, 'Board should have 7 columns');
        
        // Check all cells are empty
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                testSuite.assertEqual(board[row][col], game.EMPTY, `Cell [${row}][${col}] should be empty`);
            }
        }
    });
    
    // Test valid move
    testSuite.test('Backend-Game-Core', 'Valid move', () => {
        const game = new Connect4Game();
        const result = game.makeMove(3); // Column 3 (middle)
        
        testSuite.assertTruthy(result.success, 'Move should be successful');
        testSuite.assertEqual(result.row, 5, 'Piece should drop to bottom row');
        testSuite.assertEqual(result.col, 3, 'Piece should be in column 3');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Should switch to player 2');
        testSuite.assertEqual(game.moveHistory.length, 1, 'Should have one move in history');
    });
    
    // Test invalid moves
    testSuite.test('Backend-Game-Core', 'Invalid move - out of bounds', () => {
        const game = new Connect4Game();
        const result = game.makeMove(-1);
        testSuite.assertFalsy(result.success, 'Move should fail');
        testSuite.assertEqual(result.reason, 'Invalid column', 'Should report invalid column');
        
        const result2 = game.makeMove(7);
        testSuite.assertFalsy(result2.success, 'Move should fail');
        testSuite.assertEqual(result2.reason, 'Invalid column', 'Should report invalid column');
    });
    
    // Test column full
    testSuite.test('Backend-Game-Core', 'Invalid move - column full', () => {
        const game = new Connect4Game();
        
        // Fill column 0
        for (let i = 0; i < 6; i++) {
            game.makeMove(0);
        }
        
        const result = game.makeMove(0);
        testSuite.assertFalsy(result.success, 'Move should fail');
        testSuite.assertEqual(result.reason, 'Column is full', 'Should report column is full');
    });
    
    // Test horizontal win
    testSuite.test('Backend-Game-Core', 'Horizontal win detection', () => {
        const game = new Connect4Game();
        
        // Create horizontal win for player 1 (red)
        // Player 1 moves: 0, 1, 2, 3
        // Player 2 moves: 0, 1, 2 (on top of player 1's pieces)
        game.makeMove(0); // P1
        game.makeMove(0); // P2
        game.makeMove(1); // P1
        game.makeMove(1); // P2
        game.makeMove(2); // P1
        game.makeMove(2); // P2
        const result = game.makeMove(3); // P1 - should win
        
        testSuite.assertTruthy(result.gameWon, 'Should detect horizontal win');
        testSuite.assertEqual(result.winner, game.PLAYER1, 'Player 1 should win');
        testSuite.assertTruthy(game.gameOver, 'Game should be over');
        testSuite.assertEqual(game.winner, game.PLAYER1, 'Game winner should be player 1');
    });
    
    // Test vertical win
    testSuite.test('Backend-Game-Core', 'Vertical win detection', () => {
        const game = new Connect4Game();
        
        // Create vertical win for player 1
        // Alternate moves in different columns to avoid early win
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        game.makeMove(0); // P1
        game.makeMove(1); // P2
        const result = game.makeMove(0); // P1 - should win (4 in column 0)
        
        testSuite.assertTruthy(result.gameWon, 'Should detect vertical win');
        testSuite.assertEqual(result.winner, game.PLAYER1, 'Player 1 should win');
    });
    
    // Test diagonal win
    testSuite.test('Backend-Game-Core', 'Diagonal win detection', () => {
        const game = new Connect4Game();
        
        // Set up diagonal manually to avoid complex move sequences
        // Create diagonal pattern: (5,0), (4,1), (3,2), and test (2,3) 
        game.board[5][0] = game.PLAYER1; // Bottom-left
        game.board[4][1] = game.PLAYER1; // One up, one right
        game.board[3][2] = game.PLAYER1; // Two up, two right
        
        // Fill column 3 up to row 3 so next piece lands at (2,3)
        game.board[5][3] = game.PLAYER2; // Bottom support
        game.board[4][3] = game.PLAYER2; // Middle support  
        game.board[3][3] = game.PLAYER2; // Top support
        
        game.currentPlayer = game.PLAYER1; // Ensure it's P1's turn
        
        // Now make the winning move
        const result = game.makeMove(3); // Should place at (2,3) and complete diagonal
        
        testSuite.assertTruthy(result.gameWon, 'Should detect diagonal win');
        testSuite.assertEqual(result.winner, game.PLAYER1, 'Player 1 should win');
    });
    
    // Test undo move
    testSuite.test('Backend-Game-Core', 'Undo move', () => {
        const game = new Connect4Game();
        
        game.makeMove(3); // P1
        game.makeMove(4); // P2
        
        testSuite.assertEqual(game.moveHistory.length, 2, 'Should have 2 moves');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should be P1 turn');
        
        const undoResult = game.undoMove();
        testSuite.assertTruthy(undoResult.success, 'Undo should succeed');
        testSuite.assertEqual(game.moveHistory.length, 1, 'Should have 1 move after undo');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Should be P2 turn after undo');
    });
    
    // Test game reset
    testSuite.test('Backend-Game-Core', 'Game reset', () => {
        const game = new Connect4Game();
        
        game.makeMove(0);
        game.makeMove(1);
        game.makeMove(2);
        
        game.resetGame();
        
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should reset to P1');
        testSuite.assertFalsy(game.gameOver, 'Game should not be over');
        testSuite.assertNull(game.winner, 'Should have no winner');
        testSuite.assertEqual(game.moveHistory.length, 0, 'Should have empty move history');
        
        const board = game.getBoard();
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                testSuite.assertEqual(board[row][col], game.EMPTY, `Cell [${row}][${col}] should be empty after reset`);
            }
        }
    });
    
    // Test AI initialization
    testSuite.test('Backend-Game-Core', 'AI initialization', () => {
        const ai = new Connect4AI('medium');
        testSuite.assertEqual(ai.difficulty, 'medium', 'Should set difficulty');
        testSuite.assertNotNull(ai.maxDepth, 'Should have max depth');
    });
    
    // Test AI move generation
    testSuite.test('Backend-Game-Core', 'AI move generation', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('easy');
        
        const move = ai.getBestMove(game);
        testSuite.assertNotNull(move, 'AI should generate a move');
        testSuite.assert(move >= 0 && move < 7, 'Move should be valid column');
    });
    
    // Test helper methods
    testSuite.test('Backend-Game-Core', 'Helper methods', () => {
        const game = new Connect4Game();
        
        testSuite.assertEqual(game.getPlayerName(game.PLAYER1), '🔴', 'Should return correct player 1 name');
        testSuite.assertEqual(game.getPlayerName(game.PLAYER2), '🟡', 'Should return correct player 2 name');
        testSuite.assertEqual(game.getPlayerColorClass(game.PLAYER1), 'red', 'Should return correct player 1 color');
        testSuite.assertEqual(game.getPlayerColorClass(game.PLAYER2), 'yellow', 'Should return correct player 2 color');
        
        testSuite.assertEqual(game.getValidMoves().length, 7, 'Should have 7 valid moves on empty board');
        
        // Fill column 0
        for (let i = 0; i < 6; i++) {
            game.makeMove(0);
        }
        testSuite.assertEqual(game.getValidMoves().length, 6, 'Should have 6 valid moves after filling one column');
    });
}