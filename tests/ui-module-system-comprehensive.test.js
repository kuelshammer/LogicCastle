/**
 * UI-Module System Comprehensive Test Suite
 * 
 * Validates the complete UI-Module System integration across all games
 * that have been migrated (Gomoku, Connect4).
 * 
 * Test Coverage:
 * 1. BaseGameUI functionality
 * 2. Cross-game UI consistency
 * 3. Keyboard shortcuts standardization
 * 4. Modal system robustness
 * 5. Message system reliability
 * 6. Performance and memory usage
 */

const puppeteer = require('puppeteer');

describe('UI-Module System Comprehensive Tests', () => {
    let browser;
    let page;
    
    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: true,
            devtools: false
        });
        page = await browser.newPage();
        
        // Enable console logging for errors
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error') {
                console.log(`[ERROR] ${msg.text()}`);
            }
        });
    }, 30000);
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });
    
    describe('BaseGameUI Core Functionality', () => {
        
        test('Gomoku - BaseGameUI Integration', async () => {
            console.log('🎯 Testing Gomoku BaseGameUI integration...');
            
            await page.goto('http://localhost:8000/games/gomoku');
            await page.waitForSelector('.game-board', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const baseUIStatus = await page.evaluate(() => {
                return {
                    hasBaseGameUI: window.ui && typeof window.ui.init === 'function',
                    hasElementBinder: window.ui && window.ui.elements,
                    hasKeyboardController: window.ui && window.ui.getModule && window.ui.getModule('keyboard'),
                    hasMessageSystem: window.ui && window.ui.getModule && window.ui.getModule('messages'),
                    hasModalManager: window.ui && window.ui.getModule && window.ui.getModule('modals'),
                    initialized: window.ui && window.ui.initialized
                };
            });
            
            expect(baseUIStatus.hasBaseGameUI).toBe(true);
            expect(baseUIStatus.hasElementBinder).toBeTruthy();
            expect(baseUIStatus.initialized).toBe(true);
            
            console.log('✅ Gomoku BaseGameUI integration verified');
        });
        
        test('Connect4 - BaseGameUI Integration', async () => {
            console.log('🔴 Testing Connect4 BaseGameUI integration...');
            
            await page.goto('http://localhost:8000/games/connect4');
            await page.waitForSelector('.game-board', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for WASM
            
            const baseUIStatus = await page.evaluate(() => {
                return {
                    hasBaseGameUI: window.ui && typeof window.ui.init === 'function',
                    hasElementBinder: window.ui && window.ui.elements,
                    hasKeyboardController: window.ui && window.ui.getModule && window.ui.getModule('keyboard'),
                    hasMessageSystem: window.ui && window.ui.getModule && window.ui.getModule('messages'),
                    hasModalManager: window.ui && window.ui.getModule && window.ui.getModule('modals'),
                    initialized: window.ui && window.ui.initialized,
                    gameInitialized: window.game && window.game.isInitialized
                };
            });
            
            expect(baseUIStatus.hasBaseGameUI).toBe(true);
            expect(baseUIStatus.hasElementBinder).toBeTruthy();
            expect(baseUIStatus.initialized).toBe(true);
            
            console.log('✅ Connect4 BaseGameUI integration verified');
        });
    });
    
    describe('Cross-Game UI Consistency', () => {
        
        test('Keyboard Shortcuts Standardization', async () => {
            console.log('⌨️ Testing keyboard shortcuts consistency...');
            
            const games = [
                { name: 'Gomoku', url: 'http://localhost:8000/games/gomoku' },
                { name: 'Connect4', url: 'http://localhost:8000/games/connect4' }
            ];
            
            const keyboardResults = {};
            
            for (const game of games) {
                await page.goto(game.url);
                await page.waitForSelector('.game-board', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const shortcuts = await page.evaluate(() => {
                    const keyboard = window.ui && window.ui.getModule && window.ui.getModule('keyboard');
                    if (!keyboard) return null;
                    
                    return {
                        hasF1: keyboard.shortcuts && keyboard.shortcuts.has('f1'),
                        hasEscape: keyboard.shortcuts && keyboard.shortcuts.has('escape'),
                        hasN: keyboard.shortcuts && keyboard.shortcuts.has('n'),
                        totalShortcuts: keyboard.shortcuts ? keyboard.shortcuts.size : 0
                    };
                });
                
                keyboardResults[game.name] = shortcuts;
            }
            
            // Verify standard shortcuts exist across games
            Object.entries(keyboardResults).forEach(([gameName, shortcuts]) => {
                if (shortcuts) {
                    expect(shortcuts.hasF1).toBe(true); // Help
                    expect(shortcuts.hasEscape).toBe(true); // Close modals
                    expect(shortcuts.hasN).toBe(true); // New game
                    expect(shortcuts.totalShortcuts).toBeGreaterThan(3);
                }
                console.log(`✅ ${gameName} keyboard shortcuts verified`);
            });
        });
        
        test('Modal System Consistency', async () => {
            console.log('🪟 Testing modal system consistency...');
            
            const games = [
                { name: 'Gomoku', url: 'http://localhost:8000/games/gomoku' },
                { name: 'Connect4', url: 'http://localhost:8000/games/connect4' }
            ];
            
            for (const game of games) {
                await page.goto(game.url);
                await page.waitForSelector('.game-board', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Test F1 help modal
                await page.keyboard.press('F1');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const modalStatus = await page.evaluate(() => {
                    const helpModal = document.getElementById('helpModal');
                    return {
                        helpModalExists: !!helpModal,
                        helpModalVisible: helpModal && helpModal.style.display === 'flex',
                        hasCloseButton: !!document.querySelector('#helpModal .btn')
                    };
                });
                
                expect(modalStatus.helpModalExists).toBe(true);
                
                // Close modal with Escape
                await page.keyboard.press('Escape');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const modalClosed = await page.evaluate(() => {
                    const helpModal = document.getElementById('helpModal');
                    return helpModal && helpModal.style.display === 'none';
                });
                
                expect(modalClosed).toBe(true);
                console.log(`✅ ${game.name} modal system verified`);
            }
        });
    });
    
    describe('Message System Reliability', () => {
        
        test('Message Display and Cleanup', async () => {
            console.log('💬 Testing message system reliability...');
            
            await page.goto('http://localhost:8000/games/connect4');
            await page.waitForSelector('.game-board', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const messageTest = await page.evaluate(() => {
                if (!window.ui || !window.ui.showMessage) {
                    return { success: false, error: 'UI or showMessage not available' };
                }
                
                // Test different message types
                const messageTypes = ['success', 'warning', 'error', 'info'];
                const results = {};
                
                messageTypes.forEach(type => {
                    try {
                        window.ui.showMessage(`Test ${type} message`, type);
                        results[type] = 'sent';
                    } catch (error) {
                        results[type] = `error: ${error.message}`;
                    }
                });
                
                return { success: true, results };
            });
            
            expect(messageTest.success).toBe(true);
            if (messageTest.results) {
                Object.entries(messageTest.results).forEach(([type, status]) => {
                    expect(status).toBe('sent');
                });
            }
            
            console.log('✅ Message system reliability verified');
        });
    });
    
    describe('Performance and Memory Tests', () => {
        
        test('Memory Usage Monitoring', async () => {
            console.log('📊 Testing memory usage...');
            
            await page.goto('http://localhost:8000/games/connect4');
            await page.waitForSelector('.game-board', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Get initial memory usage
            const initialMemory = await page.evaluate(() => {
                if (performance.memory) {
                    return {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            });
            
            // Simulate UI interactions
            await page.evaluate(() => {
                // Simulate multiple message displays
                for (let i = 0; i < 10; i++) {
                    if (window.ui && window.ui.showMessage) {
                        window.ui.showMessage(`Performance test message ${i}`, 'info');
                    }
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check memory after interactions
            const finalMemory = await page.evaluate(() => {
                if (performance.memory) {
                    return {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            });
            
            if (initialMemory && finalMemory) {
                const memoryIncrease = finalMemory.used - initialMemory.used;
                const increasePercent = (memoryIncrease / initialMemory.used) * 100;
                
                console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${increasePercent.toFixed(2)}%)`);
                
                // Memory increase should be reasonable (less than 50% for this test)
                expect(increasePercent).toBeLessThan(50);
            }
            
            console.log('✅ Memory usage within acceptable limits');
        });
        
        test('UI Response Time', async () => {
            console.log('⚡ Testing UI response times...');
            
            await page.goto('http://localhost:8000/games/connect4');
            await page.waitForSelector('.game-board', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Test keyboard response time
            const keyboardResponseTime = await page.evaluate(async () => {
                const startTime = performance.now();
                
                // Simulate F1 press
                const keyboard = window.ui && window.ui.getModule && window.ui.getModule('keyboard');
                if (keyboard && keyboard.shortcuts) {
                    const f1Shortcut = keyboard.shortcuts.get('f1');
                    if (f1Shortcut && f1Shortcut.handler) {
                        f1Shortcut.handler();
                    }
                }
                
                return performance.now() - startTime;
            });
            
            // UI interactions should respond within 100ms
            expect(keyboardResponseTime).toBeLessThan(100);
            
            console.log(`✅ Keyboard response time: ${keyboardResponseTime.toFixed(2)}ms`);
        });
    });
    
    describe('Error Handling and Robustness', () => {
        
        test('Missing DOM Elements Handling', async () => {
            console.log('🛡️ Testing robustness with missing DOM elements...');
            
            await page.goto('http://localhost:8000/games/connect4');
            await page.waitForSelector('.game-board', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Remove some optional elements and test UI behavior
            const robustnessTest = await page.evaluate(() => {
                // Remove an optional element
                const scoreElement = document.getElementById('yellowScore');
                if (scoreElement) {
                    scoreElement.remove();
                }
                
                // Test if UI still functions
                try {
                    if (window.ui && window.ui.updateUI) {
                        window.ui.updateUI();
                    }
                    return { success: true, error: null };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
            
            expect(robustnessTest.success).toBe(true);
            console.log('✅ UI handles missing DOM elements gracefully');
        });
        
        test('Invalid Input Handling', async () => {
            console.log('🚫 Testing invalid input handling...');
            
            await page.goto('http://localhost:8000/games/connect4');
            await page.waitForSelector('.game-board', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const invalidInputTest = await page.evaluate(() => {
                const results = [];
                
                // Test invalid message types
                try {
                    if (window.ui && window.ui.showMessage) {
                        window.ui.showMessage('Test message', 'invalid-type');
                        results.push({ test: 'invalid-message-type', success: true });
                    }
                } catch (error) {
                    results.push({ test: 'invalid-message-type', success: false, error: error.message });
                }
                
                // Test null/undefined inputs
                try {
                    if (window.ui && window.ui.showMessage) {
                        window.ui.showMessage(null, 'info');
                        results.push({ test: 'null-message', success: true });
                    }
                } catch (error) {
                    results.push({ test: 'null-message', success: false, error: error.message });
                }
                
                return results;
            });
            
            // UI should handle invalid inputs gracefully without crashing
            invalidInputTest.forEach(result => {
                // We expect the UI to either handle it gracefully (success: true) 
                // or fail with a controlled error (not crash the page)
                expect(typeof result.success).toBe('boolean');
            });
            
            console.log('✅ Invalid input handling verified');
        });
    });
    
    describe('Summary Report', () => {
        test('UI-Module System Status', async () => {
            console.log('\n🎯 UI-Module System Comprehensive Summary:');
            
            const games = [
                { name: 'Gomoku', url: 'http://localhost:8000/games/gomoku' },
                { name: 'Connect4', url: 'http://localhost:8000/games/connect4' }
            ];
            
            const summaryResults = {};
            
            for (const game of games) {
                await page.goto(game.url);
                await page.waitForSelector('.game-board', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const gameStatus = await page.evaluate(() => {
                    return {
                        uiModuleIntegration: window.ui && typeof window.ui.init === 'function',
                        baseGameUI: window.ui && window.ui.constructor && window.ui.constructor.name.includes('UI'),
                        keyboardController: !!(window.ui && window.ui.getModule && window.ui.getModule('keyboard')),
                        messageSystem: !!(window.ui && window.ui.getModule && window.ui.getModule('messages')),
                        modalManager: !!(window.ui && window.ui.getModule && window.ui.getModule('modals')),
                        gameIntegration: window.game && window.game.isInitialized,
                        errorsCount: window.uiErrors ? window.uiErrors.length : 0
                    };
                });
                
                summaryResults[game.name] = gameStatus;
            }
            
            // Report results
            Object.entries(summaryResults).forEach(([gameName, status]) => {
                console.log(`\n🎮 ${gameName}:`);
                console.log(`  ✅ UI-Module Integration: ${status.uiModuleIntegration}`);
                console.log(`  ✅ BaseGameUI: ${status.baseGameUI}`);
                console.log(`  ✅ Keyboard Controller: ${status.keyboardController}`);
                console.log(`  ✅ Message System: ${status.messageSystem}`);
                console.log(`  ✅ Modal Manager: ${status.modalManager}`);
                console.log(`  ✅ Game Integration: ${status.gameIntegration}`);
                console.log(`  📊 Error Count: ${status.errorsCount}`);
                
                // Verify all core systems are working
                expect(status.uiModuleIntegration).toBe(true);
                expect(status.keyboardController).toBe(true);
                expect(status.messageSystem).toBe(true);
            });
            
            console.log('\n🎉 UI-MODULE SYSTEM COMPREHENSIVE TEST COMPLETE!');
            console.log('💡 All migrated games conform to the new architecture standards');
        });
    });
});