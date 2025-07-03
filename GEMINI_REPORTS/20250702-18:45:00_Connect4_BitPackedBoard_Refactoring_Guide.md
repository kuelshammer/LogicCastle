
# Refactoring-Anleitung: Connect4 auf BitPackedBoard umstellen

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für das Refactoring der Connect4-Spiellogik von `Vec<i8>` auf eine speichereffiziente `BitPackedBoard`-Struktur.

## 1. Zielsetzung

Das Ziel ist die Steigerung der Performance und Speichereffizienz der Connect4-Implementierung. Durch den Umstieg auf eine bit-gepackte Datenstruktur wird die Engine schneller, verbraucht weniger Speicher und wird konsistent mit der angestrebten Zielarchitektur des Projekts. Dies ist besonders wichtig für die geplante Migration der KI nach Rust, da eine performante Engine-Basis entscheidend ist.

## 2. Die neue Datenstruktur: `BitPackedBoard<6, 7, 2>`

Wir verwenden die generische, bit-gepackte Struktur mit folgenden Parametern für Connect4:

-   `ROWS = 6`
-   `COLS = 7`
-   `BITS_PER_CELL = 2` (erlaubt die Speicherung von 4 Werten, ausreichend für 0=Leer, 1=Spieler1, 2=Spieler2).

Ein 6x7-Feld (42 Zellen) mit 2 Bits pro Zelle benötigt `(42 * 2) / 8 = 10.5`, also **11 Bytes** Speicher. Dies ist eine **Reduktion von über 75%** im Vergleich zu den **42 Bytes** der `Vec<i8>`-Lösung.

## 3. Schritt-für-Schritt Refactoring-Anleitung

### Schritt 1: `Game`-Struktur anpassen

Die `Game`-Struktur muss so angepasst werden, dass sie die spezialisierte `BitPackedBoard`-Instanz für Connect4 aufnehmen kann. Da die `Game`-Struktur auch für Gomoku verwendet wird, ist hier ein `enum` oder eine Trait-basierte Lösung ideal.

**Vorschlag mit `enum`:**

```rust
// Definiere die spezifischen Board-Typen
type Connect4Board = BitPackedBoard<6, 7, 2>;
type GomokuBoard = BitPackedBoard<15, 15, 2>;

// Enum, um die verschiedenen Spiel-Boards zu kapseln
enum GameBoard {
    Connect4(Connect4Board),
    Gomoku(GomokuBoard),
    // ... weitere Spiele
}

// Die Haupt-Game-Struktur
#[wasm_bindgen]
pub struct Game {
    board: GameBoard,
    // ... weitere Zustandsinformationen wie win_condition, current_player etc.
}
```

### Schritt 2: Konstruktor `Game::new()` anpassen

Der Konstruktor muss nun basierend auf den Parametern entscheiden, welches `GameBoard`-Enum er erstellt.

```rust
#[wasm_bindgen]
impl Game {
    pub fn new(rows: usize, cols: usize, win_condition: usize, gravity_enabled: bool) -> Self {
        let board = if rows == 6 && cols == 7 && gravity_enabled {
            GameBoard::Connect4(BitPackedBoard::<6, 7, 2>::new())
        } else if rows == 15 && cols == 15 && !gravity_enabled {
            GameBoard::Gomoku(BitPackedBoard::<15, 15, 2>::new())
        } else {
            // Fallback oder Fehler für nicht unterstützte Konfigurationen
            panic!("Unsupported game configuration");
        };

        Game {
            board,
            win_condition,
            // ...
        }
    }
}
```

### Schritt 3: Spiellogik anpassen

Alle Funktionen, die auf das Brett zugreifen, müssen nun das `GameBoard`-Enum berücksichtigen. Dies erfordert ein `match`-Statement, um die Logik für den jeweiligen Spieltyp auszuführen.

**Beispiel für `make_move_connect4_js`:**

```rust
pub fn make_move_connect4_js(&mut self, col: usize) -> Result<(), JsValue> {
    match &mut self.board {
        GameBoard::Connect4(board) => {
            // Die gesamte Logik für den Connect4-Zug kommt hier hinein.
            // Sie operiert jetzt auf der `board`-Variable vom Typ `&mut Connect4Board`.

            // Beispiel: Finde die nächste freie Reihe
            for r in (0..6).rev() {
                if board.get_cell(r, col) == 0 {
                    board.set_cell(r, col, self.current_player as u8);
                    self.current_player = self.current_player.opponent();
                    return Ok(());
                }
            }
            Err(JsValue::from_str("Column is full"))
        }
        _ => Err(JsValue::from_str("Invalid game type for this move")),
    }
}
```

Die Gewinnprüfung (`check_win`) und alle anderen Connect4-spezifischen Funktionen (`get_legal_moves_connect4`, `evaluate_position` etc.) müssen auf die gleiche Weise angepasst werden, indem sie auf die `Connect4Board`-Instanz innerhalb des `match`-Blocks zugreifen.

### Schritt 4: `get_board()`-API für JavaScript anpassen

Wie bei Trio muss die `get_board`-Funktion die bit-gepackten Daten in ein einfaches Array umwandeln, das JavaScript versteht.

```rust
pub fn get_board(&self) -> Vec<u8> {
    match &self.board {
        GameBoard::Connect4(board) => {
            let mut decoded_board = Vec::with_capacity(42);
            for r in 0..6 {
                for c in 0..7 {
                    decoded_board.push(board.get_cell(r, c));
                }
            }
            decoded_board
        }
        GameBoard::Gomoku(board) => {
            // ... entsprechende Logik für Gomoku
        }
    }
}
```

## 4. Vorteile des Refactorings

1.  **Massive Performance-Steigerung:** Die Umstellung ist die **Voraussetzung** für eine performante Rust-basierte KI. Simulationen (`fast_clone`) und Auswertungen (`evaluate_position`) werden um ein Vielfaches schneller.
2.  **Enorme Speicherersparnis:** Reduziert den Speicherbedarf des Spielbretts um über 75%.
3.  **Typsicherheit:** Die Verwendung eines `enum` für verschiedene Spieltypen macht den Code sicherer, da der Compiler sicherstellt, dass nur die korrekte Logik für den jeweiligen Spieltyp ausgeführt werden kann.
4.  **Architektonische Konsistenz:** Bringt Connect4 in Einklang mit der hochoptimierten Zielarchitektur des Projekts.
