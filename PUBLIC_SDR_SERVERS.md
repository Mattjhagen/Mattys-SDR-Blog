# Public SDR Server Protocols

## rtl_tcp
- Protocol: Raw IQ samples over TCP
- Port: Usually 1234
- Problem: Very rare to find public rtl_tcp servers (security risk)
- Would need raw IQ processing in JavaScript (complex)

## SpyServer (SDRplay)
- Protocol: Compressed IQ over TCP
- Some public instances exist
- Better than rtl_tcp but still rare

## OpenWebRX (BEST OPTION!)
- Protocol: WebSocket + JSON commands
- Provides: Audio stream + Waterfall FFT data
- Many public instances
- JavaScript friendly!

Public OpenWebRX instances:
- http://sdr.hu/ - Directory of OpenWebRX servers
- Example: http://websdr.r4d.ee:8073/

## KiwiSDR (ALSO GREAT!)
- Protocol: WebSocket
- Provides: Audio + waterfall data
- 600+ public servers worldwide
- Well documented API
- Example: http://kiwisdr.com/public/

## Best Approach:
Build WebSocket client for OpenWebRX or KiwiSDR
- Connect via WebSocket
- Send tuning commands (JSON)
- Receive audio stream (Web Audio API)
- Receive waterfall FFT data (draw on canvas)
- Full custom UI with YOUR controls!
