/**
 * OpenWebRX WebSocket Client
 * Connects to public OpenWebRX servers for remote SDR tuning
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Radio, Settings, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface OpenWebRXClientProps {
  onClose?: () => void;
}

// Known public OpenWebRX servers
const PUBLIC_SERVERS = [
  { name: 'WebSDR Estonia', url: 'ws://websdr.r4d.ee:8073/ws/', location: 'Estonia', bands: '0-30 MHz' },
  { name: 'OpenWebRX Poland', url: 'ws://sdr.swl.su:8073/ws/', location: 'Poland', bands: '0-30 MHz' },
  { name: 'SDR Twente', url: 'ws://websdr.ewi.utwente.nl:8901/ws/', location: 'Netherlands', bands: '0-29 MHz' },
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
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

  // Connect to OpenWebRX server
  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔌 Connecting to:', selectedServer.url);

      const ws = new WebSocket(selectedServer.url);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('✅ WebSocket connected!');
        setIsConnected(true);
        setIsConnecting(false);

        // Send initial configuration
        sendCommand({
          type: 'connectionproperties',
          params: {
            output_rate: 12000, // Audio sample rate
            fft_size: 4096,
            audio_compression: 'adpcm',
            fft_compression: 'adpcm'
          }
        });

        // Set frequency and mode
        tuneFrequency(frequency);
        setDemodulator(mode);
      };

      ws.onmessage = (event) => {
        handleMessage(event.data);
      };

      ws.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
        setError('Connection failed to ' + selectedServer.name);
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        setIsConnected(false);
        setIsPlaying(false);
      };

    } catch (err) {
      console.error('❌ Connection error:', err);
      setError('Failed to connect to server');
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

  // Send command to server
  const sendCommand = (cmd: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
      console.log('📤 Sent:', cmd);
    }
  };

  // Tune to frequency
  const tuneFrequency = (freq: number) => {
    setFrequency(freq);
    sendCommand({
      type: 'dspcontrol',
      params: { frequency: freq }
    });
  };

  // Set demodulator mode
  const setDemodulator = (demod: string) => {
    sendCommand({
      type: 'dspcontrol',
      params: { demodulator: demod }
    });
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
    // OpenWebRX sends audio as ADPCM compressed PCM
    // For now, just log that we're receiving data
    if (isPlaying) {
      console.log('🎵 Received audio data:', data.byteLength, 'bytes');
      // TODO: Decode ADPCM and play audio
    }
  };

  // Start audio playback
  const startAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    setIsPlaying(true);
    sendCommand({ type: 'dspcontrol', params: { squelch_level: -150 } }); // Open squelch
  };

  // Stop audio playback
  const stopAudio = () => {
    setIsPlaying(false);
    audioQueueRef.current.forEach(node => node.stop());
    audioQueueRef.current = [];
  };

  // Change frequency with input
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const freq = parseFloat(e.target.value) * 1000000; // Convert MHz to Hz
    if (!isNaN(freq) && freq >= 0 && freq <= 30000000) {
      tuneFrequency(freq);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
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
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
        <strong>Status:</strong> WebSocket client connecting to OpenWebRX. Audio decoding in progress...
        <br />
        <strong>Try:</strong> 14.074 MHz USB (FT8), 7.200 MHz LSB (SSB voice), 10.000 MHz AM (WWV)
      </div>
    </div>
  );
};
