# Cloudflare Dashboard Configuration

## Service URL Options

Your tunnel is running on the **same server** as your blog, so use:

### ✅ Recommended (Try in this order):

1. **`localhost:3001`** - Standard, should work
2. **`127.0.0.1:3001`** - IP version of localhost
3. **`http://localhost:3001`** - With protocol (if dashboard requires it)
4. **`http://127.0.0.1:3001`** - With protocol

### Your Server Info (for reference):

- **Local Network IP:** 192.168.0.169
- **Tailscale IP:** 100.103.3.35
- **Blog Server Port:** 3001

### ❌ Don't Use These:

- ~~`100.103.3.35:3001`~~ (Tailscale IP - unnecessary routing)
- ~~`192.168.0.169:3001`~~ (LAN IP - not needed for same-machine)

## Complete Configuration

### In Cloudflare Zero Trust Dashboard:

**Navigate to:**
1. https://dash.cloudflare.com/
2. Zero Trust → Networks → Tunnels
3. Click `mattys-sdr-blog`
4. Click "Public Hostname" tab
5. Click "+ Add a public hostname"

### Route 1: Root Domain

```
Public hostname
├─ Subdomain:  (leave blank or type @)
└─ Domain:     mattjhagen.xyz

Service
├─ Type:       HTTP
└─ URL:        localhost:3001
```

**Save hostname**

### Route 2: WWW Subdomain

```
Public hostname
├─ Subdomain:  www
└─ Domain:     mattjhagen.xyz

Service
├─ Type:       HTTP
└─ URL:        localhost:3001
```

**Save hostname**

## How Cloudflare Tunnels Work

```
User's Browser
     ↓
https://mattjhagen.xyz
     ↓
Cloudflare Edge (SSL termination)
     ↓
[Encrypted Tunnel]
     ↓
cloudflared (running on YOUR server)
     ↓
localhost:3001 (your blog server, SAME machine)
     ↓
Express serves static files
```

The tunnel and blog are on the **same machine**, so `localhost` is correct!

## After Configuration

1. **Wait:** 30-60 seconds for config to propagate
2. **Test:** `curl -I https://mattjhagen.xyz`
3. **Browser:** Open https://mattjhagen.xyz in browser
4. **Expected:** Your Ham Radio blog loads!

## Verification Commands

```bash
# Check blog server is running
curl -I http://localhost:3001

# Check tunnel is connected
ps aux | grep cloudflared | grep mattys

# Check tunnel logs
tail -f ~/Mattys-SDR-Blog/tunnel.log

# Full status check
~/Mattys-SDR-Blog/check-blog.sh
```

## Troubleshooting

### If dashboard won't accept `localhost`:

Try these alternatives:
- `127.0.0.1:3001`
- `http://localhost:3001` (with protocol)
- `http://127.0.0.1:3001`

### If you get "connection refused":

Check the blog server is running:
```bash
ps aux | grep "node server.js"
curl http://localhost:3001
```

If not running, restart it:
```bash
cd ~/Mattys-SDR-Blog
node server.js > server.log 2>&1 &
echo $! > server.pid
```

### If tunnel shows "unhealthy":

Restart the tunnel:
```bash
kill $(cat ~/Mattys-SDR-Blog/tunnel.pid)
cd ~/Mattys-SDR-Blog
cloudflared tunnel --config cloudflare-tunnel.yml run mattys-sdr-blog > tunnel.log 2>&1 &
echo $! > tunnel.pid
```

## Current Status

✅ Blog Server: Running on port 3001  
✅ Tunnel: Healthy and connected  
✅ DNS: CNAME records configured  
⏳ Waiting for: Public hostname routes in dashboard

Once you add those routes, your blog will be live! 🎉
