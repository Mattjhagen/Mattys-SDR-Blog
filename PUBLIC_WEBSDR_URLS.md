# Public WebSDR URLs - Use Until Your RTL-SDR Arrives!

## What is WebSDR?

WebSDR provides **live audio streams** from real SDR receivers around the world. You can connect to these directly in your waterfall display - no local hardware needed!

## 🌐 Public WebSDR Stations (Working Audio Streams)

### Option 1: University of Twente WebSDR (Netherlands)
**Best for: Shortwave HF bands (80m, 40m, 20m, etc.)**

```
http://websdr.ewi.utwente.nl:8901/
```

**Bands available:**
- 80m: 3.5-4.0 MHz
- 40m: 7.0-7.3 MHz  
- 20m: 14.0-14.35 MHz
- And many more!

**How to use:**
1. Go to: http://websdr.ewi.utwente.nl:8901/
2. Tune to 14.074 MHz (FT8 activity)
3. The audio URL format is: `http://websdr.ewi.utwente.nl:8901/?tune=14074usb`

---

### Option 2: KiwiSDR Network
**Best for: Global coverage, many stations**

Public KiwiSDR stations with open access:

```
http://kiwisdr.com/public/

Direct audio streams (examples):
- http://kiwi.rv3anh.ru:8073/  (Russia)
- http://szsdr.ddns.net:8073/  (China)
- http://kiwisdr.sk-net.cz:8073/  (Czech Republic)
```

**KiwiSDR provides direct audio stream URLs like:**
```
http://[server]:8073/[callsign]/audio.mp3?f=14074&mod=usb
```

---

### Option 3: SDR.hu Network
**Best for: VHF/UHF and HF**

```
http://sdr.hu/
```

Browse available receivers and connect to their audio streams.

---

## 🚀 Quick Test - Use This Now!

### WebSDR Twente (Most Reliable)

**20m FT8 Stream:**
```
http://websdr.ewi.utwente.nl:8901/?tune=14074usb
```

**Try in your blog:**
1. Go to https://mattjhagen.xyz
2. Click "Waterfall Lab"
3. Paste this URL: `http://websdr.ewi.utwente.nl:8901/?tune=14074usb`
4. Click Connect

**Note:** This is HTTP (not HTTPS), so you might need to:
- Allow mixed content in your browser, OR
- Use the Cloudflare tunnel method we set up earlier

---

## Alternative: Use a Public SpyServer (For SDR++ Locally)

If you want to use SDR++ connected to a public SpyServer:

### Public SpyServers:

```
airspy.com:5555
sdr.swl.su:5555
```

**How to use:**
1. Open SDR++
2. Select "SpyServer Client" as source
3. Connect to: `airspy.com:5555`
4. Set audio output to stream (as we configured earlier)
5. Run your local FFmpeg streaming script
6. Connect to: `http://localhost:8000/live` in your blog

---

## Best Solution Until RTL-SDR Arrives

**Option A: Use Public WebSDR (Easiest)**
- No local software needed
- Just paste the URL in your waterfall
- Works immediately (but might have CORS/mixed content issues)

**Option B: Use Public SpyServer + Local SDR++ + FFmpeg**
- More control
- Better quality
- Requires running SDR++ and FFmpeg locally
- Use the scripts we created earlier

**Option C: Use Simulator Mode**
- Your waterfall has a built-in simulator!
- Switch to "RF Simulator" mode in the interface
- Practice with synthetic signals until your RTL-SDR arrives

---

## Testing WebSDR Connection

### Test in VLC first:
```bash
vlc http://websdr.ewi.utwente.nl:8901/?tune=14074usb
```

If it works in VLC, it should work in your blog!

---

## When Your RTL-SDR Arrives

Once your RTL-SDR Blog v4 arrives, you'll run:
```bash
./start-audio-stream-cloudflare.sh
```

And use your own local receiver instead of public WebSDRs! 📡

---

## Summary

**Right Now (No RTL-SDR):**
- ✅ Try WebSDR: `http://websdr.ewi.utwente.nl:8901/?tune=14074usb`
- ✅ Or use public SpyServer: `airspy.com:5555` with local SDR++
- ✅ Or use Simulator Mode in your waterfall

**When RTL-SDR Arrives:**
- 🚀 Use your own hardware with Cloudflare tunnel
- 🎵 Full control over frequency and settings

Try the WebSDR URL in your waterfall now! It's a real live audio stream from the Netherlands! 🇳🇱📡
