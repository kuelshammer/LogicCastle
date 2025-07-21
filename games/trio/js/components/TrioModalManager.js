/**
 * TrioModalManager - Modal Dialog Management for Trio
 * 
 * Adapted from Connect4/Gomoku ModalManager for Trio help and settings modals.
 * Handles modal visibility, animations, and user interactions.
 * 
 * Features:
 * - Smooth modal animations with glassmorphism effects
 * - Help modal with trio rules and strategies
 * - Statistics modal showing game progress
 * - Settings modal for audio and visual preferences
 * - Keyboard shortcuts and accessibility support
 * - Focus management and backdrop click handling
 */

export class TrioModalManager {
    constructor() {
        this.activeModal = null;
        this.modals = new Map();
        
        // Track modal states
        this.isAnimating = false;
        
        // Reduced motion support
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Initialize modals
        this.initializeModals();
        
        // Global event listeners
        this.setupGlobalListeners();
        
        console.log('🪟 TrioModalManager initialized');
    }
    
    /**
     * Initialize all modals in the DOM
     * @private
     */
    initializeModals() {
        // Define trio-specific modals
        const modalConfigs = [
            { id: 'help', title: 'Trio - Spielanleitung' },
            { id: 'statistics', title: 'Trio - Statistiken' },
            { id: 'settings', title: 'Trio - Einstellungen' }
        ];
        
        modalConfigs.forEach(config => {
            const modalElement = document.getElementById(`${config.id}Modal`);
            if (modalElement) {
                this.registerModal(config.id, modalElement, config.title);
            }
        });
    }
    
    /**
     * Register a modal for management
     */
    registerModal(name, element, title = '') {
        if (!element) {
            console.warn(`⚠️ Modal element not found: ${name}`);
            return;
        }
        
        // Store modal data
        this.modals.set(name, {
            element,
            name,
            title,
            isOpen: false
        });
        
        // Set up modal-specific event listeners
        this.setupModalListeners(name, element);
        
        console.log(`🪟 Registered trio modal: ${name}`);
    }
    
