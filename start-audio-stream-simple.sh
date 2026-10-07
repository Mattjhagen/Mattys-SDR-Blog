#!/bin/bash

# Simple SDR Audio Streaming Script
# No virtual sinks - just streams whatever audio is playing

echo "🎵 Simple SDR Audio Streaming"
echo "=============================="
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
    echo "⚠️  Audio stream is already running!"
    echo "   Stop it with: pkill -f 'ffmpeg.*8000.*live'"
    echo ""
    read -p "Kill existing stream and restart? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "ffmpeg.*8000.*live"
        sleep 2
    else
        exit 1
    fi
fi

echo "📡 Configuration:"
echo "   1. Make sure SDR++ is running and playing audio"
echo "   2. This will stream whatever audio is currently playing"
echo "   3. Connect to: http://localhost:8000/live"
echo ""

echo "🚀 Starting FFmpeg audio stream on http://localhost:8000/live"
echo "   Local: http://localhost:8000/live"
echo "   Network: http://$(hostname -I | awk '{print $1}'):8000/live"
echo ""
echo "   Press Ctrl+C to stop streaming"
echo ""

# List available audio sources
echo "Available audio sources:"
wpctl status | grep -A 5 "Sources:" 2>/dev/null || echo "  (Use wpctl status to see available sources)"
echo ""

# Try different audio source methods
if ffmpeg -f pulse -list_devices true -i dummy 2>&1 | grep -q "pulse"; then
    # PulseAudio compatibility layer is available
    echo "Using PulseAudio compatibility mode..."
    ffmpeg -f pulse -i default \
        -c:a libmp3lame -b:a 128k -f mp3 \
        -listen 1 http://0.0.0.0:8000/live
elif ffmpeg -f alsa -list_devices true -i dummy 2>&1 | grep -q "alsa"; then
    # Fallback to ALSA
    echo "Using ALSA mode..."
    ffmpeg -f alsa -i default \
        -c:a libmp3lame -b:a 128k -f mp3 \
        -listen 1 http://0.0.0.0:8000/live
else
    # Last resort - try pulse anyway
    echo "Attempting pulse audio..."
    ffmpeg -f pulse -i default \
        -c:a libmp3lame -b:a 128k -f mp3 \
        -listen 1 http://0.0.0.0:8000/live
fi
