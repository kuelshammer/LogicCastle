/**
 * Regression Tests for Animation Chaos Bug
 * 
 * CRITICAL BUG HISTORY:
 * - Enhanced Smart Bot caused animation chaos in all columns
 * - Root cause: Helper functions directly manipulated game state
 * - Fix: Replaced direct manipulation with board simulation
 * 
 * These tests ensure the bug never returns
 */
function runRegressionAnimationChaosTests(testSuite) {
    
    // Test that Enhanced Smart Bot doesn't trigger animation chaos
    testSuite.test('Regression-Animation-Chaos', 'Enhanced Smart Bot state isolation', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Record initial state
        const initialBoard = game.getBoard();
        const initialPlayer = game.currentPlayer;
        const initialGameOver = game.gameOver;
        const initialMoveHistory = [...game.moveHistory];
        
        // This operation previously caused state corruption
        const move = ai.getBestMove(game, helpers);
        
        // Verify ZERO state corruption
        testSuite.assertEqual(game.currentPlayer, initialPlayer, 
            'Enhanced Smart Bot should NOT change current player during analysis');
        testSuite.assertEqual(game.gameOver, initialGameOver, 
            'Enhanced Smart Bot should NOT change game over status');
        testSuite.assertEqual(game.moveHistory.length, initialMoveHistory.length, 
            'Enhanced Smart Bot should NOT modify move history');
        
        // Verify board completely unchanged
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                testSuite.assertEqual(game.board[row][col], initialBoard[row][col], 
                    `Board cell [${row}][${col}] should be unchanged after Enhanced Bot analysis`);
            }
        }
        
        testSuite.assert(game.getValidMoves().includes(move), 
            'Enhanced Smart Bot should return valid move');
    });
    
    // Test that strategic analysis functions don't corrupt state
    testSuite.test('Regression-Animation-Chaos', 'Strategic analysis state isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create complex game state
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(4);
        game.makeMove(1);
        
        const beforeAnalysis = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver,
            moveHistory: game.moveHistory.length
        };
        
        // Run strategic analysis (previously corrupted state)
        const evenOddAnalysis = helpers.analyzeEvenOddThreats();
        const zugzwangMoves = helpers.detectZugzwang();
        const forkOpportunities = helpers.analyzeForkOpportunities();
        const strategicEval = helpers.getEnhancedStrategicEvaluation();
        
        // Verify NO corruption after strategic analysis
        testSuite.assertEqual(JSON.stringify(game.board), beforeAnalysis.board, 
            'Board should be unchanged after strategic analysis');
        testSuite.assertEqual(game.currentPlayer, beforeAnalysis.player, 
            'Current player should be unchanged after strategic analysis');
        testSuite.assertEqual(game.gameOver, beforeAnalysis.gameOver, 
            'Game over status should be unchanged after strategic analysis');
        testSuite.assertEqual(game.moveHistory.length, beforeAnalysis.moveHistory, 
            'Move history should be unchanged after strategic analysis');
        
        // Verify analysis returns valid data
        testSuite.assertNotNull(evenOddAnalysis, 'Even/Odd analysis should return data');
        testSuite.assertNotNull(zugzwangMoves, 'Zugzwang analysis should return data');
        testSuite.assertNotNull(forkOpportunities, 'Fork analysis should return data');
        testSuite.assertNotNull(strategicEval, 'Strategic evaluation should return data');
    });
    
    // Test that helper functions use board simulation correctly
    testSuite.test('Regression-Animation-Chaos', 'Helper functions use board simulation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create test position
        game.makeMove(3);
        game.makeMove(2);
        
        const originalBoard = JSON.stringify(game.board);
        
        // Test specific helper functions that previously corrupted state
        helpers.hasOpponentBuiltTrap();
        testSuite.assertEqual(JSON.stringify(game.board), originalBoard, 
            'hasOpponentBuiltTrap should not modify game board');
        
        helpers.analyzeMoveConsequences(1);
        testSuite.assertEqual(JSON.stringify(game.board), originalBoard, 
            'analyzeMoveConsequences should not modify game board');
        
        helpers.countThreatsAfterMove(4);
        testSuite.assertEqual(JSON.stringify(game.board), originalBoard, 
            'countThreatsAfterMove should not modify game board');
        
        helpers.evaluateThreatAtPosition(2, 3, game.PLAYER1);
        testSuite.assertEqual(JSON.stringify(game.board), originalBoard, 
            'evaluateThreatAtPosition should not modify game board');
    });
    
    // Test multiple consecutive Enhanced Bot calls don't cause chaos
    testSuite.test('Regression-Animation-Chaos', 'Multiple Enhanced Bot calls isolation', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Create initial state
        game.makeMove(3);
        const stableState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver
        };
        
        // Make multiple AI calls (this previously caused cumulative corruption)
        for (let i = 0; i < 10; i++) {
            const move = ai.getBestMove(game, helpers);
            
            // Verify state unchanged after each call
            testSuite.assertEqual(JSON.stringify(game.board), stableState.board, 
                `Board should be unchanged after Enhanced Bot call ${i + 1}`);
            testSuite.assertEqual(game.currentPlayer, stableState.player, 
                `Player should be unchanged after Enhanced Bot call ${i + 1}`);
            testSuite.assertEqual(game.gameOver, stableState.gameOver, 
                `Game over status should be unchanged after Enhanced Bot call ${i + 1}`);
            
            testSuite.assert(game.getValidMoves().includes(move), 
                `Enhanced Bot call ${i + 1} should return valid move`);
        }
    });
    
    // Test that game events are not triggered during AI analysis
    testSuite.test('Regression-Animation-Chaos', 'No spurious events during AI analysis', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        let eventCount = 0;
        const eventTypes = [];
        
        // Monitor all game events
        ['moveMade', 'playerChanged', 'gameWon', 'gameDraw', 'gameReset', 'boardStateChanged'].forEach(eventType => {
            game.on(eventType, () => {
                eventCount++;
                eventTypes.push(eventType);
            });
        });
        
        // Get AI move (should not trigger any events)
        const move = ai.getBestMove(game, helpers);
        
        testSuite.assertEqual(eventCount, 0, 
            `No events should be triggered during AI analysis. Triggered: ${eventTypes.join(', ')}`);
        testSuite.assert(game.getValidMoves().includes(move), 'Should return valid move');
    });
    
    // Test AI performance doesn't degrade due to simulation overhead
    testSuite.test('Regression-Animation-Chaos', 'AI performance after simulation fix', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Create complex position for performance test
        const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6];
        complexMoves.forEach(col => {
            if (game.getValidMoves().includes(col)) {
                game.makeMove(col);
            }
        });
        
        const startTime = performance.now();
        const move = ai.getBestMove(game, helpers);
        const endTime = performance.now();
        
        const responseTime = endTime - startTime;
        
        // Should still perform well despite using simulation
        testSuite.assert(responseTime < 2000, 
            `Enhanced Bot should respond in reasonable time <2000ms (took ${responseTime.toFixed(2)}ms)`);
        testSuite.assert(game.getValidMoves().includes(move), 
            'Should return valid move in complex position');
    });
    
    // Test specific bug reproduction scenario
    testSuite.test('Regression-Animation-Chaos', 'Bug reproduction scenario prevention', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Recreate the exact scenario that caused the original bug:
        // 1. Player makes first move
        // 2. Enhanced Smart Bot analyzes position
        // 3. Original bug: animations triggered in ALL columns
        
        // Player makes first move (red in center)
        const playerResult = game.makeMove(3);
        testSuite.assertTruthy(playerResult.success, 'Player move should succeed');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Should switch to Yellow (bot)');
        
        // Record state before bot analysis
        const beforeBotAnalysis = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver,
            redPieceExists: game.board[5][3] === game.PLAYER1
        };
        
        // Enhanced Smart Bot analyzes (previously caused chaos)
        const botMove = ai.getBestMove(game, helpers);
        
        // Verify NO chaos occurred
        testSuite.assertEqual(JSON.stringify(game.board), beforeBotAnalysis.board, 
            'Board should be unchanged during bot analysis');
        testSuite.assertEqual(game.currentPlayer, beforeBotAnalysis.player, 
            'Current player should be unchanged during bot analysis');
        testSuite.assertEqual(game.gameOver, beforeBotAnalysis.gameOver, 
            'Game over status should be unchanged during bot analysis');
        testSuite.assertTruthy(beforeBotAnalysis.redPieceExists, 
            'Player piece should still exist after bot analysis');
        
        // Bot should return valid move
        testSuite.assert(game.getValidMoves().includes(botMove), 
            'Enhanced Smart Bot should return valid move');
        
        // Actually make bot move to ensure game continues normally
        const botResult = game.makeMove(botMove);
        testSuite.assertTruthy(botResult.success, 'Bot move should succeed');
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should switch back to Red');
    });
    
    // Test memory stability during Extended play
    testSuite.test('Regression-Animation-Chaos', 'Memory stability during extended play', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        let analysisCount = 0;
        let corruptionDetected = false;
        
        // Play extended sequence with frequent AI analysis
        while (!game.gameOver && analysisCount < 20) {
            const beforeState = JSON.stringify(game.board);
            
            // Enhanced Bot analysis
            const move = ai.getBestMove(game, helpers);
            
            // Check for corruption
            if (JSON.stringify(game.board) !== beforeState) {
                corruptionDetected = true;
                break;
            }
            
            // Make random move to continue game
            const randomCol = game.getValidMoves()[0];
            game.makeMove(randomCol);
            
            analysisCount++;
        }
        
        testSuite.assertFalsy(corruptionDetected, 
            `No corruption should occur during extended play (${analysisCount} analyses)`);
        testSuite.assert(analysisCount >= 10, 
            'Should complete significant number of analyses without corruption');
    });
    
    // Test that the fix works under stress conditions
    testSuite.test('Regression-Animation-Chaos', 'Stress test - rapid AI calls', () => {
        const game = new Connect4Game();
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, null);
        
        // Create position
        game.makeMove(3);
        game.makeMove(2);
        
        const stableState = JSON.stringify(game.board);
        
        // Rapid-fire AI calls (stress test)
        for (let i = 0; i < 50; i++) {
            const move = ai.getBestMove(game, helpers);
            
            // Check state every 10th call
            if (i % 10 === 0) {
                testSuite.assertEqual(JSON.stringify(game.board), stableState, 
                    `Board should be stable after ${i + 1} rapid AI calls`);
            }
            
            testSuite.assert(game.getValidMoves().includes(move), 
                `Rapid AI call ${i + 1} should return valid move`);
        }
    });
}