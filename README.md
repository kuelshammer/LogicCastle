# LogicCastle 🏰

Collection of logic games built with HTML5, CSS3, and JavaScript.

## Games

- **🔴 Connect4** - Classic four-in-a-row game with AI opponents
- **🎲 Trio** - Three-player strategic board game  
- **⚫ Gobang** - Five-in-a-row strategy game

## Development

### Setup
```bash
npm install          # Install development dependencies
npm run serve        # Start local server on port 8080
npm run lint         # Check code quality with ESLint
npm run test         # Run automated tests
```

### Project Structure
```
games/
├── connect4/        # Connect4 game implementation
├── gobang/          # Gobang game implementation
└── trio/            # Trio game implementation

scripts/             # Build and test scripts
tests/               # Test suites and framework
.vscode/             # VS Code settings
```

### Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature development

**Commit Guidelines:**
```bash
# Feature development
git checkout -b feature/evaluation-system
git commit -m "Add position evaluation for Connect4 AI"

# Testing and fixes  
git commit -m "Fix stone visibility regression"
git commit -m "Add comprehensive Connect4 tests"

# Integration
git checkout develop
git merge feature/evaluation-system
```

**What gets committed:**
- ✅ Source code (`games/`, `scripts/`, `tests/`)
- ✅ Configuration files (`.eslintrc.js`, `package.json`)
- ✅ Documentation (`README.md`, essential docs)
- ❌ Dependencies (`node_modules/`)
- ❌ Debug files (`test-*.js`, `debug-*.js`)
- ❌ Screenshots and temporary files
- ❌ Build artifacts and cache files

## Testing

### Automated Testing
```bash
npm test                    # Run all tests
npm run test:connect4       # Test Connect4 specifically
npm run test:watch          # Watch mode for development
```

### Manual Testing
1. Verify game functionality in browser
2. Test stone visibility and animations
3. Validate AI behavior and difficulty levels
4. Check responsive design on different screen sizes

## Code Quality

- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **Puppeteer** for automated browser testing
- **GitHub Actions** for CI/CD pipeline

## Contributing

1. Follow the established code style (auto-formatted)
2. Write tests for new features
3. Ensure all tests pass before committing
4. Use descriptive commit messages
5. Create feature branches for new development

## License

MIT License - see LICENSE file for details.