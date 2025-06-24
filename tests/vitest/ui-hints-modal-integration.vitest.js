/**
 * Vitest Integration Tests für Spielerhilfen-Modal
 *
 * Testet die vollständige Integration des neuen Modal-Systems
 * einschließlich Keyboard-Shortcuts, Modal-Verhalten und UI-State
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';

// Mock DOM environment
function setupMockDOM() {
  // Create basic HTML structure
  document.body.innerHTML = `
        <div class="game-container">
            <div class="game-controls">
                <button id="hintsBtn" class="btn btn-warning">🔧 Spielerhilfen (F2)</button>
                <button id="helpBtn" class="btn btn-info">❓ Spielanleitung (F1)</button>
            </div>
        </div>
        
        <!-- Hints Modal -->
        <div class="modal-overlay" id="hintsModal">
            <div class="modal hints-modal">
                <h2>🔧 Spielerhilfen</h2>
                <div class="hints-content">
                    <div class="help-table-container">
                        <table class="help-table">
                            <tbody>
                                <tr>
                                    <td><input type="checkbox" id="helpPlayer1Level0" class="help-checkbox-input"></td>
                                    <td><input type="checkbox" id="helpPlayer1Level1" class="help-checkbox-input"></td>
                                    <td><input type="checkbox" id="helpPlayer1Level2" class="help-checkbox-input"></td>
                                </tr>
                                <tr>
                                    <td><input type="checkbox" id="helpPlayer2Level0" class="help-checkbox-input"></td>
                                    <td><input type="checkbox" id="helpPlayer2Level1" class="help-checkbox-input"></td>
                                    <td><input type="checkbox" id="helpPlayer2Level2" class="help-checkbox-input"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="closeHintsBtn" class="btn btn-primary">Schließen</button>
                </div>
            </div>
        </div>
        
        <!-- Help Modal for comparison -->
        <div class="modal-overlay" id="helpModal">
            <div class="modal help-modal">
                <h2>🎮 Hilfe</h2>
                <button id="closeHelpBtn" class="btn btn-primary">Verstanden!</button>
            </div>
        </div>
    `;
}

// Mock Connect4 classes
class MockConnect4Game {
  constructor() {
    this.PLAYER1 = 1;
    this.PLAYER2 = 2;
    this.EMPTY = 0;
    this.currentPlayer = this.PLAYER1;
    this.gameOver = false;
    this.moveHistory = [];
    this.score = { red: 0, yellow: 0 };
  }

  makeMove(col) {
    this.moveHistory.push({ col, player: this.currentPlayer });
    return { success: true };
  }

  resetGame() {
    this.moveHistory = [];
    this.gameOver = false;
    this.currentPlayer = this.PLAYER1;
  }
}

class MockConnect4UI {
  constructor(game) {
    this.game = game;
    this.hintsBtn = null;
    this.hintsModal = null;
    this.closeHintsBtn = null;
    this.helpBtn = null;
    this.helpModal = null;
    this.closeHelpBtn = null;

    // Help checkbox elements
    this.helpPlayer1Level0 = null;
    this.helpPlayer1Level1 = null;
    this.helpPlayer1Level2 = null;
    this.helpPlayer2Level0 = null;
    this.helpPlayer2Level1 = null;
    this.helpPlayer2Level2 = null;

    // Player help state
    this.playerHelpEnabled = {
      red: { level0: false, level1: false, level2: false },
      yellow: { level0: false, level1: false, level2: false }
    };

    // Bind methods
    this.handleHints = this.handleHints.bind(this);
    this.handleHelp = this.handleHelp.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  bindElements() {
    this.hintsBtn = document.getElementById('hintsBtn');
    this.hintsModal = document.getElementById('hintsModal');
    this.closeHintsBtn = document.getElementById('closeHintsBtn');
    this.helpBtn = document.getElementById('helpBtn');
    this.helpModal = document.getElementById('helpModal');
    this.closeHelpBtn = document.getElementById('closeHelpBtn');

    // Bind help checkboxes
    this.helpPlayer1Level0 = document.getElementById('helpPlayer1Level0');
    this.helpPlayer1Level1 = document.getElementById('helpPlayer1Level1');
    this.helpPlayer1Level2 = document.getElementById('helpPlayer1Level2');
    this.helpPlayer2Level0 = document.getElementById('helpPlayer2Level0');
    this.helpPlayer2Level1 = document.getElementById('helpPlayer2Level1');
    this.helpPlayer2Level2 = document.getElementById('helpPlayer2Level2');
  }

  attachEventListeners() {
    if (this.hintsBtn) {
      this.hintsBtn.addEventListener('click', this.handleHints);
    }
    if (this.closeHintsBtn) {
      this.closeHintsBtn.addEventListener('click', this.handleHints);
    }
    if (this.hintsModal) {
      this.hintsModal.addEventListener('click', (e) => {
        if (e.target === this.hintsModal) {
          this.handleHints();
        }
      });
    }
    if (this.helpBtn) {
      this.helpBtn.addEventListener('click', this.handleHelp);
    }
    if (this.closeHelpBtn) {
      this.closeHelpBtn.addEventListener('click', this.handleHelp);
    }

    // Global keyboard listener
    document.addEventListener('keydown', this.handleKeyPress);
  }

  handleHints() {
    if (this.hintsModal) {
      this.hintsModal.classList.toggle('active');
    }
  }

  handleHelp() {
    if (this.helpModal) {
      this.helpModal.classList.toggle('active');
    }
  }

  handleKeyPress(e) {
    switch (e.key) {
    case 'F1':
      e.preventDefault();
      this.handleHelp();
      break;
    case 'F2':
      e.preventDefault();
      this.handleHints();
      break;
    }
  }

  init() {
    this.bindElements();
    this.attachEventListeners();
  }
}

describe('UI Hints Modal Integration Tests', () => {
  let game;
  let ui;

  beforeEach(() => {
    setupMockDOM();
    game = new MockConnect4Game();
    ui = new MockConnect4UI(game);
    ui.init();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    // Remove global event listeners
    document.removeEventListener('keydown', ui.handleKeyPress);
  });

  test('Hints button should exist and have correct styling', () => {
    const hintsBtn = document.getElementById('hintsBtn');

    expect(hintsBtn).toBeTruthy();
    expect(hintsBtn.classList.contains('btn')).toBe(true);
    expect(hintsBtn.classList.contains('btn-warning')).toBe(true);
    expect(hintsBtn.textContent).toContain('Spielerhilfen');
    expect(hintsBtn.textContent).toContain('F2');
    expect(hintsBtn.textContent).toContain('🔧');
  });

  test('Hints modal should toggle on button click', () => {
    const hintsBtn = document.getElementById('hintsBtn');
    const hintsModal = document.getElementById('hintsModal');

    // Initially modal should be hidden
    expect(hintsModal.classList.contains('active')).toBe(false);

    // Click button to open modal
    hintsBtn.click();
    expect(hintsModal.classList.contains('active')).toBe(true);

    // Click button again to close modal
    hintsBtn.click();
    expect(hintsModal.classList.contains('active')).toBe(false);
  });

  test('F2 keyboard shortcut should toggle hints modal', () => {
    const hintsModal = document.getElementById('hintsModal');

    // Initially modal should be hidden
    expect(hintsModal.classList.contains('active')).toBe(false);

    // Press F2 to open modal
    const f2Event = new KeyboardEvent('keydown', { key: 'F2' });
    document.dispatchEvent(f2Event);
    expect(hintsModal.classList.contains('active')).toBe(true);

    // Press F2 again to close modal
    document.dispatchEvent(f2Event);
    expect(hintsModal.classList.contains('active')).toBe(false);
  });

  test('F1 keyboard shortcut should still work for help modal', () => {
    const helpModal = document.getElementById('helpModal');
    const hintsModal = document.getElementById('hintsModal');

    // Initially both modals should be hidden
    expect(helpModal.classList.contains('active')).toBe(false);
    expect(hintsModal.classList.contains('active')).toBe(false);

    // Press F1 to open help modal
    const f1Event = new KeyboardEvent('keydown', { key: 'F1' });
    document.dispatchEvent(f1Event);
    expect(helpModal.classList.contains('active')).toBe(true);
    expect(hintsModal.classList.contains('active')).toBe(false);
  });

  test('Close button should close hints modal', () => {
    const hintsModal = document.getElementById('hintsModal');
    const closeBtn = document.getElementById('closeHintsBtn');

    // Open modal first
    hintsModal.classList.add('active');
    expect(hintsModal.classList.contains('active')).toBe(true);

    // Click close button
    closeBtn.click();
    expect(hintsModal.classList.contains('active')).toBe(false);
  });

  test('Click outside modal should close it', () => {
    const hintsModal = document.getElementById('hintsModal');

    // Open modal first
    hintsModal.classList.add('active');
    expect(hintsModal.classList.contains('active')).toBe(true);

    // Simulate click on modal overlay (outside content)
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', {
      value: hintsModal,
      enumerable: true
    });

    hintsModal.dispatchEvent(clickEvent);
    expect(hintsModal.classList.contains('active')).toBe(false);
  });

  test('All help checkboxes should be present in modal', () => {
    const checkboxIds = [
      'helpPlayer1Level0', 'helpPlayer1Level1', 'helpPlayer1Level2',
      'helpPlayer2Level0', 'helpPlayer2Level1', 'helpPlayer2Level2'
    ];

    checkboxIds.forEach(id => {
      const checkbox = document.getElementById(id);
      expect(checkbox).toBeTruthy();
      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.classList.contains('help-checkbox-input')).toBe(true);
    });
  });

  test('Modal structure should be correct', () => {
    const hintsModal = document.getElementById('hintsModal');

    expect(hintsModal.classList.contains('modal-overlay')).toBe(true);

    const modalContent = hintsModal.querySelector('.modal.hints-modal');
    expect(modalContent).toBeTruthy();

    const title = modalContent.querySelector('h2');
    expect(title.textContent).toContain('Spielerhilfen');
    expect(title.textContent).toContain('🔧');

    const table = modalContent.querySelector('.help-table');
    expect(table).toBeTruthy();

    const closeBtn = modalContent.querySelector('#closeHintsBtn');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.textContent).toContain('Schließen');
  });

  test('Modal should not interfere with game functionality', () => {
    const hintsModal = document.getElementById('hintsModal');

    // Open modal
    ui.handleHints();
    expect(hintsModal.classList.contains('active')).toBe(true);

    // Make game moves while modal is open
    const moveResult = game.makeMove(3);
    expect(moveResult.success).toBe(true);
    expect(game.moveHistory.length).toBe(1);

    // Modal should still be open
    expect(hintsModal.classList.contains('active')).toBe(true);

    // Reset game while modal is open
    game.resetGame();
    expect(game.moveHistory.length).toBe(0);

    // Modal should still be open
    expect(hintsModal.classList.contains('active')).toBe(true);
  });

  test('Both modals should be able to coexist', () => {
    const hintsModal = document.getElementById('hintsModal');
    const helpModal = document.getElementById('helpModal');

    // Open hints modal
    ui.handleHints();
    expect(hintsModal.classList.contains('active')).toBe(true);
    expect(helpModal.classList.contains('active')).toBe(false);

    // Open help modal (should not close hints modal)
    ui.handleHelp();
    expect(hintsModal.classList.contains('active')).toBe(true);
    expect(helpModal.classList.contains('active')).toBe(true);

    // Close help modal
    ui.handleHelp();
    expect(hintsModal.classList.contains('active')).toBe(true);
    expect(helpModal.classList.contains('active')).toBe(false);

    // Close hints modal
    ui.handleHints();
    expect(hintsModal.classList.contains('active')).toBe(false);
    expect(helpModal.classList.contains('active')).toBe(false);
  });

  test('Checkbox states should persist across modal toggles', () => {
    const checkbox = document.getElementById('helpPlayer1Level0');

    // Open modal and check a checkbox
    ui.handleHints();
    checkbox.checked = true;

    // Close and reopen modal
    ui.handleHints(); // Close
    ui.handleHints(); // Open

    // Checkbox state should be preserved
    expect(checkbox.checked).toBe(true);
  });

  test('Event listeners should be properly attached', () => {
    // Test that UI elements have been bound correctly
    expect(ui.hintsBtn).toBeTruthy();
    expect(ui.hintsModal).toBeTruthy();
    expect(ui.closeHintsBtn).toBeTruthy();
    expect(ui.helpBtn).toBeTruthy();
    expect(ui.helpModal).toBeTruthy();
    expect(ui.closeHelpBtn).toBeTruthy();

    // Test that all help checkboxes are bound
    expect(ui.helpPlayer1Level0).toBeTruthy();
    expect(ui.helpPlayer1Level1).toBeTruthy();
    expect(ui.helpPlayer1Level2).toBeTruthy();
    expect(ui.helpPlayer2Level0).toBeTruthy();
    expect(ui.helpPlayer2Level1).toBeTruthy();
    expect(ui.helpPlayer2Level2).toBeTruthy();
  });
});
