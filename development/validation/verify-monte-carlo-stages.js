/**
 * Verifikation: Monte Carlo Stage Logic
 */

// Load matrix runner classes
const fs = require('fs');
const matrixRunnerCode = fs.readFileSync('./real-bot-matrix-runner.js', 'utf8');
const adaptedCode = matrixRunnerCode.replace('main();', '// main() disabled');
const codeUntilMain = adaptedCode.split('// Main execution')[0];
eval(codeUntilMain);

console.log('🎯 MONTE CARLO STAGE LOGIC VERIFICATION');
console.log('========================================\n');

// Test 1: Immediate Win Detection
console.log('TEST 1: Immediate Win Detection');
const game1 = new RealConnect4Game();
const monteCarloBot = new RealConnect4AI('monte-carlo');

// Set up a winning scenario for red (current player)
// Create 3 in a row horizontally, red can win in column 3
game1.board[5][0] = game1.PLAYER1; // Red
game1.board[5][1] = game1.PLAYER1; // Red
game1.board[5][2] = game1.PLAYER1; // Red
// Column 3 is empty and would be a winning move

console.log('Board setup: Red has 3 in a row [R][R][R][_][_][_][_]');
console.log('Expected: Monte Carlo should immediately take column 4 (winning move)');

const move1 = monteCarloBot.getBestMove(game1);
console.log(`Monte Carlo selected: Column ${move1 + 1}`);
console.log(`Result: ${move1 === 3 ? '✅ CORRECT - Took winning move' : '❌ WRONG - Did not take winning move'}\n`);

// Test 2: Immediate Block Detection
console.log('TEST 2: Immediate Block Detection');
const game2 = new RealConnect4Game();
game2.currentPlayer = game2.PLAYER1; // Red to move
const monteCarloBot2 = new RealConnect4AI('monte-carlo');

// Set up opponent (yellow) threat: 3 in a row, yellow can win in column 3
game2.board[5][0] = game2.PLAYER2; // Yellow
game2.board[5][1] = game2.PLAYER2; // Yellow
game2.board[5][2] = game2.PLAYER2; // Yellow
// Column 3 is empty and would be yellow's winning move - red must block

console.log('Board setup: Yellow has 3 in a row [Y][Y][Y][_][_][_][_]');
console.log('Expected: Monte Carlo should immediately block column 4');

const move2 = monteCarloBot2.getBestMove(game2);
console.log(`Monte Carlo selected: Column ${move2 + 1}`);
console.log(`Result: ${move2 === 3 ? '✅ CORRECT - Blocked opponent win' : '❌ WRONG - Did not block'}\n`);

// Test 3: Check if Universal Logic is called
console.log('TEST 3: Universal Logic Integration');
const game3 = new RealConnect4Game();
const monteCarloBot3 = new RealConnect4AI('monte-carlo');

// Override getUniversalBestMove to check if it's called
let universalLogicCalled = false;
const originalUniversal = monteCarloBot3.getUniversalBestMove;

monteCarloBot3.getUniversalBestMove = function(...args) {
  universalLogicCalled = true;
  console.log('📊 Universal 4-stage logic called!');
  return originalUniversal.apply(this, args);
};

const move3 = monteCarloBot3.getBestMove(game3);
console.log(`Monte Carlo selected: Column ${move3 + 1}`);
console.log(`Universal Logic Called: ${universalLogicCalled ? '✅ YES' : '❌ NO'}\n`);

// Summary
console.log('🏆 SUMMARY:');
const test1Pass = move1 === 3;
const test2Pass = move2 === 3;
const test3Pass = universalLogicCalled;

console.log(`- Win Detection: ${test1Pass ? 'PASS' : 'FAIL'}`);
console.log(`- Block Detection: ${test2Pass ? 'PASS' : 'FAIL'}`);
console.log(`- Universal Logic: ${test3Pass ? 'PASS' : 'FAIL'}`);

if (test1Pass && test2Pass && test3Pass) {
  console.log('\n✅ ALL TESTS PASSED - Monte Carlo follows 4-stage logic correctly!');
} else {
  console.log('\n❌ STAGE LOGIC PROBLEM DETECTED!');
  if (!test1Pass) console.log('   - Monte Carlo does not take immediate wins');
  if (!test2Pass) console.log('   - Monte Carlo does not block opponent wins');
  if (!test3Pass) console.log('   - Monte Carlo bypasses universal logic');
}
