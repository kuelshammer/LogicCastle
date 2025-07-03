
# Refactoring-Anleitung: Shannon Switching Game auf BitPackedBoard umstellen (v2)

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für die Implementierung des Shannon Switching Game mit einer `BitPackedBoard`-Struktur und Fokus auf interner Performance.

## 1. Zielsetzung

Implementierung des Shannon Switching Game mit einer speichereffizienten Datenstruktur für die Kanten des Graphen. Der Fokus liegt auf der performanten Ausführung der Pfadfindungs-Algorithmen, die für die Gewinnermittlung beider Spieler (Short und Cut) notwendig sind.

## 2. Datenmodellierung in Rust

Der Zustand wird durch separate Gitter für die Kanten repräsentiert.

**Für ein Spiel auf einem 5x5-Knoten-Gitter:**
```rust
struct ShannonSwitchingState {
    horizontal_edges: BitPackedBoard<5, 4, 2>,
    vertical_edges: BitPackedBoard<4, 5, 2>,
    // ...
}
```
Die 2 Bits pro Kante speichern: 0=Unbeansprucht, 1=Short, 2=Cut.

## 3. Wichtige Optimierung: Interne Logik vs. Öffentliche API

Die `check_win`-Funktion ist der performance-kritische Teil.

-   **Interne Logik (Pfadfindung):** Der BFS/DFS-Algorithmus zur Gewinnprüfung muss **direkt auf den rohen `u8`-Werten** der Kanten-Boards operieren. Bei der Prüfung, ob eine Kante für den Pfad genutzt werden kann, muss ein direkter `u8`-Vergleich stattfinden (`edge_state == 1` für Short, `edge_state != 2` für die Cut-Prüfung). Dies ist entscheidend, da der Algorithmus viele Kanten traversieren muss.

-   **Öffentliche API (`get_shannon_board_state()`):** Diese Funktion dient als "Übersetzer" für JavaScript. Sie konvertiert die beiden Kanten-Boards einmal pro Zug in eine saubere Struktur (z.B. zwei `Vec<u8>`), die die UI zum Zeichnen des Graphen verwenden kann.

## 4. Schritt-für-Schritt Implementierungs-Anleitung

### Schritt 1 & 2: Datenstrukturen und Spiellogik

(Identisch zur vorherigen Anleitung: Erweitern Sie die `Game`-Struktur um `ShannonSwitchingState` und implementieren Sie `get_legal_moves` und `make_move`.)

### Schritt 3: `check_win` mit Performance-Fokus implementieren

Die Pfadfindungs-Algorithmen müssen für maximale Geschwindigkeit optimiert werden.

**Beispiel für die Gewinnprüfung für Spieler "Short" (optimiert):**

```rust
fn check_win_for_short(state: &ShannonSwitchingState) -> bool {
    let mut queue: VecDeque<(u8, u8)> = VecDeque::new();
    let mut visited: HashSet<(u8, u8)> = HashSet::new();

    let (start_node, goal_node) = (state.terminal_a, state.terminal_b);

    queue.push_back(start_node);
    visited.insert(start_node);

    while let Some(current_node) = queue.pop_front() {
        if current_node == goal_node { return true; }

        // Finde alle Nachbarknoten, die über Kanten von "Short" erreichbar sind
        for neighbor in get_neighbors(current_node) {
            if !visited.contains(&neighbor) {
                // OPTIMIERUNG: Direkter u8-Vergleich
                let edge = get_edge_between(current_node, neighbor);
                if state.get_edge_state(edge) == 1 { // 1 = Short
                    visited.insert(neighbor);
                    queue.push_back(neighbor);
                }
            }
        }
    }
    false
}
```
Die Gewinnprüfung für "Cut" folgt einer ähnlichen Logik, prüft aber auf `state.get_edge_state(edge) != 2`.

### Schritt 4: `get_shannon_board_state()`-API für JavaScript anpassen

(Identisch zur vorherigen Anleitung: Serialisieren Sie die beiden Kanten-Boards in eine Struktur, die für JavaScript leicht zu verarbeiten ist, z.B. über `serde-wasm-bindgen`.)

## 5. Vorteile des Refactorings

-   **Schnelle Gewinnprüfung:** Stellt sicher, dass der Spielzustand nach jedem Zug sofort und ohne Verzögerung ermittelt werden kann, was für eine reaktionsschnelle UI unerlässlich ist.
-   **Effiziente Graphen-Repräsentation:** Nutzt die `BitPackedBoard`-Struktur optimal, um den Zustand eines komplexen Graphen speichereffizient abzubilden.
-   **Saubere Architektur:** Kapselt die Graphen-Logik vollständig in der Rust-Engine.
