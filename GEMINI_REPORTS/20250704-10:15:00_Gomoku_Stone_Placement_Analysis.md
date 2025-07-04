
# Analyse und Lösung für die Platzierung von Spielsteinen in Gomoku

**Datum:** 2025-07-04
**Autor:** Gemini

## Zusammenfassung

Dieser Bericht analysiert das Problem der fehlerhaften Platzierung von Spielsteinen im Gomoku-Spiel. Die Hauptursache ist, dass die Stein-Elemente als Kinder der `intersection`-Elemente hinzugefügt werden, was zu einem komplexen und fehleranfälligen verschachtelten Positionierungssystem führt, insbesondere in Kombination mit einem responsiven, prozentual gepaddeten Spielfeld.

Die empfohlene Lösung besteht darin, die Spielsteine stattdessen direkt als Kind-Elemente des `.game-board`-Containers hinzuzufügen. Ihre Position sollte dann absolut in Pixeln berechnet werden, basierend auf den zur Laufzeit ermittelten Dimensionen und dem Padding des Spielfelds. Dieser Ansatz entkoppelt die Steine von den Intersections und schafft eine einzige, stabile Referenz für die Positionierung, die bei jeder Bildschirmgröße zuverlässig funktioniert.

---

## 1. Problemanalyse

Die aktuelle Implementierung in `ui-new.js` (und ähnlich in `ui.js`) weist zwei grundlegende Probleme auf, die zu ungenauer Steinplatzierung führen:

**Problem 1: Falsche DOM-Verschachtelung**

In der Funktion `onMoveMade` wird der neue Stein direkt an das `intersection`-Element angehängt:

```javascript
// ui-new.js -> onMoveMade(move)
const intersection = this.getIntersection(move.row, move.col);
// ...
intersection.appendChild(stone); // <-- Problem: Stein ist Kind der Intersection
intersection.classList.add('occupied');
```

Das `intersection`-Element selbst ist bereits absolut innerhalb des `.game-board` positioniert. Der Stein, der ebenfalls `position: absolute` hat, wird somit relativ zur `intersection` positioniert. Dies schafft eine unnötig komplexe und schwer zu steuernde verschachtelte Positionierung.

**Problem 2: Unzuverlässige CSS-Positionierung**

Das CSS für den Stein (`.stone`) legt keine `top`- oder `left`-Werte fest. Die Positionierung hängt vollständig davon ab, wie der Browser den Stein innerhalb der kleinen `intersection`-Box rendert. Dies ist unzuverlässig, insbesondere da das Spielfeld (`.game-board`) responsive Einheiten (`vmin`) und prozentuales Padding (`padding: 5.13%`) verwendet. Jede kleine Änderung am CSS der `intersection` kann die Steinposition unvorhersehbar verschieben.

Das Ergebnis ist, dass die Steine nicht exakt auf den Linienkreuzungen des visuellen Spielfeldrasters landen.

---

## 2. Empfohlene Lösung: Entkopplung und direkte Positionierung

Die robuste Lösung besteht darin, die Spielsteine vom DOM-Element der Intersection zu entkoppeln und sie direkt auf dem Spielfeld zu positionieren.

1.  **DOM-Struktur:** Hänge jeden neuen Stein als direktes Kind des `.game-board`-Containers an.
2.  **Positionierungslogik:** Schreibe eine Hilfsfunktion, die die logischen Gitterkoordinaten (z.B. `row: 3`, `col: 4`) in exakte Pixel-Koordinaten (`top`, `left`) umrechnet. Diese Berechnung muss die *tatsächlichen*, zur Laufzeit ermittelten Dimensionen und das Padding des Spielfelds berücksichtigen.
3.  **Zentrierung:** Verwende `transform: translate(-50%, -50%)`, um den Stein perfekt auf der berechneten Koordinate zu zentrieren.

Dieser Ansatz hat eine einzige, stabile Referenz – das `.game-board` – und ist immun gegen Änderungen am Stil der Intersections.

---

## 3. Schritt-für-Schritt-Anleitung zur Implementierung

Die folgenden Änderungen sollten in `games/gomoku/js/ui-new.js` vorgenommen werden.

### Schritt 1: Eine robuste Positionierungsfunktion erstellen

Füge diese neue Hilfsfunktion zur `GomokuUINew`-Klasse hinzu. Sie wird die gesamte Berechnungslogik kapseln.

