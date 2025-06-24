/**
 * Performance Utilities - Performance monitoring and optimization tools
 *
 * Shared performance utilities for Connect4 modules
 */
/* global requestAnimationFrame */
import { PERFORMANCE_CONFIG } from './constants.js';

/**
 * Performance Timer for measuring execution time
 */
export class PerformanceTimer {
  constructor(name = 'Timer') {
    this.name = name;
    this.startTime = null;
    this.endTime = null;
    this.measurements = [];
  }

  /**
     * Start timing
     */
  start() {
    this.startTime = performance.now();
    this.endTime = null;
  }

  /**
     * Stop timing and return duration
     * @returns {number} Duration in milliseconds
     */
  stop() {
    if (this.startTime === null) {
      console.warn(`PerformanceTimer: ${this.name} was not started`);
      return 0;
    }

    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    this.measurements.push({
      startTime: this.startTime,
      endTime: this.endTime,
      duration,
      timestamp: new Date().toISOString()
    });

    return duration;
  }

  /**
     * Get current duration (without stopping)
     * @returns {number} Current duration in milliseconds
     */
  getCurrentDuration() {
    if (this.startTime === null) {
      return 0;
    }
    return performance.now() - this.startTime;
  }

  /**
     * Reset timer
     */
  reset() {
    this.startTime = null;
    this.endTime = null;
  }

  /**
     * Get last measurement
     * @returns {Object|null} Last measurement or null
     */
  getLastMeasurement() {
    return this.measurements.length > 0 ?
      this.measurements[this.measurements.length - 1] : null;
  }

  /**
     * Get average duration
     * @returns {number} Average duration in milliseconds
     */
  getAverageDuration() {
    if (this.measurements.length === 0) return 0;

    const total = this.measurements.reduce((sum, m) => sum + m.duration, 0);
    return total / this.measurements.length;
  }

  /**
     * Get all measurements
     * @returns {Array} Array of measurements
     */
  getAllMeasurements() {
    return [...this.measurements];
  }

  /**
     * Clear all measurements
     */
  clearMeasurements() {
    this.measurements = [];
  }
}

/**
 * Function performance profiler
 * @param {function} fn - Function to profile
 * @param {string} name - Name for the profiler
 * @returns {function} Wrapped function with profiling
 */
export function profileFunction(fn, name = 'Function') {
  const timer = new PerformanceTimer(name);

  return function(...args) {
    timer.start();
    const result = fn.apply(this, args);
    const duration = timer.stop();

    if (duration > 10) { // Only log slow functions
      console.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  };
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  constructor() {
    this.snapshots = [];
    this.maxSnapshots = 100;
  }

  /**
     * Take memory snapshot
     * @param {string} label - Label for the snapshot
     */
  snapshot(label = 'Snapshot') {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      const snapshot = {
        label,
        timestamp: new Date().toISOString(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };

      this.snapshots.push(snapshot);

      // Trim snapshots if too many
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots = this.snapshots.slice(-this.maxSnapshots);
      }

      return snapshot;
    }
    console.warn('MemoryTracker: Performance memory API not available');
    return null;

  }

  /**
     * Get memory usage difference between two snapshots
     * @param {number} startIndex - Start snapshot index
     * @param {number} endIndex - End snapshot index
     * @returns {Object} Memory difference
     */
  getDifference(startIndex = 0, endIndex = -1) {
    if (this.snapshots.length < 2) {
      return null;
    }

    const start = this.snapshots[startIndex];
    const end = this.snapshots[endIndex === -1 ? this.snapshots.length - 1 : endIndex];

    return {
      usedJSHeapSize: end.usedJSHeapSize - start.usedJSHeapSize,
      totalJSHeapSize: end.totalJSHeapSize - start.totalJSHeapSize,
      duration: new Date(end.timestamp).getTime() - new Date(start.timestamp).getTime()
    };
  }

  /**
     * Get all snapshots
     * @returns {Array} Array of memory snapshots
     */
  getSnapshots() {
    return [...this.snapshots];
  }

  /**
     * Clear all snapshots
     */
  clear() {
    this.snapshots = [];
  }
}

/**
 * Throttle function execution
 * @param {function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Throttled function
 */
