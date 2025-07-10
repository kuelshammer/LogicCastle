/**
 * Debug Modal System for Connect4
 * Force modal visibility and diagnose issues
 */

function debugModalSystem() {
    console.log('🔍 DEBUGGING MODAL SYSTEM...');
    
    // Check if DOM elements exist
    const helpModal = document.getElementById('helpModal');
    const assistanceModal = document.getElementById('assistanceModal');
    const helpBtn = document.getElementById('helpBtn');
    const assistanceBtn = document.getElementById('assistanceBtn');
    
    console.log('📋 DOM Elements Check:', {
        helpModal: !!helpModal,
        assistanceModal: !!assistanceModal,
        helpBtn: !!helpBtn,
        assistanceBtn: !!assistanceBtn
    });
    
    if (helpModal) {
        console.log('📋 Help Modal Current Styles:', {
            display: helpModal.style.display,
            visibility: helpModal.style.visibility,
            opacity: helpModal.style.opacity,
            zIndex: helpModal.style.zIndex,
            position: helpModal.style.position,
            className: helpModal.className
        });
    }
    
    // Check if native modal system exists
    if (window.nativeModalSystem) {
        console.log('✅ Native Modal System found');
        const debugInfo = window.nativeModalSystem.getDebugInfo();
        console.log('📋 Native Modal Debug Info:', debugInfo);
    } else {
        console.log('❌ Native Modal System not found');
    }
    
    // Force show help modal with inline styles
    if (helpModal) {
        console.log('🔧 Force showing help modal...');
        helpModal.style.cssText = `
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
        const modalContent = helpModal.querySelector('.modal');
        if (modalContent) {
            modalContent.style.cssText = `
                background: white !important;
                padding: 2rem !important;
                border-radius: 12px !important;
                max-width: 600px !important;
                max-height: 80vh !important;
                overflow-y: auto !important;
                color: black !important;
            `;
        }
        
        helpModal.classList.remove('hidden');
        helpModal.classList.add('force-visible');
        
        console.log('✅ Help modal forced visible');
        return true;
    }
    
    return false;
}

// Force board rendering
function debugBoardRendering() {
    console.log('🔍 DEBUGGING BOARD RENDERING...');
    
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) {
        console.log('❌ Game board element not found');
        return false;
    }
    
    console.log('📋 Game Board Current State:', {
        innerHTML: gameBoard.innerHTML.substring(0, 200),
        childrenCount: gameBoard.children.length,
        className: gameBoard.className,
        style: gameBoard.style.cssText
    });
    
    // Check if BoardRenderer was called
    if (window.ui && window.ui.boardRenderer) {
        console.log('✅ BoardRenderer component found');
        console.log('📋 BoardRenderer State:', {
            initialized: window.ui.boardRenderer.isInitialized(),
            cells: window.ui.boardRenderer.cells.length,
            discs: window.ui.boardRenderer.discs.length
        });
    } else {
        console.log('❌ BoardRenderer component not found');
    }
    
    // Force create a simple board for testing
    if (gameBoard.children.length === 0) {
        console.log('🔧 Force creating simple board...');
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
        `;
        
        // Create 42 cells (6x7)
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.style.cssText = `
                background: #2196F3 !important;
                border-radius: 50% !important;
                border: 3px solid #1976D2 !important;
                aspect-ratio: 1 !important;
            `;
            gameBoard.appendChild(cell);
        }
        
        console.log('✅ Simple board created with 42 cells');
        return true;
    }
    
    return false;
}

// Make functions globally available
window.debugModalSystem = debugModalSystem;
window.debugBoardRendering = debugBoardRendering;

console.log('🛠️ Debug functions loaded: debugModalSystem(), debugBoardRendering()');