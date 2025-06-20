#!/usr/bin/env node
/**
 * Test script for race condition fix in AI moves
 */

const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.document = {
    getElementById: () => ({ style: {}, textContent: '', disabled: false }),
    createElement: () => ({ 
        style: {}, 
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        appendChild: () => {},
        textContent: '',
        closest: () => ({ style: {} })
    }),
    addEventListener: () => {},
    querySelectorAll: () => []
};
global.window = {};

// Mock console to capture logs
const originalConsoleLog = console.log;
const logMessages = [];
global.console = {
    ...console,
    log: (...args) => {
        const message = args.join(' ');
        logMessages.push(message);
        originalConsoleLog(...args);
    }
};

console.log('🧪 Loading Connect4 classes...');

// Load game classes
const gameJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/game.js'), 'utf8');
const helpersJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/helpers.js'), 'utf8');
const aiJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/ai.js'), 'utf8');
const uiJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/ui.js'), 'utf8');

// Execute in context
const context = {};
eval(`${gameJs}\ncontext.Connect4Game = Connect4Game;`);
eval(`${helpersJs}\ncontext.Connect4Helpers = Connect4Helpers;`);
eval(`${aiJs}\ncontext.Connect4AI = Connect4AI;`);
eval(`${uiJs}\ncontext.Connect4UI = Connect4UI;`);

const { Connect4Game, Connect4Helpers, Connect4AI, Connect4UI } = context;

console.log('✅ Classes loaded successfully\n');

function createTestSetup() {
    const game = new Connect4Game();
    const ui = new Connect4UI(game);
    
    // Mock UI elements
    ui.gameMode = 'vs-bot-smart';
    ui.ai = new Connect4AI('smart-random');
    ui.aiThinking = false;
    ui.isAnimating = false;
    
    // Mock DOM-dependent properties
    ui.columnIndicators = Array(7).fill().map(() => ({ style: {}, classList: { toggle: () => {} } }));
    ui.boardElement = { querySelectorAll: () => [] };
    
    return { game, ui };
}

async function testRaceConditionPrevention() {
    console.log('🎯 TEST: Race Condition Prevention');
    console.log('=' .repeat(50));
    
    const { game, ui } = createTestSetup();
    
    // Clear previous log messages
    logMessages.length = 0;
    
    console.log('Triggering multiple AI moves rapidly...');
    
    // Player makes move (should trigger AI)
    ui.makePlayerMove(3);
    
    // Wait a bit to let AI move get scheduled
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now trigger reset events (should cancel previous AI move)
    game.playerConfig.lastWinner = game.PLAYER1;
    game.resetGame();
    
    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Trigger full reset too
    game.fullReset();
    
    console.log('\nWaiting for AI moves to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\nAnalyzing log messages:');
    const aiScheduleMessages = logMessages.filter(msg => msg.includes('⏰ Scheduling AI move'));
    const aiCancelMessages = logMessages.filter(msg => msg.includes('🔄 Canceling existing AI move'));
    const aiStartMessages = logMessages.filter(msg => msg.includes('🤖 AI move starting'));
    const aiCompletedMessages = logMessages.filter(msg => msg.includes('🤖 AI move completed'));
    
    console.log(`  AI moves scheduled: ${aiScheduleMessages.length}`);
    console.log(`  AI moves canceled: ${aiCancelMessages.length}`);
    console.log(`  AI moves started: ${aiStartMessages.length}`);
    console.log(`  AI moves completed: ${aiCompletedMessages.length}`);
    
    // Print actual messages
    console.log('\nSchedule messages:');
    aiScheduleMessages.forEach(msg => console.log(`  ${msg}`));
    
    console.log('\nCancel messages:');
    aiCancelMessages.forEach(msg => console.log(`  ${msg}`));
    
    // Verify race condition prevention
    const raceConditionPrevented = aiCancelMessages.length > 0;
    const singleAIExecution = aiStartMessages.length <= 1;
    
    if (raceConditionPrevented && singleAIExecution) {
        console.log('\n✅ Test passed - Race condition prevention working!');
    } else {
        console.log('\n❌ Test failed - Race condition issues detected:');
        console.log(`  Race condition prevented: ${raceConditionPrevented}`);
        console.log(`  Single AI execution: ${singleAIExecution}`);
    }
    
    console.log('');
}

async function testNormalAIFlow() {
    console.log('🎯 TEST: Normal AI Flow (no race condition)');
    console.log('=' .repeat(50));
    
    const { game, ui } = createTestSetup();
    
    // Clear previous log messages  
    logMessages.length = 0;
    
    console.log('Initial game state:');
    console.log(`  moveHistory: ${game.moveHistory.length}`, game.moveHistory);
    console.log(`  currentPlayer: ${game.getPlayerName(game.currentPlayer)}`);
    console.log(`  aiThinking: ${ui.aiThinking}`);
    
    console.log('Making normal player move...');
    ui.makePlayerMove(1); // Use different column to avoid overlap
    
    console.log('Waiting for AI response...');
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Check logs
    const aiScheduleMessages = logMessages.filter(msg => msg.includes('⏰ Scheduling AI move'));
    const aiStartMessages = logMessages.filter(msg => msg.includes('🤖 AI move starting'));
    const aiCompletedMessages = logMessages.filter(msg => msg.includes('🤖 AI move completed'));
    
    console.log(`  AI moves scheduled: ${aiScheduleMessages.length}`);
    console.log(`  AI moves started: ${aiStartMessages.length}`);
    console.log(`  AI moves completed: ${aiCompletedMessages.length}`);
    console.log(`  Move history length: ${game.moveHistory.length}`);
    console.log(`  Current player: ${game.getPlayerName(game.currentPlayer)}`);
    
    const normalFlow = aiScheduleMessages.length === 1 && 
                      aiStartMessages.length === 1 && 
                      aiCompletedMessages.length === 1 &&
                      game.moveHistory.length === 2;
    
    if (normalFlow) {
        console.log('\n✅ Test passed - Normal AI flow working correctly!');
    } else {
        console.log('\n❌ Test failed - Normal AI flow issues detected');
    }
    
    console.log('');
}

// Run all tests
async function runTests() {
    await testRaceConditionPrevention();
    await testNormalAIFlow();
    
    console.log('🏁 All tests completed!');
    console.log('\n📊 Expected behavior:');
    console.log('✅ Multiple AI move schedules should cancel previous ones');
    console.log('✅ Only one AI move should execute at a time');
    console.log('✅ Normal player-AI flow should work correctly');
    console.log('✅ No more chaotic double moves');
}

runTests();