export function throttle(fn, delay) {
  let lastExecution = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastExecution >= delay) {
      lastExecution = now;
      return fn.apply(this, args);
    }
    return undefined;
  };
}

/**
 * Debounce function execution
 * @param {function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId;

  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Create timeout with CI environment support
 * @param {number} baseTimeout - Base timeout in milliseconds
 * @returns {number} Adjusted timeout for environment
 */
export function createTimeout(baseTimeout = PERFORMANCE_CONFIG.DEFAULT_TIMEOUT) {
  const isCI = typeof process !== 'undefined' && process.env.CI;
  const multiplier = isCI ? PERFORMANCE_CONFIG.CI_TIMEOUT_MULTIPLIER : 1;

  return baseTimeout * multiplier;
}

/**
 * Promise with timeout
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} name - Name for error messages
 * @returns {Promise} Promise with timeout
 */
export function withTimeout(promise, timeout, name = 'Operation') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${name} timed out after ${timeout}ms`));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Batch process array with performance monitoring
 * @param {Array} items - Items to process
 * @param {function} processor - Processing function
 * @param {number} batchSize - Size of each batch
 * @param {number} delay - Delay between batches in milliseconds
 * @returns {Promise} Promise that resolves when all items are processed
 */
export async function batchProcess(items, processor, batchSize = 10, delay = 10) {
  const results = [];
  const timer = new PerformanceTimer('BatchProcess');

  timer.start();

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Add delay between batches to prevent blocking
    if (i + batchSize < items.length && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const duration = timer.stop();
  console.debug(`BatchProcess: Processed ${items.length} items in ${duration.toFixed(2)}ms`);

  return results;
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  constructor(budgets = {}) {
    this.budgets = {
      moveCalculation: 100,  // 100ms budget for move calculation
      boardRender: 16,       // 16ms budget for 60fps rendering
      aiThinking: 1000,      // 1s budget for AI thinking
      ...budgets
    };
    this.violations = [];
  }

  /**
     * Check if operation is within budget
     * @param {string} operation - Operation name
     * @param {number} duration - Actual duration in milliseconds
     * @returns {boolean} Whether operation is within budget
     */
  checkBudget(operation, duration) {
    const budget = this.budgets[operation];

    if (budget && duration > budget) {
      const violation = {
        operation,
        budget,
        actual: duration,
        overage: duration - budget,
        timestamp: new Date().toISOString()
      };

      this.violations.push(violation);
      console.warn(`Performance Budget Violation: ${operation} took ${duration.toFixed(2)}ms (budget: ${budget}ms)`);

      return false;
    }

    return true;
  }

  /**
     * Get budget violations
     * @returns {Array} Array of budget violations
     */
  getViolations() {
    return [...this.violations];
  }

  /**
     * Clear violations
     */
  clearViolations() {
    this.violations = [];
  }

  /**
     * Set budget for an operation
     * @param {string} operation - Operation name
     * @param {number} budget - Budget in milliseconds
     */
  setBudget(operation, budget) {
    this.budgets[operation] = budget;
  }
}

/**
 * Simple FPS monitor
 */
export class FPSMonitor {
  constructor() {
    this.frames = [];
    this.maxFrames = 60;
    this.isRunning = false;
  }

  /**
     * Start FPS monitoring
     */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.frames = [];
    this.measure();
  }

  /**
     * Stop FPS monitoring
     */
  stop() {
    this.isRunning = false;
  }

  /**
     * Measure frame rate
     * @private
     */
  measure() {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frames.push(now);

    // Keep only recent frames
    if (this.frames.length > this.maxFrames) {
      this.frames = this.frames.slice(-this.maxFrames);
    }

    requestAnimationFrame(() => this.measure());
  }

  /**
     * Get current FPS
     * @returns {number} Current FPS
     */
  getFPS() {
    if (this.frames.length < 2) return 0;

    const duration = this.frames[this.frames.length - 1] - this.frames[0];
    return (this.frames.length - 1) / (duration / 1000);
  }
}

// Global access for backward compatibility
if (typeof window !== 'undefined') {
  window.Connect4PerformanceUtils = {
    PerformanceTimer,
    MemoryTracker,
    PerformanceBudget,
    FPSMonitor,
    profileFunction,
    throttle,
    debounce,
    createTimeout,
    withTimeout,
    batchProcess
  };
}
