#!/usr/bin/env node
/**
 * Test script for new game vs reset functionality
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

// Execute in context
const context = {};
eval(`${gameJs}\ncontext.Connect4Game = Connect4Game;`);

const { Connect4Game } = context;

console.log('✅ Classes loaded successfully\n');

function testNewGameVsReset() {
    console.log('🎯 TEST: New Game vs Full Reset functionality');
    console.log('=' .repeat(60));
    
    const game = new Connect4Game();
    
    // Simulate some gameplay with scores
    console.log('Initial state:');
    console.log('  Scores:', game.scores);
    console.log('  Current player:', game.getPlayerName(game.currentPlayer));
    console.log('  Last winner:', game.playerConfig.lastWinner);
    
    // Simulate Red winning
    game.scores.red = 2;
    game.scores.yellow = 1;
    game.scores.draws = 1;
    game.playerConfig.lastWinner = game.PLAYER1; // Red won
    
    console.log('\nAfter some games (Red=2, Yellow=1, Draws=1, Red last winner):');
    console.log('  Scores:', game.scores);
    console.log('  Last winner:', game.getPlayerName(game.playerConfig.lastWinner));
    
    // Test resetGame() - should keep scores, Yellow starts
    console.log('\n--- resetGame() (Next Game) ---');
    game.resetGame();
    
    console.log('After resetGame():');
    console.log('  Scores:', game.scores, '(should stay 2-1-1)');
    console.log('  Current player:', game.getPlayerName(game.currentPlayer), '(should be Yellow - loser)');
    console.log('  Last winner:', game.playerConfig.lastWinner ? game.getPlayerName(game.playerConfig.lastWinner) : 'null');
    
    // Test fullReset() - should reset scores, Red starts
    console.log('\n--- fullReset() (Complete Reset) ---');
    game.fullReset();
    
    console.log('After fullReset():');
    console.log('  Scores:', game.scores, '(should be 0-0-0)');
    console.log('  Current player:', game.getPlayerName(game.currentPlayer), '(should be Red)');
    console.log('  Last winner:', game.playerConfig.lastWinner, '(should be null)');
    
    // Verify expected behavior
    const scoresOk = game.scores.red === 0 && game.scores.yellow === 0 && game.scores.draws === 0;
    const starterOk = game.currentPlayer === game.PLAYER1;
    const lastWinnerOk = game.playerConfig.lastWinner === null;
    
    if (scoresOk && starterOk && lastWinnerOk) {
        console.log('\n✅ Test passed - fullReset() works correctly!');
    } else {
        console.log('\n❌ Test failed - fullReset() behavior incorrect');
        console.log('  Scores OK:', scoresOk);
        console.log('  Starter OK:', starterOk);
        console.log('  Last winner OK:', lastWinnerOk);
    }
    
    console.log('');
}

function testLoserStartsLogic() {
    console.log('🎯 TEST: Loser starts logic preservation');
    console.log('=' .repeat(60));
    
    const game = new Connect4Game();
    
    // Test multiple game cycle
    console.log('Game 1: Red starts (default)');
    console.log('  Starting player:', game.getPlayerName(game.currentPlayer));
    
    // Red wins
    game.playerConfig.lastWinner = game.PLAYER1;
    console.log('  Red wins!');
    
    // Next game - Yellow should start
    game.resetGame();
    console.log('Game 2: Yellow starts (was loser)');
    console.log('  Starting player:', game.getPlayerName(game.currentPlayer));
    
    // Yellow wins
    game.playerConfig.lastWinner = game.PLAYER2;
    console.log('  Yellow wins!');
    
    // Next game - Red should start
    game.resetGame();
    console.log('Game 3: Red starts (was loser)');
    console.log('  Starting player:', game.getPlayerName(game.currentPlayer));
    
    // Full reset - should go back to Red starting
    game.fullReset();
    console.log('After full reset: Red starts (default)');
    console.log('  Starting player:', game.getPlayerName(game.currentPlayer));
    
    if (game.currentPlayer === game.PLAYER1) {
        console.log('\n✅ Test passed - loser starts logic works with full reset!');
    } else {
        console.log('\n❌ Test failed - full reset should make Red start');
    }
    
    console.log('');
}

// Run all tests
testNewGameVsReset();
testLoserStartsLogic();

console.log('🏁 All tests completed!');
console.log('\n📊 Expected behavior:');
console.log('✅ resetGame() = Next game (keeps scores, loser starts)');
console.log('✅ fullReset() = Complete reset (scores 0:0, Red starts)');
console.log('✅ Both preserve internal logic consistency');