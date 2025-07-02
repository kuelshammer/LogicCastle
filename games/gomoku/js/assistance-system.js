/**
 * Gomoku Assistance System
 * Provides visual and enforcement-based assistance for Gomoku players
 * Adapted from Connect4 assistance system with Gomoku-specific features
 */

class GomokuAssistanceSystem {
    constructor(ui) {
        this.ui = ui;
        this.game = ui.game;
        
        // Player assistance settings
        this.playerAssistance = {
            player1: {
                winningMoves: false,      // Enforce winning moves
                blockingMoves: false,     // Enforce blocking moves  
                openThreeWarning: false,  // Warn before creating dangerous open threes
                forkWarning: false,       // Warn about fork situations
                visualMode: false         // Show visual indicators without enforcement
            },
            player2: {
                winningMoves: false,
                blockingMoves: false,
                openThreeWarning: false,
                forkWarning: false,
                visualMode: false
            }
        };
        
        // Modal elements
        this.elements = {};
        
        // Analysis cache to prevent redundant calculations
        this.analysisCache = {
            boardHash: null,
            winningMoves: null,
            blockingMoves: null,
            openThrees: null,
            forks: null
        };
        
        // Initialize when DOM is ready
        this.init();
    }
    
    init() {
        this.bindElements();
        this.setupEventListeners();
        this.updateWasmStatus();
        console.log('🎛️ Gomoku Assistance System initialized');
    }
    
    bindElements() {
        this.elements = {
            // Modal
            assistanceModal: document.getElementById('assistanceModal'),
            closeAssistanceBtn: document.getElementById('closeAssistanceBtn'),
            resetAssistanceBtn: document.getElementById('resetAssistanceBtn'),
            assistanceBtn: document.getElementById('assistanceBtn'),
            
            // WASM Status
            wasmStatus: document.getElementById('wasmStatus'),
            
            // Player 1 (Black) checkboxes
            player1WinningMoves: document.getElementById('player1-winning-moves'),
            player1BlockingMoves: document.getElementById('player1-blocking-moves'),
            player1OpenThreeWarning: document.getElementById('player1-open-three-warning'),
            player1ForkWarning: document.getElementById('player1-fork-warning'),
            player1VisualMode: document.getElementById('player1-visual-mode'),
            
            // Player 2 (White) checkboxes  
            player2WinningMoves: document.getElementById('player2-winning-moves'),
            player2BlockingMoves: document.getElementById('player2-blocking-moves'),
            player2OpenThreeWarning: document.getElementById('player2-open-three-warning'),
            player2ForkWarning: document.getElementById('player2-fork-warning'),
            player2VisualMode: document.getElementById('player2-visual-mode')
        };
    }
    
    setupEventListeners() {
        // Modal controls
        this.elements.assistanceBtn?.addEventListener('click', () => this.showAssistanceModal());
        this.elements.closeAssistanceBtn?.addEventListener('click', () => this.hideAssistanceModal());
        this.elements.resetAssistanceBtn?.addEventListener('click', () => this.resetAllSettings());
        
        // Player 1 settings
        this.elements.player1WinningMoves?.addEventListener('change', (e) => {
            this.playerAssistance.player1.winningMoves = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🖤 Player 1 winning moves enforcement: ${e.target.checked}`);
        });
        
        this.elements.player1BlockingMoves?.addEventListener('change', (e) => {
            this.playerAssistance.player1.blockingMoves = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🖤 Player 1 blocking moves enforcement: ${e.target.checked}`);
        });
        
