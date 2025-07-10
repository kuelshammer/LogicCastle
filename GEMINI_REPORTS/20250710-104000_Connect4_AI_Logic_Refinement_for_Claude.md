# Mini-Report für Claude: Verfeinerung der 4-Gewinnt-KI

**An:** Claude
**Von:** Gemini
**Datum:** 10. Juli 2025
**Betreff:** Dringende Anpassung der 4-Gewinnt-KI: Implementierung einer hierarchischen 4-Stufen-Entscheidungslogik

---

Hallo Claude,

bei Tests der 4-Gewinnt-KI auf der Weboberfläche wurde ein kritisches Verhaltensmuster bei der "schweren" KI festgestellt, das wir umgehend beheben müssen.

### Problembeschreibung

Die aktuelle KI scheint sich zu früh oder ausschließlich auf die MCTS-Analyse zu verlassen und ignoriert dabei deterministische, sofort entscheidende Spielzüge. In einem Testspiel hat die KI eine eigene, offene Gewinnchance nicht genutzt, weil sie gezwungen war, eine Bedrohung des menschlichen Spielers zu blockieren. Nach dem Blocken hat sie nicht erneut geprüft, ob sie nun selbst gewinnen kann, und hat dadurch das Spiel verloren.

Dieses Verhalten deutet darauf hin, dass eine grundlegende, hierarchische Überprüfung von Gewinn- und Verlustzügen fehlt, bevor die komplexe MCTS-Suche gestartet wird.

### Vorgeschlagene Lösung: Das 4-Stufen-Modell

Um die Zuverlässigkeit und Spielstärke der KI sicherzustellen, muss die `get_ai_move`-Funktion eine strikte, mehrstufige Logik befolgen, bevor sie auf MCTS zurückgreift. Die Reihenfolge ist hierbei entscheidend:

1.  **Stufe 1: Eigener Siegzug?**
    *   **Prüfung:** Gibt es einen Zug, mit dem ich (die KI) das Spiel *sofort* gewinne?
    *   **Aktion:** Wenn ja, diesen Zug ausführen. Die weitere Analyse (MCTS) ist nicht notwendig.
    *   **Backend-Funktion:** `get_winning_moves(self)`

2.  **Stufe 2: Gegnerischen Sieg blockieren?**
    *   **Prüfung:** Gibt es einen Zug, den der Gegner machen könnte, um *im nächsten Zug* zu gewinnen?
    *   **Aktion:** Wenn ja, diesen Zug blockieren. Die weitere Analyse ist nicht notwendig.
    *   **Backend-Funktion:** `get_blocking_moves(self)`

3.  **Stufe 3: Verlustzüge vermeiden (Pruning)**
    *   **Prüfung:** Identifiziere alle Züge, die dem Gegner in der darauffolgenden Runde eine direkte Gewinnmöglichkeit eröffnen (z.B. eine offene Dreier-Reihe für den Gegner schaffen, die dieser dann zur Vier vollendet).
    *   **Aktion:** Schließe diese Züge aus der weiteren MCTS-Analyse aus. Dies reduziert den Suchraum und verhindert katastrophale Fehler.

4.  **Stufe 4: MCTS für den besten strategischen Zug**
    *   **Prüfung:** Nur wenn die Stufen 1 und 2 keine Aktion erzwungen haben, wird die MCTS-Suche gestartet.
    *   **Aktion:** Führe die MCTS-Analyse auf den verbleibenden, nicht in Stufe 3 ausgeschlossenen Zügen durch und wähle den Zug mit der höchsten Gewinnwahrscheinlichkeit.

### Nächste Schritte

Die unmittelbare Priorität ist die Implementierung dieses 4-Stufen-Modells in der Rust/WASM-Logik. Die notwendigen Backend-Funktionen (`get_winning_moves`, `get_blocking_moves`) sind bereits vorhanden. Es geht primär darum, ihre Aufrufe in der korrekten, hierarchischen Reihenfolge innerhalb der Haupt-KI-Funktion sicherzustellen.

Die ebenfalls beobachtete "langweilige", weil deterministische Spielweise der KI, werden wir nach der Behebung dieses fundamentalen Fehlers angehen. Eine mögliche Lösung wäre, in der MCTS-Auswahl (Stufe 4) eine geringe Zufallskomponente einzubauen, wenn mehrere Züge eine sehr ähnliche Bewertung haben. Dies ist jedoch nachrangig.

Bitte berücksichtige diesen Report für die nächsten Entwicklungszyklen der KI.
