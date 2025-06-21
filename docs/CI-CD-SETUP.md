# CI/CD Setup Guide für LogicCastle

## Übersicht

LogicCastle verfügt über eine umfassende CI/CD-Pipeline mit automatisierten Tests, die sowohl lokal als auch in Cloud-Umgebungen ausgeführt werden können.

## 🧪 Test-Architektur

### Test-Kategorien

| Kategorie | Beschreibung | Ausführungszeit | NPM Script |
|-----------|--------------|-----------------|------------|
| **Unit Tests** | Backend + AI Tests | ~30s | `npm run test:unit` |
| **Integration Tests** | UI + Component Tests | ~2-5min | `npm run test:integration` |
| **Performance Tests** | Benchmark Tests | ~1-2min | `npm run test:performance` |
| **Legacy Tests** | Original Test Suites | ~1min | `npm run test:legacy` |
| **Full Suite** | Alle Tests kombiniert | ~5-10min | `npm run test:comprehensive` |

### Test-Umgebungen

```bash
# Lokale Entwicklung
npm run test:headless              # Alle Tests headless
npm run test                       # Original Browser Tests

# CI/CD Umgebung
npm run test:ci                    # Vollständige CI Tests
npm run test:ci-fast              # Schnelle Unit Tests
npm run test:ci-slow              # Langwierige Integration Tests
```

## 🚀 CI/CD Pipeline Struktur

### GitHub Actions Workflows

#### 1. **Qualitätsprüfungen** (< 2min)
- ESLint Code-Qualität
- Prettier Formatierung
- Schnelle Validierung

#### 2. **Unit Tests** (< 5min)
- Backend Game Logic
- AI Strategy Tests
- Helper System Tests
- Cross-Platform Kompatibilität

#### 3. **Integration Tests** (< 10min)
- UI Component Tests
- Game Flow Tests
- AI-UI Integration
- Cross-Component Tests

#### 4. **Vollständige Test Suite** (< 15min)
- Alle Test-Kategorien
- Performance Benchmarks
- Regression Tests
- Strukturierte Ergebnisse (JSON/JUnit XML)

#### 5. **Security & Build** (< 3min)
- npm audit Security Scan
- Build Verification
- Dependency Check

## 📊 Test-Ausgaben

### Lokale Entwicklung
```bash
$ npm run test:headless

🧪 LogicCastle CI/CD Test Suite
============================================================
📊 Test Results Summary:
============================================================
   ✅ backend          : 45/45
   ✅ ai_strategy      : 28/28
   ✅ helper_system    : 67/67
   ✅ ui_components    : 34/34
   ✅ integration      : 41/41
   ✅ performance      : 12/12
   ✅ regression       : 8/8
============================================================
   ✅ OVERALL: 235/235 (100%)

📄 Detailed results written to: test-results.json
⏱️  Total execution time: 43s
✨ All tests passed successfully!
```

### CI Environment
```json
{
  "timestamp": "2024-01-20T10:30:45.123Z",
  "environment": {
    "ci": true,
    "timeout_multiplier": 3,
    "platform": "linux"
  },
  "summary": {
    "total": 235,
    "passed": 235,
    "failed": 0,
    "success": true,
    "success_rate": 100
  },
  "categories": {
    "backend": { "passed": 45, "total": 45, "success": true },
    "ai_strategy": { "passed": 28, "total": 28, "success": true },
    "helper_system": { "passed": 67, "total": 67, "success": true },
    "ui_components": { "passed": 34, "total": 34, "success": true },
    "integration": { "passed": 41, "total": 41, "success": true }
  }
}
```

## ⚙️ Environment Configuration

### Environment Variables

| Variable | Beschreibung | Default | CI Value |
|----------|--------------|---------|----------|
| `CI` | CI-Umgebung erkannt | `false` | `true` |
| `CI_TIMEOUT_MULTIPLIER` | Timeout-Multiplikator | `1` | `3` |
| `NODE_ENV` | Node.js Umgebung | `development` | `test` |

### Performance Anpassungen

```javascript
// Test Framework erkennt automatisch CI-Umgebungen
const isCI = TestEnvironment.isCI();
const timeoutMultiplier = TestEnvironment.getTimeoutMultiplier();

// Automatische Timeout-Anpassung
const adjustedTimeout = TestEnvironment.adjustTimeout(100); // 100ms -> 300ms in CI

// Performance-kritische Tests können übersprungen werden
PerformanceAssertions.skipIfSlow(() => {
    // Schneller Test nur in lokaler Umgebung
}, 'Slow environment detected');
```

## 🔧 Setup für neue Umgebungen

### Lokale Entwicklung
```bash
# Dependencies installieren
npm install

# Alle Tests lokal ausführen
npm run test:headless

# Specific test categories
npm run test:unit
npm run test:integration
```

### GitHub Actions
```yaml
# .github/workflows/ci-comprehensive.yml
- name: Run tests
  run: npm run test:ci
  env:
    CI: true
    CI_TIMEOUT_MULTIPLIER: 3
```

### Andere CI-Systeme

#### GitLab CI
```yaml
test:
  script:
    - npm ci
    - npm run test:ci
  variables:
    CI: "true"
    CI_TIMEOUT_MULTIPLIER: "3"
  artifacts:
    reports:
      junit: test-results.xml
```

#### Jenkins
```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'CI=true CI_TIMEOUT_MULTIPLIER=3 npm run test:ci'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                    archiveArtifacts artifacts: 'test-results.json'
                }
            }
        }
    }
}
```

## 🐛 Troubleshooting

### Häufige Probleme

#### 1. Timeout-Fehler in CI
```bash
# Problem: Tests schlagen in CI fehl wegen Timeouts
# Lösung: Timeout-Multiplikator erhöhen
CI_TIMEOUT_MULTIPLIER=5 npm run test:ci
```

#### 2. Browser-Tests schlagen fehl
```bash
# Problem: Puppeteer kann nicht starten
# Lösung: Zusätzliche Browser-Args verwenden
--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage
```

#### 3. Memory-Probleme
```bash
# Problem: Tests laufen out of memory
# Lösung: Node.js Memory-Limit erhöhen
NODE_OPTIONS="--max-old-space-size=4096" npm run test:ci
```

### Debug-Modus
```bash
# Verbose Logging aktivieren
DEBUG=true npm run test:headless

# Nur spezifische Test-Kategorie debuggen
npm run test:unit -- --verbose

# Browser im sichtbaren Modus ausführen
HEADLESS=false npm run test:headless
```

## 📈 Performance-Optimierung

### Test-Parallelisierung
```bash
# Verschiedene Test-Kategorien parallel ausführen
npm run test:unit & npm run test:integration & wait
```

### Caching-Strategien
```yaml
# GitHub Actions Cache
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Resource-Management
```javascript
// Automatisches Cleanup nach Tests
afterEach(() => {
    // DOM cleanup
    document.body.innerHTML = '';
    
    // Memory cleanup
    game = null;
    ui = null;
    helpers = null;
});
```

## 🎯 Best Practices

1. **Fail Fast**: Unit Tests vor Integration Tests
2. **Environment Isolation**: Separate Timeouts für verschiedene Umgebungen
3. **Structured Output**: JSON + JUnit XML für CI-Integration
4. **Resource Cleanup**: Automatisches Cleanup nach jedem Test
5. **Error Handling**: Graceful Degradation bei CI-Fehlern
6. **Performance Monitoring**: Kontinuierliche Performance-Überwachung