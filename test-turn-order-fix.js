#!/usr/bin/env node
/**
 * Test script for turn order fix in bot mode
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
    
    // Track AI moves for testing
    ui.botMovesTriggered = 0;
    const originalMakeAIMove = ui.makeAIMove.bind(ui);
    ui.makeAIMove = async function() {
        this.botMovesTriggered++;
        console.log(`🤖 Bot move triggered #${this.botMovesTriggered}`);
        // Simulate the AI making a move to test full flow
        if (!this.game.gameOver) {
            // Choose a valid column (avoid column 3 for clearer testing)
            const validMoves = this.game.getValidMoves();
            const aiCol = validMoves.find(col => col !== 3) || validMoves[0];
            if (aiCol !== undefined) {
                this.game.makeMove(aiCol);
            }
        }
        return Promise.resolve();
    };
    
    return { game, ui };
}

async function testTurnOrderAfterPlayerMove() {
    console.log('🎯 TEST: Turn order after player move');
    console.log('=' .repeat(50));
    
    const { game, ui } = createTestSetup();
    
    console.log('Initial state:');
    console.log('  Current player:', game.getPlayerName(game.currentPlayer));
    console.log('  Move history length:', game.moveHistory.length);
    console.log('  Bot moves triggered:', ui.botMovesTriggered);
    
    // Player 1 (Red) makes first move
    console.log('\nPlayer 1 makes move in column 3:');
    ui.makePlayerMove(3);
    
    // Wait for AI move to be triggered
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log('After player move (and AI response):');
    console.log('  Current player:', game.getPlayerName(game.currentPlayer), '(should be Red after AI move)');
    console.log('  Move history length:', game.moveHistory.length, '(should be 2)');
    console.log('  Bot moves triggered:', ui.botMovesTriggered, '(should be 1)');
    console.log('  Last move:', game.moveHistory[game.moveHistory.length-1] ? 
        `${game.getPlayerName(game.moveHistory[game.moveHistory.length-1].player)} in column ${game.moveHistory[game.moveHistory.length-1].col}` : 'none');
    
    // Check that turn sequence is correct
    const moveOk = game.moveHistory.length === 2;
    const playerOk = game.currentPlayer === game.PLAYER1; // Should be back to Red
    const triggerOk = ui.botMovesTriggered === 1;
    const pieceOk = game.board[5][3] === game.PLAYER1;
    
    if (moveOk && playerOk && triggerOk && pieceOk) {
        console.log('\n✅ Test passed - Turn order correct after player move and AI response!');
    } else {
        console.log('\n❌ Test failed - Turn order issues detected:');
        console.log('  Move history OK:', moveOk);
        console.log('  Current player OK:', playerOk);
        console.log('  Bot trigger count OK:', triggerOk);
        console.log('  Piece placement OK:', pieceOk);
    }
    
    console.log('');
}

function testNoDoubleTriggering() {
    console.log('🎯 TEST: No double AI triggering');
    console.log('=' .repeat(50));
    
    const { game, ui } = createTestSetup();
    
    // Make several moves and check for double triggering
    console.log('Making 3 player moves and checking AI trigger count...');
    
    ui.makePlayerMove(0); // Move 1
    ui.makePlayerMove(1); // Move 2  
    ui.makePlayerMove(2); // Move 3
    
    console.log('After 3 moves:');
    console.log('  Move history length:', game.moveHistory.length, '(should be 3)');
    console.log('  Bot moves triggered:', ui.botMovesTriggered, '(should be 3)');
    console.log('  Current player:', game.getPlayerName(game.currentPlayer));
    
    const movesOk = game.moveHistory.length === 3;
    const triggersOk = ui.botMovesTriggered === 3;
    
    if (movesOk && triggersOk) {
        console.log('\n✅ Test passed - No double triggering detected!');
    } else {
        console.log('\n❌ Test failed - Double triggering detected:');
        console.log('  Expected 3 moves, got:', game.moveHistory.length);
        console.log('  Expected 3 triggers, got:', ui.botMovesTriggered);
    }
    
    console.log('');
}

function testBotStartsFirst() {
    console.log('🎯 TEST: Bot starts first scenario');
    console.log('=' .repeat(50));
    
    const { game, ui } = createTestSetup();
    
    // Set up scenario where bot should start
    game.playerConfig.lastWinner = game.PLAYER1; // Red won last
    game.resetGame(); // Yellow (bot) should start
    
    console.log('After reset with Red as last winner:');
    console.log('  Current player:', game.getPlayerName(game.currentPlayer), '(should be Yellow/Bot)');
    console.log('  Bot moves triggered during reset:', ui.botMovesTriggered, '(should be 1)');
    
    const starterOk = game.currentPlayer === game.PLAYER2;
    const triggerOk = ui.botMovesTriggered === 1;
    
    if (starterOk && triggerOk) {
        console.log('\n✅ Test passed - Bot starts correctly and only triggers once!');
    } else {
        console.log('\n❌ Test failed - Bot start issues:');
        console.log('  Correct starter:', starterOk);
        console.log('  Single trigger:', triggerOk);
    }
    
    console.log('');
}

// Run all tests
async function runTests() {
    await testTurnOrderAfterPlayerMove();
    testNoDoubleTriggering();
    testBotStartsFirst();
    
    console.log('🏁 All tests completed!');
    console.log('\n📊 Expected behavior:');
    console.log('✅ Each player move should trigger exactly ONE bot move');
    console.log('✅ Turn order should alternate correctly: Red → Yellow → Red → Yellow');
    console.log('✅ No double-triggering of AI moves');
    console.log('✅ Bot starts correctly when being the loser of previous game');
}

runTests();