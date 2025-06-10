document.addEventListener('DOMContentLoaded', function() {
    const gameCards = document.querySelectorAll('.game-card');
    
    // Handle click events
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const gameName = this.dataset.game;
            navigateToGame(gameName);
        });
        
        // Handle Enter key on focused cards
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const gameName = this.dataset.game;
                navigateToGame(gameName);
            }
        });
    });
    
    // Handle keyboard navigation (1-3 keys)
    document.addEventListener('keydown', function(e) {
        const key = e.key;
        
        if (key >= '1' && key <= '3') {
            const cardIndex = parseInt(key) - 1;
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
            'gobang': 'games/gobang/index.html',
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