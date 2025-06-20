module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: false
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script' // Use script mode for browser compatibility
  },
  globals: {
    // Game classes that are globally available (writable for class definitions)
    Connect4Game: 'writable',
    Connect4AI: 'writable',
    Connect4UI: 'writable',
    Connect4Helpers: 'writable',
    TrioGame: 'writable',
    TrioAI: 'writable',
    TrioUI: 'writable',
    GobangGame: 'writable',
    GobangAI: 'writable',
    GobangUI: 'writable',
    GobangHelpers: 'writable',
    // Test framework
    TestSuite: 'readonly',
    runConnect4Tests: 'readonly',
    runTrioTests: 'readonly',
    runGobangTests: 'readonly',
    // Browser globals
    window: 'readonly',
    document: 'readonly',
    console: 'readonly'
  },
  rules: {
    // Error prevention rules
    'no-unused-vars': ['warn', { 
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_' 
    }],
    'no-undef': 'error',
    'no-redeclare': 'error',
    'no-use-before-define': ['error', { 
      functions: false, 
      classes: true, 
      variables: true 
    }],
    
    // Code quality rules
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'indent': ['error', 4, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    
    // Best practices
    'no-console': 'off', // Allow console for debugging
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Specific rules for preventing common issues
    'no-reserved-keys': 'off', // This rule doesn't exist in modern ESLint
    'no-restricted-globals': ['error', {
      name: 'eval',
      message: 'Use of eval() is forbidden. Use evalItem or similar instead.'
    }],
    
    // Game-specific rules
    'no-magic-numbers': ['warn', { 
      ignore: [-1, 0, 1, 2, 3, 4, 5, 6, 7], // Allow common game numbers
      ignoreArrayIndexes: true 
    }]
  },
  overrides: [
    {
      // Test files have different rules
      files: ['tests/**/*.js', '**/*test*.js'],
      globals: {
        createMockGameState: 'readonly',
        createEmptyBoard: 'readonly'
      },
      rules: {
        'no-magic-numbers': 'off' // Tests can use magic numbers
      }
    },
    {
      // Main game files
      files: ['games/**/*.js'],
      rules: {
        'max-lines': ['warn', 500],
        'max-lines-per-function': ['warn', 50],
        'complexity': ['warn', 10]
      }
    }
  ]
};