        this.elements.player1OpenThreeWarning?.addEventListener('change', (e) => {
            this.playerAssistance.player1.openThreeWarning = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🖤 Player 1 open three warning: ${e.target.checked}`);
        });
        
        this.elements.player1ForkWarning?.addEventListener('change', (e) => {
            this.playerAssistance.player1.forkWarning = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🖤 Player 1 fork warning: ${e.target.checked}`);
        });
        
        this.elements.player1VisualMode?.addEventListener('change', (e) => {
            this.playerAssistance.player1.visualMode = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🖤 Player 1 visual mode: ${e.target.checked}`);
        });
        
        // Player 2 settings
        this.elements.player2WinningMoves?.addEventListener('change', (e) => {
            this.playerAssistance.player2.winningMoves = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🤍 Player 2 winning moves enforcement: ${e.target.checked}`);
        });
        
        this.elements.player2BlockingMoves?.addEventListener('change', (e) => {
            this.playerAssistance.player2.blockingMoves = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🤍 Player 2 blocking moves enforcement: ${e.target.checked}`);
        });
        
        this.elements.player2OpenThreeWarning?.addEventListener('change', (e) => {
            this.playerAssistance.player2.openThreeWarning = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🤍 Player 2 open three warning: ${e.target.checked}`);
        });
        
        this.elements.player2ForkWarning?.addEventListener('change', (e) => {
            this.playerAssistance.player2.forkWarning = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🤍 Player 2 fork warning: ${e.target.checked}`);
        });
        
        this.elements.player2VisualMode?.addEventListener('change', (e) => {
            this.playerAssistance.player2.visualMode = e.target.checked;
            this.updateAssistanceDisplay();
            console.log(`🤍 Player 2 visual mode: ${e.target.checked}`);
        });
        
        // Close modal on overlay click
        this.elements.assistanceModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.assistanceModal) {
                this.hideAssistanceModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                this.showAssistanceModal();
            }
            if (e.key === 'Escape' && this.elements.assistanceModal?.classList.contains('show')) {
                this.hideAssistanceModal();
            }
        });
    }
    
    showAssistanceModal() {
        this.elements.assistanceModal?.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.syncCheckboxStates();
        this.updateWasmStatus();
    }
    
    hideAssistanceModal() {
        this.elements.assistanceModal?.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    syncCheckboxStates() {
        // Sync checkbox states with current settings
        if (this.elements.player1WinningMoves) this.elements.player1WinningMoves.checked = this.playerAssistance.player1.winningMoves;
        if (this.elements.player1BlockingMoves) this.elements.player1BlockingMoves.checked = this.playerAssistance.player1.blockingMoves;
        if (this.elements.player1OpenThreeWarning) this.elements.player1OpenThreeWarning.checked = this.playerAssistance.player1.openThreeWarning;
        if (this.elements.player1ForkWarning) this.elements.player1ForkWarning.checked = this.playerAssistance.player1.forkWarning;
        if (this.elements.player1VisualMode) this.elements.player1VisualMode.checked = this.playerAssistance.player1.visualMode;
        
        if (this.elements.player2WinningMoves) this.elements.player2WinningMoves.checked = this.playerAssistance.player2.winningMoves;
        if (this.elements.player2BlockingMoves) this.elements.player2BlockingMoves.checked = this.playerAssistance.player2.blockingMoves;
        if (this.elements.player2OpenThreeWarning) this.elements.player2OpenThreeWarning.checked = this.playerAssistance.player2.openThreeWarning;
        if (this.elements.player2ForkWarning) this.elements.player2ForkWarning.checked = this.playerAssistance.player2.forkWarning;
        if (this.elements.player2VisualMode) this.elements.player2VisualMode.checked = this.playerAssistance.player2.visualMode;
    }
    
    resetAllSettings() {
        // Reset all assistance settings
        for (const player of ['player1', 'player2']) {
            for (const setting in this.playerAssistance[player]) {
                this.playerAssistance[player][setting] = false;
            }
        }
        
        this.syncCheckboxStates();
        this.updateAssistanceDisplay();
        console.log('🔄 All assistance settings reset');
    }
    
    updateWasmStatus() {
        if (!this.elements.wasmStatus) return;
        
        const indicator = this.elements.wasmStatus.querySelector('.status-indicator');
        const text = this.elements.wasmStatus.querySelector('.status-text');
        
        if (this.game?.wasmGame && this.game.usingWASM) {
            this.elements.wasmStatus.className = 'wasm-status ready';
            indicator.textContent = '✅';
            text.textContent = 'WASM-Engine aktiv - Alle Features verfügbar';
        } else {
            this.elements.wasmStatus.className = 'wasm-status error';
            indicator.textContent = '❌';
            text.textContent = 'WASM nicht verfügbar - Grundfunktionen nur';
        }
    }
    
    // ==================== CORE ASSISTANCE LOGIC ====================
    
    /**
     * Main move validation - called before each move attempt
     * Returns: { allowed: boolean, reason?: string, suggestion?: string }
     */
    validateMove(row, col) {
        const currentPlayer = this.game.currentPlayer;
        const isPlayer1 = currentPlayer === 1; // Black
        const settings = isPlayer1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
        
        // Skip validation if no enforcement settings active
        if (!settings.winningMoves && !settings.blockingMoves && 
            !settings.openThreeWarning && !settings.forkWarning) {
            return { allowed: true };
        }
        
        console.log(`🔍 Validating move (${row}, ${col}) for ${isPlayer1 ? 'Black' : 'White'}`);
        
        try {
            // Check for winning moves enforcement
            if (settings.winningMoves) {
                const winningMoves = this.getWinningMoves(currentPlayer);
                if (winningMoves.length > 0) {
                    const isWinningMove = winningMoves.some(move => move.row === row && move.col === col);
                    if (!isWinningMove) {
                        return {
                            allowed: false,
                            reason: `Du hast einen Gewinnzug verfügbar!`,
                            suggestion: `Spiele auf (${String.fromCharCode(65 + winningMoves[0].col)}${winningMoves[0].row + 1}) um zu gewinnen.`
                        };
                    }
                }
            }
            
            // Check for blocking moves enforcement
            if (settings.blockingMoves) {
                const opponent = currentPlayer === 1 ? 2 : 1;
                const opponentWinningMoves = this.getWinningMoves(opponent);
                if (opponentWinningMoves.length > 0) {
                    const isBlockingMove = opponentWinningMoves.some(move => move.row === row && move.col === col);
                    if (!isBlockingMove) {
                        return {
                            allowed: false,
                            reason: `Du musst den Gegner blocken!`,
                            suggestion: `Der Gegner kann gewinnen auf (${String.fromCharCode(65 + opponentWinningMoves[0].col)}${opponentWinningMoves[0].row + 1}). Du musst dort blocken!`
                        };
                    }
                }
            }
            
            // Check for open three warning
            if (settings.openThreeWarning) {
                const wouldCreateOpenThree = this.wouldCreateDangerousOpenThree(row, col, currentPlayer);
                if (wouldCreateOpenThree) {
                    // This is a warning, not enforcement - show dialog but allow move
                    this.showWarningDialog(
                        'Gefährlicher Zug!',
                        'Dieser Zug erstellt ein offenes Drei-Muster (_ X X X _), das dem Gegner eine Zwickmühle ermöglichen könnte.',
                        () => this.game.makeMove(row, col) // Allow move if user confirms
                    );
                    return { allowed: false }; // Temporarily block to show warning
                }
            }
            
            // Check for fork warning  
            if (settings.forkWarning) {
                const wouldCreateFork = this.wouldCreateFork(row, col, currentPlayer);
                if (wouldCreateFork) {
                    this.showWarningDialog(
                        'Gabel-Situation!',
                        'Dieser Zug könnte eine gefährliche Gabel-Situation für den Gegner schaffen.',
                        () => this.game.makeMove(row, col)
                    );
                    return { allowed: false };
                }
            }
            
            return { allowed: true };
            
        } catch (error) {
            console.error('❌ Error in move validation:', error);
            return { allowed: true }; // Allow move if validation fails
        }
    }
    
    /**
     * Update visual assistance indicators on board
     */
    updateAssistanceDisplay() {
        this.clearVisualIndicators();
        
        const currentPlayer = this.game.currentPlayer;
        const isPlayer1 = currentPlayer === 1;
        const settings = isPlayer1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
        
        // Only show visual indicators if visual mode is enabled
        if (!settings.visualMode) return;
        
        try {
            // Show winning moves
            const winningMoves = this.getWinningMoves(currentPlayer);
            winningMoves.forEach(move => {
                this.addVisualIndicator(move.row, move.col, 'help-winning');
            });
            
            // Show blocking moves
            const opponent = currentPlayer === 1 ? 2 : 1;
            const blockingMoves = this.getWinningMoves(opponent);
            blockingMoves.forEach(move => {
                this.addVisualIndicator(move.row, move.col, 'help-blocking');
            });
            
            // Show dangerous positions (open threes)
            const dangerousPositions = this.getDangerousOpenThreePositions(currentPlayer);
            dangerousPositions.forEach(pos => {
                this.addVisualIndicator(pos.row, pos.col, 'help-dangerous');
            });
            
            console.log(`🎨 Visual indicators updated: ${winningMoves.length} winning, ${blockingMoves.length} blocking, ${dangerousPositions.length} dangerous`);
            
        } catch (error) {
            console.error('❌ Error updating visual indicators:', error);
        }
    }
    
    // ==================== WASM INTEGRATION ====================
    
    getWinningMoves(player) {
        if (!this.game?.wasmGame) return [];
        
        try {
            const winningMoves = [];
            
            // Check all empty positions for winning moves
            for (let row = 0; row < 15; row++) {
                for (let col = 0; col < 15; col++) {
                    if (this.game.isValidMove && this.game.isValidMove(row, col)) {
                        // Use WASM threat level detection
                        const threatLevel = this.game.wasmGame.get_threat_level(row, col, player);
                        if (threatLevel === 5) { // Level 5 = immediate win
                            winningMoves.push({ row, col, threatLevel });
                        }
                    }
                }
            }
            
            return winningMoves;
            
        } catch (error) {
            console.error('❌ Error getting winning moves:', error);
            return [];
        }
    }
    
    wouldCreateDangerousOpenThree(row, col, player) {
        if (!this.game?.wasmGame) return false;
        
        try {
            // Temporarily place stone and check for open three patterns
            const originalValue = this.game.board ? this.game.board[row * 15 + col] : 0;
            
            // Simulate move
            if (this.game.board) {
                this.game.board[row * 15 + col] = player;
            }
            
            const openThrees = this.game.wasmGame.detect_open_three(player);
            const hasOpenThree = openThrees && Object.keys(openThrees).length > 0;
            
            // Restore original state
            if (this.game.board) {
                this.game.board[row * 15 + col] = originalValue;
            }
            
            return hasOpenThree;
            
        } catch (error) {
            console.error('❌ Error checking open three:', error);
            return false;
        }
    }
    
    wouldCreateFork(row, col, player) {
        if (!this.game?.wasmGame) return false;
        
        try {
            return this.game.wasmGame.detect_double_three_forks(row, col, player);
        } catch (error) {
            console.error('❌ Error checking fork:', error);
            return false;
        }
    }
    
    getDangerousOpenThreePositions(player) {
        if (!this.game?.wasmGame) return [];
        
        try {
            const positions = [];
            
            for (let row = 0; row < 15; row++) {
                for (let col = 0; col < 15; col++) {
                    if (this.game.isValidMove && this.game.isValidMove(row, col)) {
                        if (this.wouldCreateDangerousOpenThree(row, col, player)) {
                            positions.push({ row, col });
                        }
                    }
                }
            }
            
            return positions;
            
        } catch (error) {
            console.error('❌ Error getting dangerous positions:', error);
            return [];
        }
    }
    
    // ==================== VISUAL INDICATORS ====================
    
    addVisualIndicator(row, col, cssClass) {
        const intersection = this.ui.getIntersection(row, col);
        if (intersection && !intersection.classList.contains('occupied')) {
            intersection.classList.add('help-overlay', cssClass);
        }
    }
    
    clearVisualIndicators() {
        const indicators = document.querySelectorAll('.intersection.help-overlay');
        indicators.forEach(indicator => {
            indicator.classList.remove('help-overlay', 'help-winning', 'help-blocking', 'help-dangerous', 'help-fork', 'help-strategic');
        });
    }
    
    // ==================== WARNING DIALOGS ====================
    
    showWarningDialog(title, message, onConfirm) {
        const confirmed = confirm(`${title}\n\n${message}\n\nMöchtest du den Zug trotzdem ausführen?`);
        if (confirmed && onConfirm) {
            onConfirm();
        }
    }
    
    // ==================== EXTERNAL API ====================
    
    /**
     * Called by UI system when assistance should be updated
     */
    onGameStateChanged() {
        // Clear cache to force recalculation
        this.analysisCache.boardHash = null;
        
        // Update visual indicators
        this.updateAssistanceDisplay();
    }
    
    /**
     * Get current assistance settings for a player
     */
    getPlayerSettings(playerNumber) {
        return playerNumber === 1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
    }
    
    /**
     * Check if assistance system is active for current player
     */
    isAssistanceActive() {
        const currentPlayer = this.game.currentPlayer;
        const settings = this.getPlayerSettings(currentPlayer);
        
        return settings.winningMoves || settings.blockingMoves || 
               settings.openThreeWarning || settings.forkWarning || settings.visualMode;
    }
}

// Export for integration
window.GomokuAssistanceSystem = GomokuAssistanceSystem;
export { GomokuAssistanceSystem };