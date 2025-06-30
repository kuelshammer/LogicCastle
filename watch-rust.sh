#!/bin/bash
# RUST DEVELOPMENT WATCH SCRIPT
# Automatically rebuilds WASM when Rust code changes
# Provides immediate feedback on compilation errors

echo "🦀 Starting Rust/WASM Development Watch Mode..."
echo "📍 Watching: game_engine/src/"
echo "🔄 Auto-rebuilds: Rust → WASM → npm on changes"
echo "❌ Immediate error feedback with cargo clippy"
echo ""

cd /Users/max/LogicCastle/game_engine

# Start cargo watch with comprehensive checks
cargo watch \
  --clear \
  --why \
  --notify \
  --delay 1 \
  --watch src/ \
  --ignore target/ \
  --ignore pkg/ \
  --shell 'echo "🔍 Running Rust checks..." && cargo clippy --all-targets --all-features -- -W clippy::unwrap_used && echo "✅ Clippy passed!" && echo "🔧 Building WASM..." && cd .. && npm run wasm:build && echo "✅ WASM rebuilt successfully!"'