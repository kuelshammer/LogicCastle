# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LogicCastle is a collection of mathematical strategy games with a modern Rust/WebAssembly core. The project features Connect4, Gomoku, and Trio games with high-performance game logic implemented in Rust and modern JavaScript UI.

## Development Commands

### Rust/WASM Development
- **Watch Rust changes**: `npm run watch:rust` (auto-rebuild WASM on file changes)
- **Development mode**: `npm run dev:rust` (cargo watch + clippy + WASM rebuild)
- **Build WASM**: `npm run wasm:build` (compile Rust to WebAssembly)
- **Watch script**: `./watch-rust.sh` (direct script for advanced workflows)

### Testing
- **Run all tests**: `npm test` (Vitest with WASM integration)
- **Watch mode**: `npm run test:watch` (development with auto-reload)
- **UI tests**: `npm run test:ui` (browser-based test interface)
- **Coverage**: `npm run test:coverage` (test coverage reporting)
- **Rust tests**: `npm run test:rust` (native Rust unit tests)
- **Integration tests**: `npm run test:integration` (WASM-JS integration)
- **UI integration**: `npm run test:ui-integration` (DOM-based UI tests)

### Code Quality
- **Lint code**: `npm run lint` (ESLint with WASM-aware rules)
- **Format code**: `npm run format` (Prettier for consistent style)
- **CI pipeline**: `npm run ci` (full quality check + tests)

### Local Development
- **Serve locally**: `npm run serve` (HTTP server on port 8080)
- **Development mode**: `npm run dev` (server + test watch mode)
- **Main entry point**: Open `index.html` in browser
- **Individual games**: Navigate to `games/{game-name}/index.html`

### GitHub Pages Deployment
- **Live site**: https://www.maxkuelshammer.de/LogicCastle/
- **Connect4**: https://www.maxkuelshammer.de/LogicCastle/games/connect4/
- **Gomoku**: https://www.maxkuelshammer.de/LogicCastle/games/gomoku/
- **Trio**: https://www.maxkuelshammer.de/LogicCastle/games/trio/
- Changes pushed to main branch are automatically deployed

### Pre-Push Requirements
⚠️ **ALWAYS update landing page timestamp before pushing!**
- Before every `git push`, update the "Letzte Aktualisierung" timestamp on `index.html`
- Use current date/time in German format: "DD.MM.YYYY - HH:MM Uhr"
- This helps verify that GitHub Pages deployment was successful
- Example: "Letzte Aktualisierung: 28.06.2025 - 15:30 Uhr"

### Build Commands
- **WASM build**: `npm run wasm:build` (compile Rust to WebAssembly)
- **Tailwind CSS**: `npm run tailwind:build` (build CSS from input.css)

## Technology Stack & Tooling

### Core Technologies
- **Rust + WebAssembly**: Complete game engine with performance-critical logic
- **JavaScript ES6+**: UI layer and browser integration
- **HTML5 & CSS3**: Semantic markup and modern styling
- **WASM-Bindgen**: Type-safe Rust-JavaScript interoperability
- **Service Workers**: PWA capabilities for offline play

### Development Tools
- **Rust Toolchain**: cargo, wasm-pack for WebAssembly compilation
- **Node.js/npm**: Package management and build scripts
- **ESLint**: Code linting with WASM-aware rules
- **Prettier**: Code formatting with consistent style
- **Vitest**: Modern test runner with WASM integration testing
- **JSDOM**: Browser environment simulation for testing
- **Tailwind CSS**: Utility-first CSS framework

### CI/CD Pipeline
- **Quality Gates**: ESLint + Prettier + comprehensive test suites
- **Rust Testing**: Native Rust unit tests with cargo test
- **Integration Testing**: WASM-JavaScript integration validation
- **Performance Testing**: Rust core performance benchmarks

## Architecture Overview

### Rust/WASM Core Engine
The game logic is implemented in Rust with WebAssembly compilation:

```rust
// Unified Game struct for Connect4/Gobang
pub struct Game {
    board: Board,
    win_condition: usize,
    gravity_enabled: bool,
    current_player: Player,
}

// Specialized TrioGame for number puzzle
pub struct TrioGame {
    board: Board,
    target_number: u8,
}

// Memory-efficient board representation
pub struct Board {
    rows: usize,
    cols: usize,
    cells: Vec<i8>,
}
```

### JavaScript UI Layer
Modern ES6+ modules handle browser integration:
- DOM manipulation and event handling
- WASM module loading and initialization
- Responsive design and mobile touch support
- PWA features and offline functionality

### Project Structure
```
LogicCastle/
├── game_engine/        # Universal Rust/WASM core
│   ├── src/
│   │   └── lib.rs     # Game engine for all three games
│   ├── Cargo.toml     # Rust dependencies
│   └── pkg/           # Generated WASM output
│       ├── game_engine.js
│       ├── game_engine_bg.wasm
│       └── game_engine.d.ts
└── games/
    ├── connect4/      # Connect4 UI + config
    │   ├── index.html
    │   ├── css/
    │   └── cli.js     # CLI demo using central engine
    ├── gobang/        # Gobang UI + config  
    └── trio/          # Trio UI + config
```

