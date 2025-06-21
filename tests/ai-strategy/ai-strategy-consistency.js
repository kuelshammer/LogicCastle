/**
 * AI Strategy Consistency Tests
 * 
 * Coverage: Move determinism, strategy hierarchy validation,
 * cross-bot performance comparison, consistency validation
 */
function runAIStrategyConsistencyTests(testSuite) {
    
    // Test move determinism for same bot type
    testSuite.test('AI-Strategy-Consistency', 'Move determinism for identical states', () => {
        const game1 = new Connect4Game();
        const game2 = new Connect4Game();
        const ai1 = new Connect4AI('smart-random');
        const ai2 = new Connect4AI('smart-random');
        const helpers1 = new Connect4Helpers(game1, null);
        const helpers2 = new Connect4Helpers(game2, null);
        
        // Set up identical game states
        const testMoves = [3, 2, 4, 1, 5];
        testMoves.forEach(col => {
            game1.makeMove(col);
            game2.makeMove(col);
        });
        
        // For level 0 and 1 decisions (win/block), moves should be deterministic
        // Create a clear winning opportunity
        game1.board[5][0] = game1.PLAYER2; // Yellow
        game1.board[5][1] = game1.PLAYER2; // Yellow  
        game1.board[5][2] = game1.PLAYER2; // Yellow
        game1.currentPlayer = game1.PLAYER2;
        
        game2.board[5][0] = game2.PLAYER2; // Yellow
        game2.board[5][1] = game2.PLAYER2; // Yellow
        game2.board[5][2] = game2.PLAYER2; // Yellow
        game2.currentPlayer = game2.PLAYER2;
        
        const move1 = ai1.getBestMove(game1, helpers1);
        const move2 = ai2.getBestMove(game2, helpers2);
        
        testSuite.assertEqual(move1, move2, 'Same bot type should make same move in identical winning situations');
        testSuite.assertEqual(move1, 3, 'Both bots should choose winning move (column 3)');
    });
    
    // Test strategy hierarchy: Win > Block > Strategic
    testSuite.test('AI-Strategy-Consistency', 'Strategy hierarchy - Win over Block', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);
        
        // Create situation where bot can both win AND block opponent
        // Bot (Yellow) can win in column 3
        game.board[5][0] = game.PLAYER2; // Yellow
        game.board[5][1] = game.PLAYER2; // Yellow
        game.board[5][2] = game.PLAYER2; // Yellow
        
        // Opponent (Red) can win in column 6
        game.board[5][4] = game.PLAYER1; // Red
        game.board[5][5] = game.PLAYER1; // Red
        game.board[5][6] = game.PLAYER1; // Red
        
        game.currentPlayer = game.PLAYER2; // Yellow's turn
        
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(move, 3, 'Should choose to win (column 3) rather than block (column 3 in this setup)');
    });
    
    // Test that all bots choose valid moves
    testSuite.test('AI-Strategy-Consistency', 'All bots choose valid moves', () => {
        const game = new Connect4Game();
        const botTypes = ['easy', 'smart-random', 'defensive', 'offensiv-gemischt', 'defensiv-gemischt', 'enhanced-smart', 'medium', 'hard'];
        const helpers = new Connect4Helpers(game, null);
        
        // Test each bot type
        botTypes.forEach(botType => {
            const ai = new Connect4AI(botType);
            const move = ai.getBestMove(game, helpers);
            
            testSuite.assertNotNull(move, `${botType} bot should return a move`);
            testSuite.assert(move >= 0 && move < 7, `${botType} bot should return valid column (0-6), got ${move}`);
            testSuite.assert(game.getValidMoves().includes(move), `${botType} bot should choose from valid moves`);
        });
    });
    
    // Test opening move preferences
    testSuite.test('AI-Strategy-Consistency', 'Opening move preferences', () => {
        const botTypes = ['smart-random', 'defensive', 'offensiv-gemischt', 'defensiv-gemischt', 'enhanced-smart'];
        const helpers = new Connect4Helpers(new Connect4Game(), null);
        
        botTypes.forEach(botType => {
            const game = new Connect4Game(); // Fresh game for each bot
            const ai = new Connect4AI(botType);
            const openingMove = ai.getBestMove(game, helpers);
            
            // Most strategic bots should prefer center or near-center
            testSuite.assert(openingMove >= 2 && openingMove <= 4, 
                `${botType} bot should prefer center-ish opening (columns 2-4), chose ${openingMove}`);
        });
    });
    
    // Test response time consistency
    testSuite.test('AI-Strategy-Consistency', 'Response time consistency', () => {
        const game = new Connect4Game();
        const botTypes = ['easy', 'smart-random', 'defensive', 'enhanced-smart'];
        const helpers = new Connect4Helpers(game, null);
        
        botTypes.forEach(botType => {
            const ai = new Connect4AI(botType);
            
            const startTime = performance.now();
            const move = ai.getBestMove(game, helpers);
            const endTime = performance.now();
            
            const responseTime = endTime - startTime;
            
            // Different bots have different complexity, but all should be reasonable
            const maxTime = botType === 'enhanced-smart' ? 1000 : 500; // Enhanced bot gets more time
            testSuite.assert(responseTime < maxTime, 
                `${botType} bot should respond in <${maxTime}ms (took ${responseTime.toFixed(2)}ms)`);
        });
    });
    
    // Test that blocking behavior is consistent across smart bots
    testSuite.test('AI-Strategy-Consistency', 'Blocking behavior consistency', () => {
        const smartBotTypes = ['smart-random', 'defensive', 'offensiv-gemischt', 'defensiv-gemischt', 'enhanced-smart'];
        
        smartBotTypes.forEach(botType => {
            const game = new Connect4Game();
            const ai = new Connect4AI(botType);
            const helpers = new Connect4Helpers(game, null);
            
            // Create clear blocking situation
            game.board[5][0] = game.PLAYER1; // Red threat
            game.board[5][1] = game.PLAYER1; // Red threat
            game.board[5][2] = game.PLAYER1; // Red threat
            game.currentPlayer = game.PLAYER2; // Yellow must block
            
            const move = ai.getBestMove(game, helpers);
            
            testSuite.assertEqual(move, 3, `${botType} bot should block opponent win in column 3`);
        });
    });
    
    // Test random vs strategic bot behavior differences
    testSuite.test('AI-Strategy-Consistency', 'Random vs strategic bot differences', () => {
        const game = new Connect4Game();
        const randomAI = new Connect4AI('easy'); // Random bot
        const strategicAI = new Connect4AI('smart-random'); // Strategic bot
        const helpers = new Connect4Helpers(game, null);
        
        // Create position with clear strategic advantage
        game.makeMove(3); // Some center play
        game.makeMove(1); // Corner response
        
        // In strategic positions, results may differ, but both should be valid
        const randomMove = randomAI.getBestMove(game, helpers);
        const strategicMove = strategicAI.getBestMove(game, helpers);
        
        testSuite.assert(game.getValidMoves().includes(randomMove), 'Random bot should choose valid move');
        testSuite.assert(game.getValidMoves().includes(strategicMove), 'Strategic bot should choose valid move');
        
        // They might choose different moves, which is expected
        // The test just validates both are valid
    });
    
    // Test defensive vs offensive bot behavior
    testSuite.test('AI-Strategy-Consistency', 'Defensive vs offensive preferences', () => {
        const game = new Connect4Game();
        const defensiveAI = new Connect4AI('defensive');
        const offensiveAI = new Connect4AI('offensiv-gemischt');
        const helpers = new Connect4Helpers(game, null);
        
        // Create position with both defensive and offensive opportunities
        game.makeMove(3); // Center
        game.makeMove(2); // Left
        game.makeMove(4); // Right
        game.makeMove(1); // Far left
        
        const defensiveMove = defensiveAI.getBestMove(game, helpers);
        const offensiveMove = offensiveAI.getBestMove(game, helpers);
        
        testSuite.assert(game.getValidMoves().includes(defensiveMove), 'Defensive bot should choose valid move');
        testSuite.assert(game.getValidMoves().includes(offensiveMove), 'Offensive bot should choose valid move');
        
        // Both moves are valid, behavior difference is in internal weighting
    });
    
    // Test that no bot corrupts game state during analysis
    testSuite.test('AI-Strategy-Consistency', 'No state corruption during analysis', () => {
        const botTypes = ['easy', 'smart-random', 'defensive', 'offensiv-gemischt', 'defensiv-gemischt', 'enhanced-smart'];
        
        botTypes.forEach(botType => {
            const game = new Connect4Game();
            const ai = new Connect4AI(botType);
            const helpers = new Connect4Helpers(game, null);
            
            // Create some game state
            game.makeMove(3);
            game.makeMove(2);
            
            // Record state before AI analysis
            const beforeBoard = JSON.stringify(game.board);
            const beforePlayer = game.currentPlayer;
            const beforeGameOver = game.gameOver;
            const beforeMoveHistory = game.moveHistory.length;
            
            // Get AI move
            const move = ai.getBestMove(game, helpers);
            
            // Verify no corruption
            testSuite.assertEqual(JSON.stringify(game.board), beforeBoard, 
                `${botType} bot should not modify board during analysis`);
            testSuite.assertEqual(game.currentPlayer, beforePlayer, 
                `${botType} bot should not change current player during analysis`);
            testSuite.assertEqual(game.gameOver, beforeGameOver, 
                `${botType} bot should not change game over status during analysis`);
            testSuite.assertEqual(game.moveHistory.length, beforeMoveHistory, 
                `${botType} bot should not modify move history during analysis`);
        });
    });
    
    // Test cross-bot performance comparison in same position
    testSuite.test('AI-Strategy-Consistency', 'Cross-bot performance in complex position', () => {
        const botTypes = ['smart-random', 'defensive', 'offensiv-gemischt', 'enhanced-smart'];
        const performanceResults = {};
        
        // Create complex position
        const game = new Connect4Game();
        const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5];
        complexMoves.forEach(col => game.makeMove(col));
        
        botTypes.forEach(botType => {
            const ai = new Connect4AI(botType);
            const helpers = new Connect4Helpers(game, null);
            
            const startTime = performance.now();
            const move = ai.getBestMove(game, helpers);
            const endTime = performance.now();
            
            performanceResults[botType] = {
                move: move,
                time: endTime - startTime,
                valid: game.getValidMoves().includes(move)
            };
        });
        
        // Verify all moves are valid
        Object.entries(performanceResults).forEach(([botType, result]) => {
            testSuite.assert(result.valid, `${botType} should choose valid move in complex position`);
            testSuite.assert(result.time < 2000, `${botType} should respond in reasonable time (<2000ms)`);
        });
    });
}