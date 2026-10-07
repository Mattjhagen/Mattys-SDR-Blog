#!/bin/bash

# Setup systemd service for Matt's SDR Blog
# This makes the server start automatically on boot

echo "🚀 Setting up systemd service for Matt's SDR Blog"
echo "================================================"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script needs sudo to install the systemd service"
    echo ""
    echo "Run with: sudo bash $0"
    echo ""
    exit 1
fi

# Stop current server if running
echo "🛑 Stopping current server process..."
if [ -f /home/matt/Mattys-SDR-Blog/server.pid ]; then
    PID=$(cat /home/matt/Mattys-SDR-Blog/server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "   Stopped process $PID"
    fi
fi

# Copy service file to systemd directory
echo "📝 Installing service file..."
cp /home/matt/Mattys-SDR-Blog/mattys-sdr-blog.service /etc/systemd/system/
chmod 644 /etc/systemd/system/mattys-sdr-blog.service

# Reload systemd
echo "🔄 Reloading systemd..."
systemctl daemon-reload

# Enable service (start on boot)
echo "✅ Enabling service to start on boot..."
systemctl enable mattys-sdr-blog.service

# Start service now
echo "🚀 Starting service..."
systemctl start mattys-sdr-blog.service

# Wait a moment for service to start
sleep 2

# Check status
echo ""
echo "📊 Service Status:"
echo "=================="
systemctl status mattys-sdr-blog.service --no-pager

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Useful commands:"
echo "   sudo systemctl status mattys-sdr-blog    # Check status"
echo "   sudo systemctl restart mattys-sdr-blog   # Restart server"
echo "   sudo systemctl stop mattys-sdr-blog      # Stop server"
echo "   sudo journalctl -u mattys-sdr-blog -f    # View logs"
echo ""
echo "🎉 Your blog will now start automatically on every reboot!"
