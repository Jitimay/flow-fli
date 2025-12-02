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

# Start unified server in background
echo "⚡ Starting FlowFli server..."
nohup node server.js > flowfli.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 3

# Test server health
echo "🔍 Testing server health..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ FlowFli is healthy and running"
else
    echo "❌ FlowFli failed to start"
    exit 1
fi

echo ""
echo "🎯 FlowFli is ready and running continuously!"
echo "🌟 Main Dashboard: http://localhost:3000"
echo "🤖 ATP Integration: http://localhost:3000/api/atp/webhook"
echo "🔧 API Status: http://localhost:3000/api/status"
echo ""
echo "📋 Server is running in background (PID: $SERVER_PID)"
echo "📄 Logs: tail -f flowfli.log"
echo "🛑 Stop: ./stop.sh"
echo ""
echo "🏆 Ready for IQAI Agent Arena!"
