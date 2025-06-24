/**
 * Performance Benchmark Tests
 *
 * Coverage: System performance, timing benchmarks, memory usage,
 * load testing, response time validation
 */
function runPerformanceBenchmarksTests(testSuite) {

  // Test AI performance benchmarks
  testSuite.test('Performance-Benchmarks', 'AI decision making performance', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Set up complex position
    game.board[5][3] = game.PLAYER1;
    game.board[5][2] = game.PLAYER2;
    game.board[5][4] = game.PLAYER1;
    game.board[4][3] = game.PLAYER2;

    PerformanceAssertions.assertExecutionTime(() => {
      const move = ai.getBestMove(game, helpers);
      testSuite.assert(game.getValidMoves().includes(move), 'AI should return valid move');
    }, 1000, 'AI decision should complete within time limit');
  });

  // Test helper system performance
  testSuite.test('Performance-Benchmarks', 'Helper system analysis performance', () => {
    const game = new Connect4Game();
    const ui = { getCurrentPlayerHelpEnabled: () => true };
    const helpers = new Connect4Helpers(game, ui);

    // Enable all helper levels
    helpers.setEnabled(true, 2);

    // Create complex game state
    const moves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6];
    moves.forEach(col => {
      if (game.getValidMoves().includes(col)) {
        game.makeMove(col);
      }
    });

    PerformanceAssertions.assertExecutionTime(() => {
      helpers.updateHints();
      const hints = helpers.getCurrentHints();
      testSuite.assert(hints !== null, 'Should generate hints');
    }, 500, 'Helper analysis should complete within time limit');
  });

  // Test game state operations performance
  testSuite.test('Performance-Benchmarks', 'Game state operations performance', () => {
    const game = new Connect4Game();

    PerformanceAssertions.assertExecutionTime(() => {
      // Perform many rapid operations
      for (let i = 0; i < 1000; i++) {
        const validMoves = game.getValidMoves();
        const boardCopy = game.getBoard();
        game.isColumnFull(3);
        game.getCurrentPlayer();
      }
    }, 100, 'Game state operations should be fast');
  });

  // Test memory usage under load
  testSuite.test('Performance-Benchmarks', 'Memory usage under load', () => {
    const games = [];

    // Create many game instances
    for (let i = 0; i < 100; i++) {
      const game = new Connect4Game();
      const ai = new Connect4AI('smart-random');

      // Play a few moves
      for (let j = 0; j < 5; j++) {
        const validMoves = game.getValidMoves();
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.makeMove(randomMove);
        }
      }

      games.push({ game, ai });
    }

    testSuite.assertEqual(games.length, 100, 'Should create 100 game instances');

    // Cleanup
    games.length = 0;
  });

  // Test UI update performance
  testSuite.test('Performance-Benchmarks', 'UI update performance', () => {
    // Skip if in slow environment
    PerformanceAssertions.skipIfSlow(() => {
      const game = new Connect4Game();

      // Mock DOM elements
      const mockBoard = document.createElement('div');
      mockBoard.id = 'gameBoard';
      document.body.appendChild(mockBoard);

      const ui = new Connect4UI(game);
      ui.createBoard();

      PerformanceAssertions.assertExecutionTime(() => {
        // Rapid UI updates
        for (let i = 0; i < 50; i++) {
          ui.updateBoard();
          ui.updateUI();
        }
      }, 200, 'UI updates should be fast');

      // Cleanup
      document.body.removeChild(mockBoard);
    }, 'UI performance test skipped in slow environment');
  });

  // Test concurrent operations performance
  testSuite.test('Performance-Benchmarks', 'Concurrent operations performance', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Set up game state
    game.makeMove(3);
    game.makeMove(2);

    PerformanceAssertions.assertExecutionTime(() => {
      // Simulate concurrent operations
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(() => ai.getBestMove(game, helpers));
        operations.push(() => helpers.analyzeEvenOddThreats());
        operations.push(() => game.getValidMoves());
      }

      // Execute all operations
      operations.forEach(op => op());

    }, 2000, 'Concurrent operations should complete within time limit');
  });

  // Test large-scale simulation performance
  testSuite.test('Performance-Benchmarks', 'Large-scale simulation performance', () => {
    PerformanceAssertions.skipIfSlow(() => {
      const startTime = performance.now();
      let gamesCompleted = 0;

      // Run multiple complete games rapidly
      for (let gameNum = 0; gameNum < 10; gameNum++) {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');

        // Play until game ends or board fills
        while (!game.gameOver && game.moveHistory.length < 20) {
          const validMoves = game.getValidMoves();
          if (validMoves.length === 0) break;

          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.makeMove(randomMove);
        }

        gamesCompleted++;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      testSuite.assertEqual(gamesCompleted, 10, 'Should complete all 10 games');
      testSuite.assert(duration < 5000, `10 games should complete <5000ms (took ${duration.toFixed(2)}ms)`);

    }, 'Large-scale simulation skipped in slow environment');
  });

  // Test response time consistency
  testSuite.test('Performance-Benchmarks', 'Response time consistency', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    const responseTimes = [];

    // Measure response times over multiple calls
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      const move = ai.getBestMove(game, helpers);
      const endTime = performance.now();

      responseTimes.push(endTime - startTime);
      testSuite.assert(game.getValidMoves().includes(move), `Move ${i + 1} should be valid`);
    }

    // Check consistency (no response should be >3x the average)
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxAllowed = TestEnvironment.adjustTimeout(avgTime * 3);

    responseTimes.forEach((time, index) => {
      testSuite.assert(time <= maxAllowed,
        `Response ${index + 1} (${time.toFixed(2)}ms) should be consistent with average (${avgTime.toFixed(2)}ms)`);
    });
  });

  // Test memory leak detection
  testSuite.test('Performance-Benchmarks', 'Memory leak detection', () => {
    let initialMemory = 0;
    if (performance.memory) {
      initialMemory = performance.memory.usedJSHeapSize;
    }

    // Create and destroy many objects
    for (let cycle = 0; cycle < 5; cycle++) {
      const objects = [];

      for (let i = 0; i < 100; i++) {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        objects.push({ game, ai, helpers });
      }

      // Clear references
      objects.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    if (performance.memory) {
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Allow some memory increase but not excessive
      const maxAllowedIncrease = 10 * 1024 * 1024; // 10MB
      testSuite.assert(memoryIncrease < maxAllowedIncrease,
        `Memory increase (${(memoryIncrease / 1024 / 1024).toFixed(2)}MB) should be reasonable`);
    }
  });

  // Test performance under stress
  testSuite.test('Performance-Benchmarks', 'Performance under stress', () => {
    PerformanceAssertions.skipIfSlow(() => {
      const game = new Connect4Game();
      const ai = new Connect4AI('enhanced-smart');
      const helpers = new Connect4Helpers(game, null);

      // Create complex game state
      const setupMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6, 0, 6];
      setupMoves.forEach(col => {
        if (game.getValidMoves().includes(col)) {
          game.makeMove(col);
        }
      });

      // Rapid-fire operations under stress
      PerformanceAssertions.assertExecutionTime(() => {
        for (let i = 0; i < 100; i++) {
          ai.getBestMove(game, helpers);
          helpers.updateHints();
          game.getValidMoves();
          helpers.analyzeEvenOddThreats();
        }
      }, 10000, 'Stress test should complete within time limit');

    }, 'Stress test skipped in slow environment');
  });
}
