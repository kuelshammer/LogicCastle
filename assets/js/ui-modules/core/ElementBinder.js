/**
 * ElementBinder - Centralized DOM element caching and validation
 * 
 * Eliminates the duplicate element binding code found in all game UIs.
 * Provides validation, error handling, and consistent element access patterns.
 * 
 * Features:
 * - Required vs optional element handling
 * - Automatic validation and error reporting
 * - Consistent element naming conventions
 * - Null-safe element access
 */

export class ElementBinder {
    constructor(config = {}) {
        this.config = {
            required: config.required || [],
            optional: config.optional || [],
            validateOnBind: config.validateOnBind !== false,
            throwOnMissing: config.throwOnMissing !== false
        };
        
        this.boundElements = {};
        this.missingElements = [];
    }

    /**
     * Bind all configured DOM elements
     * @returns {Object} Object containing all bound elements
     */
    async bindElements() {
        this.boundElements = {};
        this.missingElements = [];

        // Bind required elements
        for (const elementId of this.config.required) {
            this.bindElement(elementId, true);
        }

        // Bind optional elements
        for (const elementId of this.config.optional) {
            this.bindElement(elementId, false);
        }

        // Validate bindings
        if (this.config.validateOnBind) {
            this.validateBindings();
        }

        // Report results
        this.reportBindingResults();

        return this.boundElements;
    }

    /**
     * Bind a single DOM element
     * @param {string} elementId - The DOM element ID
     * @param {boolean} isRequired - Whether the element is required
     */
    bindElement(elementId, isRequired = false) {
        const element = document.getElementById(elementId);
        
        if (element) {
            this.boundElements[elementId] = element;
            console.debug(`📎 Bound element: ${elementId}`);
        } else {
            if (isRequired) {
                this.missingElements.push(elementId);
                console.error(`❌ Required element missing: ${elementId}`);
            } else {
                console.debug(`⚠️ Optional element missing: ${elementId}`);
            }
            
            // Set to null for consistency
            this.boundElements[elementId] = null;
        }
    }

    /**
     * Validate that all required elements were found
     */
    validateBindings() {
        if (this.missingElements.length > 0) {
            const errorMessage = `Missing required DOM elements: ${this.missingElements.join(', ')}`;
            
            if (this.config.throwOnMissing) {
                throw new Error(errorMessage);
            } else {
                console.error(`❌ ${errorMessage}`);
            }
        }
    }

    /**
     * Report binding results for debugging
     */
    reportBindingResults() {
        const totalElements = this.config.required.length + this.config.optional.length;
        const boundCount = Object.values(this.boundElements).filter(el => el !== null).length;
        const missingCount = totalElements - boundCount;

        console.log(`📊 Element Binding Results:`);
        console.log(`   ✅ Bound: ${boundCount}/${totalElements} elements`);
        
        if (missingCount > 0) {
            console.log(`   ❌ Missing: ${missingCount} elements`);
            
            if (this.missingElements.length > 0) {
                console.log(`   📋 Missing required: ${this.missingElements.join(', ')}`);
            }
        }
    }

    /**
     * Get a bound element by ID
     * @param {string} elementId - The element ID
     * @returns {HTMLElement|null} The DOM element or null
     */
    getElement(elementId) {
        return this.boundElements[elementId] || null;
    }

    /**
     * Check if an element exists and is bound
     * @param {string} elementId - The element ID
     * @returns {boolean} True if element exists and is bound
     */
    hasElement(elementId) {
        return this.boundElements[elementId] !== null && this.boundElements[elementId] !== undefined;
    }

    /**
     * Get all bound elements
     * @returns {Object} All bound elements
     */
    getAllElements() {
        return { ...this.boundElements };
    }

    /**
     * Get all successfully bound elements (non-null)
     * @returns {Object} Successfully bound elements only
     */
    getBoundElements() {
        const bound = {};
        
        for (const [id, element] of Object.entries(this.boundElements)) {
            if (element !== null) {
                bound[id] = element;
            }
        }
        
        return bound;
    }

