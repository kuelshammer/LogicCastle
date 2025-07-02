
# UI/UX-Implementierungsplan für LogicCastle

**An:** Coding LLM / Frontend-Entwickler
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Detaillierter Plan zur Implementierung einer responsiven und performanten Benutzeroberfläche für alle Spieltypen mit HTML und Tailwind CSS.

## 1. Übergreifende UI/UX-Prinzipien

Diese Prinzipien bilden die Grundlage für alle Spiele und gewährleisten eine konsistente, moderne und wartbare UI.

1.  **Zustandsgetriebene UI:** Die UI ist eine reine Visualisierungsschicht. Das JavaScript empfängt einen Zustand vom Rust/WASM-Modul und rendert ihn. Es enthält **keine eigene Spiellogik**.
2.  **Mobile-First & Responsive:** Das Design wird für kleine Bildschirme konzipiert und skaliert nach oben. Wir nutzen relative Einheiten (`%`, `vw`), Flexbox, CSS Grid und die responsiven Varianten von Tailwind (`sm:`, `md:`, `lg:`).
3.  **Performance:** Animationen werden bevorzugt mit CSS-Transitions und -Transforms (`translate`, `scale`) umgesetzt, da diese GPU-beschleunigt sind und eine höhere Performance bieten als JS-Animationen.
4.  **Barrierefreiheit (Accessibility):** Alle interaktiven Elemente müssen per Tastatur erreichbar und bedienbar sein. `role="button"`, `tabindex="0"` und aussagekräftige `aria-label` (z.B. "Feld A1, besetzt von Spieler Rot") sind obligatorisch.

---

## 2. Kategorie 1: Spiele in den Zellen

**Betrifft:** 4 Gewinnt, Trio, L-Game

Diese Spiele sind am einfachsten darzustellen, da sie einem klassischen Gitter folgen.

### HTML-Struktur

Die empfohlene Methode ist **CSS Grid**. Das Spielbrett ist ein einziger Container.

```html
<!-- Beispiel für 4 Gewinnt -->
<div id="game-board-container" class="w-full max-w-xl mx-auto aspect-[7/6]">
  <div id="game-board" class="grid grid-cols-7 grid-rows-6 gap-2 p-2 bg-blue-700 rounded-lg">
    <!-- Die 42 leeren Zell-DIVs werden per JS generiert -->
  </div>
</div>
```

### CSS/Tailwind-Styling & Responsivität

-   **Container (`#game-board-container`):** Der Schlüssel zur Responsivität ist die Tailwind-Klasse `aspect-[...]` (z.B. `aspect-[7/6]` für 4 Gewinnt, `aspect-square` für Trio). Dies erzwingt das korrekte Seitenverhältnis, wodurch das Brett perfekt und ohne Verzerrungen skaliert.
-   **Gitter (`#game-board`):** `display: grid` mit `grid-cols-*` und `grid-rows-*` ist die ideale Umsetzung. `gap-*` sorgt für den Abstand zwischen den Zellen.
-   **Spielsteine:** Spielsteine werden als absolut positionierte `div`-Elemente *innerhalb* der Gitterzellen platziert. Dies ist entscheidend für Animationen.
    -   **Animation (4 Gewinnt):** Ein neuer Stein wird in der obersten Zelle der Zielspalte erstellt und erhält eine CSS-Transition für die `transform: translateY(...)`-Eigenschaft. Dies erzeugt eine flüssige Fall-Animation.

### JavaScript-Interaktion

1.  JS initialisiert das Brett und erstellt die leeren Zell-`div`s.
2.  Ein einziger Klick-Event-Listener wird auf dem `#game-board`-Container platziert (Event Delegation), um Klicks auf Spalten oder Zellen abzufangen.
3.  Bei einem Klick werden die Koordinaten an die WASM-Engine gesendet.
4.  Die WASM-Engine gibt den neuen, kompletten Zustand des Bretts als Array zurück.
5.  JS löscht alle alten Spielsteine und rendert den neuen Zustand, indem es die farbigen Stein-`div`s in die entsprechenden Zellen einfügt.

---

## 3. Kategorie 2: Spiele auf Kanten & Schnittpunkten

