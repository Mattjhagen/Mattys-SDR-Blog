# Port 8000 Conflict - Quick Fix

## The Problem

When you tried to run the audio streaming script, you got:
```
Error opening output http://0.0.0.0:8000/live: Address already in use
```

This means **something is already using port 8000** on your system.

## Quick Solution - Use Port 8001 Instead

**Run this instead:**
```bash
./start-audio-stream-port8001.sh
```

**Then connect to:** `http://localhost:8001/live` (note: 8001, not 8000!)

---

## Finding What's Using Port 8000

### Check what's listening on port 8000:
```bash
# Basic check (no process info without sudo)
ss -tlnp | grep 8000

# With sudo (shows process)
sudo lsof -i :8000

# Alternative
sudo fuser 8000/tcp
```

### Common culprits:
- Python's `http.server` (`python3 -m http.server 8000`)
- Another FFmpeg instance
- Development web server
- Docker container
- Old zombie process

---

## Killing the Process on Port 8000

Once you find what's using it:

### If it's FFmpeg:
```bash
pkill -f "ffmpeg.*8000"
```

### If it's Python http.server:
```bash
pkill -f "python.*8000"
# or
pkill -f "http.server.*8000"
```

### If you know the PID (from lsof):
```bash
sudo kill <PID>
# Example: sudo kill 12345
```

### Nuclear option (kill all processes on port 8000):
```bash
sudo fuser -k 8000/tcp
```

---

## Using the Original Port (8000)

After killing whatever was on port 8000, you can use the original scripts:

```bash
./start-audio-stream-simple.sh
```

And connect to: `http://localhost:8000/live`

---

## Which Port Should You Use?

| Port | Script | When to Use |
|------|--------|-------------|
| **8000** | `start-audio-stream-simple.sh` | After clearing port 8000 |
| **8001** | `start-audio-stream-port8001.sh` | Quick workaround (works now) |

**Both ports work the same way** - just use the matching URL in your web interface!

---

## Current Situation

Your system shows:
```bash
$ ss -tlnp | grep 8000
LISTEN 0  4096  0.0.0.0:8000  0.0.0.0:*
```

**Port 8000 is in use**, but we can't see what process without sudo.

---

## Recommended Action

**Option A: Use port 8001 right now** (easiest)
```bash
./start-audio-stream-port8001.sh
# Connect to: http://localhost:8001/live
```

**Option B: Free up port 8000 first** (if you want to use 8000)
```bash
# Check what's using it
sudo lsof -i :8000

# Kill it (adjust PID from lsof output)
sudo kill <PID>

# OR try killing common services
pkill -f "ffmpeg.*8000"
pkill -f "python.*8000"

# Then run
./start-audio-stream-simple.sh
# Connect to: http://localhost:8000/live
```

---

## Testing the Stream

Once running (on either port), test it:

```bash
# Test locally
curl -I http://localhost:8001/live
# Should return: Content-Type: audio/mpeg

# Listen with VLC
vlc http://localhost:8001/live
```

---

## Summary

✅ **Quick fix:** Use `./start-audio-stream-port8001.sh` and connect to port 8001

🔧 **Proper fix:** Find and kill what's on port 8000, then use port 8000

🎵 **Either way works** - just match the port in your web interface connection URL!
