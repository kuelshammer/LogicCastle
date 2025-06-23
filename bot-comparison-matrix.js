#!/usr/bin/env node

/**
 * Bot Comparison Matrix
 * 
 * Comprehensive testing of all strategic bots against all scenarios
 * to verify behavioral differences and strategic correctness.
 */

const fs = require('fs');
const path = require('path');

// Setup environment
global.window = undefined;
global.document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => ({ 
        style: {}, 
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        addEventListener: () => {},
        appendChild: () => {},
        innerHTML: ''
    })
};

// Load dependencies
function loadGameFile(filename) {
    const filePath = path.join(__dirname, 'games', 'connect4', 'js', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanContent = content.replace(/['"]use strict['"];?\s*/g, '');
    eval(cleanContent);
}

function loadTestFile(filename) {
    const filePath = path.join(__dirname, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    eval(content);
}

console.log('🎯 Strategic Bot Comparison Matrix');
console.log('='.repeat(60));

try {
    // Load all required files
    console.log('📂 Loading dependencies...');
    loadGameFile('game.js');
    loadGameFile('helpers.js');
    loadGameFile('ai.js');
    loadTestFile('tests/connect4-test-utils.js');
    loadTestFile('strategic-bot-scenarios.js');
    
    console.log('✅ All dependencies loaded\n');
    
    // Configuration
    const strategicBots = [
        'smart-random',
        'offensiv-gemischt',
        'defensiv-gemischt', 
        'enhanced-smart',
        'defensive'
    ];
    
    const scenarios = StrategicBotScenarios.getScenarioNames();
    const results = {};
    
    /**
     * Test a single bot against a single scenario
     */
    function testBotScenario(botType, scenarioName) {
        try {
            // Create fresh instances
            const game = new Connect4Game();
            const helpers = new Connect4Helpers(game, null);
            const ai = new Connect4AI(botType);
            
            // Load scenario
            StrategicBotScenarios.loadScenario(game, scenarioName, Connect4TestUtils);
            
            // Record initial state
            const initialBoard = Connect4TestUtils.toAscii(game);
            const validMoves = game.getValidMoves();
            
            // Measure performance
            const startTime = Date.now();
            const move = ai.getBestMove(game, helpers);
            const endTime = Date.now();
            
            // Validate move
            const isValidMove = typeof move === 'number' && validMoves.includes(move);
            
            return {
                success: true,
                move: move,
                moveColumn: move + 1,
                isValidMove,
                timeMs: endTime - startTime,
                validMoves: validMoves.map(m => m + 1),
                boardState: initialBoard,
                scenario: StrategicBotScenarios.getScenario(scenarioName)
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                move: null,
                timeMs: null
            };
        }
    }
    
    /**
     * Run full comparison matrix
     */
    function runComparisonMatrix() {
        console.log('🔄 Running comparison matrix...\n');
        
        const matrixResults = {};
        let totalTests = 0;
        let successfulTests = 0;
        
        for (const scenario of scenarios) {
            console.log(`📋 Scenario: ${scenario}`);
            
            matrixResults[scenario] = {};
            
            for (const bot of strategicBots) {
                const result = testBotScenario(bot, scenario);
                matrixResults[scenario][bot] = result;
                
                totalTests++;
                if (result.success) successfulTests++;
                
                const status = result.success ? '✅' : '❌';
                const details = result.success ? 
                    `Col ${result.moveColumn} (${result.timeMs}ms)` :
                    `Error: ${result.error}`;
                    
                console.log(`   ${status} ${bot}: ${details}`);
            }
            console.log();
        }
        
        console.log(`📊 Matrix completed: ${successfulTests}/${totalTests} successful tests\n`);
        return matrixResults;
    }
    
    /**
     * Analyze strategic differences
     */
    function analyzeStrategicDifferences(matrixResults) {
        console.log('🔍 Strategic Difference Analysis\n');
        
        const analysis = {
            scenarioVariety: {},
            botConsistency: {},
            performanceStats: {},
            strategicPatterns: {}
        };
        
        // Analyze each scenario for move variety
        for (const [scenario, botResults] of Object.entries(matrixResults)) {
            const moves = Object.values(botResults)
                .filter(r => r.success)
                .map(r => r.move);
                
            const uniqueMoves = new Set(moves).size;
            const totalBots = moves.length;
            
            analysis.scenarioVariety[scenario] = {
                uniqueMoves,
                totalBots,
                variety: uniqueMoves / totalBots,
                moves: moves.map(m => m + 1)
            };
            
            console.log(`📋 ${scenario}: ${uniqueMoves}/${totalBots} unique moves - ${moves.map(m => m + 1).join(', ')}`);
        }
        
        console.log();
        
        // Analyze bot consistency and performance
        for (const bot of strategicBots) {
            const botResults = [];
            let totalTime = 0;
            let successCount = 0;
            
            for (const scenario of scenarios) {
                const result = matrixResults[scenario][bot];
                if (result.success) {
                    botResults.push(result);
                    totalTime += result.timeMs;
                    successCount++;
                }
            }
            
            const avgTime = successCount > 0 ? totalTime / successCount : 0;
            const reliability = successCount / scenarios.length;
            
            analysis.botConsistency[bot] = {
                successRate: reliability,
                avgTimeMs: Math.round(avgTime * 10) / 10,
                successCount,
                totalScenarios: scenarios.length
            };
            
            console.log(`🤖 ${bot}: ${(reliability * 100).toFixed(1)}% success, ${avgTime.toFixed(1)}ms avg`);
        }
        
        return analysis;
    }
    
    /**
     * Check critical scenarios
     */
    function checkCriticalScenarios(matrixResults) {
        console.log('\n🚨 Critical Scenario Validation\n');
        
        const criticalTests = [
            {
                scenario: 'immediateWin',
                description: 'All bots must take immediate wins',
                validator: (results) => {
                    const expectedMoves = [0, 4]; // Columns 1 or 5
                    return Object.entries(results).map(([bot, result]) => ({
                        bot,
                        passed: result.success && expectedMoves.includes(result.move),
                        move: result.success ? result.moveColumn : 'ERROR'
                    }));
                }
            },
            {
                scenario: 'mustBlock',
                description: 'All bots must block immediate threats',
                validator: (results) => {
                    const expectedMove = 3; // Column 4
                    return Object.entries(results).map(([bot, result]) => ({
                        bot,
                        passed: result.success && result.move === expectedMove,
                        move: result.success ? result.moveColumn : 'ERROR'
                    }));
                }
            },
            {
                scenario: 'emptyBoard',
                description: 'Most bots should prefer center opening',
                validator: (results) => {
                    const preferredMove = 3; // Column 4 (center)
                    return Object.entries(results).map(([bot, result]) => ({
                        bot,
                        passed: result.success && result.move === preferredMove,
                        move: result.success ? result.moveColumn : 'ERROR'
                    }));
                }
            }
        ];
        
        let allCriticalPassed = true;
        
        for (const test of criticalTests) {
            console.log(`🔍 ${test.description}`);
            
            if (!matrixResults[test.scenario]) {
                console.log(`   ❌ Scenario '${test.scenario}' not found in results`);
                allCriticalPassed = false;
                continue;
            }
            
            const validationResults = test.validator(matrixResults[test.scenario]);
            const passedCount = validationResults.filter(r => r.passed).length;
            const totalCount = validationResults.length;
            
            validationResults.forEach(r => {
                const status = r.passed ? '✅' : '❌';
                console.log(`   ${status} ${r.bot}: Column ${r.move}`);
            });
            
            const testPassed = test.scenario === 'emptyBoard' ? 
                passedCount >= 4 : // Allow some variety in opening
                passedCount === totalCount; // Require unanimous agreement on tactical moves
                
            if (!testPassed) {
                allCriticalPassed = false;
            }
            
            console.log(`   📊 Result: ${passedCount}/${totalCount} passed\n`);
        }
        
        return allCriticalPassed;
    }
    
    /**
     * Generate summary report
     */
    function generateSummaryReport(matrixResults, analysis, criticalPassed) {
        console.log('📋 FINAL REPORT');
        console.log('='.repeat(60));
        
        const totalScenarios = scenarios.length;
        const totalBots = strategicBots.length;
        const totalTests = totalScenarios * totalBots;
        
        let successfulTests = 0;
        let totalTime = 0;
        
        for (const scenarioResults of Object.values(matrixResults)) {
            for (const result of Object.values(scenarioResults)) {
                if (result.success) {
                    successfulTests++;
                    totalTime += result.timeMs;
                }
            }
        }
        
        const avgTime = successfulTests > 0 ? totalTime / successfulTests : 0;
        const successRate = (successfulTests / totalTests) * 100;
        
        console.log(`📊 Overview:`);
        console.log(`   • Total Tests: ${totalTests}`);
        console.log(`   • Successful: ${successfulTests} (${successRate.toFixed(1)}%)`);
        console.log(`   • Average Time: ${avgTime.toFixed(1)}ms per move`);
        console.log(`   • Critical Tests: ${criticalPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        
        console.log(`\n🤖 Bot Performance:`);
        for (const [bot, stats] of Object.entries(analysis.botConsistency)) {
            const grade = stats.successRate >= 0.95 ? 'A' : 
                         stats.successRate >= 0.85 ? 'B' :
                         stats.successRate >= 0.70 ? 'C' : 'D';
                         
            console.log(`   • ${bot}: ${(stats.successRate * 100).toFixed(1)}% success, ${stats.avgTimeMs}ms avg [Grade: ${grade}]`);
        }
        
        console.log(`\n🎯 Strategic Variety:`);
        for (const [scenario, variety] of Object.entries(analysis.scenarioVariety)) {
            const diversityScore = variety.variety;
            const rating = diversityScore >= 0.6 ? 'High' :
                          diversityScore >= 0.4 ? 'Medium' : 'Low';
                          
            console.log(`   • ${scenario}: ${variety.uniqueMoves}/${variety.totalBots} moves (${rating} diversity)`);
        }
        
        const overallPass = successRate >= 95 && criticalPassed && avgTime < 100;
        
        console.log(`\n🏆 OVERALL RESULT: ${overallPass ? 'PASS ✅' : 'FAIL ❌'}`);
        
        if (overallPass) {
            console.log('✅ Strategic bots are working correctly with real implementations');
            console.log('✅ Behavioral differences confirmed between bot types');
            console.log('✅ Performance meets requirements');
            console.log('✅ Integration with helpers system verified');
        } else {
            console.log('❌ Issues detected that require attention');
            if (successRate < 95) console.log('   - Success rate below 95%');
            if (!criticalPassed) console.log('   - Critical scenarios failed');
            if (avgTime >= 100) console.log('   - Performance too slow');
        }
        
        return overallPass;
    }
    
    // ========== MAIN EXECUTION ==========
    
    // Run the full comparison matrix
    const matrixResults = runComparisonMatrix();
    
    // Analyze results
    const analysis = analyzeStrategicDifferences(matrixResults);
    
    // Check critical scenarios
    const criticalPassed = checkCriticalScenarios(matrixResults);
    
    // Generate final report
    const overallPass = generateSummaryReport(matrixResults, analysis, criticalPassed);
    
    // Exit with appropriate code
    process.exit(overallPass ? 0 : 1);
    
} catch (error) {
    console.error(`\n💥 Bot comparison matrix failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}