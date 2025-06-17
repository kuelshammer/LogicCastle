#!/usr/bin/env node
/**
 * Test script for Bot first move logic
 */

const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.document = {
    getElementById: () => null,
    createElement: () => ({ 
        style: {}, 
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        appendChild: () => {},
        textContent: ''
    }),
    addEventListener: () => {}
};
global.window = {};

console.log('🧪 Loading Connect4 classes...');

// Load game classes
const gameJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/game.js'), 'utf8');
const helpersJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/helpers.js'), 'utf8');
const aiJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/ai.js'), 'utf8');

// Execute in context
const context = {};
eval(`${gameJs}\ncontext.Connect4Game = Connect4Game;`);
eval(`${helpersJs}\ncontext.Connect4Helpers = Connect4Helpers;`);
eval(`${aiJs}\ncontext.Connect4AI = Connect4AI;`);

const { Connect4Game, Connect4Helpers, Connect4AI } = context;

console.log('✅ Classes loaded successfully\n');

// Mock UI for helpers
class MockUI {
    constructor() {
        this.playerHelpEnabled = {
            red: { level0: true, level1: true, level2: true },
            yellow: { level0: true, level1: true, level2: true }
        };
    }
    
    getCurrentPlayerHelpEnabled() {
        return true; // Bot always has help enabled
    }
}

function testBotFirstMove() {
    console.log('🎯 TEST: Bot makes first move in center');
    console.log('=' .repeat(50));
    
    const game = new Connect4Game();
    const mockUI = new MockUI();
    mockUI.game = game;
    const helpers = new Connect4Helpers(game, mockUI);
    const ai = new Connect4AI('smart-random');
    
    // Simulate scenario where bot starts first (Yellow as PLAYER2)
    game.currentPlayer = game.PLAYER2;
    
    console.log('Move history length:', game.moveHistory.length);
    console.log('Current player:', game.currentPlayer === game.PLAYER1 ? '🔴' : '🟡');
    console.log('Board is empty:', game.moveHistory.length === 0);
    
    // Get AI move
    const aiMove = ai.getBestMove(game, helpers);
    console.log('🤖 Smart Bot chose column:', aiMove, '(expected: 3 for center)');
    
    if (aiMove === 3) {
        console.log('✅ Test passed - Bot plays center on first move!');
    } else {
        console.log('❌ Test failed - Bot should play center (3) but chose:', aiMove);
    }
    
    console.log('');
}

function testBotSecondMove() {
    console.log('🎯 TEST: Bot second move behavior');
    console.log('=' .repeat(50));
    
    const game = new Connect4Game();
    const mockUI = new MockUI();
    mockUI.game = game;
    const helpers = new Connect4Helpers(game, mockUI);
    const ai = new Connect4AI('smart-random');
    
    // Simulate a game where Red played first in center
    game.makeMove(3); // Red plays center
    
    console.log('Move history length:', game.moveHistory.length);
    console.log('Current player:', game.currentPlayer === game.PLAYER1 ? '🔴' : '🟡');
    console.log('Board has 1 move, should not trigger center logic');
    
    // Get AI move
    const aiMove = ai.getBestMove(game, helpers);
    console.log('🤖 Smart Bot chose column:', aiMove, '(should NOT be forced to center)');
    
    if (aiMove !== null && aiMove >= 0 && aiMove <= 6) {
        console.log('✅ Test passed - Bot makes valid move when board not empty!');
    } else {
        console.log('❌ Test failed - Bot should make valid move, chose:', aiMove);
    }
    
    console.log('');
}

function testLoserStartsScenario() {
    console.log('🎯 TEST: Bot starts after winning previous game');
    console.log('=' .repeat(50));
    
    const game = new Connect4Game();
    const mockUI = new MockUI();
    mockUI.game = game;
    const helpers = new Connect4Helpers(game, mockUI);
    const ai = new Connect4AI('smart-random');
    
    // Simulate Red winning, so Yellow (bot) should start next game
    game.playerConfig.lastWinner = game.PLAYER1; // Red won
    game.resetGame(); // This should make Yellow start
    
    console.log('After reset with Red as last winner:');
    console.log('Current player:', game.currentPlayer === game.PLAYER1 ? '🔴' : '🟡');
    console.log('Move history length:', game.moveHistory.length);
    console.log('Expected: Yellow (🟡) should start and play center');
    
    if (game.currentPlayer === game.PLAYER2) {
        // Bot should start and play center
        const aiMove = ai.getBestMove(game, helpers);
        console.log('🤖 Smart Bot chose column:', aiMove, '(expected: 3 for center)');
        
        if (aiMove === 3) {
            console.log('✅ Test passed - Bot starts and plays center after being loser!');
        } else {
            console.log('❌ Test failed - Bot should play center when starting, chose:', aiMove);
        }
    } else {
        console.log('❌ Test setup failed - Yellow should start after Red wins');
    }
    
    console.log('');
}

// Run all tests
testBotFirstMove();
testBotSecondMove();
testLoserStartsScenario();

console.log('🏁 All tests completed!');
console.log('\n📊 Expected behavior:');
console.log('✅ Bot should ALWAYS play center (column 3) when board is empty');
console.log('✅ Bot should use normal AI logic when board has moves');
console.log('✅ Bot should start correctly when being the loser of previous game');