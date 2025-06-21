# Regression Tests (Bug-Fix Validierung)

Dieses Verzeichnis enthält Tests zur Validation von Bug-Fixes und Prevent von Regressionen.

## Test-Kategorien

### `regression-animation-chaos.js`
- Animation Chaos Prevention (Critical Bug Fix)
- Enhanced Smart Bot State Isolation
- Multiple Column Animation Detection
- Game State Corruption Prevention

### `regression-state-corruption.js`
- Game State Isolation Tests
- Helper System State Safety
- AI State Manipulation Prevention
- Event System Isolation

### `regression-ui-blocking.js`
- UI Responsiveness Validation
- Animation Blocking Prevention
- Input Handling Continuity
- Game Flow Disruption Detection

### `regression-turn-order.js`
- Turn Sequence Validation
- Bot Move Timing
- Player Switch Consistency
- Move History Integrity

### `regression-helper-safety.js`
- Helper System Safety Tests
- Strategic Analysis Isolation
- Board Simulation Accuracy
- Memory Safety Validation

### `regression-known-bugs.js`
- Collection aller bekannten und gefixten Bugs
- Automatische Regression Detection
- Bug Reproduction Tests
- Fix Effectiveness Validation

## Namenskonvention
Alle Tests beginnen mit `regression-` gefolgt vom Bug-Bereich.

## Test-Philosophie
- Jeder kritische Bug bekommt einen permanenten Regression Test
- Tests validieren nicht nur dass der Bug fixed ist, sondern auch dass er nicht zurückkehrt
- Hohe Priorität für Tests die schwer zu debuggende Bugs detektieren

## Critical Bug History
- **Animation Chaos Bug**: Enhanced Smart Bot korrumpierte Game State
- **Turn Order Chaos**: Doppelte AI-Triggering in Bot Mode
- **State Corruption**: Direkte Game State Manipulation in Helper Functions