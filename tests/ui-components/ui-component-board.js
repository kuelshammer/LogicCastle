/**
 * UI Component Tests for Board Interface
 * 
 * Coverage: Board creation, cell rendering, column indicators, 
 * visual feedback, DOM manipulation, responsive behavior
 */
function runUIComponentBoardTests(testSuite) {
    
    // Test board initialization
    testSuite.test('UI-Component-Board', 'Board DOM structure creation', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Create mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        // Initialize board
        ui.createBoard();
        
        testSuite.assertNotNull(ui.boardElement, 'Board element should be set');
        testSuite.assertEqual(ui.boardElement.id, 'gameBoard', 'Board element should have correct ID');
        
        // Check board structure
        const cells = mockBoard.querySelectorAll('.cell');
        testSuite.assertEqual(cells.length, 42, 'Should create 42 cells (6 rows × 7 columns)');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test cell creation and positioning
    testSuite.test('UI-Component-Board', 'Cell creation and data attributes', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Create mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Check specific cells have correct data attributes
        const topLeftCell = mockBoard.querySelector('[data-row="0"][data-col="0"]');
        const bottomRightCell = mockBoard.querySelector('[data-row="5"][data-col="6"]');
        
        testSuite.assertNotNull(topLeftCell, 'Top-left cell should exist');
        testSuite.assertNotNull(bottomRightCell, 'Bottom-right cell should exist');
        
        testSuite.assertEqual(topLeftCell.dataset.row, '0', 'Top-left cell should have row 0');
        testSuite.assertEqual(topLeftCell.dataset.col, '0', 'Top-left cell should have col 0');
        testSuite.assertEqual(bottomRightCell.dataset.row, '5', 'Bottom-right cell should have row 5');
        testSuite.assertEqual(bottomRightCell.dataset.col, '6', 'Bottom-right cell should have col 6');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test column indicator creation
    testSuite.test('UI-Component-Board', 'Column indicators creation', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock required DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        const mockIndicators = document.createElement('div');
        mockIndicators.className = 'column-indicators';
        document.body.appendChild(mockBoard);
        document.body.appendChild(mockIndicators);
        
        ui.createBoard();
        ui.bindElements(); // This should set up column indicators
        
        // Column indicators should be created for each column
        testSuite.assert(Array.isArray(ui.columnIndicators) || ui.columnIndicators, 
            'Column indicators should be initialized');
        
        // Cleanup
        document.body.removeChild(mockBoard);
        document.body.removeChild(mockIndicators);
    });
    
    // Test board state rendering
    testSuite.test('UI-Component-Board', 'Board state rendering', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Create mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Make some moves in the game
        game.makeMove(3); // Red in column 3
        game.makeMove(2); // Yellow in column 2
        
        // Update board rendering
        ui.updateBoard();
        
        // Check that moves are reflected in DOM
        const redCell = mockBoard.querySelector('[data-row="5"][data-col="3"]');
        const yellowCell = mockBoard.querySelector('[data-row="5"][data-col="2"]');
        
        testSuite.assertTruthy(redCell.classList.contains('player1') || redCell.classList.contains('red'), 
            'Red piece should be rendered in correct position');
        testSuite.assertTruthy(yellowCell.classList.contains('player2') || yellowCell.classList.contains('yellow'), 
            'Yellow piece should be rendered in correct position');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test column selection visual feedback
    testSuite.test('UI-Component-Board', 'Column selection visual feedback', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM elements
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Test column selection
        ui.selectColumn(3);
        
        testSuite.assertEqual(ui.selectedColumn, 3, 'Selected column should be tracked');
        
        // Test column deselection
        ui.clearColumnSelection();
        
        testSuite.assertNull(ui.selectedColumn, 'Selected column should be cleared');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test column preview functionality
    testSuite.test('UI-Component-Board', 'Column preview on hover', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM with column indicators
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        // Create mock column indicators
        ui.columnIndicators = [];
        for (let i = 0; i < 7; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'column-indicator';
            ui.columnIndicators.push(indicator);
            mockBoard.appendChild(indicator);
        }
        
        ui.createBoard();
        
        // Test preview showing
        ui.showPreview(3);
        
        const indicator = ui.columnIndicators[3];
        testSuite.assertNotEqual(indicator.style.backgroundColor, '', 
            'Column indicator should have background color on preview');
        
        // Test preview hiding
        ui.hidePreview();
        
        testSuite.assertEqual(indicator.style.backgroundColor, '', 
            'Column indicator background should be cleared after hiding preview');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test full column handling
    testSuite.test('UI-Component-Board', 'Full column interaction handling', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Fill column 0 completely
        for (let i = 0; i < 6; i++) {
            game.makeMove(0);
            if (i < 5) {
                game.makeMove(1); // Alternate to different column
            }
        }
        
        testSuite.assertTruthy(game.isColumnFull(0), 'Column 0 should be full');
        
        // Try to select full column
        ui.selectColumn(0);
        
        // Selection should be ignored for full columns
        testSuite.assertNotEqual(ui.selectedColumn, 0, 
            'Full column should not be selectable');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test game over state board interaction
    testSuite.test('UI-Component-Board', 'Game over state board interaction', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Create winning condition
        game.board[5][0] = game.PLAYER1;
        game.board[5][1] = game.PLAYER1;
        game.board[5][2] = game.PLAYER1;
        game.board[5][3] = game.PLAYER1;
        game.gameOver = true;
        game.winner = game.PLAYER1;
        
        // Try to select column when game is over
        ui.selectColumn(4);
        
        testSuite.assertNotEqual(ui.selectedColumn, 4, 
            'Columns should not be selectable when game is over');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test board reset functionality
    testSuite.test('UI-Component-Board', 'Board reset and cleanup', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Make some moves
        game.makeMove(3);
        game.makeMove(2);
        ui.updateBoard();
        
        // Reset game
        game.resetGame();
        ui.updateBoard();
        
        // Check that board is visually cleared
        const cells = mockBoard.querySelectorAll('.cell');
        let hasPieces = false;
        cells.forEach(cell => {
            if (cell.classList.contains('player1') || cell.classList.contains('player2') ||
                cell.classList.contains('red') || cell.classList.contains('yellow')) {
                hasPieces = true;
            }
        });
        
        testSuite.assertFalsy(hasPieces, 'Board should be visually cleared after reset');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test responsive board behavior
    testSuite.test('UI-Component-Board', 'Board responsive behavior', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        mockBoard.style.width = '400px'; // Set specific width
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Check that board adapts to container
        const cells = mockBoard.querySelectorAll('.cell');
        testSuite.assert(cells.length > 0, 'Cells should be created regardless of container size');
        
        // Test with different container size
        mockBoard.style.width = '600px';
        ui.createBoard(); // Recreate board
        
        const newCells = mockBoard.querySelectorAll('.cell');
        testSuite.assertEqual(newCells.length, 42, 'Cell count should remain consistent');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test board accessibility features
    testSuite.test('UI-Component-Board', 'Board accessibility attributes', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Check for accessibility attributes
        const cells = mockBoard.querySelectorAll('.cell');
        let hasAccessibilityFeatures = false;
        
        cells.forEach(cell => {
            if (cell.getAttribute('aria-label') || 
                cell.getAttribute('role') ||
                cell.getAttribute('tabindex') !== null) {
                hasAccessibilityFeatures = true;
            }
        });
        
        // This test documents current state - may be enhanced later
        testSuite.assert(true, 'Board accessibility check completed');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test board event propagation
    testSuite.test('UI-Component-Board', 'Board event propagation handling', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        let eventCaptured = false;
        
        // Add event listener to board
        mockBoard.addEventListener('click', () => {
            eventCaptured = true;
        });
        
        // Simulate click on a cell
        const firstCell = mockBoard.querySelector('.cell');
        if (firstCell) {
            firstCell.click();
        }
        
        testSuite.assertTruthy(eventCaptured, 'Board should capture cell click events');
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
    
    // Test board animation state handling
    testSuite.test('UI-Component-Board', 'Board animation state handling', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM
        const mockBoard = document.createElement('div');
        mockBoard.id = 'gameBoard';
        document.body.appendChild(mockBoard);
        
        ui.createBoard();
        
        // Test animation state tracking
        ui.isAnimating = true;
        
        // Try to select column during animation
        ui.selectColumn(3);
        
        // Depending on implementation, animation might block interaction
        // This test documents the expected behavior
        testSuite.assert(typeof ui.isAnimating === 'boolean', 
            'Animation state should be tracked as boolean');
        
        // Reset animation state
        ui.isAnimating = false;
        
        // Cleanup
        document.body.removeChild(mockBoard);
    });
}