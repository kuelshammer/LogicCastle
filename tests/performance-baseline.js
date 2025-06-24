/**
 * PERFORMANCE BASELINE - Regression Detection System
 *
 * This test establishes performance benchmarks that must be maintained during
 * refactoring. Any significant performance degradation will fail the test.
 *
 * CRITICAL: Run before refactoring to establish baseline, then after each phase.
 */

// Performance baseline thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  // AI Decision Times (per move)
  aiDecision: {
    'smart-random': 50,      // Should be very fast
    'offensiv-gemischt': 100,
    'defensiv-gemischt': 100,
    'enhanced-smart': 200,   // More complex analysis
    'defensive': 150,
    'monte-carlo': 1500      // Simulation-based, allows more time
  },

  // Helper System Response Times
  helperSystem: {
    threatDetection: 100,    // Win/block detection
    safetyAnalysis: 150,     // Trap detection
    hintGeneration: 200,     // Full hint calculation
    levelUpdate: 50          // Level switching
  },

  // Game Logic Performance
  gameLogic: {
    moveValidation: 10,      // Single move validation
    winDetection: 50,        // Win checking after move
    stateSimulation: 30,     // Board state simulation
    moveHistory: 5           // Move recording
  },

  // UI Performance
  ui: {
    boardRender: 100,        // Full board re-render
    pieceAnimation: 500,     // Single piece drop animation
    modalOpen: 200,          // Modal opening/closing
    stateUpdate: 50          // UI state synchronization
  },

  // Memory Usage (estimated, in MB)
  memory: {
    gameInstance: 5,         // Single game instance
    aiInstance: 10,          // AI with caching
    helperInstance: 8,       // Helper system
    totalBaseline: 50        // Total for full application
  }
};

// Performance tolerance (percentage increase allowed)
const PERFORMANCE_TOLERANCE = 20; // 20% performance degradation allowed

/**
 * Run complete performance baseline test
 */
function runPerformanceBaseline() {
  console.log('⚡ PERFORMANCE BASELINE TEST');
  console.log('============================');
  console.log('Measuring performance across all critical components...\n');

  const results = {
    aiPerformance: measureAIPerformance(),
    helperPerformance: measureHelperPerformance(),
    gameLogicPerformance: measureGameLogicPerformance(),
    uiPerformance: measureUIPerformance(),
    memoryUsage: measureMemoryUsage(),
    timestamp: new Date().toISOString()
  };

  const validation = validatePerformanceBaseline(results);
  generatePerformanceReport(results, validation);

  return {
    results: results,
    validation: validation,
    success: validation.overallPass
  };
}

/**
 * Measure AI decision performance across all bot types
 */
function measureAIPerformance() {
  console.log('🤖 Measuring AI Decision Performance...');

  const results = {};
  const botTypes = Object.keys(PERFORMANCE_THRESHOLDS.aiDecision);

  botTypes.forEach(botType => {
    const game = createTestGame();
    const ai = new Connect4AI(botType);

    const measurements = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      try {
        const move = ai.getBestMove(game);
        const endTime = performance.now();

        if (move !== null) {
          measurements.push(endTime - startTime);
        }
      } catch (error) {
        console.warn(`AI ${botType} failed on iteration ${i}:`, error.message);
      }
    }

    if (measurements.length > 0) {
      results[botType] = {
        average: measurements.reduce((a, b) => a + b) / measurements.length,
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        samples: measurements.length
      };

      console.log(`   ${botType}: ${results[botType].average.toFixed(1)}ms avg (${results[botType].min.toFixed(1)}-${results[botType].max.toFixed(1)}ms)`);
    } else {
      results[botType] = { error: 'No successful measurements' };
      console.log(`   ${botType}: ERROR - No successful measurements`);
    }
  });

  return results;
}

/**
 * Measure helper system performance
 */
function measureHelperPerformance() {
  console.log('\\n💡 Measuring Helper System Performance...');

  const game = createTestGame();
  const helpers = new Connect4Helpers(game);
  const results = {};

  // Threat Detection Performance
  const threatStart = performance.now();
  helpers.setEnabled(true, 0);
  helpers.updateHints();
  const threatTime = performance.now() - threatStart;

  results.threatDetection = threatTime;
  console.log(`   Threat Detection: ${threatTime.toFixed(1)}ms`);

  // Safety Analysis Performance
  const safetyStart = performance.now();
  helpers.setEnabled(true, 2);
  helpers.updateHints();
  const safetyTime = performance.now() - safetyStart;

  results.safetyAnalysis = safetyTime;
  console.log(`   Safety Analysis: ${safetyTime.toFixed(1)}ms`);

  // Full Hint Generation Performance
  const hintStart = performance.now();
  helpers.setEnabled(true, 2);
  helpers.updateHints();
  const hintTime = performance.now() - hintStart;

  results.hintGeneration = hintTime;
  console.log(`   Hint Generation: ${hintTime.toFixed(1)}ms`);

  // Level Update Performance
  const levelStart = performance.now();
  for (let level = 0; level <= 2; level++) {
    helpers.setEnabled(true, level);
  }
  const levelTime = performance.now() - levelStart;

  results.levelUpdate = levelTime / 3; // Average per level change
  console.log(`   Level Update: ${results.levelUpdate.toFixed(1)}ms avg`);

  return results;
}

