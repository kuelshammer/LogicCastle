# Report für Claude: Refactoring & Modernisierung des Gomoku-Backends

**An:** Claude
**Von:** Gemini
**Datum:** 10. Juli 2025
**Betreff:** Strategie zur Angleichung des Gomoku-Backends an den 4-Gewinnt-"Goldstandard"

---

Hallo Claude,

ich habe eine vergleichende Analyse des Rust/WASM-Backends für Gomoku und 4-Gewinnt durchgeführt. Die Analyse zeigt, dass die 4-Gewinnt-Implementierung architektonisch deutlich reifer ist und als "Goldstandard" für unsere Spiel-Engines dienen sollte. Das Gomoku-Backend ist zwar funktional, aber strukturell veraltet und profitiert nicht von den klaren Abstraktionen, die wir in 4-Gewinnt etabliert haben.

Dieses Dokument beschreibt die Abweichungen und schlägt eine klare Strategie vor, um das Gomoku-Backend zu bereinigen, zu modernisieren und auf den gleichen hohen Standard wie 4-Gewinnt zu heben.

## 1. Architektonischer Vergleich: Gomoku vs. 4-Gewinnt

Der Hauptunterschied liegt in der Implementierung des 3-Schicht-Modells (Daten, Geometrie, KI).

| Komponente | 4-Gewinnt (Goldstandard) | Gomoku (Aktueller Stand) |
| :--- | :--- | :--- |
| **Daten-Schicht** | **Exzellent:** Klare Trennung. `Connect4Game` *komponiert* `BitPackedBoard` für Gelb und Rot. Die Spiellogik interagiert mit den Boards über eine saubere API. | **Verbesserungswürdig:** `GomokuGame` komponiert ebenfalls `BitPackedBoard`, aber die Interaktion ist weniger sauber. Es fehlt eine klare Abstraktionsebene. |
| **Geometrie-Schicht** | **Exzellent:** `Connect4Grid` ist eine eigene Struktur, die alle geometrischen Berechnungen (Indizes, Gewinnlinien) kapselt. `Connect4Game` delegiert an diese Schicht. | **Verbesserungswürdig:** `GomokuGrid` existiert, aber seine Rolle ist weniger klar definiert. Geometrische Logik ist teilweise noch in der `GomokuGame`-Struktur selbst verstreut. |
| **KI-Schicht** | **Exzellent:** `Connect4AI` und `PatternEvaluator` sind separate, komponierte Strukturen. Die `Connect4Game`-Struktur enthält eine Instanz der KI und delegiert die Zugberechnung dorthin. | **Verbesserungswürdig:** `GomokuAI` ist ebenfalls eine separate Struktur, aber die Integration in `GomokuGame` ist weniger elegant. Es fehlt die klare Trennung zwischen der Spielzustands-Verwaltung und der KI-Entscheidungsfindung. |
| **API & Frontend-Kompatibilität** | **Sehr gut:** Bietet eine umfangreiche und gut benannte API für das Frontend, inklusive `get_winning_moves`, `get_blocking_moves`, `analyze_position` etc. | **Mangelhaft:** Die API ist minimal. Wichtige Funktionen für die Spielerhilfen (`get_winning_moves`, `get_blocking_moves`) sind zwar vorhanden, aber nicht so robust implementiert. Die `get_ai_move` gibt einen `Vec<usize>` zurück, was weniger typsicher ist als ein `Option<(usize, usize)>`. |
| **Undo-Funktion** | Komplex, da der letzte Zug aus dem Board-Zustand abgeleitet werden muss. | **Besser:** Nutzt eine `move_history`, was die Implementierung des Undo-Vorgangs deutlich vereinfacht und robuster macht. **Dies ist der einzige Bereich, in dem Gomoku dem 4-Gewinnt-Backend überlegen ist.** |

## 2. Kernprobleme im Gomoku-Backend

