/**
 * Rust/WASM Integration Tests
 * Tests the complete integration between Rust core and JavaScript UI
 */

import { describe, test, expect, beforeAll } from 'vitest';

describe('Rust/WASM Game Engine Integration', () => {
  let wasmModule;
  let Game, Player, TrioGame;

  beforeAll(async () => {
    // Import the WASM module
    const module = await import('../games/connect4/rust_logic/pkg/rust_logic.js');
    await module.default(); // Initialize WASM
    
    Game = module.Game;
    Player = module.Player;
    TrioGame = module.TrioGame;
    wasmModule = module;
  });

  describe('Connect4 Game Logic', () => {
    test('should create new Connect4 game', () => {
      const game = new Game(6, 7, 4, true);
      expect(game).toBeDefined();
      expect(game.get_board().length).toBe(42);
      expect(game.get_current_player()).toBe(Player.Yellow);
    });

    test('should make valid moves', () => {
      const game = new Game(6, 7, 4, true);
      
      expect(() => game.make_move_connect4_js(0)).not.toThrow();
      expect(game.get_current_player()).toBe(Player.Red);
      
      expect(() => game.make_move_connect4_js(1)).not.toThrow();
      expect(game.get_current_player()).toBe(Player.Yellow);
    });

    test('should detect wins', () => {
      const game = new Game(6, 7, 4, true);
      
      // Create horizontal win for Yellow
      game.make_move_connect4_js(0); // Yellow
      game.make_move_connect4_js(0); // Red
      game.make_move_connect4_js(1); // Yellow  
      game.make_move_connect4_js(1); // Red
      game.make_move_connect4_js(2); // Yellow
      game.make_move_connect4_js(2); // Red
      game.make_move_connect4_js(3); // Yellow - should win
      
      expect(game.check_win()).toBe(Player.Yellow);
      expect(game.is_game_over()).toBe(true);
    });

    test('should handle invalid moves', () => {
      const game = new Game(6, 7, 4, true);
      
      expect(() => game.make_move_connect4_js(7)).toThrow(); // Column out of bounds
    });
  });

  describe('Gobang Game Logic', () => {
    test('should create Gobang game', () => {
      const game = new Game(15, 15, 5, false); // 15x15, win 5, no gravity
      expect(game).toBeDefined();
      expect(game.get_board().length).toBe(225);
    });

    test('should place pieces at specific positions', () => {
      const game = new Game(15, 15, 5, false);
      
      expect(() => game.make_move_gobang_js(7, 7)).not.toThrow();
      expect(() => game.make_move_gobang_js(7, 8)).not.toThrow();
      
      const board = game.get_board();
      expect(board[7 * 15 + 7]).toBe(Player.Yellow);
      expect(board[7 * 15 + 8]).toBe(Player.Red);
    });
  });

  describe('Trio Game Logic', () => {
    test('should create Trio game', () => {
      const trio = new TrioGame(1); // Easy difficulty
      expect(trio).toBeDefined();
      expect(trio.get_board().length).toBe(49);
      expect(trio.get_target_number()).toBeGreaterThan(0);
      expect(trio.get_target_number()).toBeLessThanOrEqual(100);
    });

    test('should validate combinations', () => {
      const trio = new TrioGame(1);
      
      // This is probabilistic - the board is random
      // We just test that the API works
      const result = trio.check_combination(0, 0, 0, 1, 0, 2);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should handle rapid game creation', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const game = new Game(6, 7, 4, true);
        game.make_move_connect4_js(i % 7);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 100 games in under 100ms (very generous)
      expect(duration).toBeLessThan(100);
    });

    test('should handle complex Trio generation', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10; i++) {
        new TrioGame(3); // Hard difficulty
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should generate 10 hard Trio games in under 1000ms
      expect(duration).toBeLessThan(1000);
    });
  });
});