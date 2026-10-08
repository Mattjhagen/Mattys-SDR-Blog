#!/bin/bash
# Quick setup script for SWL mode configuration
# Run this to create your .env file interactively

echo "================================================"
echo "  73 ON THE AIR - SWL Configuration Setup"
echo "================================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Your existing .env was not modified."
        exit 0
    fi
fi

echo "Let's configure your SWL station info..."
echo ""

# Prompt for location
read -p "Your city (e.g., Omaha): " CITY
read -p "Your state (e.g., NE): " STATE
read -p "Your Maidenhead grid (e.g., EN09xv): " GRID

# Prompt for club (optional)
read -p "Your club name (optional, press Enter to skip): " CLUB
if [ -z "$CLUB" ]; then
    CLUB="Ak-Sar-Ben ARC"
fi

# Callsign defaults to pending
CALLSIGN="Pending (Studying)"
echo ""
echo "Callsign will be set to: $CALLSIGN"
echo "(You can change this in .env after you pass your exam!)"
echo ""

# Create .env file
cat > .env << EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# ======================================
# SWL OPERATOR INFO
# ======================================
# Your location (shown in hero banner and footer)
VITE_OPERATOR_CITY="$CITY"
VITE_OPERATOR_STATE="$STATE"
VITE_MAIDENHEAD_GRID="$GRID"

# Callsign - Update this after you pass your test!
VITE_HAM_CALLSIGN="$CALLSIGN"

# Club affiliation
VITE_CLUB_NAME="$CLUB"

# ======================================
# SDR INTEGRATION (Fill when dongle arrives)
# ======================================
# Set to "true" when your RTL-SDR is online
VITE_SDR_ONLINE=false

# OpenWebRX or SDR++ Server URL (uncomment when ready)
# VITE_SDR_URL="http://localhost:8073"
# VITE_SDR_URL="https://your-public-sdr.example.com"

# Optional: Direct audio stream
SDR_STREAM_URL=http://localhost:8000/live

# ======================================
# CLOUDFLARE TUNNEL (Optional)
# ======================================
# TUNNEL_TOKEN=your_tunnel_token_here
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "Your configuration:"
echo "  City:  $CITY, $STATE"
echo "  Grid:  $GRID"
echo "  Club:  $CLUB"
echo "  Call:  $CALLSIGN"
echo ""
echo "================================================"
echo "  Next Steps:"
echo "================================================"
echo ""
echo "1. Review/edit .env if needed:"
echo "   nano .env"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "4. When your RTL-SDR arrives, edit .env:"
echo "   - Set VITE_SDR_ONLINE=true"
echo "   - Set VITE_SDR_URL to your OpenWebRX URL"
echo ""
echo "73 DE $CALLSIGN! 📻"
echo ""
