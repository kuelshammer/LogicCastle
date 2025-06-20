#!/usr/bin/env node
/**
 * Pure JavaScript Test Runner for Connect4 Game Logic
 * Run with: node test-connect4-pure.js
 */

// Simple test framework for Node.js
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    test(description, testFunc) {
        this.tests.push({ description, testFunc });
    }
    
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message}: Expected ${expected}, got ${actual}`);
        }
    }
    
    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message}: Expected true, got ${condition}`);
        }
    }
    
    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message}: Expected false, got ${condition}`);
        }
    }
    
    assertArrayEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    }
    
    run() {
        console.log('🎮 Connect4 Pure JS Test Runner\n');
        
        for (const test of this.tests) {
            try {
                test.testFunc();
                console.log(`✅ ${test.description}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.description}`);
                console.log(`   Error: ${error.message}\n`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        }
        
        process.exit(this.failed > 0 ? 1 : 0);
    }
}

// Import and adapt the game classes for Node.js
const fs = require('fs');
const path = require('path');

// Create a minimal DOM-like environment for the classes
global.document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } })
};

// Read the game files and execute them in a safe context
function loadGameClasses() {
    const gameJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/game.js'), 'utf8');
    const helpersJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/helpers.js'), 'utf8');
    
    // Create a context to execute the browser code
    const context = {
        Connect4Game: null,
        Connect4Helpers: null
    };
    
    // Execute game.js
    const gameCode = `
        ${gameJs}
        context.Connect4Game = Connect4Game;
    `;
    eval(gameCode);
    
    // Execute helpers.js
    const helpersCode = `
        ${helpersJs}
        context.Connect4Helpers = Connect4Helpers;
    `;
    eval(helpersCode);
    
    return context;
}

const { Connect4Game, Connect4Helpers } = loadGameClasses();

const runner = new TestRunner();

// Basic Game Logic Tests
runner.test('Game initialization', () => {
    const game = new Connect4Game();
    runner.assertEqual(game.ROWS, 6);
    runner.assertEqual(game.COLS, 7);
    runner.assertEqual(game.currentPlayer, game.PLAYER1);
    runner.assertFalse(game.gameOver);
});

runner.test('Valid move', () => {
    const game = new Connect4Game();
    const result = game.makeMove(3);
    runner.assertTrue(result.success);
    runner.assertEqual(result.row, 5);
    runner.assertEqual(result.col, 3);
    runner.assertEqual(game.currentPlayer, game.PLAYER2);
});

runner.test('Invalid move - out of bounds', () => {
    const game = new Connect4Game();
    const result = game.makeMove(-1);
    runner.assertFalse(result.success);
    runner.assertEqual(result.reason, 'Invalid column');
});

runner.test('Column full detection', () => {
    const game = new Connect4Game();
    // Fill column 0
    for (let i = 0; i < 6; i++) {
        game.makeMove(0);
    }
    const result = game.makeMove(0);
    runner.assertFalse(result.success);
    runner.assertEqual(result.reason, 'Column is full');
});

// Helpers System Tests
runner.test('Helpers initialization', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    runner.assertFalse(helpers.enabled);
    runner.assertEqual(helpers.helpLevel, 0);
    runner.assertFalse(helpers.forcedMoveMode);
});

runner.test('Helpers enable/disable', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    
    helpers.setEnabled(true, 1);
    runner.assertTrue(helpers.enabled);
    runner.assertEqual(helpers.helpLevel, 1);
    
    helpers.setEnabled(false, 0);
    runner.assertFalse(helpers.enabled);
    runner.assertEqual(helpers.helpLevel, 0);
});

// Critical Test: Horizontal threat detection
runner.test('Horizontal threat detection - 3 in a row', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    
    // Create horizontal threat: Red has 3 in a row (0,1,2) and can win at 3
    game.board[5][0] = game.PLAYER1; // Red
    game.board[5][1] = game.PLAYER1; // Red  
    game.board[5][2] = game.PLAYER1; // Red
    // Column 3 is empty - Red can win here
    
    game.currentPlayer = game.PLAYER2; // Yellow's turn - must block
    
    helpers.setEnabled(true, 1);
    
    runner.assertTrue(helpers.forcedMoveMode, 'Should be in forced move mode');
    runner.assertArrayEqual(helpers.requiredMoves, [3], 'Should require blocking column 3');
    runner.assertEqual(helpers.currentHints.threats.length, 1, 'Should have one threat');
    runner.assertEqual(helpers.currentHints.threats[0].column, 3, 'Threat should be in column 3');
});

// Test vertical threat
runner.test('Vertical threat detection - 3 in a column', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    
    // Create vertical threat: Red has 3 in column 3 (rows 5,4,3) and can win at row 2
    game.board[5][3] = game.PLAYER1; // Red bottom
    game.board[4][3] = game.PLAYER1; // Red middle
    game.board[3][3] = game.PLAYER1; // Red upper
    // Row 2, column 3 is empty - Red can win here
    
    game.currentPlayer = game.PLAYER2; // Yellow's turn
    
    helpers.setEnabled(true, 1);
    
    runner.assertTrue(helpers.forcedMoveMode, 'Should be in forced move mode for vertical threat');
    runner.assertArrayEqual(helpers.requiredMoves, [3], 'Should require blocking column 3');
});

// Test diagonal threat
runner.test('Diagonal threat detection', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    
    // Create diagonal threat (ascending): Red pieces at (5,0), (4,1), (3,2)
    // Can win at (2,3)
    game.board[5][0] = game.PLAYER1; // Red
    game.board[4][1] = game.PLAYER1; // Red
    game.board[3][2] = game.PLAYER1; // Red
    
    // Add supporting pieces so (2,3) is reachable
    game.board[5][3] = game.PLAYER2; // Yellow support
    game.board[4][3] = game.PLAYER2; // Yellow support  
    game.board[3][3] = game.PLAYER2; // Yellow support
    // Now (2,3) is reachable for Red
    
    game.currentPlayer = game.PLAYER2; // Yellow's turn
    
    helpers.setEnabled(true, 1);
    
    runner.assertTrue(helpers.forcedMoveMode, 'Should be in forced move mode for diagonal threat');
    runner.assertArrayEqual(helpers.requiredMoves, [3], 'Should require blocking column 3');
});

// Test no false positives
runner.test('No false positives - no threat', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    
    // Random pieces, no immediate threat
    game.board[5][0] = game.PLAYER1;
    game.board[5][2] = game.PLAYER1;
    game.board[5][4] = game.PLAYER2;
    game.board[5][6] = game.PLAYER2;
    
    game.currentPlayer = game.PLAYER2;
    
    helpers.setEnabled(true, 1);
    
    runner.assertFalse(helpers.forcedMoveMode, 'Should not be in forced move mode');
    runner.assertArrayEqual(helpers.requiredMoves, [], 'Should have no required moves');
    runner.assertEqual(helpers.currentHints.threats.length, 0, 'Should have no threats');
});

// Test multiple threats
runner.test('Multiple threats detection', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    
    // Create two horizontal threats for Red
    game.board[5][0] = game.PLAYER1; // Red
    game.board[5][1] = game.PLAYER1; // Red
    game.board[5][2] = game.PLAYER1; // Red
    // Can win at column 3
    
    game.board[4][4] = game.PLAYER1; // Red
    game.board[4][5] = game.PLAYER1; // Red
    game.board[4][6] = game.PLAYER1; // Red
    // Can also win at column 3 (different row)
    
    // Support pieces
    game.board[5][4] = game.PLAYER2;
    game.board[5][5] = game.PLAYER2;
    game.board[5][6] = game.PLAYER2;
    
    game.currentPlayer = game.PLAYER2;
    
    helpers.setEnabled(true, 1);
    
    runner.assertTrue(helpers.forcedMoveMode, 'Should be in forced move mode');
    // Should detect at least one threat requiring column 3
    runner.assertTrue(helpers.requiredMoves.includes(3), 'Should include column 3 in required moves');
});

// Performance test
runner.test('Performance test - large number of threat checks', () => {
    const game = new Connect4Game();
    const helpers = new Connect4Helpers(game);
    
    const startTime = Date.now();
    
    // Run helpers check 1000 times
    for (let i = 0; i < 1000; i++) {
        helpers.setEnabled(true, 1);
        helpers.setEnabled(false, 0);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Performance: 1000 checks took ${duration}ms`);
    runner.assertTrue(duration < 1000, `Performance test should complete in under 1 second, took ${duration}ms`);
});

// Run all tests
console.log('Starting Pure JS Connect4 Tests...\n');
runner.run();