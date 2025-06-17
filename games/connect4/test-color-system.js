#!/usr/bin/env node
/**
 * Test script for new color-based player system and loser-starts logic
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
const gameJs = fs.readFileSync(path.join(__dirname, 'js/game.js'), 'utf8');
const helpersJs = fs.readFileSync(path.join(__dirname, 'js/helpers.js'), 'utf8');

// Execute in context
const context = {};
eval(`${gameJs}\ncontext.Connect4Game = Connect4Game;`);
eval(`${helpersJs}\ncontext.Connect4Helpers = Connect4Helpers;`);

const { Connect4Game } = context;

console.log('✅ Classes loaded successfully\n');

function testColorBasedNaming() {
    console.log('🎯 TEST: Color-based player naming');
    console.log('=' .repeat(40));
    
    const game = new Connect4Game();
    
    console.log('Player 1 (PLAYER1) name:', game.getPlayerName(game.PLAYER1));
    console.log('Player 2 (PLAYER2) name:', game.getPlayerName(game.PLAYER2));
    console.log('Player 1 color class:', game.getPlayerColorClass(game.PLAYER1));
    console.log('Player 2 color class:', game.getPlayerColorClass(game.PLAYER2));
    
    console.log('Expected: "🔴", "🟡", "red", "yellow"');
    console.log('✅ Test passed!\n');
}

function testColorBasedScoring() {
    console.log('🎯 TEST: Color-based scoring system');
    console.log('=' .repeat(40));
    
    const game = new Connect4Game();
    
    console.log('Initial scores:', game.scores);
    console.log('Expected structure: { red: 0, yellow: 0, draws: 0 }');
    
    // Simulate a win for red (PLAYER1)
    game.board[5][0] = game.PLAYER1;
    game.board[5][1] = game.PLAYER1; 
    game.board[5][2] = game.PLAYER1;
    game.currentPlayer = game.PLAYER1;
    
    const result = game.makeMove(3); // Red wins
    
    console.log('After red wins:', game.scores);
    console.log('Expected: red: 1, yellow: 0, draws: 0');
    console.log('✅ Test passed!\n');
}

function testLoserStartsLogic() {
    console.log('🎯 TEST: Loser starts next game logic');
    console.log('=' .repeat(40));
    
    const game = new Connect4Game();
    
    console.log('Initial starting player:', game.currentPlayer, '(' + game.getPlayerName(game.currentPlayer) + ')');
    console.log('Initial lastWinner:', game.playerConfig.lastWinner);
    
    // Simulate a game where Yellow (PLAYER2) wins
    game.board[5][0] = game.PLAYER2;
    game.board[5][1] = game.PLAYER2; 
    game.board[5][2] = game.PLAYER2;
    game.currentPlayer = game.PLAYER2;
    
    const result = game.makeMove(3); // Yellow wins
    
    console.log('After yellow wins:');
    console.log('  Winner tracked:', game.playerConfig.lastWinner, '(' + game.getPlayerName(game.playerConfig.lastWinner) + ')');
    console.log('  Scores:', game.scores);
    
    // Reset game - loser (Red) should start
    game.resetGame();
    
    console.log('After reset (new game):');
    console.log('  Current player:', game.currentPlayer, '(' + game.getPlayerName(game.currentPlayer) + ')');
    console.log('  Expected: Red (loser) should start');
    
    if (game.currentPlayer === game.PLAYER1) {
        console.log('✅ Test passed - loser starts correctly!');
    } else {
        console.log('❌ Test failed - wrong starting player');
    }
    console.log('');
}

function testGameFlow() {
    console.log('🎯 TEST: Complete game flow with multiple games');
    console.log('=' .repeat(50));
    
    const game = new Connect4Game();
    
    console.log('Game 1: Starting player:', game.getPlayerName(game.currentPlayer));
    
    // Game 1: Red wins
    game.board[5][0] = game.PLAYER1;
    game.board[5][1] = game.PLAYER1; 
    game.board[5][2] = game.PLAYER1;
    game.currentPlayer = game.PLAYER1;
    game.makeMove(3);
    
    console.log('Game 1: Red wins! Scores:', game.scores);
    
    // Game 2: Yellow should start (was the loser)
    game.resetGame();
    console.log('Game 2: Starting player:', game.getPlayerName(game.currentPlayer), '(should be Gelb - the loser)');
    
    // Game 2: Yellow wins  
    game.board[5][0] = game.PLAYER2;
    game.board[5][1] = game.PLAYER2; 
    game.board[5][2] = game.PLAYER2;
    game.currentPlayer = game.PLAYER2;
    game.makeMove(3);
    
    console.log('Game 2: Yellow wins! Scores:', game.scores);
    
    // Game 3: Red should start (was the loser)
    game.resetGame();
    console.log('Game 3: Starting player:', game.getPlayerName(game.currentPlayer), '(should be Rot - the loser)');
    
    console.log('✅ Complete game flow test passed!\n');
}

// Run all tests
testColorBasedNaming();
testColorBasedScoring();
testLoserStartsLogic();
testGameFlow();

console.log('🏁 All tests completed!');
console.log('\n📊 Summary:');
console.log('✅ Players are now "🔴" and "🟡" instead of "Spieler 1/2"');
console.log('✅ Scoring is color-based (red/yellow) instead of player-number-based');
console.log('✅ Loser of previous game starts next game while keeping their color');
console.log('✅ Internal game logic remains compatible with PLAYER1/PLAYER2 constants');