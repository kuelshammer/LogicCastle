# Testfälle für die 4-Gewinnt-KI (Korrigierte Version)

**An:** Claude / Max
**Von:** Gemini
**Datum:** 08. Juli 2025
**Betreff:** Sammlung von Unit-Test-Szenarien zur Validierung der `Connect4AI`-Logik. Diese Datei dient als Vorlage für die `test_data.rs`.

---

## Struktur eines Testfalls

Jeder Testfall wird in der folgenden Struktur definiert, die für eine datengesteuerte Test-Suite in Rust (`data-driven testing`) ideal ist.

```rust
pub struct AITestCase {
    pub name: &'static str,
    pub board_before: &'static str,
    pub board_after: &'static str,
    pub reason: &'static str,
}
```

*   **Legende:** `.` = Leer, `X` = Spieler (Mensch), `O` = KI
*   Die KI (`O`) ist immer der Spieler, der am Zug ist.

---

## Kategorie 1: Unmittelbare Gewinnzüge

**Priorität 1:** Wenn ein Gewinn möglich ist, muss er ergriffen werden.

### Testfall 1.1

*   **name:** `"Should win horizontally in the middle`"
*   **reason:** `"AI must complete the horizontal line of four to win the game.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    .X.....
    .OOO..X
    .XXO..X
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    .X.....
    .OOOO.X
    .XXO..X
    ```

### Testfall 1.2

*   **name:** `"Should win vertically on the edge`"
*   **reason:** `"AI must place the fourth stone on top of its vertical line on the edge to win.`"
*   **board_before:**
    ```
    .......
    O......
    O.X....
    O.X....
    X.X....
    X.O...X
    ```
*   **board_after:**
    ```
    O......
    O.X....
    O.X....
    O.X....
    X.X....
    X.O...X
    ```

### Testfall 1.3

*   **name:** `"Should win diagonally`"
*   **reason:** `"AI must complete the diagonal line of four.`"
*   **board_before:**
    ```
    .......
    .......
    ....O..
    ...OX..
    ..OX...
    .XOX..X
    ```
*   **board_after:**
    ```
    .......
    .......
    ....O..
    ...OX..
    ..OXO..
    .XOX..X
    ```

---

## Kategorie 2: Unmittelbare Blockier-Züge

**Priorität 2:** Wenn der Gegner im nächsten Zug gewinnen kann, muss dieser Zug blockiert werden.

### Testfall 2.1

*   **name:** `"Should block opponent's horizontal win`"
*   **reason:** `"AI must block the opponent's three-in-a-row to prevent a loss.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    ....O..
    ..XXX.O
    ..OXX.O
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    ....O..
    O.XXX.O
    ..OXX.O
    ```

### Testfall 2.2

*   **name:** `"Should block opponent's vertical win`"
*   **reason:** `"AI must block the top of the opponent's vertical line.`"
*   **board_before:**
    ```
    .......
    ....X..
    ....X.O
    ....X.O
    ....O.X
    ...OX.X
    ```
*   **board_after:**
    ```
    ....O..
    ....X..
    ....X.O
    ....X.O
    ....O.X
    ...OX.X
    ```

### Testfall 2.3

*   **name:** `"Should block opponent's diagonal win`"
*   **reason:** `"AI must block the opponent's diagonal threat.`"
*   **board_before:**
    ```
    .......
    .......
    ...X...
    ..X.O..
    .X.O...
    O.O.X.X
    ```
*   **board_after:**
    ```
    .......
    ....O..
    ...X...
    ..X.O..
    .X.O...
    O.O.X.X
    ```

---

## Kategorie 3: Priorisierung (Eigener Sieg > Gegner blockieren)

**Priorität 3:** Wenn die KI gewinnen und gleichzeitig einen gegnerischen Gewinn blockieren kann, muss sie den eigenen Gewinnzug wählen.

### Testfall 3.1

*   **name:** `"Should prioritize its own win over blocking`"
*   **reason:** `"AI has a winning move (vertical in col 2) and must ignore the opponent's threat (horizontal starting col 3).`"
*   **board_before:**
    ```
    .......
    ..O....
    ..O....
    ..O.X..
    ..X.XXX
    ..X.OXX
    ```
*   **board_after:**
    ```
    ..O....
    ..O....
    ..O....
    ..O.X..
    ..X.XXX
    ..X.OXX
    ```

---

## Kategorie 4: Aufbau von Bedrohungen

**Priorität 4:** Wenn keine unmittelbare Gefahr oder Gewinnchance besteht, sollte die KI eine eigene Bedrohung aufbauen.

### Testfall 4.1

*   **name:** `"Should set up its own horizontal threat`"
*   **reason:** `"With no immediate threats, the AI should create a three-in-a-row to force the opponent's next move.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    .......
    .X.O...
    .X.OO.X
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    .......
    .X.O...
    .XOOO.X
    ```

---

## Kategorie 5: Zwickmühlen (Forks)

**Priorität 5:** Fortgeschrittene Taktiken, die mehrere Bedrohungen gleichzeitig erzeugen oder verhindern.

### Testfall 5.1 (Korrigiert)

*   **name:** `"Should create a fork`"
*   **reason:** `"AI move in col 2 creates two winning threats for the next turn (a horizontal threat on row 1, and a diagonal threat starting from row 0, col 0). The opponent can only block one.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    ..O....
    .O.X...
    XO.XX.O
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    ..O....
    .OOX...
    XO.XX.O
    ```

### Testfall 5.2

*   **name:** `"Should block an opponent's fork setup`"
*   **reason:** `"Opponent (X) wants to play in col 2 to create a fork. The AI must occupy this critical square first.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    ..X....
    .X.O...
    .X.OO.O
    ```
*   **board_after:**
    ```
    .......
    .......
    ..O....
    ..X....
    .X.O...
    .X.OO.O
    ```

---

## Kategorie 6: Positionsspiel

**Priorität 6:** Grundlegende strategische Züge, wenn keine Taktiken anwendbar sind.

### Testfall 6.1

*   **name:** `"Should prioritize center control in opening`"
*   **reason:** `"In the opening phase with no threats, controlling the center column (col 3) offers the most future winning possibilities.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    .......
    .......
    ..X....
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    .......
    ...O...
    ..X....
    ```
