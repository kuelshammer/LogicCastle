/**
 * OptimizedElementBinder - Clean ElementBinder for Refactored Connect4
 * 
 * ULTRATHINK Refactoring: Removes test compatibility patches and focuses on
 * production performance and reliability.
 * 
 * Key improvements over generic ElementBinder:
 * - Connect4-specific element validation
 * - Performance optimized DOM queries
 * - Memory efficient element caching
 * - No test compatibility overhead
 * - Enhanced error recovery
 */

export class OptimizedElementBinder {
    constructor(config = {}) {
        this.config = {
            required: config.required || [],
            optional: config.optional || [],
            validateStructure: config.validateStructure !== false,
            enableRecovery: config.enableRecovery !== false,
            cacheSelectors: config.cacheSelectors !== false
        };
        
        // Element storage
        this.boundElements = new Map();
        this.elementCache = new Map();
        this.missingElements = new Set();
        
        // Performance tracking
        this.bindingMetrics = {
            startTime: null,
            endTime: null,
            elementCount: 0,
            cacheHits: 0,
            recoveredElements: 0
        };
        
        // Recovery strategies
        this.recoveryStrategies = this.initializeRecoveryStrategies();
    }

    /**
     * Initialize element recovery strategies
     * @private
     */
    initializeRecoveryStrategies() {
        return {
            // Try common Connect4 element naming patterns
            'gameBoard': ['game-board', 'board', 'connect4-board'],
            'topCoords': ['top-coords', 'column-labels-top', 'coords-top'],
            'bottomCoords': ['bottom-coords', 'column-labels-bottom', 'coords-bottom'],
            'currentPlayerIndicator': ['current-player', 'player-indicator', 'active-player'],
            'gameStatus': ['game-status', 'status', 'game-state'],
            'yellowScore': ['yellow-score', 'player1-score', 'score-yellow'],
            'redScore': ['red-score', 'player2-score', 'score-red'],
            'moveCounter': ['move-counter', 'move-count', 'moves'],
            'newGameBtn': ['new-game', 'restart-game', 'reset-game'],
            'undoBtn': ['undo', 'undo-move', 'back'],
            'resetScoreBtn': ['reset-score', 'clear-score', 'reset-scores'],
            'helpBtn': ['help', 'show-help', 'help-button'],
            'assistanceBtn': ['assistance', 'hints', 'help-assistance']
        };
    }

    /**
     * Bind all configured DOM elements with performance monitoring
     * @returns {Object} Object containing all bound elements
     */
    async bindElements() {
        this.bindingMetrics.startTime = performance.now();
        
        try {
            console.log('📎 Starting optimized element binding...');
            
            // Clear previous bindings
            this.resetBindings();
            
            // Bind required elements with recovery
            await this.bindRequiredElements();
            
            // Bind optional elements
            await this.bindOptionalElements();
            
            // Validate Connect4-specific structure
            if (this.config.validateStructure) {
                this.validateConnect4Structure();
            }
            
            // Finalize binding process
            this.finalizeBinding();
            
            return this.getElementsObject();
            
        } catch (error) {
            console.error('❌ Element binding failed:', error);
            throw error;
        }
    }

    /**
     * Reset all binding state
     * @private
     */
    resetBindings() {
        this.boundElements.clear();
        this.missingElements.clear();
        this.bindingMetrics.elementCount = 0;
        this.bindingMetrics.cacheHits = 0;
        this.bindingMetrics.recoveredElements = 0;
    }

    /**
     * Bind required elements with recovery strategies
     * @private
     */
    async bindRequiredElements() {
        console.log(`📎 Binding ${this.config.required.length} required elements...`);
        
        for (const elementId of this.config.required) {
            const element = await this.bindElementWithRecovery(elementId, true);
            
            if (!element) {
                this.missingElements.add(elementId);
                console.error(`❌ Required element missing: ${elementId}`);
            }
        }
        
        // Check for critical failures
        if (this.missingElements.size > 0) {
            const critical = Array.from(this.missingElements).filter(id => 
                ['gameBoard', 'newGameBtn'].includes(id)
            );
            
            if (critical.length > 0) {
                throw new Error(`Critical elements missing: ${critical.join(', ')}`);
            }
        }
    }

    /**
     * Bind optional elements
     * @private
     */
    async bindOptionalElements() {
        console.log(`📎 Binding ${this.config.optional.length} optional elements...`);
        
        for (const elementId of this.config.optional) {
            await this.bindElementWithRecovery(elementId, false);
        }
    }

