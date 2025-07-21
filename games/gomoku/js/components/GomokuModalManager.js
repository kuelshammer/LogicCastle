/**
 * GomokuModalManager - Modal Dialog Management for Gomoku
 * 
 * Adapted from Connect4 ModalManager for Gomoku Tailwind CSS modals.
 * Handles help and assistance modal visibility with smooth animations.
 * 
 * Features:
 * - Smooth modal animations (scale + opacity)
 * - Backdrop click to close
 * - Escape key support
 * - Focus management and accessibility
 * - Reduced motion support
 */

export class GomokuModalManager {
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
        
        console.log('🪟 GomokuModalManager initialized');
    }
    
    /**
     * Initialize all modals in the DOM
     * @private
     */
    initializeModals() {
        const modalElements = document.querySelectorAll('[id$="Modal"]');
        
        modalElements.forEach(modal => {
            const modalId = modal.id.replace('Modal', '');
            this.registerModal(modalId, modal);
        });
    }
    
    /**
     * Register a modal for management
     */
    registerModal(name, element) {
        if (!element) {
            console.warn(`⚠️ Modal element not found: ${name}`);
            return;
        }
        
        // Store modal data
        this.modals.set(name, {
            element,
            name,
            isOpen: false
        });
        
        // Set up modal-specific event listeners
        this.setupModalListeners(name, element);
        
        console.log(`🪟 Registered modal: ${name}`);
    }
    
    /**
     * Set up event listeners for a specific modal
     * @private
     */
    setupModalListeners(name, element) {
        // Close buttons
        const closeButtons = element.querySelectorAll(`#close${name.charAt(0).toUpperCase() + name.slice(1)}Btn, #close${name.charAt(0).toUpperCase() + name.slice(1)}FooterBtn`);
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.close(name));
        });
        
        // Backdrop click to close
        element.addEventListener('click', (e) => {
            if (e.target === element) {
                this.close(name);
            }
        });
        
        // Prevent modal content clicks from closing modal
        const modalContent = element.querySelector('.glass');
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
    }
    
    /**
     * Open a modal
     */
    open(name) {
        if (this.isAnimating) return;
        
        const modalData = this.modals.get(name);
        if (!modalData) {
            console.warn(`⚠️ Modal not found: ${name}`);
            return;
        }
        
        // Close any open modal first
        if (this.activeModal && this.activeModal !== name) {
            this.close(this.activeModal);
        }
        
        const { element } = modalData;
        
        console.log(`🪟 Opening modal: ${name}`);
        
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
            const modalContent = element.querySelector('.glass');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }
        } else {
            // Animate in
            this.isAnimating = true;
            element.classList.add('opacity-100');
            
            const modalContent = element.querySelector('.glass');
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
        
        console.log(`🪟 Closing modal: ${name}`);
        
        if (this.reducedMotion) {
            // Skip animation for reduced motion
            element.classList.add('hidden');
            element.classList.remove('opacity-100');
            const modalContent = element.querySelector('.glass');
            if (modalContent) {
                modalContent.classList.remove('scale-100');
                modalContent.classList.add('scale-95');
            }
        } else {
            // Animate out
            this.isAnimating = true;
            element.classList.remove('opacity-100');
            
            const modalContent = element.querySelector('.glass');
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
     * Focus management for accessibility
     * @private
     */
    focusModal(element) {
        // Find first focusable element
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
     * Cleanup resources
     */
    destroy() {
        // Close all modals
        this.closeAll();
        
        // Remove global listeners
        // Note: In a real implementation, we would track and remove specific listeners
        
        // Clear modal data
        this.modals.clear();
        this.activeModal = null;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        console.log('🪟 GomokuModalManager destroyed');
    }
}

export default GomokuModalManager;