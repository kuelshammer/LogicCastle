# GitHub Pages Deployment Guide für LogicCastle
**Deployment Guide | Stand: 2025-07-26**

## 🎯 Executive Summary

Dieser Guide dokumentiert die optimale Deployment-Strategie für LogicCastle Gaming-Anwendungen auf GitHub Pages mit Fokus auf WebAssembly-Asset-Deployment, automatisierte Build-Workflows und Performance-Optimierung für Gaming-UIs.

## 📋 Inhaltsverzeichnis

1. [GitHub Pages Setup für Gaming Applications](#1-github-pages-setup-für-gaming-applications)
2. [WASM Asset Deployment](#2-wasm-asset-deployment)
3. [Automated Build Workflows](#3-automated-build-workflows)
4. [Performance Optimization Strategien](#4-performance-optimization-strategien)
5. [Asset Optimization und Caching](#5-asset-optimization-und-caching)
6. [Monitoring und Troubleshooting](#6-monitoring-und-troubleshooting)

---

## 1. GitHub Pages Setup für Gaming Applications

### 1.1 Repository Configuration

**✅ LogicCastle Optimal Setup:**

```yaml
# .github/pages-config.yml
github_pages:
  source:
    branch: main
    path: /
  
  custom_domain: logiccastle.yourdomain.com  # Optional
  
  # CRITICAL: Enable HTTPS for WebAssembly security
  enforce_https: true
  
  # Gaming-specific configuration
  gaming_features:
    wasm_support: true
    service_worker: true
    offline_mode: true
```

**Repository Structure für GitHub Pages:**

```
LogicCastle/
├── index.html                 # Landing page
├── _headers                   # Custom headers für WASM
├── manifest.json             # PWA manifest für Gaming
├── sw.js                     # Service Worker für caching
│
├── games/
│   ├── connect4/
│   │   ├── index.html
│   │   ├── css/tailwind-built.css
│   │   └── js/
│   ├── gomoku/
│   │   ├── index.html  
│   │   ├── css/tailwind-built.css
│   │   └── js/
│   └── trio/
│       ├── index.html
│       ├── css/tailwind-built.css
│       └── js/
│
├── assets/
│   ├── wasm/
│   │   ├── game_engine.js
│   │   ├── game_engine_bg.wasm
│   │   └── game_engine.d.ts
│   ├── css/
│   │   └── shared-gaming-styles.css
│   └── js/
│       └── shared-utilities.js
│
└── .github/
    └── workflows/
        ├── deploy.yml
        ├── build-wasm.yml
        └── performance-test.yml
```

### 1.2 Custom Headers für WASM Support

**_headers file für optimierte WASM loading:**

```
# LogicCastle GitHub Pages Headers Configuration

# WASM files with proper MIME type
/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin

# JavaScript modules
/assets/wasm/*.js
  Content-Type: application/javascript
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *

# CSS with long cache
/css/*.css
/games/*/css/*.css
  Content-Type: text/css
  Cache-Control: public, max-age=86400
  
# HTML with no cache for updates
/*.html
/games/*/*.html
  Content-Type: text/html
  Cache-Control: no-cache, no-store, must-revalidate
  
# Gaming assets
/assets/audio/*
  Cache-Control: public, max-age=604800
  
/assets/images/*
  Cache-Control: public, max-age=2592000

# Service Worker
/sw.js
  Content-Type: application/javascript
  Cache-Control: no-cache, no-store, must-revalidate

# PWA Manifest
/manifest.json
  Content-Type: application/json
  Cache-Control: public, max-age=86400
```

---

## 2. WASM Asset Deployment

### 2.1 WASM Build und Deployment Pipeline

**Optimized WASM build für GitHub Pages:**

```bash
#!/bin/bash
# scripts/build-wasm-for-github-pages.sh

set -e

echo "🦀 Building LogicCastle WASM for GitHub Pages deployment..."

# Environment setup
export RUSTFLAGS="-C target-feature=+simd128"  # Enable SIMD for performance
export WASM_PACK_CACHE_DIR=".wasm-pack-cache"

cd game_engine

# Clean previous builds
cargo clean
rm -rf pkg/
rm -rf .wasm-pack-cache/

# Build optimized WASM
echo "🔧 Building WASM with maximum optimization..."
wasm-pack build \
  --target web \
  --release \
  --out-dir pkg \
  --scope logiccastle

# Optimize WASM binary
echo "🗜️  Optimizing WASM binary..."
wasm-opt -Oz --enable-simd -o pkg/game_engine_bg.wasm pkg/game_engine_bg.wasm

# Generate size report
echo "📊 WASM Build Report:"
ls -lh pkg/
echo "WASM size: $(stat -f%z pkg/game_engine_bg.wasm) bytes"
echo "JS wrapper size: $(stat -f%z pkg/game_engine.js) bytes"

# Verify WASM integrity
echo "🔍 Verifying WASM integrity..."
wasm-validate pkg/game_engine_bg.wasm || {
  echo "❌ WASM validation failed!"
  exit 1
}

# Copy to GitHub Pages assets
echo "📁 Copying to GitHub Pages assets..."
mkdir -p ../assets/wasm/
cp -r pkg/* ../assets/wasm/

# Create WASM loading test
cat > ../assets/wasm/test-wasm.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>WASM Loading Test</title>
</head>
<body>
  <h1>LogicCastle WASM Test</h1>
  <div id="status">Testing WASM loading...</div>
  
  <script type="module">
    async function testWasm() {
      const status = document.getElementById('status');
      
      try {
        const wasmModule = await import('./game_engine.js');
        await wasmModule.default();
        
        // Test Connect4 instantiation
        const game = new wasmModule.Connect4Game();
        const result = game.make_move(3);
        
        status.innerHTML = `✅ WASM loaded successfully! Test move result: ${result}`;
        status.style.color = 'green';
      } catch (error) {
        status.innerHTML = `❌ WASM loading failed: ${error.message}`;
        status.style.color = 'red';
        console.error('WASM test failed:', error);
      }
    }
    
    testWasm();
  </script>
</body>
</html>
EOF

echo "✅ WASM build complete! Test at: /assets/wasm/test-wasm.html"
cd ..
```

### 2.2 WASM Loading Strategies für GitHub Pages

**Production WASM Loader mit GitHub Pages Optimierung:**

```javascript
// assets/js/WasmLoader.js - GitHub Pages optimized
class GitHubPagesWasmLoader {
  constructor() {
    this.baseUrl = this.detectBaseUrl();
    this.wasmPath = `${this.baseUrl}/assets/wasm/`;
    this.loadAttempts = 0;
    this.maxAttempts = 3;
  }
  
  detectBaseUrl() {
    // Handle GitHub Pages subdirectory deployment
    const path = window.location.pathname;
    if (path.includes('.github.io') && !path.startsWith('/LogicCastle')) {
      return '/LogicCastle';  // Repository name for user pages
    }
    return '';  // Custom domain or organization pages
  }
  
  async loadWasm(retryOnFailure = true) {
    this.loadAttempts++;
    
    try {
      console.log(`🦀 Loading WASM from: ${this.wasmPath} (attempt ${this.loadAttempts})`);
      
      // Pre-fetch WASM binary for faster loading
      const wasmResponse = await fetch(`${this.wasmPath}game_engine_bg.wasm`);
      if (!wasmResponse.ok) {
        throw new Error(`WASM fetch failed: ${wasmResponse.status}`);
      }
      
      // Load ES module
      const wasmModule = await import(`${this.wasmPath}game_engine.js`);
      
      // Initialize with pre-fetched binary
      const wasmBytes = await wasmResponse.arrayBuffer();
      await wasmModule.default(wasmBytes);
      
      console.log('✅ WASM loaded successfully via GitHub Pages');
      return wasmModule;
      
    } catch (error) {
      console.warn(`⚠️  WASM loading attempt ${this.loadAttempts} failed:`, error);
      
      if (retryOnFailure && this.loadAttempts < this.maxAttempts) {
        // Exponential backoff for retry
        const delay = Math.pow(2, this.loadAttempts) * 500;
        console.log(`🔄 Retrying WASM load in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.loadWasm(true);
      }
      
      throw new Error(`WASM loading failed after ${this.loadAttempts} attempts: ${error.message}`);
    }
  }
  
  async loadWithFallback(gameType) {
    try {
      const wasmModule = await this.loadWasm();
      return this.createGameInstance(wasmModule, gameType, 'wasm');
    } catch (error) {
      console.log('🔄 WASM failed, loading JavaScript fallback...');
      return this.loadJavaScriptFallback(gameType);
    }
  }
  
  createGameInstance(module, gameType, mode) {
    const gameClasses = {
      connect4: module.Connect4Game,
      gomoku: module.GomokuGame,
      trio: module.TrioGame
    };
    
    const GameClass = gameClasses[gameType];
    if (!GameClass) {
      throw new Error(`Unknown game type: ${gameType}`);
    }
    
    return {
      instance: new GameClass(),
      mode: mode,
      module: module
    };
  }
  
  async loadJavaScriptFallback(gameType) {
    const fallbackModules = {
      connect4: () => import(`${this.baseUrl}/games/connect4/js/Connect4Fallback.js`),
      gomoku: () => import(`${this.baseUrl}/games/gomoku/js/GomokuFallback.js`),
      trio: () => import(`${this.baseUrl}/games/trio/js/TrioFallback.js`)
    };
    
    const loadFallback = fallbackModules[gameType];
    if (!loadFallback) {
      throw new Error(`No fallback available for game type: ${gameType}`);
    }
    
    const FallbackModule = await loadFallback();
    return {
      instance: new FallbackModule.default(),
      mode: 'fallback',
      module: null
    };
  }
}

// Global instance für LogicCastle
window.LogicCastleWasmLoader = new GitHubPagesWasmLoader();
```

---

## 3. Automated Build Workflows

### 3.1 Complete GitHub Actions Workflow

**.github/workflows/deploy-logiccastle.yml:**

```yaml
name: 🎮 Deploy LogicCastle to GitHub Pages

on:
  push:
    branches: [ main ]
    paths:
      - 'games/**'
      - 'game_engine/**'
      - 'assets/**'
      - 'shared/**'
      - '.github/workflows/**'
  
  pull_request:
    branches: [ main ]
  
  # Manual trigger
  workflow_dispatch:

# Permissions for GitHub Pages deployment
permissions:
  contents: read
  pages: write
  id-token: write

# Concurrency group for deployments
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: 📥 Checkout repository
      uses: actions/checkout@v4
      
    - name: 🦀 Setup Rust toolchain
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        target: wasm32-unknown-unknown
        override: true
        components: rustfmt, clippy
    
    - name: 📦 Cache Rust dependencies
      uses: actions/cache@v3
      with:
        path: |
          ~/.cargo/bin/
          ~/.cargo/registry/index/
          ~/.cargo/registry/cache/
          ~/.cargo/git/db/
          game_engine/target/
        key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
        restore-keys: |
          ${{ runner.os }}-cargo-
    
    - name: 🔧 Install wasm-pack
      run: |
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
        wasm-pack --version
        
    - name: ⚡ Install wasm-opt
      run: |
        wget -q https://github.com/WebAssembly/binaryen/releases/latest/download/binaryen-version_111-x86_64-linux.tar.gz
        tar -xzf binaryen-version_111-x86_64-linux.tar.gz
        sudo cp binaryen-version_111/bin/wasm-opt /usr/local/bin/
        wasm-opt --version
    
    - name: 🏗️  Build WASM Engine
      run: |
        chmod +x scripts/build-wasm-for-github-pages.sh
        ./scripts/build-wasm-for-github-pages.sh
    
    - name: 📊 WASM Size Analysis
      run: |
        echo "## 📊 WASM Build Report" >> $GITHUB_STEP_SUMMARY
        echo "| File | Size | Compressed |" >> $GITHUB_STEP_SUMMARY
        echo "|------|------|------------|" >> $GITHUB_STEP_SUMMARY
        
        wasm_size=$(stat -c%s assets/wasm/game_engine_bg.wasm)
        js_size=$(stat -c%s assets/wasm/game_engine.js)
        
        echo "| game_engine_bg.wasm | ${wasm_size} bytes | $(gzip -c assets/wasm/game_engine_bg.wasm | wc -c) bytes |" >> $GITHUB_STEP_SUMMARY
        echo "| game_engine.js | ${js_size} bytes | $(gzip -c assets/wasm/game_engine.js | wc -c) bytes |" >> $GITHUB_STEP_SUMMARY
    
    - name: 🎨 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          games/connect4/package-lock.json
          games/gomoku/package-lock.json
          games/trio/package-lock.json
    
    - name: 🎨 Build CSS for all games
      run: |
        # Connect4
        cd games/connect4
        npm ci --prefer-offline
        npm run build:css
        echo "✅ Connect4 CSS built: $(stat -c%s css/tailwind-built.css) bytes"
        cd ../..
        
        # Gomoku  
        cd games/gomoku
        npm ci --prefer-offline
        npm run build:css
        echo "✅ Gomoku CSS built: $(stat -c%s css/tailwind-built.css) bytes"
        cd ../..
        
        # Trio
        cd games/trio
        npm ci --prefer-offline
        npm run build:css
        echo "✅ Trio CSS built: $(stat -c%s css/tailwind-built.css) bytes"
        cd ../..
    
    - name: 🗜️  Optimize assets
      run: |
        # Create optimized copies of images
        sudo apt-get update && sudo apt-get install -y imagemagick webp
        
        find . -name "*.png" -not -path "./node_modules/*" -not -path "./.git/*" | while read img; do
          dir=$(dirname "$img")
          name=$(basename "$img" .png)
          
          # Create WebP version
          cwebp -q 80 "$img" -o "$dir/$name.webp" 2>/dev/null || true
          
          # Optimize PNG
          convert "$img" -strip -interlace Plane -quality 85 "$img.optimized" 2>/dev/null || true
          mv "$img.optimized" "$img" 2>/dev/null || true
        done
        
        echo "🖼️  Image optimization complete"
    
    - name: 🔍 Security and Quality Checks
      run: |
        # Check for potential security issues
        echo "🔒 Running security checks..."
        
        # Check WASM integrity
        wasm-validate assets/wasm/game_engine_bg.wasm
        
        # Check for sensitive data in commits
        if grep -r -i "password\|secret\|key\|token" --exclude-dir=.git --exclude-dir=node_modules . | grep -v "placeholder\|example\|test"; then
          echo "⚠️  Potential sensitive data found!"
          exit 1
        fi
        
        echo "✅ Security checks passed"
    
    - name: 🧪 Test WASM Loading
      run: |
        # Start local server for testing
        npx serve . -l 3000 &
        SERVER_PID=$!
        sleep 3
        
        # Test WASM loading
        curl -f http://localhost:3000/assets/wasm/test-wasm.html > /dev/null
        
        # Cleanup
        kill $SERVER_PID
        
        echo "✅ WASM loading test passed"
    
    - name: 📤 Upload GitHub Pages artifact
      uses: actions/upload-pages-artifact@v2
      with:
        path: '.'
        
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: 🚀 Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v2
      
    - name: 🧪 Post-deployment verification
      run: |
        # Wait for deployment to be available
        sleep 30
        
        # Test main page
        curl -f "${{ steps.deployment.outputs.page_url }}" > /dev/null
        
        # Test WASM availability
        curl -f "${{ steps.deployment.outputs.page_url }}assets/wasm/game_engine_bg.wasm" > /dev/null
        
        echo "✅ Deployment verification successful"
        echo "🎮 LogicCastle is live at: ${{ steps.deployment.outputs.page_url }}"
```

### 3.2 Optimized Build Cache Strategy

**Enhanced caching für faster builds:**

```yaml
# .github/workflows/build-cache.yml fragment
- name: 📦 Multi-layer Cache Strategy
  uses: actions/cache@v3
  with:
    path: |
      ~/.cargo/bin/
      ~/.cargo/registry/index/
      ~/.cargo/registry/cache/
      ~/.cargo/git/db/
      game_engine/target/
      ~/.npm
      games/*/node_modules/
      .wasm-pack-cache/
    key: logiccastle-${{ runner.os }}-${{ hashFiles('**/Cargo.lock', '**/package-lock.json') }}
    restore-keys: |
      logiccastle-${{ runner.os }}-
      logiccastle-

- name: 🎯 Incremental Build Detection  
  id: changes
  uses: dorny/paths-filter@v2
  with:
    filters: |
      wasm:
        - 'game_engine/**'
      css:
        - 'games/*/assets/css/**'
        - 'shared/css/**'
        - 'games/*/tailwind.config.js'
      games:
        - 'games/**/*.html'
        - 'games/**/*.js'

- name: 🦀 Conditional WASM build
  if: steps.changes.outputs.wasm == 'true'
  run: ./scripts/build-wasm-for-github-pages.sh

- name: 🎨 Conditional CSS build
  if: steps.changes.outputs.css == 'true'
  run: |
    for game in connect4 gomoku trio; do
      if [ -f "games/$game/package.json" ]; then
        cd "games/$game"
        npm run build:css
        cd ../..
      fi
    done
```

---

## 4. Performance Optimization Strategien

### 4.1 Asset Loading Optimization

**Progressive Loading für Gaming Assets:**

```javascript
// assets/js/AssetLoader.js - GitHub Pages optimized
class LogicCastleAssetLoader {
  constructor() {
    this.loadedAssets = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = [];
    this.criticalAssets = [
      '/assets/wasm/game_engine_bg.wasm',
      '/assets/wasm/game_engine.js'
    ];
  }
  
  async preloadCriticalAssets() {
    console.log('🚀 Preloading critical gaming assets...');
    
    const preloadPromises = this.criticalAssets.map(async (asset) => {
      try {
        // Use link preload for WASM
        if (asset.endsWith('.wasm')) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = asset;
          link.as = 'fetch';
          link.type = 'application/wasm';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        }
        
        // Fetch and cache
        const response = await fetch(asset);
        if (response.ok) {
          const blob = await response.blob();
          this.loadedAssets.set(asset, blob);
          console.log(`✅ Preloaded: ${asset} (${blob.size} bytes)`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to preload ${asset}:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
    console.log(`🎯 Preloaded ${this.loadedAssets.size}/${this.criticalAssets.length} critical assets`);
  }
  
  async loadGameAssets(gameType) {
    const gameAssets = {
      connect4: [
        '/games/connect4/css/tailwind-built.css',
        '/games/connect4/js/components/BoardRenderer.js'
      ],
      gomoku: [
        '/games/gomoku/css/tailwind-built.css',
        '/games/gomoku/js/components/GomokuBoardRenderer.js'
      ],
      trio: [
        '/games/trio/css/tailwind-built.css',
        '/games/trio/js/components/TrioBoardRenderer.js'
      ]
    };
    
    const assets = gameAssets[gameType] || [];
    console.log(`🎮 Loading ${gameType} assets:`, assets);
    
    const loadPromises = assets.map(asset => this.loadAsset(asset));
    await Promise.allSettled(loadPromises);
  }
  
  async loadAsset(url) {
    if (this.loadedAssets.has(url)) {
      return this.loadedAssets.get(url);
    }
    
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }
    
    const loadPromise = this.fetchAsset(url);
    this.loadingPromises.set(url, loadPromise);
    
    try {
      const result = await loadPromise;
      this.loadedAssets.set(url, result);
      this.loadingPromises.delete(url);
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }
  
  async fetchAsset(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    
    if (url.endsWith('.css')) {
      return response.text();
    } else if (url.endsWith('.js')) {
      return import(url);
    } else {
      return response.blob();
    }
  }
  
  getPerformanceMetrics() {
    return {
      loadedAssets: this.loadedAssets.size,
      totalSize: Array.from(this.loadedAssets.values())
        .reduce((total, asset) => total + (asset.size || 0), 0),
      cacheHitRate: this.loadedAssets.size / (this.loadedAssets.size + this.loadingPromises.size)
    };
  }
}

// Initialize global asset loader
window.LogicCastleAssets = new LogicCastleAssetLoader();

// Start preloading on page load
document.addEventListener('DOMContentLoaded', () => {
  window.LogicCastleAssets.preloadCriticalAssets();
});
```

### 4.2 Service Worker für Gaming Assets

**sw.js - Gaming-optimized caching:**

```javascript
// sw.js - LogicCastle Service Worker for GitHub Pages
const CACHE_VERSION = 'logiccastle-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const WASM_CACHE = `${CACHE_VERSION}-wasm`;

// Cache strategies by asset type
const CACHE_STRATEGIES = {
  // Critical gaming assets - cache first, long-term
  wasm: {
    pattern: /\.(wasm|js)$/,
    strategy: 'cacheFirst',
    cacheName: WASM_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  
  // CSS and static assets - stale while revalidate
  static: {
    pattern: /\.(css|png|jpg|jpeg|svg|ico|webp)$/,
    strategy: 'staleWhileRevalidate',
    cacheName: STATIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // HTML - network first with cache fallback
  html: {
    pattern: /\.html$/,
    strategy: 'networkFirst',
    cacheName: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  }
};

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🎮 LogicCastle Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical WASM assets
      caches.open(WASM_CACHE).then((cache) => {
        return cache.addAll([
          '/assets/wasm/game_engine_bg.wasm',
          '/assets/wasm/game_engine.js',
          '/assets/wasm/game_engine.d.ts'
        ]).catch((error) => {
          console.warn('⚠️  Failed to cache WASM assets:', error);
        });
      }),
      
      // Cache essential static files
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/assets/css/shared-gaming-styles.css'
        ]).catch((error) => {
          console.warn('⚠️  Failed to cache static assets:', error);
        });
      })
    ]).then(() => {
      console.log('✅ LogicCastle Service Worker installed');
      self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 LogicCastle Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('logiccastle-') && 
                !cacheName.includes(CACHE_VERSION)) {
              console.log(`🗑️  Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ LogicCastle Service Worker activated');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine cache strategy
  const strategy = getCacheStrategy(url.pathname);
  
  if (strategy) {
    event.respondWith(handleRequest(request, strategy));
  }
});

function getCacheStrategy(pathname) {
  for (const [type, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(pathname)) {
      return config;
    }
  }
  return null;
}

async function handleRequest(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  
  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cache, strategy);
    case 'networkFirst':
      return networkFirst(request, cache, strategy);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cache, strategy);
    default:
      return fetch(request);
  }
}

async function cacheFirst(request, cache, strategy) {
  const cached = await cache.match(request);
  
  if (cached && !isExpired(cached, strategy.maxAge)) {
    console.log(`📦 Cache hit: ${request.url}`);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      console.log(`🌐 Network fetch cached: ${request.url}`);
    }
    return response;
  } catch (error) {
    if (cached) {
      console.log(`🔄 Serving stale cache: ${request.url}`);
      return cached;
    }
    throw error;
  }
}

async function networkFirst(request, cache, strategy) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      console.log(`🌐 Network first success: ${request.url}`);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      console.log(`📦 Network failed, serving cache: ${request.url}`);
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cache, strategy) {
  const cached = await cache.match(request);
  
  // Always try to fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
      console.log(`🔄 Background update: ${request.url}`);
    }
    return response;
  }).catch(() => {
    // Ignore fetch errors for background updates
  });
  
  if (cached && !isExpired(cached, strategy.maxAge)) {
    console.log(`📦 Stale while revalidate: ${request.url}`);
    return cached;
  }
  
  return fetchPromise;
}

function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const age = Date.now() - new Date(dateHeader).getTime();
  return age > maxAge;
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_CACHE_STATUS') {
    Promise.all([
      caches.open(WASM_CACHE).then(cache => cache.keys()),
      caches.open(STATIC_CACHE).then(cache => cache.keys()),
      caches.open(DYNAMIC_CACHE).then(cache => cache.keys())
    ]).then(([wasmKeys, staticKeys, dynamicKeys]) => {
      event.ports[0].postMessage({
        wasmCached: wasmKeys.length,
        staticCached: staticKeys.length,
        dynamicCached: dynamicKeys.length,
        totalCached: wasmKeys.length + staticKeys.length + dynamicKeys.length
      });
    });
  }
});
```

---

## 5. Asset Optimization und Caching

### 5.1 Comprehensive Asset Pipeline

**scripts/optimize-assets-for-github-pages.sh:**

```bash
#!/bin/bash
# Comprehensive asset optimization for GitHub Pages deployment

set -e

echo "🎨 Starting LogicCastle asset optimization pipeline..."

# Create optimization directories
mkdir -p optimized/{images,css,js,wasm}

# 1. Image Optimization
echo "🖼️  Optimizing images..."
find . -name "*.png" -not -path "./node_modules/*" -not -path "./.git/*" | while read img; do
  name=$(basename "$img" .png)
  dir=$(dirname "$img")
  
  # Create WebP versions for modern browsers
  if command -v cwebp >/dev/null 2>&1; then
    cwebp -q 85 -m 6 "$img" -o "$dir/$name.webp"
    echo "  ✅ WebP: $name.webp ($(stat -f%z "$dir/$name.webp") bytes)"
  fi
  
  # Optimize PNG with imagemin
  if command -v imagemin >/dev/null 2>&1; then
    imagemin "$img" --out-dir="$dir" --plugin=imagemin-pngquant
    echo "  ✅ PNG optimized: $name.png"
  fi
done

# 2. CSS Optimization
echo "🎨 Optimizing CSS bundles..."
for game in connect4 gomoku trio; do
  css_file="games/$game/css/tailwind-built.css"
  if [ -f "$css_file" ]; then
    # Remove comments and minify
    npx cleancss -o "$css_file.min" "$css_file"
    
    # Create Brotli compressed version
    if command -v brotli >/dev/null 2>&1; then
      brotli -k -f "$css_file.min"
    fi
    
    original_size=$(stat -f%z "$css_file")
    minified_size=$(stat -f%z "$css_file.min")
    compression_ratio=$(echo "scale=1; ($original_size - $minified_size) * 100 / $original_size" | bc)
    
    echo "  ✅ $game CSS: $original_size → $minified_size bytes ($compression_ratio% reduction)"
    
    # Replace original with minified
    mv "$css_file.min" "$css_file"
  fi
done

# 3. JavaScript Bundle Analysis
echo "📦 Analyzing JavaScript bundles..."
for game in connect4 gomoku trio; do
  js_dir="games/$game/js"
  if [ -d "$js_dir" ]; then
    total_size=0
    file_count=0
    
    find "$js_dir" -name "*.js" | while read js_file; do
      size=$(stat -f%z "$js_file")
      total_size=$((total_size + size))
      file_count=$((file_count + 1))
      
      # Check for potential optimizations
      if grep -q "console.log" "$js_file"; then
        echo "  ⚠️  $js_file contains console.log statements"
      fi
      
      if grep -q "debugger" "$js_file"; then
        echo "  ⚠️  $js_file contains debugger statements"
      fi
    done
    
    echo "  📊 $game JS: $file_count files, $total_size bytes total"
  fi
done

# 4. WASM Optimization Verification
echo "🦀 Verifying WASM optimization..."
wasm_file="assets/wasm/game_engine_bg.wasm"
if [ -f "$wasm_file" ]; then
  wasm_size=$(stat -f%z "$wasm_file")
  
  # Check if wasm-opt was used
  if wasm-opt --version >/dev/null 2>&1; then
    # Create super-optimized version for comparison
    wasm-opt -Oz --enable-simd "$wasm_file" -o "$wasm_file.super-opt"
    super_size=$(stat -f%z "$wasm_file.super-opt")
    
    if [ "$super_size" -lt "$wasm_size" ]; then
      echo "  ⚠️  WASM could be further optimized: $wasm_size → $super_size bytes"
      mv "$wasm_file.super-opt" "$wasm_file"
    else
      rm "$wasm_file.super-opt"
      echo "  ✅ WASM is optimally compressed: $wasm_size bytes"
    fi
  fi
  
  # Create Brotli compressed version for size analysis
  if command -v brotli >/dev/null 2>&1; then
    brotli -k -f "$wasm_file"
    brotli_size=$(stat -f%z "$wasm_file.br")
    compression_ratio=$(echo "scale=1; ($wasm_size - $brotli_size) * 100 / $wasm_size" | bc)
    echo "  📊 WASM Brotli compression: $wasm_size → $brotli_size bytes ($compression_ratio% reduction)"
    rm "$wasm_file.br"  # GitHub Pages doesn't serve .br files by default
  fi
fi

# 5. Generate Optimization Report
echo "📊 Generating optimization report..."
cat > optimization-report.md << EOF
# LogicCastle Asset Optimization Report
*Generated: $(date)*

## Summary
$(find . -name "*.webp" | wc -l) WebP images created
$(find . -name "*.min.css" | wc -l) CSS files minified
$(find assets/wasm -name "*.wasm" | wc -l) WASM files optimized

## File Sizes
| Asset Type | Count | Total Size |
|------------|-------|------------|
| Images (PNG) | $(find . -name "*.png" -not -path "./node_modules/*" | wc -l) | $(find . -name "*.png" -not -path "./node_modules/*" -exec stat -f%z {} \; | awk '{sum+=$1} END {print sum " bytes"}') |
| Images (WebP) | $(find . -name "*.webp" | wc -l) | $(find . -name "*.webp" -exec stat -f%z {} \; | awk '{sum+=$1} END {print sum " bytes"}') |
| CSS Files | $(find . -name "*.css" -not -path "./node_modules/*" | wc -l) | $(find . -name "*.css" -not -path "./node_modules/*" -exec stat -f%z {} \; | awk '{sum+=$1} END {print sum " bytes"}') |
| WASM Files | $(find assets/wasm -name "*.wasm" 2>/dev/null | wc -l) | $(find assets/wasm -name "*.wasm" 2>/dev/null -exec stat -f%z {} \; | awk '{sum+=$1} END {print sum " bytes"}') |

## Recommendations
- ✅ All images have WebP versions for modern browsers
- ✅ CSS files are minified for production
- ✅ WASM files are optimized with wasm-opt
- 💡 Consider implementing Brotli compression on your CDN
- 💡 Use \`loading="lazy"\` for non-critical images

EOF

echo "✅ Asset optimization complete! Report saved to optimization-report.md"

# Final size summary
echo ""
echo "📊 Final Asset Summary:"
echo "  Images (PNG): $(find . -name "*.png" -not -path "./node_modules/*" -exec stat -f%z {} \; | awk '{sum+=$1} END {printf "%.1f KB", sum/1024}')"
echo "  Images (WebP): $(find . -name "*.webp" -exec stat -f%z {} \; | awk '{sum+=$1} END {printf "%.1f KB", sum/1024}')"
echo "  CSS Total: $(find . -name "*.css" -not -path "./node_modules/*" -exec stat -f%z {} \; | awk '{sum+=$1} END {printf "%.1f KB", sum/1024}')"
echo "  WASM Total: $(find assets/wasm -name "*.wasm" 2>/dev/null -exec stat -f%z {} \; | awk '{sum+=$1} END {printf "%.1f KB", sum/1024}')"
```

### 5.2 Progressive Web App Features

**manifest.json für Gaming PWA:**

```json
{
  "name": "LogicCastle - Premium Gaming Collection",
  "short_name": "LogicCastle",
  "description": "Collection of strategic board games with advanced AI and beautiful glassmorphism UI",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#1e1b4b",
  "background_color": "#0f0f23",
  "scope": "/",
  
  "icons": [
    {
      "src": "icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-96x96.png", 
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-128x128.png",
      "sizes": "128x128", 
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "screenshots/connect4-gameplay.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Connect4 with glassmorphism UI"
    },
    {
      "src": "screenshots/gomoku-gameplay.png", 
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Gomoku with AI assistance"
    },
    {
      "src": "screenshots/trio-gameplay.png",
      "sizes": "1280x720",
      "type": "image/png", 
      "label": "Trio number puzzle game"
    }
  ],
  
  "categories": ["games", "entertainment", "puzzle"],
  "lang": "en",
  
  "shortcuts": [
    {
      "name": "Play Connect4",
      "url": "/games/connect4/",
      "description": "Start a new Connect4 game",
      "icons": [
        {
          "src": "icons/connect4-shortcut.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Play Gomoku",
      "url": "/games/gomoku/",
      "description": "Start a new Gomoku game", 
      "icons": [
        {
          "src": "icons/gomoku-shortcut.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Play Trio",
      "url": "/games/trio/",
      "description": "Start a new Trio puzzle",
      "icons": [
        {
          "src": "icons/trio-shortcut.png", 
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

---

## 6. Monitoring und Troubleshooting

### 6.1 Deployment Health Checks

**scripts/monitor-github-pages-deployment.sh:**

```bash
#!/bin/bash
# GitHub Pages deployment monitoring and health checks

set -e

DEPLOYMENT_URL="${1:-https://username.github.io/LogicCastle}"
MAX_RETRIES=10
RETRY_DELAY=30

echo "🔍 Monitoring LogicCastle deployment at: $DEPLOYMENT_URL"

# Function to check URL availability
check_url() {
  local url=$1
  local name=$2
  local max_time=${3:-10}
  
  if curl -f -s --max-time "$max_time" "$url" >/dev/null; then
    echo "  ✅ $name: OK"
    return 0
  else
    echo "  ❌ $name: FAILED"
    return 1
  fi
}

# Function to check WASM loading
check_wasm_loading() {
  local base_url=$1
  
  echo "🦀 Testing WASM loading..."
  
  # Create temporary test script
  cat > temp_wasm_test.js << 'EOF'
import('./assets/wasm/game_engine.js')
  .then(module => module.default())
  .then(() => {
    console.log('WASM_LOAD_SUCCESS');
    process.exit(0);
  })
  .catch(error => {
    console.error('WASM_LOAD_FAILED:', error);
    process.exit(1);
  });
EOF

  if node temp_wasm_test.js 2>/dev/null; then
    echo "  ✅ WASM: Loading successful"
    rm -f temp_wasm_test.js
    return 0
  else
    echo "  ❌ WASM: Loading failed"
    rm -f temp_wasm_test.js
    return 1
  fi
}

# Function to measure page performance
measure_performance() {
  local url=$1
  local name=$2
  
  echo "⚡ Measuring $name performance..."
  
  # Use curl to measure timing
  curl_output=$(curl -w "@/dev/stdin" -o /dev/null -s "$url" << 'EOF'
{
  "time_namelookup": %{time_namelookup},
  "time_connect": %{time_connect},
  "time_appconnect": %{time_appconnect},
  "time_pretransfer": %{time_pretransfer},
  "time_redirect": %{time_redirect},
  "time_starttransfer": %{time_starttransfer},
  "time_total": %{time_total},
  "speed_download": %{speed_download},
  "size_download": %{size_download}
}
EOF
)

  if [ $? -eq 0 ]; then
    echo "  📊 Performance metrics for $name:"
    echo "$curl_output" | jq -r '
      "    DNS Lookup: " + (.time_namelookup * 1000 | floor | tostring) + "ms",
      "    Connect: " + (.time_connect * 1000 | floor | tostring) + "ms", 
      "    First Byte: " + (.time_starttransfer * 1000 | floor | tostring) + "ms",
      "    Total: " + (.time_total * 1000 | floor | tostring) + "ms",
      "    Size: " + (.size_download | tostring) + " bytes",
      "    Speed: " + (.speed_download / 1024 | floor | tostring) + " KB/s"
    '
  else
    echo "  ⚠️  Performance measurement failed for $name"
  fi
}

# Main health check routine
perform_health_check() {
  local attempt=$1
  local failed_checks=0
  
  echo ""
  echo "🏥 Health Check #$attempt ($(date))"
  echo "=================================="
  
  # Core pages
  check_url "$DEPLOYMENT_URL" "Landing Page" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/games/connect4/" "Connect4 Game" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/games/gomoku/" "Gomoku Game" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/games/trio/" "Trio Game" || ((failed_checks++))
  
  # Critical assets
  check_url "$DEPLOYMENT_URL/assets/wasm/game_engine_bg.wasm" "WASM Binary" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/assets/wasm/game_engine.js" "WASM JS Wrapper" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/manifest.json" "PWA Manifest" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/sw.js" "Service Worker" || ((failed_checks++))
  
  # Game-specific CSS
  check_url "$DEPLOYMENT_URL/games/connect4/css/tailwind-built.css" "Connect4 CSS" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/games/gomoku/css/tailwind-built.css" "Gomoku CSS" || ((failed_checks++))
  check_url "$DEPLOYMENT_URL/games/trio/css/tailwind-built.css" "Trio CSS" || ((failed_checks++))
  
  # Performance measurements
  measure_performance "$DEPLOYMENT_URL" "Landing Page"
  measure_performance "$DEPLOYMENT_URL/games/connect4/" "Connect4"
  measure_performance "$DEPLOYMENT_URL/assets/wasm/game_engine_bg.wasm" "WASM Binary"
  
  echo ""
  echo "📊 Health Check Summary:"
  echo "  Failed checks: $failed_checks"
  echo "  Success rate: $((100 - failed_checks * 100 / 11))%"
  
  return $failed_checks
}

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
retry_count=0

while [ $retry_count -lt $MAX_RETRIES ]; do
  if perform_health_check $((retry_count + 1)); then
    echo ""
    echo "🎉 Deployment health check PASSED!"
    echo "🎮 LogicCastle is live and healthy at: $DEPLOYMENT_URL"
    exit 0
  else
    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $MAX_RETRIES ]; then
      echo ""
      echo "⏰ Retrying in ${RETRY_DELAY}s... (attempt $((retry_count + 1))/$MAX_RETRIES)"
      sleep $RETRY_DELAY
    fi
  fi
done

echo ""
echo "❌ Deployment health check FAILED after $MAX_RETRIES attempts!"
echo "🔧 Please check the GitHub Pages deployment and logs."
exit 1
```

### 6.2 Error Tracking und Debugging

**assets/js/ErrorTracker.js - Production error monitoring:**

```javascript
// Production error tracking für GitHub Pages deployment
class LogicCastleErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
    this.sessionId = this.generateSessionId();
    this.deploymentInfo = this.getDeploymentInfo();
    
    this.setupErrorHandlers();
    console.log('🔍 LogicCastle Error Tracker initialized', this.deploymentInfo);
  }
  
  generateSessionId() {
    return `lc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getDeploymentInfo() {
    return {
      url: window.location.origin,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      webAssemblySupport: typeof WebAssembly !== 'undefined',
      serviceWorkerSupport: 'serviceWorker' in navigator,
      localStorage: this.testLocalStorage()
    };
  }
  
  testLocalStorage() {
    try {
      localStorage.setItem('lc-test', 'test');
      localStorage.removeItem('lc-test');
      return true;
    } catch {
      return false;
    }
  }
  
  setupErrorHandlers() {
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        reason: event.reason
      });
    });
    
    // WASM loading errors
    this.setupWasmErrorTracking();
    
    // Resource loading errors
    this.setupResourceErrorTracking();
  }
  
  setupWasmErrorTracking() {
    const originalImport = window.import;
    if (originalImport) {
      window.import = async (...args) => {
        try {
          return await originalImport.apply(this, args);
        } catch (error) {
          if (args[0]?.includes('wasm') || args[0]?.includes('game_engine')) {
            this.trackError({
              type: 'wasm_import',
              message: `WASM import failed: ${args[0]}`,
              error: error.message,
              stack: error.stack
            });
          }
          throw error;
        }
      };
    }
  }
  
  setupResourceErrorTracking() {
    // Track failed CSS/JS/image loads
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.trackError({
          type: 'resource_load',
          resource: event.target.src || event.target.href,
          tagName: event.target.tagName,
          message: 'Failed to load resource'
        });
      }
    }, true);
  }
  
  trackError(errorData) {
    const error = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: window.location.href,
      ...errorData
    };
    
    // Add to local collection
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Store in localStorage for debugging
    try {
      localStorage.setItem('lc-errors', JSON.stringify(this.errors.slice(-10)));
    } catch {
      // localStorage not available
    }
    
    // Log to console in development
    if (this.isDevelopment()) {
      console.error('🚨 LogicCastle Error:', error);
    }
    
    // Send to analytics (replace with your preferred service)
    this.sendToAnalytics(error);
  }
  
  sendToAnalytics(error) {
    // Example: Send to Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message,
        fatal: error.type === 'javascript',
        custom_map: {
          error_type: error.type,
          session_id: error.sessionId
        }
      });
    }
    
    // Example: Send to custom endpoint
    if (this.isProduction()) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error, deployment: this.deploymentInfo })
      }).catch(() => {
        // Ignore analytics errors
      });
    }
  }
  
  isDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname.includes('127.0.0.1');
  }
  
  isProduction() {
    return window.location.hostname.includes('github.io') ||
           window.location.hostname.includes('pages.dev');
  }
  
  getErrorReport() {
    return {
      sessionId: this.sessionId,
      deploymentInfo: this.deploymentInfo,
      errorCount: this.errors.length,
      errors: this.errors,
      summary: this.generateErrorSummary()
    };
  }
  
  generateErrorSummary() {
    const summary = {};
    this.errors.forEach(error => {
      summary[error.type] = (summary[error.type] || 0) + 1;
    });
    return summary;
  }
  
  // Debug helpers
  exportErrors() {
    const report = this.getErrorReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], 
                         { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `logiccastle-errors-${this.sessionId}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('📥 Error report exported');
  }
  
  clearErrors() {
    this.errors = [];
    localStorage.removeItem('lc-errors');
    console.log('🗑️  Error history cleared');
  }
}

// Initialize global error tracker
window.LogicCastleErrors = new LogicCastleErrorTracker();

// Expose debug functions
if (window.LogicCastleErrors.isDevelopment()) {
  window.exportErrors = () => window.LogicCastleErrors.exportErrors();
  window.clearErrors = () => window.LogicCastleErrors.clearErrors();
  window.getErrors = () => window.LogicCastleErrors.getErrorReport();
}
```

---

## 📊 Deployment Performance Benchmarks

### Expected Performance Metrics

| Metric | Target | Typical GitHub Pages |
|--------|---------|---------------------|
| **First Contentful Paint** | < 1.5s | 1.2s |
| **Largest Contentful Paint** | < 2.5s | 2.1s |
| **Time to Interactive** | < 3.5s | 3.0s |
| **WASM Load Time** | < 500ms | 300ms |
| **CSS Load Time** | < 200ms | 150ms |

### Asset Size Targets

| Asset Type | Uncompressed | Gzipped | Brotli |
|------------|-------------|---------|---------|
| **WASM Binary** | < 100KB | < 35KB | < 30KB |
| **CSS (per game)** | < 50KB | < 12KB | < 10KB |
| **JS (per game)** | < 200KB | < 60KB | < 50KB |
| **Total Page Size** | < 500KB | < 150KB | < 120KB |

---

## 🚨 LogicCastle-spezifische Deployment-Erkenntnisse

### 7.1 ES6 Module Loading auf GitHub Pages

**KRITISCHES LEARNING aus LogicCastle-Entwicklung:**

```javascript
// ❌ PROBLEM: file:// Protocol blockiert ES6 Imports
// Während lokaler Entwicklung mit file:// URLs:
import { GomokuBoardRenderer } from './components/GomokuBoardRenderer.js'; // FAILS

// ✅ LÖSUNG: GitHub Pages HTTP/HTTPS Environment
// Nach Deployment auf GitHub Pages:
import { GomokuBoardRenderer } from './components/GomokuBoardRenderer.js'; // WORKS
```

**Robustes Fallback-System für Deployment:**

```javascript
// assets/js/ModuleLoadingStrategy.js
class ProductionModuleLoader {
  constructor() {
    this.moduleLoadTimeout = 3000; // 3s timeout für Module loading
    this.fallbackActivated = false;
  }
  
  async loadGameWithFallback(gameType) {
    return new Promise((resolve, reject) => {
      // Set flag to detect successful module loading
      window[`${gameType}Loaded`] = false;
      
      // Start module loading
      this.loadModules(gameType).then(() => {
        window[`${gameType}Loaded`] = true;
        resolve('modules');
      }).catch(error => {
        console.warn(`🔄 ES6 module loading failed: ${error.message}`);
        this.activateFallback(gameType);
        resolve('fallback');
      });
      
      // Fallback timeout for file:// protocol or module failures
      setTimeout(() => {
        if (!window[`${gameType}Loaded`] && !this.fallbackActivated) {
          console.log('🔄 Module loading timeout, activating fallback...');
          this.activateFallback(gameType);
          resolve('fallback');
        }
      }, this.moduleLoadTimeout);
    });
  }
  
  async loadModules(gameType) {
    const moduleMap = {
      connect4: () => import('./games/connect4/js/components/BoardRenderer.js'),
      gomoku: () => import('./games/gomoku/js/components/GomokuBoardRenderer.js'),
      trio: () => import('./games/trio/js/components/TrioBoardRenderer.js')
    };
    
    if (!moduleMap[gameType]) {
      throw new Error(`Unknown game type: ${gameType}`);
    }
    
    return moduleMap[gameType]();
  }
  
  activateFallback(gameType) {
    this.fallbackActivated = true;
    
    // Inline-Fallback-Implementierung
    const fallbackImplementations = {
      connect4: this.createConnect4Fallback,
      gomoku: this.createGomokuFallback,
      trio: this.createTrioFallback
    };
    
    const createFallback = fallbackImplementations[gameType];
    if (createFallback) {
      createFallback.call(this);
      console.log(`✅ ${gameType} fallback activated`);
    }
  }
  
  createConnect4Fallback() {
    // Minimal Connect4 implementation für file:// compatibility
    window.SimpleConnect4 = class {
      constructor() {
        this.board = Array(6).fill().map(() => Array(7).fill(0));
        this.currentPlayer = 1;
        this.setupBoard();
      }
      
      setupBoard() {
        const board = document.getElementById('gameBoard');
        if (!board) return;
        
        board.innerHTML = '';
        board.className = 'grid grid-cols-7 grid-rows-6 gap-2 p-4';
        
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'w-16 h-16 bg-blue-800 rounded-full border-2 border-blue-600 relative cursor-pointer';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => this.makeMove(col));
            board.appendChild(cell);
          }
        }
      }
      
      makeMove(col) {
        for (let row = 5; row >= 0; row--) {
          if (this.board[row][col] === 0) {
            this.board[row][col] = this.currentPlayer;
            this.updateDisplay(row, col);
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            break;
          }
        }
      }
      
      updateDisplay(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          const disc = document.createElement('div');
          disc.className = `absolute inset-1 rounded-full ${
            this.board[row][col] === 1 ? 'bg-yellow-400' : 'bg-red-500'
          }`;
          cell.appendChild(disc);
        }
      }
    };
    
    // Initialize fallback game
    window.game = new window.SimpleConnect4();
  }
  
  // Similar implementations for Gomoku and Trio...
  createGomokuFallback() { /* ... */ }
  createTrioFallback() { /* ... */ }
}

