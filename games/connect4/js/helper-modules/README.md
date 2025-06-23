# Connect4 Helper System Modules

This directory contains the modular helper system components for Connect4 strategic analysis.

## Module Architecture

### Core Components
- **threat-detector.js** - Detects immediate winning/losing positions
- **opportunity-analyzer.js** - Identifies strategic opportunities and forks
- **move-validator.js** - Validates moves and identifies dangerous positions
- **hint-manager.js** - Manages hint display and forced move logic
- **helper-system.js** - Main coordinator with backward compatibility

### Design Principles
- **Separation of Concerns**: Each module handles one specific aspect
- **Event-Driven Communication**: Modules communicate via events
- **Backward Compatibility**: Maintains existing Connect4Helpers API
- **Testability**: Each module can be tested independently
- **Performance**: Optimized for real-time game analysis

## Usage

```javascript
// Legacy usage (still supported)
const helpers = new Connect4Helpers(game, ui);

// New modular usage
import { Connect4HelperSystem } from './helper-system.js';
const helpers = new Connect4HelperSystem(game, ui);
```

## Module Dependencies

```
helper-system.js (Main Controller)
├── threat-detector.js (Win/Block Detection)
├── opportunity-analyzer.js (Strategic Analysis)
├── move-validator.js (Move Safety)
└── hint-manager.js (UI Integration)
```

All modules are designed to work together while remaining independently testable.