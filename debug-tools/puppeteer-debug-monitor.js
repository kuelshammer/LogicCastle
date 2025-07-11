/**
 * Puppeteer Debug Monitor for Connect4
 * 
 * Automated console log monitoring and error categorization
 * for systematic debugging of the Connect4 application.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Connect4DebugMonitor {
    constructor(options = {}) {
        this.url = options.url || 'http://localhost:3000/games/connect4/';
        this.outputFile = options.outputFile || './debug-logs.json';
        this.maxRetries = options.maxRetries || 5;
        
        // Error categorization patterns
        this.errorPatterns = {
            CRITICAL: [
                /TypeError.*is not a function/,
                /Cannot read property.*of undefined/,
                /Cannot read properties.*of undefined/,
                /ReferenceError/,
                /Uncaught.*Error/
            ],
            API_MISMATCH: [
                /game\.makeMove is not a function/,
                /game\.getCell is not a function/,
                /game\.isGameOver is not a function/
            ],
            KEYBOARD: [
                /Unknown keyboard action/,
                /Keyboard shortcut conflict/,
                /keyboardController\.addAction is not a function/
            ],
            RESOURCE: [
                /Failed to load resource.*404/,
                /404.*Not Found/,
                /Unable to decode audio data/
            ],
            DEPRECATED: [
                /DEPRECATED.*replaced/,
                /⚠️.*DEPRECATED/
            ],
            CONFIG: [
                /Config.*error/,
                /Setup.*failed/,
                /Modal.*failed/
            ]
        };
        
        this.logs = [];
        this.errorCounts = {};
        this.testResults = [];
    }

    /**
     * Initialize Puppeteer browser
     */
    async init() {
        console.log('🚀 Initializing Puppeteer Debug Monitor...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport
        await this.page.setViewport({ width: 1280, height: 720 });
        
        // Listen to console logs
        this.page.on('console', (msg) => {
            this.handleConsoleLog(msg);
        });
        
        // Listen to page errors
        this.page.on('pageerror', (error) => {
            this.handlePageError(error);
        });
        
        console.log('✅ Puppeteer initialized successfully');
    }

    /**
     * Handle console log messages
     */
    handleConsoleLog(msg) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: msg.type(),
            text: msg.text(),
            category: this.categorizeError(msg.text())
        };
        
        this.logs.push(logEntry);
        
        // Real-time console output with color coding
        const color = this.getLogColor(logEntry.category);
        console.log(`${color}[${logEntry.category}] ${logEntry.text}\x1b[0m`);
        
        // Count errors by category
        if (logEntry.category !== 'INFO') {
            this.errorCounts[logEntry.category] = (this.errorCounts[logEntry.category] || 0) + 1;
        }
    }

    /**
     * Handle page errors
     */
    handlePageError(error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'pageerror',
            text: error.message,
            stack: error.stack,
            category: 'CRITICAL'
        };
        
        this.logs.push(logEntry);
        console.log(`\x1b[31m[CRITICAL PAGE ERROR] ${error.message}\x1b[0m`);
        
        this.errorCounts['CRITICAL'] = (this.errorCounts['CRITICAL'] || 0) + 1;
    }

    /**
     * Categorize error messages
     */
    categorizeError(message) {
        for (const [category, patterns] of Object.entries(this.errorPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    return category;
                }
            }
        }
        
        // Default categorization
        if (message.includes('❌') || message.includes('ERROR')) {
            return 'ERROR';
        } else if (message.includes('⚠️') || message.includes('warn')) {
            return 'WARNING';
        }
        
        return 'INFO';
    }

    /**
     * Get color code for log category
     */
    getLogColor(category) {
        const colors = {
            CRITICAL: '\x1b[31m',      // Red
            API_MISMATCH: '\x1b[35m',  // Magenta  
            KEYBOARD: '\x1b[33m',      // Yellow
            RESOURCE: '\x1b[36m',      // Cyan
            DEPRECATED: '\x1b[90m',    // Gray
            CONFIG: '\x1b[34m',        // Blue
            ERROR: '\x1b[31m',         // Red
            WARNING: '\x1b[33m',       // Yellow
            INFO: '\x1b[37m'           // White
        };
        
        return colors[category] || '\x1b[37m';
    }

    /**
     * Load Connect4 page and monitor
     */
    async monitorPage() {
        console.log(`🔍 Loading Connect4 page: ${this.url}`);
        
        try {
            await this.page.goto(this.url, { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            console.log('✅ Page loaded successfully');
            
            // Wait for UI initialization
            await this.page.waitForTimeout(2000);
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to load page: ${error.message}`);
            return false;
        }
    }

    /**
     * Run interactive test scenarios
     */
    async runTestScenarios() {
        console.log('🧪 Running test scenarios...');
        
        const scenarios = [
            { name: 'Page Load', test: () => this.testPageLoad() },
            { name: 'Column Click', test: () => this.testColumnClick() },
            { name: 'F1 Help Modal', test: () => this.testF1Modal() },
            { name: 'F2 Assistance Modal', test: () => this.testF2Modal() },
            { name: 'Hover Preview', test: () => this.testHoverPreview() }
        ];
        
        for (const scenario of scenarios) {
            console.log(`\n🎯 Testing: ${scenario.name}`);
            
            const startTime = Date.now();
            const errorCountBefore = Object.values(this.errorCounts).reduce((a, b) => a + b, 0);
            
            try {
                await scenario.test();
                const duration = Date.now() - startTime;
                const errorCountAfter = Object.values(this.errorCounts).reduce((a, b) => a + b, 0);
                const newErrors = errorCountAfter - errorCountBefore;
                
                this.testResults.push({
                    name: scenario.name,
                    duration,
                    newErrors,
                    status: newErrors === 0 ? 'PASS' : 'FAIL'
                });
                
                const status = newErrors === 0 ? '✅ PASS' : `❌ FAIL (${newErrors} new errors)`;
                console.log(`   ${status} in ${duration}ms`);
                
            } catch (error) {
                console.log(`   ❌ FAIL: ${error.message}`);
                this.testResults.push({
                    name: scenario.name,
                    duration: Date.now() - startTime,
                    error: error.message,
                    status: 'ERROR'
                });
            }
            
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * Test page load without errors
     */
    async testPageLoad() {
        // Already loaded in monitorPage, just verify elements exist
        await this.page.waitForSelector('.game-board');
        await this.page.waitForSelector('.game-info-compact');
    }

    /**
     * Test column click functionality
     */
    async testColumnClick() {
        console.log('   🔍 Testing column click...');
        
        // Find first column coordinate
        const firstCoord = await this.page.$('.coord[data-col="0"]');
        if (!firstCoord) {
            throw new Error('Could not find column coordinate');
        }
        
        // Click the column
        await firstCoord.click();
        
        // Wait for move to process
        await this.page.waitForTimeout(500);
    }

    /**
     * Test F1 help modal
     */
    async testF1Modal() {
        console.log('   🔍 Testing F1 help modal...');
        
        await this.page.keyboard.press('F1');
        await this.page.waitForTimeout(500);
        
        // Check if modal opened
        const modal = await this.page.$('#helpModal:not(.hidden)');
        if (modal) {
            console.log('   ✅ Help modal opened');
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(300);
        }
    }

    /**
     * Test F2 assistance modal
     */
    async testF2Modal() {
        console.log('   🔍 Testing F2 assistance modal...');
        
        await this.page.keyboard.press('F2');
        await this.page.waitForTimeout(500);
        
        // Check if modal opened
        const modal = await this.page.$('#assistanceModal:not(.hidden)');
        if (modal) {
            console.log('   ✅ Assistance modal opened');
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(300);
        }
    }

    /**
     * Test hover preview
     */
    async testHoverPreview() {
        console.log('   🔍 Testing hover preview...');
        
        // Hover over a column
        const coord = await this.page.$('.coord[data-col="2"]');
        if (coord) {
            await coord.hover();
            await this.page.waitForTimeout(300);
            
            // Move away
            await this.page.mouse.move(100, 100);
            await this.page.waitForTimeout(300);
        }
    }

    /**
     * Generate summary report
     */
    generateReport() {
        console.log('\n📊 DEBUG MONITORING REPORT');
        console.log('=' * 50);
        
        // Error summary by category
        console.log('\n🔍 ERROR SUMMARY:');
        const totalErrors = Object.values(this.errorCounts).reduce((a, b) => a + b, 0);
        
        if (totalErrors === 0) {
            console.log('✅ NO ERRORS DETECTED!');
        } else {
            Object.entries(this.errorCounts)
                .sort(([,a], [,b]) => b - a)
                .forEach(([category, count]) => {
                    const color = this.getLogColor(category);
                    console.log(`${color}${category}: ${count} errors\x1b[0m`);
                });
        }
        
        // Test results
        console.log('\n🧪 TEST RESULTS:');
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.name}: ${result.status} (${result.duration}ms)`);
        });
        
        // Priority fixes needed
        console.log('\n🎯 PRIORITY FIXES NEEDED:');
        const priorities = ['CRITICAL', 'API_MISMATCH', 'KEYBOARD', 'RESOURCE'];
        priorities.forEach(priority => {
            if (this.errorCounts[priority] > 0) {
                console.log(`🔴 ${priority}: ${this.errorCounts[priority]} issues`);
            }
        });
        
        return {
            totalErrors,
            errorCounts: this.errorCounts,
            testResults: this.testResults,
            logs: this.logs
        };
    }

    /**
     * Save report to file
     */
    async saveReport(report) {
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: report,
            detailedLogs: this.logs
        };
        
        await fs.promises.writeFile(
            this.outputFile, 
            JSON.stringify(reportData, null, 2),
            'utf8'
        );
        
        console.log(`\n💾 Report saved to: ${this.outputFile}`);
    }

    /**
     * Cleanup and close browser
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        console.log('🧹 Cleanup completed');
    }

    /**
     * Main monitoring workflow
     */
    async run() {
        try {
            await this.init();
            
            const loaded = await this.monitorPage();
            if (!loaded) {
                throw new Error('Failed to load page');
            }
            
            // Monitor for initial errors
            await this.page.waitForTimeout(3000);
            
            // Run test scenarios
            await this.runTestScenarios();
            
            // Generate and save report
            const report = this.generateReport();
            await this.saveReport(report);
            
            return report;
            
        } catch (error) {
            console.error(`❌ Monitor failed: ${error.message}`);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// CLI Usage
if (require.main === module) {
    const monitor = new Connect4DebugMonitor({
        url: process.argv[2] || 'http://localhost:3000/games/connect4/',
        outputFile: './debug-report.json'
    });
    
    monitor.run()
        .then(report => {
            console.log('\n🎉 Monitoring completed!');
            console.log(`Total errors: ${report.totalErrors}`);
            process.exit(report.totalErrors > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Monitor crashed:', error);
            process.exit(1);
        });
}

module.exports = Connect4DebugMonitor;