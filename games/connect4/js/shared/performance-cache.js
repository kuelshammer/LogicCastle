/**
 * Performance Cache System for Connect4
 *
 * Implements intelligent caching for AI move calculations and board evaluations.
 * Provides significant performance improvements for repeated positions.
 */

/**
 * LRU Cache implementation for game positions
 */
export class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

/**
 * Board position hasher for cache keys
 */
export class BoardHasher {
  static hash(board) { // Unused parameter prefixed
    // Create hash from board state
    let hash = '';
    for (const row of board) {
      for (const cell of row) {
        hash += cell.toString();
      }
    }
    return hash;
  }

  static hashWithDepth(board, depth, player) {
    return `${this.hash(board)}_${depth}_${player}`;
  }
}

/**
 * AI Move Cache
 */
export class AIMoveCache {
  constructor(maxSize = 500) {
    this.cache = new LRUCache(maxSize);
    this.hits = 0;
    this.misses = 0;
  }

  get(board, depth, player) {
    const key = BoardHasher.hashWithDepth(board, depth, player);
    const result = this.cache.get(key);

    if (result) {
      this.hits++;
      return result;
    }
    this.misses++;
    return null;

  }

  set(board, depth, player, move, score) {
    const key = BoardHasher.hashWithDepth(board, depth, player);
    this.cache.set(key, { move, score, timestamp: Date.now() });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) : 0,
      cacheSize: this.cache.size
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Board Evaluation Cache
 */
export class EvaluationCache {
  constructor(maxSize = 1000) {
    this.cache = new LRUCache(maxSize);
    this.stats = { hits: 0, misses: 0 };
  }

  get(board, player) {
    const key = `${BoardHasher.hash(board)}_${player}`;
    const result = this.cache.get(key);

    if (result !== null) {
      this.stats.hits++;
      return result;
    }
    this.stats.misses++;
    return null;

  }

  set(board, player, evaluation) {
    const key = `${BoardHasher.hash(board)}_${player}`;
    this.cache.set(key, evaluation);
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(1) : 0,
      cacheSize: this.cache.size
    };
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
}

/**
 * Memory Pool for Board Simulations
 */
export class BoardPool {
  constructor(poolSize = 50) {
    this.poolSize = poolSize;
    this.boards = [];
    this.inUse = new Set();

    // Pre-allocate boards
    for (let i = 0; i < poolSize; i++) {
      this.boards.push(this.createEmptyBoard());
    }
  }

  createEmptyBoard() {
    return Array(6).fill(null).map(() => Array(7).fill(0));
  }

  acquire() {
    // Find unused board
    for (let i = 0; i < this.boards.length; i++) {
      if (!this.inUse.has(i)) {
        this.inUse.add(i);
        return { board: this.boards[i], id: i };
      }
    }

    // If all boards in use, create new one (fallback)
    return { board: this.createEmptyBoard(), id: -1 };
  }

  release(boardId) {
    if (boardId >= 0) {
      this.inUse.delete(boardId);
      // Reset board to empty state
      const board = this.boards[boardId];
      for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
          board[row][col] = 0;
        }
      }
    }
  }

  getStats() {
    return {
      poolSize: this.poolSize,
      inUse: this.inUse.size,
      available: this.poolSize - this.inUse.size
    };
  }
}

/**
 * Global Performance Manager
 */
export class PerformanceManager {
  constructor() {
    this.aiMoveCache = new AIMoveCache(500);
    this.evaluationCache = new EvaluationCache(1000);
    this.boardPool = new BoardPool(50);
    this.enabled = true;
  }

  // Cache Management
  getMoveFromCache(board, depth, player) {
    if (!this.enabled) return null;
    return this.aiMoveCache.get(board, depth, player);
  }

  cacheMoveResult(board, depth, player, move, score) {
    if (!this.enabled) return;
    this.aiMoveCache.set(board, depth, player, move, score);
  }

  getEvaluationFromCache(board, _player) {
    if (!this.enabled) return null;
    return this.evaluationCache.get(board, _player);
  }

  cacheEvaluation(board, player, evaluation) {
    if (!this.enabled) return;
    this.evaluationCache.set(board, player, evaluation);
  }

  // Memory Pool Management
  acquireBoard() {
    return this.boardPool.acquire();
  }

  releaseBoard(boardId) {
    this.boardPool.release(boardId);
  }

  // Statistics and Management
  getPerformanceStats() {
    return {
      aiCache: this.aiMoveCache.getStats(),
      evaluationCache: this.evaluationCache.getStats(),
      boardPool: this.boardPool.getStats(),
      enabled: this.enabled
    };
  }

  clearCaches() {
    this.aiMoveCache.clear();
    this.evaluationCache.clear();
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Global instance
export const globalPerformanceManager = new PerformanceManager();
