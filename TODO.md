# 📋 TODO - LogicCastle Projekt

## 🚀 GOMOKU MODERNISIERUNG PLAN (TOP PRIORITÄT)

### **Phase 1: Backend-Refactoring (KRITISCH)**
- [ ] **🔴 HIGH: 3-Schicht Architektur** - Trennung Daten/Geometrie/KI nach Connect4 Goldstandard
- [ ] **🔴 HIGH: AI-Layer Entkopplung** - `GomokuAI` aus `GomokuGame` separieren
- [ ] **🔴 HIGH: Geometrie-Konsolidierung** - Alle geometrischen Berechnungen in `GomokuGrid`

### **Phase 2: Frontend-Modernisierung (KRITISCH)**
- [ ] **🔴 HIGH: Intersektions-System** - 2-Schichten-Methode (Visual + Interaction)
- [ ] **🟡 MEDIUM: Visuelle Schicht** - CSS-Hintergrundbild für 15×15 Grid
- [ ] **🟡 MEDIUM: Interaktions-Schicht** - Klickbare Kreuzungspunkte
- [ ] **🟡 MEDIUM: Stein-Platzierung** - Stone-Container System

### **Phase 3: API-Erweiterung (STANDARD)**
- [ ] **🟡 MEDIUM: API-Enhancement** - Frontend-Methoden nach Connect4 Standard
- [ ] **🟢 LOW: Rückgabetyp-Fix** - `get_ai_move` von `Vec<usize>` zu `Option<(usize, usize)>`
- [ ] **🟢 LOW: Hypothetische Zustände** - `create_hypothetical_state` für KI

## 🎯 TECHNISCHE DETAILS

### **Backend-Refactoring:**
- **Schichtentrennung:** `GomokuGame` als Zustands-Container
- **KI-Integration:** `self.ai.get_best_move(self)` Pattern
- **API-Angleichung:** `analyze_position()`, `get_winning_moves()`, `get_blocking_moves()`

### **Frontend-Modernisierung:**
- **2-Schichten-Methode:** Visual Background + Interaction Grid
- **CSS-Performance:** Gitter als `background-image` statt DOM-Elemente
- **Präzise Platzierung:** Grid-System für perfekte Zentrierung

## ✅ ABGESCHLOSSEN

### **TRIO BITPACKED 3-LAYER GOLDSTANDARD**
- [x] **TRIO WASM ENGINE:** trio.rs mit BitPackedBoard<7,7,4> erstellen
- [x] **TRIO RUST:** Board-Generierung mit Zahlen 1-9 implementieren
- [x] **TRIO RUST:** Trio-Validierung (a×b+c, a×b-c) implementieren
- [x] **TRIO RUST:** Lösungssuche-Algorithmus (keine AI!) implementieren
- [x] **TRIO JS:** TrioGameBitPacked.js Wrapper erstellen
- [x] **TRIO UI:** Moderne TrioUI mit UI Module System
- [x] **TRIO INTEGRATION:** WASM Build und Export testen

### **CONNECT4 BACKEND OPTIMIZATION**
- [x] **27 Gemini AI Test Cases** - Erweiterte Test-Suite mit 100% Pass Rate
- [x] **BitPackedBoard XOR Operations** - Move-Extraktion für AI-Tests
- [x] **Connect4 Sidebar Layout** - Schmale Seitenleiste neben Spielfeld
- [x] **Responsive Design** - Sidebar rutscht bei <1024px unter Board
- [x] **Backend Three-Layer Architecture** - Saubere Trennung von Data/Geometry/AI
- [x] **JavaScript AI Elimination** - Vollständige Migration zu WASM AI
- [x] **Frontend CSS Consolidation** - ui-module-enhancements.css in ui.css integriert
- [x] **make_move_copy bug fix** in connect4_ai.rs
- [x] **Remove unsafe transmute** in quadratic_grid.rs
- [x] **AI performance optimization** with caching

## 🔧 WARTUNG & VERBESSERUNGEN

### **L-GAME**
- [ ] Color-System Optimierung
- [ ] Interaction Handler Verbesserungen

### **CONNECT4**
- [ ] Object pooling for board states
- [ ] Comprehensive error handling across WASM boundary
- [ ] Performance benchmarking

### **ALLGEMEIN**
- [ ] Test-Coverage erhöhen
- [ ] Dokumentation vervollständigen
- [ ] Performance-Monitoring

---

**Fokus:** Connect4 als Referenz-Implementierung nutzen für konsistente Architektur  
**Nächstes Ziel:** Gomoku Backend-Refactoring nach Connect4 Goldstandard  
**Referenz:** Gemini Reports 20250710-104500 & 20250710-105000