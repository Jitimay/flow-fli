#!/bin/bash

echo "🛑 Stopping FlowFli..."

# Kill all processes
pkill -f "node"
pkill -f "npm"
pkill -f "next"

echo "✅ All processes stopped"
