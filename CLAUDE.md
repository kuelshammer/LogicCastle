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
- **Development server**: `npm run dev` (Vite server with HMR on port 5173)
- **Legacy HTTP server**: `npm run serve` (Simple HTTP server on port 8080)
- **Main entry point**: http://localhost:5173 (Vite) or open `index.html`
- **Individual games**: 
  - Connect4: http://localhost:5173/games/connect4/
  - Gomoku: http://localhost:5173/games/gomoku/
  - Trio: http://localhost:5173/games/trio/

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

## GOMOKU INPUT-SYSTEM REPARATUR ✅ ERFOLGREICH ABGESCHLOSSEN
**Status: 2025-07-02 - Alle kritischen Probleme behoben**

### ✅ Erfolgreich behobene Probleme:

1. **✅ Stone Placement Koordinaten-Fix** - Alle 225 Positionen funktional
   - **Problem**: Steine nur in Row 15 platzierbar
   - **Lösung**: Koordinaten-Mapping in `positionStoneRelativeToBoard` korrigiert
   - **Result**: Stone-Placement funktioniert in allen Reihen 0-14
   - **Test**: `test-coordinate-fix.js` bestätigt 5/5 Positionen + 4/4 Edge-Cases

2. **✅ WASD Keyboard Navigation** - Konfliktfreie Browser-Steuerung
   - **Problem**: Pfeiltasten scrollten Webseite statt Fadenkreuz zu bewegen
   - **Lösung**: WASD-Navigation implementiert + Null-Checks für Modal-Elemente
   - **Result**: W/A/S/D bewegen Cursor ohne Browser-Scroll-Konflikte
   - **Test**: `quick-wasd-test.js` bestätigt Cursor-Bewegung (7,7) → (6,7)

3. **✅ X-Key Stone Placement** - Two-Stage Input System funktional
   - **Problem**: Leertaste verursachte Browser-Scroll-Konflikte
   - **Lösung**: X-Key mit Two-Stage System (Preview → Confirm)
   - **Result**: 1. X = Preview, 2. X = Stone-Placement
   - **Test**: `test-x-key-final.js` bestätigt vollständige Stone-Placement

4. **✅ Event-Handler Browser-Konflikte eliminiert**
   - **Problem**: `gameHelpModal` null-reference blockierte alle Keyboard-Events
   - **Lösung**: Null-Checks für alle Modal-Elemente hinzugefügt
   - **Result**: Keyboard-Events erreichen WASD-Handler korrekt

### 🎮 Neue Steuerung (WASD + X System):
- **W/A/S/D**: Fadenkreuz bewegen (hoch/links/runter/rechts)
- **X**: Stein platzieren (Two-Stage: 1. Vorschau, 2. Bestätigen)  
- **Tab**: Fadenkreuz aktivieren/deaktivieren
- **Escape**: Fadenkreuz verstecken
- **Leertaste**: Nur Cursor-Aktivierung (kein Stone-Placement)

### 📊 Technische Verbesserungen:
- **Null-Safety**: Alle Modal-Elemente haben Null-Checks
- **Event-Propagation**: `preventDefault()` + `stopPropagation()` für WASD/X  
- **Browser-Kompatibilität**: Keine Scroll-Konflikte mehr
- **UI-Documentation**: Hilfe-Modal aktualisiert mit neuer Steuerung

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

## RESPONSIVES GOMOKU-BOARD DESIGN (Perplexity Research)

**Status: 2025-07-01 - Kritische Steinpositionierung mit Pixel-Werten identifiziert**

### Problem: Steine positionieren sich neben dem Spielfeld
**Root Cause:** Verwendung fester Pixel-Werte statt relativer Positionierung

### Lösung: Responsive, prozent-basierte Steinplatzierung

#### **1. Responsives, quadratisches Spielfeld**
- Nutze `aspect-ratio: 1 / 1` für quadratisches Board unabhängig von Bildschirmgröße
- Begrenze mit `max-width: 100%` und `max-height: 100%`

