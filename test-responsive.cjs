/**
 * Test responsive sizing of Connect4 board at different viewport sizes
 */
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const viewports = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1280, height: 720, name: 'Desktop Medium' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 414, height: 896, name: 'Mobile Large' },
        { width: 375, height: 667, name: 'Mobile Medium' }
    ];
    
    for (const viewport of viewports) {
        console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        await page.setViewport(viewport);
        await page.goto('http://localhost:8080/games/connect4/', { 
            waitUntil: 'networkidle0',
            timeout: 10000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const boardInfo = await page.evaluate(() => {
            const board = document.getElementById('gameBoard');
            const container = document.querySelector('.game-board-container');
            
            if (board && container) {
                const boardRect = board.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                return {
                    boardWidth: Math.round(boardRect.width),
                    boardHeight: Math.round(boardRect.height),
                    containerWidth: Math.round(containerRect.width),
                    containerHeight: Math.round(containerRect.height),
                    aspectRatio: Math.round((boardRect.width / boardRect.height) * 100) / 100,
                    fitsVertically: (boardRect.bottom < window.innerHeight - 50),
                    fitsHorizontally: (boardRect.right < window.innerWidth - 50)
                };
            }
            return null;
        });
        
        if (boardInfo) {
            console.log(`   📏 Board: ${boardInfo.boardWidth}x${boardInfo.boardHeight}px`);
            console.log(`   📦 Container: ${boardInfo.containerWidth}x${boardInfo.containerHeight}px`);
            console.log(`   📐 Aspect: ${boardInfo.aspectRatio} (target: ~1.17)`);
            console.log(`   ✅ Fits: Vertical=${boardInfo.fitsVertically}, Horizontal=${boardInfo.fitsHorizontally}`);
        } else {
            console.log(`   ❌ Board not found`);
        }
        
        await page.screenshot({ 
            path: `tests/results/connect4-responsive-${viewport.width}x${viewport.height}.png` 
        });
    }
    
    await browser.close();
    console.log('\n✅ Responsive testing complete');
})();