    /**
     * Bind element with automatic recovery strategies
     * @private
     */
    async bindElementWithRecovery(elementId, isRequired = false) {
        this.bindingMetrics.elementCount++;
        
        // Try direct binding first
        let element = this.findElement(elementId);
        
        // Try recovery strategies if direct binding failed
        if (!element && this.config.enableRecovery) {
            element = this.tryRecoveryStrategies(elementId);
            
            if (element) {
                this.bindingMetrics.recoveredElements++;
                console.log(`🔧 Recovered element '${elementId}' using fallback strategy`);
            }
        }
        
        // Store result
        if (element) {
            this.boundElements.set(elementId, element);
            console.debug(`📎 Bound element: ${elementId}`);
        } else {
            this.boundElements.set(elementId, null);
            
            if (isRequired) {
                console.error(`❌ Required element missing: ${elementId}`);
            } else {
                console.debug(`⚠️ Optional element missing: ${elementId}`);
            }
        }
        
        return element;
    }

    /**
     * Find element by ID with caching
     * @private
     */
    findElement(elementId) {
        // Check cache first
        if (this.config.cacheSelectors && this.elementCache.has(elementId)) {
            this.bindingMetrics.cacheHits++;
            return this.elementCache.get(elementId);
        }
        
        // Query DOM
        const element = document.getElementById(elementId);
        
        // Cache result
        if (this.config.cacheSelectors) {
            this.elementCache.set(elementId, element);
        }
        
        return element;
    }

    /**
     * Try recovery strategies for missing elements
     * @private
     */
    tryRecoveryStrategies(elementId) {
        const strategies = this.recoveryStrategies[elementId];
        if (!strategies) return null;
        
        for (const fallbackId of strategies) {
            const element = document.getElementById(fallbackId);
            if (element) {
                console.log(`🔧 Found '${elementId}' using fallback: '${fallbackId}'`);
                return element;
            }
        }
        
        // Try class-based selectors as last resort
        return this.tryClassBasedRecovery(elementId);
    }

    /**
     * Try class-based recovery for common patterns
     * @private
     */
    tryClassBasedRecovery(elementId) {
        const classPatterns = {
            'gameBoard': ['.game-board', '.board', '.connect4-board'],
            'newGameBtn': ['.new-game', '.restart-btn', '.reset-btn'],
            'undoBtn': ['.undo', '.undo-btn'],
            'helpBtn': ['.help', '.help-btn'],
            'assistanceBtn': ['.assistance', '.hints-btn']
        };
        
        const patterns = classPatterns[elementId];
        if (!patterns) return null;
        
        for (const pattern of patterns) {
            const element = document.querySelector(pattern);
            if (element) {
                console.log(`🔧 Found '${elementId}' using class selector: '${pattern}'`);
                return element;
            }
        }
        
        return null;
    }

    /**
     * Validate Connect4-specific DOM structure
     * @private
     */
    validateConnect4Structure() {
        console.log('🔍 Validating Connect4 DOM structure...');
        
        const validations = [
            this.validateGameBoard(),
            this.validateCoordinateStructure(),
            this.validateUIControls(),
            this.validateModalStructure()
        ];
        
        const failures = validations.filter(result => !result.valid);
        
        if (failures.length > 0) {
            console.warn('⚠️ DOM structure validation warnings:');
            failures.forEach(failure => {
                console.warn(`  - ${failure.message}`);
            });
        } else {
            console.log('✅ DOM structure validation passed');
        }
    }

    /**
     * Validate game board structure
     * @private
     */
    validateGameBoard() {
        const gameBoard = this.boundElements.get('gameBoard');
        
        if (!gameBoard) {
            return { valid: false, message: 'Game board element missing' };
        }
        
        // Check if board has proper structure for Connect4
        const cells = gameBoard.querySelectorAll('.game-slot, .cell');
        const expectedCells = 42; // 6x7 Connect4 board
        
        if (cells.length > 0 && cells.length !== expectedCells) {
            return { 
                valid: false, 
                message: `Expected ${expectedCells} board cells, found ${cells.length}` 
            };
        }
        
        return { valid: true };
    }

    /**
     * Validate coordinate structure
     * @private
     */
    validateCoordinateStructure() {
        const topCoords = this.boundElements.get('topCoords');
        const bottomCoords = this.boundElements.get('bottomCoords');
        
        if (!topCoords && !bottomCoords) {
            return { valid: false, message: 'No coordinate elements found' };
        }
        
        // Check coordinate count (should be 7 for Connect4)
        if (topCoords) {
            const coords = topCoords.querySelectorAll('.coord');
            if (coords.length > 0 && coords.length !== 7) {
                return { 
                    valid: false, 
                    message: `Expected 7 top coordinates, found ${coords.length}` 
                };
            }
        }
        
        return { valid: true };
    }

