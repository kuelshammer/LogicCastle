import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',
    
    // Enable global test functions (describe, it, expect)
    globals: true,
    
    // Setup files to run before tests
    setupFiles: ['./tests/vitest-setup.js'],
    
    // Include test files
    include: [
      'tests/**/*.vitest.js',
      'tests/vitest/**/*.js'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['games/**/*.js'],
      exclude: [
        'node_modules/',
        'tests/',
        'scripts/',
        '**/*.config.js'
      ]
    },
    
    // Test timeout (CI-friendly)
    testTimeout: 10000,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'junit'],
    outputFile: {
      json: './test-results-vitest.json',
      junit: './test-results-vitest.xml'
    }
  }
});