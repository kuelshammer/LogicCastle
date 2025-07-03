/**
 * ModalManager - Centralized modal system for all games
 * 
 * Eliminates duplicate modal handling code found in every game UI.
 * Provides consistent modal behavior, keyboard handling, and animations.
 * 
 * Features:
 * - Multiple modal types (help, error, custom)
 * - Keyboard shortcuts (F1, Escape, etc.)
 * - Click-outside-to-close behavior
 * - Modal stacking and z-index management
 * - Animation support
 */

export class ModalManager {
    constructor(config = {}) {
        this.config = this.mergeDefaultConfig(config);
        this.modals = new Map();
        this.activeModals = new Set();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Merge user config with defaults
     */
    mergeDefaultConfig(userConfig) {
        const defaultConfig = {
            // Default modal configurations
            help: {
                id: 'helpModal',
                closeKey: 'F1',
                closeOnEscape: true,
                closeOnOutsideClick: true
            },
            error: {
                id: 'errorModal',
                closeKey: null,
                closeOnEscape: true,
                closeOnOutsideClick: false
            }
        };

        // Merge with user config
        const merged = { ...defaultConfig };
        
        for (const [modalType, userModalConfig] of Object.entries(userConfig)) {
            if (merged[modalType]) {
                merged[modalType] = { ...merged[modalType], ...userModalConfig };
            } else {
                merged[modalType] = {
                    closeOnEscape: true,
                    closeOnOutsideClick: true,
                    ...userModalConfig
                };
            }
        }

        return merged;
    }

    /**
     * Initialize the modal manager
     */
    init() {
        if (this.isInitialized) {
            return;
        }

        this.registerModals();
        this.setupKeyboardHandling();
        this.isInitialized = true;
        
        console.log(`🪟 ModalManager initialized with ${this.modals.size} modals`);
    }

    /**
     * Register all configured modals
     */
    registerModals() {
        for (const [modalType, modalConfig] of Object.entries(this.config)) {
            this.registerModal(modalType, modalConfig);
        }
    }

    /**
     * Register a single modal
     * @param {string} modalType - The modal type identifier
     * @param {Object} config - Modal configuration
     */
    registerModal(modalType, config) {
        const element = document.getElementById(config.id);
        
        if (!element) {
            console.warn(`⚠️ Modal element not found: ${config.id}`);
            return false;
        }

        const modal = {
            element,
            config,
            isActive: false
        };

        this.modals.set(modalType, modal);
        this.setupModalEventListeners(modalType, modal);
        
        console.debug(`📋 Registered modal: ${modalType} (${config.id})`);
        return true;
    }

    /**
     * Setup event listeners for a modal
     */
    setupModalEventListeners(modalType, modal) {
        const { element, config } = modal;

        // Click outside to close
        if (config.closeOnOutsideClick) {
            element.addEventListener('click', (e) => {
                if (e.target === element) {
                    this.hide(modalType);
                }
            });
        }

        // Close button handling (look for data-modal-close attribute)
        const closeButtons = element.querySelectorAll('[data-modal-close]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.hide(modalType));
        });

        // Also look for standard close button IDs
        const standardCloseIds = [
            `close${modalType.charAt(0).toUpperCase() + modalType.slice(1)}Btn`,
            `${modalType}CloseBtn`,
            'closeBtn'
        ];

        standardCloseIds.forEach(closeId => {
            const closeBtn = element.querySelector(`#${closeId}`);
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hide(modalType));
            }
        });
    }

    /**
     * Setup global keyboard handling
     */
    setupKeyboardHandling() {
        document.addEventListener('keydown', (e) => {
            // Handle Escape key for all active modals
            if (e.key === 'Escape') {
                this.handleEscapeKey(e);
            }

            // Handle specific modal keyboard shortcuts
            this.handleModalShortcuts(e);
        });
    }

    /**
     * Handle Escape key press
     */
    handleEscapeKey(e) {
        // Close the topmost modal that allows escape closing
        const topModal = this.getTopmostModal();
        
        if (topModal && topModal.config.closeOnEscape) {
            e.preventDefault();
            this.hide(this.getModalType(topModal));
        }
    }

    /**
     * Handle modal-specific keyboard shortcuts
     */
    handleModalShortcuts(e) {
        for (const [modalType, modal] of this.modals) {
            if (modal.config.closeKey && e.key === modal.config.closeKey) {
                e.preventDefault();
                this.toggle(modalType);
                break;
            }
        }
    }

    /**
     * Show a modal
     * @param {string} modalType - The modal type to show
     * @param {Object} options - Display options
     */
    show(modalType, options = {}) {
        const modal = this.modals.get(modalType);
        
        if (!modal) {
            console.error(`❌ Modal not found: ${modalType}`);
            return false;
        }

        if (modal.isActive) {
            console.debug(`📋 Modal already active: ${modalType}`);
            return true;
        }

        // Set content if provided
        if (options.content) {
            this.setModalContent(modal, options.content);
        }

        // Show modal
        modal.element.classList.add('active');
        modal.isActive = true;
        this.activeModals.add(modalType);

        // Manage z-index for modal stacking
        this.updateModalZIndex(modal);

        // Focus management
        this.manageFocus(modal, 'show');

        console.debug(`📋 Showed modal: ${modalType}`);
        this.emitModalEvent('show', modalType, modal);
        
        return true;
    }

    /**
     * Hide a modal
     * @param {string} modalType - The modal type to hide
     */
    hide(modalType) {
        const modal = this.modals.get(modalType);
        
        if (!modal) {
            console.error(`❌ Modal not found: ${modalType}`);
            return false;
        }

        if (!modal.isActive) {
            console.debug(`📋 Modal already hidden: ${modalType}`);
            return true;
        }

        // Hide modal
        modal.element.classList.remove('active');
        modal.isActive = false;
        this.activeModals.delete(modalType);

        // Focus management
        this.manageFocus(modal, 'hide');

        console.debug(`📋 Hidden modal: ${modalType}`);
        this.emitModalEvent('hide', modalType, modal);
        
        return true;
    }

    /**
     * Toggle a modal's visibility
     * @param {string} modalType - The modal type to toggle
     * @param {Object} options - Display options for show
     */
    toggle(modalType, options = {}) {
        const modal = this.modals.get(modalType);
        
        if (!modal) {
            console.error(`❌ Modal not found: ${modalType}`);
            return false;
        }

        if (modal.isActive) {
            return this.hide(modalType);
        } else {
            return this.show(modalType, options);
        }
    }

    /**
     * Hide all active modals
     */
    hideAll() {
        const activeModalTypes = [...this.activeModals];
        let hiddenCount = 0;

        activeModalTypes.forEach(modalType => {
            if (this.hide(modalType)) {
                hiddenCount++;
            }
        });

        console.debug(`📋 Hidden ${hiddenCount} modals`);
        return hiddenCount;
    }

    /**
     * Check if a modal is currently active
     * @param {string} modalType - The modal type to check
     * @returns {boolean} True if modal is active
     */
    isActive(modalType) {
        const modal = this.modals.get(modalType);
        return modal ? modal.isActive : false;
    }

    /**
     * Get the currently active modals
     * @returns {string[]} Array of active modal types
     */
    getActiveModals() {
        return [...this.activeModals];
    }

    /**
     * Get the topmost (most recently shown) modal
     * @returns {Object|null} The topmost modal object
     */
    getTopmostModal() {
        if (this.activeModals.size === 0) {
            return null;
        }

        // Return the last modal that was activated
        const activeModalTypes = [...this.activeModals];
        const lastModalType = activeModalTypes[activeModalTypes.length - 1];
        return this.modals.get(lastModalType);
    }

    /**
     * Set modal content dynamically
     * @param {Object} modal - The modal object
     * @param {Object} content - Content to set
     */
    setModalContent(modal, content) {
        if (content.title) {
            const titleElement = modal.element.querySelector('.modal-title, h1, h2');
            if (titleElement) {
                titleElement.textContent = content.title;
            }
        }

        if (content.body) {
            const bodyElement = modal.element.querySelector('.modal-body, .modal-content');
            if (bodyElement) {
                if (typeof content.body === 'string') {
                    bodyElement.innerHTML = content.body;
                } else {
                    bodyElement.innerHTML = '';
                    bodyElement.appendChild(content.body);
                }
            }
        }
    }

    /**
     * Update modal z-index for proper stacking
     */
    updateModalZIndex(modal) {
        const baseZIndex = 1000;
        const zIndex = baseZIndex + this.activeModals.size;
        modal.element.style.zIndex = zIndex;
    }

    /**
     * Manage focus for accessibility
     */
    manageFocus(modal, action) {
        if (action === 'show') {
            // Store current focus
            modal.previousFocus = document.activeElement;
            
            // Focus first focusable element in modal
            const focusableElement = modal.element.querySelector(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElement) {
                setTimeout(() => focusableElement.focus(), 100);
            }
        } else if (action === 'hide') {
            // Restore previous focus
            if (modal.previousFocus && typeof modal.previousFocus.focus === 'function') {
                modal.previousFocus.focus();
            }
        }
    }

    /**
     * Get modal type from modal object
     */
    getModalType(modalObj) {
        for (const [type, modal] of this.modals) {
            if (modal === modalObj) {
                return type;
            }
        }
        return null;
    }

    /**
     * Emit modal events for external listeners
     */
    emitModalEvent(eventType, modalType, modal) {
        const event = new CustomEvent(`modal:${eventType}`, {
            detail: {
                modalType,
                element: modal.element,
                config: modal.config
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Show an error modal with specific content
     * @param {string} title - Error title
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     */
    showError(title, message, options = {}) {
        const errorContent = {
            title,
            body: `<p>${message}</p>`
        };

        return this.show('error', { content: errorContent, ...options });
    }

    /**
     * Show a confirmation modal
     * @param {string} title - Confirmation title
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Callback for confirm action
     * @param {Function} onCancel - Callback for cancel action
     */
    showConfirmation(title, message, onConfirm, onCancel) {
        const confirmContent = {
            title,
            body: `
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="confirm">Bestätigen</button>
                    <button class="btn btn-secondary" data-action="cancel">Abbrechen</button>
                </div>
            `
        };

        const result = this.show('confirmation', { content: confirmContent });
        
        if (result) {
            const modal = this.modals.get('confirmation');
            
            // Add action listeners
            const confirmBtn = modal.element.querySelector('[data-action="confirm"]');
            const cancelBtn = modal.element.querySelector('[data-action="cancel"]');
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.hide('confirmation');
                    if (onConfirm) onConfirm();
                }, { once: true });
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hide('confirmation');
                    if (onCancel) onCancel();
                }, { once: true });
            }
        }

        return result;
    }

    /**
     * Get debug information about modals
     */
    getDebugInfo() {
        const modalInfo = {};
        
        for (const [modalType, modal] of this.modals) {
            modalInfo[modalType] = {
                isActive: modal.isActive,
                elementId: modal.config.id,
                closeKey: modal.config.closeKey,
                closeOnEscape: modal.config.closeOnEscape,
                closeOnOutsideClick: modal.config.closeOnOutsideClick
            };
        }

        return {
            totalModals: this.modals.size,
            activeModals: [...this.activeModals],
            modalInfo,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Cleanup and destroy the modal manager
     */
    destroy() {
        this.hideAll();
        this.modals.clear();
        this.activeModals.clear();
        this.isInitialized = false;
        
        console.log('🗑️ ModalManager destroyed');
    }
}