    /**
     * Get list of missing required elements
     * @returns {string[]} Array of missing element IDs
     */
    getMissingElements() {
        return [...this.missingElements];
    }

    /**
     * Check if all required elements are bound
     * @returns {boolean} True if all required elements are present
     */
    allRequiredElementsBound() {
        return this.missingElements.length === 0;
    }

    /**
     * Rebind a specific element (useful for dynamic content)
     * @param {string} elementId - The element ID to rebind
     * @param {boolean} isRequired - Whether the element is required
     */
    rebindElement(elementId, isRequired = false) {
        // Remove from missing list if it was there
        const missingIndex = this.missingElements.indexOf(elementId);
        if (missingIndex > -1) {
            this.missingElements.splice(missingIndex, 1);
        }

        // Rebind the element
        this.bindElement(elementId, isRequired);
    }

    /**
     * Add a new element to bind dynamically
     * @param {string} elementId - The element ID
     * @param {boolean} isRequired - Whether the element is required
     */
    addElement(elementId, isRequired = false) {
        if (isRequired && !this.config.required.includes(elementId)) {
            this.config.required.push(elementId);
        } else if (!isRequired && !this.config.optional.includes(elementId)) {
            this.config.optional.push(elementId);
        }

        this.bindElement(elementId, isRequired);
    }

    /**
     * Remove an element from the binding configuration
     * @param {string} elementId - The element ID to remove
     */
    removeElement(elementId) {
        // Remove from configuration
        this.config.required = this.config.required.filter(id => id !== elementId);
        this.config.optional = this.config.optional.filter(id => id !== elementId);
        
        // Remove from bound elements
        delete this.boundElements[elementId];
        
        // Remove from missing list
        this.missingElements = this.missingElements.filter(id => id !== elementId);
    }

    /**
     * Create safe element accessor methods
     * Returns functions that safely access elements with null checks
     */
    createSafeAccessors() {
        const accessors = {};
        
        for (const elementId of [...this.config.required, ...this.config.optional]) {
            accessors[elementId] = () => this.getElement(elementId);
            
            // Create convenience methods for common operations
            accessors[`${elementId}Exists`] = () => this.hasElement(elementId);
            
            accessors[`${elementId}Safe`] = (callback) => {
                const element = this.getElement(elementId);
                if (element && typeof callback === 'function') {
                    return callback(element);
                }
                return null;
            };
        }
        
        return accessors;
    }

    /**
     * Validate HTML structure for common game UI patterns
     */
    validateGameUIStructure() {
        const validationResults = {
            hasGameBoard: this.hasElement('gameBoard'),
            hasGameStatus: this.hasElement('gameStatus'),
            hasControls: false,
            hasModals: false,
            warnings: []
        };

        // Check for control buttons
        const controlElements = ['newGameBtn', 'undoBtn', 'resetScoreBtn', 'helpBtn'];
        validationResults.hasControls = controlElements.some(id => this.hasElement(id));

        // Check for modals
        const modalElements = ['helpModal', 'errorModal', 'gameHelpModal'];
        validationResults.hasModals = modalElements.some(id => this.hasElement(id));

        // Generate warnings for missing common elements
        if (!validationResults.hasGameBoard) {
            validationResults.warnings.push('No game board element found (gameBoard)');
        }
        
        if (!validationResults.hasControls) {
            validationResults.warnings.push('No control buttons found (newGameBtn, undoBtn, etc.)');
        }

        return validationResults;
    }

    /**
     * Generate element binding report for debugging
     */
    generateReport() {
        return {
            config: { ...this.config },
            boundElements: Object.keys(this.getBoundElements()),
            missingElements: this.getMissingElements(),
            totalElements: this.config.required.length + this.config.optional.length,
            successRate: this.calculateSuccessRate(),
            validationPassed: this.allRequiredElementsBound()
        };
    }

    /**
     * Calculate binding success rate
     */
    calculateSuccessRate() {
        const total = this.config.required.length + this.config.optional.length;
        const bound = Object.values(this.boundElements).filter(el => el !== null).length;
        return total > 0 ? Math.round((bound / total) * 100) : 100;
    }
}