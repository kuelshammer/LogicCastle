#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTestFile(filePath) {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('node', [filePath], { stdio: 'inherit' });

    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: `Test file failed with code ${code}` });
      }
    });

    testProcess.on('error', (err) => {
      reject({ success: false, error: err.message });
    });
  });
}

async function runTests() {
  console.log('🧪 LogicCastle Simple Test Runner (Node.js)');
  console.log('='.repeat(50));

  const testFiles = [
    '../tests/backend/backend-game-core.js',
    '../tests/backend/backend-game-edge-cases.js',
    '../tests/backend/backend-events.js',
    '../tests/backend/backend-simulation.js',
    '../tests/ai-strategy/ai-strategy-enhanced-smart.js',
    '../tests/ai-strategy/ai-strategy-consistency.js',
    '../tests/ai-strategy/ai-strategy-smart-random.js'
  ];

  let allTestsPassed = true;

  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`\nRunning: ${file}`);
      const result = await runTestFile(filePath);
      if (!result.success) {
        allTestsPassed = false;
        console.error(`❌ Test failed: ${file}`);
        if (result.error) {
          console.error(`   Error: ${result.error}`);
        }
      }
    }
  }

  console.log('\n', '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ All simple tests passed!');
    process.exit(0);
  } else {
    console.error('❌ Some simple tests failed.');
    process.exit(1);
  }
}

runTests();

