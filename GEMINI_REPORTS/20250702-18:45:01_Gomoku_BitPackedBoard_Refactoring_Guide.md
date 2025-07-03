
# Refactoring-Anleitung: Gomoku auf BitPackedBoard umstellen

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für das Refactoring der Gomoku-Spiellogik von `Vec<i8>` auf eine speichereffiziente `BitPackedBoard`-Struktur.

## 1. Zielsetzung

Das Ziel ist die Steigerung der Performance und Speichereffizienz der Gomoku-Implementierung. Gomoku profitiert enorm von diesem Refactoring, da seine komplexen Analysefunktionen (Threat-Detection, Pattern-Matching) auf einem großen 15x15-Brett sehr rechenintensiv sind. Die Umstellung auf eine bit-gepackte Struktur ist entscheidend, um eine schnelle und intelligente KI sowie eine reaktionsschnelle Spielerunterstützung zu ermöglichen.

## 2. Die neue Datenstruktur: `BitPackedBoard<15, 15, 2>`

Wir verwenden die generische, bit-gepackte Struktur mit folgenden Parametern für Gomoku:

-   `ROWS = 15`
-   `COLS = 15`
-   `BITS_PER_CELL = 2` (erlaubt die Speicherung von 4 Werten, ausreichend für 0=Leer, 1=Spieler1, 2=Spieler2).

Ein 15x15-Feld (225 Zellen) mit 2 Bits pro Zelle benötigt `(225 * 2) / 8 = 56.25`, also **57 Bytes** Speicher. Dies ist eine **Reduktion von über 74%** im Vergleich zu den **225 Bytes** der `Vec<i8>`-Lösung.

## 3. Schritt-für-Schritt Refactoring-Anleitung

### Schritt 1: `Game`-Struktur anpassen

Wie im Connect4-Leitfaden beschrieben, wird die `Game`-Struktur erweitert, um verschiedene Spieltypen zu unterstützen.

```rust
// Definiere die spezifischen Board-Typen
type Connect4Board = BitPackedBoard<6, 7, 2>;
type GomokuBoard = BitPackedBoard<15, 15, 2>;

// Enum, um die verschiedenen Spiel-Boards zu kapseln
enum GameBoard {
    Connect4(Connect4Board),
    Gomoku(GomokuBoard),
}

#[wasm_bindgen]
pub struct Game {
    board: GameBoard,
    // ...
}
```

### Schritt 2: Konstruktor und Board-Zugriffe anpassen

Der `Game::new()`-Konstruktor wird, wie im Connect4-Guide gezeigt, angepasst, um basierend auf den Brettdimensionen eine `GameBoard::Gomoku`-Instanz zu erstellen. Alle Funktionen, die auf das Brett zugreifen, müssen ein `match`-Statement verwenden, um die Logik für den `GomokuBoard`-Typ auszuführen.

### Schritt 3: Portierung der Gomoku-Analysefunktionen

Dies ist der kritischste und aufwändigste Teil des Refactorings. Alle Gomoku-spezifischen Analysefunktionen müssen so umgeschrieben werden, dass sie mit der neuen `BitPackedBoard`-Struktur arbeiten.

**Beispiel für `detect_open_three`:**

**Vorher (konzeptionell):**
```rust
pub fn detect_open_three(&self, player: Player) -> Vec<usize> {
    // ...
    for row in 0..self.board.rows {
        for col in 0..self.board.cols {
            // Verwendet self.board.get_cell(r, c), was einen Result<i8, ...> zurückgibt
            if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                // ... komplexe Logik mit vielen .unwrap_or()
            }
        }
    }
    // ...
}
```

**Nachher (konzeptionell):**
```rust
// Diese Funktion würde jetzt innerhalb eines `match` aufgerufen werden
// und den `GomokuBoard` direkt erhalten.
fn detect_open_three_on_board(board: &GomokuBoard, player: Player) -> Vec<usize> {
    // ...
    for row in 0..15 {
        for col in 0..15 {
            // Direkter, schneller Zugriff ohne Result<>
            if board.get_cell(row, col) == 0 {
                // Die Logik hier wird einfacher und performanter, da die
                // Zugriffe auf das Board optimiert sind.
            }
        }
    }
    // ...
}
```

**Zu portierende Funktionen:**
-   `_make_move_gobang`
-   `check_win` (angepasst für 15x15)
-   `get_legal_moves_gobang`
-   `evaluate_position_advanced` und alle seine Helfer (`evaluate_threats`, `evaluate_patterns`, etc.)
-   `detect_open_three`
-   `detect_closed_four`
-   `detect_double_three_forks`
-   `get_threat_level`
-   `get_winning_moves_gobang`
-   `get_blocking_moves_gobang`
-   `get_dangerous_moves_gobang`

### Schritt 4: `get_board()`-API für JavaScript anpassen

Die `get_board`-Funktion muss die 15x15-Daten für JavaScript dekodieren.

```rust
pub fn get_board(&self) -> Vec<u8> {
    match &self.board {
        GameBoard::Connect4(board) => {
            // ...
        }
        GameBoard::Gomoku(board) => {
            let mut decoded_board = Vec::with_capacity(225);
            for r in 0..15 {
                for c in 0..15 {
                    decoded_board.push(board.get_cell(r, c));
                }
            }
            decoded_board
        }
    }
}
```

## 4. Vorteile des Refactorings

1.  **Drastische Performance-Steigerung:** Die komplexen Analyse-Algorithmen von Gomoku sind der Hauptprofiteur dieses Refactorings. Eine schnelle Engine ermöglicht eine stärkere KI und eine verzögerungsfreie Spielerunterstützung in Echtzeit.
2.  **Signifikante Speicherersparnis:** Reduziert den Speicherbedarf des Spielbretts um über 74%, was bei der Simulation von Tausenden von Spielzuständen für die KI entscheidend ist.
3.  **Vereinfachter Code:** Obwohl die `BitPackedBoard`-Struktur selbst komplex ist, wird der Code in den Analysefunktionen *einfacher*, da die fehleranfälligen `Result`-Typen und `unwrap()`-Aufrufe beim Zugriff auf das Brett entfallen.
4.  **Architektonische Konsistenz:** Vereinheitlicht die Datenstruktur für alle gitterbasierten Spiele und schafft eine solide Grundlage für zukünftige Erweiterungen.
