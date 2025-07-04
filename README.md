# 🏰 LogicCastle

Eine Sammlung mathematischer Strategiespiele mit modernem Rust/WebAssembly-Kern und JavaScript-UI.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://www.maxkuelshammer.de/LogicCastle/)
[![Rust](https://img.shields.io/badge/Rust-WASM-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🎮 Spiele

### [🔴 4 Gewinnt (Connect4)](https://www.maxkuelshammer.de/LogicCastle/games/connect4/)
Klassisches Strategiespiel mit KI-Unterstützung und Rust-Performance.

### [⚫ 5 Gewinnt (Gomoku)](https://www.maxkuelshammer.de/LogicCastle/games/gomoku/) ⭐ **GOLDSTANDARD**
Go-Brett-basiertes Strategiespiel mit modernem UI-Module-System, pixel-perfekter Stone-Positionierung und Tastatur-Navigation.

### [🧮 Trio - Rechenspiel](https://www.maxkuelshammer.de/LogicCastle/games/trio/)
Mathematisches Puzzle-Spiel: Finde drei Zahlen mit der Formel `a×b±c = Zielzahl`.

## ⚡ Technologie-Stack

### Core Engine
- **🦀 Rust + WebAssembly**: Hochperformante Spiellogik
- **🔧 wasm-bindgen**: Type-safe Rust-JavaScript Interoperabilität
- **⚙️ Service Workers**: PWA-Funktionalität für Offline-Nutzung

### Frontend
- **📦 JavaScript ES6+**: Moderne Module-Architektur
- **🎨 Tailwind CSS**: Utility-first Design-System
- **🏗️ Vite**: Build-System mit Cache-Busting
- **🧪 Vitest**: WASM-Integration-Tests

### Entwicklung
- **🔍 ESLint + Prettier**: Code-Qualität und Formatierung
- **📋 TypeScript Definitions**: WASM-Generated Type Safety
- **🔄 GitHub Actions**: Automatisches Deployment

## 🏆 Aktuelle Technische Meilensteine (Juli 2025)

### 🔧 **Stone Placement Critical Fix - IN PROGRESS** 
- **Pipeline-Repair**: ✅ UI-Module Import-Kette repariert
- **Mouse-System**: ✅ Click-Events + Two-Stage Cursor funktioniert  
- **Board-Creation**: ✅ 225 Intersections + Crosshair-System
- **Verbleibendes Problem**: makeMove() → onMoveMade() → Stone Creation Kette
- **Status**: 🔧 **90% FUNKTIONAL** - Final Stone Placement fehlt noch

### ⚠️ **UI-Module System (BaseGameUI) - TEIL-FUNKTIONAL** 
- **Import-Pipeline**: ✅ Vollständig repariert und funktional
- **Board + Events**: ✅ 225 Intersections + Mouse-Click System funktioniert
- **Module**: ElementBinder, KeyboardController, ModalManager erfolgreich geladen
- **Verbleibendes Problem**: Game-Engine Integration für Stone-Creation
- **Status**: 🔧 **90% GOMOKU GOLDSTANDARD** - finale Debugging-Phase

### ✅ **Major Code Cleanup**
- **Gelöscht**: 10 obsolete Dateien, 5515 Zeilen Legacy-Code
- **Bereinigt**: Gomoku (5 Dateien), Connect4 (3 Dateien), Global (2 Dateien)
- **Ergebnis**: Keine Code-Duplizierung, wartbare Architektur

### ✅ **BitPackedBoard Performance**
- **Implementiert**: Gomoku, Trio mit memory-effizienter Rust-Struktur
- **Performance**: Drastisch reduzierter Speicherverbrauch für große Bretter
- **Ausstehend**: Connect4 Migration auf BitPackedBoard geplant

## 🚀 Quick Start

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/kuelshammer/LogicCastle.git
cd LogicCastle

# Dependencies installieren
npm install

# WASM kompilieren
npm run wasm:build

# Development server starten
npm run dev
```

### Verfügbare Spiele
- **Lokaler Server**: http://localhost:5173
- **Connect4**: http://localhost:5173/games/connect4/
- **Gomoku**: http://localhost:5173/games/gomoku/
- **Trio**: http://localhost:5173/games/trio/

## 🛠️ Development

### Rust/WASM Entwicklung
```bash
# WASM neu kompilieren nach Rust-Änderungen
npm run wasm:build

# Rust Watch-Mode (Auto-Rebuild)
npm run watch:rust

# Rust Tests
npm run test:rust
```

### Frontend Entwicklung
```bash
# JavaScript/HTML/CSS Tests
npm test

# UI Tests im Browser
npm run test:ui

# Code Linting
npm run lint

# Code Formatierung
npm run format
```

### Build & Deployment
```bash
# Production Build
npm run build

# Preview Build
npm run preview

# CI Pipeline (Lint + Test + Build)
npm run ci
```

## 📋 Architektur

### Rust/WASM Engine (`game_engine/`)
```
game_engine/
├── src/lib.rs          # Unified game engine für alle 3 Spiele
├── Cargo.toml          # Rust dependencies
└── pkg/                # Generated WASM output
    ├── game_engine.js      # JavaScript bindings
    ├── game_engine.d.ts    # TypeScript definitions
    └── game_engine_bg.wasm # Compiled WebAssembly
```

### UI-Module System (`assets/js/ui-modules/`) ⭐ **NEU**
- **BaseGameUI**: Wiederverwendbare Basis-Klasse für alle Spiele
- **ElementBinder**: Automatisches DOM-Element-Binding
- **KeyboardController**: Einheitliche Tastatur-Navigation
- **ModalManager**: Modulares Modal-System (Hilfe, Einstellungen, etc.)

### JavaScript UI Layer (`games/*/js/`)
- **Modern ES6-Module**: Import/Export statt window.*-Globals
- **Koordinaten-Standards**: `CoordUtils` für alle Spiele
- **WASM-Integration**: Type-safe Game-Engine-Zugriff
- **Stone Positioning**: Pixel-perfekte `positionStoneOnBoard()` Methode

### Design System (`assets/`)
- **Zentrales CSS**: Wiederverwendbare UI-Komponenten für alle Spiele
- **Koordinaten-Utils**: Standardisierte Grid-Transformationen
- **Landing-Page-Module**: ES6-basierte Navigation

## 🎯 Architektur-Prinzipien

### ✅ CRITICAL RULE: Rust/WASM für Spiellogik
- **Alle Spiellogik** wird in Rust implementiert und zu WASM kompiliert
- **JavaScript** ist nur für UI-Layer und WASM-Module-Loading
- **Keine JavaScript-Fallbacks** für Game-Engines

### ✅ Koordinaten-Standard
- **Convention**: `(row, col)` 0-basierte Indexierung für alle Spiele
- **Utils**: `CoordUtils.gridToIndex()`, `CoordUtils.clampCoords()`, etc.
- **Pixel-Conversion**: `CoordUtils.gomokuGridToPixel()` für präzise Positionierung

### ✅ UI-Module System (BaseGameUI)
- **Gomoku = GOLDSTANDARD**: Vollständig migriert mit 33% Code-Reduktion
- **Modulare Architektur**: ElementBinder, KeyboardController, ModalManager
- **Wiederverwendbarkeit**: Eine Basis-Klasse für alle Spiele
- **Stone Positioning**: Pixel-perfekte `positionStoneOnBoard()` Methode

### ✅ ES6-Module-First
- **Import/Export**: Statt globaler window.*-Zuweisungen
- **Type Safety**: WASM-generierte TypeScript-Definitionen
- **Code Splitting**: Module-basierte Architektur

## 🔧 Development Commands (Übersicht)

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Vite Development Server |
| `npm run wasm:build` | Rust → WASM Compilation |
| `npm run watch:rust` | Auto-Rebuild bei Rust-Änderungen |
| `npm test` | Vitest mit WASM-Integration |
| `npm run lint` | ESLint Code-Analyse |
| `npm run build` | Production Build |
| `npm run ci` | Complete CI Pipeline |

## 📈 Performance

### Rust vs. JavaScript
- **10x+ Performance** für Game-Logic durch Rust/WASM
- **BitPackedBoard**: Memory-effiziente Rust-Struktur für große Bretter
- **Type Safety**: Compile-time Garantien

### UI-Module System
- **33% Code-Reduktion**: Von 1646 → 950 Zeilen (Gomoku)
- **Stone Positioning**: Pixel-perfekte Positionierung ohne DOM-Nesting
- **Modulare Wiederverwendbarkeit**: Ein System für alle Spiele

### Web Standards
- **Progressive Web App**: Service Worker für Offline-Nutzung
- **Responsive Design**: Mobile-optimierte Touch-Bedienung
- **Accessibility**: Keyboard-Navigation und Screen-Reader-Support

## 🤝 Contributing

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/amazing-feature`
3. **Commit** mit semantischen Messages: `feat: add amazing feature`
4. **Push** zum Branch: `git push origin feature/amazing-feature`
5. **Pull Request** öffnen

### Code-Standards
- **Rust**: `cargo fmt` + `cargo clippy`
- **JavaScript**: ESLint + Prettier
- **Commits**: Conventional Commits Format
- **Tests**: Vitest für Integration, Cargo Test für Rust

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🔗 Links

- **Live Demo**: https://www.maxkuelshammer.de/LogicCastle/
- **GitHub Repository**: https://github.com/kuelshammer/LogicCastle
- **Rust/WASM Guide**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

**🦀 Powered by Rust + 🕸️ WebAssembly + ⚡ Modern JavaScript**