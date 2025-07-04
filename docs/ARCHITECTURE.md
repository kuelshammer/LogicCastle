# 🏗️ LogicCastle Architecture Documentation

Detaillierte Architektur-Dokumentation für das LogicCastle Rust/WASM Gaming Framework.

## 📋 Inhaltsverzeichnis

- [System Overview](#system-overview)
- [UI-Module System](#ui-module-system) ⭐ **NEU**
- [Rust/WASM Core Engine](#rustwasm-core-engine)
- [JavaScript UI Layer](#javascript-ui-layer)
- [Design System](#design-system)
- [Build Pipeline](#build-pipeline)
- [Performance Architecture](#performance-architecture)
- [Testing Strategy](#testing-strategy)

## 🔧 System Overview

LogicCastle folgt einer **Hybrid-Architektur** mit Rust/WASM für performance-kritische Spiellogik und modernem JavaScript für UI und Browser-Integration.

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    Browser UI       │    │   WASM Interface    │    │   Rust Game Core    │
│                     │    │                     │    │                     │
│ ▶ ES6 Modules       │◄──►│ ▶ wasm-bindgen      │◄──►│ ▶ Game Engine       │
│ ▶ DOM Manipulation  │    │ ▶ Type-safe Calls   │    │ ▶ AI Algorithms     │
│ ▶ Event Handling    │    │ ▶ Memory Management │    │ ▶ Performance Logic │
│ ▶ PWA Features      │    │ ▶ Error Handling    │    │ ▶ Mathematical Core │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Architektur-Prinzipien

1. **🦀 Rust-First für Game Logic**: Alle Spielregeln, KI, und mathematische Berechnungen in Rust
2. **🌐 JavaScript für UI**: DOM-Manipulation, Events, Progressive Web App Features
3. **🔒 Type Safety**: WASM-bindgen generiert TypeScript-Definitionen
4. **⚡ Performance**: Zero-Copy zwischen Rust und JavaScript wo möglich
5. **📱 Progressive Enhancement**: Funktioniert ohne JavaScript, besser mit

## 🎮 UI-Module System

Das **UI-Module System** ist LogicCastles zentrale Architektur-Innovation für wiederverwendbare und wartbare Spieloberflächen.

### Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                   BaseGameUI                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Element     │ │ Keyboard    │ │ Modal           │   │
│  │ Binder      │ │ Controller  │ │ Manager         │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
           ▲                    ▲                    ▲
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   GomokuUINew   │ │    TrioUI       │ │     HexUI       │
│  ⭐GOLDSTANDARD │ │   (geplant)     │ │   (geplant)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### BaseGameUI Core (`assets/js/ui-modules/core/BaseGameUI.js`)

```javascript
export class BaseGameUI {
    constructor(game, config) {
        this.game = game;
        this.config = config;
        
        // Automatische Modul-Initialisierung
        this.elementBinder = new ElementBinder(config.elements);
        this.keyboardController = new KeyboardController(config.keyboard);
        this.modalManager = new ModalManager(config.modals);
    }
    
    async init() {
        // Standardisierter Initialisierungs-Workflow
        await this.beforeInit();
        this.elementBinder.bindElements();
        this.setupGameEventListeners();
        this.keyboardController.init();
        this.modalManager.init();
        await this.afterInit();
    }
}
```

### ElementBinder - Automatisches DOM-Binding

```javascript
// Eliminiert manuelles DOM-Element-Caching
export class ElementBinder {
    bindElements() {
        Object.entries(this.config).forEach(([key, selector]) => {
            const element = document.querySelector(selector);
            if (element) {
                this.elements[key] = element;
            } else {
                console.warn(`Element not found: ${selector}`);
            }
        });
    }
}

// Usage in Game UI
const config = {
    elements: {
        gameBoard: '#gameBoard',
        currentPlayer: '#currentPlayer',
        gameStatus: '#gameStatus'
    }
};
```

### KeyboardController - Einheitliche Navigation

```javascript
export class KeyboardController {
    constructor(config) {
        this.keyMappings = config.keyMappings;
        this.shortcuts = config.shortcuts;
    }
    
    // Standardisierte Tastatur-Events für alle Spiele
    handleKeyDown(event) {
        const action = this.keyMappings[event.code];
        if (action && this.actions[action]) {
            event.preventDefault();
            this.actions[action](event);
        }
    }
}

// Game-spezifische Konfiguration
const keyboardConfig = {
    keyMappings: {
        'KeyW': 'move_up',
        'KeyS': 'move_down', 
        'KeyA': 'move_left',
        'KeyD': 'move_right',
        'Space': 'place_stone',
        'F1': 'toggle_help'
    }
};
```

### ModalManager - Modulares Modal-System

```javascript
export class ModalManager {
    constructor(config) {
        this.modals = new Map();
        this.config = config;
    }
    
    // Einheitliches Modal-Management
    showModal(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.setAttribute('aria-hidden', 'false');
            this.trapFocus(modal);
        }
    }
}
```

### Stone Positioning System ⭐ **CRITICAL FIX**

Das neue **Stone Positioning System** löst den kritischen DOM-Verschachtelung Bug:

```javascript
// NEU: Pixel-perfekte Positionierung (Gemini Report Implementation)
positionStoneOnBoard(row, col, stoneElement) {
    const board = this.elements.gameBoard;
    
    // 1. Runtime Board-Dimensionen
    const boardRect = board.getBoundingClientRect();
    const boardWidth = boardRect.width;
    
    // 2. CSS-Padding-Berechnung (5.13%)
    const padding = boardWidth * 0.0513;
    
    // 3. Grid-Größe berechnen
    const gridWidth = boardWidth - (2 * padding);
    const gridSize = this.game.BOARD_SIZE || 15;
    const step = gridWidth / (gridSize - 1);
    
    // 4. Pixel-Koordinaten
    const pixelX = padding + (col * step);
    const pixelY = padding + (row * step);
    
    // 5. Direkte Board-Positionierung
    stoneElement.style.position = 'absolute';
    stoneElement.style.left = `${pixelX}px`;
    stoneElement.style.top = `${pixelY}px`;
    stoneElement.style.transform = 'translate(-50%, -50%)';
    
    // ALT (BUGGY): intersection.appendChild(stone)
    // NEU (FIXED): board.appendChild(stone) + positionStoneOnBoard()
    this.elements.gameBoard.appendChild(stoneElement);
}
```

### Gomoku als GOLDSTANDARD ⭐

**Gomoku** (`games/gomoku/js/ui-new.js`) dient als Referenz-Implementation:

```javascript
import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { GOMOKU_UI_CONFIG } from './gomoku-config.js';

export class GomokuUINew extends BaseGameUI {
    constructor(game) {
        super(game, GOMOKU_UI_CONFIG);
        // Gomoku-spezifische Erweiterungen...
    }
    
    // Überschreibt BaseGameUI-Methoden für Gomoku-Logik
    onMoveMade(move) {
        // Verwendet neue Stone Positioning
        this.positionStoneOnBoard(move.row, move.col, stone);
    }
}
```

**Code-Reduktion**: 1646 → 950 Zeilen (33% weniger) bei gleicher Funktionalität

### Migrations-Roadmap

1. **✅ Gomoku**: Vollständig migriert (GOLDSTANDARD)
2. **🔄 Trio**: Migration geplant
3. **🔄 Hex**: Migration geplant  
4. **🔄 L-Game**: Migration geplant
5. **⚠️ Connect4**: Spezialbehandlung (BitPackedBoard-Migration erforderlich)

## 🦀 Rust/WASM Core Engine

### Unified Game Engine (`game_engine/src/lib.rs`)

```rust
// Zentrale Game-Struktur für alle Spiele
pub struct Game {
    board: Board,
    win_condition: usize,
    gravity_enabled: bool,    // Connect4: true, Gomoku: false
    current_player: Player,
}

// Spezialisierte Trio-Implementierung
pub struct TrioGame {
    board: Board,
    target_number: u8,
}

// Memory-effiziente Board-Representation
pub struct Board {
    rows: usize,
    cols: usize,
    cells: Vec<i8>,  // -1=empty, 1=player1, 2=player2
}
```

### WASM-Bindgen Integration

```rust
#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new(rows: usize, cols: usize, win_condition: usize, gravity_enabled: bool) -> Game;
    
    #[wasm_bindgen(js_name = makeMove)]
    pub fn make_move_connect4_js(&mut self, col: usize) -> Result<(), GameError>;
    
    #[wasm_bindgen(js_name = getBoard)]
    pub fn get_board(&self) -> js_sys::Int8Array;
    
    #[wasm_bindgen(js_name = getLegalMoves)]
    pub fn get_legal_moves_connect4(&self) -> js_sys::Uint32Array;
}
```

### Performance-Optimierungen

- **Memory Layout**: Kontinuierliche Arrays für Cache-Effizienz
- **SIMD-Ready**: Vektorisierte Operationen für Pattern-Matching
- **Zero-Allocation**: Minimale Heap-Allokationen in Hot Paths
- **Bit-Packing**: Effiziente Representation für AI-Evaluierung

## 🌐 JavaScript UI Layer

### ES6-Module-Architektur

```javascript
// Moderne Import/Export-Patterns
import { CoordUtils } from '../../../assets/js/coord-utils.js';
import { Game, Player } from '../../game_engine/pkg/game_engine.js';

export class ConnectFourUI {
    constructor(game) {
        this.game = game;
        this.init();
    }
    
    async init() {
        await this.initWasm();
        this.setupEventListeners();
        this.render();
    }
}
```

### Koordinaten-Standardisierung

```javascript
// CoordUtils - Eliminiert Coordinate-Mapping-Bugs
export const CoordUtils = {
    // Grid ↔ Array Index Conversions
    gridToIndex: (row, col, cols) => row * cols + col,
    indexToGrid: (index, cols) => [Math.floor(index / cols), index % cols],
    
    // Bounds Validation
    validateCoords: (row, col, maxRow, maxCol) => 
        row >= 0 && row < maxRow && col >= 0 && col < maxCol,
    
    // Game-specific Helpers
    gomokuGridToPixel: (row, col, boardSize, padding, gridSize) => {
        const gridArea = boardSize - (2 * padding);
        const cellSize = gridArea / (gridSize - 1);
        return [padding + (col * cellSize), padding + (row * cellSize)];
    }
};
```

### WASM-Integration-Pattern

```javascript
// Standard WASM-Loading-Pattern
async function initGame() {
    // 1. WASM Module laden
    await init();
    
    // 2. Game-Engine erstellen
    const wasmGame = new Game(6, 7, 4, true);  // Connect4
    
    // 3. UI-Controller verbinden
    const ui = new ConnectFourUI(wasmGame);
    await ui.init();
    
    // 4. Global für Debugging verfügbar machen
    window.game = wasmGame;
    window.ui = ui;
}
```

## 🎨 Design System

### Tailwind CSS Komponenten (`assets/css/main.css`)

```css
@layer components {
    /* Game Board Standards */
    .game-board-grid {
        @apply grid gap-1 p-2 bg-gray-800 rounded-lg shadow-inner;
    }
    
    /* Button System */
    .game-button {
        @apply px-4 py-2 rounded-lg font-semibold transition-all duration-200
               bg-blue-600 hover:bg-blue-700 active:bg-blue-800 
               text-white shadow-md hover:shadow-lg;
    }
    
    /* Responsive Game Cards */
    .game-card {
        @apply bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl 
               hover:-translate-y-2 transition-all duration-300 
               cursor-pointer outline-none focus:ring-4 focus:ring-indigo-300 
               relative min-h-[300px] block;
    }
}
```

### Responsive Grid System

```css
/* Mobile-First Responsive Design */
.game-grid {
    @apply grid grid-cols-1 gap-4 p-4;
    
    @screen md {
        @apply grid-cols-2 gap-6 p-8;
    }
    
    @screen xl {
        @apply grid-cols-3 gap-8;
    }
}
```

### Accessibility Standards

```css
/* Keyboard Navigation */
.keyboard-user .game-card:focus {
    @apply ring-4 ring-blue-500 ring-opacity-75;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
    .game-piece {
        @apply border-4 border-black;
    }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
    .game-card {
        @apply transition-none;
    }
}
```

## 🔧 Build Pipeline

### Vite Configuration (`vite.config.js`)

```javascript
export default defineConfig({
    // Multi-Page Application Setup
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                connect4: resolve(__dirname, 'games/connect4/index.html'),
                gomoku: resolve(__dirname, 'games/gomoku/index.html'),
                trio: resolve(__dirname, 'games/trio/index.html'),
            }
        }
    },
    
    // WASM Support
    plugins: [
        // Legacy Browser Support
        legacy({
            targets: ['defaults', 'not IE 11']
        })
    ],
    
    // Optimizations
    define: {
        __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
});
```

### WASM Build Process

```bash
# 1. Rust Compilation zu WASM
wasm-pack build game_engine --target web --out-dir pkg

# 2. TypeScript Definitions generieren
# → game_engine.d.ts (automatisch von wasm-bindgen)

# 3. JavaScript Bindings
# → game_engine.js (WASM loader)

# 4. Binary WASM Module
# → game_engine_bg.wasm (compiled Rust code)
```

### PostCSS Pipeline (`postcss.config.cjs`)

```javascript
module.exports = {
    plugins: {
        '@tailwindcss/postcss': {},  // Tailwind 4.x
        autoprefixer: {},            // Browser prefixes
    },
};
```

## ⚡ Performance Architecture

### Rust Performance Patterns

```rust
// Hot Path Optimization
impl Board {
    #[inline(always)]
    pub fn get_cell(&self, row: usize, col: usize) -> i8 {
        // Direct array access, bounds-checked in debug mode only
        unsafe { *self.cells.get_unchecked(row * self.cols + col) }
    }
    
    // SIMD-ready pattern matching
    pub fn check_pattern_simd(&self, pattern: &[i8]) -> bool {
        // Vectorized pattern search for win detection
    }
}
```

### JavaScript Performance

```javascript
// Coordinate caching für häufige Berechnungen
class PerformantUI {
    constructor() {
        this.coordCache = new Map();
        this.pixelCache = new Map();
    }
    
    getCachedPixelCoords(row, col) {
        const key = `${row},${col}`;
        if (!this.pixelCache.has(key)) {
            this.pixelCache.set(key, CoordUtils.gomokuGridToPixel(row, col, 390, 20, 15));
        }
        return this.pixelCache.get(key);
    }
}
```

### Memory Management

```rust
// Stack-allocated performance structures
#[repr(align(64))]  // Cache line alignment
pub struct FastBoard {
    cells: [i8; 49],  // Stack allocation für 7x7 Board
}

// Zero-copy WASM interface
impl FastBoard {
    pub fn as_js_array(&self) -> js_sys::Int8Array {
        js_sys::Int8Array::view(&self.cells)
    }
}
```

## 🧪 Testing Strategy

### Rust Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_connect4_win_detection() {
        let mut game = Game::new(6, 7, 4, true);
        // Setup winning position...
        assert_eq!(game.check_win(), Some(Player::Yellow));
    }
    
    #[test]
    fn test_performance_benchmark() {
        let mut game = Game::new(6, 7, 4, true);
        let start = std::time::Instant::now();
        
        for _ in 0..10000 {
            game.evaluate_position();
        }
        
        assert!(start.elapsed().as_millis() < 100);  // Sub-100ms für 10k evaluations
    }
}
```

### JavaScript Integration Tests

```javascript
// WASM-JavaScript Integration (Vitest)
import { test, expect } from 'vitest';
import init, { Game, Player } from '../game_engine/pkg/game_engine.js';

test('WASM integration works correctly', async () => {
    await init();
    
    const game = new Game(6, 7, 4, true);
    game.make_move_connect4_js(3);
    
    const board = game.get_board();
    expect(board[35]).toBe(1);  // Bottom row, column 3
});
```

### UI Integration Tests

```javascript
// DOM-WASM Integration Tests
test('coordinate mapping accuracy', () => {
    const [pixelX, pixelY] = CoordUtils.gomokuGridToPixel(7, 7, 390, 20, 15);
    expect(pixelX).toBe(195);  // Exact center calculation
    expect(pixelY).toBe(195);
});
```

### Performance Tests

```javascript
// Performance benchmarks
test('coordinate conversion performance', () => {
    const start = performance.now();
    
    for (let i = 0; i < 10000; i++) {
        CoordUtils.gridToIndex(i % 15, (i * 7) % 15, 15);
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10);  // Sub-10ms für 10k conversions
});
```

## 🔄 Development Workflow

### Lokale Entwicklung

```bash
# 1. WASM Development
npm run watch:rust    # Auto-rebuild bei Rust-Änderungen
npm run wasm:build   # Manual rebuild

# 2. Frontend Development  
npm run dev          # Vite dev server mit HMR
npm run test:watch   # Test watch mode

# 3. Quality Assurance
npm run lint         # ESLint code analysis
npm run format       # Prettier formatting
npm run ci          # Complete CI pipeline
```

### Deployment Pipeline

```bash
# GitHub Actions Workflow
1. Rust Tests → cargo test
2. WASM Build → wasm-pack build
3. JS Tests → npm test
4. Lint Check → npm run lint:check
5. Build → npm run build
6. Deploy → GitHub Pages
```

## 📊 Architecture Metrics

### Performance Targets
- **WASM Startup**: < 50ms initial load
- **Game Logic**: < 1ms per move evaluation  
- **UI Response**: < 16ms für 60fps animations
- **Memory Usage**: < 10MB für complete game state
- **Stone Positioning**: Pixel-perfect placement mit `getBoundingClientRect()`

### UI-Module System Metriken ⭐
- **Code-Reduktion**: 33% weniger Code (Gomoku: 1646 → 950 Zeilen)
- **Wiederverwendbarkeit**: Eine BaseGameUI für alle Spiele
- **Wartbarkeit**: Modulare Architektur eliminiert Code-Duplizierung

### Code Quality Metrics
- **Type Coverage**: 100% WASM interfaces mit TypeScript
- **Test Coverage**: > 90% für core game logic
- **Bundle Size**: < 500KB für complete application
- **Accessibility**: WCAG 2.1 AA compliance

---

**🏗️ Architecture designed for performance, maintainability, and extensibility**