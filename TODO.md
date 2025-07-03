# Plan: Flexibles Modul-Layout für UI-Komponenten

## Phase 1: Analyse & Design (Schritte 1-2)

**Schritt 1: Code-Analyse**
- Untersuche alle `ui.js`-Dateien in `/games/*/js/` 
- Identifiziere gemeinsame UI-Patterns (Board-Erstellung, Status-Anzeige, Buttons)
- Dokumentiere Unterschiede und spezifische Anforderungen pro Spiel
- Erstelle eine Übersicht der duplizierten Code-Segmente

**Schritt 2: Architektur-Design**
- Definiere modulare Schnittstellen für wiederverwendbare UI-Komponenten
- Entwerfe Konfigurationssystem für spielspezifische Anpassungen
- Plane Ordnerstruktur in `/assets/js/ui-modules/`
- Definiere Naming-Conventions und API-Standards

## Phase 2: Core Implementation (Schritt 3)

**Schritt 3: UI-Module entwickeln**
- Erstelle `/assets/js/ui-modules/` Verzeichnis
- Implementiere Basis-Module:
  - `board-factory.js` - Universelle Board-Erstellung
  - `status-panel.js` - Spielstatus und Nachrichten  
  - `game-controls.js` - Buttons und Eingabe-Elemente
  - `modal-manager.js` - Modale Dialoge
- Jedes Modul mit konfigurierbaren Optionen und Event-Handling

## Phase 3: Pilot-Migration (Schritte 4-5)

**Schritt 4: Gomoku als Pilot**
- Refaktoriere `/games/gomoku/js/ui.js` 
- Ersetze duplizierte Code-Blöcke durch UI-Modul-Aufrufe
- Behalte identische Funktionalität bei

**Schritt 5: Pilot-Validierung**
- Teste alle Gomoku-Features ausführlich
- Prüfe Responsivität und Event-Handling
- Benchmark Performance vor/nach Migration
- Dokumentiere Lessons Learned

## Phase 4: Vollständige Migration (Schritte 6-7)

**Schritt 6: Weitere Spiele migrieren**
- Trio, Hex, L-Game auf neues System umstellen
- Nutze Gomoku-Erfahrungen für optimierte Implementierung
- Spiel-für-Spiel Testing

**Schritt 7: Connect4 spezial**
- Berücksichtige fehlende BitPackedBoard-Integration
- Eventuell temporäre Adapter-Schicht für Legacy-Code

## Phase 5: Finalisierung (Schritt 8)

**Schritt 8: Cleanup & Dokumentation**
- Entferne redundanten Code aus spielspezifischen `ui.js`-Dateien
- Erstelle Entwickler-Dokumentation für UI-Module
- Code-Review und Optimierungen

## Überprüfbare Meilensteine:
- ✅ Duplikations-Analyse dokumentiert
- ✅ UI-Module funktionsfähig  
- ✅ Gomoku-Pilot vollständig funktional
- ✅ Alle Spiele migriert ohne Funktionalitätsverlust
- ✅ Codebase deutlich reduziert und wartbarer