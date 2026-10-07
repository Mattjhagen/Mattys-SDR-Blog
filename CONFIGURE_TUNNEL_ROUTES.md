# Configure Tunnel Routes - Final Step!

Your tunnel is **running and healthy** with 8 active connections! ✅

You just need to tell Cloudflare which hostnames to route through it.

## Step-by-Step Instructions

### 1. Open Cloudflare Zero Trust Dashboard
   - Go to: https://dash.cloudflare.com/
   - Click on your account
   - In the left sidebar, find **Zero Trust** (or **Cloudflare One**)
   - Click **Networks** → **Tunnels**

### 2. Find Your Tunnel
   - You should see: `mattys-sdr-blog` with status **Healthy**
   - 8 connections should be shown
   - Click on `mattys-sdr-blog`

### 3. Configure Public Hostnames
   - Click the **"Public Hostname"** tab (or "Configure" if you see that)
   - Click **"Add a public hostname"**

### 4. Add Root Domain Route
   ```
   Subdomain:  (leave blank or type @)
   Domain:     mattjhagen.xyz
   Type:       HTTP
   URL:        localhost:3001
   ```
   - Click **Save hostname**

### 5. Add WWW Subdomain Route
   - Click **"Add a public hostname"** again
   ```
   Subdomain:  www
   Domain:     mattjhagen.xyz  
   Type:       HTTP
   URL:        localhost:3001
   ```
   - Click **Save hostname**

## What This Does

This tells Cloudflare:
- When someone visits `https://mattjhagen.xyz` → route through your tunnel to `localhost:3001`
- When someone visits `https://www.mattjhagen.xyz` → same thing

## After Configuring

Wait about 30 seconds, then test:

```bash
curl -I https://mattjhagen.xyz
```

You should see:
```
HTTP/2 200
x-powered-by: Express
...
```

Then visit in your browser: **https://mattjhagen.xyz** 🎉

## Verify Everything

Run the status checker:
```bash
~/Mattys-SDR-Blog/check-blog.sh
```

## Current Status
✅ Tunnel Created: ec54e2a6-bbb7-4ca7-895f-7c747e05bdf4
✅ Tunnel Running: 8 active connections
✅ DNS Records: CNAME pointing to tunnel
✅ Blog Server: Running on localhost:3001
⏳ **Waiting for:** Public hostname configuration in dashboard

---

Once you add those two public hostnames, your Ham Radio blog will be **LIVE**! 📡
