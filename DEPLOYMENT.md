# Deployment Status

## ✅ Completed

- [x] Production build created (`dist/` directory)
- [x] Express server configured (`server.js`)
- [x] Cloudflare tunnel configuration (`cloudflare-tunnel.yml`)
- [x] Automated deployment script (`deploy.sh`)
- [x] Systemd service templates created
- [x] Comprehensive documentation (README.md, QUICKSTART.md)
- [x] Code pushed to GitHub

## 📝 Next Steps for Deployment

### 1. Configure Cloudflare Tunnel (First Time)

```bash
cd ~/Mattys-SDR-Blog

# Create tunnel
cloudflared tunnel create mattys-sdr-blog

# Note the tunnel ID from output, then edit cloudflare-tunnel.yml:
nano cloudflare-tunnel.yml
# Update: credentials-file: /home/matt/.cloudflared/<TUNNEL-ID>.json
```

### 2. Route DNS to Tunnel

```bash
cloudflared tunnel route dns mattys-sdr-blog mattjhagen.xyz
cloudflared tunnel route dns mattys-sdr-blog www.mattjhagen.xyz
```

### 3. Install and Start Services

```bash
# Generate service files
./deploy.sh

# Install services (requires sudo)
sudo cp /tmp/mattys-sdr-blog.service /etc/systemd/system/
sudo cp /tmp/cloudflared-sdr-blog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mattys-sdr-blog cloudflared-sdr-blog
sudo systemctl start mattys-sdr-blog cloudflared-sdr-blog
```

### 4. Verify Deployment

```bash
# Check services
sudo systemctl status mattys-sdr-blog
sudo systemctl status cloudflared-sdr-blog

# Test locally
curl http://localhost:3000

# Check logs
sudo journalctl -u mattys-sdr-blog -f
```

Your site should be live at: **https://mattjhagen.xyz**

## 🔧 Port Configuration Note

**Note:** There's currently a Next.js server running on port 3000. 

To avoid conflicts, you can either:

1. **Option A:** Stop the existing service:
   ```bash
   # Find the process
   ps aux | grep next-server
   # Stop it if not needed
   ```

2. **Option B:** Use a different port for the blog (e.g., 3001):
   ```bash
   # Edit server.js to use PORT 3001
   # Edit systemd service to set Environment="PORT=3001"
   # Update cloudflare-tunnel.yml to point to localhost:3001
   ```

## 📻 SDR Streaming Setup (Optional)

See QUICKSTART.md for detailed instructions on setting up live RTL-SDR v4 streaming.

Quick commands:
```bash
# Install drivers
sudo apt install rtl-sdr librtlsdr-dev ffmpeg

# Create audio sink
pactl load-module module-null-sink sink_name=sdr_stream

# Stream (in SDR++ set audio output to SDR_Audio_Stream)
ffmpeg -f pulse -i sdr_stream.monitor -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:8000/live
```

Then in your blog:
1. Launch SDR Waterfall Lab
2. Connect to Live Station → `http://localhost:8000/live`
3. Share with club members!

## 🔐 Security Checklist

- [ ] Cloudflare tunnel authenticated
- [ ] DNS properly configured
- [ ] Services running with non-root user (matt)
- [ ] Port 3000 only accessible via localhost (tunnel handles external access)
- [ ] SDR stream endpoint rate-limited (if making public)

## 📊 Monitoring

```bash
# Service status
systemctl status mattys-sdr-blog cloudflared-sdr-blog

# Live logs
sudo journalctl -u mattys-sdr-blog -f

# Check tunnel connectivity
cloudflared tunnel info mattys-sdr-blog
```

## 🔄 Updates

To update the blog:
```bash
cd ~/Mattys-SDR-Blog
git pull origin main
./deploy.sh
sudo systemctl restart mattys-sdr-blog
```

## 🆘 Support

- Check logs: `sudo journalctl -u mattys-sdr-blog -n 100`
- Test locally: `curl http://localhost:3000`
- Verify tunnel: `cloudflared tunnel info mattys-sdr-blog`
- DNS propagation: `dig mattjhagen.xyz` (can take 5-10 minutes)

---

**73 de W7SDR** 📡
