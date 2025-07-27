/**
 * LGameKeyboardController - L-Game Keyboard Navigation & Shortcuts
 * 
 * Adapted from Connect4/Gomoku KeyboardController for L-Game specific controls.
 * Provides full keyboard navigation for L-piece movement and game controls.
 * 
 * Responsibilities:
 * - Arrow key navigation on 4x4 board
 * - L-piece orientation controls (rotation/flip)
 * - Game action shortcuts
 * - Accessibility compliance
 * - Focus management
 */

export class LGameKeyboardController {
    constructor(gameLogic, boardRenderer) {
        this.gameLogic = gameLogic;
        this.boardRenderer = boardRenderer;
        
        // Navigation state
        this.currentRow = 0;
        this.currentCol = 0;
        this.boardSize = 4; // 4x4 L-Game board
        this.enabled = true;
        
        // Selection state
        this.selectedPiece = null;
        this.selectedOrientation = 0; // 0-7 orientations
        
        // Key mappings
        this.keyMappings = {
            // Navigation
            'ArrowUp': () => this.moveCursor(-1, 0),
            'ArrowDown': () => this.moveCursor(1, 0),
            'ArrowLeft': () => this.moveCursor(0, -1),
            'ArrowRight': () => this.moveCursor(0, 1),
            
            // L-piece actions
            'Enter': () => this.placeLPiece(),
            'Space': () => this.selectPiece(),
            
            // Orientation controls
            'r': () => this.rotateOrientation(1),   // Rotate clockwise
            'R': () => this.rotateOrientation(-1),  // Rotate counter-clockwise
            'f': () => this.flipOrientation(),      // Flip horizontally
            'F': () => this.flipVertically(),       // Flip vertically
            
            // Game controls
            'n': () => this.newGame(),
            'u': () => this.undoMove(),
            'h': () => this.showHelp(),
            
            // Navigation shortcuts
            'Home': () => this.moveCursorTo(0, 0),
            'End': () => this.moveCursorTo(3, 3),
            
            // Quick orientation selection
            '1': () => this.setOrientation(0),
            '2': () => this.setOrientation(1),
            '3': () => this.setOrientation(2),
            '4': () => this.setOrientation(3),
            '5': () => this.setOrientation(4),
            '6': () => this.setOrientation(5),
            '7': () => this.setOrientation(6),
            '8': () => this.setOrientation(7),
            
            // ESC to cancel/deselect
            'Escape': () => this.cancelSelection()
        };
        
        // Visual indicators
        this.cursorIndicator = null;
        this.orientationIndicator = null;
        this.initialized = false;
    }

    /**
     * Initialize keyboard controller
     */
    async init() {
        this.bindKeyEvents();
        this.createVisualIndicators();
        this.showKeyboardHelp();
        this.initialized = true;
        console.log('⌨️ L-Game KeyboardController initialized');
        return true;
    }

    /**
     * Bind keyboard events
     * @private
     */
    bindKeyEvents() {
        document.addEventListener('keydown', (event) => {
            if (!this.enabled) return;
            
            const handler = this.keyMappings[event.key];
            if (handler) {
                event.preventDefault();
                event.stopPropagation();
                handler();
            }
        });
        
        // Focus management for accessibility
        document.addEventListener('focusin', (event) => {
            if (event.target.closest('.lgame-board')) {
                this.updateCursorPosition();
            }
        });
    }

    /**
     * Create visual indicators for cursor and orientation
     * @private
     */
    createVisualIndicators() {
        // Create cursor indicator
        this.cursorIndicator = document.createElement('div');
        this.cursorIndicator.id = 'lgame-cursor';
        this.cursorIndicator.className = 'absolute pointer-events-none z-10';
        this.cursorIndicator.style.cssText = `
            width: calc(100% - 4px);
            height: calc(100% - 4px);
            border: 2px solid #fbbf24;
            border-radius: 8px;
            box-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
            animation: keyboard-pulse 1.5s ease-in-out infinite;
            background: rgba(251, 191, 36, 0.1);
            top: 2px;
            left: 2px;
        `;
        
        // Create orientation indicator
        this.orientationIndicator = document.createElement('div');
        this.orientationIndicator.id = 'lgame-orientation-indicator';
        this.orientationIndicator.className = 'fixed bottom-4 left-4 lc-glass rounded-lg p-3 z-50';
        this.orientationIndicator.style.display = 'none';
        
        // Add to DOM
        document.body.appendChild(this.orientationIndicator);
        
        // Position cursor initially
        this.updateCursorPosition();
    }

