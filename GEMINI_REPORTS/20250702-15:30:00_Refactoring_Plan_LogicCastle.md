
# Refactoring-Plan für die LogicCastle Game Engine

**An:** Coding LLM
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Umfassender Plan zur Vereinheitlichung und Optimierung der Rust-basierten Game Engine.

## 1. Zusammenfassung

Dieses Dokument beschreibt den Plan zur Umstrukturierung der Spiel-Logik des `LogicCastle`-Projekts. Das Ziel ist es, die aktuell existierenden, teilweise redundanten und inkonsistenten Architekturen in eine einzige, hochperformante und gut wartbare Rust/WASM-Engine zu überführen.

Die drei Hauptziele sind:
1.  **Vereinheitlichung der Rust-Engines:** Die beiden Implementierungen `lib.rs` und `lib_alternative.rs` werden zu einer einzigen, überlegenen Engine zusammengeführt.
2.  **Migration der Connect4-KI:** Die JavaScript-basierte KI für 4 Gewinnt wird zur Steigerung der Performance nach Rust verlagert.
3.  **Migration der Trio-Logik:** Das komplette Spiel Trio, das aktuell in reinem JavaScript implementiert ist, wird in die Rust-Engine integriert.

## 2. Analyse des IST-Zustands

Eine Analyse des Projekts hat drei verschiedene Architekturansätze aufgedeckt:

### 2.1. Duale Rust-Engine

Es existieren zwei Implementierungen der Engine mit unterschiedlichen Zielen:

| Aspekt | `lib.rs` (Genutzt) | `lib_alternative.rs` (Nicht genutzt) |
| :--- | :--- | :--- |
| **Architektur** | Flexibel, eine `Game`-Struktur für alle Spiele. | Spezialisiert, mit Typen wie `Connect4Game`. |
| **Performance** | Mittelmäßig (vollständige Board-Scans). | Sehr hoch (lokalisierte Checks, Bit-Packing). |
| **Features** | Vollständig (inkl. Gomoku-Analyse & Trio). | Unvollständig (fokussiert auf Connect4). |

**Fazit:** Die Spiele nutzen die flexible, aber langsamere Engine. Eine hochperformante Alternative existiert, ist aber nicht voll integriert.

### 2.2. Connect4: Hybride Architektur

-   **Spiellogik (Regeln):** In Rust/WASM (`lib.rs`).
-   **KI (Intelligenz):** In JavaScript (`games/connect4/js/ai.js`).

**Fazit:** Dies ist ein Performance-Flaschenhals. Die rechenintensive KI-Logik profitiert nicht von der Geschwindigkeit von Rust.

### 2.3. Trio: Reine JavaScript-Architektur

-   **Spiellogik & KI:** Komplett in JavaScript (`games/trio/js/`).

**Fazit:** Inkonsistent mit der Gesamtarchitektur des Projekts. Verpasst die Performance- und Sicherheitsvorteile von Rust/WASM.

## 3. VORSCHLAG: Plan zur Vereinheitlichung und Migration

Dieser Plan beschreibt die Schritte, um eine einzige, konsistente und hochperformante Architektur zu schaffen.

### Phase 1: Entwicklung der neuen, vereinheitlichten Rust-Engine

**Ziel:** Das Beste aus `lib.rs` und `lib_alternative.rs` in einer neuen Engine vereinen.

-   **Rust-Änderungen:**
    1.  **Datenstruktur erstellen:** Implementiere eine generische, speichereffiziente Board-Struktur: `struct BitPackedBoard<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize>`. `BITS_PER_CELL` wäre `2` für Connect4/Gomoku und `4` für Trio (um Zahlen 1-9 zu speichern).
    2.  **Traits definieren:** Erstelle ein `GameLogic`-Trait. Dieses Trait wird Methoden wie `check_win`, `get_legal_moves`, `evaluate_position` etc. definieren.
    3.  **Logik implementieren:** Implementiere das `GameLogic`-Trait für die verschiedenen Spiele. Nutze dabei die Performance-Optimierungen aus `lib_alternative.rs` (z.B. lokalisierte Gewinnprüfung).
    4.  **Einheitliche API schaffen:** Erstelle eine Haupt-Struct `LogicCastleGame`, die über `wasm-bindgen` exportiert wird. Diese Struct wird die Anfragen an die passenden, via Traits implementierten Spiellogiken weiterleiten.

-   **JS/UI-Änderungen:** Keine in dieser Phase. Es wird die Grundlage für spätere Phasen geschaffen.

### Phase 2: Migration der Connect4-KI nach Rust

**Ziel:** Die JS-basierte KI durch eine schnellere Rust-KI ersetzen.

