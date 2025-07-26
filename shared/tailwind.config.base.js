/**
 * LogicCastle Base Tailwind Configuration v4.x
 * 
 * Shared configuration for all games providing consistent theming
 * while allowing game-specific customizations through extensions.
 * 
 * Usage: Games extend this config with their specific requirements
 * Example: export default { ...baseConfig, theme: { extend: { ... } } }
 */

/** @type {import('tailwindcss').Config} */
const baseConfig = {
  // Content paths - games should extend/override this
  content: [
    "./index.html",
    "./index-production.html", 
    "./js/**/*.js",
    "./js/components/**/*.js"
  ],
  
  theme: {
    extend: {
      // ===============================
      // 🎨 LOGICCASTLE COLOR SYSTEM
      // ===============================
      
      colors: {
        // Shared LogicCastle colors
        'lc-glass': {
          'bg-light': 'rgba(255, 255, 255, 0.15)',
          'bg-hover': 'rgba(255, 255, 255, 0.22)',
          'bg-dark': 'rgba(0, 0, 0, 0.1)',
          'border-light': 'rgba(255, 255, 255, 0.2)',
          'border-hover': 'rgba(255, 255, 255, 0.3)',
          'border-dark': 'rgba(255, 255, 255, 0.1)'
        },
        
        // Connect4 Theme Colors
        'connect4': {
          'bg-from': '#1e1b4b', // blue-900
          'bg-via': '#581c87',  // purple-900  
          'bg-to': '#312e81',   // indigo-900
          'accent': '#3b82f6',  // blue-500
          'player1': '#fbbf24', // amber-400 (yellow)
          'player2': '#ef4444'  // red-500
        },
        
        // Gomoku Theme Colors
        'gomoku': {
          'bg-from': '#78350f', // amber-900
          'bg-via': '#92400e',  // amber-800
          'bg-to': '#c2410c',   // orange-700
          'accent': '#f59e0b',  // amber-500
          'board': '#DEB887',   // burlywood
          'line': '#8B4513',    // saddle brown
          'black': '#2C3E50',   // dark slate
          'white': '#F8F9FA',   // light gray
          // Extended amber palette
          'amber': {
            50: '#fffbeb',
            100: '#fef3c7', 
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
          }
        },
        
        // Trio Theme Colors
        'trio': {
          'bg-from': '#581c87', // purple-900
          'bg-via': '#1e3a8a',  // blue-900
          'bg-to': '#312e81',   // indigo-900
          'accent': '#8b5cf6',  // violet-500
          'number': '#fbbf24',  // amber-400
          'target': '#10b981',  // emerald-500
          'grid': '#4c1d95'     // violet-900
        }
      },
      
      // ===============================
      // 📏 SPACING & SIZING SYSTEM
      // ===============================
      
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '100': '25rem',   // 400px
        '112': '28rem',   // 448px
        '128': '32rem'    // 512px
      },
      
      // Game board cell sizes
      width: {
        'cell-sm': '40px',  // Mobile
        'cell-md': '48px',  // Tablet  
        'cell-lg': '56px',  // Desktop
        'cell-xl': '64px'   // Large desktop
      },
      height: {
        'cell-sm': '40px',
        'cell-md': '48px', 
        'cell-lg': '56px',
        'cell-xl': '64px'
      },
      
      // ===============================
      // 🔤 TYPOGRAPHY SYSTEM
      // ===============================
      
      fontFamily: {
        'sans': [
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'BlinkMacSystemFont',
          '"Segoe UI"', 
          'Roboto', 
          '"Helvetica Neue"', 
          'Arial', 
          '"Noto Sans"', 
          'sans-serif'
        ],
        'mono': [
          'ui-monospace',
          'SFMono-Regular', 
          '"Cascadia Code"',
          '"Roboto Mono"',
          'Menlo',
          'Monaco', 
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace'
        ]
      },
      
      // ===============================
      // 🎆 ANIMATION SYSTEM
      // ===============================
      
      animation: {
        // Victory celebrations
        'confetti-fall': 'confetti-fall 2s ease-out forwards',
        'victory-pulse': 'victory-pulse 1s ease-in-out infinite',
        'victory-glow': 'victory-glow 2s ease-in-out infinite',
        
        // Game interactions
        'stone-place': 'stone-place 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'disc-drop': 'disc-drop 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'number-reveal': 'number-reveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        
        // UI transitions
        'modal-enter': 'modal-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'toast-slide': 'toast-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'board-entrance': 'board-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        
        // Glassmorphism effects
        'glass-hover': 'glass-hover 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'glass-shimmer': 'glass-shimmer 2s ease-in-out infinite'
      },
      
      keyframes: {
        // Victory effects
        'confetti-fall': {
          '0%': { 
            transform: 'translateY(-100vh) rotate(0deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0'
          }
        },
        'victory-pulse': {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.05)',
            opacity: '0.8'
          }
        },
        'victory-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(34, 197, 94, 0.8)' 
          }
        },
        
        // Game interactions
        'stone-place': {
          '0%': { 
            transform: 'scale(0) rotate(180deg)',
            opacity: '0'
          },
          '50%': { 
            transform: 'scale(1.1) rotate(90deg)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'scale(1) rotate(0deg)',
            opacity: '1'
          }
        },
        'disc-drop': {
          '0%': { 
            transform: 'translateY(-100px) scale(0.8)',
            opacity: '0'
          },
          '60%': { 
            transform: 'translateY(5px) scale(1.05)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(0) scale(1)',
            opacity: '1'
          }
        },
        'number-reveal': {
          '0%': { 
            transform: 'scale(0) rotateY(180deg)',
            opacity: '0'
          },
          '50%': { 
            transform: 'scale(1.2) rotateY(90deg)',
            opacity: '0.7'
          },
          '100%': { 
            transform: 'scale(1) rotateY(0deg)',
            opacity: '1'
          }
        },
        
        // UI transitions
        'modal-enter': {
          '0%': { 
            transform: 'scale(0.9) translateY(20px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          }
        },
        'toast-slide': {
          '0%': { 
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        'board-entrance': {
          '0%': { 
            transform: 'scale(0.8) rotateX(20deg)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1) rotateX(0deg)',
            opacity: '1'
          }
        },
        
        // Glassmorphism effects
        'glass-hover': {
          '0%': { 
            backdropFilter: 'blur(16px) saturate(180%)',
            transform: 'translateY(0)'
          },
          '100%': { 
            backdropFilter: 'blur(20px) saturate(200%)',
            transform: 'translateY(-2px)'
          }
        },
        'glass-shimmer': {
          '0%': { 
            backgroundPosition: '-200% center'
          },
          '100%': { 
            backgroundPosition: '200% center'
          }
        }
      },
      
      // ===============================
      // 🌫️ BACKDROP FILTER SYSTEM
      // ===============================
      
      backdropBlur: {
        'xs': '2px',
        'sm': '8px',
        'md': '16px', 
        'lg': '20px',
        'xl': '24px',
        '2xl': '40px'
      },
      
      backdropSaturate: {
        '150': '1.5',
        '180': '1.8',
        '200': '2'
      },
      
      backdropBrightness: {
        '105': '1.05',
        '110': '1.1',
        '115': '1.15'
      },
      
      // ===============================
      // 📐 TRANSFORM SYSTEM
      // ===============================
      
      scale: {
        '102': '1.02',
        '105': '1.05'
      },
      
      rotate: {
        '15': '15deg',
        '30': '30deg',
        '60': '60deg'
      },
      
      // ===============================
      // 🌊 BORDER RADIUS SYSTEM  
      // ===============================
      
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      }
    }
  },
  
  plugins: [],
  
  // ===============================
  // 🗑️ PURGE CONFIGURATION
  // ===============================
  
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      "./index.html",
      "./index-production.html",
      "./js/**/*.js", 
      "./js/components/**/*.js"
    ],
    // Safelist dynamic classes that might be added via JavaScript
    safelist: [
      // Victory effects
      'winning-stone',
      'winning-line',
      'victory-overlay',
      'confetti-particle',
      
      // Game interactions
      'stone-placing',
      'disc-dropping', 
      'number-revealing',
      'trio-selected',
      'trio-valid',
      'trio-invalid',
      
      // Assistance features
      'threat-highlight',
      'winning-highlight',
      'blocking-highlight',
      'assistance-highlight',
      
      // Keyboard navigation
      'keyboard-focus',
      'keyboard-selected',
      'drop-preview',
      'preview-player1',
      'preview-player2',
      
      // UI states
      'modal-open',
      'loading',
      'error-state',
      'success-state',
      
      // Opacity animations
      'opacity-0',
      'opacity-25',
      'opacity-50', 
      'opacity-75',
      'opacity-100',
      
      // Scale animations
      'scale-90',
      'scale-95',
      'scale-100',
      'scale-105',
      'scale-110',
      
      // Translation animations
      'translate-x-0',
      'translate-x-full',
      'translate-y-0',
      'translate-y-full',
      '-translate-y-2',
      
      // Display utilities
      'hidden',
      'block',
      'flex',
      'inline-flex',
      
      // Animation classes
      'animate-confetti-fall',
      'animate-victory-pulse', 
      'animate-stone-place',
      'animate-disc-drop',
      'animate-number-reveal',
      'animate-modal-enter',
      'animate-toast-slide',
      'animate-board-entrance',
      'animate-glass-hover',
      'animate-glass-shimmer'
    ]
  }
};

// ES6 Module Export for Tailwind v4.x
export default baseConfig;

// CommonJS Export for backward compatibility
module.exports = baseConfig;