    /**
     * Move cursor by delta
     * @private
     */
    moveCursor(deltaRow, deltaCol) {
        const newRow = Math.max(0, Math.min(this.boardSize - 1, this.currentRow + deltaRow));
        const newCol = Math.max(0, Math.min(this.boardSize - 1, this.currentCol + deltaCol));
        
        if (newRow !== this.currentRow || newCol !== this.currentCol) {
            this.currentRow = newRow;
            this.currentCol = newCol;
            this.updateCursorPosition();
            this.provideFeedback(`Position (${newRow + 1}, ${newCol + 1})`);
        }
    }

    /**
     * Move cursor to specific position
     * @private
     */
    moveCursorTo(row, col) {
        this.currentRow = Math.max(0, Math.min(this.boardSize - 1, row));
        this.currentCol = Math.max(0, Math.min(this.boardSize - 1, col));
        this.updateCursorPosition();
        this.provideFeedback(`Springe zu Position (${this.currentRow + 1}, ${this.currentCol + 1})`);
    }

    /**
     * Update cursor visual position
     * @private
     */
    updateCursorPosition() {
        if (!this.cursorIndicator || !this.boardRenderer) return;
        
        const targetCell = this.boardRenderer.getCellAt(this.currentRow, this.currentCol);
        if (targetCell) {
            // Remove from previous position
            const currentParent = this.cursorIndicator.parentNode;
            if (currentParent) {
                currentParent.removeChild(this.cursorIndicator);
            }
            
            // Position relatively within target cell
            targetCell.style.position = 'relative';
            targetCell.appendChild(this.cursorIndicator);
            
            // Add focus class for styling
            document.querySelectorAll('.board-cell.keyboard-focus').forEach(cell => {
                cell.classList.remove('keyboard-focus');
            });
            targetCell.classList.add('keyboard-focus');
        }
    }

    /**
     * Select piece at current position
     * @private
     */
    selectPiece() {
        const piece = this.boardRenderer.getPieceAt(this.currentRow, this.currentCol);
        
        if (piece && piece.type === 'lpiece') {
            const currentPlayer = this.gameLogic.getCurrentPlayer();
            
            if (piece.player === currentPlayer) {
                this.selectedPiece = {
                    row: this.currentRow,
                    col: this.currentCol,
                    player: piece.player
                };
                
                this.boardRenderer.selectPiece(this.currentRow, this.currentCol);
                this.showOrientationSelector();
                this.provideFeedback(`L-Stück ausgewählt. Orientierung: ${this.selectedOrientation}`);
            } else {
                this.provideFeedback('Das ist nicht Ihr L-Stück!');
            }
        } else {
            this.provideFeedback('Keine L-Stück an dieser Position');
        }
    }

    /**
     * Place L-piece at current position with selected orientation
     * @private
     */
    async placeLPiece() {
        if (!this.selectedPiece) {
            this.provideFeedback('Erst ein L-Stück auswählen (Leertaste)');
            return;
        }
        
        try {
            // Attempt to make move
            const success = await this.gameLogic.makeMove(
                this.currentRow,
                this.currentCol, 
                this.selectedOrientation
            );
            
            if (success) {
                this.provideFeedback('Zug erfolgreich!');
                this.cancelSelection();
            } else {
                this.provideFeedback('Ungültiger Zug');
            }
        } catch (error) {
            this.provideFeedback(`Fehler: ${error.message}`);
        }
    }

    /**
     * Rotate L-piece orientation
     * @private
     */
    rotateOrientation(direction = 1) {
        this.selectedOrientation = (this.selectedOrientation + direction + 8) % 8;
        this.updateOrientationDisplay();
        this.provideFeedback(`Orientierung: ${this.selectedOrientation}`);
        this.previewOrientation();
    }

    /**
     * Flip L-piece orientation horizontally
     * @private
     */
    flipOrientation() {
        // Horizontal flip mapping for L-piece orientations
        const flipMap = [1, 0, 3, 2, 5, 4, 7, 6];
        this.selectedOrientation = flipMap[this.selectedOrientation];
        this.updateOrientationDisplay();
        this.provideFeedback(`Horizontal gespiegelt - Orientierung: ${this.selectedOrientation}`);
        this.previewOrientation();
    }

