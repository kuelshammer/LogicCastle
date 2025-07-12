/**
 * GomokuAssistanceManager - Gomoku Player Assistance System
 * 
 * Adapted from Connect4 AssistanceManager for 15x15 Gomoku gameplay.
 * Provides intelligent assistance features for players.
 * 
 * Features:
 * - Threat detection and highlighting
 * - Winning move identification
 * - Blocked position detection
 * - Visual feedback for assistance features
 */

export class GomokuAssistanceManager {
    constructor(game, boardRenderer, elements) {
        this.game = game;
        this.boardRenderer = boardRenderer;
        this.elements = elements;
        
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
        
        // Tracked elements for cleanup
        this.highlightedElements = new Set();
    }

    /**
     * Setup player assistance system
     * Adapted from Connect4 AssistanceManager.setupAssistanceSystem()
     */
    setupAssistanceSystem() {
        const players = ['player1', 'player2'];
        const features = ['undo', 'threats', 'winning-moves', 'blocked-positions'];
        
        for (const player of players) {
            for (const feature of features) {
                const elementId = `${player}-${feature}`;
                const checkbox = this.elements[elementId];
                
                if (checkbox) {
                    const changeHandler = () => {
                        this.toggleAssistance(player, feature);
                    };
                    checkbox.addEventListener('change', changeHandler);
                } else {
                    console.warn(`⚠️ Assistance checkbox not found: ${elementId}`);
                }
            }
        }
        
        console.log('🎯 Gomoku player assistance system set up');
    }

    /**
     * Update assistance highlights based on current settings
     */
    updateAssistanceHighlights() {
        if (!this.game || !this.game.initialized || typeof this.game.getCurrentPlayer !== 'function') {
            console.log('⚠️ GomokuAssistanceManager: Game not ready for assistance highlights');
            return;
        }
        
        // Clear existing highlights
        this.clearAssistanceHighlights();
        
        const currentPlayer = this.game.getCurrentPlayer();
        const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
        const settings = this.assistanceSettings[playerKey];
        
        console.log(`🔍 GomokuAssistanceManager: Updating highlights for ${playerKey} (Player ${currentPlayer})`);
        console.log(`🔍 GomokuAssistanceManager: Settings:`, settings);
        
        if (settings.threats) {
            console.log('🔍 Highlighting threats...');
            this.highlightThreats();
        }
        
        if (settings['winning-moves']) {
            console.log('🔍 Highlighting winning moves...');
            this.highlightWinningMoves();
        }
        
        if (settings['blocked-positions']) {
            console.log('🔍 Highlighting blocked positions...');
            this.highlightBlockedPositions();
        }
        
        console.log(`✅ GomokuAssistanceManager: Highlights updated for ${playerKey}`);
    }

    /**
     * Highlight threat positions
     */
    highlightThreats() {
        if (!this.game || !this.game.getThreateningMoves) return;
        
        try {
            const currentPlayer = this.game.getCurrentPlayer();
            const opponent = currentPlayer === 1 ? 2 : 1;
            const threats = this.game.getThreateningMoves(opponent);
            
            this.highlightPositions(threats, 'threat-position');
            console.log(`🎯 Highlighted ${threats.length} threat positions for opponent ${opponent}`);
        } catch (error) {
            console.warn('⚠️ Failed to highlight threats:', error.message);
        }
    }

    /**
     * Highlight winning move positions
     */
    highlightWinningMoves() {
        if (!this.game) {
            console.warn('⚠️ No game instance for winning moves');
            return;
        }
        
        if (!this.game.getWinningMoves) {
            console.warn('⚠️ getWinningMoves method not available on game instance');
            return;
        }
        
        try {
            const currentPlayer = this.game.getCurrentPlayer();
            console.log(`🔍 Getting winning moves for player ${currentPlayer}...`);
            
            const winningMoves = this.game.getWinningMoves(currentPlayer);
            console.log(`🔍 Winning moves result:`, winningMoves);
            
            if (Array.isArray(winningMoves) && winningMoves.length > 0) {
                this.highlightPositions(winningMoves, 'winning-position');
                console.log(`🎯 Highlighted ${winningMoves.length} winning move positions for player ${currentPlayer}`);
            } else {
                console.log(`ℹ️ No winning moves available for player ${currentPlayer}`);
            }
        } catch (error) {
            console.error('❌ Failed to highlight winning moves:', error);
        }
    }

    /**
     * Highlight blocked/dangerous positions
     */
    highlightBlockedPositions() {
        if (!this.game || !this.game.getBlockingMoves) return;
        
        try {
            const currentPlayer = this.game.getCurrentPlayer();
            const blockedPositions = this.game.getBlockingMoves(currentPlayer);
            
            this.highlightPositions(blockedPositions, 'blocked-position');
            console.log(`🎯 Highlighted ${blockedPositions.length} blocked positions for player ${currentPlayer}`);
        } catch (error) {
            console.warn('⚠️ Failed to highlight blocked positions:', error.message);
        }
    }

