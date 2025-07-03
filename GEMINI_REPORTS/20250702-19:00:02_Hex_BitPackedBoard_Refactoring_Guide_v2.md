
# Refactoring-Anleitung: Hex auf BitPackedBoard umstellen (v2)

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für die Implementierung des Spiels Hex mit einer `BitPackedBoard`-Struktur und Fokus auf interner Performance.

## 1. Zielsetzung

Implementierung von Hex mit einer speichereffizienten Datenstruktur. Der Fokus liegt auf der korrekten Abbildung der hexagonalen Logik und der performanten Ausführung der Pfadfindungs-Algorithmen zur Gewinnermittlung.

## 2. Die neue Datenstruktur: `BitPackedBoard<11, 11, 2>`

-   `ROWS = 11`, `COLS = 11`
-   `BITS_PER_CELL = 2` (speichert 0=Leer, 1=Spieler1, 2=Spieler2).

## 3. Wichtige Optimierung: Interne Logik vs. Öffentliche API

Dies ist für die `check_win`-Funktion von Hex von entscheidender Bedeutung.

-   **Interne Logik (Pfadfindung):** Der BFS- oder DFS-Algorithmus zur Gewinnprüfung muss **direkt auf den rohen `u8`-Werten** operieren. Bei der Überprüfung, ob ein Nachbarfeld vom selben Spieler besetzt ist, muss ein direkter `u8`-Vergleich stattfinden. Dies geschieht in der innersten Schleife des Algorithmus und ist daher extrem performance-kritisch.

-   **Öffentliche API (`get_board()`):** Diese Funktion dient als "Übersetzer" für JavaScript. Sie konvertiert das interne Board einmalig in ein `Vec<u8>`, damit die UI das Hex-Gitter rendern kann.

## 4. Schritt-für-Schritt Implementierungs-Anleitung

### Schritt 1 & 2: Datenmodellierung und Hex-Logik-Helfer

(Identisch zur vorherigen Anleitung: Erweitern Sie das `GameBoard`-Enum um eine `Hex(BitPackedBoard<11, 11, 2>)`-Variante und implementieren Sie die `get_hex_neighbors`-Hilfsfunktion.)

### Schritt 3: `check_win` mit Performance-Fokus implementieren

Der Pfadfindungs-Algorithmus muss für maximale Geschwindigkeit optimiert werden.

**Beispiel für den BFS-Algorithmus (optimiert):**

```rust
fn check_win_for_hex(board: &BitPackedBoard<11, 11, 2>, player_id: u8) -> bool {
    let mut queue: VecDeque<(usize, usize)> = VecDeque::new();
    let mut visited: HashSet<(usize, usize)> = HashSet::new();

    // 1. Initialisiere die Warteschlange mit den Startknoten
    for i in 0..11 {
        let start_node = if player_id == 1 { (i, 0) } else { (0, i) }; // Bsp. für Rot (L-R) vs Blau (O-U)
        if board.get_cell(start_node.0, start_node.1) == player_id {
            queue.push_back(start_node);
            visited.insert(start_node);
        }
    }

    // 2. Durchlaufe den Graphen
    while let Some((r, c)) = queue.pop_front() {
        // 3. Prüfe Zielbedingung
        let is_at_goal = if player_id == 1 { c == 10 } else { r == 10 };
        if is_at_goal { return true; }

        // 4. Finde Nachbarn und füge sie hinzu
        for neighbor in get_hex_neighbors(r, c) {
            // OPTIMIERUNG: Direkter u8-Vergleich und nur eine Abfrage pro Nachbar
            if !visited.contains(&neighbor) && board.get_cell(neighbor.0, neighbor.1) == player_id {
                visited.insert(neighbor);
                queue.push_back(neighbor);
            }
        }
    }

    false
}
```

### Schritt 4: `get_board()`-API für JavaScript anpassen

(Identisch zur vorherigen Anleitung: Dekodieren Sie das 11x11-`BitPackedBoard` in ein `Vec<u8>` für die UI.)

## 5. Vorteile des Refactorings

-   **Schnelle Gewinnprüfung:** Stellt sicher, dass die Gewinnbedingung nach jedem Zug sofort und ohne Verzögerung ermittelt werden kann.
-   **Effiziente Datenhaltung:** Nutzt die Vorteile der Bit-Packung auch für ein topologisch komplexes Spiel.
-   **Saubere Architektur:** Kapselt die gesamte Hex-spezifische Logik (Nachbarschaft, Pfadfindung) sauber innerhalb der Rust-Engine.
