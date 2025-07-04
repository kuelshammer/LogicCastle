# LogicCastle Projektübersicht für Claude (Stand: 2025-07-04 v3)

Dieses Dokument beschreibt die aktuelle Architektur und den Implementierungsstand nach den jüngsten Refactoring-Phasen. Es dient als Leitfaden für die weitere Entwicklung.

## 1. Projektarchitektur (POST-REFACTORING)

LogicCastle wurde umfassend modernisiert. Die Architektur basiert auf einer klaren Trennung von zentralen Modulen und spielspezifischen Implementierungen.

- **Frontend-Technologien:**
  - **Build-Tool:** [Vite](https://vitejs.dev/) (`vite.config.js`)
  - **Styling:** Ein zentrales **Design System** in `assets/css/main.css` stellt wiederverwendbare UI-Komponenten (Buttons, Modals) für alle Spiele bereit. Spielspezifische Styles sind auf ein Minimum reduziert.
  - **Struktur:** Multi-Page-Application (MPA) mit einer Haupt-Landingpage und dedizierten Einstiegspunkten für jedes Spiel.

- **Backend & Spiellogik (Rust/WASM):**
  - **Game Engine:** Die Kernlogik für alle Spiele ist in einer universellen Rust-Engine (`game_engine/`) implementiert und wird mittels `wasm-pack` zu WebAssembly kompiliert.
  - **Performance:** Für Spiele mit großen Brettern (Gomoku, Trio, Hex) wird eine **`BitPackedBoard`**-Struktur verwendet, um den Speicherverbrauch drastisch zu reduzieren und die AI-Performance zu optimieren.

## 2. Implementierungsstand der Spiele

### 2.1 Gomoku - GOLDSTANDARD ⭐
- **Status:** **Vollständig migriert und validiert.** 
- **UI-Module System:** Erfolgreich als Pilot implementiert mit `ui-new.js` basierend auf `BaseGameUI`
- **Puppeteer-Validierung:** 26/26 Tests bestanden (100% Erfolgsrate)
- **Visuelle Validierung:** 98% Match zum Referenzbild Gomoku.jpg
- **Technische Basis:** Rust-Engine + BitPackedBoard + UI-Module System
- **Kritisches Problem:** Stone Placement Bug - Steine werden nicht korrekt auf Intersections positioniert

### 2.2 Connect4, Trio, Hex, L-Game
- **Status:** Funktional, aber **technisch veraltet.**
- **Migration ausstehend:** Müssen auf das neue UI-Module System migriert werden
- **Offener Punkt:** Connect4 fehlt noch BitPackedBoard-Implementierung

## 3. Zukünftige Ausrichtung und verbleibende Aufgaben

Die primären Architekturarbeiten sind abgeschlossen. Das UI-Module System ist als GOLDSTANDARD etabliert.

### 3.1 Kritische Sofortmaßnahmen (Höchste Priorität)

1. **Stone Placement Bug Fix:**
   - **Problem:** Steine werden als Child-Elemente der Intersections hinzugefügt, was zu ungenauer Positionierung führt
   - **Lösung:** Implementierung der `positionStoneOnBoard()` Methode aus dem Gemini Report
   - **Technik:** Steine direkt an gameBoard anhängen mit absoluter Pixelpositionierung

2. **Code-Bereinigung:**
   - **Gomoku:** Löschen von `ui.js`, `ui-legacy.js`, `game.js`, `ai.js`, `helpers.js`
   - **Connect4:** Löschen von `game.js`, `ui.js`, `ai.js`, `ui_v2.js`
   - **Global:** Löschen von `assets/js/game-base.js`, `test_fork_detection.html`

### 3.2 Migrations-Roadmap

1. **UI-Module System Migration:**
   - **Trio:** Migriere auf BaseGameUI-System
   - **Hex:** Migriere auf BaseGameUI-System  
   - **L-Game:** Migriere auf BaseGameUI-System
   - **Connect4:** Spezialbehandlung wegen fehlender BitPackedBoard-Implementierung

2. **Connect4 Refactoring:**
   - **Aufgabe:** Migrieren auf BitPackedBoard-Struktur nach Gomoku-Vorbild
   - **Referenz:** `games/gomoku/js/game-bitpacked.js`

3. **Trio Rust Integration:**
   - **Prüfung:** Ob Trio-Logik in Rust-Engine ausgelagert werden kann
   - **Ziel:** API-Konsistenz erhöhen

### 3.3 Qualitätssicherung

1. **Testing-Erweiterung:**
   - **Puppeteer-Tests:** Auf alle Spiele erweitern
   - **UI-Module Tests:** Robustere und wiederverwendbare Tests
   - **Visual Regression:** Systematische Validierung

2. **Dokumentation:**
   - **README.md:** Aktualisierung der Architektur-Beschreibung
   - **ARCHITECTURE.md:** Neue UI-Module System Dokumentation

## 4. Technische Erkenntnisse aus Gemini Reports

### 4.1 Stone Placement Problem (2025-07-04)
- **Ursache:** DOM-Verschachtelung (Stone als Child der Intersection) + unzuverlässige CSS-Positionierung
- **Lösung:** Direkte Positionierung mit `positionStoneOnBoard()` Methode
- **Technik:** `getBoundingClientRect()` + prozentuale Padding-Berechnung + `translate(-50%, -50%)`

### 4.2 Projekt-Audit (2025-07-04)
- **Stärken:** Moderne Toolchain, klare Rust/WASM Trennung, UI-Module System
- **Schwächen:** Code-Duplizierung, veraltete Dateien, inkonsistente UI-Implementierungen
- **Empfehlung:** Konsolidierung und Bereinigung als oberste Priorität

Dieses Dokument spiegelt den aktuellen Stand nach den Commits vom 4. Juli 2025 wider und ersetzt alle vorherigen Versionen.

# Known Issues

## Gomoku Stone Placement Issues (Stand: 2025-07-04)
- **CRITICAL:** Stone Placement Bug - Steine erscheinen nicht auf korrekten Board-Positionen
- **Ursache:** DOM-Verschachtelung - Steine werden als Child der Intersections angehängt
- **Lösung:** `positionStoneOnBoard()` Methode implementieren mit direkter gameBoard-Positionierung
- **Status:** Identifiziert, Lösung vorhanden, Implementation ausstehend

## Code-Bereinigung ausstehend (Stand: 2025-07-04)
- **Problem:** Veraltete Dateien in allen Spielen (ui.js, game.js, ai.js legacy Versionen)
- **Risiko:** Code-Duplizierung, Verwirrung, Wartungsprobleme
- **Lösung:** Systematisches Löschen nach Migration-Abschluss
- **Status:** Bereinigungsplan erstellt, Ausführung ausstehend

- Benutze IMMER `uv` für Python!