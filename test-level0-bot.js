#!/usr/bin/env node
/**
 * Test script for Level 0 Smart Bot logic
 * Tests offensive and defensive AI behavior
 */

const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.document = {
    getElementById: () => null,
    createElement: () => ({ 
        style: {}, 
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        appendChild: () => {},
        textContent: ''
    }),
    addEventListener: () => {}
};
global.window = {};

console.log('🧪 Loading Connect4 classes...');

// Load game classes
const gameJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/game.js'), 'utf8');
const helpersJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/helpers.js'), 'utf8');
const aiJs = fs.readFileSync(path.join(__dirname, 'games/connect4/js/ai.js'), 'utf8');

// Execute in context
const context = {};
eval(`${gameJs}\ncontext.Connect4Game = Connect4Game;`);
eval(`${helpersJs}\ncontext.Connect4Helpers = Connect4Helpers;`);
eval(`${aiJs}\ncontext.Connect4AI = Connect4AI;`);

const { Connect4Game, Connect4Helpers, Connect4AI } = context;

console.log('✅ Classes loaded successfully\n');

// Mock UI for helpers
class MockUI {
    constructor() {
        this.playerHelpEnabled = {
            player1: false,
            player2: true  // Bot always has help enabled
        };
    }
    
    getCurrentPlayerHelpEnabled() {
        return this.game.currentPlayer === this.game.PLAYER1 
            ? this.playerHelpEnabled.player1 
            : this.playerHelpEnabled.player2;
    }
}

function createTestGame() {
    const game = new Connect4Game();
    const mockUI = new MockUI();
    mockUI.game = game;
    const helpers = new Connect4Helpers(game, mockUI);
    const ai = new Connect4AI('smart-random');
    
    return { game, helpers, ai, mockUI };
}

function printBoard(game) {
    console.log('Board state:');
    for (let row = 0; row < game.ROWS; row++) {
        let rowStr = '';
        for (let col = 0; col < game.COLS; col++) {
            const cell = game.board[row][col];
            if (cell === game.EMPTY) rowStr += '⚪';
            else if (cell === game.PLAYER1) rowStr += '🔴';
            else if (cell === game.PLAYER2) rowStr += '🟡';
        }
        console.log(`${rowStr} (row ${row})`);
    }
    console.log('0123456 (columns)\n');
}

function testScenario(name, setupFunc) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 TEST: ${name}`);
    console.log(`${'='.repeat(50)}`);
    
    const { game, helpers, ai } = createTestGame();
    
    // Setup the scenario
    setupFunc(game);
    
    printBoard(game);
    console.log(`Current player: ${game.currentPlayer === game.PLAYER1 ? '🔴 Player 1' : '🟡 Player 2 (Bot)'}`);
    
    // Get AI move
    const aiMove = ai.getBestMove(game, helpers);
    console.log(`🤖 Smart Bot chose column: ${aiMove} (${aiMove + 1})`);
    
    // Test what would happen
    if (aiMove !== null) {
        const result = game.simulateMove(aiMove);
        if (result.wouldWin) {
            console.log('🎉 This move would WIN the game!');
        } else {
            console.log('ℹ️  This move continues the game normally');
        }
    }
    
    console.log(`${'='.repeat(50)}\n`);
}

// TEST SCENARIOS

// Test 1: Bot can win in one move
testScenario('Bot has winning opportunity (Level 0)', (game) => {
    // Yellow (Bot) has 3 in bottom row, can win at column 3
    game.board[5][0] = game.PLAYER2; // Yellow
    game.board[5][1] = game.PLAYER2; // Yellow
    game.board[5][2] = game.PLAYER2; // Yellow
    // Column 3 is empty - Yellow can win here
    game.currentPlayer = game.PLAYER2; // Bot's turn
});

// Test 2: Bot must block opponent's winning threat
testScenario('Bot must block threat (Level 1)', (game) => {
    // Red has 3 in bottom row, would win at column 3
    game.board[5][0] = game.PLAYER1; // Red
    game.board[5][1] = game.PLAYER1; // Red
    game.board[5][2] = game.PLAYER1; // Red
    // Column 3 is empty - Red would win here, Bot must block
    game.currentPlayer = game.PLAYER2; // Bot's turn
});

// Test 3: Bot has winning move AND must block threat (winning should take priority)
testScenario('Bot wins vs blocks (Level 0 priority)', (game) => {
    // Red has 3 in bottom row (threat at column 3)
    game.board[5][0] = game.PLAYER1; // Red
    game.board[5][1] = game.PLAYER1; // Red  
    game.board[5][2] = game.PLAYER1; // Red
    
    // Yellow (Bot) has 3 in second row (winning at column 4)
    game.board[4][1] = game.PLAYER2; // Yellow
    game.board[4][2] = game.PLAYER2; // Yellow
    game.board[4][3] = game.PLAYER2; // Yellow
    // Column 4 empty - Yellow can win
    
    game.currentPlayer = game.PLAYER2; // Bot's turn
});

// Test 4: No critical moves - random play
testScenario('Random play (no critical moves)', (game) => {
    // Some scattered pieces, no immediate threats or wins
    game.board[5][1] = game.PLAYER1; // Red
    game.board[5][3] = game.PLAYER2; // Yellow
    game.board[4][1] = game.PLAYER2; // Yellow
    game.board[4][5] = game.PLAYER1; // Red
    
    game.currentPlayer = game.PLAYER2; // Bot's turn
});

// Test 5: Vertical winning opportunity
testScenario('Vertical winning opportunity', (game) => {
    // Yellow has 3 pieces stacked in column 2
    game.board[5][2] = game.PLAYER2; // Yellow (bottom)
    game.board[4][2] = game.PLAYER2; // Yellow
    game.board[3][2] = game.PLAYER2; // Yellow
    // Row 2, column 2 is empty - Yellow can win vertically
    
    game.currentPlayer = game.PLAYER2; // Bot's turn
});

// Test 6: Diagonal winning opportunity
testScenario('Diagonal winning opportunity', (game) => {
    // Create a diagonal setup for Yellow
    game.board[5][0] = game.PLAYER2; // Yellow (bottom-left)
    game.board[5][1] = game.PLAYER1; // Red (support)
    game.board[4][1] = game.PLAYER2; // Yellow
    game.board[5][2] = game.PLAYER1; // Red (support)
    game.board[4][2] = game.PLAYER1; // Red (support)
    game.board[3][2] = game.PLAYER2; // Yellow
    game.board[5][3] = game.PLAYER1; // Red (support)
    game.board[4][3] = game.PLAYER1; // Red (support)
    game.board[3][3] = game.PLAYER1; // Red (support)
    // Position 2,3 is empty - Yellow can win diagonally
    
    game.currentPlayer = game.PLAYER2; // Bot's turn
});

console.log('🏁 All tests completed!');
console.log('\n📊 Expected behavior:');
console.log('1. Bot should ALWAYS choose winning moves when available (Level 0)');
console.log('2. Bot should BLOCK opponent threats when no win available (Level 1)');
console.log('3. Bot should play RANDOMLY when no critical moves exist');
console.log('4. Winning moves should take PRIORITY over blocking moves');