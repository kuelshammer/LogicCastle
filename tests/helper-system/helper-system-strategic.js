/**
 * Helper-System Strategic Analysis Tests
 *
 * Coverage: Even/Odd Threat Analysis, Zugzwang Detection, Fork Opportunity Analysis,
 * Strategic Evaluation Consistency, Advanced Tactical Analysis
 */
function runHelperSystemStrategicTests(testSuite) {

  // Test Even/Odd threat analysis accuracy
  testSuite.test('Helper-System-Strategic', 'Even/Odd threat analysis accuracy', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create position with distinct even/odd threats
    game.board[5][0] = game.PLAYER1; // Red bottom (odd threat row)
    game.board[5][1] = game.PLAYER1; // Red bottom (odd threat row)
    game.board[4][0] = game.PLAYER2; // Yellow (even threat row)
    game.board[4][1] = game.PLAYER2; // Yellow (even threat row)

    const evenOddAnalysis = helpers.analyzeEvenOddThreats();

    testSuite.assertNotNull(evenOddAnalysis, 'Should return even/odd analysis');
    testSuite.assertNotNull(evenOddAnalysis.player, 'Should analyze current player threats');
    testSuite.assertNotNull(evenOddAnalysis.opponent, 'Should analyze opponent threats');
    testSuite.assertNotNull(evenOddAnalysis.parity, 'Should determine parity');

    // Verify structure
    testSuite.assert(Array.isArray(evenOddAnalysis.player.odd), 'Player odd threats should be array');
    testSuite.assert(Array.isArray(evenOddAnalysis.player.even), 'Player even threats should be array');
    testSuite.assert(Array.isArray(evenOddAnalysis.opponent.odd), 'Opponent odd threats should be array');
    testSuite.assert(Array.isArray(evenOddAnalysis.opponent.even), 'Opponent even threats should be array');
  });

  // Test Even/Odd analysis state isolation
  testSuite.test('Helper-System-Strategic', 'Even/Odd analysis state isolation', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create test position
    game.makeMove(3);
    game.makeMove(2);
    game.makeMove(4);

    const originalBoard = JSON.stringify(game.board);
    const originalPlayer = game.currentPlayer;
    const originalGameOver = game.gameOver;

    // Run even/odd analysis
    const analysis = helpers.analyzeEvenOddThreats();

    // Verify no state corruption
    testSuite.assertEqual(JSON.stringify(game.board), originalBoard,
      'Board should be unchanged after even/odd analysis');
    testSuite.assertEqual(game.currentPlayer, originalPlayer,
      'Current player should be unchanged after even/odd analysis');
    testSuite.assertEqual(game.gameOver, originalGameOver,
      'Game over status should be unchanged after even/odd analysis');

    testSuite.assertNotNull(analysis, 'Should return valid analysis');
  });

  // Test Zugzwang detection accuracy
  testSuite.test('Helper-System-Strategic', 'Zugzwang detection accuracy', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create potential zugzwang position
    game.makeMove(3); // Red center
    game.makeMove(2); // Yellow left
    game.makeMove(3); // Red stack
    game.makeMove(4); // Yellow right
    game.makeMove(3); // Red stack higher

    const zugzwangMoves = helpers.detectZugzwang();

    testSuite.assertNotNull(zugzwangMoves, 'Should return zugzwang analysis');
    testSuite.assert(Array.isArray(zugzwangMoves), 'Should return array of zugzwang moves');

    // Each zugzwang move should have proper structure
    zugzwangMoves.forEach((move, index) => {
      testSuite.assertNotNull(move.column, `Zugzwang move ${index + 1} should have column`);
      testSuite.assert(typeof move.column === 'number', `Zugzwang move ${index + 1} column should be number`);
      testSuite.assert(move.column >= 0 && move.column < 7, `Zugzwang move ${index + 1} should be valid column`);
      testSuite.assertNotNull(move.description, `Zugzwang move ${index + 1} should have description`);
    });
  });

  // Test Zugzwang detection state isolation
  testSuite.test('Helper-System-Strategic', 'Zugzwang detection state isolation', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create complex position
    game.makeMove(3);
    game.makeMove(2);
    game.makeMove(4);
    game.makeMove(1);

    const beforeAnalysis = {
      board: JSON.stringify(game.board),
      player: game.currentPlayer,
      gameOver: game.gameOver,
      moveHistory: game.moveHistory.length
    };

    // Run zugzwang detection
    const zugzwangMoves = helpers.detectZugzwang();

    // Verify complete state isolation
    testSuite.assertEqual(JSON.stringify(game.board), beforeAnalysis.board,
      'Board should be unchanged after zugzwang detection');
    testSuite.assertEqual(game.currentPlayer, beforeAnalysis.player,
      'Current player should be unchanged after zugzwang detection');
    testSuite.assertEqual(game.gameOver, beforeAnalysis.gameOver,
      'Game over status should be unchanged after zugzwang detection');
    testSuite.assertEqual(game.moveHistory.length, beforeAnalysis.moveHistory,
      'Move history should be unchanged after zugzwang detection');

    testSuite.assertNotNull(zugzwangMoves, 'Should return valid zugzwang analysis');
  });

  // Test Fork opportunity analysis accuracy
  testSuite.test('Helper-System-Strategic', 'Fork opportunity analysis accuracy', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create position with potential fork opportunities
    game.board[5][1] = game.PLAYER1; // Red
    game.board[5][2] = game.PLAYER1; // Red
    game.board[4][1] = game.PLAYER1; // Red stack
    game.currentPlayer = game.PLAYER1; // Red to move

    const forkOpportunities = helpers.analyzeForkOpportunities();

    testSuite.assertNotNull(forkOpportunities, 'Should return fork analysis');
    testSuite.assert(Array.isArray(forkOpportunities), 'Should return array of fork opportunities');

    // Each fork should have proper structure
    forkOpportunities.forEach((fork, index) => {
      testSuite.assertNotNull(fork.column, `Fork ${index + 1} should have column`);
      testSuite.assert(typeof fork.column === 'number', `Fork ${index + 1} column should be number`);
      testSuite.assert(fork.column >= 0 && fork.column < 7, `Fork ${index + 1} should be valid column`);
      testSuite.assertNotNull(fork.threats, `Fork ${index + 1} should have threat count`);
      testSuite.assert(typeof fork.threats === 'number', `Fork ${index + 1} threats should be number`);
      testSuite.assert(fork.threats >= 2, `Fork ${index + 1} should have at least 2 threats`);
      testSuite.assertNotNull(fork.priority, `Fork ${index + 1} should have priority`);
    });

    // Forks should be sorted by threat count (highest first)
    for (let i = 1; i < forkOpportunities.length; i++) {
      testSuite.assert(forkOpportunities[i-1].threats >= forkOpportunities[i].threats,
        'Forks should be sorted by threat count descending');
    }
  });

  // Test Fork analysis state isolation
  testSuite.test('Helper-System-Strategic', 'Fork analysis state isolation', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create test position
    game.makeMove(3);
    game.makeMove(1);
    game.makeMove(2);
    game.makeMove(5);

    const stateSnapshot = {
      board: JSON.stringify(game.board),
      player: game.currentPlayer,
      gameOver: game.gameOver,
      moveHistory: [...game.moveHistory]
    };

    // Run fork analysis
    const forks = helpers.analyzeForkOpportunities();

    // Verify no state corruption
    testSuite.assertEqual(JSON.stringify(game.board), stateSnapshot.board,
      'Board should be unchanged after fork analysis');
    testSuite.assertEqual(game.currentPlayer, stateSnapshot.player,
      'Current player should be unchanged after fork analysis');
    testSuite.assertEqual(game.gameOver, stateSnapshot.gameOver,
      'Game over status should be unchanged after fork analysis');
    testSuite.assertEqual(JSON.stringify(game.moveHistory), JSON.stringify(stateSnapshot.moveHistory),
      'Move history should be unchanged after fork analysis');

    testSuite.assertNotNull(forks, 'Should return valid fork analysis');
  });

  // Test Enhanced Strategic Evaluation integration
  testSuite.test('Helper-System-Strategic', 'Enhanced strategic evaluation integration', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create complex strategic position
    game.makeMove(3); // Red center
    game.makeMove(2); // Yellow left
    game.makeMove(3); // Red stack
    game.makeMove(4); // Yellow right
    game.makeMove(2); // Red left
    game.makeMove(1); // Yellow far left

    const strategicEval = helpers.getEnhancedStrategicEvaluation();

    testSuite.assertNotNull(strategicEval, 'Should return strategic evaluation');
    testSuite.assertNotNull(strategicEval.evenOddAnalysis, 'Should include even/odd analysis');
    testSuite.assertNotNull(strategicEval.zugzwangOpportunities, 'Should include zugzwang opportunities');
    testSuite.assertNotNull(strategicEval.forkOpportunities, 'Should include fork opportunities');
    testSuite.assertNotNull(strategicEval.confidence, 'Should include confidence level');

    // Verify confidence levels
    const validConfidences = ['low', 'medium', 'high'];
    testSuite.assert(validConfidences.includes(strategicEval.confidence),
      'Confidence should be low, medium, or high');

    // Verify component analysis integrity
    testSuite.assertNotNull(strategicEval.evenOddAnalysis.parity,
      'Even/odd analysis should include parity determination');
    testSuite.assert(Array.isArray(strategicEval.zugzwangOpportunities),
      'Zugzwang opportunities should be array');
    testSuite.assert(Array.isArray(strategicEval.forkOpportunities),
      'Fork opportunities should be array');
  });

  // Test Enhanced Strategic Evaluation state isolation
  testSuite.test('Helper-System-Strategic', 'Enhanced strategic evaluation state isolation', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create position for analysis
    game.makeMove(3);
    game.makeMove(2);
    game.makeMove(4);
    game.makeMove(1);
    game.makeMove(5);

    const completeSnapshot = {
      board: JSON.stringify(game.board),
      player: game.currentPlayer,
      gameOver: game.gameOver,
      winner: game.winner,
      moveHistory: [...game.moveHistory],
      winningCells: game.winningCells ? [...game.winningCells] : null
    };

    // Run complete enhanced strategic evaluation
    const evaluation = helpers.getEnhancedStrategicEvaluation();

    // Verify COMPLETE state isolation
    testSuite.assertEqual(JSON.stringify(game.board), completeSnapshot.board,
      'Board should be completely unchanged after strategic evaluation');
    testSuite.assertEqual(game.currentPlayer, completeSnapshot.player,
      'Current player should be unchanged after strategic evaluation');
    testSuite.assertEqual(game.gameOver, completeSnapshot.gameOver,
      'Game over status should be unchanged after strategic evaluation');
    testSuite.assertEqual(game.winner, completeSnapshot.winner,
      'Winner should be unchanged after strategic evaluation');
    testSuite.assertEqual(JSON.stringify(game.moveHistory), JSON.stringify(completeSnapshot.moveHistory),
      'Move history should be unchanged after strategic evaluation');

    if (completeSnapshot.winningCells) {
      testSuite.assertEqual(JSON.stringify(game.winningCells), JSON.stringify(completeSnapshot.winningCells),
        'Winning cells should be unchanged after strategic evaluation');
    }

    testSuite.assertNotNull(evaluation, 'Should return valid strategic evaluation');
  });

  // Test threat evaluation at specific positions
  testSuite.test('Helper-System-Strategic', 'Threat evaluation at specific positions', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create position with known threats
    game.board[5][0] = game.PLAYER1; // Red
    game.board[5][1] = game.PLAYER1; // Red
    game.board[5][2] = game.PLAYER1; // Red (3 in a row, threat at column 3)

    const threatLevel = helpers.evaluateThreatAtPosition(5, 3, game.PLAYER1);

    testSuite.assertEqual(threatLevel, 3, 'Should detect level 3 threat (immediate win)');

    // Test level 2 threat
    game.board[5][3] = game.EMPTY; // Clear the position
    game.board[5][2] = game.EMPTY; // Remove one piece (now 2 in a row)

    const lowerThreat = helpers.evaluateThreatAtPosition(5, 2, game.PLAYER1);
    testSuite.assertEqual(lowerThreat, 2, 'Should detect level 2 threat (strong threat)');
  });

  // Test threat evaluation state isolation
  testSuite.test('Helper-System-Strategic', 'Threat evaluation state isolation', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create position
    game.makeMove(3);
    game.makeMove(2);

    const originalBoard = JSON.stringify(game.board);

    // Test threat evaluation at various positions
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (game.board[row][col] === game.EMPTY) {
          helpers.evaluateThreatAtPosition(row, col, game.PLAYER1);
          helpers.evaluateThreatAtPosition(row, col, game.PLAYER2);

          // Verify board unchanged after each evaluation
          testSuite.assertEqual(JSON.stringify(game.board), originalBoard,
            `Board should be unchanged after threat evaluation at [${row}][${col}]`);
        }
      }
    }
  });

  // Test connected pieces counting accuracy
  testSuite.test('Helper-System-Strategic', 'Connected pieces counting accuracy', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create horizontal line
    game.board[5][1] = game.PLAYER1;
    game.board[5][2] = game.PLAYER1;
    game.board[5][3] = game.PLAYER1;

    const horizontalCount = helpers.countConnectedPieces(5, 2, 0, 1, game.PLAYER1);
    testSuite.assertEqual(horizontalCount, 3, 'Should count 3 connected pieces horizontally');

    // Create vertical line
    game.board[4][0] = game.PLAYER2;
    game.board[5][0] = game.PLAYER2;

    const verticalCount = helpers.countConnectedPieces(5, 0, 1, 0, game.PLAYER2);
    testSuite.assertEqual(verticalCount, 2, 'Should count 2 connected pieces vertically');

    // Create diagonal line
    game.board[3][4] = game.PLAYER1;
    game.board[4][5] = game.PLAYER1;
    game.board[5][6] = game.PLAYER1;

    const diagonalCount = helpers.countConnectedPieces(4, 5, 1, 1, game.PLAYER1);
    testSuite.assertEqual(diagonalCount, 3, 'Should count 3 connected pieces diagonally');
  });

  // Test strategic analysis performance
  testSuite.test('Helper-System-Strategic', 'Strategic analysis performance', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create complex board state
    const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6, 0, 6];
    complexMoves.forEach(col => {
      if (game.getValidMoves().includes(col)) {
        game.makeMove(col);
      }
    });

    // Time the complete strategic analysis
    const startTime = performance.now();

    const evenOdd = helpers.analyzeEvenOddThreats();
    const zugzwang = helpers.detectZugzwang();
    const forks = helpers.analyzeForkOpportunities();
    const strategicEval = helpers.getEnhancedStrategicEvaluation();

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 1000,
      `Complete strategic analysis should take <1000ms (took ${totalTime.toFixed(2)}ms)`);

    // Verify all analyses returned valid results
    testSuite.assertNotNull(evenOdd, 'Even/odd analysis should complete');
    testSuite.assertNotNull(zugzwang, 'Zugzwang analysis should complete');
    testSuite.assertNotNull(forks, 'Fork analysis should complete');
    testSuite.assertNotNull(strategicEval, 'Strategic evaluation should complete');
  });

  // Test Column threat analysis completeness
  testSuite.test('Helper-System-Strategic', 'Column threat analysis completeness', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create varied column threats
    game.board[5][3] = game.PLAYER1; // Red at bottom center
    game.board[4][3] = game.PLAYER1; // Red stack

    const threats = helpers.analyzeColumnThreats(3, game.PLAYER1);

    testSuite.assertNotNull(threats, 'Should return threats array');
    testSuite.assert(Array.isArray(threats), 'Should return array');

    // Each threat should have proper structure
    threats.forEach((threat, index) => {
      testSuite.assertNotNull(threat.row, `Threat ${index + 1} should have row`);
      testSuite.assertNotNull(threat.level, `Threat ${index + 1} should have level`);
      testSuite.assertNotNull(threat.type, `Threat ${index + 1} should have type`);

      testSuite.assert(typeof threat.row === 'number', `Threat ${index + 1} row should be number`);
      testSuite.assert(typeof threat.level === 'number', `Threat ${index + 1} level should be number`);
      testSuite.assert(['odd', 'even'].includes(threat.type), `Threat ${index + 1} type should be odd/even`);
    });
  });

  // Test multiple player strategic analysis
  testSuite.test('Helper-System-Strategic', 'Multiple player strategic analysis', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create position with threats for both players
    game.board[5][0] = game.PLAYER1; // Red threat
    game.board[5][1] = game.PLAYER1; // Red threat
    game.board[5][4] = game.PLAYER2; // Yellow threat
    game.board[5][5] = game.PLAYER2; // Yellow threat

    // Test analysis for Player 1
    game.currentPlayer = game.PLAYER1;
    const player1Analysis = helpers.analyzeEvenOddThreats();

    // Test analysis for Player 2
    game.currentPlayer = game.PLAYER2;
    const player2Analysis = helpers.analyzeEvenOddThreats();

    // Verify different perspectives
    testSuite.assertNotNull(player1Analysis, 'Should analyze from Player 1 perspective');
    testSuite.assertNotNull(player2Analysis, 'Should analyze from Player 2 perspective');

    // Both should detect threats but from different perspectives
    const p1HasPlayerThreats = player1Analysis.player.odd.length > 0 || player1Analysis.player.even.length > 0;
    const p2HasPlayerThreats = player2Analysis.player.odd.length > 0 || player2Analysis.player.even.length > 0;

    testSuite.assertTruthy(p1HasPlayerThreats || p2HasPlayerThreats,
      'At least one player should have strategic threats');
  });
}
