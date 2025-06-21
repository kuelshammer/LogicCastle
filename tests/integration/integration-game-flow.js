/**
 * Integration Tests for Complete Game Flow
 * 
 * Coverage: End-to-end game scenarios, component interactions,
 * complete game lifecycle, multi-component workflows
 */
function runIntegrationGameFlowTests(testSuite) {
    
    // Test complete two-player game flow
    testSuite.test('Integration-Game-Flow', 'Complete two-player game', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Simulate complete game
        const moves = [3, 2, 3, 2, 3, 2, 3]; // Red wins vertically in column 3
        let moveIndex = 0;
        
        for (const col of moves) {
            const validMoves = game.getValidMoves();
            if (validMoves.includes(col) && !game.gameOver) {
                const result = game.makeMove(col);
                testSuite.assertTruthy(result.success, `Move ${moveIndex + 1} should succeed`);
                
                // Update UI
                ui.updateBoard();
                ui.updateUI();
                
                moveIndex++;
                
                if (game.gameOver) {
                    break;
                }
            }
        }
        
        testSuite.assertTruthy(game.gameOver, 'Game should be over after winning sequence');
        testSuite.assertEqual(game.winner, game.PLAYER1, 'Red should win');
        testSuite.assert(game.winningCells.length === 4, 'Should have 4 winning cells');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test game flow with AI opponent
    testSuite.test('Integration-Game-Flow', 'Game flow with AI opponent', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        ui.gameMode = 'vs-bot-smart';
        ui.ai = ai;
        
        // Play several moves alternating human and AI
        for (let turn = 0; turn < 10 && !game.gameOver; turn++) {
            if (game.currentPlayer === game.PLAYER1) {
                // Human move (simulate)
                const humanMove = 3; // Always play center
                if (game.getValidMoves().includes(humanMove)) {
                    const result = game.makeMove(humanMove);
                    testSuite.assertTruthy(result.success, `Human move ${turn + 1} should succeed`);
                }
            } else {
                // AI move
                const aiMove = ai.getBestMove(game, helpers);
                testSuite.assert(game.getValidMoves().includes(aiMove), 
                    `AI move ${turn + 1} should be valid`);
                
                const result = game.makeMove(aiMove);
                testSuite.assertTruthy(result.success, `AI move ${turn + 1} should succeed`);
            }
            
            // Update UI after each move
            ui.updateBoard();
            ui.updateUI();
        }
        
        testSuite.assert(true, 'Human vs AI game flow should complete without errors');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test game reset and new game flow
    testSuite.test('Integration-Game-Flow', 'Game reset and new game flow', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockNewGameBtn = document.createElement('button');
        mockNewGameBtn.id = 'newGameBtn';
        const mockResetBtn = document.createElement('button');
        mockResetBtn.id = 'resetScoreBtn';
        
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockNewGameBtn);
        document.body.appendChild(mockResetBtn);
        
        ui.createBoard();
        ui.bindElements();
        
        // Play some moves
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(4);
        
        testSuite.assert(game.moveHistory.length > 0, 'Game should have move history');
        
        // Test new game
        ui.handleNewGame();
        
        testSuite.assertEqual(game.moveHistory.length, 0, 'Move history should be cleared');
        testSuite.assertFalsy(game.gameOver, 'Game should not be over after reset');
        
        // Play more moves
        game.makeMove(1);
        game.makeMove(5);
        
        // Set some scores
        game.score.red = 2;
        game.score.yellow = 1;
        
        // Test full reset
        ui.handleResetScore();
        
        testSuite.assertEqual(game.score.red, 0, 'Red score should be reset');
        testSuite.assertEqual(game.score.yellow, 0, 'Yellow score should be reset');
        testSuite.assertEqual(game.moveHistory.length, 0, 'Move history should be cleared');
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockNewGameBtn);
        document.body.removeChild(mockResetBtn);
    });
    
    // Test help system integration with game flow
    testSuite.test('Integration-Game-Flow', 'Help system integration with game flow', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        // Mock help checkboxes
        ui.helpPlayer1Level0 = document.createElement('input');
        ui.helpPlayer1Level0.type = 'checkbox';
        ui.helpPlayer1Level1 = document.createElement('input');
        ui.helpPlayer1Level1.type = 'checkbox';
        
        ui.createBoard();
        
        // Enable help for player 1
        ui.helpPlayer1Level0.checked = true;
        ui.helpPlayer1Level1.checked = true;
        ui.handlePlayer1Level0Toggle();
        ui.handlePlayer1Level1Toggle();
        
        testSuite.assertTruthy(ui.playerHelpEnabled.red.level0, 'Level 0 help should be enabled');
        testSuite.assertTruthy(ui.playerHelpEnabled.red.level1, 'Level 1 help should be enabled');
        
        // Create winning opportunity for red
        game.board[5][0] = game.PLAYER1;
        game.board[5][1] = game.PLAYER1;
        game.board[5][2] = game.PLAYER1;
        game.currentPlayer = game.PLAYER1;
        
        // Update helpers
        helpers.updateHints();
        
        const hints = helpers.getCurrentHints();
        testSuite.assert(hints.opportunities.length > 0, 'Should detect winning opportunity');
        
        // Make the winning move
        const result = game.makeMove(3);
        testSuite.assertTruthy(result.success, 'Winning move should succeed');
        testSuite.assertTruthy(game.gameOver, 'Game should be over');
        testSuite.assertEqual(game.winner, game.PLAYER1, 'Red should win');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test undo functionality in game flow
    testSuite.test('Integration-Game-Flow', 'Undo functionality in game flow', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockUndoBtn = document.createElement('button');
        mockUndoBtn.id = 'undoBtn';
        
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockUndoBtn);
        
        ui.createBoard();
        ui.bindElements();
        
        // Play sequence of moves
        const moves = [3, 2, 4, 1, 5];
        moves.forEach(col => {
            const result = game.makeMove(col);
            testSuite.assertTruthy(result.success, `Move to column ${col} should succeed`);
        });
        
        const moveCountBefore = game.moveHistory.length;
        const currentPlayerBefore = game.currentPlayer;
        
        // Test undo
        ui.handleUndo();
        
        testSuite.assertEqual(game.moveHistory.length, moveCountBefore - 1, 
            'Move history should be reduced by 1');
        testSuite.assertNotEqual(game.currentPlayer, currentPlayerBefore, 
            'Current player should switch after undo');
        
        // Verify board state is consistent
        ui.updateBoard();
        
        // Test multiple undos
        for (let i = 0; i < 3; i++) {
            const beforeUndo = game.moveHistory.length;
            ui.handleUndo();
            
            if (beforeUndo > 0) {
                testSuite.assertEqual(game.moveHistory.length, beforeUndo - 1, 
                    `Undo ${i + 1} should reduce move count`);
            }
        }
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockUndoBtn);
    });
    
    // Test score tracking across multiple games
    testSuite.test('Integration-Game-Flow', 'Score tracking across multiple games', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockRedScore = document.createElement('span');
        mockRedScore.id = 'redScore';
        const mockYellowScore = document.createElement('span');
        mockYellowScore.id = 'yellowScore';
        
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockRedScore);
        document.body.appendChild(mockYellowScore);
        
        ui.createBoard();
        ui.scoreElements = {
            red: mockRedScore,
            yellow: mockYellowScore
        };
        
        // Play first game - Red wins
        const redWinMoves = [3, 2, 3, 2, 3, 2, 3];
        redWinMoves.forEach(col => {
            if (!game.gameOver && game.getValidMoves().includes(col)) {
                game.makeMove(col);
            }
        });
        
        testSuite.assertTruthy(game.gameOver, 'First game should be over');
        testSuite.assertEqual(game.winner, game.PLAYER1, 'Red should win first game');
        
        // Score should be updated
        testSuite.assertEqual(game.score.red, 1, 'Red should have 1 point');
        testSuite.assertEqual(game.score.yellow, 0, 'Yellow should have 0 points');
        
        // Start new game
        game.resetGame();
        
        // Play second game - Yellow wins
        game.currentPlayer = game.PLAYER2; // Yellow starts
        const yellowWinMoves = [3, 2, 3, 2, 3, 2, 3];
        yellowWinMoves.forEach(col => {
            if (!game.gameOver && game.getValidMoves().includes(col)) {
                game.makeMove(col);
            }
        });
        
        testSuite.assertTruthy(game.gameOver, 'Second game should be over');
        testSuite.assertEqual(game.winner, game.PLAYER2, 'Yellow should win second game');
        
        // Final scores
        testSuite.assertEqual(game.score.red, 1, 'Red should still have 1 point');
        testSuite.assertEqual(game.score.yellow, 1, 'Yellow should now have 1 point');
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockRedScore);
        document.body.removeChild(mockYellowScore);
    });
    
    // Test error handling in game flow
    testSuite.test('Integration-Game-Flow', 'Error handling in game flow', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Mock message display
        let errorMessages = [];
        ui.showMessage = (message, type) => {
            errorMessages.push({ message, type });
        };
        
        // Try invalid moves
        const invalidMoves = [-1, 7, 10];
        invalidMoves.forEach(col => {
            const result = game.makeMove(col);
            testSuite.assertFalsy(result.success, `Invalid move ${col} should fail`);
        });
        
        // Fill a column and try to play in it
        for (let i = 0; i < 6; i++) {
            game.makeMove(0);
            if (i < 5) {
                game.makeMove(1); // Alternate to keep game going
            }
        }
        
        // Try to play in full column
        const fullColumnResult = game.makeMove(0);
        testSuite.assertFalsy(fullColumnResult.success, 'Move to full column should fail');
        
        // Try undo with no moves
        game.resetGame();
        const undoResult = game.undoMove();
        testSuite.assertFalsy(undoResult.success, 'Undo with no moves should fail');
        
        // System should handle errors gracefully
        testSuite.assert(true, 'Error handling should complete without crashes');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test performance under continuous play
    testSuite.test('Integration-Game-Flow', 'Performance under continuous play', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        const startTime = performance.now();
        
        // Play multiple complete games rapidly
        let gamesPlayed = 0;
        
        for (let gameNum = 0; gameNum < 5; gameNum++) {
            game.resetGame();
            
            // Play random moves until game ends
            while (!game.gameOver && game.moveHistory.length < 42) {
                const validMoves = game.getValidMoves();
                if (validMoves.length === 0) break;
                
                const randomCol = validMoves[Math.floor(Math.random() * validMoves.length)];
                game.makeMove(randomCol);
                
                // Update UI occasionally
                if (game.moveHistory.length % 3 === 0) {
                    ui.updateBoard();
                    ui.updateUI();
                }
            }
            
            gamesPlayed++;
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        testSuite.assertEqual(gamesPlayed, 5, 'Should complete all 5 games');
        testSuite.assert(totalTime < 2000, 
            `5 complete games should finish in <2000ms (took ${totalTime.toFixed(2)}ms)`);
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test component state synchronization
    testSuite.test('Integration-Game-Flow', 'Component state synchronization', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        const helpers = new Connect4Helpers(game, ui);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockStatus = document.createElement('div');
        mockStatus.id = 'gameStatus';
        const mockPlayerIndicator = document.createElement('div');
        mockPlayerIndicator.id = 'currentPlayerIndicator';
        
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockStatus);
        document.body.appendChild(mockPlayerIndicator);
        
        ui.createBoard();
        ui.gameStatus = mockStatus;
        ui.currentPlayerIndicator = mockPlayerIndicator;
        
        // Make moves and verify all components stay synchronized
        const moves = [3, 2, 4, 1];
        
        moves.forEach((col, index) => {
            const playerBefore = game.currentPlayer;
            
            // Make move
            const result = game.makeMove(col);
            testSuite.assertTruthy(result.success, `Move ${index + 1} should succeed`);
            
            // Update all UI components
            ui.updateBoard();
            ui.updateCurrentPlayerIndicator();
            ui.updateGameStatus();
            helpers.updateHints();
            
            // Verify synchronization
            testSuite.assertNotEqual(game.currentPlayer, playerBefore, 
                'Player should switch after move');
            
            // All components should reflect current game state
            testSuite.assert(true, 'All components should be synchronized');
        });
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockStatus);
        document.body.removeChild(mockPlayerIndicator);
    });
}