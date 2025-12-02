#!/bin/bash

echo "🚀 Running FlowFli in foreground mode"

# Kill existing processes
pkill -f "node" 2>/dev/null
sleep 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "⚡ Starting FlowFli server..."
echo "🌟 Dashboard will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Run server in foreground
node server.js
