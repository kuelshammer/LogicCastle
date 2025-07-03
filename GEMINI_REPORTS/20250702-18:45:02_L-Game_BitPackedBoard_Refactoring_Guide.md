
# Refactoring-Anleitung: L-Game auf BitPackedBoard umstellen

**An:** Coding LLM / Rust-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Technischer Leitfaden für die Implementierung des L-Games unter Verwendung einer speichereffizienten `BitPackedBoard`-Struktur.

## 1. Zielsetzung

Das Ziel ist die Implementierung des L-Games innerhalb der neuen, vereinheitlichten Rust-Engine. Im Gegensatz zu den anderen Spielen wird der Zustand des L-Games nicht primär durch das Brett selbst, sondern durch die Position und Orientierung der Spielsteine definiert. Das `BitPackedBoard` dient hier als "Leinwand", um Kollisionen zu überprüfen.

## 2. Datenmodellierung in Rust

### 2.1. Das Spielbrett: `BitPackedBoard<4, 4, 3>`

Wir verwenden ein 4x4-Gitter, bei dem jede Zelle 3 Bits hat. Dies erlaubt uns, 8 verschiedene Zustände zu speichern, was für die Visualisierung und Kollisionserkennung ausreicht:

-   `0`: Leer
-   `1`: Teil des L-Steins von Spieler 1
-   `2`: Teil des L-Steins von Spieler 2
-   `3`: Neutraler Stein 1
-   `4`: Neutraler Stein 2

### 2.2. Der eigentliche Spielzustand

Die maßgebliche Wahrheit (Source of Truth) ist nicht das Brett, sondern eine separate Struktur, die die Konfiguration der Spielsteine speichert.

```rust
// Repräsentiert eine der 8 möglichen Orientierungen des L-Steins
type LShape = [[u8; 3]; 2]; // z.B. [[1,1,1], [1,0,0]]

const L_SHAPES: [LShape; 8] = [ ... ]; // Alle 8 Rotationen/Spiegelungen vordefinieren

struct LPiece {
    orientation: u8, // Index in L_SHAPES
    row: i8,         // Anker-Position (kann negativ sein, wenn Teile des Steins außerhalb liegen)
    col: i8,
}

struct LGameState {
    player1_piece: LPiece,
    player2_piece: LPiece,
    neutral1_pos: (u8, u8),
    neutral2_pos: (u8, u8),
}

// Die Haupt-Game-Struktur würde LGameState enthalten
#[wasm_bindgen]
pub struct Game {
    // ...
    l_game_state: Option<LGameState>,
    // ...
}
```

## 3. Schritt-für-Schritt Implementierungs-Anleitung

### Schritt 1: `Game`-Struktur erweitern

Fügen Sie `LGameState` zur `Game`-Struktur oder zum `GameBoard`-Enum hinzu, um den Zustand des L-Games zu speichern.

### Schritt 2: Spiellogik implementieren

-   **`get_legal_moves(&self, player_id: u8) -> Vec<LGameMove>`:**
    -   Dies ist die Kernfunktion. Sie muss alle validen Züge für den L-Stein des Spielers finden.
    -   **Algorithmus:**
        1.  Erstelle ein temporäres `BitPackedBoard<4, 4, 3>`, das den aktuellen Zustand des Bretts darstellt (Position des gegnerischen L-Steins und der neutralen Steine).
        2.  Iteriere durch alle 16 Felder des Bretts als potenziellen Ankerpunkt `(r, c)`.
        3.  Iteriere durch alle 8 vordefinierten `L_SHAPES`.
        4.  Für jede Kombination:
            a. Prüfe, ob der Stein, wenn er bei `(r, c)` mit der aktuellen Orientierung platziert wird, vollständig auf dem Brett liegt und keine Felder auf dem temporären Board belegt, die bereits besetzt sind.
            b. Prüfe, ob diese neue Position sich von der aktuellen Position des Steins unterscheidet.
        5.  Jede valide neue Position ist ein legaler Zug für den L-Stein.
    -   Ein `LGameMove` muss die neue Konfiguration des L-Steins und die optionale neue Position eines neutralen Steins enthalten.

-   **`make_move(&mut self, l_game_move: LGameMove)`:**
    -   Aktualisiert die `LGameState`-Struktur mit den neuen Positionen und Orientierungen aus dem `l_game_move`.

-   **`check_win(&self) -> Option<u8>`:**
    -   Nach einem Zug wird `get_legal_moves` für den *nächsten* Spieler aufgerufen.
    -   Wenn die zurückgegebene Liste der legalen Züge leer ist, hat der *aktuelle* Spieler gewonnen.

### Schritt 3: `get_board()`-API für JavaScript

Die `get_board`-Funktion muss das visuelle Brett aus dem `LGameState` dynamisch generieren.

```rust
pub fn get_board(&self) -> Vec<u8> {
    if let Some(state) = &self.l_game_state {
        let mut board = BitPackedBoard::<4, 4, 3>::new();

        // Zeichne Spieler 1
        // ... Logik, um die 4 Felder des L-Steins auf dem Board zu setzen ...

        // Zeichne Spieler 2
        // ...

        // Zeichne neutrale Steine
        board.set_cell(state.neutral1_pos.0, state.neutral1_pos.1, 3);
        board.set_cell(state.neutral2_pos.0, state.neutral2_pos.1, 4);

        // Dekodiere das temporäre Board und gib es zurück
        return decode_board_to_vec(board);
    }
    // ...
}
```

## 4. Vorteile dieser Herangehensweise

1.  **Korrekte Modellierung:** Trennt die logische Repräsentation der Spielsteine von der visuellen Darstellung des Bretts, was für Spiele wie das L-Game unerlässlich ist.
2.  **Performance:** Die komplexe und rechenintensive Suche nach legalen Zügen wird vollständig in Rust ausgeführt, was für eine flüssige Benutzererfahrung sorgt.
3.  **Flexibilität:** Die Engine bleibt flexibel. Die `BitPackedBoard`-Struktur wird hier als effizientes Werkzeug zur Kollisionserkennung verwendet, nicht als primärer Zustandsspeicher.
