
# Refactoring-Anleitung: Gomoku auf BitPackedBoard umstellen (v2)

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für das Refactoring der Gomoku-Spiellogik auf eine `BitPackedBoard`-Struktur mit Fokus auf interner Performance.

## 1. Zielsetzung

Umstellung der Gomoku-Logik auf eine bit-gepackte Datenstruktur. Dies ist für Gomoku aufgrund der Brettgröße (15x15) und der komplexen Analysefunktionen (Threat-Detection, Pattern-Matching) von entscheidender Bedeutung für die Performance.

## 2. Die neue Datenstruktur: `BitPackedBoard<15, 15, 2>`

-   `ROWS = 15`, `COLS = 15`
-   `BITS_PER_CELL = 2` (speichert 0=Leer, 1=Spieler1, 2=Spieler2).
-   **Speicherbedarf:** 57 Bytes (statt 225 Bytes bei `Vec<i8>`).

## 3. Wichtige Optimierung: Interne Logik vs. Öffentliche API

Dies ist der kritischste Punkt für die Performance. Es muss strikt unterschieden werden:

-   **Interne Logik (z.B. `detect_open_three`, `get_threat_level`):** Diese Funktionen müssen **direkt auf den rohen `u8`-Werten** operieren, die von `BitPackedBoard::get_cell()` zurückgegeben werden. In den vielen verschachtelten Schleifen dieser Algorithmen ist die Vermeidung von Castings oder Enum-Matching ein massiver Performance-Gewinn.

-   **Öffentliche API (z.B. `get_board()`):** Diese Funktion dient als "Übersetzer" für JavaScript. Ihre einzige Aufgabe ist es, die interne, bit-gepackte Struktur **einmal pro Zug** in ein einfaches `Vec<u8>` umzuwandeln, das die UI rendern kann.

## 4. Schritt-für-Schritt Refactoring-Anleitung

### Schritt 1 & 2: `Game`-Struktur und Konstruktor anpassen

(Identisch zur vorherigen Anleitung: Erweitern Sie das `GameBoard`-Enum um eine `Gomoku(BitPackedBoard<15, 15, 2>)`-Variante.)

### Schritt 3: Portierung der Gomoku-Analysefunktionen mit Performance-Fokus

Alle Gomoku-spezifischen Analysefunktionen müssen auf der `BitPackedBoard`-Struktur operieren und die oben genannte Optimierung berücksichtigen.

**Beispiel für `detect_open_three` (optimiert):**

```rust
// Interne Funktion, die auf dem BitPackedBoard operiert.
fn detect_open_three_on_board(board: &GomokuBoard, player_id: u8) -> Vec<usize> {
    let mut open_threes = Vec::new();
    let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];

    for r in 0..15 {
        for c in 0..15 {
            if board.get_cell(r, c) == 0 { // Direkter u8-Vergleich
                for &(dr, dc) in &directions {
                    // Die Logik zur Mustererkennung hier muss ebenfalls
                    // ausschließlich mit schnellen u8-Vergleichen arbeiten.
                    if would_create_open_three(board, (r, c), (dr, dc), player_id) {
                        open_threes.push(r);
                        open_threes.push(c);
                        break;
                    }
                }
            }
        }
    }
    open_threes
}
```

**Wichtiger Hinweis:** Alle Helferfunktionen wie `would_create_open_three` müssen ebenfalls so umgeschrieben werden, dass sie den `&GomokuBoard` und rohe `u8`-Werte als Parameter akzeptieren, um die Performance-Vorteile durch die gesamte Aufrufkette hindurch beizubehalten.

### Schritt 4: `get_board()`-API für JavaScript anpassen

(Identisch zur vorherigen Anleitung: Dekodieren Sie das 15x15-`BitPackedBoard` in ein `Vec<u8>` für die UI.)

## 5. Vorteile des Refactorings

-   **Echtzeit-Analyse:** Ermöglicht komplexe Bedrohungs- und Musteranalysen ohne spürbare Verzögerung für den Benutzer.
-   **Starke KI:** Schafft die technische Grundlage für eine Gomoku-KI, die tief genug suchen kann, um eine echte Herausforderung darzustellen.
-   **Vereinfachter interner Code:** Durch den Wegfall der `Result`-Typen bei Board-Zugriffen wird der Code innerhalb der Analysefunktionen sauberer und weniger fehleranfällig.
