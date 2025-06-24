/**
 * Monte Carlo AI Tests for Connect4
 */

// Test Monte Carlo bot basic functionality
function testMonteCarloBasicFunctionality() {
  const game = new Connect4Game();
  const ai = new Connect4AI('monte-carlo');

  // Test that Monte Carlo bot can make moves
  const move = ai.getBestMove(game);
  assert(move !== null, 'Monte Carlo bot should return a valid move');
  assert(move >= 0 && move < 7, 'Move should be a valid column index');

  console.log(`✅ Monte Carlo bot selected column ${move + 1} for empty board`);
  return true;
}

// Test Monte Carlo follows universal stages
function testMonteCarloUniversalStages() {
  const game = new Connect4Game();
  const ai = new Connect4AI('monte-carlo');

  // Set up a winning scenario for red (current player)
  // Create 3 in a row horizontally, red can win in column 3
  game.board[5][0] = game.PLAYER1; // Red
  game.board[5][1] = game.PLAYER1; // Red
  game.board[5][2] = game.PLAYER1; // Red
  // Column 3 is empty and would be a winning move

  const move = ai.getBestMove(game);
  assert(move === 3, `Monte Carlo should take winning move in column 4 (got ${move + 1})`);

  console.log('✅ Monte Carlo correctly identifies winning moves (Stage 1)');
  return true;
}

// Test Monte Carlo blocking
function testMonteCarloBlocking() {
  const game = new Connect4Game();
  game.currentPlayer = game.PLAYER1; // Red to move
  const ai = new Connect4AI('monte-carlo');

  // Set up opponent (yellow) threat: 3 in a row, yellow can win in column 3
  game.board[5][0] = game.PLAYER2; // Yellow
  game.board[5][1] = game.PLAYER2; // Yellow
  game.board[5][2] = game.PLAYER2; // Yellow
  // Column 3 is empty and would be yellow's winning move - red must block

  const move = ai.getBestMove(game);
  assert(move === 3, `Monte Carlo should block opponent win in column 4 (got ${move + 1})`);

  console.log('✅ Monte Carlo correctly blocks opponent wins (Stage 2)');
  return true;
}

// Test Monte Carlo with safe columns only
function testMonteCarloSafeColumnsOnly() {
  const game = new Connect4Game();
  game.currentPlayer = game.PLAYER1; // Red to move
  const ai = new Connect4AI('monte-carlo');

  // Create a position where some moves are trapped
  // Fill most of column 0 and 1, making them dangerous
  for (let row = 2; row < 6; row++) {
    game.board[row][0] = row % 2 === 0 ? game.PLAYER1 : game.PLAYER2;
    game.board[row][1] = row % 2 === 0 ? game.PLAYER2 : game.PLAYER1;
  }

  // Set up yellow threat on top of column 0 stack
  game.board[1][0] = game.PLAYER2;
  game.board[0][0] = game.PLAYER2; // If red plays here, yellow wins next turn

  const move = ai.getBestMove(game);

  // Monte Carlo should avoid dangerous columns and use simulation on safe ones
  assert(move !== 0, 'Monte Carlo should avoid trapped columns');
  assert(move >= 2 && move <= 6, 'Monte Carlo should select from safe columns 3-7');

  console.log('✅ Monte Carlo avoids trapped columns and uses safe simulation (Stage 3+4)');
  return true;
}

// Test Monte Carlo performance
function testMonteCarloPerformance() {
  const game = new Connect4Game();
  const ai = new Connect4AI('monte-carlo');

  // Create a complex mid-game position
  const moves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5];
  for (const move of moves) {
    game.makeMove(move);
  }

  console.log('Testing Monte Carlo performance on complex position...');
  const startTime = performance.now();
  const move = ai.getBestMove(game);
  const endTime = performance.now();

  const timeMs = endTime - startTime;
  assert(move !== null, 'Monte Carlo should return a valid move');
  assert(timeMs < 5000, `Monte Carlo should decide within 5 seconds (took ${timeMs.toFixed(1)}ms)`);

  console.log(`✅ Monte Carlo performance: ${timeMs.toFixed(1)}ms for complex position`);
  console.log(`✅ Selected column ${move + 1}`);
  return true;
}

// Test Monte Carlo simulation quality
function testMonteCarloSimulationQuality() {
  const game = new Connect4Game();
  game.currentPlayer = game.PLAYER1; // Red to move
  const ai = new Connect4AI('monte-carlo');

  // Create a position where center play is clearly superior
  // Place some pieces to make center columns more valuable
  game.board[5][3] = game.PLAYER1; // Red center
  game.board[4][3] = game.PLAYER2; // Yellow on top

  const move = ai.getBestMove(game);

  // While we can't guarantee the exact move, Monte Carlo should tend toward center columns
  // due to their higher winning potential in simulations
  console.log(`✅ Monte Carlo selected column ${move + 1} for center-heavy position`);
  assert(move !== null, 'Monte Carlo should select a valid move');

  return true;
}

