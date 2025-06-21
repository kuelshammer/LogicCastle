/**
 * Helper-System Regression Tests
 * 
 * Coverage: State Corruption Prevention, Game State Isolation Tests,
 * Anti-Chaos Validation, Board Simulation Accuracy, Historical Bug Prevention
 */
function runHelperSystemRegressionTests(testSuite) {
    
    // Test helper state corruption prevention (primary regression)
    testSuite.test('Helper-System-Regression', 'Helper state corruption prevention', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create test state
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(4);
        
        const immutableSnapshot = {
            board: JSON.stringify(game.board),
            currentPlayer: game.currentPlayer,
            gameOver: game.gameOver,
            winner: game.winner,
            moveHistory: JSON.stringify(game.moveHistory),
            winningCells: game.winningCells
        };
        
        // Run all helper functions that previously corrupted state
        helpers.setEnabled(true, 2);
        helpers.updateHints();
        helpers.analyzeEvenOddThreats();
        helpers.detectZugzwang();
        helpers.analyzeForkOpportunities();
        helpers.getEnhancedStrategicEvaluation();
        helpers.hasOpponentBuiltTrap();
        
        // Test specific functions that were problematic
        for (let col = 0; col < 7; col++) {
            helpers.analyzeMoveConsequences(col);
            helpers.countThreatsAfterMove(col);
            helpers.countThreatsForPlayer(col, game.PLAYER1);
            helpers.countThreatsForPlayer(col, game.PLAYER2);
        }
        
        // Verify COMPLETE state isolation
        testSuite.assertEqual(JSON.stringify(game.board), immutableSnapshot.board, 
            'Game board should never be modified by helper functions');
        testSuite.assertEqual(game.currentPlayer, immutableSnapshot.currentPlayer, 
            'Current player should never be modified by helper functions');
        testSuite.assertEqual(game.gameOver, immutableSnapshot.gameOver, 
            'Game over status should never be modified by helper functions');
        testSuite.assertEqual(game.winner, immutableSnapshot.winner, 
            'Winner should never be modified by helper functions');
        testSuite.assertEqual(JSON.stringify(game.moveHistory), immutableSnapshot.moveHistory, 
            'Move history should never be modified by helper functions');
        testSuite.assertEqual(game.winningCells, immutableSnapshot.winningCells, 
            'Winning cells should never be modified by helper functions');
    });
    
    // Test board simulation vs live board isolation
    testSuite.test('Helper-System-Regression', 'Board simulation vs live board isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position
        game.makeMove(3);
        game.makeMove(2);
        
        const originalBoardState = game.getBoard();
        const originalBoardString = JSON.stringify(originalBoardState);
        
        // Operations that use board simulation
        const boardCopy1 = helpers.copyBoard(game.board);
        const boardCopy2 = helpers.copyBoard(game.board);
        const boardCopy3 = helpers.copyBoard(game.board);
        
        // Modify all copies
        boardCopy1[0][0] = game.PLAYER1;
        boardCopy2[1][1] = game.PLAYER2;
        boardCopy3[2][2] = game.PLAYER1;
        
        // Original board should be completely unchanged
        testSuite.assertEqual(JSON.stringify(game.getBoard()), originalBoardString, 
            'Original board should be unaffected by board copy modifications');
        
        // Copies should be independent
        testSuite.assertNotEqual(boardCopy1[0][0], boardCopy2[0][0], 
            'Board copies should be independent');
        testSuite.assertNotEqual(boardCopy2[1][1], boardCopy3[1][1], 
            'Board copies should be independent');
    });
    
    // Test helper functions use simulation not direct manipulation
    testSuite.test('Helper-System-Regression', 'Helper functions use simulation not direct manipulation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create strategic position
        game.board[5][0] = game.PLAYER1; // Red
        game.board[5][1] = game.PLAYER1; // Red
        game.board[4][0] = game.PLAYER2; // Yellow
        game.currentPlayer = game.PLAYER1;
        
        const boardBeforeAnalysis = JSON.stringify(game.board);
        const playerBeforeAnalysis = game.currentPlayer;
        
        // These functions should use simulation, not direct board manipulation
        helpers.evaluateThreatAtPosition(5, 2, game.PLAYER1);
        helpers.wouldOpponentWinAt(2, game.PLAYER2);
        helpers.checkWinAtPosition(5, 2, game.PLAYER1);
        helpers.wouldMoveWinOnBoard(game.board, 2, game.PLAYER1);
        
        // Board and player should be unchanged
        testSuite.assertEqual(JSON.stringify(game.board), boardBeforeAnalysis, 
            'Helper threat evaluation should not modify live board');
        testSuite.assertEqual(game.currentPlayer, playerBeforeAnalysis, 
            'Helper threat evaluation should not modify current player');
    });
    
    // Test move safety checking isolation
    testSuite.test('Helper-System-Regression', 'Move safety checking isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create trap-like position
        game.board[5][0] = game.PLAYER1; // Red
        game.board[5][1] = game.PLAYER1; // Red
        game.board[4][0] = game.PLAYER2; // Yellow
        game.currentPlayer = game.PLAYER2;
        
        const stateBeforeSafetyCheck = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver
        };
        
        // Test move safety checking
        const validMoves = game.getValidMoves();
        for (const col of validMoves) {
            const isSafe = helpers.isMoveUnsafe(col);
            
            // Verify state unchanged after each safety check
            testSuite.assertEqual(JSON.stringify(game.board), stateBeforeSafetyCheck.board, 
                `Board should be unchanged after safety check for column ${col}`);
            testSuite.assertEqual(game.currentPlayer, stateBeforeSafetyCheck.player, 
                `Player should be unchanged after safety check for column ${col}`);
            testSuite.assertEqual(game.gameOver, stateBeforeSafetyCheck.gameOver, 
                `Game state should be unchanged after safety check for column ${col}`);
        }
    });
    
    // Test fork evaluation isolation
    testSuite.test('Helper-System-Regression', 'Fork evaluation isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position suitable for fork analysis
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red
        game.board[4][1] = game.PLAYER2; // Yellow
        game.currentPlayer = game.PLAYER1;
        
        const preAnalysisState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver,
            moveHistory: [...game.moveHistory]
        };
        
        // Test fork evaluation for all columns
        const validMoves = game.getValidMoves();
        for (const col of validMoves) {
            const forkPotential = helpers.evaluateForkPotential(col);
            
            testSuite.assertNotNull(forkPotential, `Should return fork potential for column ${col}`);
            testSuite.assert(typeof forkPotential.threats === 'number', 
                `Fork potential threats should be numeric for column ${col}`);
        }
        
        // Verify complete state preservation
        testSuite.assertEqual(JSON.stringify(game.board), preAnalysisState.board, 
            'Board should be unchanged after fork evaluation');
        testSuite.assertEqual(game.currentPlayer, preAnalysisState.player, 
            'Player should be unchanged after fork evaluation');
        testSuite.assertEqual(game.gameOver, preAnalysisState.gameOver, 
            'Game state should be unchanged after fork evaluation');
        testSuite.assertEqual(JSON.stringify(game.moveHistory), JSON.stringify(preAnalysisState.moveHistory), 
            'Move history should be unchanged after fork evaluation');
    });
    
    // Test zugzwang detection doesn't corrupt game state
    testSuite.test('Helper-System-Regression', 'Zugzwang detection state isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create complex position for zugzwang analysis
        game.makeMove(3); // Red
        game.makeMove(2); // Yellow
        game.makeMove(3); // Red
        game.makeMove(4); // Yellow
        game.makeMove(2); // Red
        
        const complexState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver,
            moveHistory: [...game.moveHistory]
        };
        
        // Run zugzwang detection multiple times
        for (let i = 0; i < 5; i++) {
            const zugzwangMoves = helpers.detectZugzwang();
            
            testSuite.assertNotNull(zugzwangMoves, `Zugzwang detection ${i + 1} should return result`);
            testSuite.assert(Array.isArray(zugzwangMoves), `Zugzwang detection ${i + 1} should return array`);
            
            // Verify state unchanged after each detection
            testSuite.assertEqual(JSON.stringify(game.board), complexState.board, 
                `Board should be unchanged after zugzwang detection ${i + 1}`);
            testSuite.assertEqual(game.currentPlayer, complexState.player, 
                `Player should be unchanged after zugzwang detection ${i + 1}`);
            testSuite.assertEqual(game.gameOver, complexState.gameOver, 
                `Game state should be unchanged after zugzwang detection ${i + 1}`);
        }
    });
    
    // Test even/odd analysis doesn't affect game parity
    testSuite.test('Helper-System-Regression', 'Even/odd analysis game parity isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position with clear even/odd implications
        game.board[5][0] = game.PLAYER1; // Red bottom (odd row in 0-based)
        game.board[4][0] = game.PLAYER2; // Yellow (even row in 0-based)
        game.board[5][1] = game.PLAYER1; // Red
        game.board[4][1] = game.PLAYER2; // Yellow
        game.currentPlayer = game.PLAYER1;
        
        const parityState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver
        };
        
        // Run even/odd analysis extensively
        for (let i = 0; i < 10; i++) {
            const evenOddAnalysis = helpers.analyzeEvenOddThreats();
            
            testSuite.assertNotNull(evenOddAnalysis, `Even/odd analysis ${i + 1} should return result`);
            testSuite.assertNotNull(evenOddAnalysis.parity, `Even/odd analysis ${i + 1} should determine parity`);
            
            // Verify analysis doesn't corrupt game state
            testSuite.assertEqual(JSON.stringify(game.board), parityState.board, 
                `Board should be unchanged after even/odd analysis ${i + 1}`);
            testSuite.assertEqual(game.currentPlayer, parityState.player, 
                `Player should be unchanged after even/odd analysis ${i + 1}`);
            testSuite.assertEqual(game.gameOver, parityState.gameOver, 
                `Game state should be unchanged after even/odd analysis ${i + 1}`);
        }
    });
    
    // Test that helpers don't trigger game events unexpectedly
    testSuite.test('Helper-System-Regression', 'Helpers do not trigger unexpected game events', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        let unexpectedEvents = [];
        const gameEventTypes = ['moveMade', 'playerChanged', 'gameWon', 'gameDraw', 'gameReset'];
        
        // Monitor for unexpected game events
        gameEventTypes.forEach(eventType => {
            game.on(eventType, (data) => {
                unexpectedEvents.push(eventType);
            });
        });
        
        // Run helper analysis that should not trigger game events
        helpers.setEnabled(true, 2);
        helpers.analyzeEvenOddThreats();
        helpers.detectZugzwang();
        helpers.analyzeForkOpportunities();
        helpers.getEnhancedStrategicEvaluation();
        
        for (let col = 0; col < 7; col++) {
            helpers.analyzeMoveConsequences(col);
            helpers.evaluateThreatAtPosition(2, col, game.PLAYER1);
            helpers.countThreatsForPlayer(col, game.PLAYER2);
        }
        
        testSuite.assertEqual(unexpectedEvents.length, 0, 
            `Helper analysis should not trigger game events. Triggered: ${unexpectedEvents.join(', ')}`);
    });
    
    // Test currentPlayer manipulation prevention
    testSuite.test('Helper-System-Regression', 'CurrentPlayer manipulation prevention', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Test both players
        const players = [game.PLAYER1, game.PLAYER2];
        
        for (const player of players) {
            game.currentPlayer = player;
            const originalPlayer = game.currentPlayer;
            
            // Run operations that might manipulate currentPlayer
            helpers.analyzeThreats();
            helpers.analyzeOpportunities();
            helpers.wouldOpponentWinAt(3, player === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1);
            
            // Check multiple columns
            for (let col = 0; col < 7; col++) {
                helpers.analyzeMoveConsequences(col);
                helpers.countThreatsAfterMove(col);
            }
            
            testSuite.assertEqual(game.currentPlayer, originalPlayer, 
                `Current player should remain ${originalPlayer} after helper operations`);
        }
    });
    
    // Test board copy independence (prevent reference sharing)
    testSuite.test('Helper-System-Regression', 'Board copy independence validation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create varied board state
        game.board[5][3] = game.PLAYER1;
        game.board[4][3] = game.PLAYER2;
        game.board[5][2] = game.PLAYER1;
        game.board[3][3] = game.PLAYER1;
        
        const originalBoard = helpers.copyBoard(game.board);
        
        // Create multiple copies
        const copies = [];
        for (let i = 0; i < 5; i++) {
            copies.push(helpers.copyBoard(game.board));
        }
        
        // Modify each copy differently
        copies.forEach((copy, index) => {
            copy[0][index] = game.PLAYER1;
            copy[1][index] = game.PLAYER2;
        });
        
        // Verify original board unchanged
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                testSuite.assertEqual(game.board[row][col], originalBoard[row][col], 
                    `Original board[${row}][${col}] should be unchanged`);
            }
        }
        
        // Verify copies are independent
        for (let i = 0; i < copies.length; i++) {
            for (let j = i + 1; j < copies.length; j++) {
                testSuite.assertNotEqual(copies[i][0][i], copies[j][0][j], 
                    `Copy ${i} and copy ${j} should be independent`);
            }
        }
    });
    
    // Test board state immutability during complex analysis
    testSuite.test('Helper-System-Regression', 'Board state immutability during complex analysis', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create complex near-endgame position
        const endgameMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0, 6, 0, 6, 3, 2, 4, 1, 5];
        endgameMoves.forEach(col => {
            if (game.getValidMoves().includes(col)) {
                game.makeMove(col);
            }
        });
        
        const complexBoardState = JSON.stringify(game.board);
        const complexGameState = {
            player: game.currentPlayer,
            gameOver: game.gameOver,
            winner: game.winner,
            moveHistory: [...game.moveHistory]
        };
        
        // Run comprehensive analysis that stress-tests state isolation
        helpers.setEnabled(true, 2);
        
        // Multiple rounds of full analysis
        for (let round = 0; round < 3; round++) {
            helpers.updateHints();
            
            const evenOdd = helpers.analyzeEvenOddThreats();
            const zugzwang = helpers.detectZugzwang();
            const forks = helpers.analyzeForkOpportunities();
            const strategic = helpers.getEnhancedStrategicEvaluation();
            
            // Analyze every valid move
            const validMoves = game.getValidMoves();
            for (const col of validMoves) {
                helpers.analyzeMoveConsequences(col);
                helpers.evaluateThreatAtPosition(0, col, game.PLAYER1);
                helpers.evaluateThreatAtPosition(0, col, game.PLAYER2);
                helpers.countThreatsForPlayer(col, game.PLAYER1);
                helpers.countThreatsForPlayer(col, game.PLAYER2);
            }
            
            // Verify state unchanged after each round
            testSuite.assertEqual(JSON.stringify(game.board), complexBoardState, 
                `Board should be unchanged after analysis round ${round + 1}`);
            testSuite.assertEqual(game.currentPlayer, complexGameState.player, 
                `Player should be unchanged after analysis round ${round + 1}`);
            testSuite.assertEqual(game.gameOver, complexGameState.gameOver, 
                `Game over status should be unchanged after analysis round ${round + 1}`);
            testSuite.assertEqual(game.winner, complexGameState.winner, 
                `Winner should be unchanged after analysis round ${round + 1}`);
        }
    });
    
    // Test against specific historical corruption bugs
    testSuite.test('Helper-System-Regression', 'Historical corruption bug prevention', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Recreate scenarios that historically caused corruption
        
        // Scenario 1: Opponent win detection modifying currentPlayer
        game.board[5][0] = game.PLAYER1;
        game.board[5][1] = game.PLAYER1;
        game.board[5][2] = game.PLAYER1;
        game.currentPlayer = game.PLAYER2; // Yellow needs to block
        
        const scenario1State = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer
        };
        
        // This historically caused currentPlayer corruption
        const wouldWin = helpers.wouldOpponentWinAt(3, game.PLAYER1);
        testSuite.assertTruthy(wouldWin, 'Should detect opponent win');
        testSuite.assertEqual(JSON.stringify(game.board), scenario1State.board, 
            'Board should be unchanged after opponent win detection');
        testSuite.assertEqual(game.currentPlayer, scenario1State.player, 
            'CurrentPlayer should be unchanged after opponent win detection');
        
        // Scenario 2: Threat counting affecting board state
        game.resetGame();
        game.board[5][1] = game.PLAYER1;
        game.board[4][1] = game.PLAYER2;
        game.board[3][1] = game.PLAYER1;
        game.currentPlayer = game.PLAYER2;
        
        const scenario2State = JSON.stringify(game.board);
        
        // This historically affected board state
        const threatCount = helpers.countThreatsForPlayer(1, game.PLAYER1);
        testSuite.assert(typeof threatCount === 'number', 'Should return numeric threat count');
        testSuite.assertEqual(JSON.stringify(game.board), scenario2State, 
            'Board should be unchanged after threat counting');
        
        // Scenario 3: Strategic evaluation cascading corruption
        game.resetGame();
        game.makeMove(3);
        game.makeMove(2);
        game.makeMove(4);
        
        const scenario3State = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver
        };
        
        // This historically caused cascading state changes
        const strategicEval = helpers.getEnhancedStrategicEvaluation();
        testSuite.assertNotNull(strategicEval, 'Should return strategic evaluation');
        testSuite.assertEqual(JSON.stringify(game.board), scenario3State.board, 
            'Board should be unchanged after strategic evaluation');
        testSuite.assertEqual(game.currentPlayer, scenario3State.player, 
            'Player should be unchanged after strategic evaluation');
        testSuite.assertEqual(game.gameOver, scenario3State.gameOver, 
            'Game state should be unchanged after strategic evaluation');
    });
}