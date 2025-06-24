// Direct test check without VM
const fs = require('fs');
const path = require('path');

// Read and eval the files directly
const gameFilePath = path.join(__dirname, 'games/connect4/js/game.js');
const gameCode = fs.readFileSync(gameFilePath, 'utf8');

// Create a global eval context
global.performance = { now: () => Date.now() };

// Eval the game code
eval(gameCode);

// Test 1: Helper methods
console.log('=== Test 1: Helper Methods ===');
const game = new Connect4Game();
console.log('getPlayerName exists:', typeof game.getPlayerName);

if (typeof game.getPlayerName === 'function') {
  const name1 = game.getPlayerName(game.PLAYER1);
  const name2 = game.getPlayerName(game.PLAYER2);
  console.log('Player 1 name:', name1);
  console.log('Player 2 name:', name2);
  console.log('Player 1 correct:', name1 === 'Spieler 1 (Rot)');
  console.log('Player 2 correct:', name2 === 'Spieler 2 (Gelb)');
}

if (typeof game.getPlayerColorClass === 'function') {
  const color1 = game.getPlayerColorClass(game.PLAYER1);
  const color2 = game.getPlayerColorClass(game.PLAYER2);
  console.log('Player 1 color:', color1);
  console.log('Player 2 color:', color2);
  console.log('Color 1 correct:', color1 === 'red');
  console.log('Color 2 correct:', color2 === 'yellow');
}

// Test 2: Diagonal win
console.log('\n=== Test 2: Diagonal Win ===');
const game2 = new Connect4Game();

// Execute my corrected diagonal sequence
game2.makeMove(0); // P1 at (5,0)
game2.makeMove(1); // P2 at (5,1)
game2.makeMove(1); // P1 at (4,1)
game2.makeMove(2); // P2 at (5,2)
game2.makeMove(2); // P1 at (4,2)
game2.makeMove(3); // P2 at (5,3)
game2.makeMove(2); // P1 at (3,2)
game2.makeMove(3); // P2 at (4,3)
game2.makeMove(3); // P1 at (3,3)
game2.makeMove(4); // P2 at (5,4)

console.log('Before final move - game over:', game2.gameOver);
const result = game2.makeMove(3); // P1 at (2,3) - should complete diagonal

console.log('Final move result:', result);
console.log('Has gameWon property:', 'gameWon' in result);
console.log('gameWon value:', result.gameWon);
console.log('Game over state:', game2.gameOver);
console.log('Winner:', game2.winner);

// Test 3: Simple horizontal win to verify basic logic
console.log('\n=== Test 3: Simple Horizontal Win (Verification) ===');
const game3 = new Connect4Game();

// Simple horizontal win at bottom
game3.makeMove(0); // P1
game3.makeMove(0); // P2
game3.makeMove(1); // P1
game3.makeMove(1); // P2
game3.makeMove(2); // P1
game3.makeMove(2); // P2
const winResult = game3.makeMove(3); // P1 - should win

console.log('Horizontal win result:', winResult);
console.log('Has gameWon property:', 'gameWon' in winResult);
console.log('gameWon value:', winResult.gameWon);
console.log('Game over state:', game3.gameOver);
