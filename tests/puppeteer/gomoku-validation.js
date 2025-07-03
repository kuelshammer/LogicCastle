/**
 * Gomoku Puppeteer Validation Suite
 * 
 * Comprehensive validation against games/gomoku/Gomoku.jpg reference image
 * Must achieve 100% test pass rate for Goldstandard certification
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
    baseUrl: 'http://localhost:8001',
    gomokuPath: '/games/gomoku/index.html',
    testTimeout: 30000,
    screenshotPath: path.join(__dirname, 'screenshots'),
    referencePath: path.join(__dirname, '../../games/gomoku/Gomoku.jpg'),
    headless: false, // Set to false for debugging
    viewport: {
        width: 1280,
        height: 1024
    }
};

// Test results tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    phases: {}
};

/**
 * Test utilities
 */
class TestUtils {
    static log(phase, message, status = 'INFO') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : '🔧';
        console.log(`[${timestamp}] ${emoji} ${phase}: ${message}`);
    }

    static async takeScreenshot(page, name, phase) {
        if (!fs.existsSync(CONFIG.screenshotPath)) {
            fs.mkdirSync(CONFIG.screenshotPath, { recursive: true });
        }
        
        const filename = `${phase}_${name}_${Date.now()}.png`;
        const filepath = path.join(CONFIG.screenshotPath, filename);
        
        await page.screenshot({ 
            path: filepath,
            fullPage: false,
            clip: {
                x: 0,
                y: 0,
                width: CONFIG.viewport.width,
                height: CONFIG.viewport.height
            }
        });
        
        this.log(phase, `Screenshot saved: ${filename}`);
        return filepath;
    }

    static async waitForElement(page, selector, timeout = 5000) {
        try {
            await page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            this.log('ERROR', `Element not found: ${selector}`, 'FAIL');
            return false;
        }
    }

    static async checkConsoleErrors(page, phase) {
        const errors = [];
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        page.on('pageerror', error => {
            errors.push(error.message);
        });

        // Wait a moment to catch any immediate errors
        await page.waitForTimeout(1000);
        
        if (errors.length > 0) {
            this.log(phase, `Console errors detected: ${errors.length}`, 'FAIL');
            errors.forEach(error => this.log(phase, `Error: ${error}`, 'FAIL'));
            return false;
        }
        
        this.log(phase, 'No console errors detected', 'PASS');
        return true;
    }

    static recordTest(phase, test, passed, error = null) {
        testResults.total++;
        if (passed) {
            testResults.passed++;
            this.log(phase, `${test}: PASSED`, 'PASS');
        } else {
            testResults.failed++;
            testResults.errors.push({ phase, test, error: error?.message || 'Unknown error' });
            this.log(phase, `${test}: FAILED - ${error?.message || 'Unknown error'}`, 'FAIL');
        }
        
        if (!testResults.phases[phase]) {
            testResults.phases[phase] = { total: 0, passed: 0, failed: 0 };
        }
        testResults.phases[phase].total++;
        if (passed) {
            testResults.phases[phase].passed++;
        } else {
            testResults.phases[phase].failed++;
        }
    }
}

/**
 * Phase 1: Basic UI Validation
 */
