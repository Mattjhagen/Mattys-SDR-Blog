# 73 On The Air - Ham Radio & SDR Blog

A comprehensive web platform for documenting amateur radio adventures, Software Defined Radio experiments, and staying connected with your local ham club.

**Live Site:** https://mattjhagen.xyz

## 🎙️ Features

### 📝 Field Journal & Blog
- Full-featured post editor with Markdown support
- Quick insertion buttons for QSO logs, hardware diagrams, and antenna specs
- Categories: SDR & DSP, HF & DX Field, Antenna Builds, Satellites & Space, Digital & FT8, Club Events
- Tag system for easy filtering
- Comments and signal reports from club members
- Archive view organized by month/year
- Local persistence with JSON export

### 📡 Live SDR Streaming
- **Real-time waterfall display** of your RTL-SDR v4 feed
- **Web Audio demodulator** with SSB, CW, FM, and FT8 modes
- **Interactive spectrum analyzer** with calibrated S-meter
- **Audio clip recorder** for capturing interesting contacts
- Band presets: 20m HF DX, 40m nets, 2m calling (146.520), NOAA weather satellites

### 🚨 Police Scanner
- **Live emergency services radio** - Police, Fire, EMS, and Weather feeds
- **Pre-loaded feeds** - Omaha Police, Lincoln Fire, NOAA Weather, and more
- **Add custom feeds** - Support for Broadcastify, Scanner Radio, and custom URLs
- **Feed management** - Add, delete, and organize your scanner feeds
- **Volume control** - Adjust volume on-the-fly while listening
- **Feed categories** - Organized by Police, Fire, EMS, Weather, and Custom types

### 🗺️ QSO Logbook & World Map
- Interactive world map with geodesic paths to contacted stations
- Maidenhead grid calculator with beam heading and distance
- Band activity statistics (30-day and all-time views)
- Searchable directory of all contacts
- Filter by band, mode, grid square, or callsign

### ☀️ Solar Conditions
- Real-time Solar Flux Index, Sunspot numbers, K-Index, and A-Index
- Band propagation forecast for 80m through 6m
- Day/night condition predictions

### 🛠️ Ham Utilities
- **CW Morse Code Generator** - Adjustable speed (5-35 WPM) with Web Audio keyer
- **Grid Square Calculator** - Great-circle distance and beam heading
- **Club Net Directory** - Track weekly VHF/HF nets and POTA meetups

## 🚀 Quick Start

### Prerequisites
```bash
# Node.js 18+ required
node --version

# Install Cloudflare tunnel
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Installation & Deployment
```bash
# Clone the repository
git clone https://github.com/Mattjhagen/Mattys-SDR-Blog.git
cd Mattys-SDR-Blog

# Run the deployment script
./deploy.sh

# This will:
# 1. Install dependencies
# 2. Build the production site
# 3. Generate systemd service files

# Follow the printed instructions to:
# 1. Install systemd services
# 2. Create Cloudflare tunnel
# 3. Configure DNS
# 4. Start services
```

### Manual Setup (Alternative)

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Build the site:**
   ```bash
   npm run build
   ```

3. **Create Cloudflare tunnel:**
   ```bash
   cloudflared tunnel create mattys-sdr-blog
   cloudflared tunnel route dns mattys-sdr-blog mattjhagen.xyz
   ```

4. **Start the server:**
   ```bash
   node server.js
   ```

5. **Start the tunnel:**
   ```bash
   cloudflared tunnel --config cloudflare-tunnel.yml run mattys-sdr-blog
   ```

## 🚨 Using the Police Scanner

### Quick Start

1. **Navigate to Scanner tab** in the top navigation
2. **Browse available feeds** - Pre-loaded with local Nebraska feeds
3. **Click "Play"** to start listening to any feed
4. **Adjust volume** using the slider in the now-playing bar
5. **Click "Stop"** to stop playback

### Adding Custom Feeds

1. Click **"+ Add Feed"** button
2. Enter feed information:
   - **Feed Name** (required) - e.g., "Douglas County Fire"
   - **Description** - e.g., "Fire and EMS Dispatch"
   - **Stream URL** (required) - Direct audio stream URL
   - **Location** - e.g., "Omaha, NE"
   - **Type** - Police, Fire, EMS, Weather, or Custom
3. Click **"Add Feed"** to save

### Finding Scanner Feeds

- **Broadcastify**: Visit [broadcastify.com](https://www.broadcastify.com) to find feeds for your area
  - Free feeds have 15-30 second ads
  - Premium ($6.99/mo) removes ads and allows quick switching
  - Find stream URLs by inspecting network traffic or using the feed ID
- **Scanner Radio**: Browse feeds in the Scanner Radio app or website
- **Direct URLs**: Any HTTP/HTTPS audio stream URL (MP3, AAC, HLS/M3U8)

### Feed URL Formats

```
# Broadcastify direct stream
https://broadcastify.cdnstream1.com/[FEED_ID]

