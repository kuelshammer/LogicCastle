/**
 * Test suite for Gobang game
 */
function runGobangTests(testSuite) {
  // Test game initialization
  testSuite.test('Gobang', 'Game initialization', () => {
    const game = new GobangGame();
    testSuite.assertEqual(game.BOARD_SIZE, 15, 'Should have 15x15 board');
    testSuite.assertEqual(game.WIN_COUNT, 5, 'Should need 5 in a row to win');
    testSuite.assertEqual(game.currentPlayer, game.BLACK, 'Should start with black player');
    testSuite.assertFalsy(game.gameOver, 'Game should not be over initially');
    testSuite.assertNull(game.winner, 'Should have no winner initially');
    testSuite.assertEqual(game.moveHistory.length, 0, 'Should have empty move history');
  });

  // Test board initialization
  testSuite.test('Gobang', 'Board initialization', () => {
    const game = new GobangGame();
    const board = game.getBoard();
    testSuite.assertEqual(board.length, 15, 'Board should have 15 rows');
    testSuite.assertEqual(board[0].length, 15, 'Board should have 15 columns');

    // Check all intersections are empty
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        testSuite.assertEqual(board[row][col], game.EMPTY, `Intersection [${row}][${col}] should be empty`);
      }
    }
  });

  // Test valid move
  testSuite.test('Gobang', 'Valid move', () => {
    const game = new GobangGame();
    const result = game.makeMove(7, 7); // Center position

    testSuite.assertTruthy(result.success, 'Move should be successful');
    testSuite.assertEqual(result.row, 7, 'Should place at row 7');
    testSuite.assertEqual(result.col, 7, 'Should place at column 7');
    testSuite.assertEqual(game.currentPlayer, game.WHITE, 'Should switch to white player');
    testSuite.assertEqual(game.moveHistory.length, 1, 'Should have one move in history');

    const move = game.moveHistory[0];
    testSuite.assertEqual(move.moveNumber, 1, 'First move should be numbered 1');
  });

  // Test invalid moves
  testSuite.test('Gobang', 'Invalid move - out of bounds', () => {
    const game = new GobangGame();
    const result = game.makeMove(-1, 0);
    testSuite.assertFalsy(result.success, 'Move should fail');
    testSuite.assertEqual(result.reason, 'Invalid position', 'Should report invalid position');

    const result2 = game.makeMove(0, 15);
    testSuite.assertFalsy(result2.success, 'Move should fail');
    testSuite.assertEqual(result2.reason, 'Invalid position', 'Should report invalid position');
  });

  // Test position occupied
  testSuite.test('Gobang', 'Invalid move - position occupied', () => {
    const game = new GobangGame();

    game.makeMove(7, 7); // Black
    const result = game.makeMove(7, 7); // White tries same position

    testSuite.assertFalsy(result.success, 'Move should fail');
    testSuite.assertEqual(result.reason, 'Position is occupied', 'Should report position is occupied');
  });

  // Test horizontal win
  testSuite.test('Gobang', 'Horizontal win detection', () => {
    const game = new GobangGame();

    // Black gets horizontal win
    game.makeMove(7, 5); // Black
    game.makeMove(6, 5); // White
    game.makeMove(7, 6); // Black
    game.makeMove(6, 6); // White
    game.makeMove(7, 7); // Black
    game.makeMove(6, 7); // White
    game.makeMove(7, 8); // Black
    game.makeMove(6, 8); // White
    const result = game.makeMove(7, 9); // Black - should win horizontally (5 in a row)

    testSuite.assertTruthy(result.gameWon, 'Should detect horizontal win');
    testSuite.assertEqual(result.winner, game.BLACK, 'Black should win');
    testSuite.assertTruthy(game.gameOver, 'Game should be over');
    testSuite.assertEqual(game.winningStones.length, 5, 'Should have 5 winning stones');
  });

  // Test vertical win
  testSuite.test('Gobang', 'Vertical win detection', () => {
    const game = new GobangGame();

    // Black gets vertical win
    game.makeMove(5, 7); // Black
    game.makeMove(5, 6); // White
    game.makeMove(6, 7); // Black
    game.makeMove(6, 6); // White
    game.makeMove(7, 7); // Black
    game.makeMove(7, 6); // White
    game.makeMove(8, 7); // Black
    game.makeMove(8, 6); // White
    const result = game.makeMove(9, 7); // Black - should win vertically

    testSuite.assertTruthy(result.gameWon, 'Should detect vertical win');
    testSuite.assertEqual(result.winner, game.BLACK, 'Black should win');
    testSuite.assertEqual(game.winningStones.length, 5, 'Should have 5 winning stones');
  });

  // Test diagonal win
  testSuite.test('Gobang', 'Diagonal win detection', () => {
    const game = new GobangGame();

    // Black gets diagonal win
    game.makeMove(5, 5); // Black
    game.makeMove(5, 6); // White
    game.makeMove(6, 6); // Black
    game.makeMove(6, 7); // White
    game.makeMove(7, 7); // Black
    game.makeMove(7, 8); // White
    game.makeMove(8, 8); // Black
    game.makeMove(8, 9); // White
    const result = game.makeMove(9, 9); // Black - should win diagonally

    testSuite.assertTruthy(result.gameWon, 'Should detect diagonal win');
    testSuite.assertEqual(result.winner, game.BLACK, 'Black should win');
    testSuite.assertEqual(game.winningStones.length, 5, 'Should have 5 winning stones');
  });

  // Test anti-diagonal win
  testSuite.test('Gobang', 'Anti-diagonal win detection', () => {
    const game = new GobangGame();

    // Black gets anti-diagonal win
    game.makeMove(5, 9); // Black
    game.makeMove(5, 8); // White
    game.makeMove(6, 8); // Black
    game.makeMove(6, 7); // White
    game.makeMove(7, 7); // Black
    game.makeMove(7, 6); // White
    game.makeMove(8, 6); // Black
    game.makeMove(8, 5); // White
    const result = game.makeMove(9, 5); // Black - should win anti-diagonally

    testSuite.assertTruthy(result.gameWon, 'Should detect anti-diagonal win');
    testSuite.assertEqual(result.winner, game.BLACK, 'Black should win');
    testSuite.assertEqual(game.winningStones.length, 5, 'Should have 5 winning stones');
  });

  // Test undo move
  testSuite.test('Gobang', 'Undo move', () => {
    const game = new GobangGame();

    game.makeMove(7, 7); // Black
    game.makeMove(7, 8); // White
    game.makeMove(8, 7); // Black

    testSuite.assertEqual(game.moveHistory.length, 3, 'Should have 3 moves');
    testSuite.assertEqual(game.currentPlayer, game.WHITE, 'Should be white turn');

    const undoResult = game.undoMove();
    testSuite.assertTruthy(undoResult.success, 'Undo should succeed');
    testSuite.assertEqual(game.moveHistory.length, 2, 'Should have 2 moves after undo');
    testSuite.assertEqual(game.currentPlayer, game.BLACK, 'Should be black turn after undo');

    const board = game.getBoard();
    testSuite.assertEqual(board[8][7], game.EMPTY, 'Undone position should be empty');
  });

  // Test game reset
  testSuite.test('Gobang', 'Game reset', () => {
    const game = new GobangGame();

    game.makeMove(7, 7);
    game.makeMove(7, 8);
    game.makeMove(8, 7);

    game.resetGame();

    testSuite.assertEqual(game.currentPlayer, game.BLACK, 'Should reset to black');
    testSuite.assertFalsy(game.gameOver, 'Game should not be over');
    testSuite.assertNull(game.winner, 'Should have no winner');
    testSuite.assertEqual(game.moveHistory.length, 0, 'Should have empty move history');

    const board = game.getBoard();
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        testSuite.assertEqual(board[row][col], game.EMPTY, `Intersection [${row}][${col}] should be empty after reset`);
      }
    }
  });

  // Test board notation
  testSuite.test('Gobang', 'Board notation conversion', () => {
    const game = new GobangGame();

    // Test position to notation
    testSuite.assertEqual(game.positionToNotation(0, 0), 'A15', 'Top-left should be A15');
    testSuite.assertEqual(game.positionToNotation(14, 14), 'O1', 'Bottom-right should be O1');
    testSuite.assertEqual(game.positionToNotation(7, 7), 'H8', 'Center should be H8');

    // Test notation to position
    const posA15 = game.notationToPosition('A15');
    testSuite.assertEqual(posA15.row, 0, 'A15 should be row 0');
    testSuite.assertEqual(posA15.col, 0, 'A15 should be col 0');

    const posO1 = game.notationToPosition('O1');
    testSuite.assertEqual(posO1.row, 14, 'O1 should be row 14');
    testSuite.assertEqual(posO1.col, 14, 'O1 should be col 14');
  });

  // Test AI initialization
  testSuite.test('Gobang', 'AI initialization', () => {
    const ai = new GobangAI('medium');
    testSuite.assertEqual(ai.difficulty, 'medium', 'Should set difficulty');
    testSuite.assertNotNull(ai.maxDepth, 'Should have max depth');
    testSuite.assertNotNull(ai.searchRadius, 'Should have search radius');
  });

  // Test AI move generation
  testSuite.test('Gobang', 'AI move generation', () => {
    const game = new GobangGame();
    const ai = new GobangAI('easy');

    const move = ai.getBestMove(game);
    testSuite.assertNotNull(move, 'AI should generate a move');
    testSuite.assert(move.row >= 0 && move.row < 15, 'Move row should be valid');
    testSuite.assert(move.col >= 0 && move.col < 15, 'Move column should be valid');

    // First move should be in center
    testSuite.assertEqual(move.row, 7, 'First move should be center row');
    testSuite.assertEqual(move.col, 7, 'First move should be center column');
  });

  // Test AI relevant moves generation
  testSuite.test('Gobang', 'AI relevant moves', () => {
    const game = new GobangGame();
    const ai = new GobangAI('medium');

    // Empty board should suggest center
    let relevantMoves = ai.getRelevantMoves(game);
    testSuite.assertEqual(relevantMoves.length, 1, 'Empty board should have 1 relevant move');
    testSuite.assertEqual(relevantMoves[0].row, 7, 'Should suggest center');
    testSuite.assertEqual(relevantMoves[0].col, 7, 'Should suggest center');

    // After one move, should suggest nearby positions
    game.makeMove(7, 7);
    relevantMoves = ai.getRelevantMoves(game);
    testSuite.assert(relevantMoves.length > 1, 'Should have multiple relevant moves after first move');
    testSuite.assert(relevantMoves.length < 225, 'Should not include all board positions');
  });

  // Test helper methods
  testSuite.test('Gobang', 'Helper methods', () => {
    const game = new GobangGame();

    testSuite.assertEqual(game.getPlayerName(game.BLACK), 'Spieler 1 (Schwarz)', 'Should return correct black player name');
    testSuite.assertEqual(game.getPlayerName(game.WHITE), 'Spieler 2 (Weiß)', 'Should return correct white player name');

    testSuite.assertEqual(game.getPlayerColorClass(game.BLACK), 'black', 'Should return correct black color class');
    testSuite.assertEqual(game.getPlayerColorClass(game.WHITE), 'white', 'Should return correct white color class');

    testSuite.assertEqual(game.getValidMoves().length, 225, 'Should have 225 valid moves on empty 15x15 board');

    // Place some stones
    game.makeMove(7, 7);
    game.makeMove(7, 8);
    game.makeMove(8, 7);
    testSuite.assertEqual(game.getValidMoves().length, 222, 'Should have 222 valid moves after placing 3 stones');
  });

  // Test move simulation
  testSuite.test('Gobang', 'Move simulation', () => {
    const game = new GobangGame();

    const simulation = game.simulateMove(7, 7);
    testSuite.assertTruthy(simulation.success, 'Simulation should succeed');
    testSuite.assertEqual(simulation.row, 7, 'Should simulate at row 7');
    testSuite.assertEqual(simulation.col, 7, 'Should simulate at column 7');
    testSuite.assertEqual(simulation.player, game.BLACK, 'Should simulate for current player');

    // Actual board should be unchanged
    const board = game.getBoard();
    testSuite.assertEqual(board[7][7], game.EMPTY, 'Actual board should be unchanged');
  });

  // Test last move tracking
  testSuite.test('Gobang', 'Last move tracking', () => {
    const game = new GobangGame();

    testSuite.assertNull(game.getLastMove(), 'Should have no last move initially');

    game.makeMove(7, 7);
    const lastMove = game.getLastMove();
    testSuite.assertNotNull(lastMove, 'Should have last move after first move');
    testSuite.assertEqual(lastMove.row, 7, 'Last move should be at row 7');
    testSuite.assertEqual(lastMove.col, 7, 'Last move should be at column 7');
    testSuite.assertEqual(lastMove.player, game.BLACK, 'Last move should be by black');
    testSuite.assertEqual(lastMove.moveNumber, 1, 'Last move should be move number 1');
  });

  // Test win detection with more than 5 stones
  testSuite.test('Gobang', 'Win with more than 5 stones', () => {
    const game = new GobangGame();

    // Create a winning line of 6 stones
    game.makeMove(7, 4); // Black
    game.makeMove(6, 4); // White
    game.makeMove(7, 5); // Black
    game.makeMove(6, 5); // White
    game.makeMove(7, 6); // Black
    game.makeMove(6, 6); // White
    game.makeMove(7, 7); // Black
    game.makeMove(6, 7); // White
    game.makeMove(7, 8); // Black
    game.makeMove(6, 8); // White
    const result = game.makeMove(7, 9); // Black - 6th stone in a row

    testSuite.assertTruthy(result.gameWon, 'Should detect win with 6 stones');
    testSuite.assertEqual(result.winner, game.BLACK, 'Black should win');
    testSuite.assert(game.winningStones.length >= 5, 'Should have at least 5 winning stones');
  });
}
