/**
 * Vitest Configuration for LogicCastle
 * 
 * Comprehensive test configuration for UI-Module System testing including
 * unit tests, integration tests, E2E tests, and coverage reporting.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test Environment
    environment: 'jsdom',
    globals: true,
    
    // Test File Patterns
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],
    exclude: [
      'tests/puppeteer/**/*',
      'tests/screenshots/**/*',
      '**/node_modules/**',
      '**/dist/**'
    ],
    
    // Setup Files
    setupFiles: [
      './tests/setup.js'
    ],
    
    // Coverage Configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './tests/coverage',
      exclude: [
        'tests/**',
        '**/node_modules/**',
        'game_engine/pkg/**',
        'dist/**',
        'vite.config.js',
        'vitest.config.js'
      ],
      include: [
        'assets/js/ui-modules/**/*.js',
        'games/*/js/**/*.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test Timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter Configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './tests/results/test-results.json',
      html: './tests/results/test-results.html'
    },
    
    // Parallel Testing
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Watch Configuration
    watch: false,
    
    // Mock Configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },
  
  // Resolve Configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './assets'),
      '@ui-modules': resolve(__dirname, './assets/js/ui-modules'),
      '@games': resolve(__dirname, './games'),
      '@tests': resolve(__dirname, './tests')
    }
  },
  
  // Define Global Constants
  define: {
    __TEST_ENV__: true
  }
});