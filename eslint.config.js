import js from '@eslint/js';

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
        GobangGame: 'readonly',
        GobangAI: 'readonly',
        GobangUI: 'readonly',
        TrioGame: 'readonly',
        TrioAI: 'readonly',
        TrioUI: 'readonly',
        testSuite: 'readonly',
        testFramework: 'readonly'
      }
    },
    rules: {
      // Extend recommended rules
      ...js.configs.recommended.rules,
      
      // Customize rules for LogicCastle
      'no-unused-vars': ['warn', { 
        args: 'after-used',
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],
      'no-console': 'off', // Allow console.log for debugging
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': ['warn', 2],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      
      // Specific to game development
      'no-magic-numbers': 'off', // Games have many constants
      'no-alert': 'warn', // Discourage but allow alerts
      'no-eval': 'error', // Security
      'no-implied-eval': 'error',
      
      // Performance
      'no-inner-declarations': 'error',
      'no-loop-func': 'warn',
      
      // Code style
      'camelcase': ['warn', { properties: 'never' }],
      'consistent-return': 'warn',
      'curly': ['warn', 'multi-line'],
      'dot-notation': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-else-return': 'warn',
      'no-empty-function': 'warn',
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