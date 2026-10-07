# Systemd Service Setup - Auto-Start on Boot

## What This Does

Creates a **systemd service** that:
- ✅ Starts your blog server automatically on boot
- ✅ Restarts the server if it crashes
- ✅ Logs output to `server.log`
- ✅ Runs as the `matt` user (not root)

---

## 🚀 Quick Setup (Automatic)

```bash
cd ~/Mattys-SDR-Blog
sudo bash setup-systemd-service.sh
```

This script will:
1. Stop the current manually-run server
2. Install the systemd service
3. Enable auto-start on boot
4. Start the service immediately
5. Show you the status

**That's it!** Your server will now survive reboots! 🎉

---

## 📋 Manual Setup (If You Prefer)

If you want to do it step-by-step:

### Step 1: Copy Service File
```bash
sudo cp ~/Mattys-SDR-Blog/mattys-sdr-blog.service /etc/systemd/system/
sudo chmod 644 /etc/systemd/system/mattys-sdr-blog.service
```

### Step 2: Reload Systemd
```bash
sudo systemctl daemon-reload
```

### Step 3: Enable Service (Start on Boot)
```bash
sudo systemctl enable mattys-sdr-blog.service
```

### Step 4: Start Service Now
```bash
sudo systemctl start mattys-sdr-blog.service
```

### Step 5: Check Status
```bash
sudo systemctl status mattys-sdr-blog.service
```

---

## 🔧 Managing the Service

### Check Status
```bash
sudo systemctl status mattys-sdr-blog
```

### Start/Stop/Restart
```bash
sudo systemctl start mattys-sdr-blog    # Start
sudo systemctl stop mattys-sdr-blog     # Stop
sudo systemctl restart mattys-sdr-blog  # Restart
```

### View Logs
```bash
# Live logs (follow mode)
sudo journalctl -u mattys-sdr-blog -f

# Last 50 lines
sudo journalctl -u mattys-sdr-blog -n 50

# Also available in:
tail -f ~/Mattys-SDR-Blog/server.log
```

### Disable Auto-Start
```bash
sudo systemctl disable mattys-sdr-blog
```

### Enable Auto-Start Again
```bash
sudo systemctl enable mattys-sdr-blog
```

---

## 🔍 Understanding the Service File

**Location:** `/etc/systemd/system/mattys-sdr-blog.service`

**Key Settings:**

```ini
[Unit]
Description=Matt's SDR Blog Server
After=network.target           # Wait for network before starting

[Service]
Type=simple
User=matt                      # Run as matt user (not root)
WorkingDirectory=/home/matt/Mattys-SDR-Blog
ExecStart=/usr/bin/node /home/matt/Mattys-SDR-Blog/server.js
Restart=always                 # Always restart if it crashes
RestartSec=10                  # Wait 10s before restarting

# Logs go to server.log
StandardOutput=append:/home/matt/Mattys-SDR-Blog/server.log
StandardError=append:/home/matt/Mattys-SDR-Blog/server.log

Environment=PORT=3001          # Server port

[Install]
WantedBy=multi-user.target     # Start at boot
```

---

## ⚠️ Important Notes

### Before Running Setup Script

**Stop your manually-run server first:**
```bash
# If you're running server manually, kill it:
kill $(cat ~/Mattys-SDR-Blog/server.pid)
```

The setup script does this automatically, but good to know!

### After Setup

**Don't start the server manually anymore!**

Instead of:
```bash
# ❌ Old way (manual)
node server.js &
```

Use:
```bash
# ✅ New way (systemd)
sudo systemctl start mattys-sdr-blog
```

### Updating Your Blog

When you rebuild or update your blog:

```bash
cd ~/Mattys-SDR-Blog
npm run build                        # Rebuild
sudo systemctl restart mattys-sdr-blog  # Restart service
```

---

## 🧪 Testing the Service

### Test 1: Check Service is Running
```bash
sudo systemctl status mattys-sdr-blog

# Should show:
# ● mattys-sdr-blog.service - Matt's SDR Blog Server
#    Active: active (running)
```

### Test 2: Check Website Responds
```bash
curl -I http://localhost:3001

# Should return: HTTP/1.1 200 OK
```

### Test 3: Check Public Access
```bash
curl -I https://mattjhagen.xyz

# Should return: HTTP/2 200
```

### Test 4: Test Restart on Crash
```bash
# Kill the process
sudo pkill -9 -f "node.*server.js"

# Wait 10 seconds
sleep 10

# Check if it restarted
sudo systemctl status mattys-sdr-blog

# Should show: Active: active (running)
```

### Test 5: Test Reboot Persistence
```bash
# Reboot the server
sudo reboot

# After reboot, check if service started
sudo systemctl status mattys-sdr-blog
```

---

## 🐛 Troubleshooting

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u mattys-sdr-blog -n 50
```

**Common issues:**
- Port 3001 already in use
- Node.js not installed or not at `/usr/bin/node`
- Wrong file permissions

**Fix port conflict:**
```bash
# Find what's using port 3001
sudo lsof -i :3001

# Kill it
sudo kill <PID>

# Restart service
sudo systemctl restart mattys-sdr-blog
```

### Service Crashes Immediately

**Check the logs:**
```bash
cat ~/Mattys-SDR-Blog/server.log
```

**Verify Node.js path:**
```bash
which node
# Should output: /usr/bin/node
```

If it's different, update the service file's `ExecStart` path.

### Service Won't Enable

```bash
# Make sure service file has correct permissions
sudo chmod 644 /etc/systemd/system/mattys-sdr-blog.service

# Reload systemd
sudo systemctl daemon-reload

# Try again
sudo systemctl enable mattys-sdr-blog
```

---

## 📊 Service Status Meanings

| Status | Meaning |
|--------|---------|
| **active (running)** | ✅ Service is working |
| **inactive (dead)** | ⚠️ Service stopped |
| **failed** | ❌ Service crashed |
| **activating (start)** | ⏳ Service starting |

---

## 🔄 Related Services

You might also want to set up:

### 1. Cloudflare Tunnel Service
For the tunnel to survive reboots too:
```bash
# See existing tunnel config
ls ~/.cloudflared/
```

### 2. Audio Streaming Service
For FFmpeg audio streaming (when you have RTL-SDR):
```bash
# We can create a systemd service for this too!
```

Would you like me to create systemd services for these as well?

---

## ✅ Summary

**Files Created:**
- `mattys-sdr-blog.service` - Systemd service definition
- `setup-systemd-service.sh` - Automatic setup script
- `SYSTEMD_SERVICE_GUIDE.md` - This guide

**To Install:**
```bash
cd ~/Mattys-SDR-Blog
sudo bash setup-systemd-service.sh
```

**To Manage:**
```bash
sudo systemctl status mattys-sdr-blog     # Status
sudo systemctl restart mattys-sdr-blog    # Restart
sudo journalctl -u mattys-sdr-blog -f     # Logs
```

**Your blog will now survive reboots!** 🎉📡
