document.addEventListener('DOMContentLoaded', function() {
  // Register Service Worker for PWA functionality
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ SW registered: ', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                if (confirm('Eine neue Version ist verfügbar. Jetzt aktualisieren?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.log('❌ SW registration failed: ', error);
        });
    });
  }

  // Handle click events with event delegation
  document.addEventListener('click', function(e) {
    const card = e.target.closest('.game-card');
    if (card) {
      const gameName = card.dataset.game;
      navigateToGame(gameName);
    }
  });

  // Handle Enter key on focused cards
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const card = e.target.closest('.game-card');
      if (card) {
        const gameName = card.dataset.game;
        navigateToGame(gameName);
      }
    }
  });

  // Handle keyboard navigation (1-3 keys)
  document.addEventListener('keydown', function(e) {
    const key = e.key;

    if (key >= '1' && key <= '3') {
      const cardIndex = parseInt(key) - 1;
      const gameCards = document.querySelectorAll('.game-card');
      const targetCard = gameCards[cardIndex];

      if (targetCard) {
        // Visual feedback
        targetCard.focus();
        targetCard.style.transform = 'scale(0.95)';

        setTimeout(() => {
          targetCard.style.transform = '';
          const gameName = targetCard.dataset.game;
          navigateToGame(gameName);
        }, 150);
      }
    }
  });

  // Navigation function
  function navigateToGame(gameName) {
    const gameUrls = {
      'connect4': 'games/connect4/index.html',
      'gomoku': 'games/gomoku/index.html',
      'trio': 'games/trio/index.html'
    };

    if (gameUrls[gameName]) {
      window.location.href = gameUrls[gameName];
    } else {
      alert(`Das Spiel "${gameName}" ist noch nicht verfügbar!`);
    }
  }

  // Add visual feedback for keyboard users
  let isKeyboardUser = false;

  document.addEventListener('keydown', function() {
    isKeyboardUser = true;
    document.body.classList.add('keyboard-user');
  });

  document.addEventListener('mousedown', function() {
    isKeyboardUser = false;
    document.body.classList.remove('keyboard-user');
  });
});
