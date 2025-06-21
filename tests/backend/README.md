# Backend Tests (Spiel-Engine)

Dieses Verzeichnis enthält Tests für die Core Game Logic von Connect4.

## Test-Kategorien

### `backend-game-core.js`
- Spielinitialisierung
- Board-Setup und -Manipulation
- Zug-Validierung und -Ausführung
- Gewinn-/Unentschieden-Erkennung

### `backend-game-edge-cases.js`
- Edge Cases für Gewinn-Situationen
- Vollständig gefüllte Bretter
- Komplexe Diagonal-Wins
- Grenzwert-Szenarien

### `backend-game-state.js`
- State Management (Reset, Undo, Redo)
- Board State Integrity
- Move History Validation
- Player Configuration

### `backend-simulation.js`
- `simulateMove()` Accuracy Tests
- Board Copy Integrity
- State Isolation Validation
- Memory Leak Prevention

### `backend-events.js`
- Event System Isolation
- Event Propagation Testing
- Event Handler Validation
- State Corruption Prevention

## Namenskonvention
Alle Tests beginnen mit `backend-` um sie klar von anderen Komponenten zu unterscheiden.

## Laufzeit-Charakteristik
Diese Tests sollten schnell (<50ms pro Test) und deterministisch sein.