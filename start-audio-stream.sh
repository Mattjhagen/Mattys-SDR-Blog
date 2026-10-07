#!/bin/bash

# SDR Audio Streaming Helper Script
# This script sets up audio streaming from SDR++ to the web interface

echo "🎵 SDR Audio Streaming Setup"
echo "================================"
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
echo "📡 Configuration Steps:"
echo "   1. Open SDR++ and configure:"
echo "      - Source: RTL-SDR"
echo "      - Audio Output: SDR_Audio_Stream"
echo "   2. Tune to your desired frequency"
echo "   3. Start this streaming server"
echo ""

# Check if stream is already running
if pgrep -f "ffmpeg.*8000.*live" > /dev/null; then
    echo "⚠️  Audio stream is already running!"
    echo "   Stop it with: pkill -f 'ffmpeg.*8000.*live'"
    exit 1
fi

echo "🚀 Starting FFmpeg audio stream on http://localhost:8000/live"
echo "   Press Ctrl+C to stop streaming"
echo ""

# Start FFmpeg streaming
ffmpeg -f pulse -i sdr_stream.monitor \
    -c:a libmp3lame -b:a 128k -f mp3 \
    -listen 1 http://0.0.0.0:8000/live
