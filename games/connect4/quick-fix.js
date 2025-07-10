/**
 * QUICK FIX for Connect4 Modal and Board Issues
 * Simple, direct implementation without complex module system
 */

console.log('🚀 QUICK FIX loading...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 QUICK FIX: DOM ready, applying fixes...');
    
    // Fix 1: Direct Modal System
    setTimeout(() => {
        setupModalFix();
    }, 500);
    
    // Fix 2: Direct Board Rendering 
    setTimeout(() => {
        setupBoardFix();
    }, 1000);
});

function setupModalFix() {
    console.log('🔧 Setting up Modal Fix...');
    
    const showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Force visibility
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
                background: rgba(0, 0, 0, 0.8) !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
            
            // Style modal content
            const modalContent = modal.querySelector('.modal');
            if (modalContent) {
                modalContent.style.cssText = `
                    background: white !important;
                    padding: 2rem !important;
                    border-radius: 12px !important;
                    max-width: 600px !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                    color: black !important;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                `;
            }
            
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            console.log(`✅ Modal shown: ${modalId}`);
        }
    };
    
    const hideModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            console.log(`✅ Modal hidden: ${modalId}`);
        }
    };
    
    // Setup event handlers
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('helpModal');
        });
        console.log('✅ Help button handler added');
    }
    
    const assistanceBtn = document.getElementById('assistanceBtn');
    if (assistanceBtn) {
        assistanceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('assistanceModal');
        });
        console.log('✅ Assistance button handler added');
    }
    
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal('helpModal');
        });
        console.log('✅ Close help button handler added');
    }
    
    const closeAssistanceBtn = document.getElementById('closeAssistanceBtn');
    if (closeAssistanceBtn) {
        closeAssistanceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal('assistanceModal');
        });
        console.log('✅ Close assistance button handler added');
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            showModal('helpModal');
        } else if (e.key === 'F2') {
            e.preventDefault();
            showModal('assistanceModal');
        } else if (e.key === 'Escape') {
            hideModal('helpModal');
            hideModal('assistanceModal');
        }
    });
    
    console.log('✅ Modal Fix complete');
    
    // Make functions global for testing
    window.showModal = showModal;
    window.hideModal = hideModal;
}

function setupBoardFix() {
    console.log('🔧 Setting up Board Fix...');
    
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) {
        console.error('❌ Game board not found');
        return;
    }
    
    // Only fix if board is empty or just a blue square
    if (gameBoard.children.length <= 1) {
        console.log('🎯 Fixing empty board...');
        
        // Apply board styles
        gameBoard.style.cssText = `
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            grid-template-rows: repeat(6, 1fr) !important;
            gap: 8px !important;
            background: #1976d2 !important;
            border-radius: 16px !important;
            padding: 20px !important;
            width: 100% !important;
            aspect-ratio: 7/6 !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.2) !important;
            max-width: min(80vw, calc(70vh * 7 / 6)) !important;
            max-height: min(70vh, calc(80vw * 6 / 7)) !important;
        `;
        
        // Clear and create 42 cells (6x7)
        gameBoard.innerHTML = '';
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell game-slot';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.index = row * 7 + col;
                
                cell.style.cssText = `
                    background: #2196F3 !important;
                    border-radius: 50% !important;
                    border: 3px solid #1976D2 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    position: relative !important;
                    cursor: pointer !important;
                    aspect-ratio: 1 !important;
                `;
                
                // Add disc placeholder
                const disc = document.createElement('div');
                disc.className = 'disc empty';
                disc.style.cssText = `
                    width: 85% !important;
                    height: 85% !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                    position: relative !important;
                    aspect-ratio: 1 !important;
                    z-index: 1 !important;
                    background: transparent !important;
                `;
                
                cell.appendChild(disc);
                gameBoard.appendChild(cell);
                
                // Add click handler
                cell.addEventListener('click', () => {
                    console.log(`🎯 Cell clicked: row ${row}, col ${col}`);
                    // Demo: place a disc
                    const disc = cell.querySelector('.disc');
                    if (disc && disc.classList.contains('empty')) {
                        disc.classList.remove('empty');
                        disc.classList.add('yellow');
                        disc.style.cssText += `
                            background: #FFD700 !important;
                            border: 3px solid #FFA000 !important;
                            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.6) !important;
                        `;
                    }
                });
            }
        }
        
        console.log('✅ Board Fix complete - 42 cells created');
    } else {
        console.log('✅ Board already has content, skipping fix');
    }
}

console.log('✅ QUICK FIX loaded');