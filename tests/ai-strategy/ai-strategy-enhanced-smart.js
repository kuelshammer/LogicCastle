/**
 * AI Strategy Tests for Enhanced Smart Bot
 *
 * Coverage: Enhanced Smart Bot strategic analysis, state corruption prevention,
 * even/odd strategy, zugzwang detection, fork planning, anti-chaos validation
 */
function runAIStrategyEnhancedSmartTests(testSuite) {

  // Test Enhanced Smart Bot initialization
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Enhanced Smart Bot initialization', () => {
    const ai = new Connect4AI('enhanced-smart');

    testSuite.assertEqual(ai.difficulty, 'enhanced-smart', 'Should set correct difficulty');
    testSuite.assertNotNull(ai, 'Should create AI instance');
  });

  // Test center opening move preference
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Center opening move preference', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    const move = ai.getBestMove(game, helpers);

    testSuite.assertEqual(move, 3, 'Should choose center column (3) as opening move');
  });

  // Test winning move detection (Priority 1)
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Winning move detection', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create winning opportunity for current player
    game.board[5][0] = game.PLAYER2; // Yellow
    game.board[5][1] = game.PLAYER2; // Yellow
    game.board[5][2] = game.PLAYER2; // Yellow
    // Column 3 is winning move for Yellow
    game.currentPlayer = game.PLAYER2;

    const move = ai.getBestMove(game, helpers);

    testSuite.assertEqual(move, 3, 'Should choose winning move in column 3');
  });

  // Test blocking opponent win (Priority 2)
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Blocking opponent win', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create winning opportunity for opponent (Red)
    game.board[5][0] = game.PLAYER1; // Red
    game.board[5][1] = game.PLAYER1; // Red
    game.board[5][2] = game.PLAYER1; // Red
    // Column 3 would win for Red, so Yellow (current player) must block
    game.currentPlayer = game.PLAYER2;

    const move = ai.getBestMove(game, helpers);

    testSuite.assertEqual(move, 3, 'Should block opponent win in column 3');
  });

  // Test state isolation (no corruption)
  testSuite.test('AI-Strategy-Enhanced-Smart', 'State isolation - no corruption', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Record initial state
    const initialBoard = game.getBoard();
    const initialPlayer = game.currentPlayer;
    const initialMoveHistory = [...game.moveHistory];
    const initialGameOver = game.gameOver;

    // Get AI move (this should not modify game state)
    const move = ai.getBestMove(game, helpers);

    // Verify state unchanged
    testSuite.assertEqual(game.currentPlayer, initialPlayer, 'Current player should be unchanged');
    testSuite.assertEqual(game.gameOver, initialGameOver, 'Game over status should be unchanged');
    testSuite.assertEqual(game.moveHistory.length, initialMoveHistory.length, 'Move history should be unchanged');

    // Verify board unchanged
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        testSuite.assertEqual(game.board[row][col], initialBoard[row][col],
          `Board cell [${row}][${col}] should be unchanged`);
      }
    }

    testSuite.assertNotNull(move, 'Should return a valid move');
    testSuite.assert(move >= 0 && move < 7, 'Move should be valid column index');
  });

  // Test strategic analysis integration
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Strategic analysis integration', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create a complex position
    game.makeMove(3); // Red center
    game.makeMove(2); // Yellow left
    game.makeMove(3); // Red center
    game.makeMove(4); // Yellow right

    // Get strategic evaluation
    const strategicEval = helpers.getEnhancedStrategicEvaluation();

    testSuite.assertNotNull(strategicEval, 'Should return strategic evaluation');
    testSuite.assertNotNull(strategicEval.evenOddAnalysis, 'Should include even/odd analysis');
    testSuite.assertNotNull(strategicEval.forkOpportunities, 'Should include fork opportunities');
    testSuite.assertNotNull(strategicEval.zugzwangOpportunities, 'Should include zugzwang opportunities');

    // Get Enhanced Bot move
    const move = ai.getBestMove(game, helpers);

    testSuite.assert(game.getValidMoves().includes(move), 'Enhanced Bot should choose valid move');
  });

  // Test multiple consecutive moves without corruption
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Multiple consecutive moves without corruption', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Switch to bot player
    game.currentPlayer = game.PLAYER2;

    let corruptionDetected = false;
    let movesPlayed = 0;

    // Play several moves and check for state corruption
    while (!game.gameOver && movesPlayed < 10) {
      const beforeState = {
        player: game.currentPlayer,
        gameOver: game.gameOver,
        boardHash: JSON.stringify(game.board)
      };

      // Get AI move
      const aiMove = ai.getBestMove(game, helpers);

      // Verify state not corrupted by AI analysis
      if (game.currentPlayer !== beforeState.player ||
                game.gameOver !== beforeState.gameOver ||
                JSON.stringify(game.board) !== beforeState.boardHash) {
        corruptionDetected = true;
        break;
      }

      // Actually make the move
      const result = game.makeMove(aiMove);
      if (!result.success) break;

      movesPlayed++;

      // Switch back to bot if needed
      if (!game.gameOver) {
        game.currentPlayer = game.PLAYER2;
      }
    }

    testSuite.assertFalsy(corruptionDetected, 'No state corruption should be detected during AI analysis');
    testSuite.assert(movesPlayed >= 5, 'Should successfully play multiple moves');
  });

  // Test even/odd strategy application
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Even/odd strategy application', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create board position where even/odd strategy matters
    // This is complex to set up, so we'll test the analysis exists
    game.makeMove(3); // Some moves to create position
    game.makeMove(2);
    game.makeMove(4);
    game.makeMove(1);

    const evenOddAnalysis = helpers.analyzeEvenOddThreats();

    testSuite.assertNotNull(evenOddAnalysis, 'Should provide even/odd analysis');
    testSuite.assertNotNull(evenOddAnalysis.parity, 'Should determine parity');
    testSuite.assertNotNull(evenOddAnalysis.player, 'Should analyze player threats');
    testSuite.assertNotNull(evenOddAnalysis.opponent, 'Should analyze opponent threats');

    // Enhanced Bot should be able to use this analysis
    const move = ai.getBestMove(game, helpers);
    testSuite.assert(game.getValidMoves().includes(move), 'Should choose valid move based on even/odd analysis');
  });

  // Test zugzwang detection
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Zugzwang detection', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create position for zugzwang analysis
    game.makeMove(3);
    game.makeMove(2);
    game.makeMove(3);
    game.makeMove(4);

    const zugzwangMoves = helpers.detectZugzwang();

    testSuite.assertNotNull(zugzwangMoves, 'Should return zugzwang analysis');
    testSuite.assert(Array.isArray(zugzwangMoves), 'Should return array of zugzwang moves');

    // Enhanced Bot should incorporate this analysis
    const move = ai.getBestMove(game, helpers);
    testSuite.assert(game.getValidMoves().includes(move), 'Should choose valid move considering zugzwang');
  });

  // Test fork opportunity analysis
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Fork opportunity analysis', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create position with potential fork opportunities
    game.makeMove(3);
    game.makeMove(1);
    game.makeMove(2);
    game.makeMove(5);

    const forkOpportunities = helpers.analyzeForkOpportunities();

    testSuite.assertNotNull(forkOpportunities, 'Should return fork analysis');
    testSuite.assert(Array.isArray(forkOpportunities), 'Should return array of fork opportunities');

    // Enhanced Bot should use fork analysis
    const move = ai.getBestMove(game, helpers);
    testSuite.assert(game.getValidMoves().includes(move), 'Should choose valid move considering forks');
  });

  // Test fallback to safe random when no strategic advantages
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Fallback to safe random', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create neutral position with no immediate threats
    game.makeMove(3); // Just center move

    const move = ai.getBestMove(game, helpers);

    testSuite.assert(game.getValidMoves().includes(move), 'Should choose valid move');
    testSuite.assert(move >= 0 && move < 7, 'Should choose valid column');

    // For neutral position, should prefer center-ish columns
    testSuite.assert(move >= 1 && move <= 5, 'Should prefer center-ish columns in neutral position');
  });

  // Test performance under complex board states
  testSuite.test('AI-Strategy-Enhanced-Smart', 'Performance under complex board states', () => {
    const game = new Connect4Game();
    const ai = new Connect4AI('enhanced-smart');
    const helpers = new Connect4Helpers(game, null);

    // Create complex board state
    const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6, 0, 6];
    complexMoves.forEach(col => {
      if (game.getValidMoves().includes(col)) {
        game.makeMove(col);
      }
    });

    const startTime = performance.now();
    const move = ai.getBestMove(game, helpers);
    const endTime = performance.now();

    const responseTime = endTime - startTime;

    testSuite.assert(responseTime < 1000, `Enhanced Bot should respond in <1000ms (took ${responseTime.toFixed(2)}ms)`);
    testSuite.assert(game.getValidMoves().includes(move), 'Should choose valid move in complex position');
  });
}
