/**
 * Vitest Setup File
 * Configures global environment for tests
 */

import { beforeEach, afterEach } from 'vitest';

// Note: Game class loading removed for now due to ES module complexity
// We'll focus on DOM-based tests and simple logic tests

// Configure JSDOM environment
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// Mock console methods for cleaner test output
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only log in verbose mode or for specific test messages
  if (process.env.VITEST_VERBOSE || args[0]?.includes?.('Test')) {
    originalConsoleLog(...args);
  }
};

// Global test environment setup
beforeEach(() => {
  // Clear DOM before each test
  document.body.innerHTML = '';
  
  // Reset any global state
  if (typeof window !== 'undefined') {
    window.CI_ENVIRONMENT = true;
    window.CI_TIMEOUT_MULTIPLIER = 1; // Faster for unit tests
  }
});

afterEach(() => {
  // Cleanup DOM after each test
  document.body.innerHTML = '';
  
  // Clear any event listeners
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    if (element.replaceWith) {
      const newElement = element.cloneNode(true);
      element.replaceWith(newElement);
    }
  });
});