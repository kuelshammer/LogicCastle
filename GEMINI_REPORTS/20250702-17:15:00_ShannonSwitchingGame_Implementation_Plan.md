
# Implementierungsanleitung für das Shannon Switching Game

**An:** Coding LLM
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Anleitung zur Implementierung des Shannon Switching Game (Short-Cut Variante) unter Verwendung der neuen, vereinheitlichten Rust-Engine.

## 1. Spielregeln (Zusammenfassung)

Das Shannon Switching Game ist ein abstraktes Strategiespiel für zwei Spieler, das auf einem Graphen gespielt wird. Üblicherweise wird ein quadratisches Gitter aus Knoten als Graph verwendet.

-   **Spielmaterial:**
    -   Ein Gitter aus Knoten (z.B. 5x5).
    -   Zwei ausgezeichnete Knoten, die **Terminals** (z.B. oben-links und unten-rechts).

-   **Spieler und Ziele:** Das Spiel ist asymmetrisch.
    -   **Spieler "Short" (Kurzschluss):** Versucht, eine ununterbrochene Kette von Kanten **seiner Farbe** zu bilden, die die beiden Terminals verbindet.
    -   **Spieler "Cut" (Schnitt):** Versucht, dies zu verhindern, indem er Kanten für sich beansprucht (und sie damit für "Short" blockiert). Er gewinnt, wenn kein Pfad mehr zwischen den Terminals möglich ist.

-   **Spielablauf:** Die Spieler wählen abwechselnd eine noch unbeanspruchte Kante (Linie zwischen zwei Knoten) auf dem Brett. "Short" färbt sie in seiner Farbe, "Cut" markiert sie als "geschnitten" oder entfernt sie symbolisch.

-   **Spielende:** Das Spiel endet, sobald einer der Spieler sein Ziel erreicht hat.

## 2. Umsetzungsanleitung für die Rust-Engine

Die Modellierung dieses Spiels ist sehr ähnlich zu "Käsekästchen" (Dots and Boxes), da es auf der Manipulation von Kanten in einem Gitter basiert.

### Schritt 1: Datenmodellierung in Rust

Der Spielzustand wird durch Gitter repräsentiert, die die Kanten des Graphen darstellen.

```rust
// Für ein Spiel auf einem 5x5-Knoten-Gitter
struct ShannonSwitchingState {
    // Horizontale Kanten: 5 Reihen mit je 4 Kanten
    horizontal_edges: BitPackedBoard<5, 4, 2>,

    // Vertikale Kanten: 4 Reihen mit je 5 Kanten
    vertical_edges: BitPackedBoard<4, 5, 2>,

    // Optional: Diagonale Kanten für komplexere Graphen
    // diagonal_edges_1: BitPackedBoard<4, 4, 2>,
    // diagonal_edges_2: BitPackedBoard<4, 4, 2>,
}
```

Die **2 Bits** pro Zelle (Kante) speichern den Zustand:
-   `0`: Unbeansprucht
-   `1`: Von "Short" beansprucht
-   `2`: Von "Cut" beansprucht

### Schritt 2: Spiellogik im `GameLogic`-Trait implementieren

-   **`get_legal_moves(&self) -> Vec<Move>`:**
    -   Iteriert durch die `horizontal_edges` und `vertical_edges` Boards.
    -   Jede Kante mit dem Zustand `0` (Unbeansprucht) ist ein legaler Zug.
    -   Ein `Move` würde die Art und Koordinate der Kante definieren: `struct EdgeMove { is_horizontal: bool, row: u8, col: u8 }`.

-   **`make_move(&mut self, player_move: Move)`:**
    -   Setzt den Zustand der gewählten Kante auf die ID des aktuellen Spielers (`1` für Short, `2` für Cut).

-   **`check_win(&self) -> Option<u8>`:**
    -   Diese Funktion muss nach jedem Zug die Gewinnbedingungen für **beide** Spieler prüfen.
    -   **Gewinnprüfung für "Short":**
        -   Dies ist eine klassische **Pfadfindungs-Aufgabe** (Pathfinding).
        -   Starte einen Algorithmus (BFS oder DFS) am ersten Terminal-Knoten.
        -   Der Algorithmus darf sich nur über Kanten bewegen, die von "Short" beansprucht wurden (Zustand `1`).
        -   Wenn der zweite Terminal-Knoten erreicht wird, hat **Short (Spieler 1) gewonnen**.
    -   **Gewinnprüfung für "Cut":**
        -   "Cut" gewinnt, wenn "Short" nicht mehr gewinnen kann.
        -   Führe den gleichen Pfadfindungs-Algorithmus für "Short" aus, aber erlaube ihm, sich über **alle von ihm beanspruchten ODER noch unbeanspruchten** Kanten zu bewegen.
        -   Wenn unter diesen idealen Bedingungen **kein Pfad** mehr zwischen den Terminals existiert, hat **Cut (Spieler 2) gewonnen**.

### Schritt 3: JavaScript- und UI-Anpassungen

-   **`games/shannon-switching/game.js` (neu erstellen):**
    -   Standard-Wrapper für die WASM-Funktionen (`get_legal_moves`, `make_move`, `check_win`).

-   **`games/shannon-switching/ui.js` (neu erstellen):**
    -   **Darstellung:**
        -   Zeichnet das Gitter aus Punkten (Knoten).
        -   Die beiden Terminal-Knoten werden besonders hervorgehoben (z.B. größer oder farbig).
        -   Die Kanten (Linien) zwischen den Knoten werden basierend auf ihrem von der WASM-Engine gemeldeten Zustand gezeichnet:
            -   **Unbeansprucht:** Dünne, graue, klickbare Linie.
            -   **Von "Short" beansprucht:** Dicke, durchgehende Linie in der Farbe von Spieler 1.
            -   **Von "Cut" beansprucht:** Gestrichelte oder durchgestrichene Linie, um den "Schnitt" zu visualisieren.
    -   **Interaktion:** Die klickbaren Bereiche sind die Linien zwischen den Knoten. Ein Klick sendet den `EdgeMove` an die WASM-Engine.

### Fazit zur Implementierung

Das Shannon Switching Game ist ein hervorragendes Beispiel für die Leistungsfähigkeit der geplanten Engine-Architektur. Die Engine abstrahiert die Graphen-Logik und die Pfadfindungs-Algorithmen, die in Rust extrem performant ausgeführt werden. Die UI ist lediglich für die Visualisierung des Graphen (Knoten und Kanten) und die Weiterleitung von Klick-Events zuständig. Dies ermöglicht eine saubere, effiziente und erweiterbare Implementierung des Spiels.