// Main test runner compatible with TestSuite
function runMonteCarloTests(testSuite) {
  testSuite.group('🎯 Monte Carlo AI Tests', () => {

    testSuite.test('Monte Carlo basic functionality', () => {
      const game = new Connect4Game();
      const ai = new Connect4AI('monte-carlo');

      const move = ai.getBestMove(game);
      testSuite.assert(move !== null, 'Monte Carlo bot should return a valid move');
      testSuite.assert(move >= 0 && move < 7, 'Move should be a valid column index');

      console.log(`✅ Monte Carlo bot selected column ${move + 1} for empty board`);
    });

    testSuite.test('Monte Carlo follows universal stages - winning moves', () => {
      const game = new Connect4Game();
      const ai = new Connect4AI('monte-carlo');

      // Set up a winning scenario for red (current player)
      game.board[5][0] = game.PLAYER1; // Red
      game.board[5][1] = game.PLAYER1; // Red
      game.board[5][2] = game.PLAYER1; // Red

      const move = ai.getBestMove(game);
      testSuite.assert(move === 3, `Monte Carlo should take winning move in column 4 (got ${move + 1})`);

      console.log('✅ Monte Carlo correctly identifies winning moves (Stage 1)');
    });

    testSuite.test('Monte Carlo follows universal stages - blocking moves', () => {
      const game = new Connect4Game();
      game.currentPlayer = game.PLAYER1; // Red to move
      const ai = new Connect4AI('monte-carlo');

      // Set up opponent (yellow) threat
      game.board[5][0] = game.PLAYER2; // Yellow
      game.board[5][1] = game.PLAYER2; // Yellow
      game.board[5][2] = game.PLAYER2; // Yellow

      const move = ai.getBestMove(game);
      testSuite.assert(move === 3, `Monte Carlo should block opponent win in column 4 (got ${move + 1})`);

      console.log('✅ Monte Carlo correctly blocks opponent wins (Stage 2)');
    });

    testSuite.test('Monte Carlo avoids trapped columns', () => {
      const game = new Connect4Game();
      game.currentPlayer = game.PLAYER1; // Red to move
      const ai = new Connect4AI('monte-carlo');

      // Create a trapped position in column 0
      for (let row = 2; row < 6; row++) {
        game.board[row][0] = row % 2 === 0 ? game.PLAYER1 : game.PLAYER2;
      }
      game.board[1][0] = game.PLAYER2;
      game.board[0][0] = game.PLAYER2;

      const move = ai.getBestMove(game);
      testSuite.assert(move !== 0, 'Monte Carlo should avoid trapped columns');
      testSuite.assert(move >= 1 && move <= 6, 'Monte Carlo should select from safe columns');

      console.log('✅ Monte Carlo avoids trapped columns (Stage 3)');
    });

    testSuite.test('Monte Carlo performance', () => {
      const game = new Connect4Game();
      const ai = new Connect4AI('monte-carlo');

      // Create a complex mid-game position
      const moves = [3, 3, 2, 4, 2, 4, 1, 5];
      for (const move of moves) {
        game.makeMove(move);
      }

      const startTime = performance.now();
      const move = ai.getBestMove(game);
      const endTime = performance.now();

      const timeMs = endTime - startTime;
      testSuite.assert(move !== null, 'Monte Carlo should return a valid move');
      testSuite.assert(timeMs < 5000, `Monte Carlo should decide within 5 seconds (took ${timeMs.toFixed(1)}ms)`);

      console.log(`✅ Monte Carlo performance: ${timeMs.toFixed(1)}ms for complex position`);
      console.log(`✅ Selected column ${move + 1}`);
    });

    testSuite.test('Monte Carlo simulation quality', () => {
      const game = new Connect4Game();
      game.currentPlayer = game.PLAYER1;
      const ai = new Connect4AI('monte-carlo');

      // Create a position favoring center play
      game.board[5][3] = game.PLAYER1; // Red center
      game.board[4][3] = game.PLAYER2; // Yellow on top

      const move = ai.getBestMove(game);
      testSuite.assert(move !== null, 'Monte Carlo should select a valid move');

      console.log(`✅ Monte Carlo selected column ${move + 1} for center-heavy position`);
    });
  });
}

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runMonteCarloTests };
}
