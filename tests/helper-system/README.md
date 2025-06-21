# Helper-System Tests (Strategische Analyse)

Dieses Verzeichnis enthält Tests für das Connect4Helpers-System.

## Test-Kategorien

### `helper-system-levels.js`
- Level 0: Gewinnzug-Erkennung (Horizontal, Vertikal, Diagonal)
- Level 1: Bedrohungs-Blockierung (alle Richtungen)
- Level 2: Fallen-Vermeidung und Look-ahead

### `helper-system-strategic.js`
- Even/Odd Threat Analysis Validation
- Zugzwang Detection Accuracy
- Fork Opportunity Analysis
- Strategic Evaluation Consistency

### `helper-system-hints.js`
- Visual Hints System
- Textual Hints Generation
- Forced Move Mode
- Hint Priority System

### `helper-system-events.js`
- Event System Integration
- State Change Notifications
- UI Communication Tests
- Event Isolation Validation

### `helper-system-performance.js`
- Analysis Performance unter komplexen Boards
- Memory Usage Monitoring
- Hint Update Frequency
- Strategic Calculation Benchmarks

### `helper-system-regression.js`
- State Corruption Prevention
- Game State Isolation Tests
- Anti-Chaos Validation
- Board Simulation Accuracy

## Namenskonvention
Alle Tests beginnen mit `helper-system-` gefolgt von der Test-Kategorie.

## Test-Strategien
- Verwendet Connect4TestUtils für standardisierte Testpositionen
- Validiert sowohl Algorithmus-Korrektheit als auch Performance
- Stellt sicher, dass Helpers nie die Game State korrumpieren