/**
 * L-Game Modal Manager - Premium Gaming UI Component
 * 
 * Handles all modal interactions for L-Game following Connect4 goldstandard pattern.
 * Supports victory modals, help system, settings, and error handling.
 * 
 * Features:
 * - L-Game purple theme integration
 * - Keyboard navigation (ESC to close)
 * - Mobile-responsive modal sizing
 * - WASM error handling
 * - Victory celebration with L-piece blockade detection
 * 
 * Part of 11-component architecture for LogicCastle Premium Gaming UI.
 * 
 * @version Premium Gaming UI v1.0 (L-Game Purple Theme)
 * @author LogicCastle Frontend Architect
 */

export class LGameModalManager {
  constructor() {
    this.modals = {};
    this.isInitialized = false;
    this.escapeHandlerBound = this.handleEscapeKey.bind(this);
    
    console.log('🎮 L-Game ModalManager: Premium Gaming UI component initialized');
  }

  /**
   * Initialize modal manager with all L-Game modals
   * Follows Connect4 pattern with L-Game specific modals
   */
  init() {
    if (this.isInitialized) {
      console.warn('⚠️ L-Game ModalManager already initialized');
      return;
    }

    try {
      // Register all L-Game modals
      this.registerModal('victory-modal', null, 'close-victory-btn');
      this.registerModal('error-modal', null, 'close-error-btn'); 
      this.registerModal('helpModal', 'help-btn', 'closeHelpBtn');
      this.registerModal('assistanceModal', 'assistance-btn', 'closeAssistanceBtn');
      this.registerModal('settingsModal', 'settings-btn', 'closeSettingsBtn');
      this.registerModal('rulesModal', 'rules-btn', 'closeRulesBtn');

      // Global keyboard handler for ESC key
      document.addEventListener('keydown', this.escapeHandlerBound);
      
      this.isInitialized = true;
      console.log('✅ L-Game ModalManager: All modals registered and initialized');
      
    } catch (error) {
      console.error('❌ L-Game ModalManager initialization failed:', error);
    }
  }

  /**
   * Register a modal with its trigger and close buttons
   * Enhanced from Connect4 pattern with L-Game error handling
   * 
   * @param {string} modalId - ID of the modal element
   * @param {string|null} openBtnId - ID of button to open modal (null for programmatic only)
   * @param {string|null} closeBtnId - ID of button to close modal
   */
  registerModal(modalId, openBtnId, closeBtnId) {
    const modal = document.getElementById(modalId);
    
    if (!modal) {
      console.warn(`⚠️ L-Game Modal '${modalId}' not found in DOM`);
      return;
    }

    const modalData = { modal };

    // Register open button if provided
    if (openBtnId) {
      const openBtn = document.getElementById(openBtnId);
      if (openBtn) {
        modalData.openBtn = openBtn;
        openBtn.addEventListener('click', () => this.showModal(modalId));
      } else {
        console.warn(`⚠️ L-Game Modal open button '${openBtnId}' not found`);
      }
    }

    // Register close button if provided
    if (closeBtnId) {
      const closeBtn = document.getElementById(closeBtnId);
      if (closeBtn) {
        modalData.closeBtn = closeBtn;
        closeBtn.addEventListener('click', () => this.hideModal(modalId));
      } else {
        console.warn(`⚠️ L-Game Modal close button '${closeBtnId}' not found`);
      }
    }

    // Also register footer close buttons (L-Game pattern)
    const footerCloseBtn = document.getElementById(`${closeBtnId}Footer`);
    if (footerCloseBtn) {
      footerCloseBtn.addEventListener('click', () => this.hideModal(modalId));
    }

    // Click outside to close (backdrop)
    modal.addEventListener('click', (e) => {
      if (e.target.id === modalId) {
        this.hideModal(modalId);
      }
    });

    this.modals[modalId] = modalData;
    console.log(`✅ L-Game Modal '${modalId}' registered successfully`);
  }

  /**
   * Show a modal with L-Game purple theme animations
   * Enhanced from Connect4 pattern with L-Game specific styling
   * 
   * @param {string} modalId - ID of modal to show
   */
  showModal(modalId) {
    const modalData = this.modals[modalId];
    if (!modalData) {
      console.error(`❌ L-Game Modal '${modalId}' not registered`);
      return;
    }

    const { modal } = modalData;
    
    // Show modal with purple theme styling
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Add purple theme animations if available
    if (modal.querySelector('.modal-content')) {
      modal.querySelector('.modal-content').style.animation = 'lgame-modal-scale-in 0.3s ease-out';
    }
    
    console.log(`🎮 L-Game Modal '${modalId}' shown with purple theme`);
  }

  /**
   * Hide a modal and restore normal page flow
   * Enhanced from Connect4 pattern with L-Game cleanup
   * 
   * @param {string} modalId - ID of modal to hide
   */
  hideModal(modalId) {
    const modalData = this.modals[modalId];
    if (!modalData) {
      console.error(`❌ L-Game Modal '${modalId}' not registered`);
      return;
    }

    const { modal } = modalData;
    
    // Hide modal
    modal.classList.add('hidden');
    modal.style.display = 'none';
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log(`🎮 L-Game Modal '${modalId}' hidden`);
  }