## Current Development Status

**Status: Complete Rust/WASM Migration & Legacy Cleanup ✅ (2025-06-27)**

### ✅ Major Architectural Transformation Completed
- **🦀 Full Rust/WASM Core**: Complete game engine implemented in Rust with WebAssembly compilation
- **📦 Legacy Code Cleanup**: Removed 6000+ lines of JavaScript legacy code, tests, and development tools
- **🧪 Modern Test Suite**: New Vitest-based testing with WASM integration tests and UI testing
- **⚡ Performance**: Rust core provides significant performance improvements over JavaScript
- **🛠️ Streamlined Tooling**: Simplified build system focused on Rust + modern JavaScript
- **🎯 Clean Architecture**: Unified game engine supporting Connect4, Gobang, and Trio

### 🎮 Current Game Implementation Status
- **Connect4**: ✅ Complete Rust/WASM implementation with CLI demo
- **Gobang**: ⚠️ Rust core ready, needs UI integration
- **Trio**: ✅ Complete Rust/WASM implementation 

### 🎯 Next Development Priorities
1. **UI Development**: Create modern UI for Rust/WASM games
2. **Progressive Web App**: Implement PWA features for offline play
3. **Mobile Optimization**: Touch-friendly responsive design

## Development Guidelines

### Code Conventions
- **Rust First**: Game logic implemented in Rust for performance and safety
- **WASM Integration**: Use wasm-bindgen for type-safe JavaScript interop
- **Modern JavaScript**: ES6+ modules for UI layer, avoid legacy patterns
- **Testing First**: Write tests for both Rust core and JavaScript integration
- **Performance Focus**: Leverage Rust performance advantages

### Working with Rust/WASM
- **Core Development**: Implement game logic in `game_engine/src/lib.rs`
- **WASM Build**: Run `npm run wasm:build` to compile central engine
- **Testing**: Use both `npm run test:rust` and `npm run test:integration`
- **Multi-Game Support**: One engine supports Connect4, Gobang, and Trio
- **Type Safety**: Leverage Rust's type system and wasm-bindgen annotations
- **Error Handling**: Use Result<T, E> patterns for robust error handling

### Critical Patterns
- **WASM Loading**: Always await WASM module initialization before game creation
- **Memory Management**: Rust handles memory safety, avoid manual memory management in JS
- **Performance**: Heavy computation in Rust, UI responsiveness in JavaScript
- **Error Boundaries**: Graceful error handling across WASM-JS boundary

### Known Issues & Workarounds
- **WASM Loading**: Ensure module initialization before accessing Rust types
- **Browser Compatibility**: WASM requires modern browsers (Chrome 57+, Firefox 52+)
- **Build Process**: Run `npm run wasm:build` after any Rust code changes
- **Type Definitions**: Use generated TypeScript definitions for better IDE support

## Development Notes
- **WASM First**: Prioritize Rust implementation for game logic
- **Clean Architecture**: Maintain separation between Rust core and JavaScript UI
- **Performance**: Rust core provides 10x+ performance improvements over legacy JavaScript
- **Modern Stack**: Focus on modern web standards and progressive enhancement

## CRITICAL RULE: RUST/WASM ONLY FOR GAME LOGIC
⚠️ **NEVER implement game logic in JavaScript as fallback!**
- ALL game logic MUST be implemented in Rust and compiled to WASM
- JavaScript is ONLY for UI layer and WASM module loading
- If WASM fails to load, show error message - do NOT create JavaScript game engine
- This project is specifically designed to showcase Rust/WASM performance
- Any JavaScript game logic implementation violates the core architecture principle

## CRITICAL RULE: ALWAYS USE UV FOR PYTHON
⚠️ **NEVER use python3 or python directly - ALWAYS use uv!**
- For running Python: `uv run python script.py`
- For HTTP server: `uv run python -m http.server 8080`
- For pip installs: `uv add package-name`
- UV provides faster, more reliable Python environment management
- This ensures consistent Python tooling across the project

## GOBANG INPUT-SYSTEM NEUDESIGN PLAN
**Status: 2025-06-30 - Akute Probleme mit Stein-Positionierung und Input-System**

### Aktuelle Probleme:
1. **Stein-Positionierung**: Steine landen nicht exakt auf Gitterpunkten
2. **Click-Probleme**: Nicht alle Gitterpunkte sind anklickbar
3. **Fehlende Tastatur-Navigation**: Kein Keyboard-Support
4. **Hilfen-System**: Deaktiviert wegen WASM-Integration-Konflikten

### ULTRATHINK-Plan: 4-Phasen Implementierung

#### **Phase 1: Grid-Präzision (SOFORT - Kritisch)**
**Ziel:** Mathematisch exakte Positionierung der Intersections und Steine