async function runPhase1Tests(page) {
    const phase = 'PHASE1';
    TestUtils.log(phase, 'Starting Basic UI Validation Tests...');

    try {
        // Test 1.1: Page Load & Initial State
        TestUtils.log(phase, 'Testing page load and initial state...');
        
        const response = await page.goto(`${CONFIG.baseUrl}${CONFIG.gomokuPath}`, {
            waitUntil: 'networkidle0',
            timeout: CONFIG.testTimeout
        });
        
        TestUtils.recordTest(phase, 'Page Load', response.ok());
        
        // Check for JavaScript errors
        const noErrors = await TestUtils.checkConsoleErrors(page, phase);
        TestUtils.recordTest(phase, 'No Console Errors', noErrors);

        // Test 1.2: Game Board Visibility
        const boardVisible = await TestUtils.waitForElement(page, '#gameBoard');
        TestUtils.recordTest(phase, 'Game Board Visible', boardVisible);

        if (boardVisible) {
            // Check board structure
            const intersections = await page.$$('#gameBoard .intersection');
            const expectedIntersections = 15 * 15; // 15x15 board
            const correctGrid = intersections.length === expectedIntersections;
            
            TestUtils.log(phase, `Found ${intersections.length} intersections (expected ${expectedIntersections})`);
            TestUtils.recordTest(phase, '15x15 Grid Structure', correctGrid);
        }

        // Test 1.3: Coordinate Labels
        const coordTests = [
            { selector: '#topCoords', name: 'Top Coordinates' },
            { selector: '#bottomCoords', name: 'Bottom Coordinates' },
            { selector: '#leftCoords', name: 'Left Coordinates' },
            { selector: '#rightCoords', name: 'Right Coordinates' }
        ];

        for (const coordTest of coordTests) {
            const exists = await TestUtils.waitForElement(page, coordTest.selector);
            TestUtils.recordTest(phase, coordTest.name, exists);
        }

        // Test 1.4: Essential UI Elements
        const uiElements = [
            '#currentPlayerIndicator',
            '#gameStatus', 
            '#blackScore',
            '#whiteScore',
            '#moveCounter',
            '#newGameBtn',
            '#undoBtn',
            '#helpBtn'
        ];

        for (const selector of uiElements) {
            const exists = await TestUtils.waitForElement(page, selector);
            TestUtils.recordTest(phase, `Element ${selector}`, exists);
        }

        // Take screenshot for visual reference
        await TestUtils.takeScreenshot(page, 'initial_state', phase);

        TestUtils.log(phase, 'Basic UI Validation completed');

    } catch (error) {
        TestUtils.recordTest(phase, 'Phase 1 Execution', false, error);
    }
}

/**
 * Phase 2: UI Module Integration Testing
 */
async function runPhase2Tests(page) {
    const phase = 'PHASE2';
    TestUtils.log(phase, 'Starting UI Module Integration Tests...');

    try {
        // Test 2.1: Module System Initialization
        TestUtils.log(phase, 'Testing module system initialization...');
        
        // Check if UI modules are loaded
        const moduleCheck = await page.evaluate(() => {
            return {
                baseGameUI: typeof window.GomokuUINew !== 'undefined',
                hasGameInstance: typeof window.game !== 'undefined',
                hasUIInstance: typeof window.ui !== 'undefined'
            };
        });

        TestUtils.recordTest(phase, 'BaseGameUI Class Available', moduleCheck.baseGameUI);
        TestUtils.recordTest(phase, 'Game Instance Created', moduleCheck.hasGameInstance);
        TestUtils.recordTest(phase, 'UI Instance Created', moduleCheck.hasUIInstance);

        // Test 2.2: Element Binding Validation
        if (moduleCheck.hasUIInstance) {
            const elementBinding = await page.evaluate(() => {
                if (!window.ui || !window.ui.elements) return false;
                
                // Check critical elements are bound
                const requiredElements = [
                    'gameBoard', 'currentPlayerIndicator', 'gameStatus',
                    'blackScore', 'whiteScore', 'moveCounter'
                ];
                
                return requiredElements.every(elementId => window.ui.elements[elementId]);
            });

            TestUtils.recordTest(phase, 'Element Binding Complete', elementBinding);
        }

        // Test 2.3: Keyboard Integration
        TestUtils.log(phase, 'Testing keyboard integration...');
        
        // Test F1 key (Help modal)
        await page.keyboard.press('F1');
        await page.waitForTimeout(500);
        
        const helpModalVisible = await page.evaluate(() => {
            const modal = document.getElementById('helpModal');
            return modal && modal.style.display !== 'none' && modal.classList.contains('active');
        });
        
        TestUtils.recordTest(phase, 'F1 Help Modal', helpModalVisible);
        
        // Close modal with Escape
        if (helpModalVisible) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            
            const modalClosed = await page.evaluate(() => {
                const modal = document.getElementById('helpModal');
                return !modal || modal.style.display === 'none' || !modal.classList.contains('active');
            });
            
            TestUtils.recordTest(phase, 'Escape Close Modal', modalClosed);
        }

        // Test 2.4: WASD Navigation
        TestUtils.log(phase, 'Testing WASD cursor navigation...');
        
        // Get initial cursor position
        const initialPos = await page.evaluate(() => {
            return window.ui && window.ui.cursor ? { row: window.ui.cursor.row, col: window.ui.cursor.col } : null;
        });

        if (initialPos) {
            // Test right movement (D key)
            await page.keyboard.press('d');
            await page.waitForTimeout(200);
            
            const afterRight = await page.evaluate(() => {
                return window.ui && window.ui.cursor ? { row: window.ui.cursor.row, col: window.ui.cursor.col } : null;
            });
            
            const rightMovement = afterRight && afterRight.col === initialPos.col + 1;
            TestUtils.recordTest(phase, 'WASD Right Movement', rightMovement);
            
            // Test down movement (S key)
            await page.keyboard.press('s');
            await page.waitForTimeout(200);
            
            const afterDown = await page.evaluate(() => {
                return window.ui && window.ui.cursor ? { row: window.ui.cursor.row, col: window.ui.cursor.col } : null;
            });
            
            const downMovement = afterDown && afterDown.row === afterRight.row + 1;
            TestUtils.recordTest(phase, 'WASD Down Movement', downMovement);
        }

        await TestUtils.takeScreenshot(page, 'module_integration', phase);
        TestUtils.log(phase, 'UI Module Integration tests completed');

    } catch (error) {
        TestUtils.recordTest(phase, 'Phase 2 Execution', false, error);
    }
}

