
# Implementierungsanleitung für das L-Game

**An:** Coding LLM
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Anleitung zur Implementierung des L-Games von Edward de Bono unter Verwendung der neuen, vereinheitlichten Rust-Engine.

## 1. Spielregeln (Zusammenfassung)

Das L-Game ist ein strategisches Brettspiel für zwei Spieler auf einem 4x4-Feld.

-   **Spielmaterial:**
    -   Ein 4x4-Spielbrett.
    -   Zwei L-förmige Spielsteine (4 Felder), einer pro Spieler (z.B. Rot und Blau).
    -   Zwei neutrale, 1x1 große Spielsteine (z.B. Weiß).

-   **Spielzug:** Ein Zug besteht aus zwei Aktionen:
    1.  **L-Stein bewegen (Pflicht):** Der Spieler muss seinen L-förmigen Spielstein auf eine neue Position legen. Der Stein darf dabei beliebig gedreht und auch gespiegelt werden. Die neue Position muss sich von der alten unterscheiden (mindestens ein Feld muss anders belegt sein).
    2.  **Neutralen Stein bewegen (Optional):** Nachdem der L-Stein bewegt wurde, *kann* der Spieler einen der beiden neutralen Steine auf ein beliebiges freies Feld verschieben.

-   **Ziel:** Das Spiel endet, wenn ein Spieler seinen L-Stein nicht mehr regelkonform bewegen kann. **Dieser Spieler verliert das Spiel.**

## 2. Umsetzungsanleitung für die Rust-Engine

Die Implementierung des L-Games passt perfekt in die Architektur der vorgeschlagenen, neuen Rust-Engine. Die Herausforderung liegt hier nicht in der Komplexität des Bretts, sondern in der Darstellung der Spielstein-Positionen und der Zug-Logik.

### Schritt 1: Datenstrukturen in Rust definieren

-   **Das Spielbrett:**
    -   Wir verwenden die generische `BitPackedBoard<4, 4, 3>`. Die 3 Bits pro Zelle erlauben uns, bis zu 8 Zustände zu speichern, was für unsere Zwecke mehr als ausreichend ist:
        -   `0`: Leer
        -   `1`: Spieler 1 (Rot)
        -   `2`: Spieler 2 (Blau)
        -   `3`: Neutraler Stein 1
        -   `4`: Neutraler Stein 2

-   **Die Spielsteine:**
    -   Die Position der L-Steine und der neutralen Steine wird nicht direkt auf dem `BitPackedBoard` gespeichert, da sich die L-Steine frei bewegen. Stattdessen speichern wir ihre Konfiguration im Haupt-Spielzustand.
    -   `struct LGamePiece { shape: [[u8; 3]; 3], position: (i8, i8) }` könnte eine Möglichkeit sein, die Form und Position eines L-Steins zu speichern. Effizienter wäre es jedoch, die 8 möglichen Orientierungen des L-Steins vorzuberechnen und nur den Index der Orientierung und die Anker-Position zu speichern.
    -   `struct LGameState { player1_l_piece: LGamePiece, player2_l_piece: LGamePiece, neutral1_pos: (u8, u8), neutral2_pos: (u8, u8) }`

### Schritt 2: Spiellogik im `GameLogic`-Trait implementieren

-   **`setup_board(&mut self)`:**
    -   Platziert die Spielsteine in der Startaufstellung. Die neutralen Steine kommen auf definierte Startfelder, die L-Steine werden in einer Standard-Konfiguration platziert.

-   **`get_legal_moves(&self, player_id: u8) -> Vec<Move>`:**
    -   Dies ist die komplexeste Funktion.
    -   Sie muss für den aktuellen Spieler alle möglichen neuen, validen Positionen für seinen L-Stein berechnen.
    -   **Algorithmus:**
        1.  Iteriere durch alle 16 Felder des Bretts als potenziellen "Ankerpunkt" für den L-Stein.
        2.  Iteriere durch alle 8 möglichen Orientierungen (Rotationen/Spiegelungen) des L-Steins.
        3.  Für jede Kombination aus Ankerpunkt und Orientierung:
            a. Prüfe, ob der Stein vollständig auf dem 4x4-Brett liegt.
            b. Prüfe, ob die 4 Felder, die der Stein belegen würde, frei sind (d.h. nicht vom gegnerischen L-Stein oder einem der neutralen Steine besetzt).
            c. Prüfe, ob diese neue Position sich von der aktuellen Position des Steins unterscheidet.
        4.  Jede valide neue Position ist ein legaler Zug.
    -   Die optionalen Züge der neutralen Steine müssen hier nicht berechnet werden, da sie Teil des Haupt-Spielzugs sind.

-   **`make_move(&mut self, player_move: Move)`:**
    -   Ein `Move` für das L-Game wäre komplexer: `struct LGameMove { l_piece_new_pos: (i8, i8), l_piece_new_orientation: u8, neutral_piece_move: Option<(u8, u8, u8)> }` (welcher neutrale Stein, neue Position).
    -   Die Funktion aktualisiert die Position des L-Steins des Spielers und optional die Position eines neutralen Steins im `LGameState`.

-   **`check_win(&self) -> Option<u8>`:**
    -   Nach einem Zug wird `get_legal_moves` für den *nächsten* Spieler aufgerufen.
    -   Wenn die zurückgegebene Liste der legalen Züge leer ist, hat der *aktuelle* Spieler gewonnen (da der nächste Spieler blockiert ist).

### Schritt 3: JavaScript- und UI-Anpassungen

-   **`games/l-game/game.js` (neu erstellen):**
    -   Ein schlanker Wrapper, der die WASM-Funktionen der neuen Engine aufruft (`get_legal_moves`, `make_move` etc.).

-   **`games/l-game/ui.js` (neu erstellen):**
    -   **Board-Darstellung:** Erstellt ein 4x4-Grid.
    -   **Spielstein-Darstellung:** Statt einzelne Felder zu färben, werden die L-Steine als eigene DOM-Elemente (z.B. ein `div`, das aus 4 kleineren `div`s besteht) über das Brett gelegt. Dies erleichtert die Visualisierung von Rotationen und Bewegungen.
    -   **Interaktion:**
        1.  Der Spieler klickt auf seinen L-Stein, um ihn "aufzunehmen".
        2.  Die UI ruft `get_legal_moves` von der WASM-Engine ab und zeigt die möglichen Zielpositionen visuell an (z.B. durch Hervorheben der freien Felder).
        3.  Der Spieler klickt auf eine valide Zielposition. Die UI zeigt eine Vorschau des gedrehten/gespiegelten Steins an.
        4.  Nachdem der L-Stein platziert wurde, kann der Spieler optional einen der neutralen Steine anklicken und auf ein anderes freies Feld ziehen.
        5.  Ein "Zug beenden"-Button schickt den kompletten `LGameMove` an die WASM-Engine.

### Zusammenfassung der Implementierungs-Highlights

-   **Zustand:** Der Zustand der L-Steine (Position, Orientierung) wird in Rust verwaltet, nicht direkt auf dem Spielbrett-Datenraster.
-   **Logik:** Die komplexe Logik zur Findung legaler Züge wird komplett in Rust ausgeführt, was für die nötige Performance sorgt.
-   **Darstellung:** Die UI ist für die visuelle Darstellung der frei beweglichen Steine verantwortlich und erhält die Logik-Vorgaben (valide Züge) von der WASM-Engine.

Diese Vorgehensweise stellt sicher, dass auch ein unkonventionelles Spiel wie das L-Game von der Performance und der zentralisierten Logik der neuen Rust-Engine profitieren kann.
