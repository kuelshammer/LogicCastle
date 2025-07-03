
# Refactoring-Anleitung: Hex auf BitPackedBoard umstellen

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für die Implementierung des Spiels Hex unter Verwendung einer speichereffizienten `BitPackedBoard`-Struktur.

## 1. Zielsetzung

Das Ziel ist die Implementierung von Hex innerhalb der neuen, vereinheitlichten Rust-Engine. Die zentrale Herausforderung besteht darin, die hexagonale Spiellogik auf einer quadratischen Datenstruktur abzubilden. Dieses Refactoring stellt sicher, dass auch ein topologisch anspruchsvolles Spiel wie Hex von der Performance und Speichereffizienz der `BitPackedBoard`-Struktur profitiert.

## 2. Die neue Datenstruktur: `BitPackedBoard<11, 11, 2>`

Wir verwenden die generische, bit-gepackte Struktur mit den typischen Parametern für ein 11x11-Hex-Brett:

-   `ROWS = 11`
-   `COLS = 11`
-   `BITS_PER_CELL = 2` (erlaubt die Speicherung von 4 Werten, ausreichend für 0=Leer, 1=Spieler1, 2=Spieler2).

## 3. Schritt-für-Schritt Refactoring-Anleitung

### Schritt 1: Datenmodellierung und Hex-Logik-Helfer

Die `Game`-Struktur wird, wie in den anderen Anleitungen beschrieben, um einen `Hex`-Varianten im `GameBoard`-Enum erweitert, der eine `BitPackedBoard<11, 11, 2>`-Instanz enthält.

**Der entscheidende Teil ist die Implementierung der hexagonalen Nachbarschaftslogik.**

```rust
// Diese private Funktion ist das Herzstück der Hex-Implementierung.
// Sie übersetzt Array-Koordinaten in hexagonale Nachbarn.
fn get_hex_neighbors(row: usize, col: usize) -> Vec<(usize, usize)> {
    let mut neighbors = Vec::with_capacity(6);
    let is_even_col = col % 2 == 0;

    // Definiere die Nachbar-Offsets basierend auf "Axial Coordinates"
    // oder einer anderen Hex-Grid-Logik. Dies ist eine Standard-Implementierung.
    let neighbor_offsets = [
        (-1, 0), (1, 0), (0, -1), (0, 1),
        if is_even_col { (-1, -1) } else { (1, -1) },
        if is_even_col { (-1, 1) } else { (1, 1) },
    ];

    for (dr, dc) in &neighbor_offsets {
        let nr = row as isize + dr;
        let nc = col as isize + dc;

        // Prüfe, ob der Nachbar innerhalb der 11x11-Grenzen liegt
        if nr >= 0 && nr < 11 && nc >= 0 && nc < 11 {
            neighbors.push((nr as usize, nc as usize));
        }
    }
    neighbors
}
```

### Schritt 2: Spiellogik anpassen

-   **`get_legal_moves` und `make_move`:** Diese Funktionen sind trivial. Jeder leere Platz ist ein legaler Zug. `make_move` setzt einfach das Bit für den Spieler. Die Tauschregel (Pie Rule) muss in `make_move` für den zweiten Zug des Spiels implementiert werden.

-   **`check_win(player_id: u8)`:** Dies ist die komplexeste Funktion. Sie muss eine ununterbrochene Kette von einer Seite zur gegenüberliegenden finden.
    -   **Empfohlener Algorithmus: Breitensuche (BFS) oder Tiefensuche (DFS):**
        1.  **Definiere Start- und Zielbedingungen:**
            -   Für Spieler 1 (Rot, z.B. Links-Rechts): Startknoten sind alle Steine in Spalte 0. Ziel ist das Erreichen von Spalte 10.
            -   Für Spieler 2 (Blau, z.B. Oben-Unten): Startknoten sind alle Steine in Reihe 0. Ziel ist das Erreichen von Reihe 10.
        2.  **Initialisiere die Suche:** Lege alle Startknoten des Spielers in eine Warteschlange (`VecDeque` für BFS) und einen `visited`-Set.
        3.  **Durchlaufe den Graphen:**
            -   Solange die Warteschlange nicht leer ist, nimm den nächsten Knoten.
            -   Prüfe, ob dieser Knoten die Zielbedingung erfüllt. Wenn ja, hat der Spieler gewonnen.
            -   Finde alle Nachbarn des aktuellen Knotens mit `get_hex_neighbors`.
            -   Für jeden Nachbarn, der dem gleichen Spieler gehört und noch nicht im `visited`-Set ist, füge ihn zur Warteschlange und zum `visited`-Set hinzu.
        4.  Wenn die Warteschlange leer ist und das Ziel nie erreicht wurde, liegt (noch) kein Gewinn vor.

### Schritt 3: `get_board()`-API für JavaScript

Diese Funktion ist unkompliziert, da sie, wie bei den anderen Spielen, nur das `BitPackedBoard` in einen `Vec<u8>` dekodieren muss, den das Frontend dann rendern kann.

## 4. Vorteile dieser Herangehensweise

1.  **Saubere Abstraktion:** Die Komplexität der hexagonalen Logik ist vollständig in der `get_hex_neighbors`-Funktion gekapselt. Der Rest der Spiellogik (wie die Pfadfindung) kann diese Funktion nutzen, ohne sich um die Details der Gitterumrechnung kümmern zu müssen.
2.  **Performance:** Die rechenintensive Pfadfindung zur Gewinnermittlung wird in Rust ausgeführt, was für eine sofortige Rückmeldung an den Spieler sorgt.
3.  **Wartbarkeit:** Die Trennung von Datenhaltung (quadratisches Array) und Spiellogik (hexagonale Regeln) macht den Code leichter verständlich und wartbar.
