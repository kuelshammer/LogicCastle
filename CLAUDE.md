# LogicCastle Projektübersicht für Claude (Stand: 2025-07-03 v2)

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

Der Großteil der Spiele ist funktional und auf dem neuesten technischen Stand.

- **Gomoku, Trio, Hex, L-Game:**
  - **Status:** **Vollständig migriert.** Diese Spiele nutzen die Rust-Engine und, wo sinnvoll, die `BitPackedBoard`-Implementierung. Die UIs sind an das zentrale Design-System angebunden.
  - **Vorbild:** Die Implementierung von **Gomoku** dient als Goldstandard für die Architektur des Projekts.

- **Connect4 (`/games/connect4`):**
  - **Status:** Funktional, aber **technisch teilweise veraltet.**
  - **Offener Punkt:** Im Gegensatz zu den anderen Spielen wurde die JavaScript-Logik von Connect4 noch **nicht** auf die `BitPackedBoard`-Struktur umgestellt. Die Performance und Speichereffizienz sind daher nicht auf dem Niveau der anderen Spiele.

## 3. Zukünftige Ausrichtung und verbleibende Aufgaben

Die primären Architekturarbeiten sind abgeschlossen. Die verbleibenden Aufgaben konzentrieren sich auf die Konsolidierung und Dokumentation.

1.  **🎯 KRITISCH: Puppeteer Goldstandard Validation (Stand: 2025-07-03)**
    - **Status:** Phase 2.4 der UI-Module ist vollständig implementiert - ABER noch nicht validiert!
    - **Problem:** Bisher konnte nie eine funktionierende Version erstellt werden, die dem Referenzbild `games/gomoku/Gomoku.jpg` entspricht
    - **Aufgabe:** Vollständige Verifikation mit Puppeteer-Tests gegen das Referenzbild
    - **📋 Detaillierter Plan:** Siehe `PUPPETEER_VERIFICATION_PLAN.md` für 5-Phasen Validierung
    - **Ziel:** Nur bei 100% Testpass + Visual Match → Goldstandard für andere Spiele Migration

2.  **Einführung eines "Flexiblen Modul-Layouts" für UI-Komponenten (FAST ABGESCHLOSSEN):**
    - **Problem:** Aktuell ist zwar das CSS zentralisiert, die **JavaScript-Logik** zur Erstellung und Verwaltung von UI-Elementen (z.B. Spielbrett, Statusanzeige, Menüs) ist jedoch in den jeweiligen `ui.js`-Dateien der Spiele dupliziert.
    - **Status:** Phase 2.1-2.4 für Gomoku vollständig implementiert (33% Code-Reduktion erreicht)
    - **NÄCHSTER SCHRITT:** Puppeteer validation BEVOR Migration anderer Spiele
    - **📋 Detaillierter Plan:** Siehe `TODO.md` für 8-Phasen-Roadmap mit überprüfbaren Meilensteinen.

3.  **Abschluss des Connect4-Refactorings:**
    - **Aufgabe:** Migrieren Sie die verbleibende JavaScript-Logik von Connect4 auf die `BitPackedBoard`-Struktur der Rust-Engine. Orientieren Sie sich dabei an der Implementierung in `games/gomoku/js/game-bitpacked.js`.

4.  **Vereinheitlichung der Rust-API:**
    - **Aufgabe:** Prüfen Sie, ob die spezifische `TrioGame`-Struktur in der Rust-Engine an die generischere `Game`-Struktur (verwendet von Connect4/Gomoku) angeglichen werden kann, um die API-Konsistenz zu erhöhen.

5.  **Aktualisierung der Projektdokumentation:**
    - **Aufgabe:** Aktualisieren Sie die `README.md` und `docs/ARCHITECTURE.md`, um die neue, auf Vite, Rust und dem zentralen Design-System basierende Architektur korrekt zu beschreiben.

Dieses Dokument spiegelt den aktuellen Stand nach den Commits vom 3. Juli 2025 wider und ersetzt alle vorherigen Versionen.
