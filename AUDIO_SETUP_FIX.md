# Audio System Setup Fix

## Issue: PulseAudio/PipeWire Error

When you ran `./start-audio-stream-spyserver.sh`, you got:
```
❌ PulseAudio/PipeWire is not running!
```

## What's Actually Happening

**Good news:** PipeWire IS running! 
```bash
$ systemctl --user status pipewire
● pipewire.service - PipeWire Multimedia Service
     Active: active (running) since Wed 2026-10-07 00:29:03 UTC
```

**The problem:** The `pactl` command (PulseAudio command-line tool) isn't installed. Your system uses PipeWire (which is modern and better), but the script was checking for `pactl` which is the old PulseAudio tool.

## Solutions

You have **3 options** to fix this:

### Option 1: Simple Script (Easiest - Try This First)

Use the simplified script that doesn't need virtual sinks:

```bash
cd ~/Mattys-SDR-Blog
./start-audio-stream-simple.sh
```

This will:
- ✅ Work with PipeWire directly
- ✅ Stream whatever audio is currently playing
- ✅ No complex virtual sink setup needed

**Then connect in web interface to:** `http://localhost:8000/live`

---

### Option 2: Install PulseAudio Compatibility Layer

Install the PulseAudio compatibility tools for PipeWire:

```bash
sudo apt install -y pipewire-pulse pulseaudio-utils
```

After installing, the original script will work:
```bash
./start-audio-stream-spyserver.sh
```

This gives you:
- ✅ The `pactl` command for managing audio
- ✅ Virtual sinks for routing audio
- ✅ Better control over audio routing

---

### Option 3: Native PipeWire Script

Use the PipeWire-native script (uses `wpctl` instead of `pactl`):

```bash
./start-audio-stream-pipewire.sh
```

This:
- ✅ Uses PipeWire's native commands (`wpctl`, `pw-cli`)
- ✅ Creates virtual sinks the PipeWire way
- ✅ Doesn't require PulseAudio compatibility

---

## Recommended Approach

**For quick testing:** Use Option 1 (simple script)

**For permanent setup:** Install the compatibility layer (Option 2)

```bash
# 1. Install compatibility tools
sudo apt install -y pipewire-pulse pulseaudio-utils

# 2. Then the original script works
./start-audio-stream-spyserver.sh
```

---

## How to Use (All Options)

### 1. Configure SDR++
- **Source:** SpyServer Client
- **Connect** to your SpyServer
- **Audio Output:** Choose any available sink (doesn't matter which for simple script)

### 2. Start Streaming
Choose one:
```bash
./start-audio-stream-simple.sh        # Easiest
./start-audio-stream-spyserver.sh     # After installing pulseaudio-utils
./start-audio-stream-pipewire.sh      # Native PipeWire
```

### 3. Connect in Web Interface
- Go to https://mattjhagen.xyz
- Click "Waterfall Lab"
- Connect to: `http://localhost:8000/live`

---

## Checking Your Audio System

### See what audio sinks are available:
```bash
wpctl status
```

### List available audio devices for FFmpeg:
```bash
ffmpeg -f pulse -list_devices true -i dummy 2>&1 | grep -i "sink\|source"
```

### Test if PipeWire is working:
```bash
systemctl --user status pipewire
# Should show: active (running)
```

---

## Troubleshooting

### "No audio in stream"
1. Make sure SDR++ is actually playing audio (not muted)
2. Check that audio is working on your system: `speaker-test -t wav -c 2`
3. Try the simple script first to rule out virtual sink issues

### "Connection refused" 
```bash
# Check if FFmpeg is running
ps aux | grep ffmpeg | grep 8000

# Check the port is listening
ss -tlnp | grep 8000
```

### "Can't find audio device"
```bash
# List all audio devices
wpctl status

# Try ALSA instead of pulse
ffmpeg -f alsa -i default -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:8000/live
```

---

## Quick Reference

| Script | Best For | Requires |
|--------|----------|----------|
| `start-audio-stream-simple.sh` | Quick testing | Just FFmpeg |
| `start-audio-stream-spyserver.sh` | Full setup | pulseaudio-utils |
| `start-audio-stream-pipewire.sh` | PipeWire native | wpctl/pw-cli (built-in) |

---

## Summary

**Your System Has:**
- ✅ PipeWire (modern audio system)
- ✅ FFmpeg (for encoding)
- ✅ wpctl/pw-cli (PipeWire tools)
- ❌ pactl (PulseAudio tool) - not installed

**Quick Fix:**
```bash
# Try the simple script first
./start-audio-stream-simple.sh

# Or install compatibility and use full-featured script
sudo apt install -y pipewire-pulse pulseaudio-utils
./start-audio-stream-spyserver.sh
```

**Then connect at:** `http://localhost:8000/live`

Your waterfall will come alive! 📡🎵
