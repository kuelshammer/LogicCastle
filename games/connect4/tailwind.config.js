/**
 * Connect4 Tailwind Configuration v4.x
 * 
 * Extends the shared LogicCastle base configuration with
 * Connect4-specific customizations and theme.
 */

import baseConfig from '../../shared/tailwind.config.base.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  
  // Connect4-specific content paths
  content: [
    "./index.html",
    "./js/**/*.js",
    "./js/components/**/*.js",
    "./js/modules/**/*.js"
  ],
  
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      
      // Connect4-specific theme extensions
      colors: {
        ...baseConfig.theme.extend.colors,
        
        // Enhanced Connect4 color palette
        'connect4': {
          ...baseConfig.theme.extend.colors.connect4,
          
          // Player colors with variants
          'yellow': {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a', 
            300: '#fcd34d',
            400: '#fbbf24', // Primary yellow
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
          },
          'red': {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444', // Primary red
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d'
          },
          
          // Board specific colors
          'board-from': '#1e3a8a', // blue-800
          'board-to': '#312e81',   // indigo-900
          'slot-empty': 'rgba(255, 255, 255, 0.1)',
          'slot-hover': 'rgba(255, 255, 255, 0.2)',
          
          // Victory effects
          'victory-gold': '#fbbf24',
          'victory-glow': 'rgba(251, 191, 36, 0.5)'
        }
      },
      
      // Connect4-specific animations
      animation: {
        ...baseConfig.theme.extend.animation,
        
        // Connect4 specific animations
        'disc-fall': 'disc-fall 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'column-hover': 'column-hover 0.2s ease-out',
        'winning-line': 'winning-line 1s ease-in-out infinite',
        'keyboard-pulse': 'keyboard-pulse 2s ease-in-out infinite'
      },
      
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        
        // Connect4 specific keyframes
        'disc-fall': {
          '0%': { 
            transform: 'translateY(-200px) scale(0.8)',
            opacity: '0'
          },
          '70%': { 
            transform: 'translateY(10px) scale(1.1)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(0) scale(1)',
            opacity: '1'
          }
        },
        'column-hover': {
          '0%': { 
            background: 'rgba(255, 255, 255, 0.1)'
          },
          '100%': { 
            background: 'rgba(255, 255, 255, 0.2)'
          }
        },
        'winning-line': {
          '0%, 100%': { 
            boxShadow: '0 0 15px rgba(251, 191, 36, 0.8)'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(251, 191, 36, 1)'
          }
        },
        'keyboard-pulse': {
          '0%, 100%': { 
            borderColor: 'rgba(59, 130, 246, 0.5)',
            transform: 'scale(1)'
          },
          '50%': { 
            borderColor: 'rgba(59, 130, 246, 1)',
            transform: 'scale(1.02)'
          }
        }
      },
      
      // Connect4 board dimensions
      spacing: {
        ...baseConfig.theme.extend.spacing,
        'board-width': '448px',  // 7 columns × 64px
        'board-height': '384px', // 6 rows × 64px
        'disc-size': '56px'      // Standard disc size
      },
      
      // Connect4-specific grid templates
      gridTemplateColumns: {
        '7': 'repeat(7, minmax(0, 1fr))',
        'connect4': 'repeat(7, 64px)'
      },
      gridTemplateRows: {
        '6': 'repeat(6, minmax(0, 1fr))',
        'connect4': 'repeat(6, 64px)'
      }
    }
  },
  
  // Connect4-specific safelist additions
  purge: {
    ...baseConfig.purge,
    safelist: [
      ...baseConfig.purge.safelist,
      
      // Connect4 specific classes
      'disc',
      'yellow',
      'red', 
      'drop-preview',
      'preview-player1',
      'preview-player2',
      'winning-disc',
      'column-highlight',
      'keyboard-selected',
      'ai-suggestion',
      
      // Connect4 grid classes
      'grid-cols-7',
      'grid-rows-6',
      'col-span-1',
      'col-span-3',
      'col-span-7',
      
      // Connect4 responsive classes
      'xl:grid-cols-4',
      'xl:grid-cols-5',
      '2xl:grid-cols-5',
      'xl:col-span-3',
      '2xl:col-span-3',
      
      // Connect4 animation classes
      'animate-disc-fall',
      'animate-column-hover',
      'animate-winning-line',
      'animate-keyboard-pulse'
    ]
  }
};