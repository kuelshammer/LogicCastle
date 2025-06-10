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
        try {
            testFn();
            this.results.push({
                suite,
                name,
                passed: true,
                error: null
            });
        } catch (error) {
            this.results.push({
                suite,
                name,
                passed: false,
                error: error.message
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
     * Assert that two arrays are equal
     * @param {Array} actual - Actual array
     * @param {Array} expected - Expected array
     * @param {string} message - Error message if assertion fails
     */
    assertArrayEqual(actual, expected, message = 'Arrays are not equal') {
        if (!Array.isArray(actual) || !Array.isArray(expected)) {
            throw new Error(message + ' - both values must be arrays');
        }
        
        if (actual.length !== expected.length) {
            throw new Error(message + ` - different lengths: ${actual.length} vs ${expected.length}`);
        }
        
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                throw new Error(message + ` - difference at index ${i}: ${actual[i]} vs ${expected[i]}`);
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
            throw new Error(message + `, got ${value}`);
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
            throw new Error(message + `, got ${value}`);
        }
    }
    
    /**
     * Assert that a value is truthy
     * @param {*} value - Value to test
     * @param {string} message - Error message if assertion fails
     */
    assertTruthy(value, message = 'Expected truthy value') {
        if (!value) {
            throw new Error(message + `, got ${value}`);
        }
    }
    
    /**
     * Assert that a value is falsy
     * @param {*} value - Value to test
     * @param {string} message - Error message if assertion fails
     */
    assertFalsy(value, message = 'Expected falsy value') {
        if (value) {
            throw new Error(message + `, got ${value}`);
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
            throw new Error(message + `, got ${value.constructor.name}`);
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