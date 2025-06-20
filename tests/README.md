# Connect4 Test Utilities

Diese Test-Utilities ermöglichen es, spezifische Spielsituationen für Connect4 zu erstellen und das Smart Bot Verhalten systematisch zu testen.

## 🚀 Quick Start

```bash
# Alle Tests (UI + Smart Bot)
npm test

# Smart Bot Tests (basic)
npm run test:bot

# Smart Bot Helper Level Validation
npm run test:levels

# Comprehensive Smart Bot Tests (all levels)
npm run test:bot-full

# Test-Interface im Browser öffnen
npm run serve
# -> http://localhost:8080/tests/test-smart-bot.html
# -> http://localhost:8080/tests/manual-level-validation.html
```

## 🎯 Helper Level Testing

### **Level 0-2 Validation Methods:**

1. **Browser Console (Quick):**
   ```javascript
   // Open: http://localhost:8080/tests/test-smart-bot.html
   // Copy-paste from: tests/quick-level-check.js
   quickLevelCheck()
   ```

2. **Manual Browser Interface:**
   ```
   # Open: http://localhost:8080/tests/manual-level-validation.html
   # Click "Run All Level Tests"
   ```

3. **Automated Testing:**
   ```bash
   npm run test:levels          # Helper level validation
   npm run test:bot-full        # Comprehensive test suite
   ```

## 📋 Connect4TestUtils Verwendung

### Pattern-Format

```javascript
// Spalten von links nach rechts (1-7), Steine von unten nach oben
"empty,red,yellow,red-yellow,empty,empty,yellow"

// Bedeutung:
// Spalte 1: leer
// Spalte 2: roter Stein unten
// Spalte 3: gelber Stein unten  
// Spalte 4: roter Stein unten, gelber Stein oben
// Spalte 5: leer
// Spalte 6: leer
// Spalte 7: gelber Stein unten
```

### Beispiele

```javascript
// Spiel und AI initialisieren
const game = new Connect4Game();
const ai = new Connect4AI('smart-random');
const helpers = new Connect4Helpers(game, null);

// Einfache Position erstellen
Connect4TestUtils.createTestPosition(
    game, 
    "empty,yellow,yellow,yellow,empty,empty,empty", 
    2  // Gelb am Zug
);

// Smart Bot Zug testen
const botMove = ai.getBestMove(game, helpers);
console.log(`Bot spielt Spalte ${botMove + 1}`);

// Board anzeigen
console.log(Connect4TestUtils.toAscii(game));
```

### Vordefinierte Szenarien

```javascript
// Verfügbare Szenarien laden
Connect4TestUtils.loadScenario(game, 'redWinning', 1);        // Rot kann gewinnen
Connect4TestUtils.loadScenario(game, 'yellowMustBlock', 2);   // Gelb muss blockieren  
Connect4TestUtils.loadScenario(game, 'trapScenario', 1);      // Fallen-Situation
Connect4TestUtils.loadScenario(game, 'complexThreats', 2);    // Komplexe Bedrohungen
```

### ASCII Board Format

```javascript
// Von ASCII-Board erstellen
const asciiBoard = `
. . . . . . .
. . . . . . .
. . . . . . .
. . . R . . .
. . Y R . . .
. R Y Y . Y .
`;

Connect4TestUtils.createFromAscii(game, asciiBoard, 2);
```

## 🤖 Smart Bot Test-Szenarien

### **Level 0 Tests (Gewinnzüge erkennen):**

#### L0.1: Horizontale Gewinnzüge
```javascript
Connect4TestUtils.createTestPosition(game, "empty,yellow,yellow,yellow,empty,empty,empty", 2);
const move = ai.getBestMove(game, helpers);
// Expected: move === 0 oder move === 4 (Spalte 1 oder 5)
```

#### L0.2: Vertikale Gewinnzüge
```javascript
Connect4TestUtils.createTestPosition(game, "empty,empty,empty,yellow-yellow-yellow,empty,empty,empty", 2);
const move = ai.getBestMove(game, helpers);
// Expected: move === 3 (Spalte 4)
```

#### L0.3: Diagonale Gewinnzüge
```javascript
// Manuelle Board-Setup für diagonale Sequenzen
game.board[5][1] = game.PLAYER2; // Yellow bottom
game.board[4][2] = game.PLAYER2; // Yellow middle
game.board[3][3] = game.PLAYER2; // Yellow upper
// Expected: move === 4 (Spalte 5 komplettiert Diagonale)
```

### **Level 1 Tests (Bedrohungen blockieren):**

#### L1.1: Horizontale Bedrohung blockieren
```javascript
Connect4TestUtils.createTestPosition(game, "red,red,red,empty,empty,empty,empty", 2);
const move = ai.getBestMove(game, helpers);
// Expected: move === 3 (Spalte 4 blockieren)
```

#### L1.2: Vertikale Bedrohung blockieren
```javascript
Connect4TestUtils.createTestPosition(game, "empty,empty,red-red-red,empty,empty,empty,empty", 2);
const move = ai.getBestMove(game, helpers);
// Expected: move === 2 (Spalte 3 blockieren)
```