    /**
     * Validate UI controls
     * @private
     */
    validateUIControls() {
        const requiredControls = ['newGameBtn'];
        const missingControls = requiredControls.filter(control => 
            !this.boundElements.get(control)
        );
        
        if (missingControls.length > 0) {
            return { 
                valid: false, 
                message: `Missing essential controls: ${missingControls.join(', ')}` 
            };
        }
        
        return { valid: true };
    }

    /**
     * Validate modal structure
     * @private
     */
    validateModalStructure() {
        const modals = ['helpModal', 'assistanceModal'];
        const foundModals = modals.filter(modal => this.boundElements.get(modal));
        
        if (foundModals.length === 0) {
            return { 
                valid: false, 
                message: 'No modal elements found - help system may not work' 
            };
        }
        
        return { valid: true };
    }

    /**
     * Finalize binding process and report results
     * @private
     */
    finalizeBinding() {
        this.bindingMetrics.endTime = performance.now();
        const bindingTime = this.bindingMetrics.endTime - this.bindingMetrics.startTime;
        
        const boundCount = Array.from(this.boundElements.values()).filter(el => el !== null).length;
        const totalCount = this.bindingMetrics.elementCount;
        
        console.log('📊 Element Binding Results:');
        console.log(`   ✅ Bound: ${boundCount}/${totalCount} elements`);
        console.log(`   🔧 Recovered: ${this.bindingMetrics.recoveredElements} elements`);
        console.log(`   ⚡ Cache hits: ${this.bindingMetrics.cacheHits}`);
        console.log(`   ⏱️ Binding time: ${bindingTime.toFixed(2)}ms`);
        
        if (this.missingElements.size > 0) {
            console.log(`   ❌ Missing: ${Array.from(this.missingElements).join(', ')}`);
        }
    }

    /**
     * Get bound elements as plain object for compatibility
     */
    getElementsObject() {
        const elements = {};
        for (const [key, value] of this.boundElements) {
            elements[key] = value;
        }
        return elements;
    }

    /**
     * Get specific element by ID
     */
    getElement(elementId) {
        return this.boundElements.get(elementId) || null;
    }

    /**
     * Check if element exists and is bound
     */
    hasElement(elementId) {
        return this.boundElements.has(elementId) && this.boundElements.get(elementId) !== null;
    }

    /**
     * Get all bound elements (non-null only)
     */
    getBoundElements() {
        const bound = {};
        for (const [key, value] of this.boundElements) {
            if (value !== null) {
                bound[key] = value;
            }
        }
        return bound;
    }

    /**
     * Get binding performance metrics
     */
    getMetrics() {
        return { ...this.bindingMetrics };
    }

    /**
     * Rebind specific element (for dynamic DOM changes)
     */
    async rebindElement(elementId) {
        console.log(`🔄 Rebinding element: ${elementId}`);
        
        // Clear cache
        if (this.config.cacheSelectors) {
            this.elementCache.delete(elementId);
        }
        
        // Rebind element
        const wasRequired = this.config.required.includes(elementId);
        const element = await this.bindElementWithRecovery(elementId, wasRequired);
        
        return element;
    }

    /**
     * Add dynamic element to binding configuration
     */
    addElement(elementId, isRequired = false) {
        if (isRequired) {
            if (!this.config.required.includes(elementId)) {
                this.config.required.push(elementId);
            }
        } else {
            if (!this.config.optional.includes(elementId)) {
                this.config.optional.push(elementId);
            }
        }
        
        // Bind immediately
        return this.bindElementWithRecovery(elementId, isRequired);
    }

    /**
     * Clear element cache
     */
    clearCache() {
        this.elementCache.clear();
        this.bindingMetrics.cacheHits = 0;
        console.log('🧹 Element cache cleared');
    }

    /**
     * Destroy binder and cleanup
     */
    destroy() {
        this.boundElements.clear();
        this.elementCache.clear();
        this.missingElements.clear();
        
        // Reset metrics
        this.bindingMetrics = {
            startTime: null,
            endTime: null,
            elementCount: 0,
            cacheHits: 0,
            recoveredElements: 0
        };
        
        console.log('🗑️ OptimizedElementBinder destroyed');
    }
}