```css
.board {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  margin: auto;
  aspect-ratio: 1 / 1;
  max-width: 100%;
  max-height: 100%;
  border: 2px solid #333;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### **2. Steine exakt mittig auf Linienkreuzungen platzieren**
**Korrekte Positionsberechnung:**
```javascript
// Prozent-basierte Positionierung (nicht Pixel!)
const left = (col / (n-1)) * 100; // n = Anzahl Linien (15)
const top = (row / (n-1)) * 100;
```

**CSS für exakte Zentrierung:**
```css
.stone {
  position: absolute;
  width: 4%;   /* relativ zur Boardgröße */
  height: 4%;
  border-radius: 50%;
  background: black; /* oder white */
  transform: translate(-50%, -50%); /* KRITISCH für Zentrierung */
  pointer-events: none;
}
```

#### **3. Responsivität & Zoom-Kompatibilität**
- **Relative Maßeinheiten**: `%`, `vw`, `vh`, `fr` statt Pixel
- **Skalierung**: Steine und Linien proportional zur Boardgröße
- **Koordinaten**: Immer auf Basis aktueller Boardgröße, nie feste Pixelwerte

#### **4. Beispiel-Koordinatenberechnung**
Für Gomoku 15×15 (Linien 0-14):
```javascript
// Stein bei j11 (col=9, row=4 in 0-indexiert)
const leftPercent = (9 / 14) * 100; // ≈ 64.3%
const topPercent = (4 / 14) * 100;  // ≈ 28.6%
```

#### **5. Problem: Mixed-Einheiten (Pixel + Prozent)**
**Status: 2025-07-01 - Kritisches Problem bei Zoom/Resize identifiziert**

- **Board**: Feste 390px, 20px Padding → Zoom-Probleme
- **Steine**: Prozent-basiert → Skalieren unterschiedlich bei Zoom  
- **Ergebnis**: Steine "driften" von Gitterlinien weg bei Browser-Zoom

**Gemessene Abweichungen:**
- G7: 17.3px rechts, 28.7px unten von Gitterlinie
- B15: 11.3px links, 17px oben von Gitterlinie

#### **6. Lösung: 100% Responsive Board (Vollständig relative Einheiten)**

**Board CSS - Vollständig responsive:**
```css
.game-board {
  width: min(90vw, 90vh, 500px); /* Responsive mit Maximum */
  aspect-ratio: 1 / 1;           /* Immer quadratisch */
  padding: 5.13%;                /* 20px/390px = 5.13% */
  /* Entferne alle festen 390px/20px Werte */
}
```

**Steinpositionierung - Padding-korrigiert:**
```javascript
const paddingPercent = 5.13;  // CSS padding als Prozent
const gridPercent = 100 - (2 * paddingPercent); // 89.74% für Gitter