```javascript
/**
 * Berechnet die exakte Pixel-Position eines Steins auf dem Spielfeld.
 * Berücksichtigt die tatsächliche Größe und das prozentuale Padding des Boards zur Laufzeit.
 * @param {number} row - Die Ziel-Zeile (0-14).
 * @param {number} col - Die Ziel-Spalte (0-14).
 * @param {HTMLElement} stoneElement - Das DOM-Element des Steins, das positioniert werden soll.
 */
positionStoneOnBoard(row, col, stoneElement) {
    const board = this.elements.gameBoard;

    // 1. Hole die tatsächlichen, gerenderten Dimensionen des Spielfelds zur Laufzeit.
    const boardRect = board.getBoundingClientRect();
    const boardWidth = boardRect.width;

    // 2. Berechne das Padding in Pixeln. Das CSS verwendet 5.13%.
    const padding = boardWidth * 0.0513;

    // 3. Berechne die Größe des reinen Gitters (ohne Padding).
    const gridWidth = boardWidth - (2 * padding);
    const gridSize = this.game.BOARD_SIZE || 15;

    // 4. Berechne den Abstand zwischen zwei Linien.
    // Für ein 15x15-Gitter gibt es 14 Abstände.
    const step = gridWidth / (gridSize - 1);

    // 5. Berechne die finalen Pixel-Koordinaten.
    // Startpunkt ist das Padding, dann füge die Schritte für die jeweilige Zeile/Spalte hinzu.
    const pixelX = padding + (col * step);
    const pixelY = padding + (row * step);

    // 6. Wende die Stile auf das Stein-Element an.
    stoneElement.style.position = 'absolute';
    stoneElement.style.left = `${pixelX}px`;
    stoneElement.style.top = `${pixelY}px`;

    // 7. Zentriere den Stein exakt auf dem Koordinatenpunkt.
    // Dies ist der robusteste Weg und funktioniert unabhängig von der Steingröße.
    stoneElement.style.transform = 'translate(-50%, -50%)';
}
```

### Schritt 2: Die `onMoveMade`-Funktion anpassen

Modifiziere die `onMoveMade`-Funktion, um die neue Logik zu verwenden.

```javascript
// In ui-new.js

onMoveMade(move) {
    console.log('🔍 onMoveMade called:', move);
    
    // Hole die Intersection nur noch für das Status-Management (z.B. 'occupied').
    const intersection = this.getIntersection(move.row, move.col);
    if (!intersection) {
        console.error('❌ No intersection found for move!', move);
        return;
    }

    // Bereinige Vorschau-Steine und Highlights wie bisher.
    const previewStone = intersection.querySelector('.stone-preview');
    if (previewStone) {
        previewStone.remove();
    }
    this.clearHintHighlights();
    this.clearLastMoveIndicators();

    // Erstelle den Stein.
    const stone = document.createElement('div');
    const playerClass = this.game.getPlayerColorClass(move.player);
    stone.className = `stone ${playerClass} stone-place last-move`;

    // === NEUE LOGIK START ===

    // 1. Hänge den Stein direkt an das Spielfeld an, nicht an die Intersection.
    this.elements.gameBoard.appendChild(stone);

    // 2. Positioniere den Stein mit der neuen, robusten Funktion.
    this.positionStoneOnBoard(move.row, move.col, stone);

    // === NEUE LOGIK ENDE ===

    // Markiere die Intersection als besetzt, damit dort kein weiterer Stein platziert werden kann.
    intersection.classList.add('occupied');
    console.log('✅ Stone placed! Total stones:', document.querySelectorAll('.stone').length);

    // Füge den Zug-Indikator hinzu (optional, aber gut für die UI).
    const moveIndicator = document.createElement('div');
    moveIndicator.className = 'move-indicator';
    moveIndicator.title = `${move.moveNumber || 'Move'}. ${this.game.positionToNotation(move.row, move.col)}`;
    stone.appendChild(moveIndicator);

    // Animation und restliche Logik bleiben gleich.
    setTimeout(() => {
        stone.classList.remove('stone-place');
        this.isProcessingMove = false;
        this.updateDisplay();
    }, this.animationDuration);
}
```

---

## 4. Warum dieser Ansatz robust ist

-   **Einzelne Referenz:** Alle Steine beziehen ihre Position vom selben Elternelement (`.game-board`). Das Koordinatensystem ist einfach und vorhersehbar.
-   **Responsiv und präzise:** Durch die Berechnung der Position zur Laufzeit basierend auf `getBoundingClientRect()` funktioniert die Platzierung bei jeder Fenstergröße und jedem Zoom-Level pixelgenau.
-   **Wartbar:** Die Positionierungslogik ist in einer einzigen Funktion gekapselt. Änderungen am Styling der Intersections oder anderer Elemente haben keinen Einfluss auf die Steinposition.
-   **Entkoppelt:** Die Logik für die Spielmechanik (Intersection besetzt) ist von der visuellen Darstellung (Stein-Position) getrennt.

## Fazit

Durch die Übernahme dieses Ansatzes wird das Problem der Steinplatzierung dauerhaft gelöst. Der Code wird stabiler, vorhersehbarer und einfacher zu warten sein. Es wird empfohlen, die `ui.js`-Datei (die ältere Version) ebenfalls entsprechend zu aktualisieren oder als veraltet zu markieren, um zukünftige Verwirrung zu vermeiden.
