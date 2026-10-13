/**
 * OpenWebRX WebSocket Client
 * Connects to public OpenWebRX servers for remote SDR tuning
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Radio, Settings, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { ADPCMDecoder } from '../utils/adpcmDecoder';

interface OpenWebRXClientProps {
  onClose?: () => void;
}

// Direct KiwiSDR servers (no redirects)
const PUBLIC_SERVERS = [
  { name: 'KiwiSDR ZL/VK4', url: 'ws://kiwisdr.duckdns.org:8073/', location: 'New Zealand', bands: '0-30 MHz' },
  { name: 'KiwiSDR Twente', url: 'ws://websdr.ewi.utwente.nl:8901/', location: 'Netherlands', bands: '0-30 MHz' },
  { name: 'KiwiSDR W6REK', url: 'ws://w6rek.zapto.org:8073/', location: 'California, USA', bands: '0-30 MHz' },
  { name: 'OpenWebRX sdr.hu', url: 'ws://hu.sdr.hu:8073/ws/', location: 'Hungary', bands: '0-30 MHz' },
];

export const OpenWebRXClient: React.FC<OpenWebRXClientProps> = ({ onClose }) => {
  const [selectedServer, setSelectedServer] = useState(PUBLIC_SERVERS[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [frequency, setFrequency] = useState(14074000); // 14.074 MHz (FT8)
  const [mode, setMode] = useState<'usb' | 'lsb' | 'am' | 'cw' | 'fm'>('usb');
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const adpcmDecoderRef = useRef<ADPCMDecoder>(new ADPCMDecoder());
  const nextPlayTimeRef = useRef<number>(0);
  const sampleRate = 12000; // OpenWebRX default audio rate

  // Connect to OpenWebRX server
  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Use WebSocket proxy to bypass CORS
      const proxyUrl = `ws://${window.location.hostname}:${window.location.port || '3001'}/sdr-ws?target=${encodeURIComponent(selectedServer.url)}`;

      console.log('🔌 Connecting via proxy to:', selectedServer.url);
      console.log('📡 Proxy URL:', proxyUrl);

      const ws = new WebSocket(proxyUrl);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      // Timeout if connection takes too long
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setError(`Connection timeout. Server may be offline or blocking connections. URL: ${selectedServer.url}`);
          setIsConnecting(false);
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connected! ReadyState:', ws.readyState);
        setIsConnected(true);
        setIsConnecting(false);

        // KiwiSDR initialization sequence
        console.log('📤 Sending KiwiSDR initialization...');

        // Step 1: Authentication (public server, no password)
        sendKiwiCommand('SET auth t=kiwi p=#');

        // Step 2: Set zoom/span
        sendKiwiCommand('SET zoom=0 start=0');

        // Step 3: Set waterfall range
        sendKiwiCommand('SET maxdb=0 mindb=-100');

        // Step 4: Set initial frequency and mode
        const freqKhz = Math.floor(frequency / 1000);
        sendKiwiCommand(`SET mod=${mode} low_cut=300 high_cut=2700 freq=${freqKhz}`);

        // Step 5: Request audio streaming
        sendKiwiCommand('SET squelch=0 max=0');
        sendKiwiCommand('SET audio');

        console.log('✅ KiwiSDR initialized - audio stream should start');
      };

      ws.onmessage = (event) => {
        handleMessage(event.data);
      };

      ws.onerror = (err: Event) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket error:', err);
        console.error('❌ Error type:', (err as any).type);
        console.error('❌ ReadyState:', ws.readyState);
        setError(`Connection failed: ${selectedServer.name}.

Possible issues:
• Server is offline or unreachable
• CORS/security blocking WebSocket connection
• Wrong WebSocket URL format
• Server requires authentication

Try a different server or check browser console (F12) for details.`);
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        console.log('🔌 WebSocket closed. Code:', event.code, 'Reason:', event.reason);
        if (event.code !== 1000) {
          setError(`Connection closed unexpectedly. Code: ${event.code}`);
        }
        setIsConnected(false);
        setIsPlaying(false);
      };

    } catch (err: any) {
      console.error('❌ Connection error:', err);
      setError(`Failed to connect: ${err.message || 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  // Disconnect from server
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsPlaying(false);
  };

  // Send KiwiSDR text command
  const sendKiwiCommand = (cmd: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd);
      console.log('📤 Sent:', cmd);
    }
  };

  // Tune to frequency (KiwiSDR format)
  const tuneFrequency = (freq: number) => {
    setFrequency(freq);
    const freqKhz = Math.floor(freq / 1000);
    sendKiwiCommand(`SET mod=${mode} low_cut=300 high_cut=2700 freq=${freqKhz}`);
  };

  // Set demodulator mode (KiwiSDR format)
  const setDemodulator = (demod: string) => {
    const freqKhz = Math.floor(frequency / 1000);
    sendKiwiCommand(`SET mod=${demod} low_cut=300 high_cut=2700 freq=${freqKhz}`);
  };

  // Handle incoming WebSocket messages
  const handleMessage = (data: any) => {
    if (typeof data === 'string') {
      // JSON message
      try {
        const msg = JSON.parse(data);
        console.log('📥 Received:', msg.type || msg);

        if (msg.type === 'config') {
          console.log('📡 Server config:', msg.value);
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e);
      }
    } else {
      // Binary data (audio or FFT)
      handleBinaryData(data);
    }
  };

  // Handle binary audio/FFT data
  const handleBinaryData = (data: ArrayBuffer) => {
    if (!isPlaying || !audioContextRef.current) return;

    try {
      const view = new DataView(data);

      // KiwiSDR format: First 3 bytes are header
      // Byte 0: 'S' (0x53) for sound
      // Byte 1: flags
      // Byte 2: sequence number
      // Rest: ADPCM audio data

      if (data.byteLength < 4) {
        console.log('⚠️ Packet too small:', data.byteLength, 'bytes');
        return;
      }

      const firstByte = view.getUint8(0);

      // Check if this is KiwiSDR sound data (starts with 'S' = 0x53)
      if (firstByte === 0x53 || firstByte === 0x73) {
        // KiwiSDR audio packet
        const flags = view.getUint8(1);
        const sequence = view.getUint8(2);

        // Audio data starts at byte 3
        const audioData = new Uint8Array(data, 3);

        console.log('🎵 KiwiSDR audio:', audioData.byteLength, 'bytes, seq:', sequence, 'flags:', flags.toString(16));

        // Decode ADPCM to Float32
        const pcmData = adpcmDecoderRef.current.decodeToFloat32(audioData);

        if (pcmData.length > 0) {
          // Add to queue
          audioQueueRef.current.push(pcmData);

          // Process queue
          processAudioQueue();
        }
      } else {
        // Unknown packet type
        console.log('📦 Received packet:', data.byteLength, 'bytes, type:', firstByte.toString(16));
      }
    } catch (err) {
      console.error('❌ Audio decode error:', err);
    }
  };

  // Process audio queue and schedule playback
  const processAudioQueue = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) return;

    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;

    // Initialize next play time if needed
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime + 0.1; // Small buffer
    }

    // Process queue
    while (audioQueueRef.current.length > 0) {
      const pcmData = audioQueueRef.current.shift();
      if (!pcmData) continue;

      try {
        // Create audio buffer
        const audioBuffer = ctx.createBuffer(1, pcmData.length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        channelData.set(pcmData);

        // Create source node
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        // Connect with volume control
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Schedule playback
        source.start(nextPlayTimeRef.current);

        // Update next play time
        nextPlayTimeRef.current += audioBuffer.duration;

        console.log('🔊 Playing audio chunk:', pcmData.length, 'samples at', nextPlayTimeRef.current.toFixed(2));
      } catch (err) {
        console.error('❌ Audio playback error:', err);
      }
    }
  };

  // Start audio playback
  const startAudio = async () => {
    try {
      // Create/resume audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate });
        console.log('🎵 AudioContext created, sample rate:', audioContextRef.current.sampleRate);
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Reset decoder and playback state
      adpcmDecoderRef.current.reset();
      nextPlayTimeRef.current = 0;
      audioQueueRef.current = [];

      setIsPlaying(true);
      console.log('▶️ Audio playback started');

      // KiwiSDR audio is already streaming from initialization
      // Just need to open squelch
      sendKiwiCommand('SET squelch=0 max=0');
    } catch (err) {
      console.error('❌ Failed to start audio:', err);
      setError('Failed to start audio: ' + (err as Error).message);
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    setIsPlaying(false);
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    console.log('⏹️ Audio playback stopped');
  };

  // Change frequency with input
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const freq = parseFloat(e.target.value) * 1000000; // Convert MHz to Hz
    if (!isNaN(freq) && freq >= 0 && freq <= 30000000) {
      tuneFrequency(freq);
    }
  };

  // Update volume in real-time
  useEffect(() => {
    if (audioContextRef.current && isPlaying) {
      // Volume will be applied to next audio chunks via gainNode
      console.log('🔊 Volume updated:', Math.round(volume * 100) + '%');
    }
  }, [volume, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-blue-400" />
            OpenWebRX Remote SDR
          </h2>
          <p className="text-sm text-slate-400 mt-1">Connect to public SDR servers worldwide</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
            Close
          </button>
        )}
      </div>

      {/* Server Selection */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <label className="block text-sm font-medium">Select SDR Server:</label>
        <div className="grid grid-cols-1 gap-2">
          {PUBLIC_SERVERS.map((server) => (
            <button
              key={server.url}
              onClick={() => setSelectedServer(server)}
              disabled={isConnected}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedServer.url === server.url
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              } disabled:opacity-50`}
            >
              <div className="font-medium">{server.name}</div>
              <div className="text-xs text-slate-400">
                {server.location} • {server.bands}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-slate-500" />
            )}
            <span className="font-medium">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg"
            >
              Disconnect
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}
      </div>

      {/* Tuning Controls */}
      {isConnected && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">Tuning Controls</h3>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Frequency: {(frequency / 1000000).toFixed(3)} MHz
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="30"
              value={(frequency / 1000000).toFixed(3)}
              onChange={handleFrequencyChange}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="14.074"
            />
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Mode:</label>
            <div className="grid grid-cols-5 gap-2">
              {(['usb', 'lsb', 'am', 'cw', 'fm'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setDemodulator(m); }}
                  className={`px-3 py-2 rounded-lg font-mono text-sm transition-colors ${
                    mode === m
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Controls */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Audio:</label>
              {!isPlaying ? (
                <button
                  onClick={startAudio}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              ) : (
                <button
                  onClick={stopAudio}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-slate-400 w-12">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200 space-y-2">
        <div>
          <strong>🎉 Phase 2 Complete:</strong> ADPCM audio decoder implemented!
        </div>
        <div>
          <strong>How to use:</strong>
          <ol className="list-decimal ml-4 mt-1">
            <li>Connect to a server (try each until one works)</li>
            <li>Tune to a frequency (14.074 MHz USB for FT8)</li>
            <li>Click "Start" under Audio</li>
            <li>Listen! Audio will decode and play through speakers</li>
          </ol>
        </div>
        <div>
          <strong>Console (F12):</strong> Watch for "🎵 Received data" and "🔊 Playing audio chunk" messages
        </div>
        <div>
          <strong>Good frequencies:</strong> 14.074 MHz USB (FT8 chirps), 7.200 MHz LSB (voice), 10.000 MHz AM (WWV beeps)
        </div>
      </div>
    </div>
  );
};