// Korrekte Berechnung mit Padding-Offset:
const leftPercent = paddingPercent + ((col/14) * gridPercent);
const topPercent = paddingPercent + ((row/14) * gridPercent);
```

**Vorteile:**
- ✅ Echte Zoom-/Resize-Stabilität
- ✅ Alle Elemente skalieren proportional  
- ✅ Perfekte Alignment bei jeder Bildschirmgröße
- ✅ Keine Pixel-Drift bei Browser-Zoom

#### **7. Implementierungsplan**
1. **CSS Board**: Vollständig auf relative Einheiten (vw/vh/%)
2. **JavaScript**: Padding-korrigierte Prozent-Berechnung
3. **Gitterlinien**: ::before Elemente auch auf Prozent-Basis
4. **Testing**: G7/B15 + Browser-Zoom (50%, 200%) Validierung

## ULTRATHINK: Gomoku Two-Stage Input System - Komplett-Reparatur (2025-07-01)

### 🔍 PROBLEM-ANALYSE (Root Cause Analysis)
Nach systematischer Code-Analyse wurden **5 kritische Systembauteile** identifiziert:

#### **ROOT CAUSE #1: Doppeltes Koordinaten-System** 
- **Problem**: `columnState/rowState` (für Crosshair) vs `cursor` (für Stone Placement) 
- **Symptom**: Diagonal-only Bug, Crosshair-Desync
- **Code**: ui.js:452-495 (moveColumnSelection) vs Cursor-System conflict

#### **ROOT CAUSE #2: Navigation-Mapping-Konflikt**
- **Problem**: Arrow Keys bewegen `columnState/rowState`, aber Spacebar nutzt `cursor`
- **Symptom**: Spacebar funktioniert nicht, Maus-Crosshair-Desync

#### **ROOT CAUSE #3: Event-Handler-Verwirrung**
- **Problem**: `onIntersectionClick()` setzt Cursor, aber resettet Selection falsch
- **Symptom**: Endlosschleife, Stack Overflow, Mouse-Click funktioniert nicht

#### **ROOT CAUSE #4: 15x15 Grid Navigation Boundaries**
- **Problem**: Wrap-around Logic mit falschen Grenzen (0-14 vs 1-15 Verwirrung)
- **Symptom**: Nicht alle 225 Positionen erreichbar, Rollover zu früh

#### **ROOT CAUSE #5: JavaScript Initialization Race Conditions**
- **Problem**: UI/Game Objects nicht verfügbar wenn Event Handler aufgerufen werden
- **Symptom**: System funktioniert weder lokal noch auf GitHub Pages

### 🎯 ULTRATHINK LÖSUNGSSTRATEGIE

#### **PHASE 1: KOORDINATEN-SYSTEM VEREINHEITLICHUNG (KRITISCH)**
1. **Eliminiere columnState/rowState** - Verwende nur noch `cursor` System
2. **Refactor Navigation**: Arrow Keys → cursor.row/col direkt 
3. **Fix Data Mapping**: Alle Intersections nutzen einheitliche row/col Zuordnung
4. **Boundary Fix**: Korrekte 0-14 Grenzen für 15x15 Grid

#### **PHASE 2: EVENT-SYSTEM ÜBERHOLUNG (KRITISCH)**
1. **Mouse Click Integration**: `onIntersectionClick()` → cursor position + selection logic
2. **Keyboard Integration**: Spacebar → cursor-basierte stone placement  
3. **Crosshair Sync**: Visuelle Highlights folgen cursor.row/col
4. **Event Handler Cleanup**: Robuste Event-Listener-Registrierung

#### **PHASE 3: TWO-STAGE SYSTEM STABILISIERUNG**
1. **State Management**: Klare Phase-Übergänge (navigate → preview → place)
2. **Visual Feedback**: Preview stones an cursor position
3. **Error Handling**: Robuste State-Resets bei Navigation

#### **PHASE 4: TESTING & VALIDATION**
1. **Local Server**: Systematische Tests aller 225 Positionen
2. **Input Methods**: Mouse, Keyboard, Combined scenarios
3. **Edge Cases**: Boundaries, wrap-around, selection states

### 📋 EXECUTION CHECKLIST
- [ ] Lokaler Server Setup mit Debug-Console (`uv run python -m http.server 8080`)
- [ ] Phase 1: Koordinaten-System (kritisch)
- [ ] Phase 2: Event-Handler (kritisch) 
- [ ] Phase 3: Two-Stage Polish (wichtig)
- [ ] Phase 4: Vollständige Validierung aller 225 Positionen
- [ ] GitHub Pages Deployment mit neuen Cache-Bustern

**Geschätzte Zeit**: 2-3 Stunden für robuste, systematische Lösung  
**Erfolg-Kriterium**: Alle 225 Positionen via Mouse + Keyboard erreichbar

## Architectural Guidelines (basierend auf GEMINI-Analysis)

**Referenz**: Siehe `/GEMINI_REPORTS/` für detaillierte externe Architektur-Analyse und Perplexity-Validation.

### Koordinaten-Mapping-Standards

**Standard-Konvention für alle Spiele:**
- **Indexierung**: `(row, col)` 0-based für alle Spiele (Connect4: 0-5,0-6, Gomoku: 0-14,0-14, Trio: 0-6,0-6)
- **Array-Index**: `index = row * cols + col` (einheitliche Transformation)
- **DOM-Attributes**: `data-row` und `data-col` für alle interaktiven Elemente
- **Debugging**: Nutze `CoordUtils` für alle Koordinaten-Transformationen

**Standard-Utilities für Koordinaten:**
```javascript
export const CoordUtils = {
  gridToIndex: (row, col, cols) => row * cols + col,
  indexToGrid: (index, cols) => [Math.floor(index / cols), index % cols],
  validateCoords: (row, col, maxRow, maxCol) => 
    row >= 0 && row < maxRow && col >= 0 && col < maxCol,
  // Debug-Hilfsfunktionen
  logCoordTransform: (row, col, cols) => 
    console.log(`(${row},${col}) → index ${row * cols + col}`)
};
```

### UI-Design-System-Standards

**Tailwind-Komponenten-Bibliothek:**
```css
@layer components {
  /* Game Board Standards */
  .game-board-grid { 
    @apply grid gap-1 p-2 bg-gray-800 rounded-lg;
  }
  
  /* Interactive Elements */
  .game-button { 
    @apply px-4 py-2 rounded-lg font-semibold transition-all 
           bg-blue-600 hover:bg-blue-700 text-white;
  }
  .game-button-secondary { 
    @apply px-4 py-2 rounded-lg font-semibold transition-all 
           bg-gray-600 hover:bg-gray-700 text-white;
  }
  
  /* Modal System */
  .game-modal { 
    @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
  }
  .game-modal-content { 
    @apply bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl;
  }
  
  /* Game Pieces */
  .game-piece { 
    @apply w-8 h-8 rounded-full border-2 transition-all duration-200;
  }
  .player-yellow { 
    @apply bg-yellow-400 border-yellow-600;
  }
  .player-red { 
    @apply bg-red-500 border-red-700;
  }
}
```

**Responsive Design-Patterns pro Spiel-Kategorie:**
- **Cell-based Games** (Connect4, Trio): CSS Grid mit `aspect-ratio`
- **Intersection-based Games** (Gomoku): SVG oder CSS Grid + absolute positioning
- **Hex-based Games** (zukünftig): SVG mit `viewBox`-Skalierung

**Accessibility-First-Prinzipien:**
- Alle interaktiven Elemente: `tabindex`, `aria-label`, `role` attributes
- Tastatur-Navigation für alle Spiele implementieren
- Hover + Focus states für alle klickbaren Elemente
- Screenreader-kompatible Spielzustände

### Module-System-Guidelines

**ES6-Module-Pattern für alle neuen/umgeschriebenen Dateien:**
```javascript
// game-wrapper.js
export class GameWrapper {
  constructor(wasmGame) { 
    this.wasm = wasmGame; 
  }
  
