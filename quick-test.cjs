const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.goto('http://localhost:8080/games/connect4/', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await page.evaluate(() => {
        const board = document.getElementById('gameBoard');
        const cells = board?.querySelectorAll('.cell');
        const boardRect = board?.getBoundingClientRect();
        
        return {
            boardExists: !!board,
            cellCount: cells?.length || 0,
            boardSize: boardRect ? `${Math.round(boardRect.width)}x${Math.round(boardRect.height)}` : 'N/A',
            aspectRatio: boardRect ? Math.round((boardRect.width / boardRect.height) * 100) / 100 : 'N/A'
        };
    });
    
    console.log('📊 Quick Connect4 Validation:');
    console.log(`   ✅ Board exists: ${result.boardExists}`);
    console.log(`   ✅ Cell count: ${result.cellCount}/42`);
    console.log(`   📏 Board size: ${result.boardSize}`);
    console.log(`   📐 Aspect ratio: ${result.aspectRatio} (target: ~1.17)`);
    
    await page.screenshot({ path: 'tests/results/connect4-final-responsive.png' });
    console.log('   📸 Screenshot saved');
    
    await browser.close();
})();