/**
 * Connect4UI - Production Implementation
 * 
 * Clean, production-ready implementation with full UI-Module System integration
 * and enhanced UX features.
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { CONNECT4_UI_CONFIG } from './connect4-config.js';

export class Connect4UI extends BaseGameUI {
    constructor(game) {
        const config = CONNECT4_UI_CONFIG;
        
        super(game, config);
        
        // UX state
        this.hoveredColumn = null;
        this.previewDisc = null;
        this.isProcessingMove = false;
        
        // Player assistance settings
        this.assistanceSettings = {
            player1: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false },
            player2: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false }
        };
        
        this.loadAssistanceSettings();
    }

    async beforeInit() {
        // Any pre-initialization logic
    }

    afterInit() {
        this.initializeBoard();
        this.setupGameEventListeners();
        this.setupAssistanceSystem();
        this.updateUI();
    }

    // Override bindKeyboardActions to add Connect4-specific actions
    bindKeyboardActions(keyboardController) {
        const actionMap = {
            'toggleHelp': () => this.toggleModal('help'),
            'toggleAssistance': () => this.toggleAssistance(),
            'closeModal': () => this.closeAllModals(),
            'newGame': () => this.newGame(),
            'undoMove': () => this.undoMove(),
            'resetScore': () => this.resetScore(),
            'dropColumn1': () => this.dropDisc(0),
            'dropColumn2': () => this.dropDisc(1),
            'dropColumn3': () => this.dropDisc(2),
            'dropColumn4': () => this.dropDisc(3),
            'dropColumn5': () => this.dropDisc(4),
            'dropColumn6': () => this.dropDisc(5),
            'dropColumn7': () => this.dropDisc(6)
        };
        
        Object.entries(this.config.keyboard).forEach(([key, action]) => {
            if (actionMap[action]) {
                keyboardController.register(key, action, actionMap[action]);
            }
        });
    }

    setupGameEventListeners() {
        if (!this.game) return;
        
        this.game.on('move', (moveData) => {
            this.updateBoard();
            this.updateGameStatus();
            this.updatePlayerIndicator();
            this.updateAssistanceHighlights();
        });
        
        this.game.on('gameOver', (gameData) => {
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
            this.showMessage('Spiel geladen!', 'success');
            this.updateUI();
        });
        
        this.game.on('error', (error) => {
            this.showMessage(`Spielfehler: ${error.message}`, 'error');
        });
    }

    initializeBoard() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

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
                
                // Add interaction handlers
                slot.addEventListener('click', () => this.dropDisc(col));
                slot.addEventListener('mouseenter', () => this.onColumnHover(col));
                slot.addEventListener('mouseleave', () => this.onColumnHoverLeave());
                
                gameBoard.appendChild(slot);
            }
        }
    }

    dropDisc(col) {
        if (this.isProcessingMove) return;
        
        if (!this.game) {
            console.log('Game not available');
            return;
        }
        
        if (!this.game.isInitialized) {
            console.log('Game not initialized, retrying...');
            this.retryMoveWithBackoff(col, 1);
            return;
        }
        
        this.isProcessingMove = true;
        
        try {
            this.hideDropPreview();
            
            const moveResult = this.game.makeMove(col);
            this.animateDiscDrop(col, moveResult.player);
            
        } catch (error) {
            console.log(`Invalid move: ${error.message}`);
            this.isProcessingMove = false;
        }
    }

    retryMoveWithBackoff(col, attempt, maxAttempts = 5) {
        if (attempt > maxAttempts) {
            console.log('Game could not be initialized. Please reload page.');
            return;
        }

        const backoffDelay = Math.min(500 * Math.pow(1.5, attempt - 1), 3000);
        
        setTimeout(() => {
            if (this.game.isInitialized) {
                this.dropDisc(col);
            } else {
                this.retryMoveWithBackoff(col, attempt + 1, maxAttempts);
            }
        }, backoffDelay);
    }

    // ENHANCED UX: Disc Drop Animation System
    animateDiscDrop(col, player) {
        if (!this.game || !this.game.isInitialized) {
            this.isProcessingMove = false;
            return;
        }

        try {
            const dropRow = this.game.getDropRow(col);
            if (dropRow === -1) {
                this.updateBoard();
                this.isProcessingMove = false;
                return;
            }

            this.createDropAnimation(col, dropRow, player);

        } catch (error) {
            this.updateBoard();
            this.isProcessingMove = false;
        }
    }

    createDropAnimation(col, targetRow, player) {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) {
            this.isProcessingMove = false;
            return;
        }

        const targetSlot = gameBoard.querySelector(
            `.game-slot[data-row="${targetRow}"][data-col="${col}"]`
        );

        if (!targetSlot) {
            this.updateBoard();
            this.isProcessingMove = false;
            return;
        }

        // Create animated disc
        const animatedDisc = document.createElement('div');
        animatedDisc.className = `disc ${player === 1 ? 'yellow' : 'red'} dropping`;
        
        const topSlot = gameBoard.querySelector(
            `.game-slot[data-row="0"][data-col="${col}"]`
        );

        if (topSlot) {
            const boardRect = gameBoard.getBoundingClientRect();
            const topSlotRect = topSlot.getBoundingClientRect();
            const targetSlotRect = targetSlot.getBoundingClientRect();

            animatedDisc.style.position = 'absolute';
            animatedDisc.style.left = `${topSlotRect.left - boardRect.left + (topSlotRect.width * 0.075)}px`;
            animatedDisc.style.top = `${-60}px`;
            animatedDisc.style.width = `${topSlotRect.width * 0.85}px`;
            animatedDisc.style.height = `${topSlotRect.height * 0.85}px`;
            animatedDisc.style.zIndex = '100';
            animatedDisc.style.borderRadius = '50%';
            animatedDisc.style.transition = 'none';

            gameBoard.style.position = 'relative';
            gameBoard.appendChild(animatedDisc);

            const finalTop = targetSlotRect.top - boardRect.top + (targetSlotRect.height * 0.075);

            setTimeout(() => {
                animatedDisc.style.transition = 'top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                animatedDisc.style.top = `${finalTop}px`;

                setTimeout(() => {
                    animatedDisc.remove();
                    this.updateBoard();
                    this.updateAssistanceHighlights();
                    this.isProcessingMove = false;
                }, 650);
            }, 50);
        } else {
            this.updateBoard();
            this.isProcessingMove = false;
        }
    }

    // ENHANCED COLUMN HOVER SYSTEM
    onColumnHover(col) {
        if (this.isProcessingMove || (this.game && this.game.isGameOver && this.game.isGameOver())) return;
        
        this.hoveredColumn = col;
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

    showDropPreview(col) {
        if (!this.game || !this.game.isInitialized) return;
        if (this.game.isColumnFull && this.game.isColumnFull(col)) return;
        
        const dropRow = this.game.getDropRow ? this.game.getDropRow(col) : null;
        if (dropRow === null || dropRow === -1) return;
        
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
                disc.style.transform = 'scale(0.8)';
                disc.style.transition = 'all 0.3s ease';
                
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

    // GAME STATE UPDATE METHODS
    updateBoard() {
        if (!this.game || !this.game.isInitialized) return;
        
        const board = this.game.getBoard();
        const slots = this.elements.gameBoard.querySelectorAll('.game-slot');
        
        slots.forEach((slot, index) => {
            const disc = slot.querySelector('.disc');
            if (disc) {
                const cellValue = board[index];
                
                disc.classList.remove('empty', 'yellow', 'red', 'dropping');
                
                if (cellValue === 0) {
                    disc.classList.add('empty');
                } else if (cellValue === 1) {
                    disc.classList.add('yellow');
                } else if (cellValue === 2) {
                    disc.classList.add('red');
                }
            }
        });
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

    updateUI() {
        this.updateBoard();
        this.updateGameStatus();
        this.updatePlayerIndicator();
        this.updateAssistanceHighlights();
    }

    // PLAYER ASSISTANCE SYSTEM
    setupAssistanceSystem() {
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
            }
        } catch (error) {
            // Silent failure for localStorage issues
        }
    }

    updateAssistanceModal() {
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
        try {
            localStorage.setItem('connect4-assistance-settings', JSON.stringify(this.assistanceSettings));
        } catch (error) {
            // Silent failure for localStorage issues
        }
        
        this.updateAssistanceHighlights();
        this.showMessage('Spielerhilfen-Einstellungen gespeichert', 'success');
    }

    updateAssistanceHighlights() {
        if (!this.game || !this.game.isInitialized) return;

        const currentPlayer = this.game.getCurrentPlayer();
        const currentPlayerKey = currentPlayer === 1 ? 'player1' : 'player2';
        const settings = this.assistanceSettings[currentPlayerKey];
        
        this.clearAssistanceHighlights();

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

        gameBoard.querySelectorAll('.game-slot').forEach(slot => {
            slot.classList.remove('highlight-winning', 'highlight-threat', 'highlight-blocked');
        });
    }

    highlightWinningMoves() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            const winningMoves = this.game.getWinningMoves();
            winningMoves.forEach(col => {
                this.highlightColumn(col, 'highlight-winning');
            });

            if (winningMoves.length > 0) {
                this.showMessage(`🏆 ${winningMoves.length} Gewinnzug${winningMoves.length > 1 ? 'e' : ''} verfügbar!`, 'success');
            }
        } catch (error) {
            // Silent failure for analysis issues
        }
    }

    highlightThreats() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            const blockingMoves = this.game.getBlockingMoves();
            blockingMoves.forEach(col => {
                this.highlightColumn(col, 'highlight-threat');
            });

            if (blockingMoves.length > 0) {
                this.showMessage(`⚠️ ${blockingMoves.length} Bedrohung${blockingMoves.length > 1 ? 'en' : ''} blockieren!`, 'warning');
            }
        } catch (error) {
            // Silent failure for analysis issues
        }
    }

    highlightBlockedColumns() {
        if (!this.game || !this.game.isInitialized) return;

        try {
            const dangerousMoves = this.game.getDangerousMoves();
            const blockedColumns = this.game.getBlockedColumns ? this.game.getBlockedColumns() : [];
            
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
            // Silent failure for analysis issues
        }
    }

    highlightColumn(col, highlightClass) {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        const columnSlots = gameBoard.querySelectorAll(`.game-slot[data-col="${col}"]`);
        columnSlots.forEach(slot => {
            slot.classList.add(highlightClass);
        });
    }

    // KEYBOARD ACTIONS
    toggleAssistance() {
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
            this.showMessage(`Rückgängig fehlgeschlagen: ${error.message}`, 'error');
        }
    }

    newGame() {
        if (this.game && this.game.newGame) {
            this.game.newGame();
            this.updateUI();
        }
    }

    // Add AI support (called from main)
    setAI(aiInstance) {
        this.ai = aiInstance;
    }

    setGameMode(mode) {
        // Handle game mode changes
        if (this.ai) {
            this.ai.setGameMode(mode);
        }
    }
}