**Betrifft:** Gomoku, Käsekästchen, Shannon Switching Game

Der Benutzer interagiert hier mit dem Raum *zwischen* den Zellen oder den *Schnittpunkten*.

### HTML-Struktur & Styling

Die beste Methode ist die Trennung des visuellen Gitters vom interaktiven Gitter.

**Für Gomoku (Schnittpunkte):**
-   **HTML:** Ein Container mit `position: relative`. Das sichtbare Linien-Gitter wird als `background-image` (ein SVG oder ein CSS-Gradient) auf diesem Container gezeichnet.
-   **Interaktion:** Ein unsichtbares CSS-Grid aus klickbaren `div`s wird über den Hintergrund gelegt. Jedes `div` repräsentiert einen Schnittpunkt und wird absolut positioniert. Die Spielsteine werden dann in diese unsichtbaren `div`s platziert, wodurch sie perfekt auf den Schnittpunkten erscheinen.

**Für Käsekästchen/Shannon (Kanten):**
-   **HTML:** Wir erstellen mehrere übereinanderliegende CSS-Grids innerhalb eines relativen Containers:
    1.  Ein Gitter für die **Punkte** (visuell).
    2.  Ein Gitter für die **klickbaren horizontalen Linien**.
    3.  Ein Gitter für die **klickbaren vertikalen Linien**.
    4.  Ein Gitter für die **eroberten Kästchen** (zum Einfärben).
-   **CSS:** Die `div`s in den Linien-Gittern sind anfangs fast unsichtbar. Bei `:hover` werden sie hervorgehoben. Nach einem Klick bekommen sie eine Klasse (`.drawn-by-player1`), die ihnen eine dicke, farbige Border gibt.

### JavaScript-Interaktion

Der Ablauf ist konsistent: Klick auf ein interaktives Element -> Koordinaten an WASM -> neuen Zustand empfangen -> UI neu zeichnen durch Hinzufügen/Entfernen von CSS-Klassen (`.drawn`, `.captured-by-player2` etc.).

---

## 4. Kategorie 3: Hexagonale Spiele (Hex)

Dies ist visuell am anspruchsvollsten, aber mit modernen CSS-Techniken oder SVG gut lösbar.

### Methode A: CSS `clip-path` (Modern und Flexibel)

-   **HTML:** Ein Flexbox-Container, der per JS mit Reihen von Hex-`div`s gefüllt wird.
-   **CSS/Tailwind:**
    -   Jedes Sechseck ist ein `div`, das mit `clip-path: polygon(...)` in Form geschnitten wird.
    -   **Anordnung:** Ein perfektes Hex-Gitter wird durch negative Ränder (`margin-top: calc(...)`) und das Verschieben jeder zweiten Reihe (`margin-left: calc(...)`) erreicht.
    -   **Responsivität:** Die Größe der Sechsecke wird mit relativen Einheiten (`vw`, `%`) in CSS-Variablen (`--hex-width`) definiert. Dadurch skaliert das gesamte Gitter flüssig.

### Methode B: SVG (Skalierbar und Robust) - **Empfohlen**

-   **HTML:** Ein einziges `<svg>`-Element mit einem `viewBox`-Attribut für perfekte Skalierung.
-   **JS-Interaktion:**
    1.  JS generiert das Gitter aus `<polygon>`-Elementen innerhalb des SVG.
    2.  Jedes `<polygon>` erhält `data-row` und `data-col` Attribute, die den Array-Indizes der Rust-Engine entsprechen.
    3.  Klick-Events werden direkt an die `<polygon>`-Formen gebunden.
    4.  Nach Erhalt des neuen Zustands von WASM ändert JS die `fill`-Farbe des entsprechenden `<polygon>`.
-   **Vorteile:** SVG ist für komplexe, nicht-quadratische Formen oft die robustere und einfacher zu handhabende Lösung. Die Interaktion ist präzise und die Skalierung ist verlustfrei.

### JavaScript-Interaktion (für beide Hex-Methoden)

Die UI muss die hexagonale Logik nicht verstehen. Sie sendet bei einem Klick nur die im `data-`Attribut gespeicherten Array-Koordinaten an die WASM-Engine und visualisiert den zurückgegebenen Zustand.
