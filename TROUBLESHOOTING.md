# Site Not Loading? Troubleshooting Guide

## ✅ Server Status: ALL SYSTEMS GO!

From server tests, everything is working:
- ✅ HTTP/2 200 responses
- ✅ HTML loading correctly
- ✅ JavaScript bundle (766 KB) serving
- ✅ CSS loading
- ✅ Cloudflare caching active
- ✅ Blog server running on port 3001
- ✅ Tunnel healthy with active connections

**The site IS working server-side!**

## 🔍 Common Browser Issues

### Issue 1: Browser Cache

**Symptoms:** Blank page, old version, or "not found"

**Fix:**
1. **Hard Refresh** (clears cache for current page):
   - **Windows/Linux:** `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac:** `Cmd + Shift + R`

2. **Clear All Browser Cache:**
   - **Chrome:** `⋮` menu → Settings → Privacy → Clear browsing data → Select "Cached images and files" → Clear data
   - **Firefox:** `≡` menu → Settings → Privacy & Security → Clear Data → Check "Cached Web Content" → Clear
   - **Safari:** Safari menu → Clear History → Select "all history" → Clear History

3. **Try Incognito/Private Mode:**
   - `Ctrl + Shift + N` (Chrome) or `Ctrl + Shift + P` (Firefox)
   - If it works here, it's definitely a cache issue

### Issue 2: DNS Cache

**Symptoms:** "Site can't be reached" or old IP

**Fix - Flush DNS Cache:**

**Windows:**
```cmd
ipconfig /flushdns
```

**macOS:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Linux:**
```bash
sudo systemd-resolve --flush-caches
# or
sudo /etc/init.d/nscd restart
```

### Issue 3: React App Not Rendering

**Symptoms:** Blank white page

**Diagnostic:**
1. Open Developer Tools (F12)
2. Check **Console** tab for JavaScript errors
3. Check **Network** tab - are assets loading?

**Common causes:**
- JavaScript disabled
- Ad blocker blocking scripts
- CORS issues (shouldn't happen but check)

### Issue 4: DNS Not Propagated Yet

**Check propagation:**
```bash
# From your server
dig mattjhagen.xyz

# Or visit
https://dnschecker.org/#A/mattjhagen.xyz
```

Should show: Cloudflare IPs (104.21.x.x or 172.67.x.x)

**If showing old IPs:**
- Wait 5-10 more minutes
- Try using Cloudflare's DNS: 1.1.1.1 or 1.0.0.1

## 🧪 Quick Tests You Can Run

### Test 1: Command Line Check (from your machine)
```bash
curl -I https://mattjhagen.xyz
```
**Expected:** `HTTP/2 200`

### Test 2: Download the HTML
```bash
curl https://mattjhagen.xyz > test.html
cat test.html
```
**Expected:** Should see HTML with "73 On The Air" title

### Test 3: Test JavaScript Loading
```bash
curl -I https://mattjhagen.xyz/assets/index-CLiZaRCN.js
```
**Expected:** `HTTP/2 200` with `content-type: application/javascript`

### Test 4: Check from Different Network
- Try on your phone using mobile data (not WiFi)
- If it works there, it's your local DNS/cache

## 🔧 What to Tell Me

To help diagnose, let me know:

1. **What you see:**
   - Blank page?
   - Error message? (exact text)
   - Loading spinner that never finishes?
   - Something else?

2. **Browser Console Errors:**
   - Press F12
   - Go to Console tab
   - Copy any red error messages

3. **Network Tab:**
   - Press F12
   - Go to Network tab
   - Reload page
   - Are files turning red (failed) or green (success)?

4. **Test Results:**
   ```bash
   curl -I https://mattjhagen.xyz
   dig mattjhagen.xyz
   ```

## ✅ Verified Working

These tests from the server confirm everything is functioning:

```
✅ curl https://mattjhagen.xyz
   Returns: HTTP/2 200
   Content: Full HTML with title "73 On The Air"

✅ curl https://mattjhagen.xyz/assets/index-CLiZaRCN.js
   Returns: HTTP/2 200
   Size: 766 KB JavaScript bundle

✅ Server Process
   node server.js running (PID in server.pid)

✅ Tunnel Status
   cloudflared running with 4+ active connections
   
✅ DNS
   mattjhagen.xyz → Cloudflare IPs
   CNAME → tunnel target
```

## 🆘 Still Having Issues?

Run the status check:
```bash
~/Mattys-SDR-Blog/check-blog.sh
```

Check logs:
```bash
tail -50 ~/Mattys-SDR-Blog/server.log
tail -50 ~/Mattys-SDR-Blog/tunnel.log
```

---

**Most likely solution: Hard refresh your browser (Ctrl+Shift+R) or try Incognito mode!**
