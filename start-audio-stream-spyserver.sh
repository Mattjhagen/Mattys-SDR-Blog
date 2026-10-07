#!/bin/bash

# SDR Audio Streaming Helper Script for SpyServer
# This script sets up audio streaming from SDR++ (connected to SpyServer) to the web interface

echo "🎵 SDR Audio Streaming Setup (SpyServer Mode)"
echo "=============================================="
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed!"
    echo "   Install with: sudo apt install -y ffmpeg"
    exit 1
fi

# Check if PulseAudio/PipeWire is running
if ! pactl info &> /dev/null; then
    echo "❌ PulseAudio/PipeWire is not running!"
    exit 1
fi

echo "✅ FFmpeg installed"
echo "✅ Audio system detected"
echo ""

# Check if virtual sink exists
if ! pactl list sinks | grep -q "sdr_stream"; then
    echo "📻 Creating virtual audio sink 'sdr_stream'..."
    pactl load-module module-null-sink \
        sink_name=sdr_stream \
        sink_properties=device.description="SDR_Audio_Stream"

    if [ $? -eq 0 ]; then
        echo "✅ Virtual sink created successfully"
    else
        echo "❌ Failed to create virtual sink"
        exit 1
    fi
else
    echo "✅ Virtual sink 'sdr_stream' already exists"
fi

echo ""
echo "📡 SpyServer Configuration:"
echo "   1. Open SDR++ and configure SpyServer source:"
echo "      - Source: SpyServer Client"
echo "      - Host: [Your SpyServer IP:Port]"
echo "      - Connect to SpyServer"
echo "   2. Set Audio Output: SDR_Audio_Stream"
echo "   3. Tune to your desired frequency"
echo "   4. Enable audio (unmute in SDR++)"
echo ""
echo "   SpyServer allows you to remotely access SDR hardware"
echo "   without needing the RTL-SDR physically connected!"
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
        sleep 1
    else
        exit 1
    fi
fi

echo "🚀 Starting FFmpeg audio stream on http://localhost:8000/live"
echo "   Stream URL for web interface: http://localhost:8000/live"
echo "   Or from network: http://$(hostname -I | awk '{print $1}'):8000/live"
echo ""
echo "   Press Ctrl+C to stop streaming"
echo ""

# Start FFmpeg streaming
ffmpeg -f pulse -i sdr_stream.monitor \
    -c:a libmp3lame -b:a 128k -f mp3 \
    -listen 1 http://0.0.0.0:8000/live
