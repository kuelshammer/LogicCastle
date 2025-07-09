# Technischer Report für Claude: Implementierung von KI-Features in der Drei-Schichten-Architektur

**An:** Claude
**Von:** Gemini
**Datum:** 08. Juli 2025
**Betreff:** Anleitung zur Implementierung von KI-Bewertungslogik in der neuen Rust-Core-Architektur

---

### 1. Zusammenfassung

Dieser Report baut direkt auf dem Vorschlag zur Refaktorierung der Rust-Core in eine Drei-Schichten-Architektur (Daten, Geometrie, Spiellogik) auf. Er beschreibt, wie KI-spezifische Features, insbesondere die komplexe Logik zur Positionsbewertung, elegant und performant in dieses neue Modell integriert werden können.

Das Kernprinzip lautet: **Jede Schicht der Architektur leistet einen spezifischen Beitrag zur KI-Bewertung, basierend auf ihren Kernkompetenzen.** Dies führt zu einer extrem performanten, wartbaren und verständlichen KI-Implementierung.

### 2. Das Prinzip: Aufgabenteilung für die KI

Wir erweitern die Verantwortlichkeiten der Schichten, um die Anforderungen einer KI abzubilden:

*   **Daten-Schicht (`BitPackedBoard`):** Stellt eine einzelne, hochoptimierte Funktion zur Verfügung, um die Übereinstimmung eines Spieler-Boards mit einem beliebigen Muster (einer "Maske") zu prüfen.
*   **Geometrie-Schicht (`BoardGeometry`):** Fungiert als **Muster-Bibliothek**. Sie generiert und cacht bei der Initialisierung alle geometrisch relevanten Muster (Gewinnlinien, Zentrum, etc.) als Bit-Masken.
*   **Spiel-Logik-Schicht (`HexGame`, etc.):** Bleibt weitgehend unverändert. Sie orchestriert das Spiel und stellt den Zustand bereit.
*   **KI-Schicht (`Connect4AI`, etc.):** Ist der **Stratege**. Sie implementiert den Suchalgorithmus (z.B. Minimax) und nutzt die Werkzeuge der unteren Schichten, um eine Heuristik (Bewertungsfunktion) umzusetzen, die auf den bereitgestellten Mustern operiert.

---

### 3. Implementierungsleitfaden pro Schicht

#### Schicht 1: `BitPackedBoard` – Der Bit-Prüfer

Fügen Sie dem `BitPackedBoard`-Struct eine einzige, entscheidende Funktion hinzu:

```rust
impl BitPackedBoard {
    // ... bestehende Funktionen

    /// Zählt, wie viele gesetzte Bits dieses Boards mit den
    /// gesetzten Bits in einer gegebenen Maske übereinstimmen.
    /// Dies ist die Kernoperation für die Mustererkennung.
    pub fn count_set_bits_in_mask(&self, mask: &BitPackedBoard) -> u32 {
        let mut count = 0;
        // Iteriert über die u64-Blöcke beider Bitboards.
        for (self_chunk, mask_chunk) in self.data.iter().zip(&mask.data) {
            // Nutzt eine bitweise AND-Operation, um die Übereinstimmungen zu finden,
            // und zählt die gesetzten Bits im Ergebnis.
            count += (self_chunk & mask_chunk).count_ones();
        }
        count
    }
}
```
**Hinweis:** Diese Funktion ist extrem performant, da sie direkt auf den `u64`-Primitiven mit CPU-instruktionsnahen Operationen (`&` und `count_ones`) arbeitet.

#### Schicht 2: `BoardGeometry` – Die Muster-Bibliothek

Dies ist die wichtigste Erweiterung. Die Geometrie-Structs (`QuadraticGrid`, `HexGrid`) müssen bei ihrer Erstellung alle relevanten Muster vor-berechnen und cachen.

**Beispiel für `QuadraticGrid`:**

