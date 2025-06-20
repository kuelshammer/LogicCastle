// Debug script to test threat position calculation
// Run with: node debug-threat-position.js

// Import game logic
const fs = require('fs');
const path = require('path');

// Mock DOM
global.document = {
    getElementById: () => null,
    createElement: () => ({ style: {}, classList: { add: () => {} } })
};

// Load game classes
const gameJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/game.js'), 'utf8');
const helpersJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/helpers.js'), 'utf8');

// Execute in context
const context = {};
eval(`${gameJs}\ncontext.Connect4Game = Connect4Game;`);
eval(`${helpersJs}\ncontext.Connect4Helpers = Connect4Helpers;`);

const { Connect4Game, Connect4Helpers } = context;

// Test the threat position logic
const game = new Connect4Game();
const helpers = new Connect4Helpers(game);

// Create test situation: Red has 3 in a row (0,1,2) and can win at 3
game.board[5][0] = game.PLAYER1; // Red
game.board[5][1] = game.PLAYER1; // Red  
game.board[5][2] = game.PLAYER1; // Red
// Column 3 is empty - Red can win here

game.currentPlayer = game.PLAYER2; // Yellow's turn (needs to block)

console.log('=== BOARD STATE ===');
console.log('Bottom row:', game.board[5]);
console.log('Current player:', game.currentPlayer, '(2 = Yellow)');

console.log('\n=== THREAT ANALYSIS ===');
helpers.setEnabled(true, 1);

console.log('Forced move mode:', helpers.forcedMoveMode);
console.log('Required moves:', helpers.requiredMoves);

if (helpers.currentHints.threats.length > 0) {
    const threat = helpers.currentHints.threats[0];
    console.log('\nThreat details:');
    console.log('- Column:', threat.column, '(0-based)');
    console.log('- Row:', threat.row, '(0-based, 0=top, 5=bottom)');
    console.log('- Type:', threat.type);
    
    console.log('\n=== POSITION CALCULATION ===');
    const cellSize = 60;
    const gap = 8; 
    const padding = 20;
    const left = padding + threat.column * (cellSize + gap);
    const top = padding + threat.row * (cellSize + gap);
    console.log('Visual position: left=' + left + 'px, top=' + top + 'px');
    
    console.log('\n=== EXPECTATION ===');
    console.log('Expected: Column 3, Row 5 (bottom-right of the three red pieces)');
    console.log('Expected position: left=' + (padding + 3 * (cellSize + gap)) + 'px, top=' + (padding + 5 * (cellSize + gap)) + 'px');
}

console.log('\n=== ROW VERIFICATION ===');
// Verify where a piece would land in column 3
let landingRow = game.ROWS - 1;
while (landingRow >= 0 && game.board[landingRow][3] !== game.EMPTY) {
    landingRow--;
}
console.log('Piece would land in column 3 at row:', landingRow);