#### L1.3: Diagonale Bedrohung blockieren
```javascript
// Manuelle Setup für diagonale Red-Bedrohung
game.board[5][0] = game.PLAYER1; // Red bottom
game.board[4][1] = game.PLAYER1; // Red middle  
game.board[3][2] = game.PLAYER1; // Red upper
// Expected: move === 3 (Spalte 4 blockiert Diagonale)
```

### **Level 2 Tests (Fallen vermeiden):**

#### L2.1: Basis Fallen-Vermeidung
```javascript
Connect4TestUtils.loadScenario(game, 'trapScenario', 2);
const move = ai.getBestMove(game, helpers);
// Expected: Gültiger Zug, der keine Gegner-Chancen schafft
```

#### L2.2: Komplexe Positions-Sicherheit
```javascript
Connect4TestUtils.createTestPosition(game, "empty,red-yellow,red-yellow-red,yellow-red-yellow,red-yellow,yellow-red,empty", 2);
const move = ai.getBestMove(game, helpers);
// Expected: Sicherer Zug basierend auf Level 2 Analyse
```

### **Prioritäts-Tests (Level-Hierarchie):**

#### P1: Gewinnen über Blockieren
```javascript
Connect4TestUtils.createTestPosition(game, "yellow,yellow,yellow,empty,red,red,red", 2);
const move = ai.getBestMove(game, helpers);
// Expected: move === 3 (Gewinnen hat Priorität über Blockieren)
```

#### P2: Blockieren über Sicherheit
```javascript
Connect4TestUtils.createTestPosition(game, "red,red,red,empty,yellow,yellow,empty", 2);
const move = ai.getBestMove(game, helpers);
// Expected: move === 3 (Blockieren hat Priorität über "sichere" Züge)
```

## 🛠️ Test-Utilities API

### Connect4TestUtils

| Methode | Beschreibung |
|---------|-------------|
| `createTestPosition(game, pattern, player)` | Erstellt Position aus Pattern-String |
| `createFromAscii(game, ascii, player)` | Erstellt Position aus ASCII-Board |
| `loadScenario(game, scenario, player)` | Lädt vordefiniertes Szenario |
| `toAscii(game)` | Konvertiert Board zu ASCII-String |
| `validatePosition(game)` | Prüft ob Position physikalisch möglich |

### Vordefinierte Szenarien

| Szenario | Beschreibung |
|----------|-------------|
| `redWinning` | Rot kann in nächstem Zug gewinnen |
| `yellowMustBlock` | Gelb muss Rot blockieren |
| `trapScenario` | Komplexe Fallen-Situation |
| `complexThreats` | Mehrere Bedrohungen gleichzeitig |
| `almostFull` | Fast volles Brett |

## 📊 Test-Ergebnisse interpretieren

```javascript
// Smart Bot Prioritäten (in Reihenfolge):
// 1. Eigener Gewinnzug (Level 0)
// 2. Gegner blockieren (Level 1) 
// 3. Fallen vermeiden (Level 2)
// 4. Zufälliger Zug

// Bei leeren Brett: Immer Mitte (Spalte 4)
// Bei mehreren gleichwertigen Zügen: Zufällige Auswahl
```

## 🎯 Typische Test-Patterns

```javascript
// Pattern für horizontale Bedrohung
"red,red,red,empty,empty,empty,empty"  // Spalte 4 bedroht

// Pattern für vertikale Bedrohung  
"empty,empty,empty,red-red-red,empty,empty,empty"  // Spalte 4 bedroht

// Pattern für diagonale Bedrohung
"red,empty,empty,empty,empty,empty,empty"
// + manuelle Board-Manipulation für Diagonalen

// Pattern für Fallen-Szenario
"empty,red,yellow,red-yellow,yellow-red,red,empty"
```

## 🔧 Erweiterte Nutzung

### Eigene Test-Szenarien erstellen

```javascript
// Neues Szenario zu Connect4TestUtils.scenarios hinzufügen
Connect4TestUtils.scenarios.myScenario = "red,yellow,empty,red-yellow,empty,yellow,red";

// Verwenden
Connect4TestUtils.loadScenario(game, 'myScenario', 1);
```

### Integration in CI/CD

```javascript
// In package.json scripts:
"test:bot": "node tests/run-bot-tests.js",
"ci": "npm run lint:check && npm run format:check && npm test && npm run test:bot"
```

## 📝 Hinweise

- **Pattern-Validation**: Automatische Prüfung auf physikalisch mögliche Positionen
- **Browser-Tests**: Nutzen echte Connect4-Klassen für maximale Genauigkeit
- **Randomisierung**: Smart Bot wählt zufällig bei mehreren gleichwertigen Zügen
- **Debugging**: ASCII-Output zeigt Board-Zustand für einfaches Debugging

Diese Test-Utilities bieten eine umfassende Grundlage für systematisches Bot-Testing und Qualitätssicherung der Connect4-KI.