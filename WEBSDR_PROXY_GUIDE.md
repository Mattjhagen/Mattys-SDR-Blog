# ✅ WebSDR Proxy - Live Feeds Working Now!

## What I Just Fixed

Your blog server now has a **WebSDR proxy** that solves the HTTPS/HTTP mixed content blocking!

**How it works:**
1. Browser makes HTTPS request to your server
2. Server forwards to HTTP WebSDR
3. Audio streams back through the proxy
4. No CORS or mixed content errors! ✅

---

## 🎵 Use These URLs in Your Waterfall (They Work!)

### University of Twente WebSDR - 20m FT8 Band

**URL to use in your blog:**
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=14074usb
```

**What you'll hear:**
- 14.074 MHz FT8 digital mode activity
- Live HF signals from around the world
- Real-time SDR from the Netherlands

---

### Other Live Frequencies Through the Proxy

**40m Band (7.125 MHz USB):**
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=7125usb
```

**20m Band (14.230 MHz USB voice):**
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=14230usb
```

**80m Band (3.800 MHz LSB voice):**
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=3800lsb
```

---

## 🚀 How to Connect

### Step 1: Go to Your Waterfall
Open https://mattjhagen.xyz and click "Waterfall Lab"

### Step 2: Click "Live RTL-SDR v4" Button
Make sure you're in Live mode (not Simulator)

### Step 3: Click "Connect to Live Station"

### Step 4: Paste the Proxy URL
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=14074usb
```

### Step 5: Click "Connect & Listen Live"

### Step 6: Enjoy Real Live SDR Audio! 🎉

---

## 📡 Available Frequencies

The Twente WebSDR covers these amateur radio bands:

| Band | Frequency Range | Mode | Activity |
|------|----------------|------|----------|
| **80m** | 3.5-4.0 MHz | LSB | Voice/CW |
| **40m** | 7.0-7.3 MHz | LSB/USB | Voice/Digital |
| **20m** | 14.0-14.35 MHz | USB | Voice/FT8/CW |
| **17m** | 18.068-18.168 MHz | USB | Voice/Digital |
| **15m** | 21.0-21.45 MHz | USB | Voice/Digital |
| **10m** | 28.0-29.7 MHz | USB/FM | Voice/Digital |

---

## 🌍 Other Public WebSDRs You Can Use

Format: `https://mattjhagen.xyz/api/websdr-proxy?url=[WebSDR-URL]`

### KiwiSDR Network Examples:

**Russia (RV3ANH):**
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://kiwi.rv3anh.ru:8073/
```

**Czech Republic:**
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://kiwisdr.sk-net.cz:8073/
```

**China:**
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://szsdr.ddns.net:8073/
```

---

## ⚙️ Understanding the Proxy URL Format

```
https://mattjhagen.xyz/api/websdr-proxy?url=[TARGET-URL]
```

**Example:**
```
Original WebSDR: http://websdr.ewi.utwente.nl:8901/?tune=14074usb
Proxied through your server: https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=14074usb
```

The `?url=` parameter tells your server what to fetch and stream back to you.

---

## 🎛️ Tuning to Different Frequencies

The Twente WebSDR URL format:
```
http://websdr.ewi.utwente.nl:8901/?tune=[frequency][mode]
```

**Examples:**
- `?tune=14074usb` - 14.074 MHz USB (FT8)
- `?tune=14230usb` - 14.230 MHz USB (Voice)
- `?tune=7125usb` - 7.125 MHz USB (40m Voice)
- `?tune=3800lsb` - 3.800 MHz LSB (80m Voice)

Wrap it in the proxy:
```
https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=14074usb
```

---

## 🔧 Troubleshooting

### "Unable to connect"
- Check that your blog server is running: `ps aux | grep "node server.js"`
- Restart if needed: `kill $(cat server.pid) && node server.js > server.log 2>&1 &`

### No audio/silence
- Try a different frequency (might be no activity on that band)
- Check the WebSDR website directly to see if it's online
- Try a different WebSDR server

### Check server logs:
```bash
tail -f ~/Mattys-SDR-Blog/server.log
```

You should see:
```
🌐 Proxying WebSDR: http://websdr.ewi.utwente.nl:8901/?tune=14074usb
```

---

## 📊 What's Popular Right Now?

**Best times for activity:**

| Band | Best Time (UTC) | What to Hear |
|------|-----------------|--------------|
| **20m** | 12:00-20:00 | FT8, Voice, CW - Worldwide DX |
| **40m** | 00:00-06:00 | Voice nets, ragchews |
| **80m** | 22:00-08:00 | Regional voice contacts |
| **10m** | During solar peaks | Sporadic E, voice, FM |

**Try 14.074 MHz (20m FT8) first - usually the busiest!**

---

## 🚀 Summary

**Old method (didn't work):**
```
❌ http://websdr.ewi.utwente.nl:8901/?tune=14074usb
   → Mixed content blocked by browser
```

**New method (works!):**
```
✅ https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=14074usb
   → Proxied through your server, HTTPS, no errors!
```

---

## When Your RTL-SDR Arrives

Once your RTL-SDR Blog v4 arrives, you'll use:
```bash
./start-audio-stream-cloudflare.sh
```

And get your own **local receiver** instead of public WebSDRs! But until then, enjoy real live SDR feeds from around the world! 🌍📡

---

**Go try it now!**

1. Open https://mattjhagen.xyz
2. Click "Waterfall Lab"
3. Paste: `https://mattjhagen.xyz/api/websdr-proxy?url=http://websdr.ewi.utwente.nl:8901/?tune=14074usb`
4. Connect!
5. **Hear real live FT8 signals!** 🎵

You're now listening to a live SDR receiver in the Netherlands! 🇳🇱
