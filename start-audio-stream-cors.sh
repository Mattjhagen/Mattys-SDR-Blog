#!/bin/bash

# SDR Audio Streaming with CORS Headers (Required for web browser access)

echo "🎵 SDR Audio Streaming with CORS Support"
echo "========================================="
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
if pgrep -f "ffmpeg.*8000.*live" > /dev/null; then
    echo "⚠️  Audio stream is already running on port 8000!"
    echo "   Killing existing stream..."
    pkill -f "ffmpeg.*8000.*live"
    sleep 2
fi

# Check if port 8000 is available
if ss -tlnp | grep -q ":8000 "; then
    echo "⚠️  Port 8000 is still in use!"
    echo "   Trying to free it up..."
    pkill -f "8000"
    sleep 2
fi

echo "📡 Configuration:"
echo "   1. Make sure SDR++ is running and playing audio from SpyServer"
echo "   2. This stream includes CORS headers for browser access"
echo "   3. Connect to: http://localhost:8000/live"
echo ""

echo "🚀 Starting FFmpeg with CORS headers on http://localhost:8000/live"
echo "   Local: http://localhost:8000/live"
echo "   Network: http://$(hostname -I | awk '{print $1}'):8000/live"
echo ""
echo "   ✅ CORS enabled - browser connections will work!"
echo ""
echo "   Press Ctrl+C to stop streaming"
echo ""

# Start FFmpeg with HTTP headers for CORS
ffmpeg -re -f pulse -i default \
    -c:a libmp3lame -b:a 128k \
    -f mp3 \
    -listen 1 \
    -headers $'Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n' \
    http://0.0.0.0:8000/live
