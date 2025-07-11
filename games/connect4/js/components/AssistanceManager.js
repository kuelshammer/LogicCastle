/**
 * AssistanceManager - Connect4 Player Assistance System
 * 
 * Extracted from Connect4UINew for focused responsibility.
 * Handles threat detection, winning moves, and visual assistance hints.
 * 
 * Responsibilities:
 * - Player assistance settings management
 * - Threat detection & highlighting
 * - Winning move identification
 * - Blocked column detection
 * - Visual feedback for assistance features
 */

export class AssistanceManager {
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
                'blocked-columns': false 
            },
            player2: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-columns': false 
            }
        };
        
        // Tracked elements for cleanup
        this.highlightedElements = new Set();
    }

    /**
     * Setup player assistance system
     * Extracted from Connect4UINew.setupAssistanceSystem()
     */
    setupAssistanceSystem() {
        const players = ['player1', 'player2'];
        const features = ['undo', 'threats', 'winning-moves', 'blocked-columns'];
        
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
        
        console.log('🎯 Player assistance system set up');
    }

    /**
     * Update assistance highlights based on current settings
     * Extracted from Connect4UINew.updateAssistanceHighlights()
     */
    updateAssistanceHighlights() {
        if (!this.game || !this.game.initialized || typeof this.game.getCurrentPlayer !== 'function') {
            console.log('⚠️ AssistanceManager: Game not ready for assistance highlights');
            return;
        }
        
        // Clear existing highlights
        this.clearAssistanceHighlights();
        
        const currentPlayer = this.game.getCurrentPlayer();
        const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
        const settings = this.assistanceSettings[playerKey];
        
        console.log(`🔍 AssistanceManager: Updating highlights for ${playerKey} (Player ${currentPlayer})`);
        console.log(`🔍 AssistanceManager: Settings:`, settings);
        
        if (settings.threats) {
            console.log('🔍 Highlighting threats...');
            this.highlightThreats();
        }
        
        if (settings['winning-moves']) {
            console.log('🔍 Highlighting winning moves...');
            this.highlightWinningMoves();
        }
        
        if (settings['blocked-columns']) {
            console.log('🔍 Highlighting blocked columns...');
            this.highlightBlockedColumns();
        }
        
        console.log(`✅ AssistanceManager: Highlights updated for ${playerKey}`);
    }

    /**
     * Highlight threat columns
     * Extracted from Connect4UINew.highlightThreats()
     */
    highlightThreats() {
        if (!this.game || !this.game.getThreateningMoves) return;
        
        try {
            const currentPlayer = this.game.getCurrentPlayer();
            const opponent = currentPlayer === 1 ? 2 : 1;
            const threats = this.game.getThreateningMoves(opponent);
            
            this.highlightColumns(threats, 'blocking-column');
            console.log(`🎯 Highlighted ${threats.length} threat columns for opponent ${opponent}`);
        } catch (error) {
            console.warn('⚠️ Failed to highlight threats:', error.message);
        }
    }

    /**
     * Highlight winning move columns
     * Extracted from Connect4UINew.highlightWinningMoves()
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
                this.highlightColumns(winningMoves, 'winning-column');
                console.log(`🎯 Highlighted ${winningMoves.length} winning move columns for player ${currentPlayer}`);
            } else {
                console.log(`ℹ️ No winning moves available for player ${currentPlayer}`);
            }
        } catch (error) {
            console.error('❌ Failed to highlight winning moves:', error);
        }
    }

    /**
     * Highlight blocked/dangerous columns
     * Extracted from Connect4UINew.highlightBlockedColumns()
     */
    highlightBlockedColumns() {
        if (!this.game || !this.game.getBlockingMoves) return;
        
        try {
            const currentPlayer = this.game.getCurrentPlayer();
            const blockedColumns = this.game.getBlockingMoves(currentPlayer);
            
            this.highlightColumns(blockedColumns, 'blocked-column');
            console.log(`🎯 Highlighted ${blockedColumns.length} blocked columns for player ${currentPlayer}`);
        } catch (error) {
            console.warn('⚠️ Failed to highlight blocked columns:', error.message);
        }
    }

    /**
     * Highlight specific columns with given class
     * Extracted from Connect4UINew.highlightColumns()
     */
    highlightColumns(columns, highlightClass) {
        if (!Array.isArray(columns)) return;
        
        for (const col of columns) {
            this.highlightColumn(col, highlightClass);
        }
    }

    /**
     * Highlight single column with class
     */
    highlightColumn(col, highlightClass) {
        // Highlight coordinate labels
        this._highlightCoordinateLabels(col, highlightClass);
        
        // Highlight column cells (optional, based on design preference)
        this._highlightColumnCells(col, highlightClass);
    }

    /**
     * Highlight coordinate labels for column
     * @private
     */
    _highlightCoordinateLabels(col, highlightClass) {
        // Highlight top coordinates
        const topCoord = this.elements.topCoords?.querySelector(`[data-col="${col}"]`);
        if (topCoord) {
            topCoord.classList.add(highlightClass);
            this.highlightedElements.add(topCoord);
        }
        
        // Highlight bottom coordinates
        const bottomCoord = this.elements.bottomCoords?.querySelector(`[data-col="${col}"]`);
        if (bottomCoord) {
            bottomCoord.classList.add(highlightClass);
            this.highlightedElements.add(bottomCoord);
        }
    }

    /**
     * Highlight column cells
     * @private
     */
    _highlightColumnCells(col, highlightClass) {
        for (let row = 0; row < 6; row++) {
            const cell = this.boardRenderer.getCellAt(row, col);
            if (cell) {
                cell.classList.add(highlightClass);
                this.highlightedElements.add(cell);
            }
        }
    }

    /**
     * Clear all assistance highlights
     * Extracted from Connect4UINew.clearAssistanceHighlights()
     */
    clearAssistanceHighlights() {
        // Remove highlight classes from all tracked elements
        for (const element of this.highlightedElements) {
            element.classList.remove(
                'winning-column', 
                'blocking-column', 
                'blocked-column',
                'threat-column',
                'highlight'
            );
        }
        this.highlightedElements.clear();
        
        // Also clear from coordinate labels specifically
        this._clearCoordinateHighlights();
    }

    /**
     * Clear coordinate label highlights
     * @private
     */
    _clearCoordinateHighlights() {
        const highlightClasses = ['winning-column', 'blocking-column', 'blocked-column', 'threat-column'];
        
        // Clear top coordinates
        if (this.elements.topCoords) {
            const coords = this.elements.topCoords.querySelectorAll('.coord');
            coords.forEach(coord => {
                highlightClasses.forEach(cls => coord.classList.remove(cls));
            });
        }
        
        // Clear bottom coordinates
        if (this.elements.bottomCoords) {
            const coords = this.elements.bottomCoords.querySelectorAll('.coord');
            coords.forEach(coord => {
                highlightClasses.forEach(cls => coord.classList.remove(cls));
            });
        }
    }

    /**
     * Toggle assistance feature for player
     * Extracted from Connect4UINew.toggleAssistance()
     */
    toggleAssistance(player, type) {
        if (!this.assistanceSettings[player] || this.assistanceSettings[player][type] === undefined) {
            console.warn(`⚠️ AssistanceManager: Invalid assistance setting: ${player}.${type}`);
            return;
        }

        // Toggle the setting
        this.assistanceSettings[player][type] = !this.assistanceSettings[player][type];
        
        console.log(`🎯 AssistanceManager: Toggled ${player} ${type}: ${this.assistanceSettings[player][type]}`);
        console.log(`🎯 AssistanceManager: Full settings:`, this.assistanceSettings);
        
        // Update highlights immediately
        this.updateAssistanceHighlights();
        
        // Update UI checkboxes
        this.updateAssistanceCheckboxes();
    }

    /**
     * Get assistance setting for player and type
     * Extracted from Connect4UINew.getAssistanceSetting()
     */
    getAssistanceSetting(player, type) {
        return this.assistanceSettings[player]?.[type] || false;
    }

    /**
     * Update assistance checkboxes to match settings
     */
    updateAssistanceCheckboxes() {
        const players = ['player1', 'player2'];
        const features = ['undo', 'threats', 'winning-moves', 'blocked-columns'];
        
        for (const player of players) {
            for (const feature of features) {
                const elementId = `${player}-${feature}`;
                const checkbox = this.elements[elementId];
                
                if (checkbox) {
                    checkbox.checked = this.assistanceSettings[player][feature];
                } else {
                    console.warn(`⚠️ Checkbox not found for update: ${elementId}`);
                }
            }
        }
    }

    /**
     * Apply assistance defaults from configuration
     */
    applyAssistanceDefaults(defaults) {
        if (!defaults) return;
        
        // Deep merge defaults with current settings
        for (const player in defaults) {
            if (this.assistanceSettings[player]) {
                Object.assign(this.assistanceSettings[player], defaults[player]);
            }
        }
        
        // Update UI to reflect new settings
        this.updateAssistanceCheckboxes();
        this.updateAssistanceHighlights();
        
        console.log('🎯 Applied assistance defaults:', defaults);
    }

    /**
     * Reset all assistance settings to defaults
     */
    resetAssistanceSettings() {
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
        
        this.clearAssistanceHighlights();
        this.updateAssistanceCheckboxes();
        
        console.log('🎯 Reset all assistance settings to defaults');
    }

    /**
     * Get current assistance settings
     */
    getAssistanceSettings() {
        return JSON.parse(JSON.stringify(this.assistanceSettings)); // Deep copy
    }

    /**
     * Set assistance settings
     */
    setAssistanceSettings(settings) {
        this.assistanceSettings = JSON.parse(JSON.stringify(settings)); // Deep copy
        this.updateAssistanceCheckboxes();
        this.updateAssistanceHighlights();
    }

    /**
     * Check if any assistance features are enabled for current player
     */
    hasActiveAssistance() {
        if (!this.game) return false;
        
        const currentPlayer = this.game.getCurrentPlayer();
        const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
        const settings = this.assistanceSettings[playerKey];
        
        return Object.values(settings).some(enabled => enabled);
    }

    /**
     * Destroy assistance manager and cleanup
     */
    destroy() {
        this.clearAssistanceHighlights();
        this.resetAssistanceSettings();
        this.highlightedElements.clear();
    }
}