  makeMove(row, col) {
    return this.wasm.make_move_gobang_js(row, col);
  }
}

// ui-controller.js  
import { GameWrapper } from './game-wrapper.js';

export class UIController {
  constructor(gameWrapper) { 
    this.game = gameWrapper; 
  }
}

// main.js (entry point)
import { GameWrapper } from './game-wrapper.js';
import { UIController } from './ui-controller.js';

// NO window.* globals!
```

**Standard-Pattern für Game-Integration:**
1. **GameWrapper**: WASM-Interface-Klasse (eine pro Spiel)
2. **UIController**: DOM-Manipulation und Event-Handling
3. **EventHandler**: Input-System (Mouse, Keyboard, Touch)
4. **Main Entry Point**: Module-Initialisierung ohne globals

**Import/Export-Standards:**
- **Named Exports**: `export class GameWrapper` (nicht default)
- **Clear Dependencies**: Explizite imports, keine `import *`
- **No Window Pollution**: Vermeide `window.game`, `window.ui` assignments

### Build-System & Cache-Management

**Automatisches Cache-Busting:**
- **Build-Tool**: Vite für Asset-Hashing (eliminiert `?v=20250701_final_fix`)
- **CSS-Bundling**: PostCSS + Tailwind + Autoprefixer
- **Module-Bundling**: ES6-Module mit Tree-Shaking

**Development Workflow:**
- **Watch-Mode**: `npm run dev` für automatische Rebuilds
- **Hot-Reload**: Vite dev server für schnelle Iteration
- **Production Build**: `npm run build` für optimierte Assets

### Was NICHT umsetzen (aus GEMINI-Reports)

**❌ Akademische Über-Optimierungen vermeiden:**
- **Bit-Packing für Zellen**: Browser-Spiele brauchen 2-bit Optimierung nicht
- **Const-Generics für Board-Größen**: Premature optimization für unsere Use Cases
- **Zero-Allocation MoveValidator**: Über-engineered für Browser-Performance
- **Komplette KI-Migration nach Rust**: JavaScript-KI funktioniert ausreichend

**❌ Gefährliche Architektur-Änderungen:**
- **5-Phasen-Komplett-Migration**: Würde funktionierende Systeme gefährden
- **lib.rs komplett ersetzen**: Aktuelle Implementation ist stabil und produktiv
- **Trio komplett nach Rust migrieren**: Hybrid-Ansatz funktioniert bereits gut

**✅ Pragmatische Verbesserungen fokussieren:**
- **Developer Experience**: Koordinaten-Bugs, CSS-Duplikation eliminieren  
- **Code Consistency**: Module-System, Design-System standardisieren
- **Maintenance**: Build-Automatisierung, Dead-Code-Cleanup
- **User Experience**: Responsive Design, Accessibility verbessern

### GEMINI-Reports Integration

**Externe Analyse-Dokumente** (Stand: 2025-07-02):
- **Rust Structure Analysis**: `GEMINI_REPORTS/20250702-15:00:00_LogicCastle_Rust_Structure.md`
- **Refactoring Plan**: `GEMINI_REPORTS/20250702-15:30:00_Refactoring_Plan_LogicCastle.md`  
- **UI Implementation**: `GEMINI_REPORTS/20250702-17:30:00_UI_Implementation_Plan.md`
- **UI Improvements**: `GEMINI_REPORTS/20250702-17:45:00_UI_Improvement_Plan.md`
- **Perplexity Validation**: `GEMINI_REPORTS/Perplexity_LogicCastle.md`

**Adoption Strategy**: Pragmatische Developer-Experience-Verbesserungen aus Reports umsetzen, akademische Performance-Optimierungen vermeiden.