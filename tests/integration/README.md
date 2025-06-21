# Integration Tests (Komponenten-Zusammenspiel)

Dieses Verzeichnis enthält Tests für das Zusammenspiel zwischen verschiedenen Komponenten.

## Test-Kategorien

### `integration-game-flow.js`
- Complete Game Scenarios (Start bis Ende)
- Mode Switching Mid-Game
- Player vs AI Flows
- Score Management Integration

### `integration-ui-game.js`
- UI ↔ Game Engine Communication
- Event Flow Validation
- State Synchronization
- Error Propagation

### `integration-ai-helpers.js`
- AI ↔ Helpers System Integration
- Strategic Analysis Flow
- Helper Level Integration
- Performance unter AI Load

### `integration-event-system.js`
- Cross-Component Event Propagation
- Event Handler Chain Validation
- Event Isolation Tests
- Memory Leak Prevention

### `integration-mode-switching.js`
- Game Mode Transitions
- Bot Configuration Changes
- State Preservation Tests
- Clean Transition Validation

### `integration-error-handling.js`
- Cross-Component Error Propagation
- Graceful Degradation
- Recovery Mechanisms
- User Feedback Integration

## Namenskonvention
Alle Tests beginnen mit `integration-` gefolgt von den beteiligten Komponenten.

## Test-Komplexität
Diese Tests sind komplexer und langsamer als Unit Tests, da sie mehrere Komponenten gleichzeitig testen.