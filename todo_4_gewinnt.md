# 4 Gewinnt - Entwicklungsplan

## Überblick
Implementierung eines vollständigen 4-Gewinnt-Spiels mit verschiedenen Spielmodi und Schwierigkeitsgraden.

## Phase 1: Grundlegendes Spielbrett und Logik
- [ ] HTML-Struktur für 7x6 Spielbrett erstellen
- [ ] CSS für Spielbrett-Design (Löcher, Steine, Animationen)
- [ ] Grundlegende JavaScript-Klasse für Spiellogik
- [ ] Stein-Drop-Animation implementieren
- [ ] Spielzug-Validierung (Spalte nicht voll)
- [ ] Gewinnprüfung implementieren (horizontal, vertikal, diagonal)
- [ ] Spielende-Erkennung (Gewinn oder Unentschieden)

## Phase 2: Zwei-Spieler Modus (Basis)
- [ ] Spielerwechsel-Logik
- [ ] Visueller Indikator für aktuellen Spieler
- [ ] Spielstein-Farben (Rot/Gelb) korrekt zuweisen
- [ ] Restart-Funktion
- [ ] Spielstand-Anzeige (Gewonnene Spiele)
- [ ] Grundlegende UI-Elemente (Buttons, Status-Anzeige)

## Phase 3: Zwei-Spieler Modus mit Hilfen
- [ ] **Warnung vor offenen Dreiern**: Hervorhebung von Positionen wo der Gegner gewinnen kann
- [ ] **Zwickmühlen-Erkennung**: Anzeige wenn nur noch Zwickmühle zum Sieg führt
- [ ] **Bedrohungsanalyse**: Farbliche Kennzeichnung gefährlicher Züge
- [ ] **Strategische Hinweise**: 
  - Zentrale Spalten bevorzugen
  - Gegnerische Bedrohungen blocken
  - Eigene Gewinnchancen maximieren
- [ ] **Hilfe-Level konfigurierbar**: Ein-/Ausschaltbare Hilfen
- [ ] **Rückgängig-Funktion**: Letzten Zug zurücknehmen

## Phase 4: Ein-Spieler Modus - Bot-Implementierung

### Bot-Schwierigkeitsgrade:
#### Einfach (Zufallsbot)
- [ ] Zufällige, aber gültige Züge
- [ ] Grundlegende Blockierung (verhindert sofortigen Spielerverlust)

#### Mittel (Regelbasierter Bot)
- [ ] Eigene Gewinnzüge erkennen und ausführen
- [ ] Gegnerische Gewinnzüge blockieren
- [ ] Bevorzugung zentraler Spalten
- [ ] Vermeidung von Setup-Zügen für den Gegner

#### Schwer (Minimax-Algorithmus)
- [ ] Minimax-Algorithmus mit Alpha-Beta-Pruning
- [ ] Bewertungsfunktion für Spielpositionen
- [ ] Vorausschau von 4-6 Zügen
- [ ] Optimierte Zugreihenfolge für besseres Pruning

#### Experte (Erweiterte KI)
- [ ] Tiefere Suche (8+ Züge)
- [ ] Verbesserte Bewertungsfunktion
- [ ] Eröffnungsbuch für optimale Startzüge
- [ ] Endspiel-Datenbank für perfektes Spiel

## Phase 5: Erweiterte Features
- [ ] **Spielstatistiken**: Siege, Niederlagen, Unentschieden pro Modus
- [ ] **Replay-System**: Gespielte Partien anschauen
- [ ] **Zeitlimit-Modus**: Bedenkzeit pro Zug
- [ ] **Turnier-Modus**: Best-of-X Serien
- [ ] **Anpassbare Spielfeldgröße**: 6x5, 8x7, etc.
- [ ] **Themes**: Verschiedene visuelle Designs
- [ ] **Sound-Effekte**: Stein-Drop, Gewinn, etc.

## Phase 6: Technische Verbesserungen
- [ ] **Performance-Optimierung**: Effiziente Gewinnprüfung
- [ ] **Mobile Optimierung**: Touch-Bedienung verbessern
- [ ] **Tastatur-Navigation**: Pfeiltasten + Enter
- [ ] **Accessibility**: Screen-Reader Unterstützung
- [ ] **Lokaler Speicher**: Einstellungen und Statistiken speichern
- [ ] **Code-Refactoring**: Modulare Struktur, Clean Code

## Implementierungsreihenfolge
1. **Woche 1**: Phase 1 + 2 (Grundspiel funktionsfähig)
2. **Woche 2**: Phase 3 (Hilfen-System)
3. **Woche 3**: Phase 4 (Bot Einfach + Mittel)
4. **Woche 4**: Phase 4 (Bot Schwer + Experte)
5. **Woche 5**: Phase 5 + 6 (Polish und Extras)

## Technische Architektur
```
connect4/
├── index.html          # Haupt-HTML-Datei
├── css/
│   ├── game.css       # Spielbrett-Styling
│   └── ui.css         # UI-Elemente
├── js/
│   ├── game.js        # Kern-Spiellogik
│   ├── ai.js          # Bot-Implementierungen
│   ├── helpers.js     # Hilfen-System
│   └── ui.js          # User Interface
└── assets/
    ├── sounds/        # Sound-Effekte
    └── images/        # Grafiken/Icons
```

## Testkriterien
- [ ] Alle Gewinnbedingungen korrekt erkannt
- [ ] Keine ungültigen Züge möglich
- [ ] Bot-Schwierigkeitsgrade deutlich unterscheidbar
- [ ] Responsive Design auf allen Geräten
- [ ] Performance: <100ms Reaktionszeit
- [ ] Keine Memory-Leaks bei längeren Spielsessions