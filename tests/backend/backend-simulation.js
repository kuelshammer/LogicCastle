/**
 * Backend Simulation Tests for Connect4
 *
 * Coverage: Board simulation accuracy, state isolation,
 * memory safety, simulation vs real game consistency
 */
function runBackendSimulationTests(testSuite) {

  // Test basic simulateMove functionality
  testSuite.test('Backend-Simulation', 'Basic simulateMove accuracy', () => {
    const game = new Connect4Game();

    // Test simulation without affecting real game
    const simulation = game.simulateMove(3);

    testSuite.assertTruthy(simulation.success, 'Simulation should succeed');
    testSuite.assertEqual(simulation.col, 3, 'Simulation should report correct column');
    testSuite.assertEqual(simulation.row, 5, 'Simulation should report correct row (bottom)');
    testSuite.assertEqual(simulation.player, game.PLAYER1, 'Simulation should use current player');

    // Verify real game state unchanged
    testSuite.assertEqual(game.board[5][3], game.EMPTY, 'Real board should be unchanged');
    testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Current player should be unchanged');
    testSuite.assertEqual(game.moveHistory.length, 0, 'Move history should be unchanged');
  });

  // Test simulateMove with full column
  testSuite.test('Backend-Simulation', 'simulateMove with full column', () => {
    const game = new Connect4Game();

    // Fill column 0 completely
    for (let i = 0; i < 6; i++) {
      game.makeMove(0);
    }

    // Try to simulate move in full column
    const simulation = game.simulateMove(0);

    testSuite.assertFalsy(simulation.success, 'Simulation should fail for full column');
    testSuite.assertEqual(simulation.reason, 'Column is full', 'Should provide correct reason');
  });

  // Test simulateMove win detection
  testSuite.test('Backend-Simulation', 'simulateMove win detection', () => {
    const game = new Connect4Game();

    // Set up a near-win situation
    game.makeMove(0); // P1
    game.makeMove(1); // P2
    game.makeMove(0); // P1
    game.makeMove(1); // P2
    game.makeMove(0); // P1
    game.makeMove(1); // P2

    // Simulate the winning move
    const simulation = game.simulateMove(0);

    testSuite.assertTruthy(simulation.success, 'Simulation should succeed');
    testSuite.assertTruthy(simulation.wouldWin, 'Simulation should detect win');

    // Verify real game still not won
    testSuite.assertFalsy(game.gameOver, 'Real game should not be over');
    testSuite.assertNull(game.winner, 'Real game should have no winner');
  });

  // Test board copy integrity
  testSuite.test('Backend-Simulation', 'Board copy integrity', () => {
    const game = new Connect4Game();

    // Make some moves
    game.makeMove(0);
    game.makeMove(1);
    game.makeMove(2);

    // Get board copy
    const boardCopy = game.getBoard();

    // Verify copy is independent
    boardCopy[0][0] = game.PLAYER2; // Modify copy

    testSuite.assertNotEqual(game.board[0][0], boardCopy[0][0], 'Board copy should be independent');
    testSuite.assertEqual(game.board[0][0], game.EMPTY, 'Original board should be unchanged');
  });

  // Test simulation consistency with real moves
  testSuite.test('Backend-Simulation', 'Simulation vs real move consistency', () => {
    const game = new Connect4Game();

    // Test multiple moves for consistency
    for (let col = 0; col < 7; col++) {
      // Create fresh game for each test
      const testGame = new Connect4Game();

      // Simulate move
      const simulation = testGame.simulateMove(col);

      // Make real move
      const realMove = testGame.makeMove(col);

      if (simulation.success && realMove.success) {
        testSuite.assertEqual(simulation.row, realMove.row, `Row should match for column ${col}`);
        testSuite.assertEqual(simulation.col, realMove.col, `Column should match for column ${col}`);
        testSuite.assertEqual(simulation.player, realMove.player, `Player should match for column ${col}`);
      }
    }
  });

  // Test simulation with complex board state
  testSuite.test('Backend-Simulation', 'Simulation with complex board state', () => {
    const game = new Connect4Game();

    // Create complex board state
    const moves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6];
    moves.forEach(col => game.makeMove(col));

    // Test simulation in each available column
    const validMoves = game.getValidMoves();

    validMoves.forEach(col => {
      const simulation = game.simulateMove(col);
      testSuite.assertTruthy(simulation.success, `Simulation should succeed for valid column ${col}`);
      testSuite.assert(simulation.row >= 0 && simulation.row < 6, `Row should be valid for column ${col}`);
      testSuite.assert(typeof simulation.board !== 'undefined', `Simulation should include board state for column ${col}`);
    });
  });

  // Test memory isolation between simulations
  testSuite.test('Backend-Simulation', 'Memory isolation between simulations', () => {
    const game = new Connect4Game();

    // Run multiple simulations
    const sim1 = game.simulateMove(0);
    const sim2 = game.simulateMove(1);
    const sim3 = game.simulateMove(2);

    // Verify each simulation is independent
    testSuite.assertNotEqual(sim1.board, sim2.board, 'Simulation boards should be different objects');
    testSuite.assertNotEqual(sim2.board, sim3.board, 'Simulation boards should be different objects');

    // Verify simulations don't affect each other
    sim1.board[0][0] = game.PLAYER2;
    testSuite.assertNotEqual(sim2.board[0][0], game.PLAYER2, 'Modifying one simulation should not affect another');
  });

  // Test checkWinOnBoard accuracy
  testSuite.test('Backend-Simulation', 'checkWinOnBoard accuracy', () => {
    const game = new Connect4Game();

    // Create board with known win
    const testBoard = [];
    for (let row = 0; row < 6; row++) {
      testBoard[row] = new Array(7).fill(game.EMPTY);
    }

    // Create horizontal win for P1 in bottom row
    testBoard[5][0] = game.PLAYER1;
    testBoard[5][1] = game.PLAYER1;
    testBoard[5][2] = game.PLAYER1;
    testBoard[5][3] = game.PLAYER1;

    const hasWin = game.checkWinOnBoard(testBoard, 5, 3, game.PLAYER1);
    testSuite.assertTruthy(hasWin, 'Should detect horizontal win');

    // Test no win scenario
    testBoard[5][3] = game.EMPTY; // Remove winning piece
    const noWin = game.checkWinOnBoard(testBoard, 5, 2, game.PLAYER1);
    testSuite.assertFalsy(noWin, 'Should not detect win when incomplete');
  });

  // Test performance of simulation operations
  testSuite.test('Backend-Simulation', 'Simulation performance', () => {
    const game = new Connect4Game();

    // Time multiple simulations
    const startTime = performance.now();

    // Run 1000 simulations
    for (let i = 0; i < 1000; i++) {
      const col = i % 7; // Cycle through columns
      game.simulateMove(col);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should complete in reasonable time (< 100ms for 1000 simulations)
    testSuite.assert(totalTime < 100, `1000 simulations should complete in <100ms (took ${totalTime.toFixed(2)}ms)`);
  });

  // Test simulation with undo scenarios
  testSuite.test('Backend-Simulation', 'Simulation with undo scenarios', () => {
    const game = new Connect4Game();

    // Make some moves
    game.makeMove(3);
    game.makeMove(2);
    game.makeMove(4);

    // Simulate next move
    const beforeUndo = game.simulateMove(1);

    // Undo last move
    game.undoMove();

    // Simulate same move again
    const afterUndo = game.simulateMove(1);

    // Results should be different due to different game state
    testSuite.assertNotEqual(beforeUndo.player, afterUndo.player, 'Player should be different after undo');
  });

  // Test edge case: simulation on empty board
  testSuite.test('Backend-Simulation', 'Simulation on empty board', () => {
    const game = new Connect4Game();

    // Test all columns on empty board
    for (let col = 0; col < 7; col++) {
      const simulation = game.simulateMove(col);

      testSuite.assertTruthy(simulation.success, `Simulation should succeed on empty board for column ${col}`);
      testSuite.assertEqual(simulation.row, 5, `Should land on bottom row for column ${col}`);
      testSuite.assertEqual(simulation.player, game.PLAYER1, `Should use player 1 for column ${col}`);
    }
  });

  // Test edge case: simulation with invalid input
  testSuite.test('Backend-Simulation', 'Simulation with invalid input', () => {
    const game = new Connect4Game();

    const invalidInputs = [-1, 7, 8, NaN, undefined, null, 'abc'];

    invalidInputs.forEach(input => {
      // This should either return failure or handle gracefully
      try {
        const simulation = game.simulateMove(input);
        if (simulation.success !== false) {
          testSuite.assert(false, `Invalid input ${input} should not succeed`);
        }
      } catch (e) {
        // Catching errors is also acceptable for invalid input
        testSuite.assert(true, `Invalid input ${input} properly handled with error`);
      }
    });
  });
}
