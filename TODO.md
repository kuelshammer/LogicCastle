# Optimierungsplan für das Connect4-Projekt

**Ziel:** Die Codebasis durch Beseitigung von Altlasten und Verbesserung der Dokumentation zu optimieren, ohne die bestehende Funktionalität, die Testabdeckung und die modulare Architektur zu beeinträchtigen.

---

### Schritt 1: Bereinigung von Backup-Dateien (Aufräumen)

*   **Aktion:**
    1.  Identifiziere alle `.bak`-Dateien im Projektverzeichnis, insbesondere in `games/connect4/js/`.
    2.  Bestätige kurz über `git status`, dass diese Dateien nicht getrackt werden.
    3.  Lösche alle `.bak`-Dateien.
*   **Begründung:** Dies ist ein einfacher und risikoarmer erster Schritt. Er reduziert sofort die Unordnung im Projekt, beseitigt potenzielle Verwirrung und stellt sicher, dass nur der Code aus der Versionskontrolle verwendet wird. Die positiven Aspekte werden hierdurch nicht berührt.

### Schritt 2: Refactoring der veralteten AI-Klasse (Technische Schulden abbauen)

*   **Aktion:** Das Ziel ist es, die alte `_Connect4AI`-Klasse in `ai.js` sicher zu entfernen und vollständig auf das neue, modulare System (`ai-modular.js` und die `ai-strategies`) zu setzen.
    1.  **Analyse:** Untersuche den Code (vor allem `index.html` und `ui.js`), um sicherzustellen, an welcher Stelle die AI initialisiert wird. Finde heraus, ob die alte `_Connect4AI` überhaupt noch verwendet wird oder ob bereits das neue System (`ai-modular.js`) im Einsatz ist.
    2.  **Umstellung (falls nötig):** Falls die alte Klasse noch verwendet wird, ersetze die Initialisierung (z.B. `new _Connect4AI(...)`) durch die des neuen, modularen Systems.
    3.  **Verifizierung durch Tests:** Führe die komplette Test-Suite (`tests/connect4-tests.js`) aus, um sicherzustellen, dass nach der Umstellung die gesamte Kernlogik noch wie erwartet funktioniert. Teste zusätzlich manuell die verschiedenen Bot-Schwierigkeitsgrade im Browser.
    4.  **Sicheres Entfernen:** Nachdem alle Tests erfolgreich waren und die manuelle Prüfung bestanden wurde, kann die Datei `games/connect4/js/ai.js` (oder zumindest die `_Connect4AI` Klasse darin) sicher gelöscht werden.
*   **Begründung:** Dieser Schritt eliminiert redundanten Code, reduziert die Komplexität und beugt zukünftigen Fehlern vor. Er stärkt die bereits gute modulare Struktur, indem er sie konsequent durchsetzt.

### Schritt 3: Dokumentation komplexer AI-Algorithmen (Wartbarkeit erhöhen)

*   **Aktion:**
    1.  Gehe die anspruchsvollsten Teile der AI-Logik im modularen System durch (z.B. `monte-carlo-bot.js`, `enhanced-smart-bot.js`).
    2.  Füge gezielt Kommentare hinzu, die das *Warum* und die übergeordnete Strategie erklären, nicht nur das *Was*. Beispiele:
        *   Eine kurze Erklärung der Heuristiken in den Bewertungsfunktionen (z.B. "Warum wird die Kontrolle der Mitte höher bewertet?").
        *   Eine einfache Beschreibung der Abbruchbedingungen bei der Minimax-Suche (Alpha-Beta-Pruning).
        *   Der Grundgedanke hinter der Monte-Carlo-Simulation.
*   **Begründung:** Gute Kommentare an den richtigen Stellen machen den Code für zukünftige Entwickler (oder das zukünftige Ich) wesentlich verständlicher. Dies erhöht die Wartbarkeit und erleichtert Erweiterungen der AI, ohne die bestehende Logik zu gefährden.