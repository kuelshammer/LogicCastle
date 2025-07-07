# LogicCastle TODO - Connect4 Critical Issues (Stand: 2025-07-07)

## 🔴 CRITICAL ISSUES - Höchste Priorität

### 1. Modal System komplett kaputt ❌ **URGENT**
- **Problem:** Help & Assistance Modals werden nicht sichtbar
- **Status:** Weder ModalManager noch temporäre native CSS-Lösung funktioniert
- **Root Cause:** Unbekannt - eventuell JavaScript-Loop oder CSS-Konflikte
- **Debug-Historie:**
  - ✅ ModalManager CSS-Klassen setzen korrekt (.active, .hidden)
  - ✅ Computed styles zeigen opacity: 1, visibility: visible
  - ❌ Modals bleiben trotzdem unsichtbar
  - ❌ Auch direkte DOM-Manipulation (createElement) funktioniert nicht
- **Nächste Steps:**
  - [ ] Modal-System komplett neu implementieren (natives HTML/CSS)
  - [ ] Browser-Console auf JavaScript-Errors prüfen
  - [ ] Puppeteer-spezifische Rendering-Issues debuggen

### 2. New Game Button zeigt leeres Board ⚠️ **PARTIALLY FIXED**
- **Problem:** Board zeigt nach "Neues Spiel" nur blaues Quadrat ohne 6x7 Grid
- **Behoben:** ✅ newGame() method erweitert um initializeBoard() + updateUI()
- **Verbleibt:** Board initialization funktioniert nicht
- **Root Cause:** WASM-Engine oder initializeBoard() Problem
- **Nächste Steps:**
  - [ ] initializeBoard() method debuggen (erstellt es die 42 slots?)
  - [ ] WASM-Engine Status prüfen (window.game.isInitialized)
  - [ ] Browser-Console auf WASM-Loading-Errors prüfen

### 3. KI-System Verbindungsfehler 🔴 **USER-REPORTED**
- **Problem:** KI kann nicht verbunden werden bei vs-Bot Spielmodi
- **Status:** ❌ Noch nicht untersucht
- **Impact:** Beeinträchtigt vs-Bot-Easy/Medium/Hard Spielmodi
- **Nächste Steps:**
  - [ ] KI-Modi testen (vs-bot-easy, vs-bot-medium, vs-bot-hard)
  - [ ] Connect4AI Integration prüfen
  - [ ] WASM AI-Module Status prüfen

## 🟡 MEDIUM PRIORITY

### 4. Board Initialization Deep-Dive
- **Problem:** initializeBoard() erstellt möglicherweise keine sichtbaren Slots
- **Debug-Ansätze:**
  - [ ] gameBoard.innerHTML prüfen (sollte 42 .game-slot Elemente enthalten)
  - [ ] CSS-Styles für .game-slot prüfen
  - [ ] JavaScript-Errors in initializeBoard() suchen

### 5. Modal System Redesign
- **Plan:** Komplett neue Modal-Implementation ohne UI-Module System
- **Ansatz:** Native HTML/CSS/JavaScript ohne externe Dependencies
- **Features:**
  - [ ] Overlay mit dunklem Hintergrund
  - [ ] Escape-Key zum Schließen
  - [ ] Click-outside zum Schließen
  - [ ] Smooth Ein-/Ausblendung (transitions)

## ✅ COMPLETED IN LAST SESSION

1. **Connect4 Sidebar Layout** - Schmale Seitenleiste neben Spielfeld ✅
2. **Score Increment Bug** - Doppelte Event-Handler behoben ✅
3. **Responsive Design** - Sidebar rutscht bei <1024px unter Board ✅
4. **Event Handler Fix** - onMove() wrapper method hinzugefügt ✅

## 📋 TESTING CHECKLIST

### Before Next Session:
- [ ] Connect4 laden und Help-Button testen
- [ ] Neues Spiel Button testen
- [ ] vs-Bot Modus testen
- [ ] Browser-Console auf Errors prüfen

### Success Criteria:
- [ ] Help & Assistance Modals sichtbar als Overlays
- [ ] New Game Button erstellt vollständige 6x7 Board-Struktur
- [ ] KI-Modi funktionieren ohne Verbindungsfehler
- [ ] Board zeigt 42 interaktive Slots statt blauem Quadrat

## 🔧 DEVELOPMENT NOTES

### Current Connect4 Status:
- ✅ Sidebar Layout perfekt implementiert
- ✅ Responsive Design funktioniert
- ✅ CSS Grid für Column Labels korrekt aligned
- ⚠️ Board initialization broken
- ❌ Modal system completely broken
- ❌ AI connection issues

### Code Quality:
- Test Pass Rate: 77% (20/26 Tests) 
- Sidebar Layout: 100% functional
- Modal System: 0% functional
- New Game: ~50% functional (UI reset OK, board creation broken)

---

**Commit:** a724517 - fix: Connect4 New Game Button + Modal System Debugging 🔧
**Last Updated:** 2025-07-07
**Priority:** Modal System > Board Initialization > AI Connection