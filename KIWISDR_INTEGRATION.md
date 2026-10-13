# KiwiSDR Integration Plan

KiwiSDR receivers are real SDRs around the world you can tune remotely:
- http://kiwisdr.com/public/

## How KiwiSDR Works:
1. WebSocket connection to receiver
2. Send commands: tune frequency, set mode (AM/USB/LSB/CW)
3. Receive: IQ data, waterfall data, demodulated audio
4. Real-time tuning across HF/VHF bands

## Integration Options:

### Option A: Direct KiwiSDR Link (Easiest)
Just open KiwiSDR in new tab - full featured interface already built
- Find receiver at http://kiwisdr.com/public/
- Click to open in new tab
- Full waterfall, tuning, recording, etc.

### Option B: Embed KiwiSDR (Simple)
Use iframe to embed KiwiSDR interface directly

### Option C: Custom WebSocket Client (Complex)
Build our own KiwiSDR client with WebSocket API:
- Connect to ws://kiwisdr-host:8073/
- Send tuning commands
- Receive audio stream
- Display waterfall from FFT data

## Recommended: Option A or B
Let users pick a KiwiSDR and open it in new tab or embed it.
Full SDR interface with tuning, modes, etc.
