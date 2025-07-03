
# Refactoring-Anleitung: Shannon Switching Game auf BitPackedBoard umstellen

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für die Implementierung des Shannon Switching Game unter Verwendung einer speichereffizienten `BitPackedBoard`-Struktur.

## 1. Zielsetzung

Das Ziel ist die Implementierung des Shannon Switching Game innerhalb der neuen, vereinheitlichten Rust-Engine. Ähnlich wie bei "Käsekästchen" basiert dieses Spiel auf der Manipulation von Kanten in einem Gitter. Die `BitPackedBoard`-Struktur ist ideal, um den Zustand dieser Kanten effizient zu speichern und die komplexe Pfadfindungslogik performant in Rust auszuführen.

## 2. Datenmodellierung in Rust

Der Spielzustand wird durch separate Gitter für die horizontalen und vertikalen Kanten des Graphen repräsentiert.

**Für ein Spiel auf einem 5x5-Knoten-Gitter:**
```rust
// Definiere die spezifischen Board-Typen für die Kanten
type HorizontalEdges = BitPackedBoard<5, 4, 2>;
type VerticalEdges = BitPackedBoard<4, 5, 2>;

// Die Zustandsstruktur für das Spiel
struct ShannonSwitchingState {
    horizontal_edges: HorizontalEdges,
    vertical_edges: VerticalEdges,
    // Terminal-Knoten (z.B. oben-links und unten-rechts)
    terminal_a: (u8, u8),
    terminal_b: (u8, u8),
}
```

Die **2 Bits** pro Zelle (Kante) speichern den Zustand:
-   `0`: Unbeansprucht
-   `1`: Von Spieler "Short" beansprucht
-   `2`: Von Spieler "Cut" beansprucht

## 3. Schritt-für-Schritt Implementierungs-Anleitung

### Schritt 1: `Game`-Struktur erweitern

Fügen Sie `ShannonSwitchingState` zur `Game`-Struktur oder zum `GameBoard`-Enum hinzu.

### Schritt 2: Spiellogik implementieren

-   **`get_legal_moves(&self) -> Vec<EdgeMove>`:**
    -   Iteriert durch `horizontal_edges` und `vertical_edges`.
    -   Jede Kante mit dem Zustand `0` ist ein legaler Zug.
    -   Ein `EdgeMove` wird definiert als `struct EdgeMove { is_horizontal: bool, row: u8, col: u8 }`.

-   **`make_move(&mut self, edge_move: EdgeMove)`:**
    -   Setzt den Zustand der gewählten Kante auf die ID des aktuellen Spielers (`1` für Short, `2` für Cut).

-   **`check_win(&self) -> Option<u8>`:**
    -   Diese Funktion muss nach jedem Zug die Gewinnbedingungen für beide Spieler prüfen.
    -   **Gewinnprüfung für Spieler "Short":**
        -   Dies ist eine klassische **Pfadfindungs-Aufgabe** auf dem Graphen.
        -   Starte einen Algorithmus (BFS oder DFS) am `terminal_a`.
        -   Der Algorithmus kann sich von einem Knoten zu einem benachbarten Knoten bewegen, wenn die Kante dazwischen von "Short" beansprucht wird (Zustand `1`).
        -   Wenn `terminal_b` erreicht wird, hat **Short (Spieler 1) gewonnen**.
    -   **Gewinnprüfung für Spieler "Cut":**
        -   "Cut" gewinnt, wenn "Short" keine Verbindung mehr herstellen kann.
        -   Führe den gleichen Pfadfindungs-Algorithmus für "Short" aus, aber erlaube ihm, sich über alle Kanten zu bewegen, die **von ihm beansprucht ODER noch unbeansprucht** sind (Zustand `1` oder `0`).
        -   Wenn unter diesen idealen Bedingungen **kein Pfad** mehr zwischen `terminal_a` und `terminal_b` existiert, hat **Cut (Spieler 2) gewonnen**.

### Schritt 3: `get_board()`-API für JavaScript

Diese Funktion muss den Zustand beider Kanten-Gitter an das Frontend senden, damit dieses den Graphen korrekt zeichnen kann.

```rust
#[derive(Serialize)] // Benötigt serde
struct ShannonBoardState {
    horizontal: Vec<u8>,
    vertical: Vec<u8>,
}

// In der `impl Game`
pub fn get_shannon_board_state(&self) -> JsValue {
    if let Some(state) = &self.shannon_state {
        let horizontal_vec = decode_board_to_vec(state.horizontal_edges);
        let vertical_vec = decode_board_to_vec(state.vertical_edges);

        let board_state = ShannonBoardState {
            horizontal: horizontal_vec,
            vertical: vertical_vec,
        };
        
        // Serialisiere die Struktur zu einem JS-Objekt
        serde_wasm_bindgen::to_value(&board_state).unwrap()
    } else {
        JsValue::NULL
    }
}
```
*(Hinweis: Die Verwendung von `serde` und `serde-wasm-bindgen` ist hier die sauberste Methode, um strukturierte Daten an JS zu übergeben.)*

## 4. Vorteile dieser Herangehensweise

1.  **Effiziente Graphen-Repräsentation:** Die Verwendung von zwei `BitPackedBoard`-Instanzen ist eine sehr speichereffiziente Methode, um den Zustand aller Kanten in einem Gitter-Graphen zu speichern.
2.  **Performante Analyse:** Die gesamte Graphen-Traversal-Logik zur Gewinnprüfung wird in Rust ausgeführt, was für eine sofortige Rückmeldung sorgt, selbst auf größeren Brettern.
3.  **Saubere Trennung:** Die Engine kümmert sich um die komplexe Graphen-Logik, während die UI nur die Knoten und die von der Engine verwalteten Kantenzustände visualisieren muss.
