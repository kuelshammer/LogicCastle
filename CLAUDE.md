# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LogicCastle is a collection of mathematical strategy games with a modern Rust/WebAssembly core. The project features Connect4, Gobang, and Trio games with high-performance game logic implemented in Rust and modern JavaScript UI.

## Development Commands

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