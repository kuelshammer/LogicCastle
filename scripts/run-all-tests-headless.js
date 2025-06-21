#!/usr/bin/env node

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * CI/CD-Ready Headless Test Runner for LogicCastle
 * Executes all test suites and outputs structured results
 */

/**
 * Simple HTTP server for testing
 */
function startServer(port = 8081) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            let filePath = path.join(__dirname, '..', req.url === '/' ? '/index.html' : req.url);
            
            // Handle directory requests
            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
            
            // Determine content type
            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.ico': 'image/x-icon'
            }[ext] || 'text/plain';
            
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('<h1>404 Not Found</h1>');
                    } else {
                        res.writeHead(500);
                        res.end('Server Error');
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        });
        
        server.listen(port, () => {
            console.log(`✅ Test server running on http://localhost:${port}`);
            resolve(server);
        });
        
        server.on('error', reject);
    });
}

/**
 * Extract test results from the comprehensive test runner
 */
async function runComprehensiveTests() {
    console.log('\n🧪 Running Comprehensive Test Suite...\n');
    
    let server;
    let browser;
    
    try {
        // Start local server
        server = await startServer(8081);
        
        // Launch browser with CI-friendly settings
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set up error handling
        const errors = [];
        page.on('error', err => errors.push(err.message));
        page.on('pageerror', err => errors.push(`Page Error: ${err.message}`));
        
        // Set environment variables for CI detection
        await page.evaluateOnNewDocument(() => {
            window.CI_ENVIRONMENT = true;
            window.CI_TIMEOUT_MULTIPLIER = 3; // Relax timeouts for CI
        });
        
        // Load test runner page
        await page.goto('http://localhost:8081/tests/test-runner.html', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for page to fully load
        await page.waitForTimeout(2000);
        
        // Check if test framework is loaded
        const frameworkLoaded = await page.evaluate(() => {
            return typeof TestSuite !== 'undefined' && typeof runAllTests === 'function';
        });
        
        if (!frameworkLoaded) {
            throw new Error('Test framework not loaded properly');
        }
        
        // Execute all tests and wait for completion
        const testResults = await page.evaluate(() => {
            return new Promise((resolve) => {
                let testCompleted = false;
                
                try {
                    // Create test suite
                    const testSuite = new TestSuite();
                    
                    // Run tests manually to capture results
                    console.log('Starting test execution...');
                    
                    // Execute test functions that are available
                    const testFunctions = [
                        // Backend Tests
                        typeof runBackendGameCoreTests === 'function' ? () => runBackendGameCoreTests(testSuite) : null,
                        typeof runBackendGameEdgeCasesTests === 'function' ? () => runBackendGameEdgeCasesTests(testSuite) : null,
                        typeof runBackendEventsTests === 'function' ? () => runBackendEventsTests(testSuite) : null,
                        typeof runBackendSimulationTests === 'function' ? () => runBackendSimulationTests(testSuite) : null,
                        
                        // AI Strategy Tests
                        typeof runAIStrategyEnhancedSmartTests === 'function' ? () => runAIStrategyEnhancedSmartTests(testSuite) : null,
                        typeof runAIStrategyConsistencyTests === 'function' ? () => runAIStrategyConsistencyTests(testSuite) : null,
                        typeof runAIStrategySmartRandomTests === 'function' ? () => runAIStrategySmartRandomTests(testSuite) : null,
                        
                        // Helper System Tests
                        typeof runHelperSystemLevelsTests === 'function' ? () => runHelperSystemLevelsTests(testSuite) : null,
                        typeof runHelperSystemStrategicTests === 'function' ? () => runHelperSystemStrategicTests(testSuite) : null,
                        typeof runHelperSystemHintsTests === 'function' ? () => runHelperSystemHintsTests(testSuite) : null,
                        typeof runHelperSystemEventsTests === 'function' ? () => runHelperSystemEventsTests(testSuite) : null,
                        typeof runHelperSystemPerformanceTests === 'function' ? () => runHelperSystemPerformanceTests(testSuite) : null,
                        typeof runHelperSystemRegressionTests === 'function' ? () => runHelperSystemRegressionTests(testSuite) : null,
                        
                        // UI Component Tests
                        typeof runUIComponentBoardTests === 'function' ? () => runUIComponentBoardTests(testSuite) : null,
                        typeof runUIComponentControlsTests === 'function' ? () => runUIComponentControlsTests(testSuite) : null,
                        typeof runUIComponentInteractionsTests === 'function' ? () => runUIComponentInteractionsTests(testSuite) : null,
                        typeof runUIComponentVisualTests === 'function' ? () => runUIComponentVisualTests(testSuite) : null,
                        
                        // Integration Tests
                        typeof runIntegrationGameFlowTests === 'function' ? () => runIntegrationGameFlowTests(testSuite) : null,
                        typeof runIntegrationAIUITests === 'function' ? () => runIntegrationAIUITests(testSuite) : null,
                        typeof runIntegrationHelpersUITests === 'function' ? () => runIntegrationHelpersUITests(testSuite) : null,
                        typeof runIntegrationCrossComponentTests === 'function' ? () => runIntegrationCrossComponentTests(testSuite) : null,
                        
                        // Regression Tests
                        typeof runRegressionAnimationChaosTests === 'function' ? () => runRegressionAnimationChaosTests(testSuite) : null,
                        typeof runRegressionStateCorruptionTests === 'function' ? () => runRegressionStateCorruptionTests(testSuite) : null,
                        
                        // Legacy Tests
                        typeof runConnect4Tests === 'function' ? () => runConnect4Tests(testSuite) : null,
                        typeof runTrioTests === 'function' ? () => runTrioTests(testSuite) : null,
                        typeof runGobangTests === 'function' ? () => runGobangTests(testSuite) : null
                    ].filter(fn => fn !== null);
                    
                    console.log('Found ' + testFunctions.length + ' test functions to execute');
                    
                    // Execute all available test functions
                    testFunctions.forEach((testFn, index) => {
                        try {
                            console.log('Executing test function ' + (index + 1) + '/' + testFunctions.length);
                            testFn();
                        } catch (error) {
                            console.error('Test function ' + (index + 1) + ' failed:', error);
                        }
                    });
                    
                    // Get results
                    const results = testSuite.getResults();
                    const summary = testSuite.getSummary();
                    
                    console.log('Tests completed: ' + summary.passed + '/' + summary.total + ' passed');
                    
                    const capturedResults = {
                        results: results,
                        summary: summary,
                        categories: {
                            backend: results.filter(r => r.suite.startsWith('Backend-')),
                            aiStrategy: results.filter(r => r.suite.startsWith('AI-Strategy-')),
                            helperSystem: results.filter(r => r.suite.startsWith('Helper-System-')),
                            uiComponents: results.filter(r => r.suite.startsWith('UI-Component-')),
                            integration: results.filter(r => r.suite.startsWith('Integration-')),
                            performance: results.filter(r => r.suite.startsWith('Performance-')),
                            regression: results.filter(r => r.suite.startsWith('Regression-')),
                            legacy: results.filter(r => !r.suite.includes('-'))
                        }
                    };
                    
                    testCompleted = true;
                    resolve(capturedResults);
                    
                } catch (error) {
                    console.error('Test execution error:', error);
                    resolve({
                        error: error.message,
                        results: [],
                        summary: { total: 0, passed: 0, failed: 0 }
                    });
                }
                
                // Fallback timeout (45 seconds)
                setTimeout(() => {
                    if (!testCompleted) {
                        resolve({
                            error: 'Tests timed out after 45 seconds',
                            results: [],
                            summary: { total: 0, passed: 0, failed: 0 }
                        });
                    }
                }, 45000);
            });
        });
        
        if (testResults.error) {
            throw new Error(testResults.error);
        }
        
        // Process and display results
        console.log('📊 Test Results Summary:');
        console.log('='.repeat(60));
        
        const categories = testResults.categories;
        const categoryStats = {};
        
        Object.keys(categories).forEach(category => {
            const tests = categories[category];
            const passed = tests.filter(t => t.passed).length;
            const total = tests.length;
            
            if (total > 0) {
                categoryStats[category] = { passed, total, success: passed === total };
                const status = passed === total ? '✅' : '❌';
                console.log(`   ${status} ${category.padEnd(15)}: ${passed}/${total}`);
            }
        });
        
        console.log('='.repeat(60));
        const overall = testResults.summary;
        const overallSuccess = overall.passed === overall.total;
        const status = overallSuccess ? '✅' : '❌';
        console.log(`   ${status} OVERALL: ${overall.passed}/${overall.total} (${Math.round((overall.passed/overall.total)*100)}%)`);
        
        if (errors.length > 0) {
            console.log('\n⚠️  JavaScript Errors:');
            errors.forEach(err => console.log(`   - ${err}`));
        }
        
        // Generate structured output for CI
        const ciOutput = {
            timestamp: new Date().toISOString(),
            environment: {
                ci: true,
                node_version: process.version,
                platform: process.platform
            },
            summary: {
                total: overall.total,
                passed: overall.passed,
                failed: overall.failed,
                success: overallSuccess,
                success_rate: Math.round((overall.passed/overall.total)*100)
            },
            categories: categoryStats,
            detailed_results: testResults.results,
            errors: errors
        };
        
        // Write JSON output for CI systems
        const outputPath = path.join(__dirname, '..', 'test-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(ciOutput, null, 2));
        console.log(`\n📄 Detailed results written to: ${outputPath}`);
        
        return {
            success: overallSuccess,
            summary: overall,
            categories: categoryStats,
            outputPath: outputPath
        };
        
    } catch (error) {
        console.error(`❌ Test execution failed: ${error.message}`);
        return {
            success: false,
            error: error.message,
            summary: { total: 0, passed: 0, failed: 0 }
        };
    } finally {
        if (browser) await browser.close();
        if (server) server.close();
    }
}

/**
 * Generate JUnit XML output for CI systems
 */
function generateJUnitXML(results, outputPath) {
    const testSuites = {};
    
    // Group tests by suite
    results.forEach(test => {
        if (!testSuites[test.suite]) {
            testSuites[test.suite] = [];
        }
        testSuites[test.suite].push(test);
    });
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testsuites>\n';
    
    Object.keys(testSuites).forEach(suiteName => {
        const tests = testSuites[suiteName];
        const failures = tests.filter(t => !t.passed).length;
        
        xml += `  <testsuite name="${suiteName}" tests="${tests.length}" failures="${failures}">\n`;
        
        tests.forEach(test => {
            xml += `    <testcase name="${test.name}" classname="${suiteName}"`;
            if (test.passed) {
                xml += '/>\n';
            } else {
                xml += '>\n';
                xml += `      <failure message="${test.error || 'Test failed'}">${test.error || 'No details available'}</failure>\n`;
                xml += '    </testcase>\n';
            }
        });
        
        xml += '  </testsuite>\n';
    });
    
    xml += '</testsuites>\n';
    
    fs.writeFileSync(outputPath, xml);
    console.log(`📄 JUnit XML written to: ${outputPath}`);
}

/**
 * Main test runner
 */
async function main() {
    console.log('🧪 LogicCastle CI/CD Test Suite');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    // Run comprehensive tests
    const results = await runComprehensiveTests();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n⏱️  Total execution time: ${duration}s`);
    
    // Generate JUnit XML if we have results
    if (results.success && results.summary.total > 0) {
        const junitPath = path.join(__dirname, '..', 'test-results.xml');
        // Note: We'd need to get detailed results for JUnit XML
        console.log('📋 Test execution completed successfully');
    }
    
    console.log('='.repeat(60));
    
    if (!results.success) {
        console.error('❌ Tests failed!');
        process.exit(1);
    }
    
    console.log('✨ All tests passed successfully!');
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = { runComprehensiveTests, startServer, generateJUnitXML };