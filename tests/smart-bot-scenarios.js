/**
 * Smart Bot Test Scenarios
 *
 * Demonstrates how to use Connect4TestUtils to test Smart Bot behavior
 * in specific game situations.
 */

// Load test utilities and game classes
// In browser environment, these would be loaded via script tags
// For Node.js testing, you'd require them

/**
 * Test Smart Bot decision making in various scenarios
 */
class SmartBotTests {
  constructor() {
    this.testResults = [];
  }

  /**
     * Run all Smart Bot test scenarios
     */
  async runAllTests() {
    console.log('🤖 Smart Bot Test Scenarios');
    console.log('==========================');

    // Test winning opportunities
    await this.testWinningMoves();

    // Test blocking threats
    await this.testBlockingMoves();

    // Test trap avoidance
    await this.testTrapAvoidance();

    // Test complex scenarios
    await this.testComplexPositions();

    // Test opening moves
    await this.testOpeningStrategy();

    this.printSummary();
  }

  /**
     * Test if Smart Bot takes winning moves when available
     */
  async testWinningMoves() {
    console.log('\n🏆 Testing Winning Moves');
    console.log('------------------------');

    // Test scenario: Yellow can win in column 4 (0-indexed: column 3)
    const game = new Connect4Game();
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, null);

    // Setup: Yellow has 3 in a row horizontally, can win by playing column 4
    Connect4TestUtils.createTestPosition(
      game,
      'empty,empty,empty,empty,empty,empty,empty',  // Row 6 (top)
      'empty,empty,empty,empty,empty,empty,empty',  // Row 5
      'empty,empty,empty,empty,empty,empty,empty',  // Row 4
      'empty,empty,empty,empty,empty,empty,empty',  // Row 3
      'empty,empty,empty,empty,empty,empty,empty',  // Row 2
      'empty,yellow,yellow,yellow,empty,empty,empty', // Row 1 (bottom)
      2 // Yellow to move
    );

    // Actually, let's use the pattern format correctly
    Connect4TestUtils.createTestPosition(
      game,
      'empty,yellow,yellow,yellow,empty,empty,empty', // Columns 1-7
      2 // Yellow to move
    );

    console.log('Position:');
    console.log(Connect4TestUtils.toAscii(game));
    console.log('Yellow to move - should play column 5 or column 1 to win');

    const botMove = ai.getBestMove(game, helpers);
    const expectedMoves = [0, 4]; // Column 1 or 5 (0-indexed)

    this.recordTest(
      'Smart Bot takes winning move',
      expectedMoves.includes(botMove),
      `Expected column 1 or 5, got column ${botMove + 1}`
    );
  }

  /**
     * Test if Smart Bot blocks opponent threats
     */
  async testBlockingMoves() {
    console.log('\n🛡️ Testing Blocking Moves');
    console.log('-------------------------');

    const game = new Connect4Game();
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, null);

    // Setup: Red has 3 in a row, Yellow must block
    Connect4TestUtils.createTestPosition(
      game,
      'red,red,red,empty,empty,empty,empty', // Red threatens to win in column 4
      2 // Yellow to move
    );

    console.log('Position:');
    console.log(Connect4TestUtils.toAscii(game));
    console.log('Yellow to move - MUST block Red in column 4');

    const botMove = ai.getBestMove(game, helpers);

    this.recordTest(
      'Smart Bot blocks opponent threat',
      botMove === 3, // Column 4 (0-indexed: 3)
      `Expected column 4, got column ${botMove + 1}`
    );
  }

  /**
     * Test trap avoidance behavior
     */
  async testTrapAvoidance() {
    console.log('\n🪤 Testing Trap Avoidance');
    console.log('------------------------');

    const game = new Connect4Game();
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, null);

    // Setup a position where some moves create traps
    Connect4TestUtils.createTestPosition(
      game,
      'empty,red,yellow,red-yellow,yellow-red,red,empty',
      2 // Yellow to move
    );

    console.log('Position:');
    console.log(Connect4TestUtils.toAscii(game));
    console.log('Yellow to move - should avoid creating opponent opportunities');

    const botMove = ai.getBestMove(game, helpers);

    // Note: This test requires Level 2 analysis to determine safe moves
    // For now, we just verify the bot makes a valid move
    const validMoves = game.getValidMoves();

    this.recordTest(
      'Smart Bot avoids traps (makes valid move)',
      validMoves.includes(botMove),
      `Made valid move in column ${botMove + 1}`
    );
  }

  /**
     * Test behavior in complex positions
     */
  async testComplexPositions() {
    console.log('\n🧩 Testing Complex Positions');
    console.log('----------------------------');

    const game = new Connect4Game();
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, null);

    // Use predefined complex scenario
    Connect4TestUtils.loadScenario(game, 'complexThreats', 2);

    console.log('Position:');
    console.log(Connect4TestUtils.toAscii(game));
    console.log('Yellow to move in complex position');

    const botMove = ai.getBestMove(game, helpers);
    const validMoves = game.getValidMoves();

    this.recordTest(
      'Smart Bot handles complex positions',
      validMoves.includes(botMove),
      `Made move in column ${botMove + 1}`
    );
  }

  /**
     * Test opening strategy
     */
  async testOpeningStrategy() {
    console.log('\n🎯 Testing Opening Strategy');
    console.log('--------------------------');

    const game = new Connect4Game();
    const ai = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, null);

    // Empty board - bot should play center
    console.log('Empty board - Smart Bot should play center column (4)');

    const botMove = ai.getBestMove(game, helpers);

    this.recordTest(
      'Smart Bot plays center on empty board',
      botMove === 3, // Column 4 (0-indexed: 3)
      `Expected column 4, got column ${botMove + 1}`
    );
  }

  /**
     * Record test result
     */
  recordTest(testName, passed, details) {
    const result = {
      name: testName,
      passed: passed,
      details: details
    };

    this.testResults.push(result);

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  /**
     * Print test summary
     */
  printSummary() {
    console.log('\n📊 Test Summary');
    console.log('===============');

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed tests:');
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }
}

/**
 * Run tests if script is executed directly
 */
if (typeof window !== 'undefined') {
  // Browser environment - wait for DOM to load
  document.addEventListener('DOMContentLoaded', () => {
    const testRunner = new SmartBotTests();
    testRunner.runAllTests();
  });
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = SmartBotTests;
}

/**
 * Example usage in browser console:
 *
 * // Create test instance
 * const tests = new SmartBotTests();
 *
 * // Run all tests
 * tests.runAllTests();
 *
 * // Or test specific scenario:
 * const game = new Connect4Game();
 * const ai = new Connect4AI('smart-random');
 * const helpers = new Connect4Helpers(game, null);
 *
 * Connect4TestUtils.createTestPosition(game, "empty,yellow,yellow,yellow,empty,empty,empty", 2);
 * console.log(Connect4TestUtils.toAscii(game));
 *
 * const move = ai.getBestMove(game, helpers);
 * console.log(`Smart Bot plays column ${move + 1}`);
 */
