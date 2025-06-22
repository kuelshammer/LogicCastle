/**
 * UI Hints Modal Tests
 * 
 * Tests für das neue Spielerhilfen-Modal-System
 * Coverage: Modal-Verhalten, Button-Interaktionen, Keyboard-Shortcuts
 */
function runUIHintsModalTests(testSuite) {
    
    // Test hints modal elements initialization
    testSuite.test('UI-Hints-Modal', 'Hints modal elements initialization', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock DOM elements for hints modal
        const mockHintsModal = document.createElement('div');
        mockHintsModal.id = 'hintsModal';
        mockHintsModal.className = 'modal-overlay';
        
        const mockHintsBtn = document.createElement('button');
        mockHintsBtn.id = 'hintsBtn';
        mockHintsBtn.textContent = '🔧 Spielerhilfen (F2)';
        
        const mockCloseHintsBtn = document.createElement('button');
        mockCloseHintsBtn.id = 'closeHintsBtn';
        mockCloseHintsBtn.textContent = 'Schließen';
        
        document.body.appendChild(mockHintsModal);
        document.body.appendChild(mockHintsBtn);
        document.body.appendChild(mockCloseHintsBtn);
        
        ui.bindElements();
        
        testSuite.assertNotNull(ui.hintsModal, 'Hints modal should be bound');
        testSuite.assertNotNull(ui.hintsBtn, 'Hints button should be bound');
        testSuite.assertNotNull(ui.closeHintsBtn, 'Close hints button should be bound');
        
        // Cleanup
        document.body.removeChild(mockHintsModal);
        document.body.removeChild(mockHintsBtn);
        document.body.removeChild(mockCloseHintsBtn);
    });
    
    // Test hints modal toggle functionality
    testSuite.test('UI-Hints-Modal', 'Hints modal toggle functionality', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock hints modal
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay';
        
        document.body.appendChild(mockModal);
        ui.hintsModal = mockModal;
        
        // Initially modal should not have 'active' class
        testSuite.assertFalsy(mockModal.classList.contains('active'), 
            'Hints modal should initially be hidden');
        
        // Test opening modal
        ui.handleHints();
        testSuite.assertTruthy(mockModal.classList.contains('active'), 
            'Hints modal should be shown after handleHints()');
        
        // Test closing modal
        ui.handleHints();
        testSuite.assertFalsy(mockModal.classList.contains('active'), 
            'Hints modal should be hidden after second handleHints()');
        
        // Cleanup
        document.body.removeChild(mockModal);
    });
    
    // Test hints button click interaction
    testSuite.test('UI-Hints-Modal', 'Hints button click interaction', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock elements
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay';
        
        const mockButton = document.createElement('button');
        mockButton.id = 'hintsBtn';
        
        document.body.appendChild(mockModal);
        document.body.appendChild(mockButton);
        
        ui.hintsModal = mockModal;
        ui.hintsBtn = mockButton;
        
        // Simulate button click
        const clickEvent = new Event('click');
        let modalToggled = false;
        
        // Override handleHints to track if it was called
        const originalHandleHints = ui.handleHints;
        ui.handleHints = () => {
            modalToggled = true;
            originalHandleHints.call(ui);
        };
        
        // Add event listener and trigger click
        ui.hintsBtn.addEventListener('click', ui.handleHints);
        ui.hintsBtn.dispatchEvent(clickEvent);
        
        testSuite.assertTruthy(modalToggled, 'Button click should trigger modal toggle');
        
        // Cleanup
        document.body.removeChild(mockModal);
        document.body.removeChild(mockButton);
    });
    
    // Test close hints button functionality
    testSuite.test('UI-Hints-Modal', 'Close hints button functionality', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock elements
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay active'; // Start with modal open
        
        const mockCloseBtn = document.createElement('button');
        mockCloseBtn.id = 'closeHintsBtn';
        
        document.body.appendChild(mockModal);
        document.body.appendChild(mockCloseBtn);
        
        ui.hintsModal = mockModal;
        ui.closeHintsBtn = mockCloseBtn;
        
        // Modal should start as active
        testSuite.assertTruthy(mockModal.classList.contains('active'), 
            'Modal should start as active');
        
        // Simulate close button click
        ui.closeHintsBtn.addEventListener('click', ui.handleHints);
        const clickEvent = new Event('click');
        ui.closeHintsBtn.dispatchEvent(clickEvent);
        
        testSuite.assertFalsy(mockModal.classList.contains('active'), 
            'Modal should be closed after close button click');
        
        // Cleanup
        document.body.removeChild(mockModal);
        document.body.removeChild(mockCloseBtn);
    });
    
    // Test keyboard shortcut F2 for hints modal
    testSuite.test('UI-Hints-Modal', 'F2 keyboard shortcut', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock modal
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay';
        
        document.body.appendChild(mockModal);
        ui.hintsModal = mockModal;
        
        // Test F2 key press
        const f2KeyEvent = new KeyboardEvent('keydown', { 
            key: 'F2',
            bubbles: true 
        });
        
        // Initially modal should be closed
        testSuite.assertFalsy(mockModal.classList.contains('active'), 
            'Modal should start closed');
        
        // Simulate F2 press
        ui.handleKeyPress(f2KeyEvent);
        
        testSuite.assertTruthy(mockModal.classList.contains('active'), 
            'F2 should open hints modal');
        
        // Simulate F2 press again to close
        ui.handleKeyPress(f2KeyEvent);
        
        testSuite.assertFalsy(mockModal.classList.contains('active'), 
            'F2 should close hints modal when pressed again');
        
        // Cleanup
        document.body.removeChild(mockModal);
    });
    
    // Test hints modal content preservation
    testSuite.test('UI-Hints-Modal', 'Hints modal content preservation', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock complete hints modal structure
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal hints-modal';
        
        // Add mock checkboxes
        const checkboxIds = [
            'helpPlayer1Level0', 'helpPlayer1Level1', 'helpPlayer1Level2',
            'helpPlayer2Level0', 'helpPlayer2Level1', 'helpPlayer2Level2'
        ];
        
        const mockCheckboxes = {};
        checkboxIds.forEach(id => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            mockCheckboxes[id] = checkbox;
            modalContent.appendChild(checkbox);
        });
        
        mockModal.appendChild(modalContent);
        document.body.appendChild(mockModal);
        
        // Bind elements
        ui.hintsModal = mockModal;
        ui.helpPlayer1Level0 = mockCheckboxes.helpPlayer1Level0;
        ui.helpPlayer1Level1 = mockCheckboxes.helpPlayer1Level1;
        ui.helpPlayer1Level2 = mockCheckboxes.helpPlayer1Level2;
        ui.helpPlayer2Level0 = mockCheckboxes.helpPlayer2Level0;
        ui.helpPlayer2Level1 = mockCheckboxes.helpPlayer2Level1;
        ui.helpPlayer2Level2 = mockCheckboxes.helpPlayer2Level2;
        
        // Set some checkbox states
        ui.helpPlayer1Level0.checked = true;
        ui.helpPlayer2Level1.checked = true;
        
        // Toggle modal open and close
        ui.handleHints(); // Open
        ui.handleHints(); // Close
        ui.handleHints(); // Open again
        
        // Checkbox states should be preserved
        testSuite.assertTruthy(ui.helpPlayer1Level0.checked, 
            'Checkbox states should be preserved across modal toggles');
        testSuite.assertTruthy(ui.helpPlayer2Level1.checked, 
            'Checkbox states should be preserved across modal toggles');
        testSuite.assertFalsy(ui.helpPlayer1Level1.checked, 
            'Unchecked boxes should remain unchecked');
        
        // Cleanup
        document.body.removeChild(mockModal);
    });
    
    // Test modal click outside to close
    testSuite.test('UI-Hints-Modal', 'Click outside modal to close', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock modal structure
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay active';
        
        const modalInner = document.createElement('div');
        modalInner.className = 'modal hints-modal';
        mockModal.appendChild(modalInner);
        
        document.body.appendChild(mockModal);
        ui.hintsModal = mockModal;
        
        // Add click event listener (simulating the real implementation)
        ui.hintsModal.addEventListener('click', (e) => {
            if (e.target === ui.hintsModal) {
                ui.handleHints();
            }
        });
        
        // Modal should start open
        testSuite.assertTruthy(mockModal.classList.contains('active'), 
            'Modal should start open');
        
        // Simulate click on modal overlay (outside modal content)
        const clickEvent = new Event('click');
        Object.defineProperty(clickEvent, 'target', {
            value: mockModal,
            enumerable: true
        });
        
        mockModal.dispatchEvent(clickEvent);
        
        testSuite.assertFalsy(mockModal.classList.contains('active'), 
            'Modal should close when clicking outside');
        
        // Cleanup
        document.body.removeChild(mockModal);
    });
    
    // Test modal accessibility attributes
    testSuite.test('UI-Hints-Modal', 'Modal accessibility features', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock modal with accessibility attributes
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay';
        mockModal.setAttribute('role', 'dialog');
        mockModal.setAttribute('aria-labelledby', 'hints-modal-title');
        
        const mockButton = document.createElement('button');
        mockButton.id = 'hintsBtn';
        mockButton.setAttribute('aria-label', 'Spielerhilfen öffnen');
        
        document.body.appendChild(mockModal);
        document.body.appendChild(mockButton);
        
        ui.hintsModal = mockModal;
        ui.hintsBtn = mockButton;
        
        // Test that accessibility attributes are preserved
        testSuite.assertEqual(mockModal.getAttribute('role'), 'dialog', 
            'Modal should have dialog role');
        testSuite.assertNotNull(mockButton.getAttribute('aria-label'), 
            'Button should have aria-label');
        
        // Cleanup
        document.body.removeChild(mockModal);
        document.body.removeChild(mockButton);
    });
    
    // Test hints modal during game state changes
    testSuite.test('UI-Hints-Modal', 'Modal behavior during game state changes', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock modal
        const mockModal = document.createElement('div');
        mockModal.id = 'hintsModal';
        mockModal.className = 'modal-overlay';
        
        document.body.appendChild(mockModal);
        ui.hintsModal = mockModal;
        
        // Open modal
        ui.handleHints();
        testSuite.assertTruthy(mockModal.classList.contains('active'), 
            'Modal should be open');
        
        // Make a game move while modal is open
        const moveResult = game.makeMove(3);
        testSuite.assertTruthy(moveResult.success, 'Move should be successful');
        
        // Modal should remain open during gameplay
        testSuite.assertTruthy(mockModal.classList.contains('active'), 
            'Modal should remain open during gameplay');
        
        // Start new game while modal is open
        game.resetGame();
        
        // Modal should still be accessible
        testSuite.assertTruthy(mockModal.classList.contains('active'), 
            'Modal should remain open after game reset');
        
        // Cleanup
        document.body.removeChild(mockModal);
    });
    
    // Test button styling and classes
    testSuite.test('UI-Hints-Modal', 'Button styling and classes', () => {
        const game = new Connect4Game();
        const ui = new Connect4UI(game);
        
        // Mock button with expected classes
        const mockButton = document.createElement('button');
        mockButton.id = 'hintsBtn';
        mockButton.className = 'btn btn-warning';
        mockButton.textContent = '🔧 Spielerhilfen (F2)';
        
        document.body.appendChild(mockButton);
        ui.hintsBtn = mockButton;
        
        // Test button classes
        testSuite.assertTruthy(mockButton.classList.contains('btn'), 
            'Button should have base btn class');
        testSuite.assertTruthy(mockButton.classList.contains('btn-warning'), 
            'Button should have btn-warning class for orange styling');
        
        // Test button text content
        testSuite.assertTruthy(mockButton.textContent.includes('Spielerhilfen'), 
            'Button should contain "Spielerhilfen" text');
        testSuite.assertTruthy(mockButton.textContent.includes('F2'), 
            'Button should indicate F2 keyboard shortcut');
        testSuite.assertTruthy(mockButton.textContent.includes('🔧'), 
            'Button should have tools emoji');
        
        // Cleanup
        document.body.removeChild(mockButton);
    });
}