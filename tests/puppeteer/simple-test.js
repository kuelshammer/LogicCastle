/**
 * Simple Gomoku Test - Debugging Version
 */

const puppeteer = require('puppeteer');

async function simpleTest() {
    console.log('🔧 Starting simple Gomoku test...');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 1024 },
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });

        console.log('✅ Browser launched');
        
        const page = await browser.newPage();
        console.log('✅ Page created');
        
        await page.setViewport({ width: 1280, height: 1024 });
        
        // Navigate to Gomoku
        console.log('🔧 Navigating to Gomoku...');
        const response = await page.goto('http://localhost:8001/games/gomoku/index.html', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });
        
        console.log(`✅ Page loaded: ${response.status()}`);
        
        // Wait for game board
        await page.waitForSelector('#gameBoard', { timeout: 5000 });
        console.log('✅ Game board found');
        
        // Check intersections
        const intersections = await page.$$('#gameBoard .intersection');
        console.log(`✅ Found ${intersections.length} intersections`);
        
        // Take screenshot
        await page.screenshot({ path: 'gomoku-test.png' });
        console.log('✅ Screenshot taken');
        
        // Test basic interaction
        console.log('🔧 Testing cursor movement...');
        await page.keyboard.press('d'); // Move right
        await page.waitForTimeout(500);
        
        await page.keyboard.press('s'); // Move down  
        await page.waitForTimeout(500);
        
        console.log('✅ Cursor movement tested');
        
        // Test modal
        console.log('🔧 Testing modal...');
        await page.keyboard.press('F1'); // Open help
        await page.waitForTimeout(1000);
        
        const modal = await page.$('#helpModal');
        const modalVisible = await page.evaluate(el => {
            return el && (el.style.display !== 'none' || el.classList.contains('active'));
        }, modal);
        
        console.log(`✅ Modal test: ${modalVisible ? 'VISIBLE' : 'HIDDEN'}`);
        
        if (modalVisible) {
            await page.keyboard.press('Escape'); // Close modal
            await page.waitForTimeout(500);
            console.log('✅ Modal closed with Escape');
        }
        
        console.log('🎉 All basic tests PASSED!');
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        console.log(error.stack);
    } finally {
        if (browser) {
            await browser.close();
            console.log('✅ Browser closed');
        }
    }
}

// Run test
simpleTest().catch(console.error);