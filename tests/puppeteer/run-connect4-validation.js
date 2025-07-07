#!/usr/bin/env node
/**
 * 🎯 CONNECT4 PUPPETEER VALIDATION RUNNER
 * 
 * Executable script to run the Connect4 UI validation suite
 * Based on Gomoku GOLDSTANDARD validation approach
 */

const Connect4ValidationSuite = require('./connect4-validation.js');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🎯 CONNECT4 UI VALIDATION SUITE');
    console.log('================================');
    console.log('Following Gomoku GOLDSTANDARD validation model');
    console.log('Target: 26 Tests across 5 phases for certification\n');

    // Ensure results directory exists
    const resultsDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
        console.log('📁 Created results directory');
    }

    try {
        const validator = new Connect4ValidationSuite();
        
        console.log('🚀 Starting validation...\n');
        const startTime = Date.now();
        
        await validator.runValidation();
        
        const duration = Date.now() - startTime;
        console.log(`\n⏱️  Total validation time: ${(duration / 1000).toFixed(2)}s`);
        
        console.log('\n🎉 Validation completed successfully!');
        console.log('📄 Check CONNECT4_PUPPETEER_VALIDATION_RESULTS.md for detailed results');
        
    } catch (error) {
        console.error('\n❌ Validation failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = main;