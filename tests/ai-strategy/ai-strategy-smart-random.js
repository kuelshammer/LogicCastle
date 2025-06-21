/**
 * AI Strategy Tests for Smart Random Bot
 * 
 * Coverage: Smart Random Bot Level 0-2 integration, helper system integration,
 * priority system validation, random fallback behavior
 */
function runAIStrategySmartRandomTests(testSuite) {
    
    // Test Smart Random Bot initialization
    testSuite.test('AI-Strategy-Smart-Random', 'Smart Random Bot initialization', () => {
        const ai = new Connect4AI('smart-random');
        
        testSuite.assertEqual(ai.difficulty, 'smart-random', 'Should set correct difficulty');
        testSuite.assertNotNull(ai, 'Should create AI instance');
    });
    
    // Test center opening preference
    testSuite.test('AI-Strategy-Smart-Random', 'Center opening preference', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(move, 3, 'Should prefer center column (3) for opening move');
    });
    
    // Test Level 0 - Own winning opportunities (Priority 1)
    testSuite.test('AI-Strategy-Smart-Random', 'Level 0 - Own winning opportunities', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create winning opportunity for current player (Player 2/Yellow)
        game.board[5][0] = game.PLAYER2; // Yellow
        game.board[5][1] = game.PLAYER2; // Yellow
        game.board[5][2] = game.PLAYER2; // Yellow
        game.currentPlayer = game.PLAYER2;
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(move, 3, 'Should choose winning move in column 3');
    });
    
    // Test Level 0 - Vertical winning opportunity
    testSuite.test('AI-Strategy-Smart-Random', 'Level 0 - Vertical winning opportunity', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create vertical winning opportunity
        game.board[5][3] = game.PLAYER2; // Yellow bottom
        game.board[4][3] = game.PLAYER2; // Yellow middle
        game.board[3][3] = game.PLAYER2; // Yellow upper
        game.currentPlayer = game.PLAYER2;
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(move, 3, 'Should choose vertical winning move in column 3');
    });
    
    // Test Level 1 - Block opponent threats (Priority 2)
    testSuite.test('AI-Strategy-Smart-Random', 'Level 1 - Block opponent threats', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create threat from opponent (Player 1/Red)
        game.board[5][0] = game.PLAYER1; // Red
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red
        game.currentPlayer = game.PLAYER2; // Yellow must block
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(move, 3, 'Should block opponent threat in column 3');
    });
    
    // Test Level 1 - Vertical blocking
    testSuite.test('AI-Strategy-Smart-Random', 'Level 1 - Vertical blocking', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create vertical threat from opponent
        game.board[5][2] = game.PLAYER1; // Red bottom
        game.board[4][2] = game.PLAYER1; // Red middle
        game.board[3][2] = game.PLAYER1; // Red upper
        game.currentPlayer = game.PLAYER2; // Yellow must block
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(move, 2, 'Should block vertical threat in column 2');
    });
    
    // Test priority system: Winning over Blocking
    testSuite.test('AI-Strategy-Smart-Random', 'Priority - Winning over Blocking', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create situation where bot can both win AND needs to block
        // Bot can win in column 3
        game.board[5][0] = game.PLAYER2; // Yellow
        game.board[5][1] = game.PLAYER2; // Yellow
        game.board[5][2] = game.PLAYER2; // Yellow
        
        // Opponent threatens in column 6
        game.board[5][4] = game.PLAYER1; // Red
        game.board[5][5] = game.PLAYER1; // Red
        game.board[5][6] = game.PLAYER1; // Red
        
        game.currentPlayer = game.PLAYER2;
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(move, 3, 'Should choose to win (column 3) rather than block (column 6)');
    });
    
    // Test helper system integration - no corruption
    testSuite.test('AI-Strategy-Smart-Random', 'Helper system integration - no corruption', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Record initial state
        const initialBoard = JSON.stringify(game.board);
        const initialPlayer = game.currentPlayer;
        const initialGameOver = game.gameOver;
        
        // Get move using helpers
        const move = ai.getBestMove(game, helpers);
        
        // Verify no corruption
        testSuite.assertEqual(JSON.stringify(game.board), initialBoard, 'Board should be unchanged');
        testSuite.assertEqual(game.currentPlayer, initialPlayer, 'Current player should be unchanged');
        testSuite.assertEqual(game.gameOver, initialGameOver, 'Game over status should be unchanged');
        testSuite.assert(game.getValidMoves().includes(move), 'Should return valid move');
    });
    
    // Test random fallback when no strategic moves available
    testSuite.test('AI-Strategy-Smart-Random', 'Random fallback behavior', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create neutral position with no threats
        game.makeMove(3); // Just one center move
        
        // Make multiple move requests to test randomness
        const moves = [];
        for (let i = 0; i < 10; i++) {
            const move = ai.getBestMove(game, helpers);
            moves.push(move);
        }
        
        // All moves should be valid
        moves.forEach((move, index) => {
            testSuite.assert(game.getValidMoves().includes(move), 
                `Move ${index + 1} should be valid: ${move}`);
        });
        
        // Should show some variation (not always the same move)
        const uniqueMoves = [...new Set(moves)];
        testSuite.assert(uniqueMoves.length >= 2, 
            'Should show some randomness in neutral positions (got moves: ' + moves.join(',') + ')');
    });
    
    // Test multiple move sequence consistency
    testSuite.test('AI-Strategy-Smart-Random', 'Multiple move sequence consistency', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Play several moves and verify consistency
        for (let i = 0; i < 5; i++) {
            const move = ai.getBestMove(game, helpers);
            
            testSuite.assert(game.getValidMoves().includes(move), 
                `Move ${i + 1} should be valid`);
            
            // Actually make the move to progress game
            const result = game.makeMove(move);
            testSuite.assertTruthy(result.success, `Move ${i + 1} should succeed`);
            
            // Switch players and continue
            if (!game.gameOver) {
                // Make opponent move to continue game
                const opponentMove = game.getValidMoves()[0]; // Simple opponent
                game.makeMove(opponentMove);
            }
        }
    });
    
    // Test performance with complex helper analysis
    testSuite.test('AI-Strategy-Smart-Random', 'Performance with helper analysis', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create complex board state
        const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5];
        complexMoves.forEach(col => game.makeMove(col));
        
        const startTime = performance.now();
        const move = ai.getBestMove(game, helpers);
        const endTime = performance.now();
        
        const responseTime = endTime - startTime;
        
        testSuite.assert(responseTime < 500, 
            `Smart Random Bot should respond quickly <500ms (took ${responseTime.toFixed(2)}ms)`);
        testSuite.assert(game.getValidMoves().includes(move), 
            'Should choose valid move in complex position');
    });
    
    // Test with helpers disabled
    testSuite.test('AI-Strategy-Smart-Random', 'Behavior with helpers disabled', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        
        // Create winning opportunity
        game.board[5][0] = game.PLAYER2;
        game.board[5][1] = game.PLAYER2;
        game.board[5][2] = game.PLAYER2;
        game.currentPlayer = game.PLAYER2;
        
        // Call without helpers
        const move = ai.getBestMove(game, null);
        
        // Without helpers, should still return valid move but might not be optimal
        testSuite.assert(game.getValidMoves().includes(move), 
            'Should return valid move even without helpers');
    });
    
    // Test edge case: nearly full board
    testSuite.test('AI-Strategy-Smart-Random', 'Nearly full board behavior', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Fill most of the board
        for (let col = 0; col < 6; col++) {
            for (let row = 0; row < 5; row++) {
                game.board[row][col] = (col + row) % 2 === 0 ? game.PLAYER1 : game.PLAYER2;
            }
        }
        // Leave column 6 with some space
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assert(game.getValidMoves().includes(move), 
            'Should choose valid move on nearly full board');
    });
    
    // Test state isolation across multiple AI calls
    testSuite.test('AI-Strategy-Smart-Random', 'State isolation across multiple calls', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create initial state
        game.makeMove(3);
        game.makeMove(2);
        
        const originalState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver
        };
        
        // Make multiple AI calls
        for (let i = 0; i < 5; i++) {
            ai.getBestMove(game, helpers);
            
            // Verify state unchanged after each call
            testSuite.assertEqual(JSON.stringify(game.board), originalState.board, 
                `Board should be unchanged after AI call ${i + 1}`);
            testSuite.assertEqual(game.currentPlayer, originalState.player, 
                `Player should be unchanged after AI call ${i + 1}`);
            testSuite.assertEqual(game.gameOver, originalState.gameOver, 
                `Game over status should be unchanged after AI call ${i + 1}`);
        }
    });
}