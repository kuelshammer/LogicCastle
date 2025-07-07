/**
 * Native Modal System - Complete Rebuild 
 * 
 * Zero Dependencies Solution for Modal Display Issues
 * Completely isolated from UI-Module System to avoid conflicts
 * 
 * Features:
 * - Pure JavaScript (no external dependencies)
 * - Inline styles for guaranteed visibility  
 * - F1/F2 keyboard shortcuts
 * - Escape key + click-outside closing
 * - Body scroll lock
 * - Debug logging for troubleshooting
 * 
 * Created: 2025-07-07
 * Purpose: Fix invisible modal bug that affects Help & Assistance overlays
 */

export class NativeModalSystem {
    constructor() {
        this.activeModal = null;
        this.originalBodyOverflow = '';
        this.debugEnabled = true;
        
        // Initialize immediately
        this.init();
    }
    
    /**
     * Initialize the modal system
     */
    init() {
        this.log('🚀 Initializing Native Modal System...');
        
        // Setup all event handlers
        this.setupKeyboardHandlers();
        this.setupButtonHandlers(); 
        this.setupOverlayHandlers();
        
        // Verify modal elements exist
        this.verifyModalElements();
        
        this.log('✅ Native Modal System initialized successfully');
    }
    
    /**
     * Debug logging
     */
    log(message, data = null) {
        if (this.debugEnabled) {
            console.log(`[NativeModal] ${message}`, data || '');
        }
    }
    
    /**
     * Verify modal elements exist in DOM
     */
    verifyModalElements() {
        const helpModal = document.getElementById('helpModal');
        const assistanceModal = document.getElementById('assistanceModal');
        
        this.log('🔍 Modal Elements Check:', {
            helpModal: !!helpModal,
            assistanceModal: !!assistanceModal,
            helpModalClasses: helpModal?.className || 'not found',
            assistanceModalClasses: assistanceModal?.className || 'not found'
        });
        
        if (!helpModal || !assistanceModal) {
            console.warn('⚠️ Modal elements missing from DOM!');
        }
    }
    
    /**
     * Show modal with guaranteed visibility using inline styles
     */
    showModal(modalId) {
        this.log(`📂 Attempting to show modal: ${modalId}`);
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            this.log(`❌ Modal not found: ${modalId}`);
            return false;
        }
        
        // Hide any currently active modal
        if (this.activeModal && this.activeModal !== modal) {
            this.hideModal(this.activeModal.id);
        }
        
