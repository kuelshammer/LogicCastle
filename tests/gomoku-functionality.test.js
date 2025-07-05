/**
 * Gomoku Functionality Test
 * 
 * Ensures Gomoku game remains functional after UI-Module System migration.
 * Tests stone placement, visual effects, and game state management.
 */

const puppeteer = require('puppeteer');

describe('Gomoku Functionality Tests', () => {
    let browser;
    let page;
    
    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: true,
            devtools: false
        });
        page = await browser.newPage();
    }, 30000);
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('Gomoku - Basic Stone Placement Functionality', async () => {
        console.log('⚫ Testing Gomoku stone placement...');
        
        await page.goto('http://localhost:8000/games/gomoku');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test placing a stone at center intersection (7,7)
        await page.click('.intersection[data-row="7"][data-col="7"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if a stone appeared
        const stoneResult = await page.evaluate(() => {
            const centerIntersection = document.querySelector('.intersection[data-row="7"][data-col="7"]');
            const stone = centerIntersection ? centerIntersection.querySelector('.stone') : null;
            
            return {
                intersectionExists: !!centerIntersection,
                stoneExists: !!stone,
                stoneClasses: stone ? stone.className : 'none',
                hasColor: stone && (stone.classList.contains('black') || stone.classList.contains('red')),
                isEmpty: stone && stone.classList.contains('empty')
            };
        });
        
        expect(stoneResult.intersectionExists).toBe(true);
        expect(stoneResult.stoneExists).toBe(true);
        expect(stoneResult.hasColor).toBe(true);
        expect(stoneResult.isEmpty).toBe(false);
        
        console.log('✅ First stone placement: SUCCESS');
    });

    test('Gomoku - Stone Pattern Test', async () => {
        console.log('🎯 Testing stone pattern creation...');
        
        await page.goto('http://localhost:8000/games/gomoku');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Create diagonal pattern: Black-Red-Black-Red
        const moves = [
            { row: 7, col: 7, expectedColor: 'black', player: 'Player 1' },
            { row: 8, col: 8, expectedColor: 'red', player: 'Player 2' },
            { row: 9, col: 9, expectedColor: 'black', player: 'Player 1' },
            { row: 6, col: 6, expectedColor: 'red', player: 'Player 2' }
        ];
        
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            await page.click(`.intersection[data-row="${move.row}"][data-col="${move.col}"]`);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify the stone color
            const stoneCheck = await page.evaluate((row, col, expectedColor) => {
                const intersection = document.querySelector(`.intersection[data-row="${row}"][data-col="${col}"]`);
                const stone = intersection ? intersection.querySelector('.stone') : null;
                
                return {
                    hasExpectedColor: stone && stone.classList.contains(expectedColor),
                    actualClasses: stone ? stone.className : 'none',
                    hasGlow: stone && stone.classList.contains('glow')
                };
            }, move.row, move.col, move.expectedColor);
            
            expect(stoneCheck.hasExpectedColor).toBe(true);
            console.log(`✅ Move ${i + 1}: ${move.player} placed ${move.expectedColor} stone at (${move.row},${move.col})`);
        }
        
        console.log('✅ Stone pattern test: SUCCESS');
    });

    test('Gomoku - Visual Effects Test', async () => {
        console.log('✨ Testing visual effects...');
        
        await page.goto('http://localhost:8000/games/gomoku');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Place a stone and check for glow effect
        await page.click('.intersection[data-row="7"][data-col="7"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const effectsResult = await page.evaluate(() => {
            const stone = document.querySelector('.intersection[data-row="7"][data-col="7"] .stone');
            const styles = stone ? window.getComputedStyle(stone) : null;
            
            return {
                hasGlowClass: stone && stone.classList.contains('glow'),
                hasBoxShadow: styles && styles.boxShadow !== 'none',
                hasTransition: styles && styles.transition !== 'none'
            };
        });
        
        expect(effectsResult.hasGlowClass).toBe(true);
        console.log('✅ Visual effects: SUCCESS');
    });

    test('Gomoku - Game State Consistency', async () => {
        console.log('🎮 Testing game state consistency...');
        
        await page.goto('http://localhost:8000/games/gomoku');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const gameState = await page.evaluate(() => {
            return {
                gameExists: !!window.game,
                uiExists: !!window.ui,
                gameInitialized: window.game ? window.game.isInitialized : false,
                boardExists: !!document.querySelector('.game-board'),
                intersectionsCount: document.querySelectorAll('.intersection').length,
                stonesCount: document.querySelectorAll('.stone').length,
                uiModuleSystem: window.ui ? window.ui.constructor.name : 'none'
            };
        });
        
        expect(gameState.gameExists).toBe(true);
        expect(gameState.uiExists).toBe(true);
        expect(gameState.gameInitialized).toBe(true);
        expect(gameState.boardExists).toBe(true);
        expect(gameState.intersectionsCount).toBe(225); // 15x15 intersections
        expect(gameState.stonesCount).toBe(225); // Each intersection has a stone
        expect(gameState.uiModuleSystem).toBe('GomokuUINew');
        
        console.log('✅ Game state consistency: VERIFIED');
    });

    test('Gomoku - UI Module System Integration', async () => {
        console.log('🏗️ Testing UI Module System integration...');
        
        await page.goto('http://localhost:8000/games/gomoku');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const moduleIntegration = await page.evaluate(() => {
            const ui = window.ui;
            
            return {
                extendsBaseGameUI: ui && ui.constructor.name === 'GomokuUINew',
                hasModules: ui && ui.modules && ui.modules.size > 0,
                hasMessageSystem: ui && ui.getModule('messages') !== undefined,
                hasModalManager: ui && ui.getModule('modals') !== undefined,
                hasKeyboardController: ui && ui.getModule('keyboard') !== undefined,
                isInitialized: ui && ui.initialized === true
            };
        });
        
        expect(moduleIntegration.extendsBaseGameUI).toBe(true);
        expect(moduleIntegration.hasModules).toBe(true);
        expect(moduleIntegration.hasMessageSystem).toBe(true);
        expect(moduleIntegration.isInitialized).toBe(true);
        
        console.log('✅ UI Module System integration: VERIFIED');
    });

    test('Gomoku - Error Resilience', async () => {
        console.log('🛡️ Testing error resilience...');
        
        await page.goto('http://localhost:8000/games/gomoku');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test clicking same intersection multiple times
        for (let i = 0; i < 5; i++) {
            await page.click('.intersection[data-row="7"][data-col="7"]');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Verify game still works
        const resilience = await page.evaluate(() => {
            const intersections = document.querySelectorAll('.intersection .stone');
            let placedStones = 0;
            
            intersections.forEach(stone => {
                if (stone.classList.contains('black') || stone.classList.contains('red')) {
                    placedStones++;
                }
            });
            
            return {
                gameStillWorks: !!window.game && window.game.isInitialized,
                hasPlacedStones: placedStones > 0,
                totalPlacedStones: placedStones,
                uiStillResponsive: !!window.ui && window.ui.initialized
            };
        });
        
        expect(resilience.gameStillWorks).toBe(true);
        expect(resilience.hasPlacedStones).toBe(true);
        expect(resilience.totalPlacedStones).toBe(1); // Only one stone should be placed
        expect(resilience.uiStillResponsive).toBe(true);
        
        console.log(`✅ Error resilience: Game survived rapid clicking with ${resilience.totalPlacedStones} stone placed`);
    });
});