# Broadcastify recorded calls
https://calls.broadcastify.com/[PATH]/[FILENAME].mp3

# NOAA Weather Radio
http://radio.weatherusa.net/NWR/[STATION].mp3

# Generic HTTP audio stream
http://your-stream-server.com/audio.mp3
```

### Tips

- **Silent feeds are normal** - Scanner feeds are often quiet when there's no radio traffic
- **Test with music stream** - Use the included SomaFM feed to verify streaming works
- **Check network** - Some feeds may be offline or require authentication
- **Browser compatibility** - Works best in Chrome, Firefox, and Safari

## 📻 Setting Up Live SDR Streaming

### RTL-SDR v4 Configuration

1. **Install RTL-SDR drivers:**
   ```bash
   sudo apt update
   sudo apt install -y rtl-sdr librtlsdr-dev
   rtl_test -t  # Should detect Rafael Micro R828D tuner
   ```

2. **Set up SDR++ audio routing:**
   ```bash
   # Create virtual audio sink
   pactl load-module module-null-sink \
     sink_name=sdr_stream \
     sink_properties=device.description="SDR_Audio_Stream"
   ```

3. **In SDR++:**
   - Set Source to RTL-SDR
   - Sample rate: 2.048 MSPS or 2.4 MSPS
   - Audio output: Select "SDR_Audio_Stream"

4. **Stream audio to web:**
   ```bash
   # Local network only (port 8000)
   ffmpeg -f pulse -i sdr_stream.monitor \
     -c:a libmp3lame -b:a 128k -f mp3 \
     -listen 1 http://0.0.0.0:8000/live

   # Public access via Cloudflare (no port forwarding needed)
   cloudflared tunnel --url http://localhost:8000
   # Copy the generated *.trycloudflare.com/live URL
   ```

5. **In the blog's SDR Waterfall Lab:**
   - Click "Connect to Live Station"
   - Paste your stream URL (e.g., `http://192.168.1.100:8000/live` or the Cloudflare URL)
   - Update broadcast info (frequency, band, antenna)
   - Club members can now listen in real-time!

### Audio Quality Tips
- Use 128k bitrate for good balance of quality and bandwidth
- For CW/narrow modes, 64k is sufficient
- For FT8/data modes, 96-128k recommended
- SSB voice: 128k

## 📊 Data Management

All blog posts, contacts, and comments are stored in browser localStorage with automatic persistence.

**Export your data:**
- Blog posts: Check the "Tools" menu for JSON export
- QSO logbook: Use the "Export Logbook" button on the map view
- Regular backups recommended!

## 🔧 Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run lint
```

## 📁 Project Structure

```
Mattys-SDR-Blog/
├── src/
│   ├── components/         # React components
│   │   ├── SdrWaterfallLab.tsx    # Live SDR streaming
│   │   ├── PoliceScanner.tsx      # Police scanner feeds
│   │   ├── ContactLogbookMap.tsx   # QSO map & logbook
│   │   ├── PostEditorModal.tsx     # Blog post editor
│   │   └── ...
│   ├── utils/              # Helper functions
│   │   ├── maidenhead.ts  # Grid square calculations
│   │   ├── morseAudio.ts  # CW generation
│   │   └── sdrAudio.ts    # RF simulation
│   ├── types/              # TypeScript types
│   └── data/               # Initial data
├── dist/                   # Production build
├── server.js              # Express server
├── deploy.sh              # Deployment script
└── cloudflare-tunnel.yml  # Tunnel configuration
```

## 🌐 DNS Configuration

Your domain `mattjhagen.xyz` should point to Cloudflare's nameservers. The tunnel will automatically handle routing.

If using Cloudflare for DNS:
1. Add a CNAME record: `@` → `mattys-sdr-blog.cfargotunnel.com`
2. Add a CNAME record: `www` → `mattys-sdr-blog.cfargotunnel.com`

## 🔐 Security Notes

- All data is stored client-side (localStorage)
- No server-side database (stateless deployment)
- SDR streaming endpoint should be rate-limited if public
- Consider authentication for posting if needed

## 📝 License

Apache-2.0 - See individual source files for license headers

## 🤝 Contributing

This is a personal ham radio blog, but feel free to fork for your own club!

## 📞 Contact

- **Callsign:** W7SDR
- **Grid Square:** CN87us
- **GitHub:** https://github.com/Mattjhagen

## 📚 Resources

- [RTL-SDR Blog](https://www.rtl-sdr.com/)
- [SDR++ Software](https://github.com/AlexandreRouma/SDRPlusPlus)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Amateur Radio Wiki](https://www.amateur-radio-wiki.net/)

---

**73 de W7SDR** 📡 *Making Radio Great Again, One QSO at a Time*
