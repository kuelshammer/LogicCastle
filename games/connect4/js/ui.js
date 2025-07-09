/**
 * Connect4UI - Modern Implementation using UI Module System
 * 
 * Based on Gomoku goldstandard implementation.
 * Replaces traditional Connect4UI with modular architecture.
 * 
 * Features:
 * - All keyboard shortcuts (F1, F2, F3, 1-7, etc.)
 * - Modal system (help, assistance)
 * - WASM integration and AI support
 * - Player assistance system with checkboxes
 * - Complete 6x7 Connect4 board with drop zones
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { CONNECT4_UI_CONFIG, createConnect4Config } from './connect4-config.js';
// DEPRECATED: import { Connect4AI } from './ai.js'; - Using WASM AI instead

// Component Imports
import { BoardRenderer } from './components/BoardRenderer.js';
import { InteractionHandler } from './components/InteractionHandler.js';
import { AssistanceManager } from './components/AssistanceManager.js';
import { MemoryManager } from './components/MemoryManager.js';
import { OptimizedElementBinder } from './components/OptimizedElementBinder.js';

export class Connect4UI extends BaseGameUI {
    constructor(game) {
        // Initialize with Connect4-specific configuration
        super(game, CONNECT4_UI_CONFIG);
        
        // Connect4-specific properties
        this.ai = null;
        this.gameMode = 'two-player';
        this.isProcessingMove = false;
        this.aiPlayer = 2; // Red player (WASM Player.Red)
        this.scores = { yellow: 0, red: 0 };
        
        // Settings from legacy
        this.animationDuration = 400;
        this.aiThinkingDelay = 800;
        
        // Player assistance settings
        this.assistanceSettings = {
            player1: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-columns': false 
            },
            player2: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-columns': false 
            }
        };
        
        // WASM Integration
        this.wasmIntegration = null;
        
        // Column hover state for preview system
        this.hoveredColumn = null;
        this.previewDisc = null;
        
        // ULTRATHINK Components
        this.boardRenderer = null;
        this.interactionHandler = null;
        this.assistanceManager = null;
        this.memoryManager = null;
        this.optimizedElementBinder = null;
    }

    /**
     * Override beforeInit to set up Connect4-specific initialization
     */
    async beforeInit() {
        console.log('🔴 Starting Connect4 UI initialization...');
        
        // Update configuration based on current game mode
        const currentMode = document.getElementById('gameMode')?.value || 'two-player';
        this.config = createConnect4Config(currentMode);
        this.gameMode = currentMode;
    }

    /**
     * Override afterInit to complete Connect4-specific setup
     */
    afterInit() {
        console.log('🔴 Completing Connect4 UI initialization...');
        
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
        
        // Update initial UI state
        this.updateUI();
        
        console.log('✅ Connect4 UI fully initialized');
    }

    /**
     * Override setupGameEventListeners for Connect4-specific game events
     */
    setupGameEventListeners() {
        // Call parent implementation for common events (gameOver, newGame, move, undo)
        super.setupGameEventListeners();
        
        // Connect4-specific game events (excluding those already handled by parent)
        const connect4Events = {
            'moveMade': (move) => this.onMoveMade(move), // Alias for test compatibility
            'initialized': () => this.onGameInitialized(),
            'error': (error) => this.onGameError(error)
        };

        for (const [event, handler] of Object.entries(connect4Events)) {
            if (this.game && typeof this.game.on === 'function') {
                this.game.on(event, handler);
            }
        }
    }

    /**
     * Override bindKeyboardActions for Connect4-specific keyboard actions
     */
    bindKeyboardActions(keyboardController) {
        // Call parent implementation for common actions
        super.bindKeyboardActions(keyboardController);
        
        // Connect4-specific keyboard actions
        const connect4ActionMap = {
            'toggleAssistance': () => this.toggleModal('assistance'),
            'dropColumn1': () => this.dropDiscInColumn(0),
            'dropColumn2': () => this.dropDiscInColumn(1),
            'dropColumn3': () => this.dropDiscInColumn(2),
            'dropColumn4': () => this.dropDiscInColumn(3),
            'dropColumn5': () => this.dropDiscInColumn(4),
            'dropColumn6': () => this.dropDiscInColumn(5),
            'dropColumn7': () => this.dropDiscInColumn(6)
        };

        for (const [key, action] of Object.entries(this.config.keyboard)) {
            if (connect4ActionMap[action]) {
                keyboardController.register(key, action, connect4ActionMap[action]);
            }
        }
    }

    /**
     * Initialize BoardRenderer component (ULTRATHINK)
     * Replaces inline initializeBoard() with component-based approach
     */
    initializeBoardRenderer() {
        const gameBoard = this.elements.gameBoard;
        const topCoords = this.elements.topCoords;
        const bottomCoords = this.elements.bottomCoords;
        
        if (!gameBoard) {
            console.error('❌ Game board element not found for BoardRenderer');
            return;
        }
        
        console.log('🔧 ULTRATHINK: Initializing BoardRenderer component...');
        
        // Create BoardRenderer component instance
        this.boardRenderer = new BoardRenderer(gameBoard, topCoords, bottomCoords);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.boardRenderer);
        }
        
        // Initialize board through component
        const success = this.boardRenderer.initializeBoard();
        if (!success) {
            console.error('❌ BoardRenderer initialization failed');
            return;
        }
        
        // Create coordinate labels through component
        this.boardRenderer.createCoordinateLabels();
        
        // Add click event handlers to coordinate labels
        this.setupCoordinateClickHandlers();
        
        console.log('✅ ULTRATHINK: BoardRenderer component initialized successfully');
    }

    /**
     * Setup click handlers for coordinate labels created by BoardRenderer
     */
    setupCoordinateClickHandlers() {
        const topCoords = this.elements.topCoords;
        const bottomCoords = this.elements.bottomCoords;
        
        // Add click handlers to top coordinate labels
        if (topCoords) {
            const topLabels = topCoords.querySelectorAll('.coord');
            topLabels.forEach(coord => {
                const col = parseInt(coord.dataset.col);
                coord.addEventListener('click', () => this.dropDiscInColumn(col));
            });
        }
        
        // Add click handlers to bottom coordinate labels
        if (bottomCoords) {
            const bottomLabels = bottomCoords.querySelectorAll('.coord');
            bottomLabels.forEach(coord => {
                const col = parseInt(coord.dataset.col);
                coord.addEventListener('click', () => this.dropDiscInColumn(col));
            });
        }
        
        console.log('🔧 ULTRATHINK: Coordinate click handlers added');
    }

    /**
     * Initialize InteractionHandler component (ULTRATHINK)
     * Replaces inline setupColumnInteractions() with component-based approach
     */
    initializeInteractionHandler() {
        if (!this.boardRenderer) {
            console.error('❌ BoardRenderer must be initialized before InteractionHandler');
            return;
        }
        
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) {
            console.error('❌ Game board element not found for InteractionHandler');
            return;
        }
        
        console.log('🔧 ULTRATHINK: Initializing InteractionHandler component...');
        
        // Create InteractionHandler component instance
        this.interactionHandler = new InteractionHandler(this.boardRenderer, gameBoard);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.interactionHandler);
        }
        
        // Set up callback functions for component communication
        this.interactionHandler.setCallbacks({
            onColumnClick: (col) => this.dropDiscInColumn(col),
            onColumnHover: (col) => this.onColumnHover(col),
            onColumnHoverLeave: () => this.onColumnHoverLeave()
        });
        
        // Initialize interaction systems through component
        this.interactionHandler.setupColumnInteractions();
        this.interactionHandler.setupKeyboardInteractions();
        
        console.log('✅ ULTRATHINK: InteractionHandler component initialized successfully');
    }

    /**
     * Initialize AssistanceManager component (ULTRATHINK)
     * Replaces inline setupAssistanceSystem() with component-based approach
     */
    initializeAssistanceManager() {
        if (!this.boardRenderer) {
            console.error('❌ BoardRenderer must be initialized before AssistanceManager');
            return;
        }
        
        console.log('🔧 ULTRATHINK: Initializing AssistanceManager component...');
        
        // Create AssistanceManager component instance
        this.assistanceManager = new AssistanceManager(this.game, this.boardRenderer, this.elements);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.assistanceManager);
        }
        
        // Transfer current assistance settings to component
        if (this.assistanceSettings) {
            this.assistanceManager.setAssistanceSettings(this.assistanceSettings);
        }
        
        // Initialize assistance system through component
        this.assistanceManager.setupAssistanceSystem();
        
        console.log('✅ ULTRATHINK: AssistanceManager component initialized successfully');
    }

    /**
     * Initialize MemoryManager component (ULTRATHINK)
     * Provides comprehensive memory management and resource tracking
     */
    initializeMemoryManager() {
        console.log('🔧 ULTRATHINK: Initializing MemoryManager component...');
        
        // Create MemoryManager instance
        this.memoryManager = new MemoryManager();
        
        // Start memory monitoring
        this.memoryManager.startMonitoring(30000); // Check every 30 seconds
        
        console.log('✅ ULTRATHINK: MemoryManager component initialized successfully');
    }

    /**
     * Initialize OptimizedElementBinder component (ULTRATHINK)
     * Replaces BaseGameUI element binding with optimized Connect4-specific binding
     */
    async initializeOptimizedElementBinder() {
        console.log('🔧 ULTRATHINK: Initializing OptimizedElementBinder component...');
        
        // Create OptimizedElementBinder instance with Connect4 configuration
        const binderConfig = {
            required: this.config.elements.required || [],
            optional: this.config.elements.optional || [],
            validateStructure: true,
            enableRecovery: true,
            cacheSelectors: true
        };
        
        this.optimizedElementBinder = new OptimizedElementBinder(binderConfig);
        
        // Track component with MemoryManager
        if (this.memoryManager) {
            this.memoryManager.trackComponent(this.optimizedElementBinder);
        }
        
        // Bind elements using optimized binder
        const boundElements = await this.optimizedElementBinder.bindElements();
        
        // Update this.elements with optimized binding results
        Object.assign(this.elements, boundElements);
        
        console.log('✅ ULTRATHINK: OptimizedElementBinder component initialized successfully');
    }

    /**
     * Setup column interactions (click, hover) - LEGACY
     * ⚠️ DEPRECATED: Replaced by InteractionHandler component
     * Kept for fallback compatibility only
     */
    setupColumnInteractions() {
        console.warn('⚠️ DEPRECATED: setupColumnInteractions() replaced by InteractionHandler component');
        
        // Fallback to component if available
        if (this.interactionHandler) {
            this.interactionHandler.setupColumnInteractions();
            return;
        }
        
        // Legacy fallback (should not be reached in ULTRATHINK mode)
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        console.warn('⚠️ Using legacy interaction fallback - component integration incomplete');
    }

    /**
     * Create hover zones above each column for better UX - LEGACY
     * ⚠️ DEPRECATED: Replaced by InteractionHandler component
     */
    createColumnHoverZones() {
        console.warn('⚠️ DEPRECATED: createColumnHoverZones() replaced by InteractionHandler component');
        
        // Fallback to component if available
        if (this.interactionHandler) {
            this.interactionHandler.createColumnHoverZones();
            return;
        }
        
        console.warn('⚠️ Using legacy hover zone fallback - component integration incomplete');
    }

    /**
     * Handle column hover for preview (ULTRATHINK)
     * Called by InteractionHandler component via callback
     */
    onColumnHover(col) {
        if (this.isProcessingMove || this.game.isGameOver()) return;
        
        this.hoveredColumn = col;
        this.updateAssistanceHighlights();
        
        // InteractionHandler handles showDropPreview internally
        console.log(`🎯 Column ${col} hovered (handled by InteractionHandler)`);
    }

    /**
     * Handle column hover leave (ULTRATHINK)
     * Called by InteractionHandler component via callback
     */
    onColumnHoverLeave() {
        this.hoveredColumn = null;
        this.clearAssistanceHighlights();
        
        // InteractionHandler handles hideDropPreview internally
        console.log('🎯 Column hover left (handled by InteractionHandler)');
    }

    /**
     * Handle column click to drop disc (ULTRATHINK)
     * Called by InteractionHandler component via callback
     */
    onColumnClick(col) {
        if (this.isProcessingMove || this.game.isGameOver()) {
            return;
        }

        console.log(`🎯 Column ${col} clicked (handled by InteractionHandler)`);
        this.dropDiscInColumn(col);
    }

    /**
     * Drop disc in specified column
     */
    async dropDiscInColumn(col) {
        if (col < 0 || col >= 7) {
            console.warn(`Invalid column: ${col}`);
            return Promise.resolve();
        }

        if (this.isProcessingMove) {
            console.log('Move already in progress, ignoring input');
            return Promise.resolve();
        }

        try {
            this.isProcessingMove = true;
            
            // Sync processing state with InteractionHandler component
            if (this.interactionHandler) {
                this.interactionHandler.setProcessingMove(true);
            }
            
            console.log(`🔴 Dropping disc in column ${col + 1} (0-indexed: ${col})`);
            
            // Debug game state before move
            console.log('🔍 Game state before move:', {
                currentPlayer: this.game.getCurrentPlayer(),
                gameOver: this.game.isGameOver(),
                moveCount: this.game.getMoveCount ? this.game.getMoveCount() : 'unknown',
                gameExists: !!this.game,
                makeMoveFn: typeof this.game.makeMove
            });
            
            // Hide preview through InteractionHandler component
            if (this.interactionHandler) {
                this.interactionHandler.hideDropPreview();
            }
            
            // Make move through game engine
            console.log(`🎮 Calling game.makeMove(${col})...`);
            const moveResult = await this.game.makeMove(col);
            console.log('✅ Move successful:', moveResult);
            
            return Promise.resolve(moveResult);
            
        } catch (error) {
            console.error('❌ Failed to make move:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                column: col,
                gameState: this.game ? 'exists' : 'missing'
            });
            this.showMessage(`Ungültiger Zug: ${error.message}`, 'error');
            throw error; // Re-throw for AI debugging
        } finally {
            this.isProcessingMove = false;
            
            // Sync processing state with InteractionHandler component
            if (this.interactionHandler) {
                this.interactionHandler.setProcessingMove(false);
            }
        }
    }

    /**
     * Show drop preview for column (ULTRATHINK)
     * ⚠️ DEPRECATED: Now handled by InteractionHandler component
     */
    showDropPreview(col) {
        console.warn('⚠️ DEPRECATED: showDropPreview() now handled by InteractionHandler component');
        
        // Delegate to component if available
        if (this.interactionHandler) {
            this.interactionHandler.showDropPreview(col);
            return;
        }
        
        console.warn('⚠️ Using legacy preview fallback - component integration incomplete');
    }

    /**
     * Hide drop preview (ULTRATHINK)
     * ⚠️ DEPRECATED: Now handled by InteractionHandler component
     */
    hideDropPreview() {
        console.warn('⚠️ DEPRECATED: hideDropPreview() now handled by InteractionHandler component');
        
        // Delegate to component if available
        if (this.interactionHandler) {
            this.interactionHandler.hideDropPreview();
            return;
        }
        
        console.warn('⚠️ Using legacy preview fallback - component integration incomplete');
    }

    /**
     * Setup assistance system - LEGACY
     * ⚠️ DEPRECATED: Replaced by AssistanceManager component
     * Kept for fallback compatibility only
     */
    setupAssistanceSystem() {
        console.warn('⚠️ DEPRECATED: setupAssistanceSystem() replaced by AssistanceManager component');
        
        // Fallback to component if available
        if (this.assistanceManager) {
            this.assistanceManager.setupAssistanceSystem();
            return;
        }
        
        console.warn('⚠️ Using legacy assistance fallback - component integration incomplete');
    }

    /**
     * Update assistance highlights based on current settings (ULTRATHINK)
     * ⚠️ DEPRECATED: Replaced by AssistanceManager component
     */
    updateAssistanceHighlights() {
        console.warn('⚠️ DEPRECATED: updateAssistanceHighlights() replaced by AssistanceManager component');
        
        // Delegate to component if available
        if (this.assistanceManager) {
            this.assistanceManager.updateAssistanceHighlights();
            return;
        }
        
        console.warn('⚠️ Using legacy assistance highlighting fallback - component integration incomplete');
    }

    // === Individual highlight methods removed ===
    // ⚠️ DEPRECATED: highlightThreats(), highlightWinningMoves(), highlightBlockedColumns(), highlightColumns()
    // All assistance highlighting now handled by AssistanceManager component

    /**
     * Clear all assistance highlights (ULTRATHINK)
     * ⚠️ DEPRECATED: Replaced by AssistanceManager component
     */
    clearAssistanceHighlights() {
        console.warn('⚠️ DEPRECATED: clearAssistanceHighlights() replaced by AssistanceManager component');
        
        // Delegate to component if available
        if (this.assistanceManager) {
            this.assistanceManager.clearAssistanceHighlights();
            return;
        }
        
        console.warn('⚠️ Using legacy clear highlights fallback - component integration incomplete');
    }

    /**
     * Update the board display with current game state (ULTRATHINK)
     * Uses BoardRenderer component instead of direct DOM manipulation
     */
    updateBoard() {
        if (!this.boardRenderer || !this.game) return;
        
        // Use BoardRenderer component to update board
        this.boardRenderer.updateBoard(this.game);
        
        // Update assistance highlights
        this.updateAssistanceHighlights();
    }

    /**
     * Update the entire UI (status, scores, buttons, etc.)
     */
    updateUI() {
        if (!this.game) return;
        
        this.updateBoard();
        this.updateGameStatus();
        this.updatePlayerIndicator();
        this.updateControls();
        this.updateScores();
    }

    /**
     * Update game status display
     */
    updateGameStatus(customStatus = null) {
        const gameStatus = this.elements.gameStatus;
        if (!gameStatus) return;
        
        // Allow override for testing
        if (customStatus) {
            gameStatus.textContent = customStatus;
            return;
        }
        
        if (!this.game) return;
        
        if (this.game.isGameOver()) {
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
            const currentPlayer = this.game.getCurrentPlayer();
            const playerName = currentPlayer === 1 ? 'Gelb' : 'Rot';
            
            if (this.isAiThinking && currentPlayer === this.aiPlayer) {
                gameStatus.textContent = 'KI denkt nach...';
                gameStatus.className = 'game-status ai-thinking';
            } else {
                gameStatus.textContent = `${playerName} ist am Zug`;
                gameStatus.className = 'game-status active';
            }
        }
    }

    /**
     * Update current player indicator
     */
    updatePlayerIndicator() {
        const indicator = this.elements.currentPlayerIndicator;
        if (!indicator || !this.game) return;
        
        const currentPlayer = this.game.getCurrentPlayer();
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

    /**
     * Update control button states
     */
    updateControls() {
        const undoBtn = this.elements.undoBtn;
        if (undoBtn && this.game) {
            const canUndo = this.game.canUndo() && !this.game.isGameOver();
            undoBtn.disabled = !canUndo;
        }
        
        // Update move counter
        const moveCounter = this.elements.moveCounter;
        if (moveCounter && this.game) {
            moveCounter.textContent = this.game.getMoveCount();
        }
    }

    /**
     * Update score display
     */
    updateScores() {
        const yellowScore = this.elements.yellowScore;
        const redScore = this.elements.redScore;
        
        if (yellowScore) {
            yellowScore.textContent = this.scores.yellow;
        }
        
        if (redScore) {
            redScore.textContent = this.scores.red;
        }
    }

    // ==================== GAME EVENT HANDLERS ====================

    /**
     * Handle move made event
     */
    onMoveMade(moveData) {
        console.log('🔴 Move made:', moveData);
        this.updateUI();
        
        // Check for AI turn
        if (this.gameMode !== 'two-player' && !this.game.isGameOver()) {
            const currentPlayer = this.game.getCurrentPlayer();
            if (currentPlayer === this.aiPlayer) {
                setTimeout(() => this.makeAIMove(), this.aiThinkingDelay);
            }
        }
    }

    /**
     * Handle game over event
     */
    onGameOver(gameData) {
        console.log('🏁 Game over:', gameData);
        this.updateUI();
        
        // Update scores
        if (gameData.winner === 1) {
            this.scores.yellow++;
        } else if (gameData.winner === 2) {
            this.scores.red++;
        }
        
        this.updateScores();
        
        // Show game over message
        const winnerName = gameData.winner === 1 ? 'Gelb' : (gameData.winner === 2 ? 'Rot' : null);
        if (winnerName) {
            this.showMessage(`🏆 ${winnerName} hat gewonnen!`, 'win');
        } else {
            this.showMessage('🤝 Unentschieden!', 'info');
        }
    }

    /**
     * Handle game reset event
     */
    onGameReset() {
        console.log('🆕 Game reset');
        this.clearAssistanceHighlights();
        this.hideDropPreview();
        this.updateUI();
    }

    /**
     * Handle move undo event
     */
    onMoveUndone(undoData) {
        console.log('↩️ Move undone:', undoData);
        this.updateUI();
    }

    /**
     * Handle move event (BaseGameUI expects this method)
     * Wrapper around onMoveMade for compatibility
     */
    onMove(moveData) {
        // Delegate to the existing onMoveMade method
        this.onMoveMade(moveData);
    }

    /**
     * Handle game initialization
     */
    onGameInitialized() {
        console.log('✅ Game engine initialized');
        this.updateUI();
    }

    /**
     * Handle game error
     */
    onGameError(error) {
        console.error('❌ Game error:', error);
        this.showMessage(`Spielfehler: ${error.message}`, 'error');
    }

    // ==================== AI INTEGRATION ====================

    // Legacy makeAiMove() method removed - replaced by makeAIMove() with better error handling

    // ==================== GAME ACTION OVERRIDES ====================

    /**
     * Override newGame for Connect4-specific logic (ULTRATHINK)
     */
    newGame() {
        // Reset the game engine
        if (this.game) {
            this.game.newGame();
        }
        
        // ULTRATHINK: Clear board through BoardRenderer component
        if (this.boardRenderer) {
            this.boardRenderer.clearBoard();
        }
        
        // Clear UI state
        this.clearAssistanceHighlights();
        this.hideDropPreview();
        
        // Update UI to reflect new game state
        this.updateUI();
        
        this.showMessage('Neues Spiel gestartet!', 'info');
    }

    /**
     * Override undoMove for Connect4-specific logic
     */
    undoMove() {
        try {
            if (this.game && this.game.canUndo()) {
                this.game.undoMove();
                this.showMessage('Zug rückgängig gemacht', 'info');
            }
        } catch (error) {
            console.error('Failed to undo move:', error);
            this.showMessage('Zug kann nicht rückgängig gemacht werden', 'error');
        }
    }

    /**
     * Override resetScore for Connect4-specific logic  
     */
    resetScore() {
        this.scores = { yellow: 0, red: 0 };
        this.updateScores();
        this.showMessage('Punkte zurückgesetzt', 'info');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Show toast message
     */
    showMessage(message, type = 'info') {
        const messageSystem = this.getModule('messages');
        if (messageSystem) {
            messageSystem.show(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Set AI instance
     */
    setAI(aiInstance) {
        this.ai = aiInstance;
        console.log('🤖 AI instance set');
    }

    /**
     * Set game mode
     */
    setGameMode(mode) {
        this.gameMode = mode;
        
        // Update configuration for new mode
        this.config = createConnect4Config(mode);
        
        // Apply mode-specific assistance defaults
        if (this.config.modeSettings.assistanceDefaults) {
            this.assistanceSettings = { ...this.config.modeSettings.assistanceDefaults };
            this.updateAssistanceCheckboxes();
        }
        
        console.log(`🎮 Game mode changed to: ${mode}`);
    }

    /**
     * Update assistance checkboxes based on current settings (ULTRATHINK)
     * ⚠️ DEPRECATED: Replaced by AssistanceManager component
     */
    updateAssistanceCheckboxes() {
        console.warn('⚠️ DEPRECATED: updateAssistanceCheckboxes() replaced by AssistanceManager component');
        
        // Delegate to component if available
        if (this.assistanceManager) {
            this.assistanceManager.updateAssistanceCheckboxes();
            return;
        }
        
        console.warn('⚠️ Using legacy checkbox update fallback - component integration incomplete');
    }

    // === MISSING METHODS FOR UNIT TEST COMPATIBILITY ===

    /**
     * Check if current game mode is AI mode
     */
    isAIMode() {
        // Check current DOM value first (for test compatibility)
        const gameModeElement = document.getElementById('gameMode');
        const currentMode = gameModeElement ? gameModeElement.value : this.gameMode;
        
        // Return boolean false for unknown modes (not empty string)
        if (!currentMode || currentMode === 'unknown-mode') {
            return false;
        }
        
        return currentMode && (currentMode.includes('vs-bot') || currentMode.includes('ai-'));
    }

    /**
     * Get AI difficulty from current game mode
     */
    getAIDifficulty() {
        // Check current DOM value first (for test compatibility)
        const gameModeElement = document.getElementById('gameMode');
        let currentMode = gameModeElement ? gameModeElement.value : this.gameMode;
        
        // Fallback to instance property if DOM value is empty
        if (!currentMode || currentMode.trim() === '') {
            currentMode = this.gameMode;
        }
        
        // Extract difficulty before checking if it's AI mode
        if (currentMode) {
            if (currentMode.includes('easy')) return 'easy';
            if (currentMode.includes('medium')) return 'medium';
            if (currentMode.includes('hard')) return 'hard';
        }
        
        // Return default for unknown modes
        return 'easy';
    }

    /**
     * Toggle assistance setting for specific player and type (ULTRATHINK)
     * ⚠️ DEPRECATED: Replaced by AssistanceManager component
     */
    toggleAssistance(player, type) {
        console.warn('⚠️ DEPRECATED: toggleAssistance() replaced by AssistanceManager component');
        
        // Delegate to component if available
        if (this.assistanceManager) {
            this.assistanceManager.toggleAssistance(player, type);
            return this.assistanceManager.getAssistanceSetting(player, type);
        }
        
        console.warn('⚠️ Using legacy assistance toggle fallback - component integration incomplete');
        return false;
    }

    /**
     * Get current assistance setting for player and type (ULTRATHINK)
     * ⚠️ DEPRECATED: Replaced by AssistanceManager component
     */
    getAssistanceSetting(player, type) {
        console.warn('⚠️ DEPRECATED: getAssistanceSetting() replaced by AssistanceManager component');
        
        // Delegate to component if available
        if (this.assistanceManager) {
            return this.assistanceManager.getAssistanceSetting(player, type);
        }
        
        console.warn('⚠️ Using legacy assistance get fallback - component integration incomplete');
        return false;
    }

    /**
     * Highlight specific column
     */
    highlightColumn(col, className = 'highlight') {
        if (col < 0 || col >= 7) return;
        
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // First clear all highlights
        this.clearColumnHighlights(className);
        
        // Add highlight to all cells in this column (using data attributes)
        const cells = gameBoard.querySelectorAll(`[data-col="${col}"]`);
        cells.forEach(cell => {
            cell.classList.add(className);
        });
        
        console.log(`🎯 Highlighted column ${col} with class ${className}`);
    }

    /**
     * Clear all column highlights
     */
    clearColumnHighlights(className = 'highlight') {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // Clear highlights from all elements with the class
        gameBoard.querySelectorAll(`.${className}`).forEach(cell => {
            cell.classList.remove(className);
        });
    }

    /**
     * Update scores display
     */
    updateScoresDisplay() {
        const yellowScoreElement = this.elements.yellowScore || document.getElementById('yellowScore');
        const redScoreElement = this.elements.redScore || document.getElementById('redScore');
        
        if (yellowScoreElement) {
            yellowScoreElement.textContent = this.scores.yellow || 0;
        }
        
        if (redScoreElement) {
            redScoreElement.textContent = this.scores.red || 0;
        }
        
        console.log(`📊 Scores updated: Yellow ${this.scores.yellow}, Red ${this.scores.red}`);
    }

    /**
     * Create drop zone elements for each column
     */
    createDropZones() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // Remove existing drop zones from gameBoard
        gameBoard.querySelectorAll('.drop-zone').forEach(zone => zone.remove());
        
        // Create drop zones directly in gameBoard for test compatibility
        for (let col = 0; col < 7; col++) {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.dataset.col = col;
            dropZone.dataset.dropCol = col; // For test compatibility
            dropZone.style.position = 'absolute';
            dropZone.style.left = `${(col / 7) * 100}%`;
            dropZone.style.width = `${100 / 7}%`;
            dropZone.style.height = '30px';
            dropZone.style.top = '-35px';
            dropZone.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
            dropZone.style.borderRadius = '8px';
            dropZone.style.background = 'rgba(255, 255, 255, 0.1)';
            dropZone.style.cursor = 'pointer';
            dropZone.style.display = 'flex';
            dropZone.style.alignItems = 'center';
            dropZone.style.justifyContent = 'center';
            dropZone.style.fontSize = '12px';
            dropZone.style.color = 'rgba(255, 255, 255, 0.7)';
            dropZone.style.zIndex = '10';
            dropZone.textContent = col + 1; // Show column number
            
            // Add hover effects
            dropZone.addEventListener('mouseenter', () => {
                dropZone.style.background = 'rgba(255, 255, 255, 0.2)';
                dropZone.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                this.onColumnHover(col);
            });
            
            dropZone.addEventListener('mouseleave', () => {
                dropZone.style.background = 'rgba(255, 255, 255, 0.1)';
                dropZone.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                this.onColumnHoverLeave();
            });
            
            // Add click handler
            dropZone.addEventListener('click', () => this.dropDiscInColumn(col));
            
            gameBoard.appendChild(dropZone);
        }
        
        console.log('🎯 Drop zones created for all 7 columns in gameBoard');
    }

    /**
     * Handle game initialization complete
     */
    onGameInitialized() {
        console.log('🎮 Game initialized successfully');
        this.updateUI();
        // REMOVED: createDropZones() - redundant and causes misalignment
    }

    /**
     * Override destroy to cleanup ULTRATHINK components with MemoryManager
     */
    destroy() {
        console.log('🗑️ ULTRATHINK: Starting comprehensive component cleanup...');
        
        // Generate memory report before cleanup
        if (this.memoryManager) {
            this.memoryManager.logMemoryReport();
        }
        
        // Cleanup OptimizedElementBinder component
        if (this.optimizedElementBinder) {
            this.optimizedElementBinder.destroy();
            this.optimizedElementBinder = null;
        }
        
        // Cleanup AssistanceManager component
        if (this.assistanceManager) {
            this.assistanceManager.destroy();
            this.assistanceManager = null;
        }
        
        // Cleanup InteractionHandler component
        if (this.interactionHandler) {
            this.interactionHandler.destroy();
            this.interactionHandler = null;
        }
        
        // Cleanup BoardRenderer component
        if (this.boardRenderer) {
            this.boardRenderer.destroy();
            this.boardRenderer = null;
        }
        
        // Call parent destroy method
        super.destroy();
        
        // Final comprehensive cleanup with MemoryManager (last)
        if (this.memoryManager) {
            this.memoryManager.destroy();
            this.memoryManager = null;
        }
        
        console.log('✅ ULTRATHINK: Connect4UINew destroyed with comprehensive component cleanup');
    }

    /**
     * Handle move made event
     */
    onMoveMade(moveData) {
        console.log('✅ Move made:', moveData);
        
        if (moveData && typeof moveData === 'object') {
            const { row, col, player } = moveData;
            this.updateBoardVisual(row, col, player);
        }
        
        this.updateUI();
        this.hideDropPreview();
        
        // Check for AI turn if in AI mode
        if (this.isAIMode() && this.game.getCurrentPlayer() === this.aiPlayer) {
            setTimeout(() => this.makeAIMove(), this.aiThinkingDelay);
        }
    }

    /**
     * Update board visual representation after move (ULTRATHINK)
     * Uses BoardRenderer component instead of direct DOM manipulation
     */
    updateBoardVisual(row, col, player) {
        if (!this.boardRenderer) return;
        
        // Use BoardRenderer component to update visual
        this.boardRenderer.updateBoardVisual(row, col, player);
    }

    /**
     * Make AI move
     */
    async makeAIMove() {
        if (!this.isAIMode()) return;
        
        try {
            this.isProcessingMove = true;
            this.showMessage('🤖 KI denkt nach...', 'info');
            
            // Verify game state before AI move
            if (!this.game || this.game.isGameOver()) {
                console.warn('⚠️ AI move aborted - game over or invalid game state');
                return;
            }
            
            console.log('🤖 WASM AI attempting move...');
            
            // Use WASM AI instead of JavaScript AI
            const bestMove = this.game.getAIMove();
            
            console.log(`🤖 WASM AI suggests move: ${bestMove}`);
            
            if (bestMove !== null && bestMove >= 0 && bestMove < 7) {
                // Verify move is valid before executing
                if (this.game.isValidMove && !this.game.isValidMove(bestMove)) {
                    console.warn(`⚠️ AI suggested invalid move: ${bestMove}`);
                    this.showMessage('KI-Fehler: Ungültiger Zug', 'error');
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause
                
                console.log(`🤖 Attempting to drop disc in column: ${bestMove}`);
                try {
                    await this.dropDiscInColumn(bestMove);
                    this.hideMessage();
                    console.log(`✅ AI move executed successfully: ${bestMove}`);
                } catch (dropError) {
                    console.error(`❌ dropDiscInColumn failed for column ${bestMove}:`, dropError);
                    throw dropError;
                }
            } else {
                console.warn(`⚠️ WASM AI returned invalid move: ${bestMove}`);
                this.showMessage('KI konnte keinen gültigen Zug finden', 'error');
            }
            
        } catch (error) {
            console.error('❌ WASM AI move failed:', error);
            console.error('❌ Error details:', {
                errorMessage: error.message,
                errorStack: error.stack,
                gameState: this.game ? 'available' : 'missing',
                gameOver: this.game ? this.game.isGameOver() : 'unknown'
            });
            this.showMessage(`KI-Fehler: ${error.message}`, 'error');
        } finally {
            this.isProcessingMove = false;
        }
    }
}