    /**
     * Highlight specific positions with given class
     */
    highlightPositions(positions, highlightClass) {
        if (!Array.isArray(positions)) return;
        
        for (const position of positions) {
            this.highlightPosition(position, highlightClass);
        }
    }

    /**
     * Highlight single position with class
     */
    highlightPosition(position, highlightClass) {
        let row, col;
        
        // Handle different position formats
        if (Array.isArray(position) && position.length >= 2) {
            [row, col] = position;
        } else if (position && typeof position === 'object') {
            row = position.row;
            col = position.col;
        } else {
            console.warn('⚠️ Invalid position format:', position);
            return;
        }
        
        // Highlight the intersection
        this._highlightIntersection(row, col, highlightClass);
    }

    /**
     * Highlight intersection at position
     * @private
     */
    _highlightIntersection(row, col, highlightClass) {
        console.log(`🔍 Highlighting intersection at (${row}, ${col}) with class ${highlightClass}`);
        
        const intersection = this.boardRenderer.getIntersectionAt(row, col);
        if (intersection) {
            intersection.classList.add(highlightClass);
            this.highlightedElements.add(intersection);
            console.log(`✅ Added ${highlightClass} to intersection (${row}, ${col})`);
        } else {
            console.warn(`⚠️ Intersection not found at (${row}, ${col})`);
        }
    }

    /**
     * Clear all assistance highlights
     */
    clearAssistanceHighlights() {
        // Remove highlight classes from all tracked elements
        for (const element of this.highlightedElements) {
            element.classList.remove(
                'winning-position', 
                'threat-position', 
                'blocked-position',
                'assistance-highlight'
            );
        }
        this.highlightedElements.clear();
        
        // Also clear BoardRenderer highlights
        if (this.boardRenderer) {
            this.boardRenderer.clearAssistanceHighlights();
        }
        
        console.log('🧹 Assistance highlights cleared');
    }

    /**
     * Toggle assistance setting for specific player and type
     */
    toggleAssistance(player, type) {
        if (!this.assistanceSettings[player]) {
            console.warn(`⚠️ Invalid player: ${player}`);
            return;
        }
        
        const oldValue = this.assistanceSettings[player][type];
        this.assistanceSettings[player][type] = !oldValue;
        
        console.log(`🔄 Toggled ${player} ${type}: ${oldValue} → ${!oldValue}`);
        
        // Update highlights after toggle
        this.updateAssistanceHighlights();
        
        return this.assistanceSettings[player][type];
    }

    /**
     * Get current assistance setting for player and type
     */
    getAssistanceSetting(player, type) {
        if (!this.assistanceSettings[player]) {
            console.warn(`⚠️ Invalid player: ${player}`);
            return false;
        }
        
        return this.assistanceSettings[player][type] || false;
    }

    /**
     * Update assistance checkboxes based on current settings
     */
    updateAssistanceCheckboxes() {
        const players = ['player1', 'player2'];
        const features = ['undo', 'threats', 'winning-moves', 'blocked-positions'];
        
        for (const player of players) {
            for (const feature of features) {
                const elementId = `${player}-${feature}`;
                const checkbox = this.elements[elementId];
                
                if (checkbox && checkbox.type === 'checkbox') {
                    checkbox.checked = this.getAssistanceSetting(player, feature);
                }
            }
        }
        
        console.log('🔄 Assistance checkboxes updated');
    }

    /**
     * Enable assistance for player
     */
    enableAssistance(player, features = ['threats', 'winning-moves']) {
        if (!this.assistanceSettings[player]) {
            console.warn(`⚠️ Invalid player: ${player}`);
            return;
        }
        
        features.forEach(feature => {
            this.assistanceSettings[player][feature] = true;
        });
        
        this.updateAssistanceCheckboxes();
        this.updateAssistanceHighlights();
        
        console.log(`✅ Enabled assistance for ${player}:`, features);
    }

    /**
     * Disable assistance for player
     */
    disableAssistance(player, features = null) {
        if (!this.assistanceSettings[player]) {
            console.warn(`⚠️ Invalid player: ${player}`);
            return;
        }
        
        if (features === null) {
            // Disable all features
            features = Object.keys(this.assistanceSettings[player]);
        }
        
        features.forEach(feature => {
            this.assistanceSettings[player][feature] = false;
        });
        
        this.updateAssistanceCheckboxes();
        this.clearAssistanceHighlights();
        
        console.log(`❌ Disabled assistance for ${player}:`, features);
    }

    /**
     * Get all assistance settings
     */
    getAllSettings() {
        return JSON.parse(JSON.stringify(this.assistanceSettings));
    }

    /**
     * Set assistance settings
     */
    setSettings(settings) {
        this.assistanceSettings = { ...this.assistanceSettings, ...settings };
        this.updateAssistanceCheckboxes();
        this.updateAssistanceHighlights();
        
        console.log('🔄 Assistance settings updated:', this.assistanceSettings);
    }

    /**
     * Reset all assistance settings
     */
    resetSettings() {
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
        
        this.updateAssistanceCheckboxes();
        this.clearAssistanceHighlights();
        
        console.log('🔄 Assistance settings reset to defaults');
    }
}