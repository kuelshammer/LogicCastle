
# Implementierungsanleitung für Hex

**An:** Coding LLM
**Von:** Gemini
**Datum:** 2025-07-02
**Betreff:** Anleitung zur Implementierung des Spiels Hex unter Verwendung der neuen, vereinheitlichten Rust-Engine.

## 1. Spielregeln (Zusammenfassung)

Hex ist ein abstraktes Strategiespiel für zwei Spieler auf einem rhombischen Gitter aus Sechsecken (typischerweise 11x11).

-   **Spielziel:**
    -   **Spieler 1 (z.B. Rot):** Muss eine ununterbrochene Kette seiner Steine von der linken zur rechten Seite des Bretts bilden.
    -   **Spieler 2 (z.B. Blau):** Muss eine ununterbrochene Kette seiner Steine von der oberen zur unteren Seite des Bretts bilden.
-   **Spielablauf:** Spieler setzen abwechselnd einen Stein ihrer Farbe auf ein beliebiges freies Feld.
-   **Besonderheiten:**
    -   Ein Unentschieden ist unmöglich.
    -   Um den Vorteil des ersten Spielers auszugleichen, wird die **Tauschregel (Pie Rule)** verwendet: Der zweite Spieler kann nach dem ersten Zug des Gegners die Seiten tauschen, anstatt einen eigenen Stein zu setzen.

## 2. Umsetzungsanleitung für die Rust-Engine

Die Herausforderung bei Hex ist die Abbildung der hexagonalen Nachbarschaftsbeziehungen. Dies wird in der Spiellogik gelöst, nicht in der Datenstruktur.

### Schritt 1: Datenmodellierung und Logik-Helfer in Rust

-   **Das Spielbrett:**
    -   Wir verwenden die generische `BitPackedBoard<N, N, 2>` (z.B. `BitPackedBoard<11, 11, 2>`). Die 2 Bits pro Zelle speichern den Zustand: 0=Leer, 1=Spieler Rot, 2=Spieler Blau.

-   **Hex-Logik-Helfer (entscheidend):**
    -   Obwohl das Brett als 2D-Array gespeichert wird, muss die Logik hexagonal arbeiten. Dazu wird eine private Hilfsfunktion benötigt, die für eine gegebene Array-Koordinate die 6 hexagonalen Nachbarn findet.
    -   **Beispiel-Signatur:** `fn get_hex_neighbors(row: u8, col: u8, board_size: u8) -> Vec<(u8, u8)>`.
    -   Diese Funktion ist der Kern der Hex-Logik und kapselt die Komplexität der Gitterumrechnung.

### Schritt 2: Spiellogik im `GameLogic`-Trait implementieren

-   **`get_legal_moves(&self) -> Vec<Move>`:**
    -   Einfach: Jeder leere Platz (Wert `0`) im `BitPackedBoard` ist ein legaler Zug.

-   **`make_move(&mut self, player_move: Move)`:**
    -   Einfach: Setzt die Zelle an der Koordinate des Zugs auf die ID des Spielers. Die Hauptarbeit erfolgt in der Gewinnprüfung.
    -   Implementiert die **Tauschregel**: Wenn es der allererste Zug des zweiten Spielers ist, muss er die Option haben, den Zug des Gegners zu übernehmen, anstatt einen neuen Stein zu setzen.

-   **`check_win(&self, player_id: u8) -> bool`:**
    -   Dies ist die komplexeste Funktion. Sie muss nach jedem Zug prüfen, ob der aktive Spieler eine Gewinnverbindung hergestellt hat.
    -   **Empfohlener Algorithmus: Breitensuche (BFS) oder Tiefensuche (DFS):**
        1.  Definiere die Start- und Zielkanten für den Spieler (z.B. für Rot: alle Felder in Spalte 0 sind Start, alle Felder in Spalte 10 sind Ziel).
        2.  Starte eine Suche von allen Steinen des Spielers an seiner Startkante.
        3.  Benutze die `get_hex_neighbors`-Funktion, um verbundene Steine derselben Farbe zu finden.
        4.  Verwende einen `visited`-Set, um Zyklen zu vermeiden.
        5.  Wenn während der Suche ein Stein an der Zielkante erreicht wird, hat der Spieler gewonnen.
    -   **Alternative für hohe Performance: Union-Find (Disjoint Set Union):**
        -   Behandle jede Seite des Bretts (Oben, Unten, Links, Rechts) als einen virtuellen Knoten.
        -   Wenn ein Stein gesetzt wird, wird er mit allen benachbarten Steinen seiner Farbe und den entsprechenden Seiten-Knoten "vereinigt".
        -   Ein Spieler gewinnt, wenn seine beiden Seiten-Knoten im selben Set landen.

### Schritt 3: JavaScript- und UI-Anpassungen

-   **`games/hex/game.js` (neu erstellen):**
    -   Ein schlanker Wrapper, der die WASM-Funktionen aufruft. Er muss die Logik für die Tauschregel im UI abbilden (dem zweiten Spieler die Tausch-Option anbieten).

-   **`games/hex/ui.js` (neu erstellen):**
    -   **Darstellung des Hex-Gitters:** Dies ist die primäre UI-Aufgabe.
        -   **Empfohlene Methode:** Verwende `<div>`-Elemente für die Sechsecke und style sie mit `clip-path: polygon(...)`. Diese werden dann in einem CSS-Grid oder per Flexbox zu einem rhombischen Gitter angeordnet.
        -   **Alternative:** Zeichne das gesamte Brett als SVG. Dies bietet einfache Klick-Events und perfekte Skalierbarkeit.
    -   **Interaktion:**
        -   Ein Klick auf ein leeres Sechseck sendet dessen Array-Koordinate `(row, col)` an die WASM-Engine.
        -   Die UI muss die hexagonale Logik nicht selbst kennen.
    -   **Feedback:**
        -   Die UI färbt das geklickte Sechseck in der Spielerfarbe ein.
        -   Die Ränder des Bretts werden in den entsprechenden Farben (Rot/Blau) hervorgehoben, um das Spielziel zu verdeutlichen.

### Fazit zur Implementierung

Hex ist ein perfektes Beispiel für die Stärke der vorgeschlagenen Architektur. Die Engine abstrahiert die komplexe Spiellogik (hexagonale Nachbarschaft, Pfadfindung zur Gewinnprüfung) und stellt eine einfache, gitterbasierte API bereit. Die UI kann sich voll und ganz auf die anspruchsvolle visuelle Darstellung des hexagonalen Bretts konzentrieren, ohne die Spielregeln selbst implementieren zu müssen. Dies führt zu einer sauberen Trennung von Logik und Darstellung und nutzt die Performance von Rust für die rechenintensiven Teile des Spiels.
