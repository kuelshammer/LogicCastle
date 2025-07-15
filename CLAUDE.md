# Project Websites

- **Webseite:** https://www.github.com/kuelshammer/LogicCastle/

# GOMOKU MODERNISIERUNG PLAN (GEMINI REPORTS 20250710)

## Problem: Gomoku-System nicht auf Connect4 Goldstandard-Niveau

### Gemini Report Analyse:
- **Backend**: Monolithische GomokuGame-Struktur, schwache Schichtentrennung
- **Frontend**: Zellen-basiert statt authentische Intersektions-Platzierung
- **API**: Inkonsistent, weniger robust als Connect4
- **Architektur**: Veraltete Struktur vs. Connect4's 3-Schicht-Exzellenz

### PHASE 1: Backend-Refactoring (KRITISCH)
1. **3-Schicht Architektur**: Trennung Daten/Geometrie/KI nach Connect4 Goldstandard
2. **AI-Layer Entkopplung**: `GomokuAI` aus `GomokuGame` separieren
3. **Geometrie-Konsolidierung**: Alle geometrischen Berechnungen in `GomokuGrid`

### PHASE 2: Frontend-Modernisierung (KRITISCH)
1. **Intersektions-System**: 2-Schichten-Methode (Visual + Interaction)
2. **Visuelle Schicht**: CSS-Hintergrundbild für 15×15 Grid
3. **Interaktions-Schicht**: Klickbare Kreuzungspunkte
4. **Stein-Platzierung**: Stone-Container System

### PHASE 3: API-Erweiterung (STANDARD)
1. **API-Enhancement**: Frontend-Methoden nach Connect4 Standard
2. **Rückgabetyp-Fix**: `get_ai_move` von `Vec<usize>` zu `Option<(usize, usize)>`
3. **Hypothetische Zustände**: `create_hypothetical_state` für KI

### Technische Details:
- **Backend**: `GomokuGame` als Zustands-Container, `self.ai.get_best_move(self)` Pattern
- **Frontend**: Visual Background + Interaction Grid, CSS-Performance-Optimierung
- **API**: `analyze_position()`, `get_winning_moves()`, `get_blocking_moves()`

### Referenz: Connect4 als Goldstandard-Implementierung nutzen