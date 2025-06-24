import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    // Apply to all JavaScript files
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        XMLHttpRequest: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',

        // Node.js globals (for scripts)
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',

        // Test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
        jest: 'readonly',

        // Game-specific globals
        Connect4Game: 'readonly',
        Connect4AI: 'readonly',
        Connect4UI: 'readonly',
        Connect4Helpers: 'readonly',
        Connect4ForkDetection: 'readonly',
        BaseBotStrategy: 'readonly',
        GobangGame: 'readonly',
        GobangAI: 'readonly',
        GobangUI: 'readonly',
        TrioGame: 'readonly',
        TrioAI: 'readonly',
        TrioUI: 'readonly',
        testSuite: 'readonly',
        testFramework: 'readonly',

        // Browser performance API
        performance: 'readonly',
        PerformanceObserver: 'readonly',

        // Browser globals for UI tests
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',

        // Development and test utilities
        Connect4TestUtils: 'readonly',
        StrategicBotScenarios: 'readonly',
        runBotVsBotWithLoserStarts: 'readonly',
        RealConnect4Game: 'readonly',
        RealConnect4AI: 'readonly',

        // Service Worker and Browser globals
        navigator: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        URL: 'readonly',
        Response: 'readonly',
        Event: 'readonly',

        // Test framework globals
        assert: 'readonly',
        PerformanceAssertions: 'readonly',
        TestEnvironment: 'readonly',
        runGoldenMasterTest: 'readonly',
        runUIIntegrationTests: 'readonly',
        runPerformanceBaseline: 'readonly',
        runBackendGameCoreTests: 'readonly',
        runBackendGameEdgeCasesTests: 'readonly',
        runBackendSimulationTests: 'readonly',
        runBackendEventsTests: 'readonly'
      }
    },
    rules: {
      // Extend recommended rules
      ...js.configs.recommended.rules,
      ...prettier.rules,

      // Customize rules for LogicCastle
      'no-unused-vars': 'off', // Disable unused vars warnings for development
      'no-console': 'off', // Allow console.log for debugging
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': ['warn', 2],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',

      // Specific to game development
      'no-magic-numbers': 'off', // Games have many constants
      'no-alert': 'off', // Allow alerts in UI code
      'no-redeclare': 'off', // Allow redeclaration in test files
      'camelcase': 'off', // Allow non-camelcase test variables
      'no-loop-func': 'off', // Allow functions in loops for event handling
      'consistent-return': 'off', // Allow missing return values
      'no-eval': 'off', // Allow eval in development/debug files
      'no-implied-eval': 'error',
      'no-case-declarations': 'off', // Allow declarations in case blocks
      'no-empty-function': 'off', // Allow empty functions in mocks

      // Performance
      'no-inner-declarations': 'error',

      // Code style
      'curly': ['warn', 'multi-line'],
      'dot-notation': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-else-return': 'warn',
      'no-lonely-if': 'warn',
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-template': 'warn'
    }
  },
  {
    // Specific rules for test files
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-magic-numbers': 'off',
      'max-len': 'off',
      'no-console': 'off'
    }
  },
  {
    // Specific rules for development files
    files: ['development/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-process-exit': 'off'
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      '*.min.js',
      'coverage/**',
      '.nyc_output/**'
    ]
  }
];
