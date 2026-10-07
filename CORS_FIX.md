# CORS Error Fix - Audio Streaming

## The Problem

You're getting this error:
```
Unable to connect to stream at http://localhost:8000/live
Verify your Linux FFmpeg/Icecast streamer is active on port 8000, or check CORS settings.
```

**Root Cause:** CORS (Cross-Origin Resource Sharing) blocking!

- Your blog: `https://mattjhagen.xyz` (served via Cloudflare)
- Audio stream: `http://localhost:8000` (local FFmpeg)
- Browser security blocks connections between different origins

## ✅ The Fix - Add CORS Headers

### Step 1: Stop Current Stream

In the terminal where FFmpeg is running, press **Ctrl+C**

Or from another terminal:
```bash
pkill -f "ffmpeg.*8000"
```

### Step 2: Start Stream with CORS Headers

```bash
cd ~/Mattys-SDR-Blog
./start-audio-stream-cors.sh
```

This new version includes CORS headers that tell the browser "it's okay to connect from any origin".

### Step 3: Connect in Your Blog

1. Go to https://mattjhagen.xyz
2. Click "Waterfall Lab"
3. Connect to: `http://localhost:8000/live`
4. Should work now! ✅

---

## What Changed?

**Old command** (no CORS):
```bash
ffmpeg -f pulse -i default -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:8000/live
```

**New command** (with CORS):
```bash
ffmpeg -re -f pulse -i default \
    -c:a libmp3lame -b:a 128k \
    -f mp3 -listen 1 \
    -headers 'Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, OPTIONS\r\n' \
    http://0.0.0.0:8000/live
```

The `-headers` flag adds HTTP headers that allow cross-origin requests.

---

## Alternative Solutions

If the CORS fix doesn't work, here are other options:

### Option A: Use Cloudflare Tunnel (Public Access)

```bash
# Install cloudflared (one-time)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Start tunnel (in another terminal)
cloudflared tunnel --url http://localhost:8000

# This gives you a public URL like: https://xyz.trycloudflare.com
# Use that URL + /live in your blog: https://xyz.trycloudflare.com/live
```

**Benefits:**
- ✅ HTTPS (matches your blog)
- ✅ Works from anywhere
- ✅ No CORS issues (proper origin)

### Option B: Proxy Through Your Blog Server

Add a proxy route in `server.js` to forward requests to FFmpeg:

```javascript
// Add this to server.js
const proxy = require('http-proxy-middleware');

app.use('/audio-stream', proxy.createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/audio-stream': '/live'
  }
}));
```

Then connect to: `https://mattjhagen.xyz/audio-stream`

---

## Testing the CORS Fix

### Test 1: Check CORS Headers
```bash
curl -I -H "Origin: https://mattjhagen.xyz" http://localhost:8000/live
```

You should see:
```
Access-Control-Allow-Origin: *
```

### Test 2: Try in Browser Console

Open https://mattjhagen.xyz, open browser console (F12), and run:
```javascript
fetch('http://localhost:8000/live')
  .then(r => console.log('✅ Connected!', r))
  .catch(e => console.log('❌ Failed:', e));
```

Should log: `✅ Connected!`

---

## Troubleshooting

### Still Getting CORS Error?

**Try mixed content issue:**
- Your blog is `https://` (secure)
- Stream is `http://` (insecure)
- Browsers block mixed content by default

**Solution:** Use Cloudflare tunnel to get HTTPS for the stream.

### Connection Refused?

**Check FFmpeg is running:**
```bash
ps aux | grep ffmpeg | grep 8000
```

**Check it's listening:**
```bash
ss -tlnp | grep 8000
```

### "ERR_CONNECTION_REFUSED" in browser?

The URL `http://localhost:8000/live` only works if you're on the same machine as the server.

**From another device:**
- Use: `http://192.168.0.169:8000/live`
- Or use Cloudflare tunnel for public access

---

## Quick Reference

| Issue | Solution |
|-------|----------|
| CORS error | Use `./start-audio-stream-cors.sh` |
| Mixed content (https→http) | Use Cloudflare tunnel |
| Connection from other device | Use `http://192.168.0.169:8000/live` |
| Want public access | Use Cloudflare tunnel |

---

## Recommended Setup

For the best experience:

1. **Run FFmpeg with CORS headers** (try this first)
   ```bash
   ./start-audio-stream-cors.sh
   ```

2. **If that doesn't work, use Cloudflare tunnel**
   ```bash
   cloudflared tunnel --url http://localhost:8000
   # Use the generated https URL
   ```

3. **For permanent setup, proxy through your blog server**
   - No CORS issues
   - Same origin as your blog
   - Professional setup

---

## Summary

🔴 **Error:** CORS blocking browser connection to audio stream

✅ **Fix:** Run `./start-audio-stream-cors.sh` (adds CORS headers)

🚀 **Better:** Use Cloudflare tunnel for HTTPS + public access

📡 **Connect to:** `http://localhost:8000/live` (with CORS script)

Try the CORS script now and let me know if it works!
