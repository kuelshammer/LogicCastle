# Analyse und Behebung des Gomoku-Steinplatzierungsfehlers

**An:** Claude
**Von:** Gemini
**Datum:** 05. Juli 2025

## 1. Fehlerbeschreibung

**Problem:** Bei der Gomoku-Implementierung werden alle Spielsteine, unabhängig von der angeklickten Position, visuell in der obersten Zeile des Spielfelds platziert. Die logische Position des Steins im Spielzustand (im Hintergrund) ist korrekt, aber die visuelle Darstellung ist fehlerhaft.

## 2. Ursachenanalyse

Der Fehler wurde in der UI-Logik der Datei `games/gomoku/js/ui-new.js` innerhalb der Funktion `positionStoneOnBoardResponsive` identifiziert. Die Kernursache ist eine fehlerhafte Berechnung der vertikalen Pixelkoordinaten.

**Die fehlerhafte Logik:**

1.  **Einseitige Padding-Berechnung:** Das Padding (der innere Abstand des Spielfelds) wurde ausschließlich auf Basis der **Breite** des Bretts (`boardWidth`) berechnet.
    ```javascript
    const padding = boardWidth * paddingPercentage;
    ```

2.  **Inkorrekte Höhenberechnung:** Dieses von der Breite abhängige Padding wurde fälschlicherweise auch zur Berechnung der Höhe des spielbaren Bereichs (`gridHeight`) verwendet.
    ```javascript
    const gridHeight = boardHeight - (2 * padding);
    ```

3.  **Die Konsequenz:** Wenn das Spielfeld-Element (z.B. durch die Fenstergröße) breiter als hoch ist, wird das `padding` zu groß für die Höhenberechnung. Dies führt dazu, dass `gridHeight` und somit auch `stepY` (der vertikale Abstand zwischen den Linien) **null oder sogar negativ** werden.

4.  **Das Ergebnis:** Wenn `stepY` null ist, ergibt die Formel zur Berechnung der Y-Position (`pixelY = padding + (row * stepY)`) für jede Zeile (`row`) denselben Wert: `pixelY = padding`. Alle Steine werden daher an die korrekte horizontale, aber an die gleiche fehlerhafte vertikale Position gesetzt – ganz oben.

**Fehlerhafter Code-Ausschnitt:**
```javascript
// in positionStoneOnBoardResponsive()

const padding = boardWidth * paddingPercentage; // Basiert nur auf der Breite

const gridWidth = boardWidth - (2 * padding);
const gridHeight = boardHeight - (2 * padding); // Fehlerquelle: Verwendet das breitenbasierte Padding

const stepX = gridWidth / (gridSize - 1);
const stepY = gridHeight / (gridSize - 1); // Wird 0, wenn Brett breiter als hoch ist

const pixelY = padding + (row * stepY); // Ergibt für jede 'row' denselben Wert
```

## 3. Fehlerbehebung

Die Lösung besteht darin, das horizontale und vertikale Padding getrennt und jeweils auf Basis der korrekten Dimension (Breite für X, Höhe für Y) zu berechnen.

**Korrigierter Code-Ausschnitt:**
```javascript
// in positionStoneOnBoardResponsive()

// Padding für X- und Y-Achse getrennt berechnen
const paddingX = boardWidth * paddingPercentage;
const paddingY = boardHeight * paddingPercentage;

// Grid-Größe mit korrektem Padding berechnen
const gridWidth = boardWidth - (2 * paddingX);
const gridHeight = boardHeight - (2 * paddingY);

// Schrittgröße für jede Achse getrennt berechnen
const stepX = gridWidth / (gridSize - 1);
const stepY = gridHeight / (gridSize - 1); // Ist jetzt immer korrekt

// Finale Pixel-Positionen mit korrekten Werten berechnen
const pixelX = paddingX + (col * stepX);
const pixelY = paddingY + (row * stepY); // Ergibt nun die korrekte vertikale Position
```

Durch diese Korrektur wird sichergestellt, dass die vertikale Position eines Steins immer relativ zur Höhe des Spielfelds berechnet wird, wodurch der Fehler behoben und eine präzise Platzierung auf dem gesamten Brett gewährleistet ist.
