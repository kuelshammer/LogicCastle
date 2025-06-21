/**
 * Helper-System Hints Tests
 * 
 * Coverage: Visual Hints System, Textual Hints Generation, Forced Move Mode,
 * Hint Priority System, UI Communication, Hint Display Management
 */
function runHelperSystemHintsTests(testSuite) {
    
    // Test hint initialization and clearing
    testSuite.test('Helper-System-Hints', 'Hint initialization and clearing', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Initially should have empty hints
        const initialHints = helpers.getCurrentHints();
        testSuite.assertEqual(initialHints.threats.length, 0, 'Should start with no threats');
        testSuite.assertEqual(initialHints.opportunities.length, 0, 'Should start with no opportunities');
        testSuite.assertEqual(initialHints.suggestions.length, 0, 'Should start with no suggestions');
        
        // Clear hints should maintain empty state
        helpers.clearAllHints();
        const clearedHints = helpers.getCurrentHints();
        testSuite.assertEqual(clearedHints.threats.length, 0, 'Should have no threats after clear');
        testSuite.assertEqual(clearedHints.opportunities.length, 0, 'Should have no opportunities after clear');
        testSuite.assertEqual(clearedHints.suggestions.length, 0, 'Should have no suggestions after clear');
    });
    
    // Test threat hint generation
    testSuite.test('Helper-System-Hints', 'Threat hint generation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create opponent threat
        game.board[5][0] = game.PLAYER1; // Red
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red (threatens at column 3)
        game.currentPlayer = game.PLAYER2; // Yellow's turn
        
        helpers.setEnabled(true, 1);
        helpers.analyzeThreats();
        
        const hints = helpers.getCurrentHints();
        testSuite.assert(hints.threats.length > 0, 'Should detect threat hints');
        
        const threat = hints.threats[0];
        testSuite.assertEqual(threat.column, 3, 'Should identify correct threat column');
        testSuite.assertEqual(threat.type, 'immediate_threat', 'Should mark as immediate threat');
        testSuite.assertEqual(threat.priority, 'critical', 'Should have critical priority');
        testSuite.assertNotNull(threat.message, 'Should have threat message');
    });
    
    // Test opportunity hint generation
    testSuite.test('Helper-System-Hints', 'Opportunity hint generation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create winning opportunity for current player
        game.board[5][0] = game.PLAYER1; // Red
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red (can win at column 3)
        game.currentPlayer = game.PLAYER1; // Red's turn
        
        helpers.setEnabled(true, 0);
        helpers.analyzeOpportunities();
        
        const hints = helpers.getCurrentHints();
        testSuite.assert(hints.opportunities.length > 0, 'Should detect opportunity hints');
        
        const opportunity = hints.opportunities[0];
        testSuite.assertEqual(opportunity.column, 3, 'Should identify correct opportunity column');
        testSuite.assertEqual(opportunity.type, 'winning_move', 'Should mark as winning move');
        testSuite.assertEqual(opportunity.priority, 'high', 'Should have high priority');
        testSuite.assertNotNull(opportunity.message, 'Should have opportunity message');
    });
    
    // Test strategic suggestion generation
    testSuite.test('Helper-System-Hints', 'Strategic suggestion generation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position with winning opportunity
        game.board[5][0] = game.PLAYER1;
        game.board[5][1] = game.PLAYER1;
        game.board[5][2] = game.PLAYER1;
        game.currentPlayer = game.PLAYER1;
        
        helpers.setEnabled(true, 2);
        helpers.analyzeOpportunities();
        helpers.generateStrategicSuggestions();
        
        const hints = helpers.getCurrentHints();
        testSuite.assert(hints.suggestions.length > 0, 'Should generate strategic suggestions');
        
        // Should prioritize winning move advice
        const suggestion = hints.suggestions[0];
        testSuite.assertEqual(suggestion.type, 'strategic_advice', 'Should be strategic advice');
        testSuite.assertEqual(suggestion.priority, 'critical', 'Should have critical priority for winning move');
        testSuite.assert(suggestion.message.includes('Gewinnzug'), 'Should mention winning move in German');
    });
    
    // Test defensive suggestion generation
    testSuite.test('Helper-System-Hints', 'Defensive suggestion generation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create threat that needs blocking
        game.board[5][0] = game.PLAYER1; // Red threat
        game.board[5][1] = game.PLAYER1; // Red threat
        game.board[5][2] = game.PLAYER1; // Red threat
        game.currentPlayer = game.PLAYER2; // Yellow must block
        
        helpers.setEnabled(true, 1);
        helpers.analyzeThreats();
        helpers.generateStrategicSuggestions();
        
        const hints = helpers.getCurrentHints();
        testSuite.assert(hints.suggestions.length > 0, 'Should generate defensive suggestions');
        
        const defensiveSuggestion = hints.suggestions.find(s => s.type === 'defensive_advice');
        testSuite.assertNotNull(defensiveSuggestion, 'Should have defensive advice');
        testSuite.assertEqual(defensiveSuggestion.priority, 'high', 'Defensive advice should have high priority');
        testSuite.assert(defensiveSuggestion.message.includes('Blockiere'), 'Should mention blocking in German');
    });
    
    // Test general strategic advice
    testSuite.test('Helper-System-Hints', 'General strategic advice generation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Early game - should suggest center play
        testSuite.assertEqual(game.moveHistory.length, 0, 'Should be early game');
        
        helpers.setEnabled(true, 2);
        helpers.addGeneralStrategicAdvice();
        
        const hints = helpers.getCurrentHints();
        testSuite.assert(hints.suggestions.length > 0, 'Should provide general strategic advice');
        
        const centerAdvice = hints.suggestions.find(s => s.message.includes('Mitte'));
        testSuite.assertNotNull(centerAdvice, 'Should suggest center play in early game');
        testSuite.assertEqual(centerAdvice.priority, 'low', 'General advice should have low priority');
    });
    
    // Test hint priority system
    testSuite.test('Helper-System-Hints', 'Hint priority system', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Test priority value function
        testSuite.assertEqual(helpers.getPriorityValue('critical'), 4, 'Critical should have highest priority value');
        testSuite.assertEqual(helpers.getPriorityValue('high'), 3, 'High should have priority value 3');
        testSuite.assertEqual(helpers.getPriorityValue('medium'), 2, 'Medium should have priority value 2');
        testSuite.assertEqual(helpers.getPriorityValue('low'), 1, 'Low should have priority value 1');
        testSuite.assertEqual(helpers.getPriorityValue('unknown'), 0, 'Unknown priority should have value 0');
    });
    
    // Test move consequence analysis
    testSuite.test('Helper-System-Hints', 'Move consequence analysis', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position where move consequences matter
        game.board[5][0] = game.PLAYER1; // Red
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red
        game.currentPlayer = game.PLAYER1; // Red can win at column 3
        
        const analysis = helpers.analyzeMoveConsequences(3);
        
        testSuite.assertNotNull(analysis, 'Should return move analysis');
        testSuite.assertTruthy(analysis.isWinning, 'Should detect winning move');
        testSuite.assertEqual(analysis.strategicValue, 'excellent', 'Winning move should be excellent');
        testSuite.assertFalsy(analysis.allowsOpponentWin, 'Winning move should not allow opponent win');
    });
    
    // Test move consequence analysis state isolation
    testSuite.test('Helper-System-Hints', 'Move consequence analysis state isolation', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create test position
        game.makeMove(3);
        game.makeMove(2);
        
        const originalState = {
            board: JSON.stringify(game.board),
            player: game.currentPlayer,
            gameOver: game.gameOver
        };
        
        // Analyze consequences for all valid moves
        const validMoves = game.getValidMoves();
        for (const col of validMoves) {
            const analysis = helpers.analyzeMoveConsequences(col);
            
            testSuite.assertNotNull(analysis, `Should analyze move ${col}`);
            
            // Verify state unchanged after each analysis
            testSuite.assertEqual(JSON.stringify(game.board), originalState.board, 
                `Board should be unchanged after analyzing move ${col}`);
            testSuite.assertEqual(game.currentPlayer, originalState.player, 
                `Player should be unchanged after analyzing move ${col}`);
            testSuite.assertEqual(game.gameOver, originalState.gameOver, 
                `Game state should be unchanged after analyzing move ${col}`);
        }
    });
    
    // Test threat counting accuracy
    testSuite.test('Helper-System-Hints', 'Threat counting accuracy', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position with known threat count
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red
        
        // Playing at column 3 should create threat at column 0
        const threatsAfterMove = helpers.countThreatsAfterMove(3);
        
        testSuite.assert(typeof threatsAfterMove === 'number', 'Should return numeric threat count');
        testSuite.assert(threatsAfterMove >= 0, 'Threat count should be non-negative');
        
        // Test specific player threat counting
        const redThreats = helpers.countThreatsForPlayer(3, game.PLAYER1);
        const yellowThreats = helpers.countThreatsForPlayer(3, game.PLAYER2);
        
        testSuite.assert(typeof redThreats === 'number', 'Red threat count should be numeric');
        testSuite.assert(typeof yellowThreats === 'number', 'Yellow threat count should be numeric');
        testSuite.assert(redThreats >= yellowThreats, 'Red should have more threats in this position');
    });
    
    // Test opponent trap detection
    testSuite.test('Helper-System-Hints', 'Opponent trap detection', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position where opponent might have built trap
        game.board[5][1] = game.PLAYER1; // Red
        game.board[5][2] = game.PLAYER1; // Red
        game.board[4][2] = game.PLAYER1; // Red stack
        game.currentPlayer = game.PLAYER2; // Yellow's turn
        
        const hasTrap = helpers.hasOpponentBuiltTrap();
        
        testSuite.assert(typeof hasTrap === 'boolean', 'Should return boolean for trap detection');
        
        // Function should not corrupt game state
        const afterBoard = JSON.stringify(game.board);
        const afterPlayer = game.currentPlayer;
        
        // Create expected state to compare
        const expectedBoard = JSON.stringify([
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0]
        ]);
        
        testSuite.assertEqual(afterBoard, expectedBoard, 'Board should be unchanged after trap detection');
        testSuite.assertEqual(afterPlayer, game.PLAYER2, 'Player should be unchanged after trap detection');
    });
    
    // Test hint state management during game progression
    testSuite.test('Helper-System-Hints', 'Hint state management during game progression', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        helpers.setEnabled(true, 2);
        
        // Play a sequence of moves and check hint consistency
        const movesToPlay = [3, 2, 4, 1, 5];
        
        for (let i = 0; i < movesToPlay.length; i++) {
            const col = movesToPlay[i];
            
            // Get hints before move
            helpers.updateHints();
            const hintsBefore = helpers.getCurrentHints();
            
            // Make move
            const result = game.makeMove(col);
            testSuite.assertTruthy(result.success, `Move ${i + 1} should succeed`);
            
            // Get hints after move
            helpers.updateHints();
            const hintsAfter = helpers.getCurrentHints();
            
            // Verify hints are properly updated (structure should be valid)
            testSuite.assert(Array.isArray(hintsAfter.threats), 'Threats should remain array after move');
            testSuite.assert(Array.isArray(hintsAfter.opportunities), 'Opportunities should remain array after move');
            testSuite.assert(Array.isArray(hintsAfter.suggestions), 'Suggestions should remain array after move');
        }
    });
    
    // Test hint system with disabled help
    testSuite.test('Helper-System-Hints', 'Hint system with disabled help', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create position that would normally generate hints
        game.board[5][0] = game.PLAYER1;
        game.board[5][1] = game.PLAYER1;
        game.board[5][2] = game.PLAYER1;
        game.currentPlayer = game.PLAYER1;
        
        // Disable helpers
        helpers.setEnabled(false);
        helpers.updateHints();
        
        const hints = helpers.getCurrentHints();
        testSuite.assertEqual(hints.threats.length, 0, 'Should have no threats when disabled');
        testSuite.assertEqual(hints.opportunities.length, 0, 'Should have no opportunities when disabled');
        testSuite.assertEqual(hints.suggestions.length, 0, 'Should have no suggestions when disabled');
        testSuite.assertFalsy(helpers.forcedMoveMode, 'Should not be in forced move mode when disabled');
    });
    
    // Test hint system re-enabling
    testSuite.test('Helper-System-Hints', 'Hint system re-enabling', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Start disabled
        helpers.setEnabled(false);
        testSuite.assertFalsy(helpers.enabled, 'Should start disabled');
        
        // Create winning position
        game.board[5][0] = game.PLAYER1;
        game.board[5][1] = game.PLAYER1;
        game.board[5][2] = game.PLAYER1;
        game.currentPlayer = game.PLAYER1;
        
        // Re-enable with Level 0
        helpers.setEnabled(true, 0);
        testSuite.assertTruthy(helpers.enabled, 'Should be enabled after re-enabling');
        testSuite.assertEqual(helpers.helpLevel, 0, 'Should have correct help level');
        
        // Should immediately detect hints
        const hints = helpers.getCurrentHints();
        testSuite.assert(hints.opportunities.length > 0, 'Should detect opportunities after re-enabling');
    });
    
    // Test hint message content and localization
    testSuite.test('Helper-System-Hints', 'Hint message content and localization', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Test German localization in messages
        game.board[5][0] = game.PLAYER1;
        game.board[5][1] = game.PLAYER1;
        game.board[5][2] = game.PLAYER1;
        game.currentPlayer = game.PLAYER2; // Yellow needs to block
        
        helpers.setEnabled(true, 1);
        helpers.updateHints();
        
        const hints = helpers.getCurrentHints();
        
        // Check for German content in threat messages
        if (hints.threats.length > 0) {
            const threatMessage = hints.threats[0].message;
            testSuite.assert(threatMessage.includes('Gegner') || threatMessage.includes('MUSST'), 
                'Threat messages should be in German');
        }
        
        // Test winning opportunity messages
        game.currentPlayer = game.PLAYER1; // Switch to player who can win
        helpers.updateHints();
        const winHints = helpers.getCurrentHints();
        
        if (winHints.opportunities.length > 0) {
            const winMessage = winHints.opportunities[0].message;
            testSuite.assert(winMessage.includes('GEWINNEN') || winMessage.includes('kannst'), 
                'Win messages should be in German');
        }
    });
    
    // Test hint update performance
    testSuite.test('Helper-System-Hints', 'Hint update performance', () => {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        
        // Create complex board state
        const complexMoves = [3, 3, 2, 4, 2, 4, 1, 5, 1, 5, 0];
        complexMoves.forEach(col => {
            if (game.getValidMoves().includes(col)) {
                game.makeMove(col);
            }
        });
        
        helpers.setEnabled(true, 2); // Full help level
        
        // Time hint updates
        const startTime = performance.now();
        
        for (let i = 0; i < 5; i++) {
            helpers.updateHints();
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        testSuite.assert(totalTime < 500, 
            `5 hint updates should take <500ms (took ${totalTime.toFixed(2)}ms)`);
        
        // Verify hints are still generated correctly
        const hints = helpers.getCurrentHints();
        testSuite.assert(Array.isArray(hints.threats), 'Should maintain valid hint structure');
        testSuite.assert(Array.isArray(hints.opportunities), 'Should maintain valid hint structure');
        testSuite.assert(Array.isArray(hints.suggestions), 'Should maintain valid hint structure');
    });
}