    /**
     * Set up event listeners for a specific modal
     * @private
     */
    setupModalListeners(name, element) {
        // Close buttons (multiple possible patterns)
        const closeSelectors = [
            `#close${name.charAt(0).toUpperCase() + name.slice(1)}Btn`,
            `#close${name.charAt(0).toUpperCase() + name.slice(1)}FooterBtn`,
            `.close-${name}-modal`,
            '.modal-close'
        ];
        
        closeSelectors.forEach(selector => {
            const buttons = element.querySelectorAll(selector);
            buttons.forEach(button => {
                button.addEventListener('click', () => this.close(name));
            });
        });
        
        // Backdrop click to close
        element.addEventListener('click', (e) => {
            if (e.target === element) {
                this.close(name);
            }
        });
        
        // Prevent modal content clicks from closing modal
        const modalContent = element.querySelector('.glass, .modal-content, .trio-modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    /**
     * Set up global event listeners
     * @private
     */
    setupGlobalListeners() {
        // Escape key to close active modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });
        
        // F1 for help modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggle('help');
            }
        });
    }
    
    /**
     * Open a modal
     */
    open(name) {
        if (this.isAnimating) return;
        
        const modalData = this.modals.get(name);
        if (!modalData) {
            console.warn(`⚠️ Trio modal not found: ${name}`);
            return;
        }
        
        // Close any open modal first
        if (this.activeModal && this.activeModal !== name) {
            this.close(this.activeModal);
        }
        
        const { element } = modalData;
        
        console.log(`🪟 Opening trio modal: ${name}`);
        
        // Set active modal
        this.activeModal = name;
        modalData.isOpen = true;
        
        // Show modal with animation
        element.classList.remove('hidden');
        
        // Force reflow before animation
        element.offsetHeight;
        
        if (this.reducedMotion) {
            // Skip animation for reduced motion
            element.classList.add('opacity-100');
            const modalContent = element.querySelector('.glass, .modal-content');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }
        } else {
            // Animate in
            this.isAnimating = true;
            element.classList.add('opacity-100');
            
            const modalContent = element.querySelector('.glass, .modal-content');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }
            
            // Animation complete
            setTimeout(() => {
                this.isAnimating = false;
            }, 300);
        }
        
        // Focus management
        this.focusModal(element);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Update modal content if needed
        this.updateModalContent(name);
    }
    
    /**
     * Close a modal
     */
    close(name) {
        if (this.isAnimating) return;
        
        const modalData = this.modals.get(name);
        if (!modalData || !modalData.isOpen) {
            return;
        }
        
        const { element } = modalData;
        
        console.log(`🪟 Closing trio modal: ${name}`);
        
        if (this.reducedMotion) {
            // Skip animation for reduced motion
            element.classList.add('hidden');
            element.classList.remove('opacity-100');
            const modalContent = element.querySelector('.glass, .modal-content');
            if (modalContent) {
                modalContent.classList.remove('scale-100');
                modalContent.classList.add('scale-95');
            }
        } else {
            // Animate out
            this.isAnimating = true;
            element.classList.remove('opacity-100');
            
            const modalContent = element.querySelector('.glass, .modal-content');
            if (modalContent) {
                modalContent.classList.remove('scale-100');
                modalContent.classList.add('scale-95');
            }
            
            // Hide after animation
            setTimeout(() => {
                element.classList.add('hidden');
                this.isAnimating = false;
            }, 300);
        }
        
        // Update state
        modalData.isOpen = false;
        if (this.activeModal === name) {
            this.activeModal = null;
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to trigger element if available
        this.restoreFocus();
    }
    
    /**
     * Toggle modal open/close
     */
    toggle(name) {
        const modalData = this.modals.get(name);
        if (!modalData) return;
        
        if (modalData.isOpen) {
            this.close(name);
        } else {
            this.open(name);
        }
    }
    
    /**
     * Check if modal is open
     */
    isOpen(name) {
        const modalData = this.modals.get(name);
        return modalData ? modalData.isOpen : false;
    }
    
    /**
     * Close all modals
     */
    closeAll() {
        this.modals.forEach((modalData, name) => {
            if (modalData.isOpen) {
                this.close(name);
            }
        });
    }
    
    /**
     * Update modal content based on current game state
     * @private
     */
    updateModalContent(name) {
        const modalData = this.modals.get(name);
        if (!modalData) return;
        
        switch (name) {
            case 'statistics':
                this.updateStatisticsModal(modalData.element);
                break;
            case 'help':
                this.updateHelpModal(modalData.element);
                break;
            case 'settings':
                this.updateSettingsModal(modalData.element);
                break;
        }
    }
    
    /**
     * Update statistics modal content
     * @private
     */
    updateStatisticsModal(element) {
        // This would be populated with actual game statistics
        const statsContainer = element.querySelector('.trio-statistics-content');
        if (!statsContainer) return;
        
        // Example statistics update
        const exampleStats = {
            solutionsFound: 15,
            totalMoves: 45,
            currentDifficulty: 'vollspektrum',
            averageTime: '2:34',
            bestTime: '1:12'
        };
        
        statsContainer.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="trio-stat-item">
                        <div class="text-2xl font-bold text-emerald-400">${exampleStats.solutionsFound}</div>
                        <div class="text-sm text-white/80">Lösungen gefunden</div>
                    </div>
                    <div class="trio-stat-item">
                        <div class="text-2xl font-bold text-amber-400">${exampleStats.totalMoves}</div>
                        <div class="text-sm text-white/80">Gesamt Züge</div>
                    </div>
                    <div class="trio-stat-item">
                        <div class="text-xl font-bold text-blue-400">${exampleStats.currentDifficulty}</div>
                        <div class="text-sm text-white/80">Schwierigkeit</div>
                    </div>
                    <div class="trio-stat-item">
                        <div class="text-xl font-bold text-purple-400">${exampleStats.averageTime}</div>
                        <div class="text-sm text-white/80">Ø Zeit</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Update help modal content
     * @private
     */
    updateHelpModal(element) {
        // Help content would be static, so this might not need dynamic updates
        console.log('🪟 Help modal content loaded');
    }
    
    /**
     * Update settings modal content
     * @private
     */
    updateSettingsModal(element) {
        // Update settings controls to reflect current state
        const volumeSlider = element.querySelector('#volumeSlider');
        const soundToggle = element.querySelector('#soundToggle');
        const animationToggle = element.querySelector('#animationToggle');
        
        if (volumeSlider) {
            // Would connect to actual sound manager
            volumeSlider.value = 0.5; // Example value
        }
        
        if (soundToggle) {
            soundToggle.checked = true; // Example value
        }
        
        if (animationToggle) {
            animationToggle.checked = !this.reducedMotion; // Example value
        }
    }
    
    /**
     * Focus management for accessibility
     * @private
     */
    focusModal(element) {
        // Find first focusable element
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    /**
     * Restore focus to previous element
     * @private
     */
    restoreFocus() {
        // In a more complete implementation, we would track the previously focused element
        // For now, just ensure body has focus
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
    
    /**
     * Get list of registered modals
     */
    getModals() {
        return Array.from(this.modals.keys());
    }
    
    /**
     * Get active modal name
     */
    getActiveModal() {
        return this.activeModal;
    }
    
    /**
     * Set animation preferences
     */
    setAnimationsEnabled(enabled) {
        this.reducedMotion = !enabled;
        console.log(`🪟 Modal animations ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        // Close all modals
        this.closeAll();
        
        // Clear modal data
        this.modals.clear();
        this.activeModal = null;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        console.log('🪟 TrioModalManager destroyed');
    }
}

export default TrioModalManager;