```rust
pub struct QuadraticGrid {
    width: usize,
    height: usize,
    // --- NEU: Gecachte Muster ---
    lines_of_4: Vec<BitPackedBoard>,
    lines_of_5: Vec<BitPackedBoard>, // Für Gomoku
    center_mask: BitPackedBoard,
}

impl QuadraticGrid {
    pub fn new(width: usize, height: usize) -> Self {
        let mut grid = Self { /* ... */ };
        grid.precompute_patterns();
        grid
    }

    fn precompute_patterns(&mut self) {
        // Diese Methode wird nur einmal aufgerufen.
        self.lines_of_4 = self.generate_all_lines_of_length(4);
        self.lines_of_5 = self.generate_all_lines_of_length(5);
        self.center_mask = self.generate_center_mask();
    }

    // Liefert eine Referenz auf die gecachten Muster.
    pub fn get_all_lines_of_length(&self, length: usize) -> &Vec<BitPackedBoard> {
        match length {
            4 => &self.lines_of_4,
            5 => &self.lines_of_5,
            _ => panic!("Unsupported line length"),
        }
    }

    // Implementierungs-Detail für die Mustergenerierung
    fn generate_all_lines_of_length(&self, length: usize) -> Vec<BitPackedBoard> {
        let mut patterns = Vec::new();
        // Iteriere über alle Startpunkte (r, c)
        // Iteriere über alle Richtungen (dr, dc)
        //   Erstelle eine neue, leere BitPackedBoard-Maske
        //   Setze die `length` Bits entlang der Linie in der Maske
        //   Füge die Maske zum `patterns`-Vektor hinzu
        patterns
    }
    // ... weitere Muster-Generatoren
}
```
**Hinweis:** Der Schlüssel ist, dass die teure Generierung nur einmal stattfindet. Die `get_*`-Methoden geben danach nur noch eine blitzschnelle Referenz auf die bereits berechneten Daten zurück.

#### Schicht 4: `GameAI` – Der Stratege

Die spelspezifische KI (z.B. `Connect4AI`) kann nun eine sehr saubere und deklarative Bewertungsfunktion schreiben. Sie muss nicht mehr selbst über das Brett iterieren, sondern fragt die Geometrie-Schicht nach Mustern und die Daten-Schicht nach Übereinstimmungen.

**Beispiel für `evaluate_position` in `Connect4AI`:**

```rust
pub fn evaluate_position(game: &Connect4Game) -> i32 {
    let mut score = 0;
    let current_player_board = game.get_board_for_player(game.current_player);
    let opponent_board = game.get_board_for_player(game.current_player.opponent());

    // 1. Hole die relevanten Muster von der Geometrie-Schicht
    let winning_lines = game.geometry.get_all_lines_of_length(4);

    // 2. Iteriere durch die vorgefertigten Muster
    for line_mask in winning_lines {
        // 3. Prüfe die Muster gegen die Spieler-Boards
        let player_pieces = current_player_board.count_set_bits_in_mask(line_mask);
        let opponent_pieces = opponent_board.count_set_bits_in_mask(line_mask);

        // 4. Wende die spelspezifische Bewertungslogik an
        if player_pieces == 4 { return 10_000; } // Sieg
        if opponent_pieces == 4 { return -10_000; } // Niederlage

        if player_pieces == 3 && opponent_pieces == 0 {
            score += 100; // Eigene offene 3er-Reihe (starke Drohung)
        }
        if opponent_pieces == 3 && player_pieces == 0 {
            score -= 200; // Gegnerische offene 3er-Reihe (Blocken ist wichtiger)
        }
        // ... weitere Heuristiken für 2er-Reihen etc.
    }

    // 5. Bewerte Positionsvorteile mit anderen Masken
    let center_mask = game.geometry.get_center_mask();
    score += current_player_board.count_set_bits_in_mask(center_mask) as i32 * 10;
    score -= opponent_board.count_set_bits_in_mask(center_mask) as i32 * 10;

    score
}
```

### 4. Fazit und Empfehlung

Diese Methode zur Implementierung der KI-Logik ist die konsequente Fortführung der Drei-Schichten-Architektur. Sie bietet entscheidende Vorteile:

*   **Maximale Performance:** Die rechenintensive Mustersuche wird einmalig ausgeführt. Die Bewertungsfunktion, die millionenfach im Minimax-Algorithmus aufgerufen wird, besteht fast ausschließlich aus extrem schnellen, bitweisen Operationen.
*   **Hervorragende Lesbarkeit:** Die `evaluate_position`-Funktion liest sich wie ein strategisches Regelwerk und nicht wie komplexe, verschachtelte Schleifenlogik.
*   **Exzellente Testbarkeit:** Jede Komponente ist isoliert testbar. Man kann die Mustergenerierung der Geometrie-Schicht prüfen, ohne ein Spiel zu simulieren, und man kann die Bewertungsfunktion mit künstlich erstellten Boards und Masken testen.
*   **Einfache Erweiterbarkeit:** Eine neue Heuristik hinzuzufügen (z.B. "vermeide es, dem Gegner eine Vorlage zu geben") bedeutet oft nur, eine neue Mustermaske in der Geometrie-Schicht zu definieren und eine neue Regel in der KI-Schicht hinzuzufügen.

Ich empfehle dringend, diesen Ansatz als Standard für die Implementierung aller KIs in LogicCastle zu etablieren. Er ist die Grundlage für eine leistungsstarke und gleichzeitig wartbare Codebasis.

Beste Grüße,
Gemini
