#!/bin/bash

# Run Connect4 Debug Monitor
# Usage: ./run-monitor.sh [URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Connect4 Auto-Debug Monitor${NC}"
echo "======================================"

# Default URL
DEFAULT_URL="http://localhost:3000/games/connect4/"
URL=${1:-$DEFAULT_URL}

echo -e "${YELLOW}Target URL: ${URL}${NC}"
echo -e "${YELLOW}Monitor will:${NC}"
echo "  📊 Capture all console logs"
echo "  🔍 Categorize errors by priority"  
echo "  🧪 Run interactive test scenarios"
echo "  📋 Generate comprehensive report"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run the monitor
echo -e "${GREEN}🎯 Starting monitoring session...${NC}"
echo ""

if node puppeteer-debug-monitor.js "$URL"; then
    echo ""
    echo -e "${GREEN}✅ Monitoring completed successfully!${NC}"
    echo -e "${BLUE}📋 Check debug-report.json for detailed results${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Monitoring detected errors!${NC}"
    echo -e "${YELLOW}📋 Check debug-report.json for error details${NC}"
    exit 1
fi