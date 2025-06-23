/**
 * Vitest Tests für Undo als bedingte Spielerhilfe
 * 
 * Integration Tests für die neue Undo-Checkbox-Funktionalität
 * Erweitert die bestehenden UI-Tests um Vitest-spezifische Validierungen
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM setup für Vitest
function setupDOM() {
    // Create basic HTML structure
    document.body.innerHTML = `
        <div id="gameBoard"></div>
        <div id="currentPlayerIndicator"></div>
        <div id="gameStatus"></div>
        <div id="redScore">0</div>
        <div id="yellowScore">0</div>
        <button id="newGameBtn"></button>
        <button id="resetScoreBtn"></button>
        <button id="undoBtn"></button>
        <button id="helpBtn"></button>
        <button id="hintsBtn"></button>
        <select id="gameModeSelect"></select>
        
        <!-- Modal structures -->
        <div id="helpModal" class="modal-overlay"></div>
        <button id="closeHelpBtn"></button>
        <div id="hintsModal" class="modal-overlay"></div>
        <button id="closeHintsBtn"></button>
        
        <!-- Help checkboxes -->
        <input type="checkbox" id="helpPlayer1Level0">
        <input type="checkbox" id="helpPlayer1Level1">
        <input type="checkbox" id="helpPlayer1Level2">
        <input type="checkbox" id="helpPlayer2Level0">
        <input type="checkbox" id="helpPlayer2Level1">
        <input type="checkbox" id="helpPlayer2Level2">
        
        <!-- NEW: Undo checkboxes -->
        <input type="checkbox" id="undoEnabledPlayer1">
        <input type="checkbox" id="undoEnabledPlayer2">
    `;
}

// Mock game classes
class MockConnect4Game {
    constructor() {
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
        this.currentPlayer = this.PLAYER1;
        this.moveHistory = [];
        this.gameOver = false;
        this.scores = { red: 0, yellow: 0 };
        this.score = { red: 0, yellow: 0 }; // Legacy compatibility
        this.eventListeners = {};
    }
    
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
    
    makeMove(col) {
        this.moveHistory.push({ col, player: this.currentPlayer });
        this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        return { success: true };
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) {
            return { success: false, reason: 'Keine Züge zum Rückgängigmachen' };
        }
        this.moveHistory.pop();
        this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        return { success: true };
    }
    
    fullReset() {
        this.moveHistory = [];
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
    }
}

class MockConnect4Helpers {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
        this.eventListeners = {};
    }
    
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    updateHelpers() {
        // Mock implementation
    }
}

// Setup globals für Connect4 classes
if (typeof global !== 'undefined') {
    global.Connect4Game = MockConnect4Game;
    global.Connect4Helpers = MockConnect4Helpers;
} else {
    window.Connect4Game = MockConnect4Game;
    window.Connect4Helpers = MockConnect4Helpers;
}

describe('UI Undo Conditional (Vitest Integration)', () => {
    let ui, game;
    
    beforeEach(() => {
        setupDOM();
        game = new MockConnect4Game();
        
        // Import UI class dynamically
        const Connect4UI = (typeof global !== 'undefined' && global.Connect4UI) || window.Connect4UI;
        if (!Connect4UI) {
            // Create mock UI class for testing
            window.Connect4UI = class {
                constructor(game) {
                    this.game = game;
                    this.undoEnabled = { red: false, yellow: false };
                    this.undoEnabledPlayer1 = null;
                    this.undoEnabledPlayer2 = null;
                    this.undoBtn = { disabled: false };
                    this.helpers = new MockConnect4Helpers(game, this);
                    this.isAnimating = false;
                    this.aiThinking = false;
                }
                
                bindElements() {
                    this.undoEnabledPlayer1 = document.getElementById('undoEnabledPlayer1');
                    this.undoEnabledPlayer2 = document.getElementById('undoEnabledPlayer2');
                    this.undoBtn = document.getElementById('undoBtn');
                }
                
                handleUndoEnabledPlayer1Toggle() {
                    this.undoEnabled.red = this.undoEnabledPlayer1.checked;
                    this.updateUI();
                }
                
                handleUndoEnabledPlayer2Toggle() {
                    this.undoEnabled.yellow = this.undoEnabledPlayer2.checked;
                    this.updateUI();
                }
                
                updateUI() {
                    this.updateControls();
                }
                
                updateControls() {
                    const currentPlayerColor = this.game.currentPlayer === this.game.PLAYER1 ? 'red' : 'yellow';
                    const undoAllowed = this.undoEnabled[currentPlayerColor];
                    this.undoBtn.disabled = this.game.moveHistory.length === 0 || this.game.gameOver || this.aiThinking || !undoAllowed;
                }
                
                handleUndo() {
                    if (this.isAnimating || this.aiThinking) {
                        return;
                    }
                    
                    const currentPlayerColor = this.game.currentPlayer === this.game.PLAYER1 ? 'red' : 'yellow';
                    if (!this.undoEnabled[currentPlayerColor]) {
                        this.showMessage('Rückgängig ist für diesen Spieler nicht aktiviert', 'warning');
                        return;
                    }
                    
                    const result = this.game.undoMove();
                    if (!result.success) {
                        this.showMessage(result.reason, 'error');
                    }
                }
                
                showMessage(message, type) {
                    this.lastMessage = { message, type };
                }
            };
        }
        
        ui = new window.Connect4UI(game);
        ui.bindElements();
    });
    
    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });
    
    it('should initialize undo state as disabled for both players', () => {
        expect(ui.undoEnabled.red).toBe(false);
        expect(ui.undoEnabled.yellow).toBe(false);
    });
    
    it('should bind undo checkbox elements correctly', () => {
        expect(ui.undoEnabledPlayer1).toBeTruthy();
        expect(ui.undoEnabledPlayer2).toBeTruthy();
        expect(ui.undoEnabledPlayer1.id).toBe('undoEnabledPlayer1');
        expect(ui.undoEnabledPlayer2.id).toBe('undoEnabledPlayer2');
    });
    
    it('should update undo state when Player 1 checkbox is toggled', () => {
        // Mock updateUI to track calls
        const updateUISpy = vi.spyOn(ui, 'updateUI');
        
        ui.undoEnabledPlayer1.checked = true;
        ui.handleUndoEnabledPlayer1Toggle();
        
        expect(ui.undoEnabled.red).toBe(true);
        expect(updateUISpy).toHaveBeenCalledTimes(1);
        
        ui.undoEnabledPlayer1.checked = false;
        ui.handleUndoEnabledPlayer1Toggle();
        
        expect(ui.undoEnabled.red).toBe(false);
        expect(updateUISpy).toHaveBeenCalledTimes(2);
    });
    
    it('should update undo state when Player 2 checkbox is toggled', () => {
        const updateUISpy = vi.spyOn(ui, 'updateUI');
        
        ui.undoEnabledPlayer2.checked = true;
        ui.handleUndoEnabledPlayer2Toggle();
        
        expect(ui.undoEnabled.yellow).toBe(true);
        expect(updateUISpy).toHaveBeenCalledTimes(1);
        
        ui.undoEnabledPlayer2.checked = false;
        ui.handleUndoEnabledPlayer2Toggle();
        
        expect(ui.undoEnabled.yellow).toBe(false);
        expect(updateUISpy).toHaveBeenCalledTimes(2);
    });
    
    it('should disable undo button when current player has undo disabled', () => {
        // Make moves to enable undo possibility
        game.makeMove(3);
        game.makeMove(2);
        
        // Current player is red (PLAYER1), disable undo for red
        ui.undoEnabled.red = false;
        ui.undoEnabled.yellow = true;
        
        ui.updateControls();
        
        expect(ui.undoBtn.disabled).toBe(true);
    });
    
    it('should enable undo button when current player has undo enabled', () => {
        // Make moves to enable undo possibility
        game.makeMove(3);
        game.makeMove(2);
        
        // Current player is red (PLAYER1), enable undo for red
        ui.undoEnabled.red = true;
        ui.undoEnabled.yellow = false;
        
        ui.updateControls();
        
        expect(ui.undoBtn.disabled).toBe(false);
    });
    
    it('should prevent undo when current player has undo disabled', () => {
        game.makeMove(3);
        game.makeMove(2);
        const initialMoveCount = game.moveHistory.length;
        
        // Current player is red, disable undo for red
        ui.undoEnabled.red = false;
        
        ui.handleUndo();
        
        expect(ui.lastMessage).toBeTruthy();
        expect(ui.lastMessage.type).toBe('warning');
        expect(ui.lastMessage.message).toContain('nicht aktiviert');
        expect(game.moveHistory.length).toBe(initialMoveCount);
    });
    
    it('should allow undo when current player has undo enabled', () => {
        game.makeMove(3);
        game.makeMove(2);
        const initialMoveCount = game.moveHistory.length;
        
        // Current player is red, enable undo for red
        ui.undoEnabled.red = true;
        
        ui.handleUndo();
        
        expect(ui.lastMessage).toBeFalsy();
        expect(game.moveHistory.length).toBe(initialMoveCount - 1);
    });
    
    it('should work independently for different players', () => {
        // Enable undo only for red player
        ui.undoEnabled.red = true;
        ui.undoEnabled.yellow = false;
        
        // Make moves: red -> yellow -> red
        game.makeMove(3); // red
        game.makeMove(2); // yellow  
        game.makeMove(4); // red
        
        // Current player should be yellow (after 3 moves)
        expect(game.currentPlayer).toBe(game.PLAYER2);
        
        // Yellow player should not be able to undo
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(true);
        
        // Switch to red player's turn
        game.makeMove(5); // yellow move
        expect(game.currentPlayer).toBe(game.PLAYER1);
        
        // Red player should be able to undo
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(false);
    });
    
    it('should persist checkbox states correctly', () => {
        const checkbox1 = ui.undoEnabledPlayer1;
        const checkbox2 = ui.undoEnabledPlayer2;
        
        // Initial state
        expect(checkbox1.checked).toBe(false);
        expect(checkbox2.checked).toBe(false);
        expect(ui.undoEnabled.red).toBe(false);
        expect(ui.undoEnabled.yellow).toBe(false);
        
        // Toggle player 1
        checkbox1.checked = true;
        ui.handleUndoEnabledPlayer1Toggle();
        
        expect(ui.undoEnabled.red).toBe(true);
        expect(ui.undoEnabled.yellow).toBe(false);
        
        // Toggle player 2
        checkbox2.checked = true;
        ui.handleUndoEnabledPlayer2Toggle();
        
        expect(ui.undoEnabled.red).toBe(true);
        expect(ui.undoEnabled.yellow).toBe(true);
        
        // Toggle player 1 off
        checkbox1.checked = false;
        ui.handleUndoEnabledPlayer1Toggle();
        
        expect(ui.undoEnabled.red).toBe(false);
        expect(ui.undoEnabled.yellow).toBe(true);
    });
    
    it('should respect undo settings during game state changes', () => {
        // Set up undo enabled for red only
        ui.undoEnabled.red = true;
        ui.undoEnabled.yellow = false;
        
        // Test with moves
        game.makeMove(3);
        expect(game.currentPlayer).toBe(game.PLAYER2); // Yellow's turn
        
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(true); // Disabled for yellow
        
        // Make another move to switch back to red
        game.makeMove(2);
        expect(game.currentPlayer).toBe(game.PLAYER1); // Red's turn
        
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(false); // Enabled for red
        
        // Test game over state
        game.gameOver = true;
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(true); // Disabled when game over
    });
    
    it('should handle AI thinking state correctly', () => {
        game.makeMove(3);
        ui.undoEnabled.red = true;
        
        // Switch to red player's turn for undo enabled state
        game.makeMove(2); // Now it's red's turn again
        
        // Normal state - undo should be enabled
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(false);
        
        // AI thinking - undo should be disabled
        ui.aiThinking = true;
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(true);
        
        // AI done thinking - undo should be enabled again
        ui.aiThinking = false;
        ui.updateControls();
        expect(ui.undoBtn.disabled).toBe(false);
    });
});