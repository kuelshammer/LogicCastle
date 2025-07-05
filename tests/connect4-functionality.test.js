/**
 * Connect4 Functionality Test
 * 
 * Ensures Connect4 game remains functional after fixes.
 * Tests the ability to place discs and see colored pieces.
 */

const puppeteer = require('puppeteer');

describe('Connect4 Functionality Tests', () => {
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

    test('Connect4 - Basic Disc Placement Functionality', async () => {
        console.log('🔴 Testing Connect4 disc placement...');
        
        await page.goto('http://localhost:8000/games/connect4');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test placing a disc in column 0
        await page.click('.game-slot[data-col="0"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if a colored disc appeared
        const discResult = await page.evaluate(() => {
            const bottomLeftSlot = document.querySelector('.game-slot[data-row="5"][data-col="0"]');
            const disc = bottomLeftSlot ? bottomLeftSlot.querySelector('.disc') : null;
            
            return {
                slotExists: !!bottomLeftSlot,
                discExists: !!disc,
                discClasses: disc ? disc.className : 'none',
                isColored: disc && (disc.classList.contains('yellow') || disc.classList.contains('red')),
                isEmpty: disc && disc.classList.contains('empty')
            };
        });
        
        expect(discResult.slotExists).toBe(true);
        expect(discResult.discExists).toBe(true);
        expect(discResult.isColored).toBe(true);
        expect(discResult.isEmpty).toBe(false);
        
        console.log('✅ First disc placement: SUCCESS');
    });

    test('Connect4 - Multiple Disc Pattern Test', async () => {
        console.log('🎯 Testing xoxoxo pattern creation...');
        
        await page.goto('http://localhost:8000/games/connect4');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Create xoxoxo pattern: Yellow-Red-Yellow-Red-Yellow-Red
        const moves = [
            { col: 0, expectedColor: 'yellow', player: 'Player 1' },
            { col: 1, expectedColor: 'red', player: 'Player 2' },
            { col: 2, expectedColor: 'yellow', player: 'Player 1' },
            { col: 3, expectedColor: 'red', player: 'Player 2' },
            { col: 4, expectedColor: 'yellow', player: 'Player 1' },
            { col: 5, expectedColor: 'red', player: 'Player 2' }
        ];
        
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            await page.click(`.game-slot[data-col="${move.col}"]`);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify the disc color
            const discCheck = await page.evaluate((col, expectedColor) => {
                const bottomSlot = document.querySelector(`.game-slot[data-row="5"][data-col="${col}"]`);
                const disc = bottomSlot ? bottomSlot.querySelector('.disc') : null;
                
                return {
                    hasExpectedColor: disc && disc.classList.contains(expectedColor),
                    actualClasses: disc ? disc.className : 'none'
                };
            }, move.col, move.expectedColor);
            
            expect(discCheck.hasExpectedColor).toBe(true);
            console.log(`✅ Move ${i + 1}: ${move.player} placed ${move.expectedColor} disc in column ${move.col + 1}`);
        }
        
        // Verify pattern exists
        const patternResult = await page.evaluate(() => {
            const pattern = [];
            for (let col = 0; col < 6; col++) {
                const slot = document.querySelector(`.game-slot[data-row="5"][data-col="${col}"]`);
                const disc = slot ? slot.querySelector('.disc') : null;
                
                if (disc && disc.classList.contains('yellow')) {
                    pattern.push('Y');
                } else if (disc && disc.classList.contains('red')) {
                    pattern.push('R');
                } else {
                    pattern.push('E');
                }
            }
            return pattern.join('');
        });
        
        expect(pattern).toBe('YRYRYRET'); // Yellow-Red-Yellow-Red-Yellow-Red + Empty
        console.log(`🎉 Pattern created: ${patternResult}`);
        console.log('✅ xoxoxo pattern test: SUCCESS');
    });

    test('Connect4 - Game State Consistency', async () => {
        console.log('🎮 Testing game state consistency...');
        
        await page.goto('http://localhost:8000/games/connect4');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const gameState = await page.evaluate(() => {
            return {
                gameExists: !!window.game,
                uiExists: !!window.ui,
                gameInitialized: window.game ? window.game.isInitialized : false,
                boardExists: !!document.querySelector('.game-board'),
                slotsCount: document.querySelectorAll('.game-slot').length,
                discsCount: document.querySelectorAll('.disc').length
            };
        });
        
        expect(gameState.gameExists).toBe(true);
        expect(gameState.uiExists).toBe(true);
        expect(gameState.gameInitialized).toBe(true);
        expect(gameState.boardExists).toBe(true);
        expect(gameState.slotsCount).toBe(42); // 6x7 grid
        expect(gameState.discsCount).toBe(42); // Each slot has a disc
        
        console.log('✅ Game state consistency: VERIFIED');
    });

    test('Connect4 - Error Resilience', async () => {
        console.log('🛡️ Testing error resilience...');
        
        await page.goto('http://localhost:8000/games/connect4');
        await page.waitForSelector('.game-board', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test clicking multiple times rapidly
        for (let i = 0; i < 5; i++) {
            await page.click('.game-slot[data-col="0"]');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Verify game still works
        const resilience = await page.evaluate(() => {
            const slots = document.querySelectorAll('.game-slot[data-col="0"] .disc');
            let coloredDiscs = 0;
            
            slots.forEach(disc => {
                if (disc.classList.contains('yellow') || disc.classList.contains('red')) {
                    coloredDiscs++;
                }
            });
            
            return {
                gameStillWorks: !!window.game && window.game.isInitialized,
                hasColoredDiscs: coloredDiscs > 0,
                totalColoredDiscs: coloredDiscs
            };
        });
        
        expect(resilience.gameStillWorks).toBe(true);
        expect(resilience.hasColoredDiscs).toBe(true);
        expect(resilience.totalColoredDiscs).toBeGreaterThan(0);
        
        console.log(`✅ Error resilience: Game survived rapid clicking with ${resilience.totalColoredDiscs} discs placed`);
    });
});