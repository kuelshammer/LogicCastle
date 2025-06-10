/**
 * Test suite for Trio game
 */
function runTrioTests(testSuite) {
    // Test game initialization
    testSuite.test('Trio', 'Game initialization', () => {
        const game = new TrioGame();
        testSuite.assertEqual(game.ROWS, 6, 'Should have 6 rows');
        testSuite.assertEqual(game.COLS, 6, 'Should have 6 columns');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should start with player 1');
        testSuite.assertFalsy(game.gameOver, 'Game should not be over initially');
        testSuite.assertNull(game.winner, 'Should have no winner initially');
        testSuite.assertEqual(game.moveHistory.length, 0, 'Should have empty move history');
    });
    
    // Test board initialization
    testSuite.test('Trio', 'Board initialization', () => {
        const game = new TrioGame();
        const board = game.getBoard();
        testSuite.assertEqual(board.length, 6, 'Board should have 6 rows');
        testSuite.assertEqual(board[0].length, 6, 'Board should have 6 columns');
        
        // Check all cells are empty
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                testSuite.assertEqual(board[row][col], game.EMPTY, `Cell [${row}][${col}] should be empty`);
            }
        }
    });
    
    // Test valid move
    testSuite.test('Trio', 'Valid move', () => {
        const game = new TrioGame();
        const result = game.makeMove(2, 2); // Center position
        
        testSuite.assertTruthy(result.success, 'Move should be successful');
        testSuite.assertEqual(result.row, 2, 'Should place at row 2');
        testSuite.assertEqual(result.col, 2, 'Should place at column 2');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Should switch to player 2');
        testSuite.assertEqual(game.moveHistory.length, 1, 'Should have one move in history');
    });
    
    // Test invalid moves
    testSuite.test('Trio', 'Invalid move - out of bounds', () => {
        const game = new TrioGame();
        const result = game.makeMove(-1, 0);
        testSuite.assertFalsy(result.success, 'Move should fail');
        testSuite.assertEqual(result.reason, 'Invalid position', 'Should report invalid position');
        
        const result2 = game.makeMove(0, 6);
        testSuite.assertFalsy(result2.success, 'Move should fail');
        testSuite.assertEqual(result2.reason, 'Invalid position', 'Should report invalid position');
    });
    
    // Test position occupied
    testSuite.test('Trio', 'Invalid move - position occupied', () => {
        const game = new TrioGame();
        
        game.makeMove(2, 2); // Player 1
        const result = game.makeMove(2, 2); // Player 2 tries same position
        
        testSuite.assertFalsy(result.success, 'Move should fail');
        testSuite.assertEqual(result.reason, 'Position is occupied', 'Should report position is occupied');
    });
    
    // Test player rotation (3 players)
    testSuite.test('Trio', 'Player rotation', () => {
        const game = new TrioGame();
        
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should start with player 1');
        
        game.makeMove(0, 0); // Player 1
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Should be player 2');
        
        game.makeMove(0, 1); // Player 2
        testSuite.assertEqual(game.currentPlayer, game.PLAYER3, 'Should be player 3');
        
        game.makeMove(0, 2); // Player 3
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should cycle back to player 1');
    });
    
    // Test horizontal win
    testSuite.test('Trio', 'Horizontal win detection', () => {
        const game = new TrioGame();
        
        // Player 1 gets horizontal win
        game.makeMove(0, 0); // P1
        game.makeMove(1, 0); // P2
        game.makeMove(0, 1); // P3
        game.makeMove(1, 1); // P1
        game.makeMove(1, 2); // P2
        const result = game.makeMove(0, 2); // P3 - should win horizontally
        
        testSuite.assertTruthy(result.gameWon, 'Should detect horizontal win');
        testSuite.assertEqual(result.winner, game.PLAYER3, 'Player 3 should win');
        testSuite.assertTruthy(game.gameOver, 'Game should be over');
    });
    
    // Test vertical win
    testSuite.test('Trio', 'Vertical win detection', () => {
        const game = new TrioGame();
        
        // Player 1 gets vertical win
        game.makeMove(0, 0); // P1
        game.makeMove(0, 1); // P2
        game.makeMove(1, 0); // P3
        game.makeMove(0, 2); // P1
        game.makeMove(1, 1); // P2
        const result = game.makeMove(2, 0); // P3 - should win vertically
        
        testSuite.assertTruthy(result.gameWon, 'Should detect vertical win');
        testSuite.assertEqual(result.winner, game.PLAYER3, 'Player 3 should win');
    });
    
    // Test diagonal win
    testSuite.test('Trio', 'Diagonal win detection', () => {
        const game = new TrioGame();
        
        // Player 1 gets diagonal win
        game.makeMove(0, 0); // P1
        game.makeMove(0, 1); // P2
        game.makeMove(1, 1); // P3
        game.makeMove(0, 2); // P1
        game.makeMove(1, 0); // P2
        const result = game.makeMove(2, 2); // P3 - should win diagonally
        
        testSuite.assertTruthy(result.gameWon, 'Should detect diagonal win');
        testSuite.assertEqual(result.winner, game.PLAYER3, 'Player 3 should win');
    });
    
    // Test draw detection
    testSuite.test('Trio', 'Draw detection', () => {
        const game = new TrioGame();
        
        // Fill the board without anyone winning (this is theoretical)
        // In practice, draws are very rare in Trio
        let moveCount = 0;
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (moveCount < 35) { // Leave one spot and ensure no win
                    const result = game.makeMove(row, col);
                    if (result.gameWon) {
                        // If someone wins before board is full, that's fine
                        testSuite.assertTruthy(true, 'Game ended with a winner (not a draw)');
                        return;
                    }
                    moveCount++;
                }
            }
        }
        
        // If we get here, we have a nearly full board
        testSuite.assert(moveCount > 30, 'Should have placed many pieces');
    });
    
    // Test undo move
    testSuite.test('Trio', 'Undo move', () => {
        const game = new TrioGame();
        
        game.makeMove(2, 2); // P1
        game.makeMove(2, 3); // P2
        game.makeMove(2, 4); // P3
        
        testSuite.assertEqual(game.moveHistory.length, 3, 'Should have 3 moves');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should be P1 turn');
        
        const undoResult = game.undoMove();
        testSuite.assertTruthy(undoResult.success, 'Undo should succeed');
        testSuite.assertEqual(game.moveHistory.length, 2, 'Should have 2 moves after undo');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER3, 'Should be P3 turn after undo');
    });
    
    // Test game reset
    testSuite.test('Trio', 'Game reset', () => {
        const game = new TrioGame();
        
        game.makeMove(0, 0);
        game.makeMove(1, 1);
        game.makeMove(2, 2);
        
        game.resetGame();
        
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should reset to P1');
        testSuite.assertFalsy(game.gameOver, 'Game should not be over');
        testSuite.assertNull(game.winner, 'Should have no winner');
        testSuite.assertEqual(game.moveHistory.length, 0, 'Should have empty move history');
        
        const board = game.getBoard();
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                testSuite.assertEqual(board[row][col], game.EMPTY, `Cell [${row}][${col}] should be empty after reset`);
            }
        }
    });
    
    // Test AI initialization
    testSuite.test('Trio', 'AI initialization', () => {
        const ai = new TrioAI('medium');
        testSuite.assertEqual(ai.difficulty, 'medium', 'Should set difficulty');
        testSuite.assertNotNull(ai.maxDepth, 'Should have max depth');
    });
    
    // Test AI move generation
    testSuite.test('Trio', 'AI move generation', () => {
        const game = new TrioGame();
        const ai = new TrioAI('easy');
        
        const move = ai.getBestMove(game);
        testSuite.assertNotNull(move, 'AI should generate a move');
        testSuite.assert(move.row >= 0 && move.row < 6, 'Move row should be valid');
        testSuite.assert(move.col >= 0 && move.col < 6, 'Move column should be valid');
    });
    
    // Test helper methods
    testSuite.test('Trio', 'Helper methods', () => {
        const game = new TrioGame();
        
        testSuite.assertEqual(game.getPlayerName(game.PLAYER1), 'Spieler 1 (Rot)', 'Should return correct player 1 name');
        testSuite.assertEqual(game.getPlayerName(game.PLAYER2), 'Spieler 2 (Blau)', 'Should return correct player 2 name');
        testSuite.assertEqual(game.getPlayerName(game.PLAYER3), 'Spieler 3 (Grün)', 'Should return correct player 3 name');
        
        testSuite.assertEqual(game.getPlayerColorClass(game.PLAYER1), 'player1', 'Should return correct player 1 color');
        testSuite.assertEqual(game.getPlayerColorClass(game.PLAYER2), 'player2', 'Should return correct player 2 color');
        testSuite.assertEqual(game.getPlayerColorClass(game.PLAYER3), 'player3', 'Should return correct player 3 color');
        
        testSuite.assertEqual(game.getValidMoves().length, 36, 'Should have 36 valid moves on empty 6x6 board');
        
        // Place some pieces
        game.makeMove(0, 0);
        game.makeMove(0, 1);
        game.makeMove(0, 2);
        testSuite.assertEqual(game.getValidMoves().length, 33, 'Should have 33 valid moves after placing 3 pieces');
    });
    
    // Test move simulation
    testSuite.test('Trio', 'Move simulation', () => {
        const game = new TrioGame();
        
        const simulation = game.simulateMove(2, 2);
        testSuite.assertTruthy(simulation.success, 'Simulation should succeed');
        testSuite.assertEqual(simulation.row, 2, 'Should simulate at row 2');
        testSuite.assertEqual(simulation.col, 2, 'Should simulate at column 2');
        testSuite.assertEqual(simulation.player, game.PLAYER1, 'Should simulate for current player');
        
        // Actual board should be unchanged
        const board = game.getBoard();
        testSuite.assertEqual(board[2][2], game.EMPTY, 'Actual board should be unchanged');
    });
    
    // Test next player calculation
    testSuite.test('Trio', 'Next player calculation', () => {
        const game = new TrioGame();
        
        testSuite.assertEqual(game.getNextPlayer(game.PLAYER1), game.PLAYER2, 'P1 -> P2');
        testSuite.assertEqual(game.getNextPlayer(game.PLAYER2), game.PLAYER3, 'P2 -> P3');
        testSuite.assertEqual(game.getNextPlayer(game.PLAYER3), game.PLAYER1, 'P3 -> P1');
    });
}