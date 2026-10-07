# Quick Start Guide - Deploy in 5 Minutes

## Step 1: Create Cloudflare Tunnel (First Time Only)

```bash
cd ~/Mattys-SDR-Blog

# Create the tunnel
cloudflared tunnel create mattys-sdr-blog

# This creates a credentials file at:
# ~/.cloudflared/<TUNNEL-ID>.json

# Note: The tunnel ID will be shown in the output
```

## Step 2: Update Cloudflare Tunnel Config

Edit `cloudflare-tunnel.yml` and replace the credentials file path:

```bash
nano cloudflare-tunnel.yml
```

Change this line to match your tunnel ID:
```yaml
credentials-file: /home/matt/.cloudflared/<YOUR-TUNNEL-ID>.json
```

## Step 3: Configure DNS

```bash
# Route your domain to the tunnel
cloudflared tunnel route dns mattys-sdr-blog mattjhagen.xyz
cloudflared tunnel route dns mattys-sdr-blog www.mattjhagen.xyz
```

## Step 4: Install Systemd Services

```bash
# Run the deployment script
./deploy.sh

# Follow the printed commands to install services:
sudo cp /tmp/mattys-sdr-blog.service /etc/systemd/system/
sudo cp /tmp/cloudflared-sdr-blog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mattys-sdr-blog
sudo systemctl enable cloudflared-sdr-blog
sudo systemctl start mattys-sdr-blog
sudo systemctl start cloudflared-sdr-blog
```

## Step 5: Verify Everything Works

```bash
# Check blog server
sudo systemctl status mattys-sdr-blog
curl http://localhost:3000

# Check tunnel
sudo systemctl status cloudflared-sdr-blog

# View logs if needed
sudo journalctl -u mattys-sdr-blog -f
sudo journalctl -u cloudflared-sdr-blog -f
```

## Your Blog is Live! 🎉

Visit: **https://mattjhagen.xyz**

## Setting Up Live SDR Streaming (Optional)

### Quick Setup:

1. **Install RTL-SDR drivers:**
   ```bash
   sudo apt update && sudo apt install -y rtl-sdr librtlsdr-dev
   ```

2. **Create audio sink:**
   ```bash
   pactl load-module module-null-sink sink_name=sdr_stream \
     sink_properties=device.description="SDR_Audio_Stream"
   ```

3. **Configure SDR++:**
   - Source: RTL-SDR
   - Audio output: SDR_Audio_Stream

4. **Start streaming:**
   ```bash
   # Install ffmpeg if not already installed
   sudo apt install ffmpeg

   # Stream audio
   ffmpeg -f pulse -i sdr_stream.monitor \
     -c:a libmp3lame -b:a 128k -f mp3 \
     -listen 1 http://0.0.0.0:8000/live
   ```

5. **In your blog:**
   - Click "Launch SDR Waterfall Lab"
   - Click "Connect to Live Station"
   - Enter: `http://localhost:8000/live` (or your server IP)
   - Update broadcast info
   - Share with your club!

## Troubleshooting

### Blog not loading?
```bash
# Check if server is running
sudo systemctl status mattys-sdr-blog

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Restart service
sudo systemctl restart mattys-sdr-blog
```

### Tunnel not connecting?
```bash
# Check tunnel status
sudo systemctl status cloudflared-sdr-blog

# Test tunnel manually
cloudflared tunnel --config cloudflare-tunnel.yml run mattys-sdr-blog

# Check DNS propagation (may take a few minutes)
dig mattjhagen.xyz
```

### SDR stream not working?
```bash
# Verify audio sink exists
pactl list sinks short | grep sdr_stream

# Check if ffmpeg is running
ps aux | grep ffmpeg

# Test stream locally
curl -I http://localhost:8000/live
```

## Maintenance

### Update the blog:
```bash
cd ~/Mattys-SDR-Blog
git pull
./deploy.sh
sudo systemctl restart mattys-sdr-blog
```

### View logs:
```bash
sudo journalctl -u mattys-sdr-blog -n 50
sudo journalctl -u cloudflared-sdr-blog -n 50
```

### Backup your data:
All blog posts and contacts are in your browser's localStorage. Use the export buttons in the web interface regularly!

---

**73!** 📡
