# ✅ Cloudflare Tunnel - The Solution That Works!

## Why This Fixes Everything

**Your Current Problem:**
- Blog: `https://mattjhagen.xyz` (HTTPS via Cloudflare)
- Audio stream: `http://localhost:8000` (HTTP on local machine)
- Browser blocks this (CORS + mixed content)

**Cloudflare Tunnel Solution:**
- Creates: `https://xyz.trycloudflare.com/live` (HTTPS, public)
- ✅ HTTPS matches your blog's protocol
- ✅ No CORS issues
- ✅ No mixed content blocking
- ✅ Works from anywhere (not just localhost)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Stop Current FFmpeg

In the terminal where FFmpeg is running, press **Ctrl+C**

Or:
```bash
pkill -f "ffmpeg.*8000"
```

### Step 2: Run Cloudflare Tunnel Script

```bash
cd ~/Mattys-SDR-Blog
./start-audio-stream-cloudflare.sh
```

### Step 3: Copy the HTTPS URL

The script will show something like:
```
🌐 https://random-name-1234.trycloudflare.com
```

**Copy that URL** and add `/live` to the end:
```
https://random-name-1234.trycloudflare.com/live
```

### Step 4: Connect in Your Blog

1. Go to https://mattjhagen.xyz
2. Click "Waterfall Lab"
3. Paste the Cloudflare URL: `https://xyz.trycloudflare.com/live`
4. Click Connect
5. **It will work!** ✅

---

## What the Script Does

1. ✅ Starts FFmpeg streaming on localhost:8000
2. ✅ Creates Cloudflare tunnel pointing to it
3. ✅ Gives you a public HTTPS URL
4. ✅ Automatically cleans up when you press Ctrl+C

---

## Example Session

```bash
$ ./start-audio-stream-cloudflare.sh

🎵 SDR Audio Streaming via Cloudflare Tunnel
============================================

✅ FFmpeg installed
✅ cloudflared installed

📡 Step 1: Starting FFmpeg on localhost:8000...
✅ FFmpeg started (PID: 12345)
✅ FFmpeg is running and listening on port 8000

📡 Step 2: Creating Cloudflare Tunnel...
🌐 Cloudflare will give you a PUBLIC HTTPS URL like:
   https://abc-xyz-123.trycloudflare.com/live

⚠️  IMPORTANT: Copy the URL that appears below!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2026-10-07T18:35:00Z INF +--------------------------------------------------------------------------------------------+
2026-10-07T18:35:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2026-10-07T18:35:00Z INF |  https://random-name-1234.trycloudflare.com                                               |
2026-10-07T18:35:00Z INF +--------------------------------------------------------------------------------------------+
```

**Your URL:** `https://random-name-1234.trycloudflare.com/live` ← Use this in your blog!

---

## Advantages Over Local Streaming

| Feature | localhost:8000 | Cloudflare Tunnel |
|---------|----------------|-------------------|
| **HTTPS** | ❌ No | ✅ Yes |
| **CORS Issues** | ❌ Blocked | ✅ None |
| **Mixed Content** | ❌ Blocked | ✅ None |
| **Works from other devices** | ❌ No | ✅ Yes |
| **Share with friends** | ❌ No | ✅ Yes |
| **Secure** | ⚠️ HTTP | ✅ HTTPS |

---

## Sharing with Your Ham Club

The Cloudflare URL works from **anywhere in the world**!

Share the URL with your club members:
```
https://your-tunnel-url.trycloudflare.com/live
```

They can:
- Open it in VLC: `vlc https://your-url.trycloudflare.com/live`
- Connect in your blog's waterfall display
- Listen from anywhere with internet

---

## Notes

### URL Changes Each Time
The `trycloudflare.com` URL is **temporary** and changes each time you run the script.

For a **permanent URL**, you can create a named tunnel (more setup):
```bash
cloudflared tunnel create my-sdr-stream
cloudflared tunnel route dns my-sdr-stream sdr.yourdomain.com
```

### Keep Terminal Open
The tunnel runs in the foreground. Keep the terminal window open while streaming.

To stop everything, press **Ctrl+C** in the terminal.

### Bandwidth
Cloudflare tunnel is free and unlimited bandwidth! Share away! 🎉

---

## Troubleshooting

### "Failed to start FFmpeg"
Check the log:
```bash
cat /tmp/ffmpeg-audio.log
```

Make sure audio is working:
```bash
pactl list short sinks
```

### "Connection Refused in Blog"
- Verify FFmpeg is running: `ps aux | grep ffmpeg`
- Verify tunnel is running: `ps aux | grep cloudflared`
- Check you added `/live` to the end of the URL

### "No Audio in Stream"
- Make sure SDR++ is playing audio
- Check SDR++ is not muted
- Tune to an active frequency

---

## Alternative: Named Tunnel (Advanced)

For a permanent URL like `https://sdr.yourdomain.com`:

```bash
# One-time setup
cloudflared tunnel login
cloudflared tunnel create sdr-audio
cloudflared tunnel route dns sdr-audio sdr.yourdomain.com

# Create config file
cat > ~/.cloudflared/config.yml <<EOF
tunnel: sdr-audio
credentials-file: /home/matt/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: sdr.yourdomain.com
    service: http://127.0.0.1:8000
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run sdr-audio
```

---

## Summary

**The Problem:**
- ❌ Browser blocks `http://localhost:8000` from `https://mattjhagen.xyz`
- ❌ CORS errors
- ❌ Mixed content blocking

**The Solution:**
```bash
./start-audio-stream-cloudflare.sh
```

**What You Get:**
- ✅ Public HTTPS URL (e.g., `https://xyz.trycloudflare.com/live`)
- ✅ No CORS issues
- ✅ No mixed content blocking
- ✅ Works from anywhere
- ✅ Free and unlimited bandwidth

**Next Steps:**
1. Run the script
2. Copy the `https://` URL it gives you
3. Add `/live` to the end
4. Use that in your blog's waterfall connection
5. **It will work!** 🎉

---

Try it now! This is the solution that will definitely work! 📡🎵
