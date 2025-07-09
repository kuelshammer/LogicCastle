# Technischer Report für Claude: Refactoring der Rust-Core-Architektur

**An:** Claude
**Von:** Gemini
**Datum:** 06. Juli 2025
**Betreff:** Vorschlag für eine mehrschichtige Rust-Architektur zur Abstraktion der Board-Logik

---

### 1. Zusammenfassung und Kernaussage

Dieser Report beschreibt eine strategische Weiterentwicklung unserer Rust-basierten Game-Engine. Aufbauend auf der korrekten Beobachtung, dass ein `BitPackedBoard` allein nicht ausreicht, um die verschiedenen Brett-Topologien (quadratisch, hexagonal etc.) abzubilden, wird hier eine **mehrschichtige Architektur** vorgeschlagen.

Das Ziel ist die Schaffung einer sauberen, erweiterbaren und wartbaren Codebasis durch die strikte Trennung von drei Kernverantwortlichkeiten:
1.  **Datenhaltung** (Rohe Speicherung von Spielsteinen)
2.  **Board-Geometrie** (Koordinaten-Logik und Nachbarschaftsbeziehungen)
3.  **Spielregeln** (Die eigentliche Spiellogik)

Dieses Refactoring ist eine reine Backend-Maßnahme innerhalb des Rust/WASM-Moduls und hat **keine direkten Auswirkungen auf die UI-Schicht** (HTML/CSS/JS). Es ist eine Investition in die technische Exzellenz und zukünftige Entwicklungsgeschwindigkeit.

---

### 2. Motivation: Die Grenzen des aktuellen Ansatzes

Die Einführung des `BitPackedBoard` war ein wichtiger erster Schritt zur Optimierung der Speicher- und Performance-Effizienz. Es ist jedoch eine "dumme" Datenstruktur. Es weiß nichts über die Form oder die Regeln des Spielfelds, das es repräsentiert.

Wir stehen vor zwei zentralen Herausforderungen, die eine weitere Abstraktionsebene erfordern:

1.  **Unterschiedliche Feld-Geometrien:**
    *   **Quadratische Gitter:** (z.B. 4-Gewinnt, Gomoku) haben einfache Nachbarschaftsregeln (horizontal, vertikal, diagonal).
    *   **Hexagonale Gitter:** (z.B. Hex) haben komplexere Nachbarschaftsregeln, die eine spezielle Koordinatenlogik (z.B. Axial-Koordinaten) erfordern.

2.  **Unterschiedliche Spiel-Fokusse:**
    *   **Spiele auf Feldern ("Inside"):** Spielsteine werden *in* die Felder gesetzt (z.B. Hex).
    *   **Spiele auf Kanten/Schnittpunkten ("Outside"):** Spielsteine werden *auf die Linien* zwischen den Feldern gesetzt (z.B. Shannon Switching Game, Go).

Zusätzlich benötigen Pfadfindungsspiele wie **Hex** oder das **Shannon Switching Game** für jeden Spieler ein eigenes `BitPackedBoard`, um die verbundenen Komponenten effizient zu verfolgen. Eine übergeordnete Logik muss diese verwalten.

---

### 3. Vorgeschlagene Architektur: Ein Drei-Schichten-Modell

Ich schlage vor, die Logik mithilfe von Rusts Traits und Komposition in drei klar getrennte Schichten aufzuteilen.

#### Schicht 1: Daten-Ebene (`BitPackedBoard`)

*   **Verantwortlichkeit:** Hocheffiziente, zustandslose Speicherung von binären Informationen (z.B. "Stein gesetzt" / "nicht gesetzt").
*   **API:** `set(index: usize)`, `get(index: usize)`, `clear(index: usize)`.
*   **Implementierung:** Ein `Vec<u64>`. Diese Schicht bleibt im Wesentlichen wie besprochen.

#### Schicht 2: Geometrie-Abstraktion (`BoardGeometry` Trait)

Dies ist das Herzstück des Vorschlags. Wir definieren einen Trait, der die gesamte Topologie- und Koordinatenlogik kapselt.

```rust
// Definiert die "Form" und die Navigationsregeln eines Spielbretts
pub trait BoardGeometry {
    // Wandelt eine spielspezifische 2D-Koordinate in einen 1D-Index um
    fn to_index(&self, coord: (i32, i32)) -> Option<usize>;

    // Wandelt einen 1D-Index zurück in eine 2D-Koordinate
    fn from_index(&self, index: usize) -> Option<(i32, i32)>;

    // Gibt die direkten Nachbarn einer Koordinate zurück
    fn get_neighbors(&self, coord: (i32, i32)) -> Vec<(i32, i32)>;

    // Prüft, ob eine Koordinate auf dem Brett gültig ist
    fn is_valid(&self, coord: (i32, i32)) -> bool;

    // Gibt die Gesamtgröße für das BitPackedBoard zurück
    fn board_size(&self) -> usize;
}
```

**Konkrete Implementierungen dieses Traits:**

*   `pub struct QuadraticGrid { width: usize, height: usize }`
*   `pub struct HexGrid { radius: i32 }`
*   **Zukünftig:** `pub struct TriangularGrid { ... }` oder sogar `pub struct CubicGrid { ... }` für 3D-Spiele.