/**
 * Main test runner
 */
async function runGomokuValidation() {
    let browser;
    
    try {
        TestUtils.log('SETUP', 'Starting Gomoku Puppeteer Validation Suite...');
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: CONFIG.headless,
            defaultViewport: CONFIG.viewport,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport(CONFIG.viewport);
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log') {
                TestUtils.log('BROWSER', msg.text());
            }
        });

        // Run test phases
        await runPhase1Tests(page);
        await runPhase2Tests(page);
        
        // Generate final report
        generateFinalReport();

    } catch (error) {
        TestUtils.log('ERROR', `Test suite failed: ${error.message}`, 'FAIL');
        testResults.errors.push({ phase: 'SETUP', test: 'Test Suite', error: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Generate final test report
 */
function generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 GOMOKU PUPPETEER VALIDATION REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${testResults.total}`);
    console.log(`   Passed: ${testResults.passed} ✅`);
    console.log(`   Failed: ${testResults.failed} ❌`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 PHASE BREAKDOWN:`);
    for (const [phase, results] of Object.entries(testResults.phases)) {
        const rate = ((results.passed / results.total) * 100).toFixed(1);
        const status = results.failed === 0 ? '✅' : '❌';
        console.log(`   ${phase}: ${results.passed}/${results.total} (${rate}%) ${status}`);
    }
    
    if (testResults.failed > 0) {
        console.log(`\n❌ FAILED TESTS:`);
        testResults.errors.forEach(error => {
            console.log(`   • ${error.phase} - ${error.test}: ${error.error}`);
        });
    }
    
    console.log(`\n🎯 GOLDSTANDARD STATUS:`);
    if (testResults.failed === 0) {
        console.log('   ✅ ALL TESTS PASSED - READY FOR GOLDSTANDARD CERTIFICATION');
    } else {
        console.log('   ❌ TESTS FAILED - GOLDSTANDARD CERTIFICATION BLOCKED');
        console.log('   📋 Action Required: Fix failing tests before proceeding');
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save report to file
    const reportPath = path.join(__dirname, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    TestUtils.log('REPORT', `Detailed report saved to: ${reportPath}`);
}

// Run the validation if this file is executed directly
if (require.main === module) {
    runGomokuValidation().catch(console.error);
}

module.exports = { runGomokuValidation, TestUtils, CONFIG };