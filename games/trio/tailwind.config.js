/**
 * Trio Tailwind Configuration
 * 
 * Extends the shared LogicCastle base configuration with
 * Trio-specific customizations and mathematical puzzle theme.
 */

const baseConfig = require('../../shared/tailwind.config.base.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  
  // Trio-specific content paths
  content: [
    "./index.html",
    "./js/**/*.js",
    "./js/components/**/*.js"
  ],
  
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      
      // Trio-specific theme extensions
      colors: {
        ...baseConfig.theme.extend.colors,
        
        // Enhanced Trio color palette
        'trio': {
          ...baseConfig.theme.extend.colors.trio,
          
          // Mathematical puzzle colors
          'purple': {
            50: '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#a855f7',
            600: '#9333ea',
            700: '#7c3aed',
            800: '#6b21a8',
            900: '#581c87'  // Primary purple
          },
          'violet': {
            50: '#f5f3ff',
            100: '#ede9fe',
            200: '#ddd6fe',
            300: '#c4b5fd',
            400: '#a78bfa',
            500: '#8b5cf6', // Primary violet
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95'
          },
          
          // Number system colors
          'number': {
            1: '#ef4444',  // red-500
            2: '#f97316',  // orange-500
            3: '#eab308',  // yellow-500
            4: '#22c55e',  // green-500
            5: '#06b6d4',  // cyan-500
            6: '#3b82f6',  // blue-500
            7: '#8b5cf6',  // violet-500
            8: '#ec4899',  // pink-500
            9: '#f59e0b'   // amber-500
          },
          
          // Grid and selection colors
          'grid-line': 'rgba(139, 92, 246, 0.3)',
          'cell-empty': 'rgba(255, 255, 255, 0.05)',
          'cell-hover': 'rgba(139, 92, 246, 0.15)',
          'cell-selected': 'rgba(139, 92, 246, 0.3)',
          'cell-valid': 'rgba(34, 197, 94, 0.2)',
          'cell-invalid': 'rgba(239, 68, 68, 0.2)',
          
          // Target and solution colors
          'target-bg': 'rgba(16, 185, 129, 0.2)',
          'target-border': 'rgba(16, 185, 129, 0.6)',
          'solution-glow': 'rgba(34, 197, 94, 0.8)'
        }
      },
      
      // Trio-specific animations
      animation: {
        ...baseConfig.theme.extend.animation,
        
        // Trio specific animations
        'cell-select': 'cell-select 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'trio-validate': 'trio-validate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'number-glow': 'number-glow 2s ease-in-out infinite',
        'solution-celebration': 'solution-celebration 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'calculation-reveal': 'calculation-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        
        // Trio specific keyframes
        'cell-select': {
          '0%': { 
            transform: 'scale(1)',
            background: 'rgba(255, 255, 255, 0.05)'
          },
          '50%': { 
            transform: 'scale(1.05)',
            background: 'rgba(139, 92, 246, 0.2)'
          },
          '100%': { 
            transform: 'scale(1)',
            background: 'rgba(139, 92, 246, 0.3)'
          }
        },
        'trio-validate': {
          '0%': { 
            transform: 'scale(1) rotate(0deg)',
            borderColor: 'rgba(139, 92, 246, 0.3)'
          },
          '25%': { 
            transform: 'scale(1.1) rotate(-5deg)',
            borderColor: 'rgba(34, 197, 94, 0.6)'
          },
          '50%': { 
            transform: 'scale(1.2) rotate(5deg)',
            borderColor: 'rgba(34, 197, 94, 0.8)'
          },
          '75%': { 
            transform: 'scale(1.1) rotate(-2deg)',
            borderColor: 'rgba(34, 197, 94, 0.6)'
          },
          '100%': { 
            transform: 'scale(1) rotate(0deg)',
            borderColor: 'rgba(34, 197, 94, 0.4)'
          }
        },
        'number-glow': {
          '0%, 100%': { 
            textShadow: '0 0 5px rgba(251, 191, 36, 0.5)'
          },
          '50%': { 
            textShadow: '0 0 15px rgba(251, 191, 36, 0.8)'
          }
        },
        'solution-celebration': {
          '0%': { 
            transform: 'scale(1) rotate(0deg)',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
          },
          '25%': { 
            transform: 'scale(1.1) rotate(5deg)',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.7)'
          },
          '50%': { 
            transform: 'scale(1.2) rotate(-5deg)',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.9)'
          },
          '75%': { 
            transform: 'scale(1.1) rotate(2deg)',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.7)'
          },
          '100%': { 
            transform: 'scale(1) rotate(0deg)',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
          }
        },
        'calculation-reveal': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px) scale(0.8)'
          },
          '50%': { 
            opacity: '0.7',
            transform: 'translateY(-5px) scale(1.1)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        }
      },
      
      // Trio 7×7 grid dimensions
      spacing: {
        ...baseConfig.theme.extend.spacing,
        'grid-size': '400px',    // 7×7 grid container
        'cell-size': '48px',     // Individual cell size
        'gap-size': '8px'        // Grid gap
      },
      
      // Trio-specific grid templates
      gridTemplateColumns: {
        'trio': 'repeat(7, 48px)'
      },
      gridTemplateRows: {
        'trio': 'repeat(7, 48px)'
      },
      
      // Mathematical typography
      fontFamily: {
        ...baseConfig.theme.extend.fontFamily,
        'mono-math': [
          '"SF Mono"',
          '"Monaco"', 
          '"Inconsolata"',
          '"Roboto Mono"',
          '"Source Code Pro"',
          'monospace'
        ]
      },
      
      fontSize: {
        'number': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'target': ['2rem', { lineHeight: '1.1', fontWeight: '700' }],
        'calculation': ['1.25rem', { lineHeight: '1.3', fontWeight: '500' }]
      }
    }
  },
  
  // Trio-specific safelist additions
  purge: {
    ...baseConfig.purge,
    safelist: [
      ...baseConfig.purge.safelist,
      
      // Trio specific classes
      'trio-cell',
      'trio-number',
      'trio-selected',
      'trio-valid',
      'trio-invalid',
      'trio-target',
      'trio-calculation',
      'trio-hint',
      
      // Number classes (1-9)
      'number-1', 'number-2', 'number-3',
      'number-4', 'number-5', 'number-6', 
      'number-7', 'number-8', 'number-9',
      
      // Mathematical operation classes
      'operation-add',
      'operation-subtract',
      'operation-multiply',
      'operation-equals',
      
      // Trio grid classes
      'grid-cols-trio',
      'grid-rows-trio',
      'trio-grid',
      
      // Difficulty classes
      'difficulty-kinderfreundlich',
      'difficulty-vollspektrum',
      'difficulty-strategisch',
      'difficulty-analytisch',
      
      // Trio animation classes
      'animate-cell-select',
      'animate-trio-validate',
      'animate-number-glow',
      'animate-solution-celebration',
      'animate-calculation-reveal'
    ]
  }
};