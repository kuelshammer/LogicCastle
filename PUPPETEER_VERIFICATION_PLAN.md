# Puppeteer Verification Plan - Gomoku Goldstandard Validation

## 🎯 Ziel
Vollständige Verifikation dass das neue Gomoku UI dem Referenzbild `Gomoku.jpg` entspricht und alle Features funktional sind.

## 📋 Referenzbild Analyse (Gomoku.jpg)

### Visual Requirements
- **15x15 Gomoku Board** mit gelblich-braunem Hintergrund
- **Coordinate Labels**: a-s (horizontal), 01-19 (vertikal)
- **Stone Placement**: Schwarze und weiße Steine auf Intersektionen
- **Game State Display**: Black/White scores, player indicator
- **Move History**: Notation table rechts (j11, k6, k11, etc.)
- **Star Points**: Traditionelle Go Markierungen bei 4-4, 10-10, 16-16, etc.

### Specific Game State in Image
- **Current Player**: Schwarz (dunkler Stein icon)
- **Stones Placed**: ~15-20 stones in complex pattern
- **Active Game**: Mid-game situation sichtbar
- **UI Elements**: Player indicators, score table, coordinate system

## 🔧 Puppeteer Test Suite Struktur

### Phase 1: Basic UI Validation
```javascript
// 1.1 Page Load & Initial State
- Navigate to /games/gomoku/index.html
- Verify page loads without errors (no 404, JS errors)
- Check that game board is visible and properly sized
- Verify coordinate labels (a-o, 1-15) are present

// 1.2 Board Visual Validation
- Screenshot board area
- Verify 15x15 grid structure
- Check star points at correct positions (4,4), (7,7), (11,11), etc.
- Validate board background color matches reference
- Ensure intersections are clickable elements
```

### Phase 2: UI Module Integration Testing
```javascript
// 2.1 Element Binding Validation
- Verify all required DOM elements exist
- Check ElementBinder successfully cached elements
- Validate no missing element warnings in console

// 2.2 Keyboard Integration
- Test WASD cursor movement
- Verify F1/F2 modal shortcuts
- Test X for stone placement (two-stage system)
- Validate Escape key functionality

// 2.3 Modal System
- Open Help modal (F1), verify content, close with Escape
- Open Game Help modal (F2), verify content, close
- Test click-outside-to-close functionality
```

### Phase 3: Stone Placement Verification 
```javascript
// 3.1 Two-Stage Placement System
- Navigate cursor to empty intersection
- Press X once → verify preview stone appears
- Press X again → verify stone is placed permanently
- Test cursor movement during preview → verify preview moves

// 3.2 Mouse Interaction
- Click empty intersection → verify cursor moves
- Hover intersection → verify hover preview
- Click again → verify stone placement
- Test mouse + keyboard combination

// 3.3 Visual Feedback
- Verify crosshair highlighting (row/column highlights)
- Check selection preview feedback
- Validate stone colors (black/white) match current player
- Test hover effects and cleanup
```

### Phase 4: Game State Management
```javascript
// 4.1 Player Management
- Verify current player indicator updates after moves
- Check player name display (Schwarz/Weiß)
- Test player color indication (stone icons)

// 4.2 Score & Move Counter
- Place stones and verify move counter increments
- Test game completion → verify score updates
- Check score display format matches reference

// 4.3 Move History & Notation
- Place sequence of moves
- Verify coordinate notation (A1-O15 format)
- Check move history tracking
- Validate undo functionality
```

### Phase 5: Advanced Features Testing
```javascript
// 5.1 Game Mode Switching
- Test "Two Player" mode
- Switch to "vs WASM Bot" (if available)
- Verify mode changes update UI appropriately

// 5.2 Helper Systems
- Test helper checkboxes (if available)
- Verify assistance system integration
- Check WASM integration status

// 5.3 Error Handling
- Test invalid moves (occupied positions)
- Verify graceful fallbacks when WASM unavailable
- Check console for unexpected errors
```

## 🎯 Specific Validation Checkpoints

### Critical Success Criteria
1. **Board Layout**: 15x15 grid exactly matches reference dimensions
2. **Coordinate System**: Labels a-o (horizontal), 1-15 (vertical) 
3. **Stone Placement**: Stones appear on intersections, not squares
4. **Visual Design**: Board color/style matches Gomoku.jpg
5. **Functionality**: All features work without JavaScript errors

### Visual Regression Tests
1. **Screenshot Comparison**: Board area vs. reference image
2. **Element Positioning**: Coordinates, stones, UI elements
3. **Color Accuracy**: Board background, stone colors, highlights
4. **Typography**: Coordinate labels, player names, scores

### Performance Benchmarks
1. **Page Load Time**: < 2 seconds for initial load
2. **Stone Placement**: < 100ms response time
3. **Cursor Movement**: Smooth WASD navigation
4. **Memory Usage**: No memory leaks during extended play

## 🔨 Implementation Plan

### Step 1: Puppeteer Test Setup (30 min)
- Install Puppeteer dependencies
- Create test runner script
- Setup local server for testing
- Configure screenshot capture

### Step 2: Basic Validation Tests (45 min)
- Implement Page Load tests
- Create Board Visual validation
- Setup Element existence checks
- Test coordinate system accuracy

### Step 3: Interaction Testing (60 min)
- Implement keyboard navigation tests
- Create mouse interaction validation
- Test two-stage stone placement
- Verify visual feedback systems

### Step 4: Game Logic Validation (45 min)
- Test game state management
- Verify move tracking and undo
- Check score and display updates
- Validate win condition handling

### Step 5: Visual Regression Suite (30 min)
- Setup screenshot comparison
- Create reference image matching
- Implement color/layout validation
- Generate comprehensive test report

## 📊 Success Metrics

### Must-Have Requirements
- ✅ 0 JavaScript console errors
- ✅ 100% core features functional
- ✅ Visual match to Gomoku.jpg reference
- ✅ All UI modules properly integrated
- ✅ Stone placement works correctly

### Performance Targets
- ✅ Page load < 2s
- ✅ Stone placement response < 100ms
- ✅ Memory stable during extended testing
- ✅ No visual glitches or layout breaks

## 🚨 Failure Scenarios & Rollback Plan

### If Tests Fail
1. **Document specific failures** with screenshots
2. **Identify root cause** (CSS, JS, logic errors)
3. **Create targeted fixes** for each issue
4. **Re-run verification** until all tests pass
5. **Only then declare Goldstandard** status

### Rollback Strategy
- Keep `ui-legacy.js` as working backup
- Revert to previous commit if critical failures
- Document lessons learned for next iteration

## 🎉 Final Validation

Only when ALL Puppeteer tests pass AND the visual output matches Gomoku.jpg can we declare this as the **Goldstandard Implementation** for other games migration.

**Estimated Total Time**: 3-4 hours for complete validation suite
**Success Criterion**: 100% test pass rate + visual parity with reference image