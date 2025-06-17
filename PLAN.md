# Connect4 Development Plan

## "Neues Spiel" vs "Reset" Unterscheidung & UI-Verbesserungen

### **Problem-Analyse:**
Aktuell gibt es nur eine "Neues Spiel" Funktion die sowohl:
- Nächstes Spiel (Verlierer startet, Score bleibt)
- Vollständiger Reset (Score zurück auf 0:0, Rot startet)

### **Geplante Lösung:**

#### **1. Zwei separate Funktionen implementieren:**
- **"Nächstes Spiel"** (nach Spielende): Verlierer startet, Score bleibt
- **"Spiel zurücksetzen"** (manuell): Score 0:0, Rot startet immer

#### **2. UI-Anpassungen:**
- Button-Text ändern je nach Kontext:
  - Nach Spielende: "Nächstes Spiel" 
  - Während laufendem Spiel: "Neues Spiel"
- Zusätzlicher "Reset Score" Button oder Kontext-Menu

#### **3. Backend-Logik:**
- `resetGame()` → Nächstes Spiel (Verlierer-startet)
- `fullReset()` → Kompletter Reset (Score 0:0, Rot startet)
- `playerConfig.lastWinner = null` bei fullReset()

#### **4. Doppelpunkt-Entfernung:**
Alle ":" nach Emojis entfernen:
- Score-Labels: `🔴:` → `🔴`, `🟡:` → `🟡`
- Status-Texte: `🔴 ist am Zug` (bleibt)
- Gewinn-Nachrichten: `🔴 gewinnt!` (bleibt)

#### **Dateien zu ändern:**
- `js/game.js` - Neue fullReset() Methode
- `js/ui.js` - Button-Logik & Handler  
- `index.html` - Doppelpunkt-Entfernung
- Optional: Zusätzlicher Reset-Button

### **Status:** ✅ Umgesetzt
### **Datum:** 2025-01-17

### **Implementierte Lösung:**

#### **✅ Backend-Funktionen:**
- `resetGame()` - Nächstes Spiel (Verlierer startet, Score bleibt)
- `fullReset()` - Kompletter Reset (Score 0:0, Rot startet immer)
- Event-System erweitert mit `fullReset` Event

#### **✅ UI-Anpassungen:**
- Neuer "Score zurücksetzen" Button (btn-outline Stil)
- Kontextuelle Button-Texte:
  - Nach Spielende: "Nächstes Spiel"
  - Während Spiel: "Neues Spiel"
- Alle Doppelpunkte nach Emojis entfernt (🔴: → 🔴)

#### **✅ Funktionalität:**
- `updateButtonTexts()` Methode für dynamische Labels
- Beide Reset-Arten triggern Bot-AI korrekt
- Vollständige Test-Suite validiert Verhalten

#### **✅ Dateien geändert:**
- `js/game.js` - fullReset() Methode hinzugefügt
- `js/ui.js` - Button-Handler & Kontext-Logik
- `index.html` - Neuer Button & Doppelpunkt-Entfernung
- `css/ui.css` - btn-outline Styling

---

## 🚨 CRITICAL BUG DISCOVERED

### **Problem:** Turn Order Chaos in Bot Mode
**Datum:** 2025-01-17 (nach Implementierung)

#### **Symptome:**
- Red macht ersten Zug vs Bot
- Bot (Yellow) setzt Stein in GLEICHE Spalte wie Red
- Zugreihenfolge wird chaotisch
- Red kann mehr Steine setzen als Yellow
- Spiellogik komplett kaputt

#### **Vermutete Ursachen:**
1. `makePlayerMove()` und `makeAIMove()` Koordinationsfehler
2. `currentPlayer` switching nach Zügen defekt
3. Bot-Move timing Probleme
4. Move validation in Bot-Modus fehlerhaft

#### **Analyse erforderlich:**
- [x] Player-Turn-Management prüfen
- [x] AI-Trigger-Logik analysieren  
- [x] Move-Sequencing debuggen
- [x] Game-State Synchronisation testen

#### **✅ LÖSUNG GEFUNDEN UND IMPLEMENTIERT:**
**Root Cause:** Doppelte AI-Triggering durch `onPlayerChanged()` und `makePlayerMove()`
- `onPlayerChanged()` wurde bei jedem Spielerwechsel getriggert, auch nach AI-Zügen
- Führte zu mehrfachen Bot-Zügen pro Spieler-Zug
- Bot setzte Steine in gleiche Spalte, da mehrere parallele AI-Calls

**Fix:** 
- Entfernt AI-Triggering aus `onPlayerChanged()` Event Handler (ui.js:663-665)
- Kommentar hinzugefügt um zukünftige Bugs zu vermeiden  
- AI wird nur noch getriggert in `makePlayerMove()` und `onGameReset()/onFullReset()`

**Test-Validierung:**
- ✅ Kein doppeltes AI-Triggering mehr
- ✅ Bot setzt Steine in verschiedene Spalten 
- ✅ Korrekte Zugreihenfolge: Rot → Gelb → Rot → Gelb

#### **Status:** ✅ BEHOBEN
#### **Datum:** 2025-01-17