1.1. **Koordinaten-Mathematik korrigieren**
   - Board-Größe: 350px × 350px (ohne Padding)
   - Gitterabstand: 350px ÷ 14 Intervalle = 25px exakt
   - Intersection-Koordinaten: `x = col * 25`, `y = row * 25`
   - Range: (0,0) bis (350,350) für 15×15 Grid

1.2. **CSS-Gitterlinien synchronisieren**
   ```css
   background-image: 
     repeating-linear-gradient(to right, #8b4513 0px, #8b4513 2px, transparent 2px, transparent 25px),
     repeating-linear-gradient(to bottom, #8b4513 0px, #8b4513 2px, transparent 2px, transparent 25px);
   ```

1.3. **Click-Bereiche optimieren**
   - Intersection-Größe: 32×32px (statt 24×24px)
   - Überlappungsfreie Positionierung
   - Bessere Touch-Targets für Mobile

1.4. **Puppeteer-Test:** Exakte Stein-Positionierung auf allen Gitterlinien

#### **Phase 2: Cursor-System (KERN-FEATURE)**
**Ziel:** Robuste Tastatur-Navigation und visueller Cursor

2.1. **Cursor-State-Management**
   ```javascript
   this.cursor = {
     row: 7,        // Startposition Mitte
     col: 7,
     active: true,  // Cursor sichtbar
     mode: 'navigate' // 'navigate' | 'confirm'
   };
   ```

2.2. **Visuelle Cursor-Darstellung**
   - Gelber Ring/Highlight auf aktueller Position
   - Animierte Übergänge zwischen Positionen
   - Deutlich sichtbar über Steinen und leerem Brett

2.3. **Tastatur-Navigation**
   - **Pfeiltasten**: Cursor über 15×15 Grid bewegen
   - **Leertaste**: Stein an Cursor-Position platzieren
   - **Escape**: Cursor deaktivieren/verstecken
   - **Tab**: Cursor aktivieren wenn versteckt

2.4. **Puppeteer-Test:** Vollständige Tastatur-Navigation über das gesamte Brett

#### **Phase 3: Zwei-Stufen-Maus-Input (UX-VERBESSERUNG)**
**Ziel:** Präzise Maus-Steuerung mit Bestätigungssystem

3.1. **Cursor-Auswahl per Mausklick**
   - Klick auf Intersection: Cursor springt zu dieser Position
   - Cursor wird automatisch sichtbar und aktiv
   - Hover-States für bessere UX

3.2. **Stein-Platzierung bei Wiederholung**
   - Erster Klick: Position auswählen (Cursor bewegen)
   - Zweiter Klick auf gleiche Position: Stein platzieren
   - Alternative: Bestätigungs-Button für Touch-Geräte

3.3. **Visuelle Feedback-States**
   - `hover`: Maushover über Intersection
   - `selected`: Cursor an dieser Position  
   - `preview`: Vorschau des zu platzierenden Steins
   - `occupied`: Position bereits belegt

3.4. **Puppeteer-Test:** Kombinierte Maus+Tastatur Interaktionen

#### **Phase 4: Hilfen-Integration (STRATEGISCH)**
**Ziel:** WASM-Integration reparieren und Hilfen-Overlay implementieren

4.1. **WASM-Integration API-Konflikte lösen**
   - GobangGame vs. WasmGobangIntegration Methodennamen-Konflikte
   - Korrekte Game-State-Synchronisation
   - `resetGame()` vs. `newGame()` API-Vereinheitlichung

4.2. **Hilfen-Overlay auf Grid**
   - **Gewinnzüge**: Grüne Highlights direkt auf Intersections
   - **Blockier-Züge**: Rote Highlights
   - **Gefährliche Züge**: Orange Warnungen
   - **Threat-Level**: Nummer-Overlay (0-5)

4.3. **Cursor-basierte Threat-Anzeige**
   - Dynamische Bewertung der Cursor-Position
   - Mini-Tooltip mit Threat-Level und Grund
   - Integration in Cursor-Highlight-System

4.4. **Puppeteer-Test:** Hilfen + Input-System Kompatibilität

### Technische Spezifikationen:
- **Grid-Mathematik**: 15×15 Intersections, 25px Abstand, 0-350px Range
- **Input-Modi**: Tastatur (primär), Maus-Zweistufen (sekundär)
- **Visuelle Hierarchie**: Cursor > Hilfen > Steine > Grid
- **WASM-Integration**: Unified API für alle Game-Engines
- **Testing**: Puppeteer nach jeder Phase für Live-Website-Validierung

### Erfolgs-Kriterien:
✅ Steine landen exakt auf Gitterlinien-Schnittpunkten  
✅ Alle 225 Positionen (15×15) sind per Tastatur+Maus erreichbar  
✅ Flüssige Navigation mit Pfeiltasten über das gesamte Brett  
✅ Hilfen-System zeigt korrekte Analyse-Werte  
✅ Keine Input-Konflikte zwischen den verschiedenen Modi