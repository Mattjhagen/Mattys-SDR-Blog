#!/bin/bash
echo "🔍 Checking Ham Radio Blog Status..."
echo ""
echo "📡 Local Server (Port 3001):"
curl -s -I http://localhost:3001 | head -3
echo ""
echo "🌐 Public Domain:"
curl -s -I https://mattjhagen.xyz | head -5
echo ""
echo "📊 Process Status:"
ps aux | grep -E "(node server.js|cloudflared tunnel.*mattys)" | grep -v grep
echo ""
echo "📝 Recent Logs:"
echo "Server log (last 5 lines):"
tail -5 ~/Mattys-SDR-Blog/server.log 2>/dev/null || echo "No logs yet"
echo ""
echo "Tunnel log (last 5 lines):"
tail -5 ~/Mattys-SDR-Blog/tunnel.log 2>/dev/null || echo "No logs yet"
