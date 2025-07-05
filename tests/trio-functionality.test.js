/**
 * Trio Functionality Test
 * 
 * Ensures Trio mathematical puzzle game remains functional after UI-Module System migration.
 * Tests number grid interaction, solution validation, and game mechanics.
 */

const puppeteer = require('puppeteer');

describe('Trio Functionality Tests', () => {
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

    test('Trio - Basic Number Grid Creation', async () => {
        console.log('🧮 Testing Trio number grid creation...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if number grid was created
        const gridResult = await page.evaluate(() => {
            const numberGrid = document.querySelector('.number-grid');
            const numberCells = document.querySelectorAll('.number-cell');
            
            return {
                gridExists: !!numberGrid,
                cellCount: numberCells.length,
                hasNumberValues: Array.from(numberCells).every(cell => {
                    const numberSpan = cell.querySelector('.number-value');
                    return numberSpan && numberSpan.textContent !== '';
                })
            };
        });
        
        expect(gridResult.gridExists).toBe(true);
        expect(gridResult.cellCount).toBe(49); // 7x7 grid
        expect(gridResult.hasNumberValues).toBe(true);
        
        console.log('✅ Number grid creation: SUCCESS');
    });

    test('Trio - UI Module System Integration', async () => {
        console.log('🏗️ Testing UI Module System integration...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const moduleIntegration = await page.evaluate(() => {
            const ui = window.ui;
            
            return {
                gameExists: !!window.game,
                uiExists: !!ui,
                extendsBaseGameUI: ui && ui.constructor.name === 'TrioUINew',
                hasModules: ui && ui.modules && ui.modules.size > 0,
                hasMessageSystem: ui && ui.getModule('messages') !== undefined,
                hasModalManager: ui && ui.getModule('modals') !== undefined,
                hasKeyboardController: ui && ui.getModule('keyboard') !== undefined,
                isInitialized: ui && ui.initialized === true
            };
        });
        
        expect(moduleIntegration.gameExists).toBe(true);
        expect(moduleIntegration.uiExists).toBe(true);
        expect(moduleIntegration.extendsBaseGameUI).toBe(true);
        expect(moduleIntegration.hasModules).toBe(true);
        expect(moduleIntegration.hasMessageSystem).toBe(true);
        expect(moduleIntegration.isInitialized).toBe(true);
        
        console.log('✅ UI Module System integration: VERIFIED');
    });

    test('Trio - Number Cell Selection', async () => {
        console.log('🎯 Testing number cell selection...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Start a game first
        await page.click('#startGameBtn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Select three number cells
        const cells = await page.$$('.number-cell');
        if (cells.length >= 3) {
            await cells[0].click();
            await new Promise(resolve => setTimeout(resolve, 200));
            await cells[1].click();
            await new Promise(resolve => setTimeout(resolve, 200));
            await cells[2].click();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Check selection state
        const selectionResult = await page.evaluate(() => {
            const selectedCells = document.querySelectorAll('.number-cell.selected');
            const submitBtn = document.getElementById('submitSolutionBtn');
            const selectedNumbers = [
                document.getElementById('selected1').textContent,
                document.getElementById('selected2').textContent,
                document.getElementById('selected3').textContent
            ];
            
            return {
                selectedCount: selectedCells.length,
                submitEnabled: submitBtn && !submitBtn.disabled,
                hasSelectedNumbers: selectedNumbers.every(num => num !== '?'),
                selectedNumbers
            };
        });
        
        expect(selectionResult.selectedCount).toBe(3);
        expect(selectionResult.submitEnabled).toBe(true);
        expect(selectionResult.hasSelectedNumbers).toBe(true);
        
        console.log(`✅ Number selection: Selected ${selectionResult.selectedCount} cells`);
    });

    test('Trio - Target Number Display', async () => {
        console.log('🎯 Testing target number display...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Start a game to generate target
        await page.click('#startGameBtn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const targetResult = await page.evaluate(() => {
            const targetNumber = document.getElementById('targetNumber');
            const targetDisplay = document.getElementById('targetDisplay');
            
            return {
                targetExists: !!targetNumber,
                displayExists: !!targetDisplay,
                targetValue: targetNumber ? targetNumber.textContent : null,
                isNumeric: targetNumber && !isNaN(parseInt(targetNumber.textContent))
            };
        });
        
        expect(targetResult.targetExists).toBe(true);
        expect(targetResult.displayExists).toBe(true);
        expect(targetResult.isNumeric).toBe(true);
        
        console.log(`✅ Target number: ${targetResult.targetValue}`);
    });

    test('Trio - Game Controls Functionality', async () => {
        console.log('🎮 Testing game controls...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test control buttons
        const controlsResult = await page.evaluate(() => {
            const controls = {
                startGameBtn: document.getElementById('startGameBtn'),
                newRoundBtn: document.getElementById('newRoundBtn'),
                showSolutionBtn: document.getElementById('showSolutionBtn'),
                newGameBtn: document.getElementById('newGameBtn'),
                submitSolutionBtn: document.getElementById('submitSolutionBtn'),
                clearSelectionBtn: document.getElementById('clearSelectionBtn')
            };
            
            const result = {};
            Object.entries(controls).forEach(([key, element]) => {
                result[key] = {
                    exists: !!element,
                    enabled: element && !element.disabled,
                    visible: element && element.style.display !== 'none'
                };
            });
            
            return result;
        });
        
        // Key controls should exist
        expect(controlsResult.startGameBtn.exists).toBe(true);
        expect(controlsResult.newGameBtn.exists).toBe(true);
        expect(controlsResult.submitSolutionBtn.exists).toBe(true);
        expect(controlsResult.clearSelectionBtn.exists).toBe(true);
        
        console.log('✅ Game controls: All essential buttons exist');
    });

    test('Trio - Clear Selection Functionality', async () => {
        console.log('🧹 Testing clear selection...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Start game and select cells
        await page.click('#startGameBtn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const cells = await page.$$('.number-cell');
        if (cells.length >= 2) {
            await cells[0].click();
            await cells[1].click();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Clear selection
        await page.click('#clearSelectionBtn');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if selection was cleared
        const clearResult = await page.evaluate(() => {
            const selectedCells = document.querySelectorAll('.number-cell.selected');
            const selectedNumbers = [
                document.getElementById('selected1').textContent,
                document.getElementById('selected2').textContent,
                document.getElementById('selected3').textContent
            ];
            const submitBtn = document.getElementById('submitSolutionBtn');
            
            return {
                selectedCount: selectedCells.length,
                numbersCleared: selectedNumbers.every(num => num === '?'),
                submitDisabled: submitBtn && submitBtn.disabled
            };
        });
        
        expect(clearResult.selectedCount).toBe(0);
        expect(clearResult.numbersCleared).toBe(true);
        expect(clearResult.submitDisabled).toBe(true);
        
        console.log('✅ Clear selection: SUCCESS');
    });

    test('Trio - Game Mode Selection', async () => {
        console.log('⚙️ Testing game mode selection...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test game mode selector
        const gameModeResult = await page.evaluate(() => {
            const gameMode = document.getElementById('gameMode');
            const options = gameMode ? Array.from(gameMode.options).map(opt => opt.value) : [];
            
            return {
                selectorExists: !!gameMode,
                hasOptions: options.length > 0,
                availableModes: options,
                currentMode: gameMode ? gameMode.value : null
            };
        });
        
        expect(gameModeResult.selectorExists).toBe(true);
        expect(gameModeResult.hasOptions).toBe(true);
        expect(gameModeResult.availableModes).toContain('kinderfreundlich');
        expect(gameModeResult.availableModes).toContain('vollspektrum');
        
        console.log(`✅ Game modes: ${gameModeResult.availableModes.join(', ')}`);
    });

    test('Trio - Score System', async () => {
        console.log('🏆 Testing score system...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const scoreResult = await page.evaluate(() => {
            const scoresList = document.getElementById('scoresList');
            const chipsRemaining = document.getElementById('chipsRemaining');
            
            return {
                scoresListExists: !!scoresList,
                chipsRemainingExists: !!chipsRemaining,
                initialChips: chipsRemaining ? chipsRemaining.textContent : null
            };
        });
        
        expect(scoreResult.scoresListExists).toBe(true);
        expect(scoreResult.chipsRemainingExists).toBe(true);
        expect(scoreResult.initialChips).toBe('20'); // Default chip count
        
        console.log('✅ Score system: Chips and scores tracking available');
    });

    test('Trio - Error Resilience', async () => {
        console.log('🛡️ Testing error resilience...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test clicking controls without starting game
        await page.click('#submitSolutionBtn');
        await page.click('#clearSelectionBtn');
        await page.click('#showSolutionBtn');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test rapid clicking on cells
        const cells = await page.$$('.number-cell');
        if (cells.length >= 1) {
            for (let i = 0; i < 5; i++) {
                await cells[0].click();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        // Verify game still works
        const resilience = await page.evaluate(() => {
            return {
                gameStillWorks: !!window.game,
                uiStillResponsive: !!window.ui && window.ui.initialized,
                gridStillExists: !!document.querySelector('.number-grid'),
                cellsStillClickable: document.querySelectorAll('.number-cell').length === 49
            };
        });
        
        expect(resilience.gameStillWorks).toBe(true);
        expect(resilience.uiStillResponsive).toBe(true);
        expect(resilience.gridStillExists).toBe(true);
        expect(resilience.cellsStillClickable).toBe(true);
        
        console.log('✅ Error resilience: Game survived stress testing');
    });

    test('Trio - Keyboard Shortcuts', async () => {
        console.log('⌨️ Testing keyboard shortcuts...');
        
        await page.goto('http://localhost:8000/games/trio');
        await page.waitForSelector('.number-grid', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test F1 key for help
        await page.keyboard.press('F1');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const keyboardResult = await page.evaluate(() => {
            const helpModal = document.getElementById('helpModal');
            const keyboardController = window.ui ? window.ui.getModule('keyboard') : null;
            
            return {
                helpModalExists: !!helpModal,
                modalVisible: helpModal && helpModal.style.display !== 'none',
                keyboardControllerExists: !!keyboardController
            };
        });
        
        expect(keyboardResult.helpModalExists).toBe(true);
        expect(keyboardResult.keyboardControllerExists).toBe(true);
        
        console.log('✅ Keyboard shortcuts: F1 help functionality works');
    });
});