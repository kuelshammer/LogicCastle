
# Refactoring-Anleitung: Trio auf BitPackedBoard umstellen

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für das Refactoring der Trio-Spiellogik von `Vec<i8>` auf eine speichereffiziente `BitPackedBoard`-Struktur.

## 1. Zielsetzung

Das Ziel dieses Refactorings ist es, die Performance und Speichereffizienz der `TrioGame`-Implementierung innerhalb der Rust-Engine zu steigern. Wir ersetzen die generische, aber speicherintensive `Board { cells: Vec<i8> }`-Struktur durch eine spezialisierte, bit-gepackte Darstellung. Dies bringt die Trio-Implementierung in Einklang mit der optimalen Architektur für die gesamte LogicCastle-Engine.

## 2. Analyse des IST-Zustands

Aktuell verwendet die `TrioGame`-Struktur in `lib.rs` die allgemeine `Board`-Struktur. Jede Zelle auf dem 7x7-Feld wird durch ein `i8` (8 Bits) repräsentiert, um eine Zahl von 1-9 zu speichern. Dies ist eine erhebliche Speicherverschwendung, da für die Zahlen 0-9 nur 4 Bits benötigt werden.

**Aktuelle Struktur (konzeptionell):**
```rust
#[wasm_bindgen]
pub struct TrioGame {
    board: Board, // Enthält 'cells: Vec<i8>'
    target_number: u8,
}
```

## 3. Die neue Datenstruktur: `BitPackedBoard<7, 7, 4>`

Wir führen eine generische, bit-gepackte Struktur ein (wie im Architekturplan beschrieben). Für Trio verwenden wir sie mit folgenden Parametern:

-   `ROWS = 7`
-   `COLS = 7`
-   `BITS_PER_CELL = 4` (erlaubt die Speicherung von Werten von 0-15, perfekt für unsere Zahlen 1-9)

Die neue `TrioGame`-Struktur wird so aussehen:

```rust
// Annahme: BitPackedBoard ist bereits definiert

#[wasm_bindgen]
pub struct TrioGame {
    // Direkte, speichereffiziente Speicherung
    board: BitPackedBoard<7, 7, 4>,
    target_number: u8,
    // ... weitere Zustandsinformationen
}
```

Ein 7x7-Feld mit 4 Bits pro Zelle benötigt `(49 * 4) / 8 = 24.5`, also **25 Bytes** an Speicher, im Gegensatz zu den **49 Bytes** der `Vec<i8>`-Lösung. Dies ist eine Speicherreduktion von fast 50%.

## 4. Schritt-für-Schritt Refactoring-Anleitung

### Schritt 1: `TrioGame`-Struktur anpassen

Ersetzen Sie das `board`-Feld in der `TrioGame`-Struktur.

**Vorher:**
```rust
#[wasm_bindgen]
pub struct TrioGame {
    board: Board,
    target_number: u8,
}
```

**Nachher:**
```rust
// Annahme: BitPackedBoard<ROWS, COLS, BITS> ist definiert

#[wasm_bindgen]
pub struct TrioGame {
    board: BitPackedBoard<7, 7, 4>,
    target_number: u8,
}
```

### Schritt 2: Konstruktor `TrioGame::new()` anpassen

Die Logik zur Generierung des Spielfelds muss auf die neue `set_cell`-Methode des `BitPackedBoard` umgestellt werden.

**Vorher (konzeptionell):**
```rust
impl TrioGame {
    pub fn new(difficulty: u8) -> Self {
        let mut board = Board::new(7, 7);
        // ... Logik zur Generierung der 'numbers_to_place'
        for r in 0..7 {
            for c in 0..7 {
                // Schreibt ein i8 in den Vec<i8>
                board.set_cell(r, c, numbers_to_place[idx] as i8).unwrap();
            }
        }
        // ... Logik zur Generierung der Zielzahl
    }
}
```

**Nachher (konzeptionell):**
```rust
impl TrioGame {
    pub fn new(difficulty: u8) -> Self {
        let mut board = BitPackedBoard::<7, 7, 4>::new(); // Neue Instanz
        // ... Logik zur Generierung der 'numbers_to_place' bleibt gleich
        for r in 0..7 {
            for c in 0..7 {
                // Schreibt 4 Bits in die gepackte Struktur
                board.set_cell(r, c, numbers_to_place[idx]);
            }
        }

        // Die Logik zur Generierung der Zielzahl muss jetzt get_cell vom BitPackedBoard verwenden
        let n1 = board.get_cell(r1, c1) as f64;
        // ...

        TrioGame { board, target_number }
    }
}
```

### Schritt 3: `get_board()`-API für JavaScript anpassen (Kritischer Schritt!)

Das Frontend kann mit den rohen, bit-gepackten Daten nichts anfangen. Die `get_board`-Funktion muss die Daten für JavaScript "übersetzen".

**Vorher:**
```rust
#[wasm_bindgen]
impl TrioGame {
    pub fn get_board(&self) -> Vec<i8> {
        self.board.get_cells() // Gibt direkt den Vec<i8> zurück
    }
}
```

**Nachher:**
```rust
#[wasm_bindgen]
impl TrioGame {
    // Gibt einen einfachen Vec<u8> zurück, den JS leicht verarbeiten kann
    pub fn get_board(&self) -> Vec<u8> {
        let mut decoded_board = Vec::with_capacity(49);
        for r in 0..7 {
            for c in 0..7 {
                decoded_board.push(self.board.get_cell(r, c));
            }
        }
        decoded_board
    }
}
```

### Schritt 4: Alle internen Board-Zugriffe anpassen

Alle anderen Funktionen innerhalb von `TrioGame`, die auf das Brett zugreifen, müssen ebenfalls die neue `get_cell`-Methode verwenden. Dies betrifft insbesondere die Analyse-Funktionen.

**Beispiel für `check_combination`:**

**Vorher:**
```rust
// ...
let n1 = match self.board.get_cell(r1, c1) {
    Ok(val) => val as f64,
    Err(_) => return false,
};
// ...
```

**Nachher:**
```rust
// ...
// Direkter, fehlerfreie Zugriff auf die BitPackedBoard-Struktur
let n1 = self.board.get_cell(r1, c1) as f64;
// ...
```

Dies vereinfacht den Code, da die Grenzenprüfung bereits innerhalb der `get_cell`-Methode des `BitPackedBoard` stattfindet und keinen `Result` mehr zurückgibt.

## 5. Fazit und Vorteile

Nach Abschluss dieses Refactorings wird die Trio-Implementierung:

1.  **Speichereffizienter sein:** Der Speicherbedarf für das Spielbrett wird halbiert.
2.  **Potenziell schneller sein:** Obwohl der Performance-Gewinn bei einem kleinen 7x7-Brett für den Menschen nicht spürbar ist, profitiert die Codebasis von der dichteren Daten-Lokalität, was bei komplexeren Analysen (wie `analyze_reachable_targets`) zu Geschwindigkeitsvorteilen führen kann.
3.  **Architektonisch konsistent sein:** Die Implementierung folgt dem gleichen hochoptimierten Muster, das für die gesamte Engine vorgesehen ist. Dies erleichtert die Wartung und zukünftige Erweiterungen.

Dieses Refactoring ist ein wichtiger Schritt, um die technische Vision einer einheitlichen und performanten LogicCastle-Engine zu verwirklichen.
