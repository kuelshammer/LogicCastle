const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    
    // Listen to console messages
    page.on('console', msg => {
        console.log(`🔍 CONSOLE ${msg.type()}: ${msg.text()}`);
    });
    
    // Listen to errors
    page.on('error', err => {
        console.log(`💥 PAGE ERROR: ${err.message}`);
    });
    
    page.on('pageerror', err => {
        console.log(`💥 PAGE ERROR: ${err.message}`);
    });
    
    console.log('🌐 Navigating to Connect4...');
    await page.goto('http://localhost:8080/games/connect4/', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
    });
    
    console.log('⏱️ Waiting 5 seconds for initialization...');
    await page.waitForTimeout(5000);
    
    // Check if elements are properly initialized
    const debugInfo = await page.evaluate(() => {
        return {
            gameBoard: !!document.getElementById('gameBoard'),
            gameBoard_display: window.getComputedStyle(document.getElementById('gameBoard')).display,
            gameBoard_classList: document.getElementById('gameBoard')?.classList.toString(),
            gameBoard_children: document.getElementById('gameBoard')?.children.length,
            window_ui: !!window.ui,
            window_game: !!window.game,
            error_logs: window.loggedErrors || []
        };
    });
    
    console.log('🔍 Debug Info:', debugInfo);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-connect4.png' });
    console.log('📸 Screenshot saved as debug-connect4.png');
    
    console.log('✋ Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
    await browser.close();
})();