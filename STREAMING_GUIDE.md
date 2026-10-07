# SDR Audio Streaming Setup Guide

## 🎉 Issues Fixed!

### ✅ Image Loading Issue - RESOLVED
- **Problem**: Cover images in blog posts showed broken icons
- **Cause**: Images referenced `/src/assets/` paths which don't exist in production
- **Fix**: Moved images to `public/images/` and updated paths
- **Status**: Site rebuilt and restarted with images now loading correctly

### 🎵 Audio Streaming Setup

The SDR Station Receiver error **"Unable to connect to stream at http://localhost:8000/live"** means the FFmpeg audio streaming server isn't running yet. Here's how to set it up:

## Quick Start

### 1. Start the Audio Stream

```bash
cd ~/Mattys-SDR-Blog
./start-audio-stream.sh
```

This script will:
- ✅ Check if FFmpeg is installed
- ✅ Create virtual audio sink `sdr_stream` (if needed)
- 🚀 Start streaming on `http://localhost:8000/live`

### 2. Configure SDR++ (or other SDR software)

1. **Open SDR++**
2. **Set Audio Output**:
   - Go to Audio settings
   - Select: **"SDR_Audio_Stream"** as output device
3. **Tune to frequency** (e.g., 14.074 MHz for FT8)
4. **Ensure audio is playing** - you should see activity in SDR++

### 3. Connect in the Web Interface

1. Open https://mattjhagen.xyz
2. Click **"Waterfall Lab"** in the navigation
3. Click the yellow **"🔴 Live RTL-SDR v4"** button
4. In the connection dialog:
   - **Stream URL**: `http://192.168.0.169:8000/live` (local network)
   - Or: `http://localhost:8000/live` (same machine)
5. Click **"▶ Connect & Listen Live"**
6. The waterfall should come alive with live audio!

## Testing Connection

### Check if stream is running:
```bash
ps aux | grep ffmpeg | grep 8000
```

### Test stream locally:
```bash
curl -I http://localhost:8000/live
# Should return: Content-Type: audio/mpeg
```

### Listen with VLC (to verify it works):
```bash
vlc http://localhost:8000/live
```

## Troubleshooting

### Virtual Sink Not Working
If audio isn't routing properly:

```bash
# List all audio sinks
pactl list sinks short

# Verify sdr_stream exists
pactl list sinks | grep -A 5 sdr_stream

# Recreate if needed
pactl unload-module module-null-sink
./start-audio-stream.sh
```

### Port 8000 Already in Use
```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill old FFmpeg process
pkill -f "ffmpeg.*8000.*live"
```

### No Audio in SDR++
1. Check that SDR++ audio output is set to "SDR_Audio_Stream"
2. Verify volume is up in SDR++
3. Make sure SDR++ is actively receiving (not paused)

## Remote Access (Optional)

### For Club Members on Your Network:
Use your local IP: `http://192.168.0.169:8000/live`

### For Public Internet Access:
```bash
# Use Cloudflare tunnel (free, no port forwarding)
cloudflared tunnel --url http://localhost:8000

# Copy the generated URL (e.g., https://xyz.trycloudflare.com/live)
# Share this URL - it works from anywhere!
```

## Running in Background

To keep the stream running even after closing the terminal:

```bash
# Start in background
nohup ./start-audio-stream.sh > audio-stream.log 2>&1 &

# Check it's running
tail -f audio-stream.log

# Stop it later
pkill -f "ffmpeg.*8000.*live"
```

## Systemd Service (Auto-start on boot)

Create `/etc/systemd/system/sdr-audio-stream.service`:

```ini
[Unit]
Description=SDR Audio Streaming Server
After=network.target pulseaudio.service

[Service]
Type=simple
User=matt
WorkingDirectory=/home/matt/Mattys-SDR-Blog
ExecStartPre=/usr/bin/pactl load-module module-null-sink sink_name=sdr_stream sink_properties=device.description="SDR_Audio_Stream"
ExecStart=/usr/bin/ffmpeg -f pulse -i sdr_stream.monitor -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:8000/live
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sdr-audio-stream
sudo systemctl start sdr-audio-stream
sudo systemctl status sdr-audio-stream
```

## Summary

**What's Fixed:**
- ✅ Blog images now load correctly
- ✅ Site rebuilt and server restarted
- ✅ Audio streaming helper script created

**To Enable Live Streaming:**
1. Run `./start-audio-stream.sh`
2. Configure SDR++ to output to "SDR_Audio_Stream"
3. Connect in web interface to `http://localhost:8000/live`

The waterfall display will show live audio spectrum once connected! 📡🎵

**Need Help?**
- Check README.md for full RTL-SDR v4 setup
- View logs: `tail -f audio-stream.log` or `journalctl -fu sdr-audio-stream`
- Test connection: `curl -I http://localhost:8000/live`
