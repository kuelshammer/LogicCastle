/**
 * Error Detail Test - Capture the actual error message
 */

import puppeteer from 'puppeteer';

async function errorDetailTest() {
    console.log('🔍 Error Detail Test Starting...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Capture all console logs including detailed error objects
    page.on('console', async (msg) => {
        const text = msg.text();
        if (text.includes('🤖') || text.includes('❌') || text.includes('Error details') || msg.type() === 'error') {
            console.log(`[${msg.type().toUpperCase()}] ${text}`);
            
            // If this is an error details log, try to get the actual error object
            if (text.includes('Error details') && msg.args().length > 1) {
                try {
                    const errorObj = await msg.args()[1].jsonValue();
                    console.log('🔍 Detailed Error Object:', JSON.stringify(errorObj, null, 2));
                } catch (e) {
                    console.log('🔍 Could not extract error object details');
                }
            }
        }
    });
    
    await page.goto('http://localhost:8081/games/connect4/');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Force a specific error scenario
    const errorDetails = await page.evaluate(() => {
        return new Promise((resolve) => {
            console.log('🔍 Forcing AI error scenario...');
            
            // Set AI mode
            document.getElementById('gameMode').value = 'vs-bot-easy';
            window.ui.setGameMode('vs-bot-easy');
            window.ui.newGame();
            
            setTimeout(async () => {
                try {
                    // Make human move first
                    await window.ui.dropDiscInColumn(3);
                    console.log('✅ Human move completed');
                    
                    // Now manually trigger AI move and capture error
                    try {
                        console.log('🔍 Manually triggering AI move to capture error...');
                        await window.ui.makeAIMove();
                        console.log('✅ AI move completed without error');
                        resolve({ success: true });
                    } catch (aiError) {
                        console.log('❌ Captured AI error:', aiError);
                        resolve({
                            error: true,
                            message: aiError.message,
                            name: aiError.name,
                            stack: aiError.stack
                        });
                    }
                } catch (humanError) {
                    console.log('❌ Human move failed:', humanError);
                    resolve({
                        error: true,
                        phase: 'human move',
                        message: humanError.message
                    });
                }
            }, 1000);
        });
    });
    
    console.log('\n🔍 Error Detail Results:', errorDetails);
    
    console.log('\n🔍 Error detail test complete. Browser left open.');
    return new Promise(() => {}); // Keep browser open
}

errorDetailTest().catch(console.error);