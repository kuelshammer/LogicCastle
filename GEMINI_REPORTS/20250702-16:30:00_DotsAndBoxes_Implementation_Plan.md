
# Implementierungsanleitung für Käsekästchen (Dots and Boxes)

**An:** Coding LLM
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Anleitung zur Implementierung von Käsekästchen (Dots and Boxes) unter Verwendung der neuen, vereinheitlichten Rust-Engine.

## 1. Spielregeln (Zusammenfassung)

Käsekästchen ist ein strategisches Spiel für zwei oder mehr Spieler, das auf einem Gitter aus Punkten gespielt wird.

-   **Spielmaterial:** Ein Gitter aus Punkten, z.B. 5x5 Punkte.

-   **Spielzug:**
    1.  Die Spieler ziehen abwechselnd.
    2.  Ein Spieler zeichnet eine einzelne horizontale oder vertikale Linie zwischen zwei benachbarten, noch nicht verbundenen Punkten.

-   **Kästchen erobern:**
    1.  Wenn ein Spieler mit seiner Linie ein 1x1-Kästchen vervollständigt (die vierte Wand schließt), markiert er dieses Kästchen als sein eigenes (z.B. mit seiner Farbe oder Initiale).
    2.  Der Spieler, der ein Kästchen schließt, erhält einen Punkt und muss **sofort einen weiteren Zug** machen.
    3.  Dieser Extrazug wiederholt sich so lange, wie der Spieler in jedem Zug weitere Kästchen vervollständigt.

-   **Ziel:** Das Spiel endet, wenn alle möglichen Linien zwischen den Punkten gezeichnet wurden. Der Spieler, der die meisten Kästchen erobert hat, gewinnt.

## 2. Umsetzungsanleitung für die Rust-Engine

Dieses Spiel erfordert eine andere Datenmodellierung als ein typisches Brettspiel, passt aber hervorragend zur Flexibilität der vorgeschlagenen Rust-Engine.

### Schritt 1: Datenmodellierung in Rust

Der Spielzustand wird nicht durch ein einzelnes Brett, sondern durch eine Kombination aus drei Gittern abgebildet. Für ein Standardspiel auf einem 5x5-Punkt-Gitter (was 4x4 Kästchen ergibt) sieht die Struktur wie folgt aus:

```rust
// In der Haupt-Spielzustands-Struct der Engine
struct DotsAndBoxesState {
    // Horizontale Linien: 5 Reihen mit je 4 Linien
    horizontal_lines: BitPackedBoard<5, 4, 1>,

    // Vertikale Linien: 4 Reihen mit je 5 Linien
    vertical_lines: BitPackedBoard<4, 5, 1>,

    // Besitzer der Kästchen: 4x4 Kästchen
    box_owners: BitPackedBoard<4, 4, 2>, // 2 Bits für: 0=Niemand, 1=P1, 2=P2

    // Punktestände
    player1_score: u8,
    player2_score: u8,
}
```

### Schritt 2: Spiellogik im `GameLogic`-Trait implementieren

-   **`get_legal_moves(&self) -> Vec<Move>`:**
    -   Diese Funktion ist sehr performant.
    -   Sie iteriert durch `horizontal_lines` und `vertical_lines`.
    -   Jede Position mit dem Wert `0` (nicht gezeichnet) ist ein legaler Zug.
    -   Ein `Move` wird definiert als `struct LineMove { is_horizontal: bool, row: u8, col: u8 }`.

-   **`make_move(&mut self, player_move: Move) -> MoveResult`:**
    -   Dies ist die zentrale Logikfunktion.
    1.  **Linie zeichnen:** Setzt das entsprechende Bit im `horizontal_lines`- oder `vertical_lines`-Board auf `1`.
    2.  **Kästchen-Prüfung:** Nach dem Zeichnen der Linie wird geprüft, ob Kästchen vervollständigt wurden.
        -   Eine horizontale Linie bei `(r, c)` kann die Kästchen bei `(r-1, c)` (darüber) und `(r, c)` (darunter) beeinflussen.
        -   Eine vertikale Linie bei `(r, c)` kann die Kästchen bei `(r, c-1)` (links) und `(r, c)` (rechts) beeinflussen.
        -   Für jedes potenziell betroffene Kästchen wird geprüft, ob alle vier Wände (zwei horizontale, zwei vertikale Linien) jetzt auf `1` gesetzt sind.
    3.  **Ergebnis verarbeiten:**
        -   Die Anzahl der in diesem Zug vervollständigten Kästchen wird gezählt (`completed_boxes_count`).
        -   Wenn `completed_boxes_count > 0`:
            -   Aktualisiere das `box_owners`-Board mit der ID des aktuellen Spielers.
            -   Erhöhe den Punktestand (`player_score`).
            -   Der Spieler ist **erneut am Zug**.
        -   Wenn `completed_boxes_count == 0`:
            -   Der Spieler wechselt.
    4.  **Rückgabe:** Die Funktion gibt ein `MoveResult` zurück, das dem Frontend mitteilt, ob Kästchen geschlossen wurden und wer der nächste Spieler ist. `struct MoveResult { completed_boxes: Vec<(u8, u8)>, next_player: u8 }`.

-   **`check_win(&self) -> Option<u8>`:**
    -   Das Spiel ist vorbei, wenn die Summe der Punktestände (`player1_score + player2_score`) der Gesamtzahl der Kästchen entspricht (z.B. 16 für ein 4x4-Feld).
    -   Der Gewinner wird durch den Vergleich der Punktestände ermittelt.

### Schritt 3: JavaScript- und UI-Anpassungen

-   **`games/dots-and-boxes/game.js` (neu erstellen):**
    -   Ein schlanker Wrapper, der die WASM-Funktionen aufruft.
    -   Er muss die Logik für den Extrazug basierend auf dem `MoveResult` der WASM-Funktion korrekt handhaben (d.h. den Spieler nicht wechseln, wenn ein Kästchen geschlossen wurde).

-   **`games/dots-and-boxes/ui.js` (neu erstellen):**
    -   **Darstellung:**
        -   Die UI rendert ein Gitter aus Punkten.
        -   Die Linien werden als `div`-Elemente dynamisch zwischen den Punkten gezeichnet, wenn sie von der Engine als "gezeichnet" gemeldet werden.
        -   Wenn die Engine meldet, dass ein Kästchen erobert wurde, füllt die UI dieses Kästchen mit der Farbe oder dem Symbol des Spielers.
    -   **Interaktion:**
        -   Die klickbaren Bereiche sind die "Lücken" zwischen den Punkten. Dies kann durch ein unsichtbares Gitter aus `divs` realisiert werden, die über dem sichtbaren Gitter liegen und die Klick-Events für die Linien abfangen.
        -   Beim Klick auf eine Lücke sendet die UI den entsprechenden `LineMove` an die WASM-Engine.

### Fazit zur Implementierung

Die Modellierung des Spielzustands mit separaten Gittern für Linien und Kästchen ist der entscheidende Punkt. Dies ermöglicht es, die hochperformante `BitPackedBoard`-Struktur der neuen Engine zu nutzen. Die komplexe Logik (Prüfung auf vervollständigte Kästchen, Extrazüge) wird sicher und schnell in Rust ausgeführt, während die JavaScript-Schicht sich ausschließlich um die Darstellung und die Benutzerinteraktion kümmert. Dies führt zu einer sauberen, wartbaren und performanten Implementierung.
