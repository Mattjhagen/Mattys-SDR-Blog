#!/bin/bash

# SDR Audio Streaming via Cloudflare Tunnel
# This creates an HTTPS URL that works from anywhere with no CORS issues!

echo "🎵 SDR Audio Streaming via Cloudflare Tunnel"
echo "============================================"
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed!"
    exit 1
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null && ! [ -f ~/.local/bin/cloudflared ]; then
    echo "❌ cloudflared is not installed!"
    echo "   Install with:"
    echo "   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    echo "   sudo dpkg -i cloudflared-linux-amd64.deb"
    exit 1
fi

echo "✅ FFmpeg installed"
echo "✅ cloudflared installed"
echo ""

# Kill any existing FFmpeg or cloudflared processes
echo "🧹 Cleaning up any existing processes..."
pkill -f "ffmpeg.*8000.*live" 2>/dev/null
pkill -f "cloudflared.*8000" 2>/dev/null
sleep 2

echo ""
echo "📡 Step 1: Starting FFmpeg on localhost:8000..."
echo ""

# Start FFmpeg in background
ffmpeg -re -f pulse -i default \
    -c:a libmp3lame -b:a 128k -f mp3 \
    -listen 1 http://127.0.0.1:8000/live \
    > /tmp/ffmpeg-audio.log 2>&1 &

FFMPEG_PID=$!
echo "✅ FFmpeg started (PID: $FFMPEG_PID)"

# Wait for FFmpeg to start listening
echo "⏳ Waiting for FFmpeg to start..."
sleep 3

# Verify FFmpeg is running
if ! ps -p $FFMPEG_PID > /dev/null; then
    echo "❌ FFmpeg failed to start! Check /tmp/ffmpeg-audio.log"
    cat /tmp/ffmpeg-audio.log
    exit 1
fi

# Verify port 8000 is listening
if ! ss -tlnp | grep -q ":8000 "; then
    echo "❌ Port 8000 is not listening!"
    exit 1
fi

echo "✅ FFmpeg is running and listening on port 8000"
echo ""
echo "📡 Step 2: Creating Cloudflare Tunnel..."
echo ""
echo "🌐 Cloudflare will give you a PUBLIC HTTPS URL like:"
echo "   https://abc-xyz-123.trycloudflare.com/live"
echo ""
echo "⚠️  IMPORTANT: Copy the URL that appears below!"
echo "   Use that URL in your blog's waterfall connection."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start cloudflared tunnel (this will run in foreground and show the URL)
~/.local/bin/cloudflared tunnel --url http://127.0.0.1:8000

# When cloudflared exits (Ctrl+C), clean up FFmpeg
echo ""
echo "🛑 Shutting down..."
kill $FFMPEG_PID 2>/dev/null
echo "✅ Stopped FFmpeg"
