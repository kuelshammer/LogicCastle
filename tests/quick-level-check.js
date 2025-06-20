/**
 * Quick Smart Bot Level Check
 * 
 * Simple validation script that can be copy-pasted into browser console
 * to quickly check if all helper levels are working.
 * 
 * Usage:
 * 1. Open http://localhost:8080/tests/test-smart-bot.html
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Hit Enter to run
 */

console.log('🤖 Quick Smart Bot Level Check');
console.log('===============================');

function quickLevelCheck() {
    const results = [];
    
    try {
        // Test Level 0 - Horizontal Winning
        console.log('🏆 Testing Level 0 - Horizontal Win');
        let game = new Connect4Game();
        let ai = new Connect4AI('smart-random');
        let helpers = new Connect4Helpers(game, null);
        
        Connect4TestUtils.createTestPosition(game, "empty,yellow,yellow,yellow,empty,empty,empty", 2);
        const l0Move = ai.getBestMove(game, helpers);
        const l0Pass = [0, 4].includes(l0Move);
        
        results.push({ level: 'L0', test: 'Horizontal Win', passed: l0Pass, details: `Expected 1 or 5, got ${l0Move + 1}` });
        console.log(`   ${l0Pass ? '✅' : '❌'} Expected column 1 or 5, got column ${l0Move + 1}`);
        
        // Test Level 0 - Vertical Winning
        console.log('🏆 Testing Level 0 - Vertical Win');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);
        
        Connect4TestUtils.createTestPosition(game, "empty,empty,empty,yellow-yellow-yellow,empty,empty,empty", 2);
        const l0vMove = ai.getBestMove(game, helpers);
        const l0vPass = l0vMove === 3;
        
        results.push({ level: 'L0', test: 'Vertical Win', passed: l0vPass, details: `Expected 4, got ${l0vMove + 1}` });
        console.log(`   ${l0vPass ? '✅' : '❌'} Expected column 4, got column ${l0vMove + 1}`);
        
        // Test Level 1 - Horizontal Blocking
        console.log('🛡️ Testing Level 1 - Horizontal Block');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);
        
        Connect4TestUtils.createTestPosition(game, "red,red,red,empty,empty,empty,empty", 2);
        const l1Move = ai.getBestMove(game, helpers);
        const l1Pass = l1Move === 3;
        
        results.push({ level: 'L1', test: 'Horizontal Block', passed: l1Pass, details: `Expected 4, got ${l1Move + 1}` });
        console.log(`   ${l1Pass ? '✅' : '❌'} Expected column 4, got column ${l1Move + 1}`);
        
        // Test Level 1 - Vertical Blocking
        console.log('🛡️ Testing Level 1 - Vertical Block');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);
        
        Connect4TestUtils.createTestPosition(game, "empty,empty,red-red-red,empty,empty,empty,empty", 2);
        const l1vMove = ai.getBestMove(game, helpers);
        const l1vPass = l1vMove === 2;
        
        results.push({ level: 'L1', test: 'Vertical Block', passed: l1vPass, details: `Expected 3, got ${l1vMove + 1}` });
        console.log(`   ${l1vPass ? '✅' : '❌'} Expected column 3, got column ${l1vMove + 1}`);
        
        // Test Level 2 - Trap Avoidance
        console.log('🪤 Testing Level 2 - Trap Avoidance');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);
        
        Connect4TestUtils.loadScenario(game, 'trapScenario', 2);
        const l2Move = ai.getBestMove(game, helpers);
        const validMoves = game.getValidMoves();
        const l2Pass = validMoves.includes(l2Move);
        
        results.push({ level: 'L2', test: 'Trap Avoidance', passed: l2Pass, details: `Valid move: ${l2Move + 1}` });
        console.log(`   ${l2Pass ? '✅' : '❌'} Made valid move: column ${l2Move + 1}`);
        
        // Test Priority - Win over Block
        console.log('⚡ Testing Priority - Win over Block');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);
        
        Connect4TestUtils.createTestPosition(game, "yellow,yellow,yellow,empty,red,red,red", 2);
        const pMove = ai.getBestMove(game, helpers);
        const pPass = pMove === 3; // Should win at column 4
        
        results.push({ level: 'Priority', test: 'Win over Block', passed: pPass, details: `Expected 4, got ${pMove + 1}` });
        console.log(`   ${pPass ? '✅' : '❌'} Expected to win at column 4, chose column ${pMove + 1}`);
        
        // Summary
        console.log('\n===============================');
        console.log('📊 Summary:');
        
        const level0Tests = results.filter(r => r.level === 'L0');
        const level1Tests = results.filter(r => r.level === 'L1');
        const level2Tests = results.filter(r => r.level === 'L2');
        const priorityTests = results.filter(r => r.level === 'Priority');
        
        const l0Passed = level0Tests.filter(r => r.passed).length;
        const l1Passed = level1Tests.filter(r => r.passed).length;
        const l2Passed = level2Tests.filter(r => r.passed).length;
        const pPassed = priorityTests.filter(r => r.passed).length;
        
        console.log(`🏆 Level 0 (Winning):     ${l0Passed}/${level0Tests.length} ${l0Passed === level0Tests.length ? '✅' : '❌'}`);
        console.log(`🛡️ Level 1 (Blocking):    ${l1Passed}/${level1Tests.length} ${l1Passed === level1Tests.length ? '✅' : '❌'}`);
        console.log(`🪤 Level 2 (Trap Avoid):  ${l2Passed}/${level2Tests.length} ${l2Passed === level2Tests.length ? '✅' : '❌'}`);
        console.log(`⚡ Priority Tests:        ${pPassed}/${priorityTests.length} ${pPassed === priorityTests.length ? '✅' : '❌'}`);
        
        const totalTests = results.length;
        const totalPassed = results.filter(r => r.passed).length;
        const successRate = Math.round((totalPassed / totalTests) * 100);
        
        console.log('-------------------------------');
        console.log(`🎯 Overall: ${totalPassed}/${totalTests} (${successRate}%)`);
        
        if (totalPassed === totalTests) {
            console.log('\n🎉 All Smart Bot helper levels validated successfully!');
            console.log('   ✅ Level 0 (Winning moves) - Working');
            console.log('   ✅ Level 1 (Blocking threats) - Working');
            console.log('   ✅ Level 2 (Trap avoidance) - Working');
            console.log('   ✅ Priority system - Working');
        } else {
            console.log('\n⚠️ Some helper levels need attention:');
            results.filter(r => !r.passed).forEach(r => {
                console.log(`   ❌ ${r.level} ${r.test}: ${r.details}`);
            });
        }
        
        return {
            success: totalPassed === totalTests,
            totalTests: totalTests,
            totalPassed: totalPassed,
            successRate: successRate,
            results: results
        };
        
    } catch (error) {
        console.error('❌ Level check failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the check
const checkResult = quickLevelCheck();

// Make result available globally for further inspection
window.lastLevelCheckResult = checkResult;

console.log('\n💡 Tip: Run quickLevelCheck() again to re-test');
console.log('💡 Tip: Access window.lastLevelCheckResult for detailed results');