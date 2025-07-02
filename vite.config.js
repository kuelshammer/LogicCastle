import { defineConfig } from 'vite';
import { resolve } from 'path';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  // Development server configuration
  server: {
    port: 8080,
    open: '/index.html'
  },

  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    // Generate manifest for asset hashing
    manifest: true,
    
    // Multi-page app configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        connect4: resolve(__dirname, 'games/connect4/index.html'),
        gomoku: resolve(__dirname, 'games/gomoku/index.html'),
        trio: resolve(__dirname, 'games/trio/index.html'),
        'design-system': resolve(__dirname, 'assets/demo-design-system.html')
      },
      
      // Optimize bundle splitting
      output: {
        manualChunks: {
          'game-base': ['./assets/js/game-base.js'],
          'coord-utils': ['./assets/js/coord-utils.js']
        }
      }
    },
    
    // Asset optimization
    assetsDir: 'assets',
    
    // Generate source maps for debugging
    sourcemap: true
  },

  // Plugin configuration
  plugins: [
    // Legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],

  // CSS configuration is handled by postcss.config.js

  // Asset handling
  assetsInclude: ['**/*.wasm'],

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@assets': resolve(__dirname, 'assets'),
      '@games': resolve(__dirname, 'games'),
      '@engine': resolve(__dirname, 'game_engine')
    }
  },

  // Define global constants
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },

  // Optimization
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [
      'game_engine/pkg/game_engine.js'
    ]
  },

  // Public directory
  publicDir: 'public',

  // Base URL for production
  base: process.env.NODE_ENV === 'production' ? '/LogicCastle/' : '/',

  // Development configuration
  esbuild: {
    // Drop console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
});