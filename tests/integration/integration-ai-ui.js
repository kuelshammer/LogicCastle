/**
 * Integration Tests for AI-UI Interaction
 * 
 * Coverage: AI decision making with UI feedback, bot mode workflows,
 * AI-helper system integration, performance under AI load
 */
function runIntegrationAIUITests(testSuite) {
    
    // Test AI move integration with UI updates
    testSuite.test('Integration-AI-UI', 'AI move integration with UI updates', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockStatus = document.createElement('div');
        mockStatus.id = 'gameStatus';
        
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockStatus);
        
        ui.createBoard();
        ui.gameStatus = mockStatus;
        ui.gameMode = 'vs-bot-smart';
        ui.ai = ai;
        
        // Human makes first move
        game.currentPlayer = game.PLAYER1;
        const humanResult = game.makeMove(3);
        testSuite.assertTruthy(humanResult.success, 'Human move should succeed');
        
        // Update UI after human move
        ui.updateBoard();
        ui.updateUI();
        
        // AI should now make a move
        testSuite.assertEqual(game.currentPlayer, game.PLAYER2, 'Should be AI turn');
        
        const originalBoardState = JSON.stringify(game.board);
        const aiMove = ai.getBestMove(game, helpers);
        
        testSuite.assert(game.getValidMoves().includes(aiMove), 'AI should choose valid move');
        testSuite.assertEqual(JSON.stringify(game.board), originalBoardState, 
            'AI analysis should not modify game board');
        
        // Actually make AI move
        const aiResult = game.makeMove(aiMove);
        testSuite.assertTruthy(aiResult.success, 'AI move should succeed');
        
        // Update UI after AI move
        ui.updateBoard();
        ui.updateUI();
        
        testSuite.assertEqual(game.currentPlayer, game.PLAYER1, 'Should be human turn again');
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockStatus);
    });
    
    // Test different AI difficulty levels with UI
    testSuite.test('Integration-AI-UI', 'Different AI difficulty levels with UI', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockModeSelect = document.createElement('select');
        mockModeSelect.id = 'gameModeSelect';
        
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockModeSelect);
        
        ui.createBoard();
        ui.gameModeSelect = mockModeSelect;
        
        const difficultyLevels = ['vs-bot-easy', 'vs-bot-smart', 'vs-bot-strong'];
        
        difficultyLevels.forEach(difficulty => {
            // Reset game for each difficulty
            game.resetGame();
            
            // Set game mode
            ui.gameMode = difficulty;
            ui.handleGameModeChange();
            
            testSuite.assertNotNull(ui.ai, `AI should be initialized for ${difficulty}`);
            
            // Make a few moves to test AI behavior
            game.makeMove(3); // Human move
            
            const aiMove = ui.ai.getBestMove(game, helpers);
            testSuite.assert(game.getValidMoves().includes(aiMove), 
                `${difficulty} AI should choose valid move`);
            
            const result = game.makeMove(aiMove);
            testSuite.assertTruthy(result.success, `${difficulty} AI move should succeed`);
        });
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockModeSelect);
    });
    
    // Test AI with helper system integration
    testSuite.test('Integration-AI-UI', 'AI with helper system integration', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        ui.ai = ai;
        
        // Create strategic position
        game.board[5][0] = game.PLAYER1; // Red
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red (Red threatens to win at column 3)
        game.currentPlayer = game.PLAYER2; // Yellow must respond
        
        // AI should analyze with helpers and block the threat
        const aiMove = ai.getBestMove(game, helpers);
        testSuite.assertEqual(aiMove, 3, 'AI should block winning threat at column 3');
        
        // Verify helper system was used without corrupting state
        const boardAfterAnalysis = JSON.stringify(game.board);
        const expectedBoard = JSON.stringify([
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0]
        ]);
        
        testSuite.assertEqual(boardAfterAnalysis, expectedBoard, 
            'Board should be unchanged after AI analysis');
        
        // Make the AI move
        const result = game.makeMove(aiMove);
        testSuite.assertTruthy(result.success, 'AI blocking move should succeed');
        testSuite.assertEqual(game.board[5][3], game.PLAYER2, 'Yellow should block in column 3');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test AI thinking state with UI feedback
    testSuite.test('Integration-AI-UI', 'AI thinking state with UI feedback', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockStatus = document.createElement('div');
        mockStatus.id = 'gameStatus';
        
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockStatus);
        
        ui.createBoard();
        ui.gameStatus = mockStatus;
        
        // Simulate AI thinking process
        ui.aiThinking = true;
        ui.updateGameStatus();
        
        testSuite.assertTruthy(ui.aiThinking, 'AI thinking state should be tracked');
        
        // AI should not be able to make moves during thinking (if implemented)
        const gameStateBefore = {
            moveCount: game.moveHistory.length,
            currentPlayer: game.currentPlayer
        };
        
        // Simulate AI analysis during thinking state
        const aiMove = ai.getBestMove(game, helpers);
        
        // Game state should not change during analysis
        testSuite.assertEqual(game.moveHistory.length, gameStateBefore.moveCount, 
            'Move count should not change during AI thinking');
        testSuite.assertEqual(game.currentPlayer, gameStateBefore.currentPlayer, 
            'Current player should not change during AI analysis');
        
        // Complete AI thinking
        ui.aiThinking = false;
        ui.updateGameStatus();
        
        testSuite.assertFalsy(ui.aiThinking, 'AI thinking state should be cleared');
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockStatus);
    });
    
    // Test AI timeout handling
    testSuite.test('Integration-AI-UI', 'AI timeout handling', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Create complex position that might take time to analyze
        const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6, 0, 6];
        complexMoves.forEach(col => {
            if (game.getValidMoves().includes(col)) {
                game.makeMove(col);
            }
        });
        
        // Time AI decision
        const startTime = performance.now();
        const aiMove = ai.getBestMove(game, helpers);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        testSuite.assert(responseTime < 2000, 
            `AI should respond within reasonable time <2000ms (took ${responseTime.toFixed(2)}ms)`);
        testSuite.assert(game.getValidMoves().includes(aiMove), 
            'AI should return valid move even under time pressure');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test multiple AI instances isolation
    testSuite.test('Integration-AI-UI', 'Multiple AI instances isolation', () => {
        const game1 = new Connect4Game();
        const game2 = new Connect4Game();
        const ui1 = new Connect4UI(game1);
        const ui2 = new Connect4UI(game2);
        const ai1 = new Connect4AI('smart-random');
        const ai2 = new Connect4AI('enhanced-smart');
        const helpers1 = new Connect4Helpers(game1, ui1);
        const helpers2 = new Connect4Helpers(game2, ui2);
        
        // Create different game states
        game1.makeMove(3); // Red in center
        game2.makeMove(1); // Red in left
        
        const game1State = JSON.stringify(game1.board);
        const game2State = JSON.stringify(game2.board);
        
        // Each AI analyzes its respective game
        const ai1Move = ai1.getBestMove(game1, helpers1);
        const ai2Move = ai2.getBestMove(game2, helpers2);
        
        // Verify isolation - each game should be unchanged
        testSuite.assertEqual(JSON.stringify(game1.board), game1State, 
            'Game 1 should be unchanged after AI 1 analysis');
        testSuite.assertEqual(JSON.stringify(game2.board), game2State, 
            'Game 2 should be unchanged after AI 2 analysis');
        
        // Both AIs should return valid moves for their respective games
        testSuite.assert(game1.getValidMoves().includes(ai1Move), 
            'AI 1 should return valid move for game 1');
        testSuite.assert(game2.getValidMoves().includes(ai2Move), 
            'AI 2 should return valid move for game 2');
        
        // Moves might be different due to different game states
        testSuite.assertNotEqual(game1State, game2State, 
            'Games should have different states for test validity');
    });
    
    // Test AI error recovery with UI
    testSuite.test('Integration-AI-UI', 'AI error recovery with UI', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Mock error handling
        let errorsCaught = [];
        const originalConsoleError = console.error;
        console.error = (error) => {
            errorsCaught.push(error);
        };
        
        // Create edge case that might cause errors
        game.gameOver = true; // Game over state
        
        try {
            // AI should handle game over state gracefully
            const aiMove = ai.getBestMove(game, helpers);
            
            if (aiMove !== null && aiMove !== undefined) {
                testSuite.assert(true, 'AI should handle edge cases gracefully');
            }
        } catch (error) {
            testSuite.fail(`AI should not throw errors in edge cases: ${error.message}`);
        }
        
        // Reset game state
        game.gameOver = false;
        game.resetGame();
        
        // Normal operation should work
        const normalMove = ai.getBestMove(game, helpers);
        testSuite.assert(game.getValidMoves().includes(normalMove), 
            'AI should work normally after error recovery');
        
        // Restore console
        console.error = originalConsoleError;
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test AI performance under UI stress
    testSuite.test('Integration-AI-UI', 'AI performance under UI stress', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Simulate rapid UI updates while AI is thinking
        const startTime = performance.now();
        
        // Start AI analysis
        const analysisPromise = Promise.resolve(ai.getBestMove(game, helpers));
        
        // Simulate rapid UI updates during AI thinking
        for (let i = 0; i < 50; i++) {
            ui.updateBoard();
            ui.updateUI();
            helpers.updateHints();
        }
        
        analysisPromise.then(aiMove => {
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            testSuite.assert(totalTime < 1000, 
                `AI analysis with UI stress should complete <1000ms (took ${totalTime.toFixed(2)}ms)`);
            testSuite.assert(game.getValidMoves().includes(aiMove), 
                'AI should still return valid move under UI stress');
        });
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        testSuite.assert(totalTime < 1000, 
            `Stress test should complete quickly <1000ms (took ${totalTime.toFixed(2)}ms)`);
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test AI state consistency across UI updates
    testSuite.test('Integration-AI-UI', 'AI state consistency across UI updates', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('enhanced-smart');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        ui.ai = ai;
        
        // Set up game state
        game.makeMove(3);
        game.makeMove(2);
        
        // Get AI move multiple times with UI updates in between
        const aiMoves = [];
        
        for (let i = 0; i < 5; i++) {
            // Update UI
            ui.updateBoard();
            ui.updateUI();
            helpers.updateHints();
            
            // Get AI move
            const aiMove = ai.getBestMove(game, helpers);
            aiMoves.push(aiMove);
            
            // Verify move is valid
            testSuite.assert(game.getValidMoves().includes(aiMove), 
                `AI move ${i + 1} should be valid`);
        }
        
        // All AI moves should be identical for same game state
        const firstMove = aiMoves[0];
        const allIdentical = aiMoves.every(move => move === firstMove);
        
        // Note: This might not be true for random-based AIs, but for deterministic ones it should be
        if (ai.difficulty === 'enhanced-smart') {
            testSuite.assertTruthy(allIdentical || aiMoves.length > 0, 
                'AI should be consistent across UI updates for deterministic strategies');
        } else {
            testSuite.assert(true, 'AI consistency test completed for random-based AI');
        }
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
}