Diese Structs enthalten die gesamte komplexe Mathematik der Koordinatenumrechnung und Nachbarschaftsfindung und können isoliert getestet werden.

#### Schicht 3: Spiel-Logik-Ebene (Game Structs)

Ein Struct, das ein spezifisches Spiel repräsentiert, **komponiert** nun die Geometrie- und Daten-Schichten, anstatt alles selbst zu implementieren.

**Beispiel: `HexGame`**

```rust
pub struct HexGame {
    // Komposition: Hält eine Instanz der Geometrie-Logik
    geometry: HexGrid,

    // Komposition: Hält die Daten-Container
    player1_board: BitPackedBoard,
    player2_board: BitPackedBoard,

    // Spielspezifischer Zustand
    current_player: Player,
    winner: Option<Player>,
}

impl HexGame {
    pub fn new(radius: i32) -> Self {
        let geometry = HexGrid::new(radius);
        let board_size = geometry.board_size();
        Self {
            geometry,
            player1_board: BitPackedBoard::new(board_size),
            player2_board: BitPackedBoard::new(board_size),
            // ...
        }
    }

    pub fn make_move(&mut self, coord: (i32, i32)) -> Result<(), &'static str> {
        // 1. Geometrie-Schicht nutzen, um den Index zu erhalten
        let index = self.geometry.to_index(coord).ok_or("Invalid coordinate")?;

        // 2. Daten-Schicht nutzen, um den Spielstein zu setzen
        let player_board = self.get_current_player_board_mut();
        if player_board.get(index) {
            return Err("Cell is already occupied");
        }
        player_board.set(index, true);

        // 3. Spiel-Logik anwenden (Gewinner prüfen, Spieler wechseln)
        self.check_win_condition();
        self.switch_player();
        Ok(())
    }
    // ...
}
```

---

### 4. Strategie für das Refactoring: Wie und Wann?

#### Unabhängigkeit von der UI

Dieses Refactoring ist, wie eingangs erwähnt, **vollständig von der UI entkoppelt**. Die `#[wasm_bindgen]`-Schnittstelle bleibt unberührt. Die UI sendet weiterhin Koordinaten und erhält einen serialisierten Spielzustand. Die gesamte Komplexität der neuen Architektur ist hinter dieser Fassade verborgen. Dies reduziert das Risiko erheblich.

#### Wann ist der beste Zeitpunkt?

**So bald wie möglich.** Der ideale Zeitpunkt ist, **bevor** weitere komplexe Spiele (wie das Shannon Switching Game oder Go) implementiert werden. Die Architektur jetzt zu etablieren, verhindert, dass wir später mehrere Spiele aufwendig umschreiben müssen. Es ist eine proaktive Investition zur Vermeidung technischer Schulden.

#### Wie sollte das Refactoring ablaufen? (Schritt-für-Schritt-Plan)

1.  **Schritt 1: Basis-Komponenten implementieren und testen.**
    *   Finalisieren und testen Sie die `BitPackedBoard`-Struktur.
    *   Definieren Sie den `BoardGeometry`-Trait.

2.  **Schritt 2: Geometrie-Implementierungen erstellen.**
    *   Implementieren Sie `QuadraticGrid` und `HexGrid`.
    *   Schreiben Sie umfassende Unit-Tests für beide, insbesondere für die `to_index`- und `get_neighbors`-Methoden.

3.  **Schritt 3: Ein Pilot-Spiel refaktorisieren.**
    *   Wählen Sie ein Spiel als Proof-of-Concept (z.B. **Hex**, da es komplex ist und beide Boards benötigt).
    *   Schreiben Sie das `HexGame`-Struct neu, sodass es die neue Architektur verwendet.
    *   Passen Sie die `#[wasm_bindgen]`-Funktionen für Hex an, um die neue Logik zu verwenden. Stellen Sie sicher, dass alle bestehenden Tests weiterhin erfolgreich sind.

4.  **Schritt 4: Rollout auf weitere Spiele.**
    *   Refaktorisieren Sie die anderen Spiele (4-Gewinnt, Gomoku) nach dem etablierten Muster. Da diese `QuadraticGrid` verwenden, sollte dies relativ schnell gehen.

5.  **Schritt 5: Code-Bereinigung.**
    *   Entfernen Sie die alte, monolithische Board-Logik aus den Spiel-Structs, sobald alle Spiele migriert sind.

---

### 5. Fazit

Die vorgeschlagene Drei-Schichten-Architektur ist eine logische und notwendige Weiterentwicklung für die LogicCastle-Engine. Sie löst nicht nur die aktuellen Herausforderungen, sondern schafft auch ein robustes, flexibles und testbares Fundament für zukünftige Erweiterungen.

**Vorteile im Überblick:**
*   **Trennung der Verantwortlichkeiten:** Jede Komponente hat eine klare Aufgabe.
*   **Wiederverwendbarkeit:** `QuadraticGrid` kann für Dutzende von Spielen verwendet werden.
*   **Erweiterbarkeit:** Neue Geometrien (`TriangularGrid`) können einfach durch Implementierung eines Traits hinzugefügt werden, ohne bestehenden Code zu gefährden.
*   **Testbarkeit:** Jede Schicht kann isoliert und gründlich getestet werden.

Ich empfehle dringend, dieses Refactoring als priorisierte technische Aufgabe einzuplanen.

Beste Grüße,
Gemini
