/**
 * L-Game Tailwind Configuration v4.x
 * 
 * Extends the shared LogicCastle base configuration with
 * L-Game-specific customizations and purple theme.
 */

import baseConfig from '../../shared/tailwind.config.base.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  
  // L-Game-specific content paths
  content: [
    "./index.html",
    "./index-production.html",
    "./js/**/*.js",
    "./js/components/**/*.js"
  ],
  
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      
      // L-Game-specific theme extensions
      colors: {
        ...baseConfig.theme.extend.colors,
        
        // Enhanced L-Game color palette (Purple-themed)
        'lgame': {
          // Main L-Game theme colors
          'bg-from': '#581c87', // purple-900
          'bg-via': '#7c3aed',  // violet-600
          'bg-to': '#312e81',   // indigo-900
          'accent': '#8b5cf6',  // violet-500
          
          // L-piece colors
          'player1': {
            50: '#fef7ff',
            100: '#fce7ff',
            200: '#f8d4fe',
            300: '#f2b2fc',
            400: '#e879f9',
            500: '#d946ef', // Primary player 1 (magenta/pink)
            600: '#c026d3',
            700: '#a21caf',
            800: '#86198f',
            900: '#701a75'
          },
          'player2': {
            50: '#fef3e2',
            100: '#fde68a',
            200: '#fcd34d',
            300: '#fbbf24',
            400: '#f59e0b', // Primary player 2 (amber/gold)
            500: '#d97706',
            600: '#b45309',
            700: '#92400e',
            800: '#78350f',
            900: '#451a03'
          },
          
          // Board specific colors
          'board-bg': '#4c1d95',      // violet-900
          'board-border': '#7c3aed',  // violet-600
          'cell-empty': 'rgba(255, 255, 255, 0.1)',
          'cell-hover': 'rgba(255, 255, 255, 0.2)',
          'cell-valid': 'rgba(34, 197, 94, 0.3)',   // emerald with opacity
          'cell-invalid': 'rgba(239, 68, 68, 0.3)',  // red with opacity
          
          // Neutral pieces
          'neutral': {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b', // Primary neutral color
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a'
          },
          
          // Victory effects
          'victory-glow': 'rgba(139, 92, 246, 0.8)',
          'victory-confetti': ['#d946ef', '#f59e0b', '#8b5cf6', '#06b6d4']
        }
      },
      
      // L-Game-specific animations
      animation: {
        ...baseConfig.theme.extend.animation,
        
        // L-Game specific animations
        'lpiece-place': 'lpiece-place 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'lpiece-rotate': 'lpiece-rotate 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'neutral-place': 'neutral-place 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'blockade-warning': 'blockade-warning 1s ease-in-out infinite',
        'orientation-hint': 'orientation-hint 0.5s ease-in-out'
      },
      
      keyframes: {
        ...baseConfig.theme.extend.keyframes,
        
        // L-Game specific keyframes
        'lpiece-place': {
          '0%': { 
            transform: 'scale(0) rotate(180deg) translateY(-50px)',
            opacity: '0'
          },
          '60%': { 
            transform: 'scale(1.2) rotate(90deg) translateY(10px)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'scale(1) rotate(0deg) translateY(0)',
            opacity: '1'
          }
        },
        'lpiece-rotate': {
          '0%': { 
            transform: 'rotate(0deg) scale(1)'
          },
          '50%': { 
            transform: 'rotate(45deg) scale(1.1)'
          },
          '100%': { 
            transform: 'rotate(90deg) scale(1)'
          }
        },
        'neutral-place': {
          '0%': { 
            transform: 'scale(0)',
            opacity: '0'
          },
          '70%': { 
            transform: 'scale(1.2)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'blockade-warning': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)'
          },
          '50%': { 
            boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)'
          }
        },
        'orientation-hint': {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.8)'
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1.1)'
          },
          '100%': { 
            opacity: '0.7',
            transform: 'scale(1)'
          }
        }
      },
      
      // L-Game board dimensions (4x4 grid)
      spacing: {
        ...baseConfig.theme.extend.spacing,
        'lgame-board-width': '320px',   // 4 columns × 80px
        'lgame-board-height': '320px',  // 4 rows × 80px
        'lpiece-size': '72px',          // Standard L-piece cell size
        'neutral-size': '50px'          // Neutral piece size
      },
      
      // L-Game-specific grid templates
      gridTemplateColumns: {
        '4': 'repeat(4, minmax(0, 1fr))',
        'lgame': 'repeat(4, 80px)'
      },
      gridTemplateRows: {
        '4': 'repeat(4, minmax(0, 1fr))',
        'lgame': 'repeat(4, 80px)'
      }
    }
  },
  
  // L-Game-specific safelist additions
  purge: {
    ...baseConfig.purge,
    safelist: [
      ...baseConfig.purge.safelist,
      
      // L-Game specific classes
      'lpiece',
      'lpiece-player1',
      'lpiece-player2',
      'neutral-piece',
      'orientation-0', 'orientation-1', 'orientation-2', 'orientation-3',
      'orientation-4', 'orientation-5', 'orientation-6', 'orientation-7',
      'blockade-threat',
      'winning-position',
      'move-preview',
      'selected-piece',
      'valid-placement',
      'invalid-placement',
      'corner-indicator',
      
      // L-Game grid classes
      'grid-cols-4',
      'grid-rows-4',
      'col-span-1',
      'col-span-2',
      'col-span-4',
      
      // L-Game responsive classes
      'xl:grid-cols-4',
      'xl:col-span-2',
      '2xl:col-span-2',
      
      // L-Game animation classes
      'animate-lpiece-place',
      'animate-lpiece-rotate',
      'animate-neutral-place',
      'animate-blockade-warning',
      'animate-orientation-hint'
    ]
  }
};