# Gomoku Production Build Guide

## 🏗️ CSS Build System

### Quick Start
```bash
# Build optimized CSS for production
npm run build:css

# Watch for changes during development
npm run watch:css
```

### Build Architecture

#### Production CSS Pipeline
```
tailwind-source.css → tailwind.config.js → tailwind-built.css
```

- **Source**: `assets/css/tailwind-source.css` - Full Tailwind with custom components
- **Config**: `tailwind.config.js` - Game-specific optimizations and safelist
- **Output**: `css/tailwind-built.css` - Minified, optimized CSS (Production)

#### Key Optimizations
- **Tree Shaking**: Only used classes included
- **Safelist**: Dynamic classes preserved (winning-stone, confetti-particle, etc.)
- **Custom Components**: Glassmorphism system built-in
- **Keyframes**: Victory sequence animations included
- **Responsive**: Mobile-first design
- **Accessibility**: Reduced motion support

### File Structure
```
games/gomoku/
├── assets/css/
│   └── tailwind-source.css      # Source CSS with @tailwind directives
├── css/
│   ├── tailwind-built.css       # ✅ Production build (optimized)
│   ├── game-new.css            # Legacy CSS (will be phased out)
│   └── animations.css          # Legacy CSS (will be phased out)
├── tailwind.config.js          # Tailwind configuration
├── package.json               # Build scripts
└── index-production.html      # ✅ Uses optimized CSS
```

### Production Checklist
- [x] CDN removed from HTML
- [x] Local CSS build implemented
- [x] Safelist configured for dynamic classes
- [x] Custom glassmorphism components
- [x] Victory sequence keyframes
- [x] Ultra-high specificity CSS conflicts resolved
- [x] Responsive breakpoints optimized
- [x] Reduced motion support
- [x] Build scripts configured

### Connect4 Goldstandard Compliance ✅
This build system follows the Connect4 production standards:
- No CDN in production
- Optimized CSS builds
- Game-specific Tailwind configuration
- Component-based architecture
- Performance optimization

### Legacy Phase-out Plan
1. **Current**: Hybrid system (tailwind-built.css + legacy CSS)
2. **Phase 2**: Remove legacy CSS files
3. **Phase 3**: Full Tailwind-only production build

---
*Generated as part of PHASE 4B: Production CSS Build Setup*