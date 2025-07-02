/**
 * Landing Page Controller - ES6 Module
 * Handles navigation, PWA functionality, and keyboard interactions
 */

class LandingPageController {
  constructor() {
    this.isKeyboardUser = false;
    this.init();
  }

  init() {
    this.setupServiceWorker();
    this.setupEventListeners();
    this.setupKeyboardAccessibility();
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ SW registered: ', registration);
            this.handleServiceWorkerUpdates(registration);
          })
          .catch((error) => {
            console.log('❌ SW registration failed: ', error);
          });
      });
    }
  }

  handleServiceWorkerUpdates(registration) {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          if (confirm('Eine neue Version ist verfügbar. Jetzt aktualisieren?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });
  }

  setupEventListeners() {
    // Handle click events with event delegation
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.game-card');
      if (card) {
        const gameName = card.dataset.game;
        this.navigateToGame(gameName);
      }
    });

    // Handle Enter key on focused cards
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = e.target.closest('.game-card');
        if (card) {
          const gameName = card.dataset.game;
          this.navigateToGame(gameName);
        }
      }
    });

    // Handle keyboard navigation (1-3 keys)
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key >= '1' && key <= '3') {
        this.handleKeyboardNavigation(parseInt(key) - 1);
      }
    });
  }

  setupKeyboardAccessibility() {
    document.addEventListener('keydown', () => {
      this.isKeyboardUser = true;
      document.body.classList.add('keyboard-user');
    });

    document.addEventListener('mousedown', () => {
      this.isKeyboardUser = false;
      document.body.classList.remove('keyboard-user');
    });
  }

  handleKeyboardNavigation(cardIndex) {
    const gameCards = document.querySelectorAll('.game-card');
    const targetCard = gameCards[cardIndex];

    if (targetCard) {
      targetCard.focus();
      targetCard.style.transform = 'scale(0.95)';

      setTimeout(() => {
        targetCard.style.transform = '';
        const gameName = targetCard.dataset.game;
        this.navigateToGame(gameName);
      }, 150);
    }
  }

  navigateToGame(gameName) {
    const cacheBuster = '?v=method_fix_' + Date.now();
    const gameUrls = {
      'connect4': 'games/connect4/index.html' + cacheBuster,
      'gomoku': 'games/gomoku/index.html' + cacheBuster,
      'trio': 'games/trio/index.html' + cacheBuster
    };

    if (gameUrls[gameName]) {
      window.location.href = gameUrls[gameName];
    } else {
      alert(`Das Spiel "${gameName}" ist noch nicht verfügbar!`);
    }
  }
}

// Initialize landing page controller when DOM is ready
export function initLandingPage() {
  new LandingPageController();
}

// Auto-initialize if this module is imported
document.addEventListener('DOMContentLoaded', initLandingPage);