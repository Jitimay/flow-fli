#!/bin/bash

echo "🚀 Starting FlowFli - AI Water Management System"

# Kill all existing processes
echo "🔄 Killing existing processes..."
pkill -f "node"
pkill -f "npm"
pkill -f "next"
sleep 2

# Start backend
echo "⚡ Starting backend..."
cd backend
node server-simple.js > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Test backend health
echo "🔍 Testing backend health..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend healthy"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

# Test frontend
echo "🔍 Testing frontend..."
if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo "✅ Frontend healthy"
else
    echo "❌ Frontend failed to start"
fi

echo ""
echo "🎯 FlowFli is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "🤖 ATP:      http://localhost:3001/atp/webhook"
echo ""
echo "💡 Test commands:"
echo "curl http://localhost:3001/health"
echo "curl -X POST http://localhost:3001/atp/webhook -H 'Content-Type: application/json' -d '{\"type\":\"health_check\"}'"
echo ""
echo "🏆 Ready for IQAI Agent Arena!"
