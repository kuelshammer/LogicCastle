/**
 * Connect4UI - Debug Implementation
 * 
 * Minimal implementation to test UI-Module System integration
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';

export class Connect4UIDebug extends BaseGameUI {
    constructor(game) {
        console.log('🔴 Connect4UIDebug constructor called');
        
        const minimalConfig = {
            elements: {
                required: ['gameBoard', 'currentPlayerIndicator', 'gameStatus'],
                optional: []
            },
            modals: {},
            keyboard: {
                'F1': 'toggleHelp',
                'F2': 'toggleAssistance',
                'n': 'newGame',
                'u': 'undoMove'
            },
            messages: {
                position: 'top-right',
                duration: 3000
            }
        };
        
        super(game, minimalConfig);
        
        // Preview system
        this.hoveredColumn = null;
        this.previewDisc = null;
        
        // Initialize assistance settings with defaults
        this.assistanceSettings = {
            player1: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false },
            player2: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false }
        };
        
        // Load saved assistance settings
        this.loadAssistanceSettings();
        
        console.log('🔴 Connect4UIDebug constructor completed');
    }

    async beforeInit() {
        console.log('🔴 Connect4UIDebug beforeInit called');
    }

    afterInit() {
        console.log('🔴 Connect4UIDebug afterInit called');
        this.initializeBoard();
        this.setupGameEventListeners();
        this.setupAssistanceSystem();
        this.updateUI();
    }

    // Override bindKeyboardActions to add assistance actions
    bindKeyboardActions(keyboardController) {
        // Call parent implementation first to get base actions
        const baseActionMap = {
            'toggleHelp': () => this.toggleModal('help'),
            'toggleGameHelp': () => this.toggleModal('gameHelp'),
            'closeModal': () => this.closeAllModals(),
            'newGame': () => this.newGame(),
            'undoMove': () => this.undoMove(),
            'resetScore': () => this.resetScore()
        };
        
        // Add our custom actions
        const connect4ActionMap = {
            ...baseActionMap,
            'toggleAssistance': () => this.toggleAssistance(),
            'undoMove': () => this.undoMove() // Override with our implementation
        };
        
        // Register all keyboard shortcuts with their actions
        Object.entries(this.config.keyboard).forEach(([key, action]) => {
            if (connect4ActionMap[action]) {
                keyboardController.register(key, action, connect4ActionMap[action]);
            } else {
                console.warn(`⚠️ Unknown keyboard action: ${action}`);
            }
        });
        
        console.log('🎛️ Connect4 keyboard actions registered');
    }

    setupAssistanceSystem() {
        console.log('🎛️ Setting up player assistance system...');
        
        // Setup assistance modal handlers
        const assistanceBtn = document.getElementById('assistanceBtn');
        const assistanceModal = document.getElementById('assistanceModal');
        const closeAssistanceBtn = document.getElementById('closeAssistanceBtn');
        
        if (assistanceBtn && assistanceModal) {
            assistanceBtn.addEventListener('click', () => {
                assistanceModal.style.display = 'flex';
                this.updateAssistanceModal();
            });
        }
        
        if (closeAssistanceBtn && assistanceModal) {
            closeAssistanceBtn.addEventListener('click', () => {
                this.saveAssistanceSettings();
                assistanceModal.style.display = 'none';
            });
        }
        
        // Setup assistance checkboxes
        const assistanceTypes = ['undo', 'threats', 'winning-moves', 'blocked-columns'];
        assistanceTypes.forEach(type => {
            const checkbox1 = document.getElementById(`player1-${type}`);
            const checkbox2 = document.getElementById(`player2-${type}`);
            
            if (checkbox1) {
                checkbox1.addEventListener('change', (e) => {
                    this.assistanceSettings.player1[type] = e.target.checked;
                    this.updateAssistanceHighlights();
                });
            }
            
            if (checkbox2) {
                checkbox2.addEventListener('change', (e) => {
                    this.assistanceSettings.player2[type] = e.target.checked;
                    this.updateAssistanceHighlights();
                });
            }
        });
        
        console.log('✅ Player assistance system setup complete');
    }

    setupGameEventListeners() {
        if (!this.game) return;
        
        // Listen for game events
        this.game.on('move', (moveData) => {
            console.log('🔴 Game move event:', moveData);
            this.updateBoard();
            this.updateGameStatus();
            this.updatePlayerIndicator();
        });
        
        this.game.on('gameOver', (gameData) => {
            console.log('🔴 Game over event:', gameData);
            this.updateBoard();
            this.updateGameStatus();
            
            const winner = gameData.winner;
            if (winner) {
                const winnerName = winner === 1 ? 'Gelb' : 'Rot';
                this.showMessage(`🏆 ${winnerName} hat gewonnen!`, 'success');
            } else {
                this.showMessage('🤝 Unentschieden!', 'info');
            }
        });
        
        this.game.on('initialized', () => {
            console.log('🔴 Game initialized event received');
            console.log('🔴 Game.isInitialized:', this.game.isInitialized);
            this.showMessage('Spiel geladen!', 'success');
            this.updateUI();
        });
        
        this.game.on('error', (error) => {
            console.log('🔴 Game error event:', error);
            this.showMessage(`Spielfehler: ${error.message}`, 'error');
        });
    }

    initializeBoard() {
        console.log('🔴 Initializing Connect4 board');
        
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) {
            console.error('❌ Game board element not found');
            return;
        }

        // Clear and create basic board
        gameBoard.innerHTML = '';
        gameBoard.className = 'game-board connect4-board';

        // Create 6x7 grid
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const slot = document.createElement('div');
                slot.className = 'game-slot';
                slot.dataset.row = row;
                slot.dataset.col = col;
                
                const disc = document.createElement('div');
                disc.className = 'disc empty';
                slot.appendChild(disc);
                
                // Add click handler
                slot.addEventListener('click', () => {
                    console.log(`🔴 Column ${col} clicked`);
                    this.dropDisc(col);
                });
                
                // Add hover handlers for preview
                slot.addEventListener('mouseenter', () => {
                    this.onColumnHover(col);
                });
                
                slot.addEventListener('mouseleave', () => {
                    this.onColumnHoverLeave();
                });
                
                gameBoard.appendChild(slot);
            }
        }
        
        console.log('✅ Connect4 board created');
    }

    dropDisc(col) {
        console.log(`🔴 Dropping disc in column ${col}`);
        
        if (!this.game) {
            console.error('❌ Game not available');
            this.showMessage('Spiel nicht verfügbar', 'error');
            return;
        }
        
        // Check initialization with more debug info
        console.log('🔍 Game state check:');
        console.log('  - game.isInitialized:', this.game.isInitialized);
        console.log('  - game.wasmGame:', this.game.wasmGame ? 'exists' : 'missing');
        console.log('  - game.usingWASM:', this.game.usingWASM);
        
        if (!this.game.isInitialized) {
            console.error('❌ Game not initialized');
            this.showMessage('Spiel noch nicht initialisiert - warte kurz...', 'warning');
            
            // ROBUST RETRY: Multiple attempts with better timing
            this.retryMoveWithBackoff(col, 1);
            return;
        }
        
        try {
            // Hide preview before making move
            this.hideDropPreview();
            
            const moveResult = this.game.makeMove(col);
            console.log('✅ Move successful:', moveResult);
            
            // ENHANCED UX: Animate the disc drop
            this.animateDiscDrop(col, moveResult.player);
            
        } catch (error) {
            console.error('❌ Move failed:', error);
            this.showMessage(`Ungültiger Zug: ${error.message}`, 'error');
        }
    }

    // ROBUST RETRY SYSTEM for moves when game is not yet initialized
    retryMoveWithBackoff(col, attempt, maxAttempts = 5) {
        if (attempt > maxAttempts) {
            console.error(`❌ Failed to make move after ${maxAttempts} attempts`);
            this.showMessage('Spiel konnte nicht initialisiert werden. Bitte Seite neu laden.', 'error');
            return;
        }

        const backoffDelay = Math.min(500 * Math.pow(1.5, attempt - 1), 3000);
        console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} in ${backoffDelay}ms...`);
        
        setTimeout(() => {
            if (this.game.isInitialized) {
                console.log(`✅ Game initialized after ${attempt} attempts, making move...`);
                this.dropDisc(col);
            } else {
                console.log(`⏳ Game still not ready, attempt ${attempt}/${maxAttempts}`);
                this.retryMoveWithBackoff(col, attempt + 1, maxAttempts);
            }
        }, backoffDelay);
    }

    updateBoard() {
        if (!this.game || !this.game.isInitialized) return;
        
        const board = this.game.getBoard();
        const slots = this.elements.gameBoard.querySelectorAll('.game-slot');
        
        slots.forEach((slot, index) => {
            const disc = slot.querySelector('.disc');
            if (disc) {
                const cellValue = board[index];
                
                // Clear previous classes
                disc.classList.remove('empty', 'yellow', 'red', 'dropping');
                
                if (cellValue === 0) {
                    disc.classList.add('empty');
                } else if (cellValue === 1) {
                    disc.classList.add('yellow');
                    console.log(`🔴 Set yellow disc at index ${index}`);
                } else if (cellValue === 2) {
                    disc.classList.add('red');
                    console.log(`🔴 Set red disc at index ${index}`);
                }
            }
        });
    }

    updateUI() {
        console.log('🔴 Updating UI');
        this.updateBoard();
        this.updateGameStatus();
        this.updatePlayerIndicator();
    }

    updateGameStatus() {
        const gameStatus = this.elements.gameStatus;
        if (!gameStatus || !this.game) return;
        
        if (this.game.isGameOver && this.game.isGameOver()) {
            const winner = this.game.getWinner();
            if (winner) {
                const playerName = winner === 1 ? 'Gelb' : 'Rot';
                gameStatus.textContent = `${playerName} hat gewonnen!`;
                gameStatus.className = 'game-status winner';
            } else {
                gameStatus.textContent = 'Unentschieden!';
                gameStatus.className = 'game-status draw';
            }
        } else {
            const currentPlayer = this.game.getCurrentPlayer ? this.game.getCurrentPlayer() : 1;
            const playerName = currentPlayer === 1 ? 'Gelb' : 'Rot';
            gameStatus.textContent = `${playerName} ist am Zug`;
            gameStatus.className = 'game-status active';
        }
    }

    updatePlayerIndicator() {
        const indicator = this.elements.currentPlayerIndicator;
        if (!indicator || !this.game) return;
        
        const currentPlayer = this.game.getCurrentPlayer ? this.game.getCurrentPlayer() : 1;
        const disc = indicator.querySelector('.player-disc');
        const name = indicator.querySelector('.player-name');
        
        if (disc) {
            disc.classList.remove('yellow', 'red');
            disc.classList.add(currentPlayer === 1 ? 'yellow' : 'red');
        }
        
        if (name) {
            name.textContent = currentPlayer === 1 ? 'Spieler 1' : 'Spieler 2';
        }
    }

    newGame() {
        console.log('🔴 New game requested');
        if (this.game && this.game.newGame) {
            this.game.newGame();
        }
    }

    showMessage(message, type = 'info') {
        const messageSystem = this.getModule('messages');
        if (messageSystem) {
            messageSystem.show(message, type);
        } else {
            console.log(`🔴 Message (${type}): ${message}`);
        }
    }

    // Add missing setAI method for compatibility
    setAI(aiInstance) {
        this.ai = aiInstance;
        console.log('🤖 AI instance set:', !!aiInstance);
    }

    onColumnHover(col) {
        if (this.isProcessingMove || (this.game && this.game.isGameOver && this.game.isGameOver())) return;
        
        this.hoveredColumn = col;
        this.showDropPreview(col);
    }

    onColumnHoverLeave() {
        this.hoveredColumn = null;
        this.hideDropPreview();
    }

    showDropPreview(col) {
        if (!this.game || !this.game.isInitialized) return;
        
        // Check if column is full
        if (this.game.isColumnFull && this.game.isColumnFull(col)) return;
        
        // Get drop row
        const dropRow = this.game.getDropRow ? this.game.getDropRow(col) : null;
        if (dropRow === null || dropRow === -1) return;
        
        // Find the slot
        const gameBoard = this.elements.gameBoard;
        const slot = gameBoard.querySelector(
            `.game-slot[data-row="${dropRow}"][data-col="${col}"]`
        );
        
        if (slot) {
            const disc = slot.querySelector('.disc');
            if (disc && disc.classList.contains('empty')) {
                const currentPlayer = this.game.getCurrentPlayer ? this.game.getCurrentPlayer() : 1;
                const playerClass = currentPlayer === 1 ? 'yellow' : 'red';
                
                disc.classList.add('preview', playerClass);
                this.previewDisc = disc;
            }
        }
    }

    hideDropPreview() {
        if (this.previewDisc) {
            this.previewDisc.classList.remove('preview', 'yellow', 'red');
            this.previewDisc = null;
        }
    }

    // PLAYER ASSISTANCE SYSTEM IMPLEMENTATION

    updateAssistanceModal() {
        console.log('🎛️ Updating assistance modal...');
        
        const assistanceTypes = ['undo', 'threats', 'winning-moves', 'blocked-columns'];
        assistanceTypes.forEach(type => {
            const checkbox1 = document.getElementById(`player1-${type}`);
            const checkbox2 = document.getElementById(`player2-${type}`);
            
            if (checkbox1) {
                checkbox1.checked = this.assistanceSettings.player1[type] || false;
            }
            if (checkbox2) {
                checkbox2.checked = this.assistanceSettings.player2[type] || false;
            }
        });
    }

    saveAssistanceSettings() {
        console.log('💾 Saving assistance settings:', this.assistanceSettings);
        
        // Persist settings to localStorage
        try {
            localStorage.setItem('connect4-assistance-settings', JSON.stringify(this.assistanceSettings));
        } catch (error) {
            console.warn('⚠️ Could not save assistance settings to localStorage:', error);
        }
        
        // Update highlights based on new settings
        this.updateAssistanceHighlights();
        this.showMessage('Spielerhilfen-Einstellungen gespeichert', 'success');
    }

    loadAssistanceSettings() {
        try {
            const saved = localStorage.getItem('connect4-assistance-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.assistanceSettings = {
                    player1: { ...this.assistanceSettings.player1, ...settings.player1 },
                    player2: { ...this.assistanceSettings.player2, ...settings.player2 }
                };
                console.log('📄 Loaded assistance settings from localStorage:', this.assistanceSettings);
            }
        } catch (error) {
            console.warn('⚠️ Could not load assistance settings from localStorage:', error);
        }
    }

    updateAssistanceHighlights() {
        if (!this.game || !this.game.isInitialized) {
            return;
        }

        const currentPlayer = this.game.getCurrentPlayer();
        const currentPlayerKey = currentPlayer === 1 ? 'player1' : 'player2';
        const settings = this.assistanceSettings[currentPlayerKey];
        
        console.log(`🎛️ Updating assistance highlights for ${currentPlayerKey}:`, settings);

        // Clear all existing highlights
        this.clearAssistanceHighlights();

        // Apply highlights based on current player's settings
        if (settings['winning-moves']) {
            this.highlightWinningMoves();
        }
        
        if (settings.threats) {
            this.highlightThreats();
        }
        
        if (settings['blocked-columns']) {
            this.highlightBlockedColumns();
        }
    }

    clearAssistanceHighlights() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        // Remove all assistance highlight classes
        gameBoard.querySelectorAll('.game-slot').forEach(slot => {
            slot.classList.remove(
                'highlight-winning', 'highlight-threat', 'highlight-blocked'
            );
        });
    }

    highlightWinningMoves() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            const winningMoves = this.game.getWinningMoves();
            console.log('🏆 Highlighting winning moves:', winningMoves);

            winningMoves.forEach(col => {
                this.highlightColumn(col, 'highlight-winning');
            });

            if (winningMoves.length > 0) {
                this.showMessage(`🏆 ${winningMoves.length} Gewinnzug${winningMoves.length > 1 ? 'e' : ''} verfügbar!`, 'success');
            }
        } catch (error) {
            console.warn('⚠️ Failed to highlight winning moves:', error);
        }
    }

    highlightThreats() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            const blockingMoves = this.game.getBlockingMoves();
            console.log('🛡️ Highlighting threat blocks:', blockingMoves);

            blockingMoves.forEach(col => {
                this.highlightColumn(col, 'highlight-threat');
            });

            if (blockingMoves.length > 0) {
                this.showMessage(`⚠️ ${blockingMoves.length} Bedrohung${blockingMoves.length > 1 ? 'en' : ''} blockieren!`, 'warning');
            }
        } catch (error) {
            console.warn('⚠️ Failed to highlight threats:', error);
        }
    }

    highlightBlockedColumns() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            const dangerousMoves = this.game.getDangerousMoves();
            const blockedColumns = this.game.getBlockedColumns ? this.game.getBlockedColumns() : [];
            
            console.log('🚫 Highlighting dangerous/blocked columns:', { dangerousMoves, blockedColumns });

            dangerousMoves.forEach(col => {
                this.highlightColumn(col, 'highlight-blocked');
            });

            blockedColumns.forEach(col => {
                this.highlightColumn(col, 'highlight-blocked');
            });

            const totalBlocked = dangerousMoves.length + blockedColumns.length;
            if (totalBlocked > 0) {
                this.showMessage(`🚫 ${totalBlocked} gefährliche Spalte${totalBlocked > 1 ? 'n' : ''} markiert`, 'info');
            }
        } catch (error) {
            console.warn('⚠️ Failed to highlight blocked columns:', error);
        }
    }

    highlightColumn(col, highlightClass) {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        // Find all slots in this column
        const columnSlots = gameBoard.querySelectorAll(`.game-slot[data-col="${col}"]`);
        columnSlots.forEach(slot => {
            slot.classList.add(highlightClass);
        });
    }

    // Override updateUI to include assistance highlights
    updateUI() {
        console.log('🔴 Updating UI with assistance highlights');
        this.updateBoard();
        this.updateGameStatus();
        this.updatePlayerIndicator();
        this.updateAssistanceHighlights();
    }

    // KEYBOARD ACTIONS for assistance system

    toggleAssistance() {
        console.log('🎛️ Toggle assistance modal');
        const assistanceModal = document.getElementById('assistanceModal');
        if (assistanceModal) {
            const isVisible = assistanceModal.style.display === 'flex';
            if (isVisible) {
                this.saveAssistanceSettings();
                assistanceModal.style.display = 'none';
            } else {
                assistanceModal.style.display = 'flex';
                this.updateAssistanceModal();
            }
        }
    }

    undoMove() {
        if (!this.game || !this.game.isInitialized) {
            this.showMessage('Spiel noch nicht bereit', 'warning');
            return;
        }

        const currentPlayer = this.game.getCurrentPlayer();
        const currentPlayerKey = currentPlayer === 1 ? 'player1' : 'player2';
        const settings = this.assistanceSettings[currentPlayerKey];

        // Check if undo is enabled for current player
        if (!settings.undo) {
            this.showMessage('Rückgängig-Funktion für diesen Spieler deaktiviert', 'warning');
            return;
        }

        try {
            if (this.game.canUndo()) {
                this.game.undoMove();
                this.showMessage('Zug rückgängig gemacht', 'success');
                this.updateUI();
            } else {
                this.showMessage('Kein Zug zum Rückgängigmachen', 'info');
            }
        } catch (error) {
            console.error('❌ Undo failed:', error);
            this.showMessage(`Rückgängig fehlgeschlagen: ${error.message}`, 'error');
        }
    }

    toggleHelp() {
        console.log('❓ Toggle help modal');
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            const isVisible = helpModal.style.display === 'flex';
            helpModal.style.display = isVisible ? 'none' : 'flex';
        }
    }

    // ENHANCED UX: Disc Drop Animation System

    animateDiscDrop(col, player) {
        if (!this.game || !this.game.isInitialized) return;

        try {
            // Find the drop row for this column
            const dropRow = this.game.getDropRow(col);
            if (dropRow === -1) {
                // Column is full, just update board normally
                this.updateBoard();
                return;
            }

            console.log(`🎯 Animating disc drop: column ${col}, row ${dropRow}, player ${player}`);

            // Create animation disc at the top
            this.createDropAnimation(col, dropRow, player);

        } catch (error) {
            console.warn('⚠️ Animation failed, falling back to instant update:', error);
            this.updateBoard();
        }
    }

    createDropAnimation(col, targetRow, player) {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        // Find the target slot
        const targetSlot = gameBoard.querySelector(
            `.game-slot[data-row="${targetRow}"][data-col="${col}"]`
        );

        if (!targetSlot) {
            console.warn(`⚠️ Target slot not found: row ${targetRow}, col ${col}`);
            this.updateBoard();
            return;
        }

        // Create animated disc element
        const animatedDisc = document.createElement('div');
        animatedDisc.className = `disc ${player === 1 ? 'yellow' : 'red'} dropping`;
        
        // Position it at the top of the column
        const topSlot = gameBoard.querySelector(
            `.game-slot[data-row="0"][data-col="${col}"]`
        );

        if (topSlot) {
            // Position animated disc above the board
            const boardRect = gameBoard.getBoundingClientRect();
            const topSlotRect = topSlot.getBoundingClientRect();
            const targetSlotRect = targetSlot.getBoundingClientRect();

            animatedDisc.style.position = 'absolute';
            animatedDisc.style.left = `${topSlotRect.left - boardRect.left + (topSlotRect.width * 0.075)}px`;
            animatedDisc.style.top = `${-60}px`; // Start above the board
            animatedDisc.style.width = `${topSlotRect.width * 0.85}px`;
            animatedDisc.style.height = `${topSlotRect.height * 0.85}px`;
            animatedDisc.style.zIndex = '100';
            animatedDisc.style.borderRadius = '50%';
            animatedDisc.style.transition = 'none'; // We'll animate manually

            // Add to game board
            gameBoard.style.position = 'relative';
            gameBoard.appendChild(animatedDisc);

            // Calculate final position
            const finalTop = targetSlotRect.top - boardRect.top + (targetSlotRect.height * 0.075);

            // Start animation after a tiny delay
            setTimeout(() => {
                animatedDisc.style.transition = 'top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                animatedDisc.style.top = `${finalTop}px`;

                // After animation completes, update board and cleanup
                setTimeout(() => {
                    animatedDisc.remove();
                    this.updateBoard();
                    this.updateAssistanceHighlights(); // Refresh highlights after move
                }, 650);
            }, 50);
        } else {
            // Fallback to instant update
            this.updateBoard();
        }
    }

    // Enhanced column hover with smooth previews
    onColumnHover(col) {
        if (this.isProcessingMove || (this.game && this.game.isGameOver && this.game.isGameOver())) return;
        
        this.hoveredColumn = col;
        
        // Enhanced hover effects with smooth transitions
        this.showDropPreview(col);
        this.highlightColumnOnHover(col);
    }

    onColumnHoverLeave() {
        this.hoveredColumn = null;
        this.hideDropPreview();
        this.clearColumnHoverHighlights();
    }

    highlightColumnOnHover(col) {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        // Add subtle column highlight
        const columnSlots = gameBoard.querySelectorAll(`.game-slot[data-col="${col}"]`);
        columnSlots.forEach(slot => {
            slot.classList.add('column-hover');
        });
    }

    clearColumnHoverHighlights() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        const hoveredSlots = gameBoard.querySelectorAll('.game-slot.column-hover');
        hoveredSlots.forEach(slot => {
            slot.classList.remove('column-hover');
        });
    }

    // Enhanced preview system with better visual feedback
    showDropPreview(col) {
        if (!this.game || !this.game.isInitialized) return;
        
        // Check if column is full
        if (this.game.isColumnFull && this.game.isColumnFull(col)) return;
        
        // Get drop row
        const dropRow = this.game.getDropRow ? this.game.getDropRow(col) : null;
        if (dropRow === null || dropRow === -1) return;
        
        // Find the slot
        const gameBoard = this.elements.gameBoard;
        const slot = gameBoard.querySelector(
            `.game-slot[data-row="${dropRow}"][data-col="${col}"]`
        );
        
        if (slot) {
            const disc = slot.querySelector('.disc');
            if (disc && disc.classList.contains('empty')) {
                const currentPlayer = this.game.getCurrentPlayer ? this.game.getCurrentPlayer() : 1;
                const playerClass = currentPlayer === 1 ? 'yellow' : 'red';
                
                // Enhanced preview with smooth appearance
                disc.classList.add('preview', playerClass);
                disc.style.transform = 'scale(0.8)';
                disc.style.transition = 'all 0.3s ease';
                
                // Animate to full size
                setTimeout(() => {
                    disc.style.transform = 'scale(1)';
                }, 50);
                
                this.previewDisc = disc;
            }
        }
    }

    hideDropPreview() {
        if (this.previewDisc) {
            this.previewDisc.style.transition = 'all 0.2s ease';
            this.previewDisc.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                if (this.previewDisc) {
                    this.previewDisc.classList.remove('preview', 'yellow', 'red');
                    this.previewDisc.style.transform = '';
                    this.previewDisc.style.transition = '';
                    this.previewDisc = null;
                }
            }, 200);
        }
    }
}