  /**
   * Toggle modal visibility
   * Direct from Connect4 pattern
   * 
   * @param {string} modalId - ID of modal to toggle
   */
  toggleModal(modalId) {
    const modalData = this.modals[modalId];
    if (!modalData) {
      console.error(`❌ L-Game Modal '${modalId}' not registered`);
      return;
    }

    const { modal } = modalData;
    if (modal.classList.contains('hidden')) {
      this.showModal(modalId);
    } else {
      this.hideModal(modalId);
    }
  }

  /**
   * Show victory modal with L-Game specific victory message
   * Enhanced from Connect4 pattern for L-piece blockade wins
   * 
   * @param {string} winner - 'Player 1' or 'Player 2'
   * @param {string} winType - 'blockade' for L-Game mobility wins
   */
  showVictoryModal(winner, winType = 'blockade') {
    const modal = document.getElementById('victory-modal');
    if (!modal) {
      console.error('❌ L-Game Victory modal not found');
      return;
    }

    // Update victory message with L-Game specific text
    const titleElement = modal.querySelector('#victory-title');
    const messageElement = modal.querySelector('#victory-message');
    
    if (titleElement) {
      titleElement.textContent = `${winner} Wins!`;
      titleElement.className = 'text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-600 mb-4';
    }
    
    if (messageElement) {
      const winMessages = {
        'blockade': `🎯 Perfect L-piece blockade! ${winner} has successfully trapped the opponent's L-piece.`,
        'mobility': `🚫 No valid moves remaining! ${winner} wins by eliminating opponent mobility.`,
        'default': `🏆 Strategic victory! ${winner} has outmaneuvered the opponent.`
      };
      
      messageElement.textContent = winMessages[winType] || winMessages['default'];
      messageElement.className = 'text-lg text-purple-200 text-center mb-6';
    }

    this.showModal('victory-modal');
    console.log(`🏆 L-Game Victory: ${winner} wins by ${winType}`);
  }

  /**
   * Show error modal with WASM loading or game errors
   * L-Game specific implementation for backend failures
   * 
   * @param {string} errorMessage - Error message to display
   * @param {string} errorType - Type of error ('wasm', 'game', 'network')
   */
  showErrorModal(errorMessage, errorType = 'game') {
    const modal = document.getElementById('error-modal');
    if (!modal) {
      console.error('❌ L-Game Error modal not found');
      return;
    }

    const messageElement = modal.querySelector('#error-message');
    if (messageElement) {
      const errorTitles = {
        'wasm': '🦀 WASM Loading Error',
        'game': '🎮 Game Error', 
        'network': '🌐 Network Error',
        'backend': '⚙️ Backend Error'
      };
      
      const title = errorTitles[errorType] || errorTitles['game'];
      messageElement.innerHTML = `
        <h3 class="text-xl font-bold text-red-400 mb-3">${title}</h3>
        <p class="text-purple-200">${errorMessage}</p>
        <p class="text-purple-300 text-sm mt-3">The game will continue with JavaScript fallback if available.</p>
      `;
    }

    this.showModal('error-modal');
    console.error(`❌ L-Game Error (${errorType}):`, errorMessage);
  }

  /**
   * Show help modal with L-Game rules and controls
   * L-Game specific help content
   */
  showHelpModal() {
    this.showModal('helpModal');
    console.log('📖 L-Game Help modal opened');
  }

  /**
   * Show assistance modal with move hints and strategy tips
   * L-Game specific assistance features
   */
  showAssistanceModal() {
    this.showModal('assistanceModal');
    console.log('💡 L-Game Assistance modal opened');
  }

  /**
   * Show settings modal for game preferences
   * L-Game specific settings (sound, animations, difficulty)
   */
  showSettingsModal() {
    this.showModal('settingsModal');
    console.log('⚙️ L-Game Settings modal opened');
  }

  /**
   * Handle ESC key to close any open modal
   * Enhanced from Connect4 pattern with L-Game modal detection
   * 
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleEscapeKey(event) {
    if (event.key === 'Escape') {
      // Find currently open modal
      const openModal = Object.keys(this.modals).find(modalId => {
        const modal = this.modals[modalId].modal;
        return modal && !modal.classList.contains('hidden') && modal.style.display !== 'none';
      });

      if (openModal) {
        this.hideModal(openModal);
        event.preventDefault();
        console.log(`⌨️ L-Game Modal '${openModal}' closed via ESC key`);
      }
    }
  }

  /**
   * Hide all open modals
   * L-Game utility method for cleanup
   */
  hideAllModals() {
    Object.keys(this.modals).forEach(modalId => {
      this.hideModal(modalId);
    });
    console.log('🧹 L-Game: All modals hidden');
  }

  /**
   * Check if any modal is currently open
   * L-Game utility method for state management
   * 
   * @returns {boolean} True if any modal is open
   */
  isAnyModalOpen() {
    return Object.keys(this.modals).some(modalId => {
      const modal = this.modals[modalId].modal;
      return modal && !modal.classList.contains('hidden') && modal.style.display !== 'none';
    });
  }

  /**
   * Cleanup and destroy modal manager
   * Enhanced from Connect4 pattern with L-Game specific cleanup
   */
  destroy() {
    // Remove global event listeners
    document.removeEventListener('keydown', this.escapeHandlerBound);
    
    // Clear all modal registrations
    this.modals = {};
    this.isInitialized = false;
    
    // Restore body scroll in case modal was open
    document.body.style.overflow = '';
    
    console.log('🧹 L-Game ModalManager destroyed and cleaned up');
  }
}

// Export for ES6 module compatibility
export default LGameModalManager;