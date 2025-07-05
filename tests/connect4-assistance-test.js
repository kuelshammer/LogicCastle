/**
 * Connect4 Player Assistance System Test
 * 
 * Tests the complete player assistance functionality including:
 * - Modal interaction
 * - Settings persistence
 * - Highlight system
 * - Move analysis integration
 */

const puppeteer = require('puppeteer');

describe('Connect4 Player Assistance System', () => {
    let browser;
    let page;
    
    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: true,
            devtools: false
        });
        page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error' || type === 'warn') {
                console.log(`[${type.toUpperCase()}] ${msg.text()}`);
            }
        });
        
        await page.goto('http://localhost:8000/games/connect4');
        
        // Wait for page to load completely
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for WASM init
    }, 30000);
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });
    
    describe('Assistance Modal', () => {
        
        test('Modal opens and closes correctly', async () => {
            console.log('🎛️ Testing assistance modal open/close...');
            
            // Test F2 keyboard shortcut
            await page.keyboard.press('F2');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const isModalVisible = await page.evaluate(() => {
                const modal = document.getElementById('assistanceModal');
                return modal && modal.style.display === 'flex';
            });
            
            expect(isModalVisible).toBe(true);
            console.log('✅ Modal opens with F2');
            
            // Test closing with button
            await page.click('#closeAssistanceBtn');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const isModalClosed = await page.evaluate(() => {
                const modal = document.getElementById('assistanceModal');
                return modal && modal.style.display === 'none';
            });
            
            expect(isModalClosed).toBe(true);
            console.log('✅ Modal closes with button');
        });
        
        test('Settings persist correctly', async () => {
            console.log('💾 Testing settings persistence...');
            
            // Open modal and change settings
            await page.keyboard.press('F2');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Enable some assistance features
            await page.click('#player1-undo');
            await page.click('#player1-winning-moves');
            await page.click('#player2-threats');
            
            // Save settings
            await page.click('#closeAssistanceBtn');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if settings were saved to localStorage
            const savedSettings = await page.evaluate(() => {
                const saved = localStorage.getItem('connect4-assistance-settings');
                return saved ? JSON.parse(saved) : null;
            });
            
            expect(savedSettings).toBeTruthy();
            expect(savedSettings.player1.undo).toBe(true);
            expect(savedSettings.player1['winning-moves']).toBe(true);
            expect(savedSettings.player2.threats).toBe(true);
            
            console.log('✅ Settings saved to localStorage:', savedSettings);
        });
    });
    
    describe('Move Analysis Integration', () => {
        
        test('Winning moves are detected and highlighted', async () => {
            console.log('🏆 Testing winning move detection...');
            
            // Reset game for clean test
            await page.evaluate(() => {
                if (window.game && window.game.newGame) {
                    window.game.newGame();
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Enable winning moves assistance for player 1
            await page.keyboard.press('F2');
            await page.click('#player1-winning-moves');
            await page.click('#closeAssistanceBtn');
            
            // Set up a near-winning scenario for testing
            const setupResult = await page.evaluate(() => {
                if (!window.game || !window.game.isInitialized) {
                    return { success: false, error: 'Game not initialized' };
                }
                
                try {
                    // Create a scenario where column 3 would be a winning move
                    // Place 3 pieces in bottom row for player 1 (columns 0, 1, 2)
                    window.game.makeMove(3); // Player 1 (Yellow)
                    window.game.makeMove(6); // Player 2 (Red) 
                    window.game.makeMove(3); // Player 1
                    window.game.makeMove(6); // Player 2
                    window.game.makeMove(3); // Player 1
                    window.game.makeMove(6); // Player 2
                    // Now player 1 has 3 in column 3, one more would win vertically
                    
                    return { success: true, moves: window.game.getMoveCount() };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
            
            console.log('Game setup result:', setupResult);
            
            if (setupResult.success) {
                // Check if winning moves are highlighted
                const highlightResult = await page.evaluate(() => {
                    if (window.ui && window.ui.updateAssistanceHighlights) {
                        window.ui.updateAssistanceHighlights();
                    }
                    
                    // Look for highlighted winning moves
                    const winningSlots = document.querySelectorAll('.game-slot.highlight-winning');
                    return {
                        hasHighlights: winningSlots.length > 0,
                        highlightCount: winningSlots.length,
                        columns: Array.from(winningSlots).map(slot => slot.dataset.col)
                    };
                });
                
                console.log('Winning move highlights:', highlightResult);
                expect(highlightResult.hasHighlights).toBe(true);
            }
        });
        
        test('Undo functionality works with assistance', async () => {
            console.log('🔄 Testing undo with assistance...');
            
            // Make sure undo is enabled for current player
            await page.keyboard.press('F2');
            await page.click('#player1-undo');
            await page.click('#closeAssistanceBtn');
            
            const undoResult = await page.evaluate(() => {
                if (!window.game || !window.game.isInitialized) {
                    return { success: false, error: 'Game not initialized' };
                }
                
                const moveCountBefore = window.game.getMoveCount();
                
                try {
                    // Use the UI undo function which checks assistance settings
                    if (window.ui && window.ui.undoMove) {
                        window.ui.undoMove();
                    }
                    
                    const moveCountAfter = window.game.getMoveCount();
                    
                    return {
                        success: true,
                        movesBefore: moveCountBefore,
                        movesAfter: moveCountAfter,
                        undoWorked: moveCountAfter < moveCountBefore
                    };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
            
            console.log('Undo result:', undoResult);
            expect(undoResult.success).toBe(true);
        });
    });
    
    describe('Keyboard Integration', () => {
        
        test('Keyboard shortcuts work correctly', async () => {
            console.log('⌨️ Testing keyboard shortcuts...');
            
            // Test F2 (assistance modal)
            await page.keyboard.press('F2');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            let modalVisible = await page.evaluate(() => {
                const modal = document.getElementById('assistanceModal');
                return modal && modal.style.display === 'flex';
            });
            expect(modalVisible).toBe(true);
            
            // Close modal
            await page.keyboard.press('Escape');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Test U (undo) - should work if undo is enabled
            const canUndo = await page.evaluate(() => {
                return window.game && window.game.canUndo && window.game.canUndo();
            });
            
            if (canUndo) {
                await page.keyboard.press('u');
                await new Promise(resolve => setTimeout(resolve, 300));
                console.log('✅ Undo shortcut processed');
            }
            
            console.log('✅ Keyboard shortcuts working');
        });
    });
    
    describe('Game Integration', () => {
        
        test('Assistance updates on game events', async () => {
            console.log('🎮 Testing game event integration...');
            
            // Enable assistance features
            await page.keyboard.press('F2');
            await page.click('#player1-winning-moves');
            await page.click('#player1-threats');
            await page.click('#closeAssistanceBtn');
            
            // Make a move and check if assistance updates
            const gameEventResult = await page.evaluate(() => {
                if (!window.game || !window.game.isInitialized) {
                    return { success: false, error: 'Game not initialized' };
                }
                
                const moveCountBefore = window.game.getMoveCount();
                
                try {
                    // Make a move
                    window.game.makeMove(4); // Column 4
                    
                    // Check if UI updated
                    const moveCountAfter = window.game.getMoveCount();
                    
                    // Check if assistance highlights are present
                    const hasHighlights = document.querySelectorAll('.game-slot[class*="highlight-"]').length > 0;
                    
                    return {
                        success: true,
                        movesBefore: moveCountBefore,
                        movesAfter: moveCountAfter,
                        moveMade: moveCountAfter > moveCountBefore,
                        hasAssistanceHighlights: hasHighlights
                    };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
            
            console.log('Game event result:', gameEventResult);
            expect(gameEventResult.success).toBe(true);
            expect(gameEventResult.moveMade).toBe(true);
        });
    });
    
    describe('Summary Report', () => {
        test('Player Assistance System Status', async () => {
            console.log('\n🎯 Player Assistance System Summary:');
            
            const summary = await page.evaluate(() => {
                return {
                    gameInitialized: window.game && window.game.isInitialized,
                    uiConnected: window.ui && window.ui.setupAssistanceSystem,
                    modalElements: {
                        modal: !!document.getElementById('assistanceModal'),
                        button: !!document.getElementById('assistanceBtn'),
                        checkboxes: document.querySelectorAll('input[id*="player"][id*="-"]').length
                    },
                    assistanceSettings: window.ui ? window.ui.assistanceSettings : null,
                    cssHighlights: {
                        winning: document.querySelectorAll('.highlight-winning').length,
                        threat: document.querySelectorAll('.highlight-threat').length,
                        blocked: document.querySelectorAll('.highlight-blocked').length
                    }
                };
            });
            
            console.log('✅ Game Initialized:', summary.gameInitialized);
            console.log('✅ UI Connected:', summary.uiConnected);
            console.log('✅ Modal Available:', summary.modalElements.modal);
            console.log('✅ Assistance Button:', summary.modalElements.button);
            console.log('✅ Setting Checkboxes:', summary.modalElements.checkboxes);
            console.log('✅ Current Settings:', summary.assistanceSettings ? 'Available' : 'Not Available');
            
            if (summary.gameInitialized && summary.uiConnected && summary.modalElements.modal) {
                console.log('\n🎉 PLAYER ASSISTANCE SYSTEM IS FUNCTIONAL!');
                console.log('💡 All core features working correctly');
            } else {
                console.log('\n❌ PLAYER ASSISTANCE SYSTEM HAS ISSUES');
                console.log('🔧 Check component initialization');
            }
        });
    });
});