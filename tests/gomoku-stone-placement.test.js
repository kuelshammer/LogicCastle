/**
 * Gomoku Stone Placement End-to-End Test
 * 
 * Tests the complete mouse click → stone placement pipeline using Puppeteer.
 * This test validates that mouse clicks result in visible stones on the board.
 * 
 * Tests:
 * 1. Page loads successfully with board
 * 2. Mouse clicks trigger stone placement
 * 3. Stones are visually positioned correctly
 * 4. Game state matches UI state
 * 5. Move sequence works correctly
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

describe('Gomoku Stone Placement - End-to-End', () => {
  let browser;
  let page;
  
  const GOMOKU_URL = `http://localhost:8080/games/gomoku/`;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI, false for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    });
    
    page = await browser.newPage();
    
    // Enable console logging for debugging
    page.on('console', msg => {
      const msgType = msg.type();
      if (msgType === 'error' || msgType === 'warning' || msg.text().includes('🎯') || msg.text().includes('✅') || msg.text().includes('❌')) {
        console.log(`[${msgType.toUpperCase()}] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should load Gomoku page and initialize board', async () => {
    await page.goto(GOMOKU_URL, { waitUntil: 'networkidle0' });
    
    // Wait for board to be created
    await page.waitForSelector('.game-board', { timeout: 10000 });
    
    // Verify board has correct number of intersections
    const intersectionCount = await page.$$eval('.intersection', els => els.length);
    expect(intersectionCount).toBe(225); // 15x15 board
    
    // Verify game and UI are initialized
    const gameInitialized = await page.evaluate(() => {
      return window.game && window.ui && typeof window.game.makeMove === 'function';
    });
    expect(gameInitialized).toBe(true);
    
    console.log('✅ Board loaded and initialized successfully');
  });

  test('should place stone on center intersection via mouse click', async () => {
    // Get center intersection (7,7)
    const centerIntersection = await page.$('[data-row="7"][data-col="7"]');
    expect(centerIntersection).toBeTruthy();
    
    // Get initial stone count
    const initialStoneCount = await page.$$eval('.stone', stones => stones.length);
    
    // Click center intersection
    await centerIntersection.click();
    
    // Wait for stone placement animation
    await page.waitForTimeout(500);
    
    // Verify stone was created
    const finalStoneCount = await page.$$eval('.stone', stones => stones.length);
    expect(finalStoneCount).toBe(initialStoneCount + 1);
    
    // Verify stone is positioned correctly
    const stonePosition = await page.evaluate(() => {
      const stones = document.querySelectorAll('.stone');
      const lastStone = stones[stones.length - 1];
      if (!lastStone) return null;
      
      const rect = lastStone.getBoundingClientRect();
      const boardRect = document.querySelector('.game-board').getBoundingClientRect();
      
      return {
        left: lastStone.style.left,
        top: lastStone.style.top,
        transform: lastStone.style.transform,
        className: lastStone.className,
        relativeX: rect.left - boardRect.left,
        relativeY: rect.top - boardRect.top
      };
    });
    
    expect(stonePosition).toBeTruthy();
    expect(stonePosition.className).toContain('stone');
    expect(stonePosition.className).toContain('black'); // First player is black
    expect(stonePosition.transform).toBe('translate(-50%, -50%)');
    
    console.log('✅ Stone placed successfully at center:', stonePosition);
  });

  test('should handle multiple stone placements correctly', async () => {
    // Test sequence: place stones at different positions
    const moves = [
      { row: 6, col: 7, expectedColor: 'white' },  // Player 2 (white)
      { row: 8, col: 7, expectedColor: 'black' },  // Player 1 (black)
      { row: 7, col: 6, expectedColor: 'white' },  // Player 2 (white)
    ];
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // Get intersection for this move
      const intersection = await page.$(`[data-row="${move.row}"][data-col="${move.col}"]`);
      expect(intersection).toBeTruthy();
      
      // Get stone count before move
      const beforeCount = await page.$$eval('.stone', stones => stones.length);
      
      // Click intersection
      await intersection.click();
      
      // Wait for stone placement
      await page.waitForTimeout(500);
      
      // Verify stone count increased
      const afterCount = await page.$$eval('.stone', stones => stones.length);
      expect(afterCount).toBe(beforeCount + 1);
      
      // Verify stone color matches expected player
      const lastStoneColor = await page.evaluate(() => {
        const stones = document.querySelectorAll('.stone');
        const lastStone = stones[stones.length - 1];
        return lastStone ? lastStone.className : null;
      });
      
      expect(lastStoneColor).toContain(move.expectedColor);
      
      console.log(`✅ Move ${i + 1}: Stone placed at (${move.row}, ${move.col}) with color ${move.expectedColor}`);
    }
  });

  test('should prevent placing stones on occupied positions', async () => {
    // Try to click on center intersection again (should be occupied)
    const centerIntersection = await page.$('[data-row="7"][data-col="7"]');
    
    const beforeCount = await page.$$eval('.stone', stones => stones.length);
    
    // Click occupied intersection
    await centerIntersection.click();
    
    // Wait a bit to ensure no stone is placed
    await page.waitForTimeout(300);
    
    // Verify stone count didn't change
    const afterCount = await page.$$eval('.stone', stones => stones.length);
    expect(afterCount).toBe(beforeCount);
    
    console.log('✅ Correctly prevented placing stone on occupied intersection');
  });

  test('should validate stone positioning accuracy', async () => {
    // Place a stone at a corner position to test edge cases
    const cornerMove = { row: 0, col: 0 }; // Top-left corner
    
    const cornerIntersection = await page.$(`[data-row="${cornerMove.row}"][data-col="${cornerMove.col}"]`);
    await cornerIntersection.click();
    
    await page.waitForTimeout(500);
    
    // Get positioning details
    const positionDetails = await page.evaluate(() => {
      const stones = document.querySelectorAll('.stone');
      const lastStone = stones[stones.length - 1];
      const board = document.querySelector('.game-board');
      
      if (!lastStone || !board) return null;
      
      const boardRect = board.getBoundingClientRect();
      const stoneRect = lastStone.getBoundingClientRect();
      
      // Calculate expected position for corner (0,0)
      const padding = boardRect.width * 0.0513;
      const expectedX = padding;
      const expectedY = padding;
      
      return {
        actualX: stoneRect.left - boardRect.left + (stoneRect.width / 2), // Center point
        actualY: stoneRect.top - boardRect.top + (stoneRect.height / 2),
        expectedX,
        expectedY,
        boardWidth: boardRect.width,
        padding
      };
    });
    
    expect(positionDetails).toBeTruthy();
    
    // Allow for small pixel differences (±5px tolerance)
    const tolerance = 5;
    expect(Math.abs(positionDetails.actualX - positionDetails.expectedX)).toBeLessThan(tolerance);
    expect(Math.abs(positionDetails.actualY - positionDetails.expectedY)).toBeLessThan(tolerance);
    
    console.log('✅ Stone positioning accuracy validated:', positionDetails);
  });

  test('should verify game state consistency', async () => {
    // Check that the game state matches the visible stones
    const gameState = await page.evaluate(() => {
      if (!window.game) return null;
      
      return {
        currentPlayer: window.game.getCurrentPlayer(),
        moveCount: window.game.moveHistory ? window.game.moveHistory.length : 0,
        isGameOver: window.game.gameOver || false,
        boardState: window.game.getBoard ? window.game.getBoard() : null
      };
    });
    
    const visibleStones = await page.$$eval('.stone', stones => stones.length);
    
    expect(gameState).toBeTruthy();
    expect(gameState.moveCount).toBe(visibleStones);
    expect(gameState.isGameOver).toBe(false); // Game should still be in progress
    
    console.log('✅ Game state consistency verified:', gameState);
  });

  test('should take screenshot for visual verification', async () => {
    // Take a screenshot of the final board state
    await page.screenshot({ 
      path: `${projectRoot}/tests/screenshots/gomoku-stone-placement-result.png`,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    
    console.log('📸 Screenshot saved for visual verification');
  });
});