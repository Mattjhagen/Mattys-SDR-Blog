#!/bin/bash

# SDR Audio Streaming Helper Script for SpyServer (PipeWire Native)
# This version uses wpctl/pw-cli for PipeWire (no pactl needed)

echo "🎵 SDR Audio Streaming Setup (SpyServer + PipeWire)"
echo "==================================================="
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed!"
    echo "   Install with: sudo apt install -y ffmpeg"
    exit 1
fi

# Check if PipeWire is running
if ! wpctl status &> /dev/null; then
    echo "❌ PipeWire is not running!"
    exit 1
fi

echo "✅ FFmpeg installed"
echo "✅ PipeWire detected"
echo ""

# Create virtual sink using PipeWire
echo "📻 Setting up virtual audio sink for SDR streaming..."

# Check if sink already exists
if wpctl status | grep -q "SDR_Audio_Stream"; then
    echo "✅ Virtual sink 'SDR_Audio_Stream' already exists"
else
    echo "Creating virtual sink with pw-cli..."
    pw-cli create-node adapter \
        '{ factory.name=support.null-audio-sink node.name=SDR_Audio_Stream node.description="SDR_Audio_Stream" media.class=Audio/Sink audio.position=FL,FR }' > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Virtual sink created successfully"
    else
        echo "⚠️  Warning: Could not create virtual sink via pw-cli"
        echo "   This may still work if the sink exists from a previous run"
    fi
fi

echo ""
echo "📡 SpyServer Configuration:"
echo "   1. Open SDR++ and configure SpyServer source:"
echo "      - Source: SpyServer Client"
echo "      - Host: [Your SpyServer IP:Port]"
echo "      - Connect to SpyServer"
echo "   2. Set Audio Output: SDR_Audio_Stream (or any available sink)"
echo "   3. Tune to your desired frequency"
echo "   4. Enable audio (unmute in SDR++)"
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

echo ""
echo "🎧 Available Audio Devices:"
wpctl status | grep -A 20 "Audio" | grep -E "Sinks:|Sources:" -A 10 | head -25
echo ""

echo "🚀 Starting FFmpeg audio stream on http://localhost:8000/live"
echo ""
echo "   IMPORTANT: Choose the correct PipeWire audio source!"
echo "   Common options:"
echo "   - For SDR++ output: Use the SDR_Audio_Stream monitor"
echo "   - For system audio: Use 'default' or specific device from list above"
echo ""
echo "   Stream URL: http://localhost:8000/live"
echo "   Or from network: http://$(hostname -I | awk '{print $1}'):8000/live"
echo ""
echo "   Press Ctrl+C to stop streaming"
echo ""

# Try to find SDR_Audio_Stream monitor
SDR_MONITOR=$(pw-cli list-objects | grep -B 5 "SDR_Audio_Stream" | grep "object.serial" | tail -1 | awk '{print $NF}' | tr -d '"')

if [ -n "$SDR_MONITOR" ]; then
    echo "🎯 Found SDR_Audio_Stream (ID: $SDR_MONITOR), attempting to stream..."
    ffmpeg -f pulse -i $SDR_MONITOR \
        -c:a libmp3lame -b:a 128k -f mp3 \
        -listen 1 http://0.0.0.0:8000/live
else
    echo "⚠️  SDR_Audio_Stream not found, trying 'default' audio source..."
    echo "   Make sure SDR++ is outputting to the virtual sink!"
    echo ""
    ffmpeg -f pulse -i default \
        -c:a libmp3lame -b:a 128k -f mp3 \
        -listen 1 http://0.0.0.0:8000/live
fi