        // Apply inline styles for GUARANTEED visibility
        // Using maximum specificity and !important equivalents via inline styles
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(0, 0, 0, 0.7) !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
        `;
        
        // Style the modal content for visibility
        const modalContent = modal.querySelector('.modal');
        if (modalContent) {
            modalContent.style.cssText = `
                background: white !important;
                border-radius: 12px !important;
                padding: 2rem !important;
                max-width: 600px !important;
                max-height: 80vh !important;
                overflow-y: auto !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                position: relative !important;
                z-index: 10000 !important;
                transform: scale(1) !important;
                margin: 1rem !important;
            `;
        }
        
        // Remove hidden class and add active class
        modal.classList.remove('hidden');
        modal.classList.add('active', 'native-modal-active');
        
        // Lock body scroll
        this.lockBodyScroll();
        
        // Set as active modal
        this.activeModal = modal;
        
        this.log(`✅ Modal displayed: ${modalId}`, {
            visible: modal.style.visibility,
            opacity: modal.style.opacity,
            zIndex: modal.style.zIndex,
            display: modal.style.display
        });
        
        return true;
    }
    
    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        
        if (!modal) {
            this.log(`❌ Cannot hide modal - not found: ${modalId}`);
            return false;
        }
        
        this.log(`📁 Hiding modal: ${modal.id || 'unknown'}`);
        
        // Hide with inline styles
        modal.style.cssText = `
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            display: none !important;
        `;
        
        // Add hidden class and remove active classes
        modal.classList.add('hidden');
        modal.classList.remove('active', 'native-modal-active');
        
        // Unlock body scroll
        this.unlockBodyScroll();
        
        // Clear active modal
        if (this.activeModal === modal) {
            this.activeModal = null;
        }
        
        this.log(`✅ Modal hidden: ${modal.id || 'unknown'}`);
        return true;
    }
    
    /**
     * Lock body scroll when modal is open
     */
    lockBodyScroll() {
        this.originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        this.log('🔒 Body scroll locked');
    }
    
    /**
     * Unlock body scroll when modal is closed
     */
    unlockBodyScroll() {
        document.body.style.overflow = this.originalBodyOverflow;
        this.log('🔓 Body scroll unlocked');
    }
    
    /**
     * Setup keyboard event handlers
     */
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'F1':
                    e.preventDefault();
                    this.log('⌨️ F1 pressed - toggling help modal');
                    this.toggleModal('helpModal');
                    break;
                    
                case 'F2':
                    e.preventDefault();
                    this.log('⌨️ F2 pressed - toggling assistance modal');
                    this.toggleModal('assistanceModal');
                    break;
                    
                case 'Escape':
                    if (this.activeModal) {
                        e.preventDefault();
                        this.log('⌨️ Escape pressed - closing active modal');
                        this.hideModal(this.activeModal);
                    }
                    break;
            }
        });
        
        this.log('⌨️ Keyboard handlers registered (F1, F2, Escape)');
    }
    
    /**
     * Setup button event handlers
     */
    setupButtonHandlers() {
        // Help button
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.log('🔘 Help button clicked');
                this.showModal('helpModal');
            });
            this.log('🔘 Help button handler registered');
        }
        
        // Assistance button  
        const assistanceBtn = document.getElementById('assistanceBtn');
        if (assistanceBtn) {
            assistanceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.log('🔘 Assistance button clicked');
                this.showModal('assistanceModal');
            });
            this.log('🔘 Assistance button handler registered');
        }
        
        // Close buttons
        const closeHelpBtn = document.getElementById('closeHelpBtn');
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.log('🔘 Close Help button clicked');
                this.hideModal('helpModal');
            });
            this.log('🔘 Close Help button handler registered');
        }
        
        const closeAssistanceBtn = document.getElementById('closeAssistanceBtn');
        if (closeAssistanceBtn) {
            closeAssistanceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.log('🔘 Close Assistance button clicked');
                this.hideModal('assistanceModal');
            });
            this.log('🔘 Close Assistance button handler registered');
        }
    }
    
    /**
     * Setup overlay click-outside handlers
     */
    setupOverlayHandlers() {
        const helpModal = document.getElementById('helpModal');
        const assistanceModal = document.getElementById('assistanceModal');
        
        [helpModal, assistanceModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    // Only close if clicking the overlay (not the content)
                    if (e.target === modal) {
                        this.log('🖱️ Click outside modal content - closing');
                        this.hideModal(modal);
                    }
                });
            }
        });
        
        this.log('🖱️ Click-outside handlers registered');
    }
    
    /**
     * Toggle modal (show if hidden, hide if shown)
     */
    toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            this.log(`❌ Cannot toggle modal - not found: ${modalId}`);
            return false;
        }
        
        const isActive = this.activeModal === modal;
        
        if (isActive) {
            this.hideModal(modalId);
        } else {
            this.showModal(modalId);
        }
        
        return true;
    }
    
    /**
     * Check if a modal is currently active
     */
    isModalActive(modalId) {
        if (!modalId && this.activeModal) {
            return this.activeModal.id;
        }
        
        const modal = document.getElementById(modalId);
        return this.activeModal === modal;
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            activeModal: this.activeModal?.id || null,
            bodyOverflow: document.body.style.overflow,
            helpModalExists: !!document.getElementById('helpModal'),
            assistanceModalExists: !!document.getElementById('assistanceModal'),
            helpBtnExists: !!document.getElementById('helpBtn'),
            assistanceBtnExists: !!document.getElementById('assistanceBtn')
        };
    }
}

// Auto-initialize global instance for immediate use
window.nativeModalSystem = new NativeModalSystem();

console.log('🎨 Native Modal System loaded and initialized');