-   **Rust-Änderungen:**
    1.  **Minimax-Algorithmus implementieren:** Füge der neuen Rust-Engine einen Minimax-Algorithmus mit Alpha-Beta-Pruning hinzu. Dieser sollte die schnellen Simulations- und Evaluationsfunktionen der neuen Engine nutzen.
    2.  **Neue API-Funktion exportieren:** Erstelle eine Funktion `get_connect4_ai_move(&mut self) -> usize`, die den besten Zug für die KI berechnet und zurückgibt.

-   **JavaScript-Änderungen:**
    1.  **`games/connect4/js/game.js` anpassen:** Die `makeAiMove`-Funktion (oder eine ähnliche) wird nicht mehr die JS-KI in `ai.js` aufrufen, sondern die neue WASM-Funktion `get_connect4_ai_move`.
    2.  **`games/connect4/js/ai.js` löschen:** Diese Datei wird nach der Migration überflüssig.

-   **UI-Änderungen:** Keine direkten Änderungen nötig. Die UI wird lediglich von einer deutlich schnelleren und stärkeren KI profitieren.

### Phase 3: Migration des Trio-Spiels nach Rust

**Ziel:** Die komplette Spiellogik von Trio aus JavaScript entfernen und in Rust implementieren.

-   **Rust-Änderungen:**
    1.  **Trio-Logik implementieren:** Implementiere das `GameLogic`-Trait für Trio. Dies beinhaltet:
        -   Initialisierung des 7x7-Boards mit Zahlen (basierend auf Schwierigkeit).
        -   Generierung der Ziel-Chips.
        -   Eine performante Funktion `check_trio_solution(positions: Vec<(u8, u8)>) -> bool`.
        -   Eine Funktion `find_all_solutions(target: u8) -> Vec<Solution>`.
    2.  **Trio-API exportieren:** Mache die neuen Trio-Funktionen über die `LogicCastleGame`-Struct in WASM verfügbar.

-   **JavaScript-Änderungen:**
    1.  **`games/trio/js/game.js` refaktorisieren:** Diese Datei wird zu einem reinen, schlanken Wrapper, der die Aufrufe an die WASM-Engine weiterleitet (ähnlich wie bei Connect4/Gomoku).
    2.  **`games/trio/js/ai.js` refaktorisieren/löschen:** Die Lösungsfindungs-Logik wird ebenfalls nach Rust verlagert und über die WASM-API aufgerufen.

-   **UI-Änderungen:**
    1.  **`games/trio/js/ui.js` anpassen:** Die UI muss so angepasst werden, dass sie die neuen Wrapper-Funktionen in `game.js` aufruft, anstatt direkt auf die alte JS-Spiellogik zuzugreifen.

### Phase 4: Gomoku auf die neue Engine umstellen

**Ziel:** Gomoku an die neue, vereinheitlichte Engine anpassen, um von deren Performance zu profitieren.

-   **Rust-Änderungen:**
    1.  **Gomoku-Analysefunktionen portieren:** Die fortgeschrittenen Analysefunktionen aus `lib.rs` (z.B. `detect_open_three`, `detect_double_three_forks`) müssen für die neue `BitPackedBoard`-Struktur implementiert werden.

-   **JavaScript-Änderungen:**
    1.  **`games/gomoku/js/game_v2.js` anpassen:** Der Code muss so geändert werden, dass er die API der neuen, vereinheitlichten `LogicCastleGame`-Struct aufruft. Die Namen der WASM-Funktionen könnten sich leicht ändern.
    2.  **`games/gomoku/js/wasm-integration.js` anpassen:** Auch hier müssen die Funktionsaufrufe an die neue, einheitliche API angepasst werden.

-   **UI-Änderungen:** Keine direkten Änderungen erwartet, da die Abstraktion durch `game_v2.js` und `wasm-integration.js` bestehen bleibt.

### Phase 5: Aufräumen und Abschluss

**Ziel:** Das Projekt von altem Code befreien und die Konsistenz sicherstellen.

-   **Dateisystem-Änderungen:**
    1.  **Löschen:** `game_engine/src/lib_alternative.rs` und die alten JS-Logikdateien (`games/connect4/js/ai.js`, `games/trio/js/game.js`, `games/trio/js/ai.js` etc.) werden endgültig gelöscht.
    2.  **Umbenennen:** Die neue Engine-Datei in `game_engine/src/lib.rs` umbenennen.
-   **Testing:**
    1.  Alle bestehenden Tests (`vitest` und `cargo test`) müssen an die neue Architektur angepasst und ausgeführt werden.
    2.  Neue Unit-Tests für die migrierte KI- und Trio-Logik in Rust hinzufügen.