/**
 * Measure core game logic performance
 */
function measureGameLogicPerformance() {
  console.log('\\n🎯 Measuring Game Logic Performance...');

  const results = {};

  // Move Validation Performance
  const game = createTestGame();
  const validationTimes = [];

  for (let col = 0; col < 7; col++) {
    const start = performance.now();
    const isValid = game.getValidMoves().includes(col);
    validationTimes.push(performance.now() - start);
  }

  results.moveValidation = validationTimes.reduce((a, b) => a + b) / validationTimes.length;
  console.log(`   Move Validation: ${results.moveValidation.toFixed(2)}ms avg`);

  // Win Detection Performance
  const winTimes = [];
  for (let i = 0; i < 10; i++) {
    const testGame = createTestGame();
    testGame.makeMove(3); // Make a move

    const start = performance.now();
    const hasWon = testGame.checkWin(5, 3); // Check win at position
    winTimes.push(performance.now() - start);
  }

  results.winDetection = winTimes.reduce((a, b) => a + b) / winTimes.length;
  console.log(`   Win Detection: ${results.winDetection.toFixed(2)}ms avg`);

  // State Simulation Performance
  const simTimes = [];
  for (let i = 0; i < 10; i++) {
    const testGame = createTestGame();

    const start = performance.now();
    const result = testGame.simulateMove(3);
    simTimes.push(performance.now() - start);
  }

  results.stateSimulation = simTimes.reduce((a, b) => a + b) / simTimes.length;
  console.log(`   State Simulation: ${results.stateSimulation.toFixed(2)}ms avg`);

  // Move History Performance
  const historyStart = performance.now();
  for (let i = 0; i < 100; i++) {
    game.moveHistory.push({ row: 5, col: i % 7, player: (i % 2) + 1 });
  }
  const historyTime = (performance.now() - historyStart) / 100;

  results.moveHistory = historyTime;
  console.log(`   Move History: ${historyTime.toFixed(3)}ms per record`);

  return results;
}

/**
 * Measure UI performance (if in browser environment)
 */
function measureUIPerformance() {
  console.log('\\n🎨 Measuring UI Performance...');

  const results = {};

  if (typeof window === 'undefined') {
    console.log('   Skipping UI tests (not in browser environment)');
    return { skipped: 'Not in browser environment' };
  }

  try {
    const game = createTestGame();
    const ui = new Connect4UI(game);

    // Board Render Performance
    const renderStart = performance.now();
    ui.renderBoard();
    results.boardRender = performance.now() - renderStart;
    console.log(`   Board Render: ${results.boardRender.toFixed(1)}ms`);

    // Piece Animation Performance (simulated)
    const animStart = performance.now();
    ui.animatePieceDrop(3, 5);
    results.pieceAnimation = performance.now() - animStart;
    console.log(`   Piece Animation: ${results.pieceAnimation.toFixed(1)}ms`);

    // Modal Performance
    const modalStart = performance.now();
    ui.showHelpModal();
    ui.hideHelpModal();
    results.modalOpen = performance.now() - modalStart;
    console.log(`   Modal Operations: ${results.modalOpen.toFixed(1)}ms`);

    // State Update Performance
    const updateStart = performance.now();
    ui.updateFromGameState();
    results.stateUpdate = performance.now() - updateStart;
    console.log(`   State Update: ${results.stateUpdate.toFixed(1)}ms`);

  } catch (error) {
    console.log(`   UI Performance test failed: ${error.message}`);
    results.error = error.message;
  }

  return results;
}

/**
 * Measure memory usage (estimated)
 */
function measureMemoryUsage() {
  console.log('\\n💾 Measuring Memory Usage...');

  const results = {};

  // Measure memory before and after object creation
  const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

  // Create test instances
  const game = createTestGame();
  const ai = new Connect4AI('monte-carlo');
  const helpers = new Connect4Helpers(game);

  const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // Convert to MB

  results.gameInstance = 2; // Estimated
  results.aiInstance = 5;   // Estimated
  results.helperInstance = 3; // Estimated
  results.totalMeasured = memoryIncrease;

  console.log(`   Game Instance: ~${results.gameInstance}MB (estimated)`);
  console.log(`   AI Instance: ~${results.aiInstance}MB (estimated)`);
  console.log(`   Helper Instance: ~${results.helperInstance}MB (estimated)`);
  console.log(`   Total Measured: ${results.totalMeasured.toFixed(1)}MB`);

  return results;
}

/**
 * Validate performance against baseline thresholds
 */