    /**
     * Flip L-piece orientation vertically
     * @private
     */
    flipVertically() {
        // Vertical flip mapping for L-piece orientations
        const flipMap = [3, 2, 1, 0, 7, 6, 5, 4];
        this.selectedOrientation = flipMap[this.selectedOrientation];
        this.updateOrientationDisplay();
        this.provideFeedback(`Vertikal gespiegelt - Orientierung: ${this.selectedOrientation}`);
        this.previewOrientation();
    }

    /**
     * Set specific orientation
     * @private
     */
    setOrientation(orientation) {
        if (orientation >= 0 && orientation <= 7) {
            this.selectedOrientation = orientation;
            this.updateOrientationDisplay();
            this.provideFeedback(`Orientierung gesetzt: ${orientation}`);
            this.previewOrientation();
        }
    }

    /**
     * Show orientation selector
     * @private
     */
    showOrientationSelector() {
        if (!this.orientationIndicator) return;
        
        this.orientationIndicator.innerHTML = `
            <div class="text-white text-sm font-bold mb-2">🧩 L-Stück Orientierung</div>
            <div class="grid grid-cols-4 gap-1 mb-3">
                ${Array.from({length: 8}, (_, i) => `
                    <button class="orientation-btn ${i === this.selectedOrientation ? 'selected' : ''}"
                            data-orientation="${i}" style="
                        width: 24px; height: 24px; border: 1px solid #fff; 
                        background: ${i === this.selectedOrientation ? '#fbbf24' : 'rgba(255,255,255,0.2)'};
                        color: ${i === this.selectedOrientation ? '#000' : '#fff'};
                        border-radius: 4px; font-size: 10px; cursor: pointer;
                    ">${i}</button>
                `).join('')}
            </div>
            <div class="text-xs text-gray-300">
                R/Shift+R: Drehen | F: Spiegeln | 1-8: Direkt | ESC: Abbrechen
            </div>
        `;
        
        this.orientationIndicator.style.display = 'block';
        
        // Bind orientation button clicks
        this.orientationIndicator.querySelectorAll('.orientation-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orientation = parseInt(btn.dataset.orientation);
                this.setOrientation(orientation);
            });
        });
    }

    /**
     * Update orientation display
     * @private
     */
    updateOrientationDisplay() {
        if (!this.orientationIndicator) return;
        
        // Update selected orientation button
        this.orientationIndicator.querySelectorAll('.orientation-btn').forEach((btn, index) => {
            if (index === this.selectedOrientation) {
                btn.classList.add('selected');
                btn.style.background = '#fbbf24';
                btn.style.color = '#000';
            } else {
                btn.classList.remove('selected');
                btn.style.background = 'rgba(255,255,255,0.2)';
                btn.style.color = '#fff';
            }
        });
    }

    /**
     * Preview orientation at cursor position
     * @private
     */
    previewOrientation() {
        if (!this.selectedPiece) return;
        
        // Clear previous previews
        this.boardRenderer.clearHighlights();
        
        // Show preview of L-piece placement
        try {
            const validMove = this.gameLogic.isValidLMove(
                this.currentRow, 
                this.currentCol, 
                this.selectedOrientation
            );
            
            if (validMove) {
                // Get L-piece shape for orientation
                const shape = this.getLPieceShape(this.selectedOrientation);
                const previewPositions = shape.map(([dr, dc]) => [
                    this.currentRow + dr,
                    this.currentCol + dc
                ]).filter(([r, c]) => r >= 0 && r < 4 && c >= 0 && c < 4);
                
                this.boardRenderer.highlightValidMoves(previewPositions);
            }
        } catch (error) {
            console.warn('Preview failed:', error);
        }
    }

    /**
     * Get L-piece shape for orientation
     * @private
     */
    getLPieceShape(orientation) {
        // L-piece shapes for each orientation (relative to anchor point)
        const shapes = [
            [[0, 0], [1, 0], [2, 0], [2, 1]], // Orientation 0
            [[0, 0], [0, 1], [0, 2], [1, 0]], // Orientation 1  
            [[0, 0], [0, 1], [1, 1], [2, 1]], // Orientation 2
            [[0, 2], [1, 0], [1, 1], [1, 2]], // Orientation 3
            [[0, 1], [1, 1], [2, 0], [2, 1]], // Orientation 4
            [[0, 0], [1, 0], [1, 1], [1, 2]], // Orientation 5
            [[0, 0], [0, 1], [1, 0], [2, 0]], // Orientation 6
            [[0, 0], [0, 1], [0, 2], [1, 2]]  // Orientation 7
        ];
        
        return shapes[orientation] || shapes[0];
    }

    /**
     * Cancel current selection
     * @private
     */
    cancelSelection() {
        this.selectedPiece = null;
        this.selectedOrientation = 0;
        
        if (this.orientationIndicator) {
            this.orientationIndicator.style.display = 'none';
        }
        
        this.boardRenderer.clearSelection();
        this.boardRenderer.clearHighlights();
        this.provideFeedback('Auswahl abgebrochen');
    }

    /**
     * Game control shortcuts
     */
    newGame() {
        if (this.gameLogic.newGame) {
            this.gameLogic.newGame();
            this.provideFeedback('Neues Spiel gestartet');
            this.cancelSelection();
        }
    }

    undoMove() {
        if (this.gameLogic.undoMove) {
            const success = this.gameLogic.undoMove();
            this.provideFeedback(success ? 'Zug rückgängig' : 'Kann nicht rückgängig machen');
            this.cancelSelection();
        }
    }

    /**
     * Show keyboard help
     * @private
     */
    showHelp() {
        const helpText = `
🎮 L-Game Tastatur-Steuerung:

Navigation:
• Pfeiltasten: Cursor bewegen
• Home/End: Zu Ecken springen

L-Stück Steuerung:
• Leertaste: L-Stück auswählen
• Enter: L-Stück platzieren
• R: Orientierung drehen (↻)
• Shift+R: Gegen den Uhrzeigersinn (↺)
• F: Horizontal spiegeln
• Shift+F: Vertikal spiegeln
• 1-8: Orientierung direkt wählen
• ESC: Auswahl abbrechen

Spiel-Steuerung:
• N: Neues Spiel
• U: Zug rückgängig
• H: Diese Hilfe anzeigen
        `;
        
        this.provideFeedback(helpText, 'help');
    }

    /**
     * Show keyboard help in UI
     * @private
     */
    showKeyboardHelp() {
        // Create or update help display
        let helpElement = document.getElementById('keyboard-help');
        if (!helpElement) {
            helpElement = document.createElement('div');
            helpElement.id = 'keyboard-help';
            helpElement.className = 'lc-glass rounded-xl p-4';
            
            // Find sidebar or create floating element
            const sidebar = document.querySelector('.space-y-6');
            if (sidebar) {
                sidebar.appendChild(helpElement);
            }
        }
        
        helpElement.innerHTML = `
            <h3 class="text-lg font-bold text-white mb-3">⌨️ Tastatur-Steuerung</h3>
            <div class="text-sm text-gray-200 space-y-1">
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">↑↓←→</kbd> Navigation</div>
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">Space</kbd> Auswählen</div>
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">Enter</kbd> Platzieren</div>
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">R</kbd> Drehen</div>
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">F</kbd> Spiegeln</div>
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">1-8</kbd> Orientierung</div>
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">ESC</kbd> Abbrechen</div>
                <div><kbd class="bg-gray-700 px-1 rounded text-xs">H</kbd> Vollständige Hilfe</div>
            </div>
        `;
    }

    /**
     * Provide audio/visual feedback
     * @private
     */
    provideFeedback(message, type = 'info') {
        // Visual feedback via message system (if available)
        if (window.messageSystem) {
            window.messageSystem.showMessage(message, type, 2000);
        } else {
            console.log(`⌨️ ${message}`);
        }
        
        // Screen reader announcement
        this.announceToScreenReader(message);
    }

    /**
     * Announce message to screen readers
     * @private
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Enable/disable keyboard controller
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (this.cursorIndicator) {
            this.cursorIndicator.style.display = enabled ? 'block' : 'none';
        }
        
        if (!enabled) {
            this.cancelSelection();
        }
    }

    /**
     * Get current position
     */
    getCurrentPosition() {
        return {
            row: this.currentRow,
            col: this.currentCol,
            selectedPiece: this.selectedPiece,
            selectedOrientation: this.selectedOrientation
        };
    }

    /**
     * Cleanup keyboard controller
     */
    destroy() {
        if (this.cursorIndicator && this.cursorIndicator.parentNode) {
            this.cursorIndicator.parentNode.removeChild(this.cursorIndicator);
        }
        
        if (this.orientationIndicator && this.orientationIndicator.parentNode) {
            this.orientationIndicator.parentNode.removeChild(this.orientationIndicator);
        }
        
        this.initialized = false;
    }
}