/**
 * Simple test framework for LogicCastle games
 */
class TestSuite {
  constructor() {
    this.results = [];
  }

  /**
     * Run a test case
     * @param {string} suite - Test suite name
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     */
  test(suite, name, testFn) {
    const startTime = performance.now();
    try {
      testFn();
      const duration = performance.now() - startTime;
      this.results.push({
        suite,
        name,
        passed: true,
        error: null,
        duration: Math.round(duration * 100) / 100 // Round to 2 decimal places
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        suite,
        name,
        passed: false,
        error: error.message,
        duration: Math.round(duration * 100) / 100
      });
    }
  }

  /**
     * Assert that a condition is true
     * @param {boolean} condition - Condition to test
     * @param {string} message - Error message if assertion fails
     */
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
     * Assert that two values are equal
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Error message if assertion fails
     */
  assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
    if (actual !== expected) {
      throw new Error(message);
    }
  }

  /**
     * Assert that two values are not equal
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value that should be different
     * @param {string} message - Error message if assertion fails
     */
  assertNotEqual(actual, expected, message = `Expected ${actual} to not equal ${expected}`) {
    if (actual === expected) {
      throw new Error(message);
    }
  }

  /**
     * Assert that two arrays are equal
     * @param {Array} actual - Actual array
     * @param {Array} expected - Expected array
     * @param {string} message - Error message if assertion fails
     */
  assertArrayEqual(actual, expected, message = 'Arrays are not equal') {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new Error(`${message  } - both values must be arrays`);
    }

    if (actual.length !== expected.length) {
      throw new Error(`${message  } - different lengths: ${actual.length} vs ${expected.length}`);
    }

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(`${message  } - difference at index ${i}: ${actual[i]} vs ${expected[i]}`);
      }
    }
  }

  /**
     * Assert that a value is null
     * @param {*} value - Value to test
     * @param {string} message - Error message if assertion fails
     */
  assertNull(value, message = 'Expected null') {
    if (value !== null) {
      throw new Error(`${message  }, got ${value}`);
    }
  }

  /**
     * Assert that a value is not null
     * @param {*} value - Value to test
     * @param {string} message - Error message if assertion fails
     */
  assertNotNull(value, message = 'Expected non-null value') {
    if (value === null) {
      throw new Error(message);
    }
  }

  /**
     * Assert that a value is undefined
     * @param {*} value - Value to test
     * @param {string} message - Error message if assertion fails
     */
  assertUndefined(value, message = 'Expected undefined') {
    if (value !== undefined) {
      throw new Error(`${message  }, got ${value}`);
    }
  }

  /**
     * Assert that a value is truthy
     * @param {*} value - Value to test
     * @param {string} message - Error message if assertion fails
     */
  assertTruthy(value, message = 'Expected truthy value') {
    if (!value) {
      throw new Error(`${message  }, got ${value}`);
    }
  }

  /**
     * Assert that a value is falsy
     * @param {*} value - Value to test
     * @param {string} message - Error message if assertion fails
     */
  assertFalsy(value, message = 'Expected falsy value') {
    if (value) {
      throw new Error(`${message  }, got ${value}`);
    }
  }

  /**
     * Assert that a function throws an error
     * @param {Function} fn - Function to test
     * @param {string} message - Error message if assertion fails
     */
  assertThrows(fn, message = 'Expected function to throw') {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }

    if (!threw) {
      throw new Error(message);
    }
  }

  /**
     * Assert that an object has a property
     * @param {Object} obj - Object to test
     * @param {string} property - Property name
     * @param {string} message - Error message if assertion fails
     */
  assertHasProperty(obj, property, message = `Expected object to have property '${property}'`) {
    if (!(property in obj)) {
      throw new Error(message);
    }
  }

  /**
     * Assert that a value is of a specific type
     * @param {*} value - Value to test
     * @param {string} type - Expected type
     * @param {string} message - Error message if assertion fails
     */
  assertInstanceOf(value, type, message = `Expected instance of ${type.name}`) {
    if (!(value instanceof type)) {
      throw new Error(`${message  }, got ${value.constructor.name}`);
    }
  }

  /**
     * Get all test results
     * @returns {Array} - Array of test results
     */
  getResults() {
    return this.results;
  }

  /**
     * Get test summary
     * @returns {Object} - Summary object with total, passed, failed counts
     */
  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    return { total, passed, failed };
  }

  /**
     * Get test results in CI-friendly JSON format
     * @returns {Object} - Structured test results for CI/CD systems
     */
  toJSON() {
    const summary = this.getSummary();
    const categories = {};

    // Group results by suite
    this.results.forEach(result => {
      const category = result.suite.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!categories[category]) {
        categories[category] = {
          name: result.suite,
          tests: [],
          summary: { total: 0, passed: 0, failed: 0 }
        };
      }

      categories[category].tests.push({
        name: result.name,
        passed: result.passed,
        error: result.error,
        duration: result.duration || 0
      });

      categories[category].summary.total++;
      if (result.passed) {
        categories[category].summary.passed++;
      } else {
        categories[category].summary.failed++;
      }
    });

    return {
      timestamp: new Date().toISOString(),
      summary: summary,
      categories: categories,
      environment: {
        ci: typeof window !== 'undefined' ? window.CI_ENVIRONMENT : false,
        timeout_multiplier: typeof window !== 'undefined' ? window.CI_TIMEOUT_MULTIPLIER : 1,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
      }
    };
  }

  /**
     * Generate JUnit XML format for CI systems
     * @returns {string} - JUnit XML string
     */
  toJUnitXML() {
    const summary = this.getSummary();
    const suites = {};

    // Group by suite
    this.results.forEach(result => {
      if (!suites[result.suite]) {
        suites[result.suite] = [];
      }
      suites[result.suite].push(result);
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites tests="${summary.total}" failures="${summary.failed}" time="0">\n`;

    Object.keys(suites).forEach(suiteName => {
      const tests = suites[suiteName];
      const failures = tests.filter(t => !t.passed).length;

      xml += `  <testsuite name="${this.escapeXML(suiteName)}" tests="${tests.length}" failures="${failures}" time="0">\n`;

      tests.forEach(test => {
        xml += `    <testcase name="${this.escapeXML(test.name)}" classname="${this.escapeXML(suiteName)}" time="${test.duration || 0}"`;

        if (test.passed) {
          xml += '/>\n';
        } else {
          xml += '>\n';
          xml += `      <failure message="${this.escapeXML(test.error || 'Test failed')}">${this.escapeXML(test.error || 'No details available')}</failure>\n`;
          xml += '    </testcase>\n';
        }
      });

      xml += '  </testsuite>\n';
    });

    xml += '</testsuites>\n';
    return xml;
  }

  /**
     * Escape XML special characters
     * @param {string} str - String to escape
     * @returns {string} - Escaped string
     */
  escapeXML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
     * Clear all test results
     */
  clear() {
    this.results = [];
  }
}

/**
 * Helper function to create a mock game state
 * @param {Array} board - 2D array representing the board
 * @param {number} currentPlayer - Current player
 * @param {boolean} gameOver - Whether game is over
 * @param {number} winner - Winner (if any)
 * @returns {Object} - Mock game state
 */
function createMockGameState(board, currentPlayer = 1, gameOver = false, winner = null) {
  return {
    board: board.map(row => [...row]),
    currentPlayer,
    gameOver,
    winner,
    winningCells: [],
    moveHistory: [],
    scores: { player1: 0, player2: 0, player3: 0, draws: 0 }
  };
}

/**
 * Helper function to create an empty board
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Array} - 2D array filled with zeros
 */
function createEmptyBoard(rows, cols) {
  const board = [];
  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      board[row][col] = 0;
    }
  }
  return board;
}

/**
 * CI/CD Environment Detection and Configuration
 */
class TestEnvironment {
  static isCI() {
    // Browser environment
    if (typeof window !== 'undefined' && window.CI_ENVIRONMENT) {
      return true;
    }

    // Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return !!(
        process.env.CI ||
                process.env.CONTINUOUS_INTEGRATION ||
                process.env.BUILD_NUMBER ||
                process.env.GITHUB_ACTIONS ||
                process.env.GITLAB_CI ||
                process.env.JENKINS_URL ||
                process.env.TRAVIS ||
                process.env.CIRCLECI
      );
    }

    return false;
  }

  static getTimeoutMultiplier() {
    if (this.isCI()) {
      // Browser environment
      if (typeof window !== 'undefined' && window.CI_TIMEOUT_MULTIPLIER) {
        return window.CI_TIMEOUT_MULTIPLIER;
      }

      // Node.js environment
      if (typeof process !== 'undefined' && process.env.CI_TIMEOUT_MULTIPLIER) {
        return parseFloat(process.env.CI_TIMEOUT_MULTIPLIER) || 3;
      }

      return 3; // Default CI multiplier
    }

    return 1; // Normal environment
  }

  static adjustTimeout(baseTimeout) {
    return Math.ceil(baseTimeout * this.getTimeoutMultiplier());
  }

  static isSlowEnvironment() {
    return this.isCI() || this.getTimeoutMultiplier() > 1;
  }
}

/**
 * Performance assertion helpers for CI/CD environments
 */
class PerformanceAssertions {
  /**
     * Assert that an operation completes within a time limit (CI-aware)
     * @param {Function} operation - Operation to time
     * @param {number} maxTime - Maximum time in milliseconds (base time)
     * @param {string} message - Error message if assertion fails
     */
  static assertExecutionTime(operation, maxTime, message = 'Operation took too long') {
    const adjustedMaxTime = TestEnvironment.adjustTimeout(maxTime);
    const startTime = performance.now();

    operation();

    const duration = performance.now() - startTime;
    const envInfo = TestEnvironment.isCI() ? ` (CI environment, adjusted from ${maxTime}ms to ${adjustedMaxTime}ms)` : '';

    if (duration > adjustedMaxTime) {
      throw new Error(`${message}: took ${duration.toFixed(2)}ms, max allowed ${adjustedMaxTime}ms${envInfo}`);
    }
  }

  /**
     * Assert that an async operation completes within a time limit (CI-aware)
     * @param {Function} asyncOperation - Async operation to time
     * @param {number} maxTime - Maximum time in milliseconds (base time)
     * @param {string} message - Error message if assertion fails
     */
  static async assertAsyncExecutionTime(asyncOperation, maxTime, message = 'Async operation took too long') {
    const adjustedMaxTime = TestEnvironment.adjustTimeout(maxTime);
    const startTime = performance.now();

    await asyncOperation();

    const duration = performance.now() - startTime;
    const envInfo = TestEnvironment.isCI() ? ` (CI environment, adjusted from ${maxTime}ms to ${adjustedMaxTime}ms)` : '';

    if (duration > adjustedMaxTime) {
      throw new Error(`${message}: took ${duration.toFixed(2)}ms, max allowed ${adjustedMaxTime}ms${envInfo}`);
    }
  }

  /**
     * Skip performance-critical tests in slow environments
     * @param {Function} testFn - Test function to run
     * @param {string} reason - Reason for skipping
     */
  static skipIfSlow(testFn, reason = 'Performance test skipped in slow environment') {
    if (TestEnvironment.isSlowEnvironment()) {
      console.log(`⏭️  ${reason}`);
      return;
    }

    testFn();
  }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TestSuite,
    createMockGameState,
    createEmptyBoard,
    TestEnvironment,
    PerformanceAssertions
  };
}
