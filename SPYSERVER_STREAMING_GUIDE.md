# SpyServer SDR Audio Streaming Setup Guide

## 🎉 Issues Fixed!

### ✅ Image Loading Issue - RESOLVED
- **Problem**: Cover images in blog posts showed broken icons  
- **Cause**: Images referenced `/src/assets/` paths which don't exist in production  
- **Fix**: Moved images to `public/images/` and updated paths  
- **Status**: ✅ Site rebuilt and restarted - **images now load correctly!**

Check it out at https://mattjhagen.xyz - the blog post images should now display properly.

---

## 🎵 SpyServer Audio Streaming Setup

You're using **SpyServer** to remotely access SDR hardware. Here's how to stream that audio to your web interface:

### What is SpyServer?
SpyServer allows you to access remote SDR hardware over the network. You can use SDR++ on your computer to connect to the SpyServer, then stream that audio to your blog's waterfall display.

## Quick Start (3 Steps)

### Step 1: Configure SDR++ for SpyServer

1. **Open SDR++**
2. **Select Source**: SpyServer Client
3. **Configure Connection**:
   - Host: `[Your SpyServer IP:Port]` (e.g., `192.168.1.100:5555`)
   - Click "Connect"
4. **Tune to a frequency** (e.g., 14.074 MHz for FT8 or 146.520 MHz for 2m calling)
5. **Set Audio Output**:
   - Audio device: **"SDR_Audio_Stream"** (created by the script)
6. **Enable audio** - make sure it's not muted!

### Step 2: Start the Audio Streaming Server

```bash
cd ~/Mattys-SDR-Blog
./start-audio-stream-spyserver.sh
```

This will:
- ✅ Create virtual audio sink `sdr_stream`
- ✅ Start FFmpeg streaming on port 8000
- 🎵 Serve audio at `http://localhost:8000/live`

**Keep this terminal open** while streaming (or run in background - see below)

### Step 3: Connect in Your Blog

1. **Open https://mattjhagen.xyz**
2. Click **"Waterfall Lab"** in the navigation  
3. Click the yellow **"🔴 Live RTL-SDR v4"** button  
4. **Enter stream URL**:
   - Local: `http://localhost:8000/live`
   - Same network: `http://192.168.0.169:8000/live`
5. Click **"▶ Connect & Listen Live"**
6. **Watch the waterfall come alive!** 📡🎵

---

## Architecture Overview

```
SpyServer (Remote SDR) 
    ↓ network
SDR++ (SpyServer Client) 
    ↓ audio output: SDR_Audio_Stream
PulseAudio Virtual Sink
    ↓ monitor stream
FFmpeg (encodes to MP3)
    ↓ HTTP stream on :8000/live
Your Blog Waterfall Display
```

---

## Testing & Troubleshooting

### ✅ Verify Stream is Running
```bash
# Check FFmpeg process
ps aux | grep ffmpeg | grep 8000

# Test HTTP stream
curl -I http://localhost:8000/live
# Should return: Content-Type: audio/mpeg

# Listen with VLC to verify
vlc http://localhost:8000/live
```

### 🔧 Common Issues

#### "Unable to connect to stream"
- ❌ FFmpeg not running → Run `./start-audio-stream-spyserver.sh`
- ❌ Wrong URL → Use `http://localhost:8000/live` (local) or `http://192.168.0.169:8000/live` (network)
- ❌ Port blocked → Check firewall: `sudo ufw allow 8000`

#### No Audio Streaming (but FFmpeg is running)
- ❌ SDR++ not connected to SpyServer → Verify connection in SDR++
- ❌ Audio output wrong → Set SDR++ output to "SDR_Audio_Stream"
- ❌ Audio muted in SDR++ → Check volume slider
- ❌ No signal → Tune to an active frequency (try 146.520 MHz FM)

#### Virtual Sink Issues
```bash
# List audio sinks
pactl list sinks short

# Recreate virtual sink
pactl unload-module module-null-sink
./start-audio-stream-spyserver.sh
```

#### Port 8000 Already in Use
```bash
# Kill old FFmpeg
pkill -f "ffmpeg.*8000.*live"

# Or find what's using it
sudo lsof -i :8000
```

---

## Running in Background

### Keep Stream Running After Terminal Closes

```bash
# Start in background
nohup ./start-audio-stream-spyserver.sh > audio-stream.log 2>&1 &

# Check logs
tail -f audio-stream.log

# Stop later
pkill -f "ffmpeg.*8000.*live"
```

---

## Advanced: Systemd Service (Auto-start)

Create `/etc/systemd/system/sdr-audio-stream.service`:

```ini
[Unit]
Description=SDR Audio Streaming Server (SpyServer Mode)
After=network.target pulseaudio.service

[Service]
Type=simple
User=matt
WorkingDirectory=/home/matt/Mattys-SDR-Blog
ExecStartPre=/usr/bin/pactl load-module module-null-sink sink_name=sdr_stream sink_properties=device.description="SDR_Audio_Stream"
ExecStart=/usr/bin/ffmpeg -f pulse -i sdr_stream.monitor -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:8000/live
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sdr-audio-stream
sudo systemctl start sdr-audio-stream

# Check status
sudo systemctl status sdr-audio-stream

# View logs
journalctl -fu sdr-audio-stream
```

---

## Remote Access for Club Members

### Local Network Access
Share this URL with club members on your network:
```
http://192.168.0.169:8000/live
```

They can paste this into the waterfall lab connection dialog.

### Internet Access (Cloudflare Tunnel)
For worldwide access without port forwarding:

```bash
# Install cloudflared (one-time)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Start tunnel
cloudflared tunnel --url http://localhost:8000

# Share the generated URL (e.g., https://xyz.trycloudflare.com/live)
```

The Cloudflare URL works from anywhere in the world! 🌍

---

## Summary

**✅ What's Fixed:**
- Blog cover images now load correctly
- Site rebuilt and restarted with updated image paths

**🎵 To Enable Live SpyServer Streaming:**
1. Configure SDR++ to connect to your SpyServer
2. Set SDR++ audio output to "SDR_Audio_Stream"  
3. Run `./start-audio-stream-spyserver.sh`
4. Connect in web interface to `http://localhost:8000/live`

**📡 Current Setup:**
- Using **SpyServer** (remote SDR server)
- No physical RTL-SDR needed on this machine
- Stream SDR audio from anywhere on the network!

**Need Help?**
- SpyServer not connecting? Check SpyServer IP/port in SDR++
- No audio? Verify SDR++ output device is "SDR_Audio_Stream"
- Stream not accessible? Try `http://$(hostname -I | awk '{print $1}'):8000/live`
- Test stream: `curl -I http://localhost:8000/live` should return HTTP 200

**Files Created:**
- `start-audio-stream-spyserver.sh` - SpyServer-specific streaming script  
- `SPYSERVER_STREAMING_GUIDE.md` - This guide

Your waterfall display will show live spectrum once everything is connected! 🎉📡
