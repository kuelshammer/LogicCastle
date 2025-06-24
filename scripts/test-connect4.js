#!/usr/bin/env node

/**
 * Connect4-specific test runner
 * Focused tests for the working baseline version
 */

const { runConnect4Tests } = require('./run-tests.js');

async function main() {
  console.log('🔴 Connect4 Focused Test Suite\n');

  const results = await runConnect4Tests();

  if (!results.success) {
    console.log('\n💥 Connect4 tests failed!');
    console.log('This indicates a regression from the working baseline.');
    console.log('Please check for:');
    console.log('- Syntax errors in JavaScript files');
    console.log('- CSS issues affecting stone visibility');
    console.log('- Missing HTML elements');
    console.log('- Broken event handlers');
    process.exit(1);
  }

  console.log('\n🎉 Connect4 is working correctly!');
  console.log('Safe to proceed with feature development.');
}

if (require.main === module) {
  main();
}

module.exports = { main };