function validatePerformanceBaseline(results) {
  console.log('\\n📊 VALIDATING PERFORMANCE BASELINE');
  console.log('==================================');

  const validation = {
    aiValidation: validateAIPerformance(results.aiPerformance),
    helperValidation: validateHelperPerformance(results.helperPerformance),
    gameLogicValidation: validateGameLogicPerformance(results.gameLogicPerformance),
    uiValidation: validateUIPerformance(results.uiPerformance),
    overallPass: true,
    failures: []
  };

  // Check if any validation failed
  Object.values(validation).forEach(result => {
    if (result && result.failures && result.failures.length > 0) {
      validation.overallPass = false;
      validation.failures.push(...result.failures);
    }
  });

  return validation;
}

/**
 * Helper function to validate specific performance category
 */
function validateCategory(results, thresholds, categoryName) {
  const validation = { passes: 0, failures: [], total: 0 };

  Object.keys(thresholds).forEach(key => {
    validation.total++;

    if (results[key] && !results[key].error) {
      const measured = results[key].average || results[key];
      const threshold = thresholds[key];
      const allowedMax = threshold * (1 + PERFORMANCE_TOLERANCE / 100);

      if (measured <= allowedMax) {
        validation.passes++;
        console.log(`✅ ${categoryName} ${key}: ${measured.toFixed(1)}ms (≤ ${allowedMax.toFixed(1)}ms)`);
      } else {
        validation.failures.push({
          test: `${categoryName} ${key}`,
          measured: measured,
          threshold: threshold,
          allowedMax: allowedMax
        });
        console.log(`❌ ${categoryName} ${key}: ${measured.toFixed(1)}ms (> ${allowedMax.toFixed(1)}ms)`);
      }
    } else {
      validation.failures.push({
        test: `${categoryName} ${key}`,
        error: results[key]?.error || 'No data'
      });
      console.log(`❌ ${categoryName} ${key}: ERROR - ${results[key]?.error || 'No data'}`);
    }
  });

  return validation;
}

function validateAIPerformance(results) {
  return validateCategory(results, PERFORMANCE_THRESHOLDS.aiDecision, 'AI');
}

function validateHelperPerformance(results) {
  return validateCategory(results, PERFORMANCE_THRESHOLDS.helperSystem, 'Helper');
}

function validateGameLogicPerformance(results) {
  return validateCategory(results, PERFORMANCE_THRESHOLDS.gameLogic, 'GameLogic');
}

function validateUIPerformance(results) {
  if (results.skipped) {
    console.log('⏭️ UI Performance validation skipped');
    return { passes: 0, failures: [], total: 0, skipped: true };
  }
  return validateCategory(results, PERFORMANCE_THRESHOLDS.ui, 'UI');
}

/**
 * Generate comprehensive performance report
 */
function generatePerformanceReport(results, validation) {
  console.log('\\n📋 PERFORMANCE BASELINE REPORT');
  console.log('===============================');

  const totalTests = validation.aiValidation.total + validation.helperValidation.total +
                      validation.gameLogicValidation.total + (validation.uiValidation.total || 0);
  const totalPasses = validation.aiValidation.passes + validation.helperValidation.passes +
                       validation.gameLogicValidation.passes + (validation.uiValidation.passes || 0);

  console.log(`Total performance tests: ${totalTests}`);
  console.log(`Passed: ${totalPasses}`);
  console.log(`Failed: ${validation.failures.length}`);
  console.log(`Success rate: ${((totalPasses / totalTests) * 100).toFixed(1)}%`);

  if (validation.failures.length > 0) {
    console.log('\\n❌ PERFORMANCE REGRESSIONS DETECTED:');
    validation.failures.forEach(failure => {
      if (failure.error) {
        console.log(`   ${failure.test}: ${failure.error}`);
      } else {
        const regression = ((failure.measured - failure.threshold) / failure.threshold * 100).toFixed(1);
        console.log(`   ${failure.test}: ${failure.measured.toFixed(1)}ms (${regression}% slower than baseline)`);
      }
    });

    console.log('\\n🚨 PERFORMANCE REGRESSION DETECTED!');
    console.log('Investigate performance issues before proceeding with refactoring.');
  } else {
    console.log('\\n✅ ALL PERFORMANCE TESTS PASSED!');
    console.log('Current performance meets or exceeds baseline requirements.');
    console.log('Safe to proceed with refactoring.');
  }
}

/**
 * Create test game instance for performance testing
 */
function createTestGame() {
  const game = new Connect4Game();

  // Add some moves to create a realistic game state
  const testMoves = [3, 3, 2, 4, 2, 4, 1];
  testMoves.forEach(move => {
    if (game.getValidMoves().includes(move)) {
      game.makeMove(move);
    }
  });

  return game;
}

// Export for test runner integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runPerformanceBaseline,
    PERFORMANCE_THRESHOLDS,
    PERFORMANCE_TOLERANCE,
    validatePerformanceBaseline,
    generatePerformanceReport
  };
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  console.log('Performance Baseline Test loaded and ready to run via runPerformanceBaseline()');
} else if (require.main === module) {
  runPerformanceBaseline();
}
