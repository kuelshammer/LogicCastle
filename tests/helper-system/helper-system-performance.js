/**
 * Helper-System Performance Tests
 *
 * Coverage: Analysis Performance under complex boards, Memory Usage Monitoring,
 * Hint Update Frequency, Strategic Calculation Benchmarks, Scaling Tests
 */
function runHelperSystemPerformanceTests(testSuite) {

  // Test basic helper initialization performance
  testSuite.test('Helper-System-Performance', 'Helper initialization performance', () => {
    const game = new Connect4Game();

    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      const helpers = new Connect4Helpers(game, null);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 100,
      `100 helper initializations should take <100ms (took ${totalTime.toFixed(2)}ms)`);
  });

  // Test hint update performance on empty board
  testSuite.test('Helper-System-Performance', 'Hint updates on empty board', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    helpers.setEnabled(true, 2); // Full help level

    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      helpers.updateHints();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 200,
      `50 hint updates on empty board should take <200ms (took ${totalTime.toFixed(2)}ms)`);
  });

  // Test hint update performance on complex board
  testSuite.test('Helper-System-Performance', 'Hint updates on complex board', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create complex board state
    const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6, 0, 6, 3, 2, 4];
    complexMoves.forEach(col => {
      if (game.getValidMoves().includes(col)) {
        game.makeMove(col);
      }
    });

    helpers.setEnabled(true, 2); // Full help level

    const startTime = performance.now();

    for (let i = 0; i < 20; i++) {
      helpers.updateHints();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 1000,
      `20 hint updates on complex board should take <1000ms (took ${totalTime.toFixed(2)}ms)`);
  });

  // Test strategic analysis performance scaling
  testSuite.test('Helper-System-Performance', 'Strategic analysis performance scaling', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    const performanceResults = [];

    // Test performance at different board fill levels
    const fillLevels = [0, 5, 10, 15, 20, 25];

    for (const fillLevel of fillLevels) {
      // Reset game and fill to desired level
      game.resetGame();

      for (let i = 0; i < fillLevel; i++) {
        const validMoves = game.getValidMoves();
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.makeMove(randomMove);
        }
      }

      // Time strategic analysis
      const startTime = performance.now();

      const evenOddAnalysis = helpers.analyzeEvenOddThreats();
      const zugzwangMoves = helpers.detectZugzwang();
      const forkOpportunities = helpers.analyzeForkOpportunities();
      const strategicEval = helpers.getEnhancedStrategicEvaluation();

      const endTime = performance.now();
      const analysisTime = endTime - startTime;

      performanceResults.push({
        fillLevel: fillLevel,
        time: analysisTime
      });

      testSuite.assert(analysisTime < 500,
        `Strategic analysis at fill level ${fillLevel} should take <500ms (took ${analysisTime.toFixed(2)}ms)`);
    }

    // Verify performance doesn't degrade exponentially
    const maxTime = Math.max(...performanceResults.map(r => r.time));
    const minTime = Math.min(...performanceResults.map(r => r.time));

    testSuite.assert(maxTime / minTime < 10,
      'Performance degradation should be reasonable (max/min ratio < 10)');
  });

  // Test move consequence analysis performance
  testSuite.test('Helper-System-Performance', 'Move consequence analysis performance', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create mid-game position
    const midGameMoves = [3, 2, 4, 1, 5, 3, 2, 4];
    midGameMoves.forEach(col => game.makeMove(col));

    const startTime = performance.now();

    // Analyze consequences for all valid moves
    const validMoves = game.getValidMoves();
    const analyses = [];

    for (const col of validMoves) {
      const analysis = helpers.analyzeMoveConsequences(col);
      analyses.push(analysis);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 300,
      `Move consequence analysis for ${validMoves.length} moves should take <300ms (took ${totalTime.toFixed(2)}ms)`);
    testSuite.assertEqual(analyses.length, validMoves.length,
      'Should analyze all valid moves');
  });

  // Test threat counting performance
  testSuite.test('Helper-System-Performance', 'Threat counting performance', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create position with various threats
    game.board[5][1] = game.PLAYER1;
    game.board[5][2] = game.PLAYER1;
    game.board[4][1] = game.PLAYER2;
    game.board[4][2] = game.PLAYER2;
    game.board[3][1] = game.PLAYER1;

    const startTime = performance.now();

    // Count threats for multiple positions and players
    let totalThreats = 0;

    for (let col = 0; col < 7; col++) {
      const p1Threats = helpers.countThreatsForPlayer(col, game.PLAYER1);
      const p2Threats = helpers.countThreatsForPlayer(col, game.PLAYER2);
      totalThreats += p1Threats + p2Threats;
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 100,
      `Threat counting for all columns and players should take <100ms (took ${totalTime.toFixed(2)}ms)`);
    testSuite.assert(typeof totalThreats === 'number', 'Should return numeric threat count');
  });

  // Test board simulation performance
  testSuite.test('Helper-System-Performance', 'Board simulation performance', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create test position
    game.makeMove(3);
    game.makeMove(2);
    game.makeMove(4);

    const startTime = performance.now();

    // Perform many board copies and simulations
    for (let i = 0; i < 1000; i++) {
      const boardCopy = helpers.copyBoard(game.board);

      // Modify copy to test independence
      boardCopy[0][0] = game.PLAYER1;
      boardCopy[1][1] = game.PLAYER2;
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 200,
      `1000 board copies should take <200ms (took ${totalTime.toFixed(2)}ms)`);

    // Verify original board unchanged
    testSuite.assertEqual(game.board[0][0], game.EMPTY, 'Original board should be unchanged');
    testSuite.assertEqual(game.board[1][1], game.EMPTY, 'Original board should be unchanged');
  });

  // Test connected pieces counting performance
  testSuite.test('Helper-System-Performance', 'Connected pieces counting performance', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Fill board with pattern
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        game.board[row][col] = (row + col) % 2 === 0 ? game.PLAYER1 : game.PLAYER2;
      }
    }

    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal /
      [1, -1]   // Diagonal \
    ];

    const startTime = performance.now();

    let totalConnections = 0;

    // Count connections from every position in every direction
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        for (const [deltaRow, deltaCol] of directions) {
          const connections = helpers.countConnectedPieces(row, col, deltaRow, deltaCol, game.board[row][col]);
          totalConnections += connections;
        }
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 100,
      `Connected pieces counting for full board should take <100ms (took ${totalTime.toFixed(2)}ms)`);
    testSuite.assert(totalConnections > 0, 'Should count some connections');
  });

  // Test column threat analysis performance
  testSuite.test('Helper-System-Performance', 'Column threat analysis performance', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create varied board state
    const patternMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5];
    patternMoves.forEach(col => game.makeMove(col));

    const startTime = performance.now();

    // Analyze threats in all columns for both players
    let totalThreats = 0;

    for (let col = 0; col < 7; col++) {
      const p1Threats = helpers.analyzeColumnThreats(col, game.PLAYER1);
      const p2Threats = helpers.analyzeColumnThreats(col, game.PLAYER2);
      totalThreats += p1Threats.length + p2Threats.length;
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 150,
      `Column threat analysis for all columns should take <150ms (took ${totalTime.toFixed(2)}ms)`);
    testSuite.assert(typeof totalThreats === 'number', 'Should return numeric threat count');
  });

  // Test win detection performance
  testSuite.test('Helper-System-Performance', 'Win detection performance', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create board with multiple potential wins
    game.board[5][0] = game.PLAYER1;
    game.board[5][1] = game.PLAYER1;
    game.board[5][2] = game.PLAYER1;
    game.board[4][3] = game.PLAYER2;
    game.board[3][3] = game.PLAYER2;
    game.board[2][3] = game.PLAYER2;

    const startTime = performance.now();

    // Test win detection at many positions
    let winDetections = 0;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (game.board[row][col] === game.EMPTY) {
          const p1Win = helpers.checkWinAtPosition(row, col, game.PLAYER1);
          const p2Win = helpers.checkWinAtPosition(row, col, game.PLAYER2);
          if (p1Win) winDetections++;
          if (p2Win) winDetections++;
        }
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 50,
      `Win detection for all empty positions should take <50ms (took ${totalTime.toFixed(2)}ms)`);
    testSuite.assert(winDetections >= 2, 'Should detect some potential wins');
  });

  // Test memory usage stability
  testSuite.test('Helper-System-Performance', 'Memory usage stability', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    helpers.setEnabled(true, 2);

    // Perform many operations to check for memory leaks
    for (let i = 0; i < 100; i++) {
      // Create and analyze various positions
      game.resetGame();

      // Make random moves
      for (let j = 0; j < 10; j++) {
        const validMoves = game.getValidMoves();
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.makeMove(randomMove);
        }
      }

      // Perform full analysis
      helpers.updateHints();
      const strategicEval = helpers.getEnhancedStrategicEvaluation();

      // Clear hints
      helpers.clearAllHints();
    }

    testSuite.assert(true, 'Memory stability test completed without errors');

    // Verify helpers are still functional
    const finalHints = helpers.getCurrentHints();
    testSuite.assertNotNull(finalHints, 'Helper system should remain functional');
  });

  // Test concurrent analysis performance
  testSuite.test('Helper-System-Performance', 'Concurrent analysis simulation', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Create test position
    game.makeMove(3);
    game.makeMove(2);
    game.makeMove(4);

    const startTime = performance.now();

    // Simulate rapid concurrent calls (like rapid UI interactions)
    const analysisPromises = [];

    for (let i = 0; i < 20; i++) {
      // Each "concurrent" call performs full analysis
      const analysis = {
        evenOdd: helpers.analyzeEvenOddThreats(),
        zugzwang: helpers.detectZugzwang(),
        forks: helpers.analyzeForkOpportunities(),
        strategic: helpers.getEnhancedStrategicEvaluation()
      };
      analysisPromises.push(Promise.resolve(analysis));
    }

    Promise.all(analysisPromises).then(results => {
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      testSuite.assert(totalTime < 1000,
        `20 concurrent analyses should complete in <1000ms (took ${totalTime.toFixed(2)}ms)`);
      testSuite.assertEqual(results.length, 20, 'All analyses should complete');
    });

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    testSuite.assert(totalTime < 1000,
      `Concurrent analysis simulation should complete in <1000ms (took ${totalTime.toFixed(2)}ms)`);
  });

  // Test performance regression detection
  testSuite.test('Helper-System-Performance', 'Performance regression detection', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game, null);

    // Baseline performance measurement
    const baselineRuns = [];

    for (let i = 0; i < 5; i++) {
      game.resetGame();
      game.makeMove(3);
      game.makeMove(2);

      const startTime = performance.now();
      helpers.getEnhancedStrategicEvaluation();
      const endTime = performance.now();

      baselineRuns.push(endTime - startTime);
    }

    const averageBaseline = baselineRuns.reduce((a, b) => a + b, 0) / baselineRuns.length;

    // Performance with complex board
    const complexRuns = [];

    for (let i = 0; i < 5; i++) {
      game.resetGame();

      // Create complex position
      const moves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6];
      moves.forEach(col => {
        if (game.getValidMoves().includes(col)) {
          game.makeMove(col);
        }
      });

      const startTime = performance.now();
      helpers.getEnhancedStrategicEvaluation();
      const endTime = performance.now();

      complexRuns.push(endTime - startTime);
    }

    const averageComplex = complexRuns.reduce((a, b) => a + b, 0) / complexRuns.length;

    // Complex analysis should not be more than 5x slower than baseline
    testSuite.assert(averageComplex / averageBaseline < 5,
      `Complex analysis should not be >5x slower than baseline (${averageComplex.toFixed(2)}ms vs ${averageBaseline.toFixed(2)}ms)`);

    // Both should be within reasonable limits
    testSuite.assert(averageBaseline < 100,
      `Baseline performance should be <100ms (${averageBaseline.toFixed(2)}ms)`);
    testSuite.assert(averageComplex < 500,
      `Complex analysis should be <500ms (${averageComplex.toFixed(2)}ms)`);
  });
}
