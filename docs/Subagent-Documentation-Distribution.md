# Subagent Documentation Distribution Guidelines

## 🎯 Übersicht

Diese Guidelines definieren die automatische Verteilung relevanter Dokumentation an LogicCastle Subagents für optimale Sprint-Effizienz.

## 📚 Dokumentations-Matrix

### 🎨 Frontend-Architekt
**Branch:** `feature/frontend-tailwindcss4x-migration`

**Relevante Dokumentation:**
- ✅ `docs/TailwindCSS-4x-Migration-Guide.md` - Primary Guide
- ✅ `docs/ARCHITECTURE.md` - Component Struktur
- ✅ `shared/css/design-tokens.css` - Design System
- ✅ `docs/Connect4-Backend-API.md` - UI-Backend Integration

**Sprint Ziele:**
- TailwindCSS 4.x Migration für alle Spiele
- Shared Component Library Implementation
- Premium Gaming UI Standardisierung

### 🦀 Rust-WASM-Backend-Architekt  
**Branch:** `feature/backend-wasm-optimization`

**Relevante Dokumentation:**
- ✅ `docs/WASM-Integration-Best-Practices.md` - Primary Guide
- ✅ `docs/gomoku-memory-analysis.md` - Performance Benchmarks
- ✅ `docs/Gomoku-Backend-API.md` - WASM Patterns
- ✅ `docs/Connect4-Backend-API.md` - BitPacked Reference

**Sprint Ziele:**
- WASM Performance Optimization
- Memory Management Improvements  
- L-Game WASM Backend Development

### 🚀 DevOps-Architekt
**Branch:** `feature/devops-github-pages-deployment`

**Relevante Dokumentation:**
- ✅ `docs/GitHub-Pages-Deployment-Guide.md` - Primary Guide
- ✅ `docs/CI-CD-SETUP.md` - Build Pipeline
- ✅ `package.json` Scripts - Build Commands
- ✅ `tailwind.config.js` Files - Production Builds

**Sprint Ziele:**
- GitHub Pages CI/CD Setup
- Automated Production Builds
- Performance Monitoring

### 🎮 Game-Modernization Team
**Branch:** `feature/l-game-modernization`

**Relevante Dokumentation:**
- ✅ `CLAUDE.md` - Connect4 Premium UI Goldstandard
- ✅ `docs/ARCHITECTURE.md` - 11-Komponenten-System
- ✅ `docs/Connect4-Backend-API.md` - API Pattern Template
- ✅ `games/connect4/` - Complete Reference Implementation

**Sprint Ziele:**
- L-Game nach Connect4 Standard modernisieren
- WASM Backend Implementation
- Premium Gaming UI Integration

## 🔄 Distribution Workflow

### 1. Documentation Update Protocol
```bash
# Research-Analyst commits neue/aktualisierte Docs
git checkout main
git add docs/[new-documentation].md
git commit -m "📚 RESEARCH: [Documentation Topic] Guide"
git push origin main

# Software-Architekt verteilt via Branches
git checkout feature/[subagent-branch]
git merge main  # Aktualisierte Docs verfügbar
git push origin feature/[subagent-branch]
```

### 2. Subagent Synchronization
```bash
# Subagent pullt Updates vor Sprint-Start
git checkout feature/[assigned-branch]
git pull origin main
git pull origin feature/[assigned-branch]

# Review relevanter Dokumentation
open docs/[relevant-guide].md
```

### 3. Cross-Reference Updates
- **API Changes** → Alle Subagents notification
- **Architecture Changes** → Frontend + Backend notification  
- **Performance Requirements** → Backend + DevOps notification
- **UI Standards** → Frontend + Game-Modernization notification

## 📊 Documentation Quality Gates

### Completion Requirements
- ✅ **API Documentation**: Vollständig für alle neuen Features
- ✅ **Usage Examples**: Praktische Code-Snippets enthalten
- ✅ **Performance Benchmarks**: Messbare Ziele definiert
- ✅ **Integration Guidelines**: Cross-Component Kompatibilität

### Update Triggers
1. **New Feature Implementation** → API Docs Update required
2. **Performance Optimization** → Benchmark Docs Update required
3. **Architecture Changes** → Component Docs Update required
4. **UI Standard Evolution** → Design System Docs Update required

## 🎯 Subagent Onboarding Checklist

### Neue Subagents (Feature Branch Assignment)
- [ ] Feature Branch checkout & setup
- [ ] Relevante Dokumentation review (siehe Matrix oben)
- [ ] Connect4 Premium UI Standard verstehen
- [ ] Git Workflow Training (`docs/Git-Branch-Management-Strategy.md`)
- [ ] Quality Gates & Merge Prozess briefing

### Sprint Start Protocol
- [ ] Latest documentation sync (`git pull origin main`)
- [ ] Review updated guidelines & best practices
- [ ] Coordinate mit anderen Subagents bei Dependencies
- [ ] Set Sprint milestones based on documentation

## 🚨 Emergency Documentation Updates

### Critical Updates Distribution
```bash
# URGENT: Breaking Changes oder Critical Bug Fixes
git checkout main
git add docs/[emergency-update].md
git commit -m "🚨 CRITICAL: [Issue] Emergency Guidelines"
git push origin main

# Immediate notification zu allen Feature Branches
for branch in feature/*; do
  git checkout $branch
  git merge main
  git push origin $branch
done

# Slack/Communication Alert zu Subagents
```

## 📈 Success Metrics

### Documentation Efficiency
- **Read Rate**: >90% der zugewiesenen Docs werden vor Sprint-Start gelesen
- **Implementation Accuracy**: <5% Nachfragen zu bereits dokumentierten Prozessen
- **Sprint Velocity**: Dokumentation beschleunigt Development (messbar)
- **Quality Consistency**: Connect4 Premium UI Standard wird eingehalten

### Subagent Coordination
- **Dependency Resolution**: <24h für Cross-Subagent Documentation Requests
- **Knowledge Transfer**: 100% Success Rate bei Subagent Handovers
- **Version Synchronization**: Keine Documentation Conflicts zwischen Branches

---

*Optimale Subagent-Koordination durch strukturierte Documentation Distribution* 📚✨