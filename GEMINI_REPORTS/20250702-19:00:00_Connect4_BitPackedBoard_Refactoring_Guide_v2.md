
# Refactoring-Anleitung: Connect4 auf BitPackedBoard umstellen (v2)

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für das Refactoring der Connect4-Spiellogik auf eine `BitPackedBoard`-Struktur mit Fokus auf interner Performance.

## 1. Zielsetzung

Umstellung der Connect4-Logik auf eine bit-gepackte Datenstruktur zur Steigerung von Performance und Speichereffizienz. Dies ist die entscheidende Grundlage für eine performante, in Rust implementierte KI.

## 2. Die neue Datenstruktur: `BitPackedBoard<6, 7, 2>`

-   `ROWS = 6`, `COLS = 7`
-   `BITS_PER_CELL = 2` (speichert 0=Leer, 1=Spieler1, 2=Spieler2).
-   **Speicherbedarf:** 11 Bytes (statt 42 Bytes bei `Vec<i8>`).

## 3. Wichtige Optimierung: Interne Logik vs. Öffentliche API

Dies ist der kritischste Punkt für die Performance. Es muss strikt unterschieden werden:

-   **Interne Logik (z.B. `check_win`, `evaluate_position`):** Diese Funktionen müssen **direkt auf den rohen `u8`-Werten** operieren, die von `BitPackedBoard::get_cell()` zurückgegeben werden. Innerhalb von rechenintensiven Schleifen darf **kein Casting** zu Enums oder anderen Typen stattfinden. Der Vergleich `if board.get_cell(r, c) == player_id_u8` ist extrem schnell und entscheidend für die KI-Leistung.

-   **Öffentliche API (z.B. `get_board()`):** Diese Funktion dient als "Übersetzer" für JavaScript. Ihre einzige Aufgabe ist es, die interne, bit-gepackte Struktur **einmal pro Zug** in ein einfaches `Vec<u8>` umzuwandeln, das die UI rendern kann. Der einmalige Konvertierungsaufwand ist hier vernachlässigbar.

## 4. Schritt-für-Schritt Refactoring-Anleitung

### Schritt 1 & 2: `Game`-Struktur und Konstruktor anpassen

(Identisch zur vorherigen Anleitung: Führen Sie ein `GameBoard`-Enum ein, das eine `BitPackedBoard<6, 7, 2>`-Instanz für Connect4 enthalten kann.)

### Schritt 3: Spiellogik mit Performance-Fokus anpassen

Alle internen Funktionen müssen die oben genannte Optimierung berücksichtigen.

**Beispiel für die interne Gewinnprüfung:**

```rust
// Diese Funktion wird intern aufgerufen und operiert auf rohen u8-Werten.
fn check_win_for_connect4(board: &BitPackedBoard<6, 7, 2>, last_move: (usize, usize), player_id: u8) -> bool {
    let (row, col) = last_move;

    // Optimierung: Prüfe nur um den letzten Zug herum.
    // ... Logik für die 4 Richtungen (horizontal, vertikal, 2x diagonal) ...

    // Beispiel für eine Richtung:
    let mut count = 1;
    // ... Schleife nach links ...
        // Direkter u8-Vergleich in der Schleife!
        if board.get_cell(row, c) == player_id { 
            count += 1; 
        } else { 
            break; 
        }
    // ... Schleife nach rechts ...

    if count >= 4 { return true; }

    // ... für die anderen Richtungen wiederholen ...

    false
}
```

### Schritt 4: `get_board()`-API für JavaScript anpassen

(Identisch zur vorherigen Anleitung: Dekodieren Sie das `BitPackedBoard` in ein `Vec<u8>` für die UI.)

## 5. Vorteile des Refactorings

-   **Maximale KI-Performance:** Stellt sicher, dass die KI-Logik (Minimax, MCTS) mit der höchstmöglichen Geschwindigkeit auf den Spieldaten operieren kann.
-   **Konsistente Architektur:** Führt die hochoptimierte Zielarchitektur für alle Spiele ein.
-   **Reduzierter Speicherverbrauch:** Minimiert den RAM-Bedarf, was besonders bei vielen parallelen Simulationen in der KI relevant ist.