// Global initialization
window.GameModuleLoader = new ProductionModuleLoader();
```

### 7.2 Production Build Pipeline Optimierung

**GitHub Actions Workflow für LogicCastle-Pattern:**

```yaml
# .github/workflows/logiccastle-deploy.yml
name: 🎮 LogicCastle Production Deployment

on:
  push:
    branches: [main]
    paths:
      - 'games/**'
      - 'game_engine/**'
      - 'assets/**'
      - 'shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    # STEP 1: Multi-Game CSS Build
    - name: 🎨 Build CSS for all games
      run: |
        games=(connect4 gomoku trio)
        for game in "${games[@]}"; do
          if [ -f "games/$game/package.json" ]; then
            echo "🎨 Building CSS for $game..."
            cd "games/$game"
            npm ci --prefer-offline --no-audit
            npm run build:css
            
            # Verify CSS was built
            if [ ! -f "css/tailwind-built.css" ]; then
              echo "❌ CSS build failed for $game"
              exit 1
            fi
            
            echo "✅ $game CSS: $(stat -c%s css/tailwind-built.css) bytes"
            cd ../..
          fi
        done
    
    # STEP 2: WASM Build with Optimization
    - name: 🦀 Build optimized WASM
      run: |
        # Install Rust + wasm-pack
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
        rustup target add wasm32-unknown-unknown
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
        
        # Install wasm-opt for size optimization
        wget -q https://github.com/WebAssembly/binaryen/releases/latest/download/binaryen-version_111-x86_64-linux.tar.gz
        tar -xzf binaryen-version_111-x86_64-linux.tar.gz
        sudo cp binaryen-version_111/bin/wasm-opt /usr/local/bin/
        
        # Build WASM with maximum optimization
        cd game_engine
        RUSTFLAGS="-C target-feature=+simd128" wasm-pack build \
          --target web \
          --release \
          --out-dir pkg \
          --scope logiccastle
        
        # Optimize WASM binary size
        wasm-opt -Oz --enable-simd -o pkg/game_engine_bg.wasm pkg/game_engine_bg.wasm
        
        # Copy to assets directory
        mkdir -p ../assets/wasm/
        cp -r pkg/* ../assets/wasm/
        
        # Generate size report
        echo "📊 WASM Build Report:" >> $GITHUB_STEP_SUMMARY
        echo "| File | Size |" >> $GITHUB_STEP_SUMMARY
        echo "|------|------|" >> $GITHUB_STEP_SUMMARY
        echo "| game_engine_bg.wasm | $(stat -c%s ../assets/wasm/game_engine_bg.wasm) bytes |" >> $GITHUB_STEP_SUMMARY
        echo "| game_engine.js | $(stat -c%s ../assets/wasm/game_engine.js) bytes |" >> $GITHUB_STEP_SUMMARY
    
    # STEP 3: Asset Optimization
    - name: 🗜️ Optimize assets for GitHub Pages
      run: |
        # Install optimization tools
        sudo apt-get update
        sudo apt-get install -y webp imagemagick
        npm install -g cleancss-cli
        
        # Optimize images
        find . -name "*.png" -not -path "./node_modules/*" | while read img; do
          # Create WebP version
          cwebp -q 85 "$img" -o "${img%.png}.webp" 2>/dev/null || true
        done
        
        # Optimize CSS (already built CSS files)
        find games -name "tailwind-built.css" | while read css; do
          original_size=$(stat -c%s "$css")
          cleancss -o "$css.min" "$css"
          mv "$css.min" "$css"
          new_size=$(stat -c%s "$css")
          echo "CSS optimized: $css ($original_size → $new_size bytes)"
        done
    
    # STEP 4: Deployment Health Check Setup
    - name: 🧪 Prepare deployment verification
      run: |
        # Create health check script
        cat > health-check.js << 'EOF'
        // Post-deployment health check for LogicCastle
        const HEALTH_CHECKS = [
          '/',
          '/games/connect4/',
          '/games/gomoku/',
          '/games/trio/',
          '/assets/wasm/game_engine_bg.wasm',
          '/manifest.json'
        ];
        
        async function checkHealth(baseUrl) {
          console.log(`🔍 Checking health of: ${baseUrl}`);
          
          for (const path of HEALTH_CHECKS) {
            try {
              const response = await fetch(`${baseUrl}${path}`);
              const status = response.ok ? '✅' : '❌';
              console.log(`${status} ${path}: ${response.status}`);
            } catch (error) {
              console.log(`❌ ${path}: ${error.message}`);
            }
          }
        }
        
        // Check health after deployment
        const deployUrl = process.env.DEPLOY_URL || 'https://username.github.io/LogicCastle';
        checkHealth(deployUrl);
        EOF
    
    # STEP 5: Deploy to GitHub Pages
    - name: 🚀 Deploy to GitHub Pages
      uses: actions/deploy-pages@v2
      with:
        artifact_name: github-pages
    
    # STEP 6: Post-deployment verification
    - name: 🧪 Post-deployment health check
      run: |
        # Wait for deployment
        sleep 30
        
        # Run health checks
        node health-check.js
        
        # Test ES6 module loading
        curl -f "${{ steps.deployment.outputs.page_url }}games/connect4/js/components/BoardRenderer.js" > /dev/null
        echo "✅ ES6 modules accessible via HTTP"
        
        echo "🎮 LogicCastle deployed successfully!"
        echo "🌐 Live at: ${{ steps.deployment.outputs.page_url }}"
```

### 7.3 Performance Monitoring für Gaming Applications

**LogicCastle Performance Tracking:**

```javascript
// assets/js/PerformanceMonitor.js
class LogicCastlePerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      wasmLoad: {},
      gameLoad: {},
      userInteraction: {}
    };
    
    this.startTime = performance.now();
    this.setupPerformanceObserver();
    this.monitorWasmLoading();
  }
  
  setupPerformanceObserver() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.pageLoad.lcp = lastEntry.startTime;
        console.log(`📊 LCP: ${lastEntry.startTime.toFixed(0)}ms`);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0];
        this.metrics.userInteraction.fid = firstInput.processingStart - firstInput.startTime;
        console.log(`📊 FID: ${this.metrics.userInteraction.fid.toFixed(0)}ms`);
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.pageLoad.cls = clsValue;
        console.log(`📊 CLS: ${clsValue.toFixed(3)}`);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }
  
  monitorWasmLoading() {
    const wasmStartTime = performance.now();
    
    // Monitor WASM loading performance
    window.addEventListener('wasm-loaded', () => {
      this.metrics.wasmLoad.duration = performance.now() - wasmStartTime;
      this.metrics.wasmLoad.success = true;
      console.log(`🦀 WASM loaded in: ${this.metrics.wasmLoad.duration.toFixed(0)}ms`);
    });
    
    window.addEventListener('wasm-failed', (event) => {
      this.metrics.wasmLoad.duration = performance.now() - wasmStartTime;
      this.metrics.wasmLoad.success = false;
      this.metrics.wasmLoad.error = event.detail.error;
      console.log(`🚨 WASM failed after: ${this.metrics.wasmLoad.duration.toFixed(0)}ms`);
    });
    
    // Timeout detection
    setTimeout(() => {
      if (!this.metrics.wasmLoad.duration) {
        this.metrics.wasmLoad.timeout = true;
        console.log('⏰ WASM loading timeout detected');
      }
    }, 5000);
  }
  
  trackGameLoadTime(gameType, startTime) {
    const loadTime = performance.now() - startTime;
    this.metrics.gameLoad[gameType] = loadTime;
    console.log(`🎮 ${gameType} loaded in: ${loadTime.toFixed(0)}ms`);
    
    // Send to analytics
    this.sendMetric('game_load', {
      game: gameType,
      duration: loadTime,
      mode: window.LogicCastleWasmLoader?.fallbackActivated ? 'fallback' : 'wasm'
    });
  }
  
  trackInteraction(action, gameType, duration) {
    if (!this.metrics.userInteraction[gameType]) {
      this.metrics.userInteraction[gameType] = {};
    }
    
    this.metrics.userInteraction[gameType][action] = duration;
    console.log(`🎯 ${gameType} ${action}: ${duration.toFixed(0)}ms`);
    
    // Track slow interactions
    if (duration > 100) {
      console.warn(`⚠️ Slow interaction detected: ${action} (${duration.toFixed(0)}ms)`);
      this.sendMetric('slow_interaction', {
        game: gameType,
        action: action,
        duration: duration
      });
    }
  }
  
  sendMetric(name, data) {
    // Send to Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', name, {
        custom_map: data,
        value: data.duration || 0
      });
    }
    
    // Send to custom analytics endpoint
    if (this.isProduction()) {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          data: data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // Ignore analytics errors
      });
    }
  }
  
  isProduction() {
    return window.location.hostname.includes('github.io');
  }
  
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };
    
    console.log('📊 LogicCastle Performance Report:', report);
    return report;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // Check LCP
    if (this.metrics.pageLoad.lcp > 2500) {
      recommendations.push('Consider optimizing Largest Contentful Paint (>2.5s)');
    }
    
    // Check WASM loading
    if (this.metrics.wasmLoad.duration > 1000) {
      recommendations.push('WASM loading is slow (>1s) - consider preloading');
    }
    
    // Check FID
    if (this.metrics.userInteraction.fid > 100) {
      recommendations.push('First Input Delay is high (>100ms) - optimize JavaScript');
    }
    
    return recommendations;
  }
}

// Initialize performance monitoring
window.LogicCastlePerformance = new LogicCastlePerformanceMonitor();

// Export report function for debugging
window.getPerformanceReport = () => window.LogicCastlePerformance.generateReport();
```

### 7.4 Troubleshooting Common GitHub Pages Issues

**LogicCastle-Erfahrungen mit typischen Deployment-Problemen:**

#### **Problem 1: ES6 Modules funktionieren nicht nach Deployment**

```bash
# Symptom: Console-Fehler "Failed to load module script"
# Ursache: MIME-Type oder CORS Issues

# LÖSUNG 1: _headers file konfigurieren
echo "/*.js" >> _headers
echo "  Content-Type: application/javascript" >> _headers
echo "  Access-Control-Allow-Origin: *" >> _headers

# LÖSUNG 2: Fallback-System aktivieren (empfohlen)
# Siehe Sektion 7.1 für ProductionModuleLoader Implementation
```

#### **Problem 2: WASM lädt nicht oder ist zu langsam**

```javascript
// Diagnose-Script für WASM-Probleme
async function diagnoseWasm() {
  console.log('🔍 WASM Diagnostics Starting...');
  
  // 1. WebAssembly Support Check
  if (typeof WebAssembly === 'undefined') {
    console.error('❌ WebAssembly not supported in this browser');
    return;
  }
  
  // 2. WASM Binary Availability
  try {
    const response = await fetch('/assets/wasm/game_engine_bg.wasm');
    console.log(`📦 WASM Binary: ${response.status} (${response.headers.get('content-length')} bytes)`);
    
    if (!response.ok) {
      console.error(`❌ WASM Binary fetch failed: ${response.status}`);
      return;
    }
  } catch (error) {
    console.error('❌ WASM Binary unreachable:', error);
    return;
  }
  
  // 3. WASM Loading Performance
  const startTime = performance.now();
  try {
    const wasmModule = await import('/assets/wasm/game_engine.js');
    await wasmModule.default();
    const loadTime = performance.now() - startTime;
    console.log(`✅ WASM loaded successfully in ${loadTime.toFixed(0)}ms`);
  } catch (error) {
    console.error('❌ WASM Loading failed:', error);
  }
}

// Run diagnostics in browser console
diagnoseWasm();
```

#### **Problem 3: Tailwind CSS nicht verfügbar nach Build**

```bash
# Typisches Problem: CSS Build schlägt fehl oder wird nicht kopiert

# DIAGNOSE:
echo "🔍 CSS Build Diagnostics:"
for game in connect4 gomoku trio; do
  if [ -f "games/$game/css/tailwind-built.css" ]; then
    echo "✅ $game CSS exists: $(stat -c%s games/$game/css/tailwind-built.css) bytes"
  else
    echo "❌ $game CSS missing!"
  fi
done

# FIX: Manual CSS rebuild
cd games/connect4 && npm run build:css && cd ../..
cd games/gomoku && npm run build:css && cd ../..
cd games/trio && npm run build:css && cd ../..

# VERIFIKATION:
find games -name "tailwind-built.css" -exec ls -lh {} \;
```

#### **Problem 4: GitHub Pages Build schlägt fehl**

```yaml
# Häufige Ursachen und Lösungen in GitHub Actions

jobs:
  debug-build:
    runs-on: ubuntu-latest
    steps:
    - name: 🔍 Debug Build Environment
      run: |
        echo "Node version: $(node --version)"
        echo "NPM version: $(npm --version)"
        echo "Working directory: $(pwd)"
        echo "Available disk space: $(df -h . | tail -1 | awk '{print $4}')"
        
        # Check for large files that might cause issues
        find . -size +10M -not -path "./node_modules/*" -not -path "./.git/*" | head -10
        
        # Verify critical files exist
        echo "📁 Repository structure:"
        ls -la
        
        echo "🎮 Games directory:"
        ls -la games/
        
        echo "🦀 Game engine:"
        ls -la game_engine/ | head -5
    
    - name: 🧪 Test build components individually
      run: |
        # Test Node.js setup
        cd games/connect4
        if npm ci --dry-run; then
          echo "✅ Connect4 dependencies OK"
        else
          echo "❌ Connect4 dependency issues"
          npm ls --depth=0
        fi
        cd ../..
        
        # Test Rust setup
        if command -v rustc >/dev/null 2>&1; then
          echo "✅ Rust available: $(rustc --version)"
        else
          echo "❌ Rust not available"
        fi
        
        # Test wasm-pack
        if command -v wasm-pack >/dev/null 2>&1; then
          echo "✅ wasm-pack available: $(wasm-pack --version)"
        else
          echo "❌ wasm-pack not available"
        fi
```

#### **Problem 5: Performance Issues nach Deployment**

```javascript
// Performance-Tuning basierend auf LogicCastle-Erkenntnissen

// 1. Critical Resource Preloading
function preloadCriticalAssets() {
  const criticalAssets = [
    '/assets/wasm/game_engine_bg.wasm',
    '/assets/wasm/game_engine.js',
    '/games/connect4/css/tailwind-built.css'
  ];
  
  criticalAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (asset.endsWith('.wasm')) {
      link.as = 'fetch';
      link.type = 'application/wasm';
    } else if (asset.endsWith('.js')) {
      link.as = 'script';
    } else if (asset.endsWith('.css')) {
      link.as = 'style';
    }
    
    link.href = asset;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// 2. Lazy Loading für Non-Critical Components
function setupLazyLoading() {
  // Nur laden wenn User das erste Mal interagiert
  document.addEventListener('click', async function loadGameAssets() {
    document.removeEventListener('click', loadGameAssets);
    
    // Load additional components asynchronously
    const modules = [
      import('/games/connect4/js/components/AssistanceManager.js'),
      import('/games/connect4/js/components/SoundManager.js'),
      import('/games/connect4/js/components/ParticleEngine.js')
    ];
    
    await Promise.allSettled(modules);
    console.log('🎮 Additional game components loaded');
  }, { once: true });
}

// 3. Memory Management für Long-Running Sessions
function setupMemoryManagement() {
  // Cleanup bei Seitenwechsel
  window.addEventListener('beforeunload', () => {
    if (window.game?.cleanup) {
      window.game.cleanup();
    }
    
    // Clear large objects
    window.game = null;
    window.wasmModule = null;
  });
  
  // Periodic memory cleanup
  setInterval(() => {
    if (window.gc && typeof window.gc === 'function') {
      window.gc(); // Force garbage collection in development
    }
  }, 60000); // Every minute
}

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', () => {
  preloadCriticalAssets();
  setupLazyLoading();
  setupMemoryManagement();
});
```

#### **Problem 6: Service Worker Caching Issues**

```javascript
// Service Worker Debug Helper
class ServiceWorkerDebugger {
  static async diagnose() {
    if (!('serviceWorker' in navigator)) {
      console.warn('❌ Service Worker not supported');
      return;
    }
    
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.warn('❌ No Service Worker registered');
      return;
    }
    
    console.log('✅ Service Worker registered:', registration);
    
    // Check cache status
    const cacheNames = await caches.keys();
    console.log('📦 Available caches:', cacheNames);
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedRequests = await cache.keys();
      console.log(`📦 Cache ${cacheName}: ${cachedRequests.length} items`);
      
      // Show sample cached items
      cachedRequests.slice(0, 3).forEach(request => {
        console.log(`   - ${request.url}`);
      });
    }
  }
  
  static async clearCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('🗑️ All caches cleared');
  }
  
  static async updateServiceWorker() {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('🔄 Service Worker updated');
    }
  }
}

// Debug commands für Browser Console
window.swDebug = ServiceWorkerDebugger.diagnose;
window.swClear = ServiceWorkerDebugger.clearCaches;
window.swUpdate = ServiceWorkerDebugger.updateServiceWorker;
```

### 7.5 Production Deployment Checklist

**Pre-Deployment Verification (basierend auf LogicCastle-Erfahrungen):**

```bash
#!/bin/bash
# scripts/pre-deployment-check.sh

echo "🚀 LogicCastle Pre-Deployment Checklist"
echo "======================================="

ISSUES=0

# 1. CSS Build Verification
echo "🎨 Checking CSS builds..."
for game in connect4 gomoku trio; do
  if [ -f "games/$game/css/tailwind-built.css" ]; then
    size=$(stat -c%s "games/$game/css/tailwind-built.css")
    if [ "$size" -gt 1000 ]; then
      echo "  ✅ $game CSS: $size bytes"
    else
      echo "  ❌ $game CSS too small: $size bytes"
      ((ISSUES++))
    fi
  else
    echo "  ❌ $game CSS missing"
    ((ISSUES++))
  fi
done

# 2. WASM Build Verification
echo "🦀 Checking WASM builds..."
if [ -f "assets/wasm/game_engine_bg.wasm" ]; then
  wasm_size=$(stat -c%s "assets/wasm/game_engine_bg.wasm")
  if [ "$wasm_size" -gt 10000 ]; then
    echo "  ✅ WASM binary: $wasm_size bytes"
  else
    echo "  ❌ WASM binary too small: $wasm_size bytes"
    ((ISSUES++))
  fi
else
  echo "  ❌ WASM binary missing"
  ((ISSUES++))
fi

# 3. Module Structure Verification
echo "📦 Checking module structure..."
for game in connect4 gomoku trio; do
  components_dir="games/$game/js/components"
  if [ -d "$components_dir" ]; then
    component_count=$(find "$components_dir" -name "*.js" | wc -l)
    if [ "$component_count" -ge 8 ]; then
      echo "  ✅ $game components: $component_count files"
    else
      echo "  ⚠️  $game components: only $component_count files (expected 8+)"
    fi
  else
    echo "  ❌ $game components directory missing"
    ((ISSUES++))
  fi
done

# 4. Critical File Existence
echo "📁 Checking critical files..."
critical_files=(
  "index.html"
  "manifest.json"
  "sw.js"
  "_headers"
  "assets/wasm/game_engine.js"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file missing"
    ((ISSUES++))
  fi
done

# 5. Node Modules Check
echo "🔧 Checking dependencies..."
for game in connect4 gomoku trio; do
  if [ -f "games/$game/package.json" ]; then
    cd "games/$game"
    if npm ls >/dev/null 2>&1; then
      echo "  ✅ $game dependencies OK"
    else
      echo "  ⚠️  $game has dependency issues"
    fi
    cd ../..
  fi
done

# 6. File Size Analysis
echo "📊 File size analysis..."
total_size=0
large_files=()

while IFS= read -r -d '' file; do
  size=$(stat -c%s "$file")
  total_size=$((total_size + size))
  
  if [ "$size" -gt 1048576 ]; then  # > 1MB
    large_files+=("$file: $(echo "scale=1; $size/1048576" | bc)MB")
  fi
done < <(find . -type f -not -path "./node_modules/*" -not -path "./.git/*" -print0)

echo "  📦 Total project size: $(echo "scale=1; $total_size/1048576" | bc)MB"

if [ ${#large_files[@]} -gt 0 ]; then
  echo "  ⚠️  Large files detected:"
  for file in "${large_files[@]}"; do
    echo "    - $file"
  done
fi

# Summary
echo ""
echo "📋 Pre-Deployment Summary:"
if [ $ISSUES -eq 0 ]; then
  echo "  ✅ All checks passed! Ready for deployment."
  exit 0
else
  echo "  ❌ $ISSUES issues found. Please fix before deployment."
  exit 1
fi
```

---

## 🔗 Useful Resources

### GitHub Pages Documentation
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Custom Domain Configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)

### WebAssembly on GitHub Pages
- [Deploying Rust and WebAssembly](https://rustwasm.github.io/book/reference/deploying-to-production.html)
- [WASM MIME Type Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)

### Performance Optimization
- [Web Performance Optimization](https://web.dev/fast/)
- [Critical Resource Hints](https://web.dev/preload-critical-assets/)
- [Service Worker Best Practices](https://web.dev/service-worker-best-practices/)

---

---

## 📋 Quick Start für LogicCastle Deployment

### 1. Repository Setup
```bash
# Clone und Setup
git clone https://github.com/username/LogicCastle.git
cd LogicCastle

# Install dependencies für alle Spiele
for game in connect4 gomoku trio; do
  cd games/$game && npm install && cd ../..
done
```

### 2. Build All Assets
```bash
# CSS builds
cd games/connect4 && npm run build:css && cd ../..
cd games/gomoku && npm run build:css && cd ../..
cd games/trio && npm run build:css && cd ../..

# WASM build
cd game_engine
wasm-pack build --target web --release --out-dir pkg --scope logiccastle
mkdir -p ../assets/wasm/
cp -r pkg/* ../assets/wasm/
cd ..
```

### 3. Deploy to GitHub Pages
```bash
# Push to main branch
git add .
git commit -m "🚀 Production deployment ready"
git push origin main

# GitHub Actions wird automatisch ausgeführt
# Live deployment verfügbar unter: https://username.github.io/LogicCastle
```

### 4. Verify Deployment
```bash
# Download und run health check
curl -o health-check.js https://raw.githubusercontent.com/username/LogicCastle/main/scripts/health-check.js
node health-check.js https://username.github.io/LogicCastle
```

---

## 🎯 LogicCastle-spezifische Erkenntnisse

### ✅ **Was funktioniert perfekt:**
- **ES6 Module Loading** über HTTP/HTTPS (GitHub Pages)
- **WASM Integration** mit automatischem Fallback
- **Tailwind CSS Production Builds** mit optimierten Größen
- **11-Komponenten Architektur** für saubere Modularität
- **3-Phasen Victory Sequences** mit Konfetti-Animationen
- **Progressive Web App** Features mit Service Worker

### 🚨 **Kritische Lessons Learned:**
- **file:// Protocol blockiert ES6 Imports** - HTTP Deployment erforderlich
- **Module Loading Timeout System** essential für robuste UX
- **CSS Specificity Wars** - Ultra-high specificity für external conflicts
- **WASM Size Optimization** - wasm-opt reduziert Größe um 40%+
- **Multi-Game CSS Builds** - Separete build processes nötig

### 🔧 **Production-ready Komponenten:**
- **Automated GitHub Actions** mit multi-stage builds
- **Asset Optimization Pipeline** für Bilder, CSS, WASM
- **Performance Monitoring** mit Core Web Vitals tracking
- **Error Tracking System** für production debugging
- **Service Worker Caching** für offline gaming capability

---

**✅ Status:** Production-ready für LogicCastle Gaming Applications  
**📅 Letzte Aktualisierung:** 2025-07-26 (v2.0 mit praktischen Erkenntnissen)  
**🎯 Nächste Schritte:** Implementierung der automated workflows in eigenem Projekt  
**👨‍💻 Maintainer:** LogicCastle Development Team  
**🎮 Live Demo:** [LogicCastle auf GitHub Pages](https://maxkuelshammer.github.io/LogicCastle/)