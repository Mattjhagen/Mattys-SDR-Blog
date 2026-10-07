#!/bin/bash

# Simple SDR Audio Streaming Script - Port 8001
# Uses port 8001 to avoid conflicts

echo "🎵 Simple SDR Audio Streaming (Port 8001)"
echo "=========================================="
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed!"
    echo "   Install with: sudo apt install -y ffmpeg"
    exit 1
fi

echo "✅ FFmpeg installed"
echo ""

# Check if stream is already running
if pgrep -f "ffmpeg.*8001.*live" > /dev/null; then
    echo "⚠️  Audio stream is already running on port 8001!"
    echo "   Stop it with: pkill -f 'ffmpeg.*8001.*live'"
    echo ""
    read -p "Kill existing stream and restart? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "ffmpeg.*8001.*live"
        sleep 2
    else
        exit 1
    fi
fi

# Check if port 8001 is available
if ss -tlnp | grep -q ":8001 "; then
    echo "⚠️  Port 8001 is already in use!"
    echo "   To find what's using it, try: sudo lsof -i :8001"
    echo ""
    exit 1
fi

echo "📡 Configuration:"
echo "   1. Make sure SDR++ is running and playing audio from SpyServer"
echo "   2. This will stream whatever audio is currently playing"
echo "   3. Connect to: http://localhost:8001/live"
echo ""

echo "🚀 Starting FFmpeg audio stream on http://localhost:8001/live"
echo "   Local: http://localhost:8001/live"
echo "   Network: http://$(hostname -I | awk '{print $1}'):8001/live"
echo ""
echo "   ⚠️  NOTE: Using port 8001 (port 8000 was in use)"
echo "   Update your web interface connection to: http://localhost:8001/live"
echo ""
echo "   Press Ctrl+C to stop streaming"
echo ""

# Start FFmpeg streaming on port 8001
ffmpeg -f pulse -i default \
    -c:a libmp3lame -b:a 128k -f mp3 \
    -listen 1 http://0.0.0.0:8001/live
