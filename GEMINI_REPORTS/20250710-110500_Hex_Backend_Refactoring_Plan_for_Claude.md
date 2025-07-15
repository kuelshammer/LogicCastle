# Report für Claude: Blaupause zur Neukonzeption des Hex-Backends in Rust/WASM

**An:** Claude
**Von:** Gemini
**Datum:** 10. Juli 2025
**Betreff:** Strategie zur Implementierung eines Hex-Backends nach dem 3-Schicht-Modell (4-Gewinnt-Standard)

---

Hallo Claude,

unsere Analyse hat ergeben, dass für das Spiel **Hex** derzeit **kein Rust/WASM-Backend** existiert. Die gesamte Spiellogik befindet sich in der JavaScript-Datei `games/hex/js/hex-game.js`. Geplante Umsetzungen in Rust wurden bisher nicht realisiert.

Dies bietet uns die perfekte Gelegenheit, das Hex-Backend von Grund auf nach unserem bewährten **3-Schicht-Modell** zu konzipieren, das sich bei 4-Gewinnt als "Goldstandard" etabliert hat. Dieses Dokument dient als detaillierte Blaupause für diese Implementierung.

## 1. Das Ziel: Die 3-Schicht-Architektur für Hex

Wir werden die Logik aus `hex-game.js` in drei klar getrennte, komponierbare Schichten in Rust überführen:

1.  **Daten-Schicht (`BitPackedBoard`):** Speichert den Zustand des Spielbretts hocheffizient. Für ein 11x11 Hex-Brett benötigen wir pro Spieler ein `BitPackedBoard<11, 11, 1>`, da jede Zelle nur zwei Zustände hat (besetzt oder leer).
2.  **Geometrie-Schicht (`HexGrid`):** Kapselt die komplexe Logik der hexagonalen Brettgeometrie. Dies ist die anspruchsvollste Schicht für Hex.
3.  **KI-Schicht (`HexAI`):** Implementiert die KI-Logik, z.B. auf Basis von Monte Carlo Tree Search (MCTS), und nutzt die anderen beiden Schichten zur Analyse.

Die `HexGame`-Struktur wird diese drei Schichten als Komposition zusammenführen und die Spiel-API für das Frontend bereitstellen.

## 2. Schritt-für-Schritt-Implementierungsplan

### Schritt 1: Die Geometrie-Schicht (`HexGrid`)

Dies ist der kritischste Teil, da die Hex-Geometrie komplexer ist als ein einfaches Raster.

1.  **Struktur `HexGrid` erstellen:**
    *   Erstelle eine neue Datei `game_engine/src/geometry/hex_grid.rs`.
    *   Definiere die Struktur `HexGrid`, die die Brettgröße (z.B. 11x11) als Konstante enthält.

2.  **Nachbarschafts-Logik implementieren:**
    *   Implementiere eine Funktion `get_neighbors(row: usize, col: usize) -> Vec<(usize, usize)>`. Diese Funktion ist entscheidend für die Pfadfindung und muss die sechs Nachbarn einer Hex-Zelle korrekt zurückgeben.

3.  **Gewinnbedingungs-Logik kapseln:**
    *   Die Gewinnbedingung bei Hex ist die Verbindung zweier gegenüberliegender Seiten. `HexGrid` muss die Start- und Endpunkte für beide Spieler definieren.
    *   **Spieler 1 (Horizontal):** Verbindet die linke mit der rechten Kante.
    *   **Spieler 2 (Vertikal):** Verbindet die obere mit der unteren Kante.
    *   Implementiere eine Funktion `is_winning_path(board: &BitPackedBoard<11, 11, 1>, player: Player) -> bool`. Diese Funktion nutzt einen Pfadfindungsalgorithmus (z.B. Breitensuche/BFS oder Tiefensuche/DFS), um zu prüfen, ob ein durchgehender Pfad von besetzten Zellen von einer Seite zur anderen existiert.

### Schritt 2: Die Daten-Schicht und die Haupt-Spiel-Struktur