1.  **Monolithische Struktur:** Die `GomokuGame`-Struktur ist zu überladen. Sie vermischt Zustandsverwaltung, Spiellogik und Interaktionen mit der KI, anstatt klar an die entsprechenden Schichten zu delegieren.
2.  **Fehlende Abstraktion:** Es gibt keine klare Trennung zwischen der reinen Spielmechanik und den Hilfsfunktionen für die KI oder das Frontend. Dies macht den Code schwerer zu testen und zu warten.
3.  **Inkonsistente API:** Die für das Frontend bereitgestellten Funktionen sind nicht so vollständig oder konsistent benannt wie bei 4-Gewinnt.

## 3. Vorgeschlagene Refactoring-Strategie

Wir sollten das Gomoku-Backend schrittweise an die Architektur von 4-Gewinnt angleichen.

### Schritt 1: Stärkung der Schichtentrennung

**Ziel:** `GomokuGame` soll primär ein Zustands-Container sein, der Logik an spezialisierte Komponenten delegiert.

1.  **KI-Schicht entkoppeln:**
    *   Die `GomokuGame`-Struktur sollte, genau wie bei 4-Gewinnt, eine Instanz von `GomokuAI` als Feld enthalten: `ai: GomokuAI`.
    *   Die Methode `get_ai_move` in `GomokuGame` sollte nur noch ein einfacher Aufruf sein: `self.ai.get_best_move(self)`.
    *   Alle komplexen KI-Berechnungen (MCTS, Bedrohungsanalyse etc.) finden ausschließlich innerhalb der `GomokuAI`-Struktur statt.

2.  **Geometrie-Schicht konsolidieren:**
    *   Stelle sicher, dass *alle* geometrischen Berechnungen (Index-Konvertierungen, Nachbarschafts-Checks, Linienerzeugung) in der `GomokuGrid`-Struktur gekapselt sind. Entferne jegliche duplizierte Logik aus `GomokuGame`.

### Schritt 2: API-Angleichung und Erweiterung

**Ziel:** Eine konsistente und funktionsreiche API für das Frontend bereitstellen.

1.  **Frontend-Methoden implementieren:**
    *   Füge die im 4-Gewinnt-Backend bewährten Methoden zur `GomokuGame`-Struktur hinzu:
        *   `analyze_position() -> PositionAnalysis`
        *   `get_threatening_moves(player: Player) -> Vec<(usize, usize)>`
        *   `get_winning_moves(player: Player) -> Vec<(usize, usize)>`
        *   `get_blocking_moves(player: Player) -> Vec<(usize, usize)>`
    *   Diese Methoden sollten die Logik aus der `GomokuAI`-Komponente wiederverwenden, um Code-Duplizierung zu vermeiden.

2.  **Rückgabetypen vereinheitlichen:**
    *   Ändere den Rückgabetyp von `get_ai_move` von `Vec<usize>` zu `Option<(usize, usize)>`, um Klarheit und Typsicherheit zu erhöhen. Ein `None`-Wert signalisiert eindeutig, dass kein Zug gefunden wurde.

### Schritt 3: Übernahme von Best Practices

**Ziel:** Bewährte Muster aus 4-Gewinnt übernehmen.

1.  **Hypothetische Zustände:** Implementiere eine `create_hypothetical_state`-Methode, die es der KI erlaubt, Spielzustände zu evaluieren, ohne den Haupt-Spielzustand zu verändern. Dies ist für fortgeschrittene Algorithmen unerlässlich.
2.  **Test-Suite ausbauen:** Erweitere die Unit-Tests für Gomoku (`#[cfg(test)]`), um die neuen API-Methoden und die verbesserte Architektur abzudecken. Orientiere dich an der umfassenden Test-Suite von 4-Gewinnt.

## 4. Fazit und nächste Schritte

Das Gomoku-Backend ist funktional, aber nicht zukunftsfähig. Ein Refactoring nach dem Vorbild von 4-Gewinnt wird die Wartbarkeit, Testbarkeit und Erweiterbarkeit drastisch verbessern. Es schafft die notwendige Grundlage, um die fortgeschrittenen MCTS-Optimierungen, die wir bereits diskutiert haben, sauber zu implementieren.

Ich empfehle, dieses Refactoring als Nächstes anzugehen, bevor wir neue KI-Features für Gomoku entwickeln. Eine saubere Architektur wird die Implementierung komplexer Algorithmen erheblich beschleunigen und vereinfachen.