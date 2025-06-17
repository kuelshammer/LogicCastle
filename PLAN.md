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