1.  **`HexGame`-Struktur erstellen:**
    *   Erstelle die Datei `game_engine/src/games/hex.rs`.
    *   Definiere die `HexGame`-Struktur nach dem Vorbild von `Connect4Game`:
        ```rust
        use crate::data::BitPackedBoard;
        use crate::geometry::HexGrid;
        use crate::ai::HexAI;

        #[wasm_bindgen]
        pub struct HexGame {
            geometry: HexGrid,
            player1_board: BitPackedBoard<11, 11, 1>,
            player2_board: BitPackedBoard<11, 11, 1>,
            ai: HexAI,
            current_player: Player,
            winner: Option<Player>,
            // ... weitere Zustandsfelder
        }
        ```

2.  **Spiellogik implementieren:**
    *   Implementiere die `make_move(row: usize, col: usize)`-Funktion. Diese Funktion prüft, ob der Zug gültig ist, aktualisiert das `BitPackedBoard` des aktuellen Spielers und ruft dann die `is_winning_path`-Funktion der `HexGrid`-Schicht auf, um den Spielzustand zu überprüfen.

### Schritt 3: Die KI-Schicht (`HexAI`)

1.  **`HexAI`-Struktur erstellen:**
    *   Erstelle die Datei `game_engine/src/ai/hex_ai.rs`.
    *   Definiere die `HexAI`-Struktur.

2.  **MCTS implementieren:**
    *   Hex ist ein perfekter Kandidat für eine MCTS-basierte KI, da der Verzweigungsfaktor hoch ist und positionelles Spiel eine große Rolle spielt.
    *   Implementiere eine `get_best_move`-Funktion, die eine MCTS-Suche durchführt. Die Simulationen (Rollouts) können zufällig sein, aber die Expansionsstrategie sollte Züge bevorzugen, die näher am Zentrum oder an bestehenden eigenen Steinen liegen.

### Schritt 4: Die WASM-API

**Ziel:** Eine saubere, vollständige API für das JavaScript-Frontend bereitstellen.

*   Exportiere alle notwendigen Funktionen mit `#[wasm_bindgen]`:
    *   `new()`
    *   `make_move(row: usize, col: usize)`
    *   `get_board() -> Vec<u8>`
    *   `get_current_player() -> Player`
    *   `get_winner() -> Option<Player>`
    *   `is_game_over() -> bool`
    *   `get_ai_move() -> Option<(usize, usize)>`
    *   `can_undo()` und `undo_move()`

## 3. Vorteile dieser Architektur

*   **Wartbarkeit:** Jede Schicht hat eine klare Verantwortung. Änderungen an der KI beeinflussen nicht die Geometrie. Änderungen an der Brettgröße werden primär in der Geometrie-Schicht vorgenommen.
*   **Performance:** Die Nutzung von `BitPackedBoard` und die Ausführung der rechenintensiven Pfadfindungs- und KI-Algorithmen in Rust/WASM wird eine massive Geschwindigkeitssteigerung gegenüber der aktuellen JavaScript-Implementierung bringen.
*   **Testbarkeit:** Jede Schicht kann isoliert getestet werden. Wir können die Pfadfindung in `HexGrid` testen, ohne eine vollständige `HexGame`-Instanz zu benötigen.
*   **Wiederverwendbarkeit:** Die `BitPackedBoard`-Struktur ist bereits wiederverwendbar. Eine gut implementierte `HexAI` mit MCTS könnte als Vorlage für andere Strategiespiele dienen.

## 4. Fazit

Die Neukonzeption des Hex-Backends in Rust ist eine lohnende Investition. Indem wir von Anfang an auf das bewährte 3-Schicht-Modell setzen, stellen wir sicher, dass das Ergebnis performant, wartbar und erweiterbar ist. Diese Blaupause bietet einen klaren Weg, um die bestehende JavaScript-Logik in eine robuste und zukunftsfähige Rust/WASM-Engine zu überführen.