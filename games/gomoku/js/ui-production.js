/**
 * GomokuUI - Modern Implementation using UI Module System
 * 
 * Based on Connect4 goldstandard implementation.
 * Adapted for 15x15 Gomoku board and 5-in-a-row gameplay.
 * 
 * Features:
 * - All keyboard shortcuts (F1, F2, F3, 1-15, etc.)
 * - Modal system (help, assistance)
 * - WASM integration and AI support
 * - Player assistance system with checkboxes
 * - Complete 15x15 Gomoku board with intersection placement
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { GOMOKU_UI_CONFIG, createGomokuConfig } from './gomoku-config.js';

// Component Imports
import { GomokuBoardRenderer } from './components/GomokuBoardRenderer.js';
import { GomokuInteractionHandler } from './components/GomokuInteractionHandler.js';
import { GomokuAssistanceManager } from './components/GomokuAssistanceManager.js';
import { MemoryManager } from './components/MemoryManager.js';
import { OptimizedElementBinder } from './components/OptimizedElementBinder.js';
import { GomokuAnimationManager } from './components/GomokuAnimationManager.js';

export class GomokuUI extends BaseGameUI {
    constructor(game) {
        // Initialize with Gomoku-specific configuration
        super(game, GOMOKU_UI_CONFIG);
        
        // Gomoku-specific properties
        this.ai = null;
        this.gameMode = 'two-player';
        this.isProcessingMove = false;
        this.aiPlayer = 1; // Black player (WASM Player.Black) - AI spielt als Schwarz
        this.scores = { black: 0, white: 0 };
        
        // Settings from legacy
        this.animationDuration = 300;
        this.aiThinkingDelay = 600;
        
        // Player assistance settings
        this.assistanceSettings = {
            player1: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-positions': false 
            },
            player2: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-positions': false 
            }
        };
        
        // WASM Integration
        this.wasmIntegration = null;
        
        // Position hover state for preview system
        this.hoveredPosition = null;
        this.previewStone = null;
        
        // ULTRATHINK Components
        this.boardRenderer = null;
        this.interactionHandler = null;
        this.assistanceManager = null;
        this.memoryManager = null;
        this.optimizedElementBinder = null;
        this.animationManager = null;
        
        // Initialization guard to prevent multiple initializations
        this.initialized = false;
        
        // Starting player rotation (1 = Black, 2 = White)
        this.nextStartingPlayer = 1; // Black starts first game by default
    }

    /**
     * Override beforeInit to set up Gomoku-specific initialization
     */
    async beforeInit() {
        if (this.initialized) {
            console.warn('⚠️ GomokuUI already initialized, skipping beforeInit');
            return;
        }
        
        console.log('⚫ Starting Gomoku UI initialization...');
        
        // Update configuration based on current game mode
        const currentMode = document.getElementById('gameMode')?.value || 'two-player';
        this.config = createGomokuConfig(currentMode);
        this.gameMode = currentMode;
    }

    /**
     * Override afterInit to complete Gomoku-specific setup
     */
    afterInit() {
        if (this.initialized) {
            console.warn('⚠️ GomokuUI already initialized, skipping afterInit');
            return;
        }
        
        console.log('⚫ Completing Gomoku UI initialization...');
        
        // Initialize ULTRATHINK MemoryManager (foundational)
        this.initializeMemoryManager();
        
        // Initialize ULTRATHINK OptimizedElementBinder (foundational)
        this.initializeOptimizedElementBinder();
        
        // Initialize ULTRATHINK BoardRenderer component
        this.initializeBoardRenderer();
        
        // Initialize ULTRATHINK InteractionHandler component
        this.initializeInteractionHandler();
        
        // Initialize ULTRATHINK AssistanceManager component
        this.initializeAssistanceManager();
        
        // Initialize AnimationManager component with premium effects
        this.initializeAnimationManager();
        
        // Update initial UI state
        this.updateUI();
        
        // Debug Modal System
        this.debugModalSystem();
        
        // Make testModalSystem available globally for debugging
        window.testModalSystem = () => this.testModalSystem();
        
        // Set up game mode event listener
        this.setupGameModeHandler();
        
        // Mark as initialized
        this.initialized = true;
        console.log('✅ GomokuUI initialization completed successfully');
    }

    // ==================== COMPONENT INITIALIZATION ====================

    /**
     * Initialize MemoryManager component (ULTRATHINK Phase 1)
     */
    initializeMemoryManager() {
        console.log('🧠 ULTRATHINK: Initializing MemoryManager component...');
        
        // Create MemoryManager component instance
        this.memoryManager = new MemoryManager();
        
        console.log('✅ MemoryManager component initialized');
    }

    /**
     * Initialize OptimizedElementBinder component (ULTRATHINK Phase 1)
     */
    initializeOptimizedElementBinder() {
        console.log('🔗 ULTRATHINK: Initializing OptimizedElementBinder component...');
        
        // Create OptimizedElementBinder component instance
        this.optimizedElementBinder = new OptimizedElementBinder(this.elements);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.optimizedElementBinder);
        }
        
        console.log('✅ OptimizedElementBinder component initialized');
    }

    /**
     * Initialize BoardRenderer component (ULTRATHINK Phase 2)
     * Replaces inline initializeBoard() with component-based approach
     */
    initializeBoardRenderer() {
        const gameBoard = this.elements.gameBoard;
        
        if (!gameBoard) {
            console.error('❌ Game board element not found for BoardRenderer');
            return;
        }
        
        console.log('🔧 ULTRATHINK: Initializing GomokuBoardRenderer component...');
        
        // Create BoardRenderer component instance
        this.boardRenderer = new GomokuBoardRenderer(gameBoard);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.boardRenderer);
        }
        
        // Initialize board through component
        const success = this.boardRenderer.initializeBoard();
        if (!success) {
            console.error('❌ GomokuBoardRenderer initialization failed');
            return;
        }
        
        console.log('✅ GomokuBoardRenderer component initialized');
    }

    /**
     * Initialize InteractionHandler component (ULTRATHINK Phase 2)
     * Replaces inline event handling with component-based approach
     */
    initializeInteractionHandler() {
        if (!this.boardRenderer) {
            console.error('❌ BoardRenderer must be initialized before InteractionHandler');
            return;
        }
        
        console.log('🔧 ULTRATHINK: Initializing GomokuInteractionHandler component...');
        
        // Create InteractionHandler component instance
        this.interactionHandler = new GomokuInteractionHandler(
            this.game,
            this.boardRenderer,
            this.elements
        );
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.interactionHandler);
        }
        
        // Set up interaction event handlers through component
        this.interactionHandler.setupEventHandlers((row, col) => {
            this.makeMove(row, col);
        });
        
        console.log('✅ GomokuInteractionHandler component initialized');
    }

    /**
     * Initialize AssistanceManager component (ULTRATHINK Phase 3)
     * Replaces inline assistance system with component-based approach
     */
    initializeAssistanceManager() {
        if (!this.boardRenderer) {
            console.error('❌ BoardRenderer must be initialized before AssistanceManager');
            return;
        }
        
        console.log('🔧 ULTRATHINK: Initializing GomokuAssistanceManager component...');
        
        // Create AssistanceManager component instance
        this.assistanceManager = new GomokuAssistanceManager(this.game, this.boardRenderer, this.elements);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.assistanceManager);
        }
        
        // Set up assistance system through component
        this.assistanceManager.setupAssistanceSystem();
        
        console.log('✅ GomokuAssistanceManager component initialized');
    }

    /**
     * Initialize AnimationManager component (ULTRATHINK Phase 4)
     */
    initializeAnimationManager() {
        console.log('🎬 ULTRATHINK: Initializing GomokuAnimationManager component...');
        
        // Create AnimationManager component instance
        this.animationManager = new GomokuAnimationManager(this.boardRenderer);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.animationManager);
        }
        
        console.log('✅ GomokuAnimationManager component initialized');
    }

    // ==================== GAME LOGIC OVERRIDES ====================

    /**
     * Make a move at specific position (row, col)
     * Enhanced with ULTRATHINK component system
     */
    async makeMove(row, col) {
        if (this.isProcessingMove) {
            console.log('⚠️ Move already in progress, ignoring input');
            return;
        }
        
        console.log(`🎯 Making move at position (${row}, ${col})`);
        
        this.isProcessingMove = true;
        
        try {
            // Validate move through game engine
            if (!this.game || typeof this.game.isValidMove !== 'function' || !this.game.isValidMove(row, col)) {
                console.warn(`⚠️ Invalid move at (${row}, ${col})`);
                this.isProcessingMove = false;
                return;
            }
            
            // Execute move through game engine
            const moveResult = this.game.makeMove(row, col);
            console.log('🎯 Move result:', moveResult);
            
            if (moveResult && moveResult.success) {
                // Get current player before move is processed
                const currentPlayer = this.game.getCurrentPlayer();
                
                // Trigger visual update immediately through BoardRenderer
                if (this.boardRenderer) {
                    this.boardRenderer.placeStone(row, col, currentPlayer);
                }
                
                // Trigger move animation through AnimationManager
                if (this.animationManager) {
                    this.animationManager.animateStonePlace(row, col, currentPlayer);
                }
                
                // Update UI state
                this.updateUI();
                
                // Update assistance highlights
                this.updateAssistanceHighlights();
                
                // Check for game over
                if (this.game && typeof this.game.isGameOver === 'function' && this.game.isGameOver()) {
                    console.log('🏁 Game over detected after move!');
                    this.handleGameOver();
                }
                
                // Handle AI move if in single-player mode and it's AI's turn (Black = 1)
                if (this.gameMode === 'single-player' && !this.game.isGameOver()) {
                    const nextPlayer = this.game.getCurrentPlayer();
                    if (nextPlayer === this.aiPlayer) { // AI spielt als Schwarz (Player 1)
                        setTimeout(() => {
                            this.makeAIMove();
                        }, this.aiThinkingDelay);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error making move:', error);
        } finally {
            this.isProcessingMove = false;
        }
    }

    /**
     * Handle AI move (if applicable) - AI spielt als Schwarz (Player 1)
     */
    async makeAIMove() {
        if (!this.game || this.game.isGameOver() || this.gameMode !== 'single-player') {
            return;
        }
        
        // Verify it's AI's turn (Black = Player 1)
        const currentPlayer = this.game.getCurrentPlayer();
        if (currentPlayer !== this.aiPlayer) {
            console.log(`🤖 Not AI's turn (current: ${currentPlayer}, AI: ${this.aiPlayer})`);
            return;
        }
        
        console.log('🤖 AI (Schwarz) is thinking...');
        this.showMessage('🤖 AI überlegt...', 'info');
        
        try {
            // Use new WASM AI wrapper method from game-bitpacked.js
            if (this.game.makeAIMove && typeof this.game.makeAIMove === 'function') {
                const aiResult = await this.game.makeAIMove();
                
                if (aiResult && aiResult.success) {
                    console.log(`🤖 AI (Schwarz) played: (${aiResult.move.row}, ${aiResult.move.col})`);
                    
                    // Update visual state through BoardRenderer
                    if (this.boardRenderer) {
                        this.boardRenderer.placeStone(aiResult.move.row, aiResult.move.col, this.aiPlayer);
                    }
                    
                    // Trigger move animation
                    if (this.animationManager) {
                        this.animationManager.animateStonePlace(aiResult.move.row, aiResult.move.col, this.aiPlayer);
                    }
                    
                    // Update UI
                    this.updateUI();
                    this.updateAssistanceHighlights();
                    
                    // Check for game over
                    if (aiResult.gameWon) {
                        console.log('🏁 AI won the game!');
                        this.handleGameOver();
                    }
                    
                    return;
                } else {
                    console.warn('⚠️ AI move failed:', aiResult?.reason || 'Unknown reason');
                }
            } else {
                console.warn('⚠️ makeAIMove method not available on game instance');
            }
            
            // Fallback: Use legacy AI method
            if (this.game.getAIMove && typeof this.game.getAIMove === 'function') {
                const aiMove = this.game.getAIMove();
                if (aiMove && aiMove.row !== undefined && aiMove.col !== undefined) {
                    console.log(`🤖 Fallback AI move: (${aiMove.row}, ${aiMove.col})`);
                    await this.makeMove(aiMove.row, aiMove.col);
                    return;
                }
            }
            
            console.error('❌ No AI move available');
            this.showMessage('❌ AI-Zug nicht verfügbar', 'error');
            
        } catch (error) {
            console.error('❌ Error making AI move:', error);
            this.showMessage('❌ AI-Fehler', 'error');
        }
    }

    /**
     * Handle game over state
     */
    handleGameOver() {
        console.log('🏁 Handling game over...');
        
        const winner = this.game.getWinner();
        
        if (winner) {
            const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
            
            // Update scores
            if (winner === 1) {
                this.scores.black++;
            } else {
                this.scores.white++;
            }
            
            // Show winning animation through AnimationManager
            if (this.animationManager) {
                this.animationManager.showWinningAnimation(winner);
            }
            
            // Show victory message
            this.showMessage(`🎉 ${winnerName} gewinnt!`, 'success');
            
            // Update starting player for next game (winner starts next game)
            this.nextStartingPlayer = winner;
            
        } else {
            this.showMessage('⚖️ Unentschieden!', 'info');
            // Keep same starting player for draws
        }
        
        // Update UI to reflect new scores
        this.updateUI();
    }

    // ==================== GAME ACTION OVERRIDES ====================

    /**
     * Override newGame for Gomoku-specific logic
     */
    newGame() {
        // Reset the game engine with proper starting player
        if (this.game) {
            // Check if WASM board supports starting player selection
            if (this.game.board && typeof this.game.board.reset_with_starting_player === 'function') {
                // Use WASM API directly with player enum (1=Black, 2=White)
                this.game.board.reset_with_starting_player(this.nextStartingPlayer);
                const starterName = this.nextStartingPlayer === 1 ? 'Schwarz' : 'Weiß';
                console.log(`🎮 WASM: Neues Spiel mit Startspieler: ${starterName} (${this.nextStartingPlayer})`);
                
                // Update JavaScript wrapper state
                this.game.gameHistory = [];
                this.game.currentMoveIndex = -1;
                this.game.totalMoves = 0;
                this.game.averageMoveTime = 0;
            } else {
                // Fallback to standard reset
                this.game.newGame();
                console.log('⚠️ WASM API reset_with_starting_player nicht verfügbar - Standard Reset verwendet');
            }
        }
        
        // Clear board through BoardRenderer component
        if (this.boardRenderer) {
            this.boardRenderer.clearBoard();
        }
        
        // Clear all visual effects (confetti, particles, animations)
        if (this.animationManager) {
            this.animationManager.clearAllEffects();
        }
        
        // Clear UI state
        this.clearAssistanceHighlights();
        this.hideStonePreview();
        
        // Update UI to reflect new game state
        this.updateUI();
        
        // Show message with starting player info
        const starterName = this.nextStartingPlayer === 1 ? 'Schwarz' : 'Weiß';
        this.showMessage(`🆕 Neues Spiel gestartet! ${starterName} beginnt.`, 'info');
    }

    /**
     * Override undoMove for Gomoku-specific logic
     */
    undoMove() {
        try {
            if (!this.game || typeof this.game.undoMove !== 'function') {
                console.warn('⚠️ Undo not available');
                return;
            }
            
            const undoResult = this.game.undoMove();
            if (undoResult && undoResult.success) {
                console.log('↩️ Move undone successfully');
                
                // Update board through BoardRenderer
                if (this.boardRenderer) {
                    this.boardRenderer.updateFromGameState(this.game);
                }
                
                // Update UI
                this.updateUI();
                this.updateAssistanceHighlights();
                
                this.showMessage('↩️ Zug rückgängig gemacht', 'info');
            } else {
                console.warn('⚠️ Undo failed');
                this.showMessage('⚠️ Rückgängig nicht möglich', 'warning');
            }
        } catch (error) {
            console.error('❌ Error during undo:', error);
            this.showMessage('❌ Fehler beim Rückgängig machen', 'error');
        }
    }

    // ==================== UI UPDATE METHODS ====================

    /**
     * Update UI to reflect current game state
     */
    updateUI() {
        // Update current player indicator
        this.updateCurrentPlayerIndicator();
        
        // Update game status
        this.updateGameStatus();
        
        // Update scores
        this.updateScores();
        
        // Update assistance settings if available
        if (this.assistanceManager) {
            this.assistanceManager.updateAssistanceCheckboxes();
        }
    }

    /**
     * Update current player indicator
     */
    updateCurrentPlayerIndicator() {
        const indicator = this.elements.currentPlayerIndicator;
        if (!indicator || !this.game) return;
        
        const currentPlayer = this.game.getCurrentPlayer();
        const playerName = currentPlayer === 1 ? 'Schwarz' : 'Weiß';
        const stoneClass = currentPlayer === 1 ? 'black' : 'white';
        
        indicator.innerHTML = `
            <span class="player-indicator active">
                <span class="player-stone ${stoneClass}"></span>
                ${playerName} ist am Zug
            </span>
        `;
    }

    /**
     * Update game status display
     */
    updateGameStatus() {
        const statusElement = this.elements.gameStatus;
        if (!statusElement || !this.game) return;
        
        if (this.game.isGameOver()) {
            const winner = this.game.getWinner();
            if (winner) {
                const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
                statusElement.textContent = `${winnerName} gewinnt!`;
            } else {
                statusElement.textContent = 'Unentschieden';
            }
        } else {
            const moveCount = this.game.getMoveCount ? this.game.getMoveCount() : 0;
            statusElement.textContent = `Zug ${moveCount + 1}`;
        }
    }

    /**
     * Update score display
     */
    updateScores() {
        // Update scores in sidebar if elements exist
        const blackScoreElement = this.elements.blackScore;
        const whiteScoreElement = this.elements.whiteScore;
        
        if (blackScoreElement) {
            blackScoreElement.textContent = this.scores.black;
        }
        if (whiteScoreElement) {
            whiteScoreElement.textContent = this.scores.white;
        }
    }

    // ==================== ASSISTANCE SYSTEM DELEGATES ====================

    /**
     * Setup assistance system - Delegates to AssistanceManager component
     */
    setupAssistanceSystem() {
        // Delegate to component
        if (this.assistanceManager) {
            this.assistanceManager.setupAssistanceSystem();
            return;
        }
        
        console.warn('⚠️ Using legacy assistance fallback - component integration incomplete');
    }

    /**
     * Update assistance highlights based on current settings
     * Delegates to AssistanceManager component
     */
    updateAssistanceHighlights() {
        // Delegate to component
        if (this.assistanceManager) {
            this.assistanceManager.updateAssistanceHighlights();
            return;
        }
        
        console.warn('⚠️ Using legacy assistance highlighting fallback - component integration incomplete');
    }

    /**
     * Update assistance checkboxes based on current settings
     * Delegates to AssistanceManager component
     */
    updateAssistanceCheckboxes() {
        // Delegate to component
        if (this.assistanceManager) {
            this.assistanceManager.updateAssistanceCheckboxes();
            return;
        }
        
        console.warn('⚠️ Using legacy checkbox update fallback - component integration incomplete');
    }

    /**
     * Clear all assistance highlights
     * Delegates to AssistanceManager component
     */
    clearAssistanceHighlights() {
        // Delegate to component
        if (this.assistanceManager) {
            this.assistanceManager.clearAssistanceHighlights();
            return;
        }
        
        console.warn('⚠️ Using legacy clear highlights fallback - component integration incomplete');
    }

    /**
     * Toggle assistance setting for specific player and type
     * Delegates to AssistanceManager component
     */
    toggleAssistance(player, type) {
        // Delegate to component
        if (this.assistanceManager) {
            this.assistanceManager.toggleAssistance(player, type);
            return this.assistanceManager.getAssistanceSetting(player, type);
        }
        
        console.warn('⚠️ Using legacy assistance toggle fallback - component integration incomplete');
        return false;
    }

    /**
     * Get current assistance setting for player and type
     * Delegates to AssistanceManager component
     */
    getAssistanceSetting(player, type) {
        
        // Delegate to component if available
        if (this.assistanceManager) {
            return this.assistanceManager.getAssistanceSetting(player, type);
        }
        
        console.warn('⚠️ Using legacy assistance setting fallback - component integration incomplete');
        return false;
    }

    // ==================== PREVIEW SYSTEM ====================

    /**
     * Show stone preview at position
     */
    showStonePreview(row, col) {
        if (this.interactionHandler) {
            this.interactionHandler.showStonePreview(row, col);
        }
    }

    /**
     * Hide stone preview
     */
    hideStonePreview() {
        if (this.interactionHandler) {
            this.interactionHandler.hideStonePreview();
        }
    }

    // ==================== GAME MODE HANDLING ====================

    /**
     * Set up game mode dropdown event handler
     */
    setupGameModeHandler() {
        const gameModeSelector = document.getElementById('gameMode');
        const gameModeDisplay = document.getElementById('gameModeDisplay');
        
        if (gameModeSelector) {
            gameModeSelector.addEventListener('change', (e) => {
                const selectedMode = e.target.value;
                this.onGameModeChange(selectedMode);
                
                // Update display text
                if (gameModeDisplay) {
                    const displayText = selectedMode === 'single-player' ? 'Gegen KI' : '2 Spieler';
                    gameModeDisplay.textContent = displayText;
                }
            });
            
            console.log('🎮 Game mode handler set up successfully');
        } else {
            console.warn('⚠️ Game mode selector not found');
        }
    }

    /**
     * Handle game mode change
     */
    onGameModeChange(mode) {
        console.log(`🎮 Game mode changed to: ${mode}`);
        this.gameMode = mode;
        this.config = createGomokuConfig(mode);
        
        // Update AI player message based on mode
        if (mode === 'single-player') {
            this.showMessage('🤖 Single-Player Modus: AI spielt als Schwarz', 'info');
            
            // If it's currently Black's turn (AI's turn), make AI move
            if (this.game && this.game.getCurrentPlayer() === this.aiPlayer && !this.game.isGameOver()) {
                setTimeout(() => {
                    this.makeAIMove();
                }, this.aiThinkingDelay);
            }
        } else {
            this.showMessage('👥 2-Spieler Modus aktiviert', 'info');
        }
        
        // Restart game with new mode
        this.newGame();
    }

    // ==================== DEBUG AND TESTING ====================

    /**
     * Debug Modal System
     */
    debugModalSystem() {
        console.log('🧪 PHASE 2A: Debugging Modal System...');
        
        // Check modal elements
        const helpModal = this.elements.helpModal;
        const assistanceModal = this.elements.assistanceModal;
        
        console.log('Help Modal Element:', helpModal);
        console.log('Assistance Modal Element:', assistanceModal);
        
        if (!helpModal) {
            console.warn('⚠️ Help modal not found in DOM');
        }
        
        if (!assistanceModal) {
            console.warn('⚠️ Assistance modal not found in DOM');
        }
    }

    /**
     * Manual Modal Testing
     */
    testModalSystem() {
        console.log('🧪 PHASE 2A: Manual Modal Testing...');
        
        // Test Help Modal
        console.log('🧪 Testing Help Modal...');
        try {
            this.toggleModal('help');
            console.log('✅ Help Modal toggle successful');
        } catch (error) {
            console.error('❌ Help Modal toggle failed:', error);
        }
        
        // Test Assistance Modal
        setTimeout(() => {
            console.log('🧪 Testing Assistance Modal...');
            try {
                this.toggleModal('assistance');
                console.log('✅ Assistance Modal toggle successful');
            } catch (error) {
                console.error('❌ Assistance Modal toggle failed:', error);
            }
        }, 2000);
    }
}