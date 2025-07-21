/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index-production.html",
    "./js/**/*.js",
    "./js/components/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'confetti-fall': 'confetti-fall 3s ease-out forwards',
        'stone-place': 'stone-place 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'victory-pulse': 'victory-pulse 1s ease-in-out infinite',
        'game-over-overlay': 'game-over-overlay 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'board-entrance': 'board-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      colors: {
        'gomoku': {
          'board': '#DEB887',
          'line': '#8B4513',
          'black': '#2C3E50',
          'white': '#F8F9FA',
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
            900: '#78350f',
          }
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      scale: {
        '102': '1.02',
      }
    }
  },
  plugins: [],
  // Purge unused CSS in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      "./index-production.html",
      "./js/**/*.js",
      "./js/components/**/*.js"
    ],
    // Safelist important classes that might be added dynamically
    safelist: [
      'winning-stone',
      'threat-highlight',
      'assistance-highlight',
      'keyboard-focus',
      'placing',
      'placing-special',
      'confetti-particle',
      'victory-overlay',
      'opacity-0',
      'opacity-100',
      'scale-95',
      'scale-100',
      'translate-x-full',
      'translate-x-0',
      'hidden',
      'animate-confetti-fall',
      'animate-stone-place',
      'animate-victory-pulse',
      'animate-game-over-overlay',
      'animate-board-entrance'
    ]
  }
}