# Horizontale Gewinn-Testfälle für die 4-Gewinnt-KI (Finale korrigierte Version)

**An:** Claude / Max
**Von:** Gemini
**Datum:** 08. Juli 2025
**Betreff:** Finale, sorgfältig geprüfte Sammlung von Unit-Test-Szenarien für horizontale Gewinne. Alle Stellungen sind garantiert schwerkraft-konform.

---

## Struktur eines Testfalls

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

## Kategorie: Horizontale Gewinnzüge

### Testfall H.1: Gewinn am rechten Rand (unterste Reihe)

*   **name:** `"H-Win: Should win on the right edge on bottom row`"
*   **reason:** `"AI must complete the horizontal line of four on the far right to win. Move is in column 6.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    .......
    ...X...
    XXXOOO.
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    .......
    ...X...
    XXXOOOO
    ```

### Testfall H.2: Gewinn in der Mitte einer Lücke (unterste Reihe)

*   **name:** `"H-Win: Should win in the middle of a line`"
*   **reason:** `"AI must place the winning stone in the gap of its own three-in-a-row. Move is in column 1.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    .......
    ...X...
    X.OOOXX
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    .......
    ...X...
    XOOOOXX
    ```

### Testfall H.3: Gewinn in einer höheren Reihe (Reihe 2)

*   **name:** `"H-Win: Should win in a higher row with complex board state`"
*   **reason:** `"AI must identify the horizontal win in row 2. The winning move in column 1 is valid as row 1 below it is fully occupied.`"
*   **board_before:**
    ```
    .......
    .......
    ...X...
    .OOO.XX
    XOXOXOX
    OXOXOXO
    ```
*   **board_after:**
    ```
    .......
    .......
    ...X...
    OOOO.XX
    XOXOXOX
    OXOXOXO
    ```

### Testfall H.4: Gewinn in der obersten Reihe (Reihe 5)

*   **name:** `"H-Win: Should win in the top row (row 5)`"
*   **reason:** `"AI must be able to win even when the winning move is in the highest possible row. Move is in column 0.`"
*   **board_before:**
    ```
    .OOOXX.
    XOXOXOX
    XOXOXOX
    OXOXOXO
    OXOXOXO
    XOXOXOX
    ```
*   **board_after:**
    ```
    OOOOXX.
    XOXOXOX
    XOXOXOX
    OXOXOXO
    OXOXOXO
    XOXOXOX
    ```

### Testfall H.5: Gewinn in einer nicht-trivialen, gestützten Reihe

*   **name:** `"H-Win: Should win in a non-obvious higher row`"
*   **reason:** `"AI must correctly identify the single winning horizontal move in row 3. The move in column 1 is valid because the cells below it are occupied.`"
*   **board_before:**
    ```
    .......
    .......
    OO.O.XX
    XOXX.OX
    OXOO.XX
    XOXX.OO
    ```
*   **board_after:**
    ```
    .......
    .......
    OOOO.XX
    XOXX.OX
    OXOO.XX
    XOXX.OO
    ```

### Testfall H.6: Gewinn am linken Rand in einer höheren Reihe (Reihe 3)

*   **name:** `"H-Win: Should win on the left edge in a higher row`"
*   **reason:** `"AI must complete the line on the far left edge in a supported row. The move in column 0 is valid.`"
*   **board_before:**
    ```
    .......
    .......
    .OOO...
    XOXOXX.
    OXXOXX.
    XOXOXO.
    ```
*   **board_after:**
    ```
    .......
    .......
    OOOO...
    XOXOXX.
    OXXOXX.
    XOXOXO.
    ```

### Testfall H.7: Gewinn am durch Zwickmühle in unterster Reihe

*   **name:** `"H-Win: Should win right after easy fork`"
*   **reason:** `"AI must complete the line. The move in column 5 is legit.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    ...x...
    ...X...
    .XOOO.X
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    ...X...
    ...X...
    .XOOOOX
    ```

### Testfall H.8: Gewinn am durch Zwickmühle in unterster Reihe

*   **name:** `"H-Win: Should win left after easy fork`"
*   **reason:** `"AI must complete the line. The move in column 1 is legit.`"
*   **board_before:**
    ```
    .......
    .......
    .......
    ...X...
    ...X...
    ..OOOXX
    ```
*   **board_after:**
    ```
    .......
    .......
    .......
    ...X...
    ...X...
    .OOOOXX
    ```
