/**
 * Global Test Setup for LogicCastle
 * 
 * Provides common setup, mocks, and utilities for all test files.
 * This file is automatically loaded before each test file.
 */

import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Global test environment setup
global.beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Mock browser APIs that JSDOM doesn't provide
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock performance API for consistent timing
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
};

// Mock window.matchMedia
Object.defineProperty(global.window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn(index => Object.keys(store)[index] || null),
    get length() { return Object.keys(store).length; }
  };
};

Object.defineProperty(global.window, 'localStorage', {
  value: createStorageMock()
});

Object.defineProperty(global.window, 'sessionStorage', {
  value: createStorageMock()
});

// Mock URL and URLSearchParams
global.URL = URL;
global.URLSearchParams = URLSearchParams;

// Common test utilities
export const TestUtils = {
  /**
   * Create a minimal DOM environment for testing
   */
  createTestDOM(htmlContent = '<div id="test-root"></div>') {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Environment</title>
          <style>
            .hidden { display: none; }
            .visible { display: block; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;
    global.Node = dom.window.Node;
    global.NodeList = dom.window.NodeList;
    global.SVGElement = dom.window.SVGElement;
    
    return dom;
  },

  /**
   * Clean up DOM environment
   */
  cleanupDOM(dom) {
    if (dom && dom.window) {
      dom.window.close();
    }
    
    delete global.document;
    delete global.window;
    delete global.HTMLElement;
    delete global.Element;
    delete global.Node;
    delete global.NodeList;
    delete global.SVGElement;
  },

  /**
   * Create a mock game instance
   */
  createMockGame(overrides = {}) {
    return {
      // Core game methods
      makeMove: vi.fn(),
      resetGame: vi.fn(),
      newGame: vi.fn(),
      undoMove: vi.fn(() => false),
      
      // Game state
      getCurrentPlayer: vi.fn(() => 1),
      getMoveCount: vi.fn(() => 0),
      getGameStatus: vi.fn(() => 'running'),
      isGameOver: vi.fn(() => false),
      getWinner: vi.fn(() => null),
      
      // Board state
      getBoardSize: vi.fn(() => 7),
      getBoard: vi.fn(() => []),
      getCellValue: vi.fn(() => 0),
      
      // Event system
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      
      // WASM integration
      isInitialized: true,
      wasmModule: null,
      
      ...overrides
    };
  },

  /**
   * Create a mock UI configuration
   */
  createMockConfig(overrides = {}) {
    return {
      elements: {
        required: ['gameBoard', 'gameStatus'],
        optional: ['moveCounter', 'currentPlayer']
      },
      modals: {
        help: { id: 'helpModal', closeKey: 'F1' }
      },
      keyboard: {
        'F1': 'toggleHelp',
        'r': 'resetGame'
      },
      messages: {
        position: 'top-right',
        duration: 3000,
        types: {
          info: { className: 'message-info', icon: 'ℹ️' },
          error: { className: 'message-error', icon: '❌' }
        }
      },
      ...overrides
    };
  },

  /**
   * Wait for next tick (useful for async operations)
   */
  async nextTick() {
    return new Promise(resolve => setTimeout(resolve, 0));
  },

  /**
   * Wait for animation frame
   */
  async nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  },

  /**
   * Simulate user events
   */
  simulateEvent(element, eventType, eventData = {}) {
    const event = new global.window.Event(eventType, {
      bubbles: true,
      cancelable: true,
      ...eventData
    });
    
    Object.assign(event, eventData);
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Simulate keyboard events
   */
  simulateKeyEvent(element, key, type = 'keydown', options = {}) {
    const event = new global.window.KeyboardEvent(type, {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Simulate mouse events
   */
  simulateMouseEvent(element, type = 'click', options = {}) {
    const event = new global.window.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: 0,
      clientY: 0,
      ...options
    });
    
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Assert element visibility
   */
  assertVisible(element, message = 'Element should be visible') {
    expect(element.style.display).not.toBe('none');
    expect(element.classList.contains('hidden')).toBe(false);
  },

  /**
   * Assert element is hidden
   */
  assertHidden(element, message = 'Element should be hidden') {
    const isHidden = 
      element.style.display === 'none' || 
      element.classList.contains('hidden') ||
      element.offsetParent === null;
    expect(isHidden).toBe(true);
  },

  /**
   * Get console output for testing
   */
  captureConsole() {
    const originalConsole = { ...console };
    const logs = [];
    
    ['log', 'info', 'warn', 'error'].forEach(method => {
      console[method] = vi.fn((...args) => {
        logs.push({ level: method, args });
        originalConsole[method](...args);
      });
    });
    
    return {
      logs,
      restore: () => {
        Object.assign(console, originalConsole);
      }
    };
  }
};

// Export for use in tests
export { vi };

// Make TestUtils globally available
global.TestUtils = TestUtils;