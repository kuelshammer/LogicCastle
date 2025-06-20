# Connect4 Test Utilities

Diese Test-Utilities ermöglichen es, spezifische Spielsituationen für Connect4 zu erstellen und das Smart Bot Verhalten systematisch zu testen.

## 🚀 Quick Start

```bash
# Alle Tests (UI + Smart Bot)
npm test

# Nur Smart Bot Tests
npm run test:bot

# Test-Interface im Browser öffnen
npm run serve
# -> http://localhost:8080/tests/test-smart-bot.html
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

### Test 1: Eröffnungsstrategie
```javascript
// Leeres Brett -> sollte Mitte spielen (Spalte 4)
const game = new Connect4Game();
const move = ai.getBestMove(game, helpers);
// Expected: move === 3 (0-indexed)
```

### Test 2: Gewinnzug erkennen
```javascript
Connect4TestUtils.createTestPosition(
    game, 
    "empty,yellow,yellow,yellow,empty,empty,empty", 
    2
);
const move = ai.getBestMove(game, helpers);
// Expected: move === 0 oder move === 4 (Spalte 1 oder 5)
```

### Test 3: Bedrohung blockieren
```javascript
Connect4TestUtils.createTestPosition(
    game, 
    "red,red,red,empty,empty,empty,empty", 
    2
);
const move = ai.getBestMove(game, helpers);
// Expected: move === 3 (Spalte 4 blockieren)
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