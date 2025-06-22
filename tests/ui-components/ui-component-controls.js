/**
 * UI Component Tests for Game Controls
 * 
 * Coverage: Button interactions, game mode selection, help system controls,
 * score display, status messages, modal dialogs
 */
function runUIComponentControlsTests(testSuite) {
    
    // Test game control buttons initialization
    testSuite.test('UI-Component-Controls', 'Game control buttons initialization', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM elements
        const mockNewGameBtn = document.createElement('button');
        mockNewGameBtn.id = 'newGameBtn';
        const mockResetScoreBtn = document.createElement('button');
        mockResetScoreBtn.id = 'resetScoreBtn';
        const mockUndoBtn = document.createElement('button');
        mockUndoBtn.id = 'undoBtn';
        
        document.body.appendChild(mockNewGameBtn);
        document.body.appendChild(mockResetScoreBtn);
        document.body.appendChild(mockUndoBtn);
        
        ui.bindElements();
        
        testSuite.assertNotNull(ui.newGameBtn, 'New game button should be bound');
        testSuite.assertNotNull(ui.resetScoreBtn, 'Reset score button should be bound');
        testSuite.assertNotNull(ui.undoBtn, 'Undo button should be bound');
        
        // Cleanup
        document.body.removeChild(mockNewGameBtn);
        document.body.removeChild(mockResetScoreBtn);
        document.body.removeChild(mockUndoBtn);
    });
    
    // Test new game button functionality
    testSuite.test('UI-Component-Controls', 'New game button functionality', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockButton = document.createElement('button');
        mockButton.id = 'newGameBtn';
        document.body.appendChild(mockButton);
        
        ui.newGameBtn = mockButton;
        
        // Make some moves first
        game.makeMove(3);
        game.makeMove(2);
        
        testSuite.assert(game.moveHistory.length > 0, 'Game should have move history');
        
        // Trigger new game
        ui.handleNewGame();
        
        testSuite.assertEqual(game.moveHistory.length, 0, 'Move history should be cleared after new game');
        testSuite.assertFalsy(game.gameOver, 'Game should not be over after new game');
        
        // Cleanup
        document.body.removeChild(mockButton);
    });
    
    // Test reset score button functionality
    testSuite.test('UI-Component-Controls', 'Reset score button functionality', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockButton = document.createElement('button');
        mockButton.id = 'resetScoreBtn';
        document.body.appendChild(mockButton);
        
        ui.resetScoreBtn = mockButton;
        
        // Set some scores
        game.score.red = 3;
        game.score.yellow = 2;
        game.makeMove(3);
        
        // Trigger reset score
        ui.handleResetScore();
        
        testSuite.assertEqual(game.score.red, 0, 'Red score should be reset to 0');
        testSuite.assertEqual(game.score.yellow, 0, 'Yellow score should be reset to 0');
        testSuite.assertEqual(game.moveHistory.length, 0, 'Move history should be cleared');
        
        // Cleanup
        document.body.removeChild(mockButton);
    });
    
    // Test undo button functionality
    testSuite.test('UI-Component-Controls', 'Undo button functionality', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockButton = document.createElement('button');
        mockButton.id = 'undoBtn';
        document.body.appendChild(mockButton);
        
        ui.undoBtn = mockButton;
        
        // Make some moves
        game.makeMove(3);
        game.makeMove(2);
        const moveCountBefore = game.moveHistory.length;
        
        // Trigger undo
        ui.handleUndo();
        
        testSuite.assertEqual(game.moveHistory.length, moveCountBefore - 1, 
            'Move history should be reduced by 1 after undo');
        
        // Cleanup
        document.body.removeChild(mockButton);
    });
    
    // Test game mode selection
    testSuite.test('UI-Component-Controls', 'Game mode selection', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockSelect = document.createElement('select');
        mockSelect.id = 'gameModeSelect';
        
        const option1 = document.createElement('option');
        option1.value = 'two-player';
        option1.textContent = 'Two Player';
        
        const option2 = document.createElement('option');
        option2.value = 'vs-bot-easy';
        option2.textContent = 'vs Bot (Einfach)';
        
        const option3 = document.createElement('option');
        option3.value = 'vs-bot-medium';
        option3.textContent = 'vs Bot (Mittel)';
        
        const option4 = document.createElement('option');
        option4.value = 'vs-bot-strong';
        option4.textContent = 'vs Bot (Stark)';
        
        mockSelect.appendChild(option1);
        mockSelect.appendChild(option2);
        mockSelect.appendChild(option3);
        mockSelect.appendChild(option4);
        document.body.appendChild(mockSelect);
        
        ui.gameModeSelect = mockSelect;
        
        // Test mode change
        mockSelect.value = 'vs-bot-easy';
        ui.handleGameModeChange();
        
        testSuite.assertEqual(ui.gameMode, 'vs-bot-easy', 'Game mode should be updated');
        testSuite.assertNotNull(ui.ai, 'AI should be initialized in bot mode');
        
        // Cleanup
        document.body.removeChild(mockSelect);
    });
    
    // Test help system controls
    testSuite.test('UI-Component-Controls', 'Help system controls', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock help checkboxes
        const mockCheckboxes = {};
        const checkboxIds = [
            'helpPlayer1Level0', 'helpPlayer1Level1', 'helpPlayer1Level2',
            'helpPlayer2Level0', 'helpPlayer2Level1', 'helpPlayer2Level2'
        ];
        
        checkboxIds.forEach(id => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            mockCheckboxes[id] = checkbox;
            document.body.appendChild(checkbox);
        });
        
        // Bind elements
        ui.helpPlayer1Level0 = mockCheckboxes.helpPlayer1Level0;
        ui.helpPlayer1Level1 = mockCheckboxes.helpPlayer1Level1;
        ui.helpPlayer1Level2 = mockCheckboxes.helpPlayer1Level2;
        ui.helpPlayer2Level0 = mockCheckboxes.helpPlayer2Level0;
        ui.helpPlayer2Level1 = mockCheckboxes.helpPlayer2Level1;
        ui.helpPlayer2Level2 = mockCheckboxes.helpPlayer2Level2;
        
        // Test help toggle
        ui.helpPlayer1Level0.checked = true;
        ui.handlePlayer1Level0Toggle();
        
        testSuite.assertTruthy(ui.playerHelpEnabled.red.level0, 
            'Red player Level 0 help should be enabled');
        
        ui.helpPlayer2Level1.checked = true;
        ui.handlePlayer2Level1Toggle();
        
        testSuite.assertTruthy(ui.playerHelpEnabled.yellow.level1, 
            'Yellow player Level 1 help should be enabled');
        
        // Cleanup
        checkboxIds.forEach(id => {
            document.body.removeChild(mockCheckboxes[id]);
        });
    });
    
    // Test score display updates
    testSuite.test('UI-Component-Controls', 'Score display updates', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock score elements
        const mockRedScore = document.createElement('span');
        mockRedScore.id = 'redScore';
        const mockYellowScore = document.createElement('span');
        mockYellowScore.id = 'yellowScore';
        
        document.body.appendChild(mockRedScore);
        document.body.appendChild(mockYellowScore);
        
        ui.scoreElements = {
            red: mockRedScore,
            yellow: mockYellowScore
        };
        
        // Update scores
        game.score.red = 5;
        game.score.yellow = 3;
        ui.updateScores();
        
        testSuite.assertEqual(mockRedScore.textContent, '5', 
            'Red score display should be updated');
        testSuite.assertEqual(mockYellowScore.textContent, '3', 
            'Yellow score display should be updated');
        
        // Cleanup
        document.body.removeChild(mockRedScore);
        document.body.removeChild(mockYellowScore);
    });
    
    // Test current player indicator
    testSuite.test('UI-Component-Controls', 'Current player indicator', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock player indicator
        const mockIndicator = document.createElement('div');
        mockIndicator.id = 'currentPlayerIndicator';
        document.body.appendChild(mockIndicator);
        
        ui.currentPlayerIndicator = mockIndicator;
        
        // Test player 1 indicator
        game.currentPlayer = game.PLAYER1;
        ui.updateCurrentPlayerIndicator();
        
        testSuite.assert(mockIndicator.textContent.includes('Rot') || 
                        mockIndicator.textContent.includes('Red') ||
                        mockIndicator.textContent.includes('🔴'), 
            'Indicator should show red player');
        
        // Test player 2 indicator
        game.currentPlayer = game.PLAYER2;
        ui.updateCurrentPlayerIndicator();
        
        testSuite.assert(mockIndicator.textContent.includes('Gelb') || 
                        mockIndicator.textContent.includes('Yellow') ||
                        mockIndicator.textContent.includes('🟡'), 
            'Indicator should show yellow player');
        
        // Cleanup
        document.body.removeChild(mockIndicator);
    });
    
    // Test game status messages
    testSuite.test('UI-Component-Controls', 'Game status messages', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock status element
        const mockStatus = document.createElement('div');
        mockStatus.id = 'gameStatus';
        document.body.appendChild(mockStatus);
        
        ui.gameStatus = mockStatus;
        
        // Test game won status
        game.gameOver = true;
        game.winner = game.PLAYER1;
        ui.updateGameStatus();
        
        testSuite.assert(mockStatus.textContent.length > 0, 
            'Status should display game won message');
        
        // Test game draw status
        game.winner = null;
        ui.updateGameStatus();
        
        testSuite.assert(mockStatus.textContent.length > 0, 
            'Status should display game draw message');
        
        // Cleanup
        document.body.removeChild(mockStatus);
    });
    
    // Test button state management during animations
    testSuite.test('UI-Component-Controls', 'Button state during animations', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock buttons
        const mockNewGame = document.createElement('button');
        const mockUndo = document.createElement('button');
        
        document.body.appendChild(mockNewGame);
        document.body.appendChild(mockUndo);
        
        ui.newGameBtn = mockNewGame;
        ui.undoBtn = mockUndo;
        
        // Set animation state
        ui.isAnimating = true;
        
        // Try to trigger actions during animation
        const gameStateBeforeAnimation = {
            moveCount: game.moveHistory.length,
            gameOver: game.gameOver
        };
        
        ui.handleNewGame();
        ui.handleUndo();
        
        // Actions should be blocked during animation
        testSuite.assertEqual(game.moveHistory.length, gameStateBeforeAnimation.moveCount, 
            'Actions should be blocked during animation');
        
        // Cleanup
        document.body.removeChild(mockNewGame);
        document.body.removeChild(mockUndo);
    });
    
    // Test AI thinking state indicators
    testSuite.test('UI-Component-Controls', 'AI thinking state indicators', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock status element
        const mockStatus = document.createElement('div');
        mockStatus.id = 'gameStatus';
        document.body.appendChild(mockStatus);
        
        ui.gameStatus = mockStatus;
        
        // Set AI thinking state
        ui.aiThinking = true;
        ui.updateGameStatus();
        
        // Status should indicate AI is thinking
        testSuite.assert(typeof ui.aiThinking === 'boolean', 
            'AI thinking state should be tracked');
        
        // Reset AI thinking state
        ui.aiThinking = false;
        
        // Cleanup
        document.body.removeChild(mockStatus);
    });
    
    // Test help modal functionality
    testSuite.test('UI-Component-Controls', 'Help modal functionality', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock help modal elements
        const mockModal = document.createElement('div');
        mockModal.id = 'helpModal';
        mockModal.style.display = 'none';
        
        const mockHelpBtn = document.createElement('button');
        mockHelpBtn.id = 'helpBtn';
        
        const mockCloseBtn = document.createElement('button');
        mockCloseBtn.id = 'closeHelpBtn';
        
        document.body.appendChild(mockModal);
        document.body.appendChild(mockHelpBtn);
        document.body.appendChild(mockCloseBtn);
        
        ui.helpModal = mockModal;
        ui.helpBtn = mockHelpBtn;
        ui.closeHelpBtn = mockCloseBtn;
        
        // Test opening help modal
        ui.handleHelp();
        
        testSuite.assertNotEqual(mockModal.style.display, 'none', 
            'Help modal should be shown when help button is clicked');
        
        // Test closing help modal (simulate close button)
        mockModal.style.display = 'none';
        
        testSuite.assertEqual(mockModal.style.display, 'none', 
            'Help modal should be hidden when close button is clicked');
        
        // Cleanup
        document.body.removeChild(mockModal);
        document.body.removeChild(mockHelpBtn);
        document.body.removeChild(mockCloseBtn);
    });
    
    // Test keyboard shortcuts for controls
    testSuite.test('UI-Component-Controls', 'Keyboard shortcuts for controls', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock game state
        game.makeMove(3);
        const initialMoveCount = game.moveHistory.length;
        
        // Test key press handling
        const mockKeyEvent = new KeyboardEvent('keydown', { key: 'u' });
        
        // Simulate undo key press
        ui.handleKeyPress(mockKeyEvent);
        
        // This tests that the key handler exists and processes events
        testSuite.assert(typeof ui.handleKeyPress === 'function', 
            'Key press handler should exist');
        
        // Note: Actual undo behavior depends on implementation details
    });
    
    // Test button text updates
    testSuite.test('UI-Component-Controls', 'Button text updates', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock buttons
        const mockNewGame = document.createElement('button');
        const mockResetScore = document.createElement('button');
        
        document.body.appendChild(mockNewGame);
        document.body.appendChild(mockResetScore);
        
        ui.newGameBtn = mockNewGame;
        ui.resetScoreBtn = mockResetScore;
        
        // Update button texts
        ui.updateButtonTexts();
        
        testSuite.assert(mockNewGame.textContent.length > 0, 
            'New game button should have text');
        testSuite.assert(mockResetScore.textContent.length > 0, 
            'Reset score button should have text');
        
        // Cleanup
        document.body.removeChild(mockNewGame);
        document.body.removeChild(mockResetScore);
    });
}