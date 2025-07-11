# 🤖 LogicCastle Auto-Debug Tools

Automated debugging and monitoring system for LogicCastle games, with focus on systematic error detection and iterative fixing.

## 🎯 Features

### **Puppeteer Console Monitor**
- **Real-time error categorization**: CRITICAL → API_MISMATCH → KEYBOARD → RESOURCE → DEPRECATED
- **Interactive test scenarios**: Page load, column clicks, modal shortcuts, hover interactions
- **Comprehensive reporting**: JSON output with priority-based fix recommendations
- **Performance monitoring**: Error-free test execution validation

### **Error Categories**

| Category | Description | Examples |
|----------|-------------|----------|
| **CRITICAL** | Game-breaking errors | `TypeError: makeMove is not a function` |
| **API_MISMATCH** | WASM/JS interface issues | Missing game methods |
| **KEYBOARD** | Shortcut conflicts | Unknown actions, duplicate keys |
| **RESOURCE** | Missing files | 404 audio files, missing images |
| **DEPRECATED** | Legacy code warnings | Old API usage |

## 🚀 Quick Start

### **Basic Monitoring**
```bash
cd debug-tools
./run-monitor.sh
```

### **Custom URL**
```bash
./run-monitor.sh http://localhost:8080/games/connect4/
```

### **Manual Node.js**
```bash
node puppeteer-debug-monitor.js [URL]
```

## 📊 Output & Reports

### **Console Output**
Real-time categorized logs with color coding:
- 🔴 **CRITICAL**: Red - Immediate action required
- 🟣 **API_MISMATCH**: Magenta - Interface problems  
- 🟡 **KEYBOARD**: Yellow - Shortcut issues
- 🔵 **RESOURCE**: Cyan - Missing files
- ⚫ **DEPRECATED**: Gray - Legacy warnings

### **JSON Report** (`debug-report.json`)
```json
{
  "timestamp": "2025-01-XX...",
  "summary": {
    "totalErrors": 0,
    "errorCounts": { "CRITICAL": 0, "KEYBOARD": 2 },
    "testResults": [
      {"name": "Column Click", "status": "PASS", "duration": 250}
    ]
  },
  "detailedLogs": [ /* all captured logs */ ]
}
```

## 🧪 Test Scenarios

1. **Page Load**: Verify error-free initialization
2. **Column Click**: Test gameplay interaction (makeMove API)  
3. **F1 Help Modal**: Keyboard shortcut functionality
4. **F2 Assistance Modal**: Modal system integration
5. **Hover Preview**: UI responsiveness and animations

## 🔧 Configuration

### **Monitor Options**
```javascript
const monitor = new Connect4DebugMonitor({
    url: 'http://localhost:3000/games/connect4/',
    outputFile: './debug-report.json',
    maxRetries: 5
});
```

### **Error Pattern Customization**
```javascript
this.errorPatterns = {
    CRITICAL: [/TypeError.*is not a function/],
    API_MISMATCH: [/game\.makeMove is not a function/],
    // ... customize patterns
};
```

## 📈 Continuous Integration

### **CI/CD Integration**
```bash
# In your CI pipeline
cd debug-tools
npm install
./run-monitor.sh $DEPLOY_URL
# Exit code 0 = no errors, 1 = errors detected
```

### **Automated Fix Workflow**
```bash
while [ $errors -gt 0 ]; do
    ./run-monitor.sh
    # Apply fixes based on error categories
    # Re-run monitor
done
```

## 🎯 Success Criteria

✅ **Zero console errors during monitoring**  
✅ **All test scenarios pass**  
✅ **Clean JSON report with no critical issues**  
✅ **Functional gameplay (column clicks work)**  
✅ **Responsive UI (modals open with F1/F2)**

## 🔍 Troubleshooting

### **Common Issues**

**Puppeteer fails to launch:**
```bash
# Install Chrome dependencies (Linux)
sudo apt-get install -y chromium-browser

# Or use system Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**Monitor times out:**
- Check if dev server is running on the target URL
- Increase timeout in monitor configuration
- Verify network connectivity

**Test scenarios fail:**
- Ensure DOM elements exist (gameBoard, modals)
- Check if JavaScript is properly loaded
- Validate game initialization timing

## 🔄 Development Workflow

1. **Make code changes**
2. **Run monitor**: `./run-monitor.sh`
3. **Review JSON report** for new errors
4. **Apply targeted fixes** based on error categories
5. **Re-run monitor** to validate fixes
6. **Repeat until clean**

## 📚 Architecture

```
debug-tools/
├── puppeteer-debug-monitor.js    # Main monitoring class
├── run-monitor.sh                # Wrapper script
├── package.json                  # Dependencies
└── debug-report.json            # Generated reports
```

### **Class Structure**
- `Connect4DebugMonitor`: Main monitoring orchestrator
- Error categorization with regex patterns
- Test scenario execution framework  
- Report generation and persistence

---

**Status**: Operational and battle-tested  
**Last Updated**: 2025-01-XX  
**Compatibility**: Chrome/Chromium, Node.js 14+