#!/bin/bash

echo "🚀 Starting FlowFli - Unified AI Water Management System"

# Kill all existing processes
echo "🔄 Killing existing processes..."
pkill -f "node"
pkill -f "npm"
sleep 2

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start unified server
echo "⚡ Starting FlowFli..."
node server.js > flowfli.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test server health
echo "🔍 Testing server health..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ FlowFli is healthy"
else
    echo "❌ FlowFli failed to start"
    exit 1
fi

echo ""
echo "🎯 FlowFli is ready!"
echo "🌟 Main Dashboard: http://localhost:3000"
echo "🤖 ATP Integration: http://localhost:3000/api/atp/webhook"
echo "🔧 API Status: http://localhost:3000/api/status"
echo ""
echo "💡 Test commands:"
echo "curl http://localhost:3000/api/health"
echo "curl -X POST http://localhost:3000/api/atp/webhook -H 'Content-Type: application/json' -d '{\"type\":\"health_check\"}'"
echo ""
echo "🏆 Ready for IQAI Agent Arena!"
