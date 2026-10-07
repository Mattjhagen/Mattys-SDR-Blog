#!/bin/bash
# Ham Radio Blog Deployment Script

set -e

echo "🎙️  73 On The Air - Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must be run from the Mattys-SDR-Blog directory"
  exit 1
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the site
echo "🔨 Building production site..."
npm run build

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
  echo "❌ cloudflared not found. Please install it first:"
  echo "   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
  echo "   sudo dpkg -i cloudflared-linux-amd64.deb"
  exit 1
fi

# Create systemd service files
echo "⚙️  Creating systemd services..."

# Blog server service
cat > /tmp/mattys-sdr-blog.service << 'EOF'
[Unit]
Description=Matty's Ham Radio & SDR Blog
After=network.target

[Service]
Type=simple
User=matt
WorkingDirectory=/home/matt/Mattys-SDR-Blog
ExecStart=/usr/bin/node /home/matt/Mattys-SDR-Blog/server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=3000"

[Install]
WantedBy=multi-user.target
EOF

# Cloudflare tunnel service
cat > /tmp/cloudflared-sdr-blog.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel for Ham Radio Blog
After=network.target

[Service]
Type=simple
User=matt
ExecStart=/home/matt/.local/bin/cloudflared tunnel --config /home/matt/Mattys-SDR-Blog/cloudflare-tunnel.yml run mattys-sdr-blog
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "📝 Service files created. To install:"
echo ""
echo "sudo cp /tmp/mattys-sdr-blog.service /etc/systemd/system/"
echo "sudo cp /tmp/cloudflared-sdr-blog.service /etc/systemd/system/"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl enable mattys-sdr-blog"
echo "sudo systemctl enable cloudflared-sdr-blog"
echo "sudo systemctl start mattys-sdr-blog"
echo "sudo systemctl start cloudflared-sdr-blog"
echo ""
echo "✅ Build complete! To finish setup:"
echo "1. Run the commands above to install systemd services"
echo "2. Create Cloudflare tunnel: cloudflared tunnel create mattys-sdr-blog"
echo "3. Configure DNS: cloudflared tunnel route dns mattys-sdr-blog mattjhagen.xyz"
echo "4. Start services"
echo ""
echo "📡 Your Ham Radio blog will be live at https://mattjhagen.xyz"
