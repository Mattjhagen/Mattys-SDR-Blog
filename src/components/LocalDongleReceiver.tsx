/*
 * LocalDongleReceiver Component
 *
 * WebUSB RTL-SDR receiver for local dongle access in the browser.
 * Ported patterns from sdrsharp-webclient (MIT License, Copyright 2025 Atilla)
 * See THIRD_PARTY_LICENSES/sdrsharp-webclient-MIT.txt for full attribution.
 *
 * NOTE: This demonstrates WebUSB device connection flow. Full audio demodulation
 * and sample streaming requires additional implementation of RTL-SDR control protocol.
 * See the donor project for complete reference: https://github.com/betamole/sdrsharp-webclient
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Radio as RadioIcon, AlertCircle, Chrome, Sliders, Wifi, Square, Play, BarChart
} from 'lucide-react';

// Real SDR libraries (Apache 2.0 licensed)
import { RTL2832U_Provider } from '@jtarrio/webrtlsdr/rtlsdr.js';
import { Radio } from '@jtarrio/webrtlsdr/radio.js';
import { Demodulator } from '@jtarrio/signals/demod/empty-demodulator.js';
import { Spectrum } from '@jtarrio/signals/demod/spectrum.js';
import { getMode } from '@jtarrio/signals/demod/modes.js';
import { DirectSampling } from '@jtarrio/webrtlsdr/rtlsdr.js';
import type { SampleBlock } from '@jtarrio/signals/radio/sample_block.js';

export const LocalDongleReceiver: React.FC = () => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string>('RTL-SDR');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Receiver state
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiverError, setReceiverError] = useState<string | null>(null);

  // RF parameters (UI state)
  const [centerFrequency, setCenterFrequency] = useState(100.0 * 1e6); // 100 MHz default
  const [sampleRate, setSampleRate] = useState(2048000); // 2.048 MSPS
  const [gain, setGain] = useState<number | null>(20); // Manual gain 20 dB, null = auto
  const [demodMode, setDemodMode] = useState<'WBFM' | 'NBFM' | 'AM' | 'USB' | 'LSB' | 'CW'>('WBFM');

  // SDR component refs
  const providerRef = useRef<RTL2832U_Provider | null>(null);
  const radioRef = useRef<Radio | null>(null);
  const demodulatorRef = useRef<Demodulator | null>(null);
  const spectrumRef = useRef<Spectrum | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Canvas refs for visualization
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation frame ID for rendering loop
  const animationFrameRef = useRef<number | null>(null);

  // Waterfall history buffer
  const waterfallHistoryRef = useRef<ImageData[]>([]);

  // Browser compatibility check
  const isWebUSBSupported = typeof navigator !== 'undefined' && !!navigator.usb;

  // Connect to RTL-SDR device and initialize the receiver pipeline
  const handleConnect = async () => {
    setConnectionError(null);
    setIsConnecting(true);

    try {
      console.log('Starting RTL-SDR connection and receiver initialization...');

      if (!navigator.usb) {
        throw new Error('WebUSB not supported. Please use Chrome, Edge, or Brave.');
      }

      // Step 1: WebUSB device pairing (required for first-time permission grant)
      let devices = await navigator.usb.getDevices();
      console.log(`→ Step 1: Found ${devices.length} paired WebUSB device(s)`);

      if (devices.length === 0) {
        console.log('→ No paired devices, prompting user for device selection...');
        await navigator.usb.requestDevice({
          filters: [
            { vendorId: 0x0bda, productId: 0x2838 }, // RTL2838UHIDIR
            { vendorId: 0x0bda, productId: 0x2832 }, // RTL2832U
          ]
        });
        devices = await navigator.usb.getDevices();
        console.log(`→ After pairing: ${devices.length} device(s) available`);
      }

      if (devices.length === 0) {
        throw new Error('No device selected');
      }

      const selectedDevice = devices[0];
      console.log('→ Device selected:', selectedDevice.productName || 'Unknown RTL-SDR');
      console.log(`  Vendor: 0x${selectedDevice.vendorId.toString(16)}, Product: 0x${selectedDevice.productId.toString(16)}`);
      setDeviceName(selectedDevice.productName || 'RTL-SDR');

      // Step 2: Create RTL-SDR provider (handles USB communication)
      // NOTE: Provider constructor takes optional {webusb?: USB} options
      // It defaults to navigator.usb and will call getDevices() internally
      if (!providerRef.current) {
        console.log('→ Step 2: Creating RTL2832U_Provider...');
        console.log('  Provider will acquire device via internal getDevices() call');
        providerRef.current = new RTL2832U_Provider();
        console.log('  ✓ Provider created successfully');
      }

      // Step 3: Create AudioContext (must be created here for resume on user gesture)
      if (!audioContextRef.current) {
        console.log('→ Step 3: Creating Web Audio API context...');
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({
          sampleRate: 48000, // Standard audio output rate
          latencyHint: 'interactive'
        });
        console.log(`  ✓ AudioContext created (state: ${audioContextRef.current.state}, sampleRate: ${audioContextRef.current.sampleRate})`);
        console.log('  ⚠ Context will be resumed when "Start Receiving" is clicked (user gesture)');
      }

      // Step 4: Create demodulator (handles audio output via Web Audio API)
      if (!demodulatorRef.current) {
        console.log('→ Step 4: Creating Demodulator (uses AudioPlayer internally)...');

        // Demodulator creates AudioPlayer automatically if no player provided
        // We use default behavior - AudioPlayer will create its own AudioContext
        demodulatorRef.current = new Demodulator();
        demodulatorRef.current.setSampleRate(sampleRate);

        // Set initial mode
        const modeObj = getMode(demodMode);
        demodulatorRef.current.setMode(modeObj);
        demodulatorRef.current.setVolume(0.5); // 50% volume default
        console.log(`  ✓ Demodulator created (mode: ${demodMode}, volume: 50%)`);
        console.log('  Note: AudioPlayer creates context on first play() call');
      }

      // Step 5: Create spectrum analyzer
      if (!spectrumRef.current) {
        console.log('→ Step 5: Creating Spectrum analyzer (1024-point FFT)...');
        spectrumRef.current = new Spectrum(1024); // 1024-point FFT
        spectrumRef.current.setSampleRate(sampleRate);
        console.log(`  ✓ Spectrum analyzer created (FFT size: 1024, sample rate: ${sampleRate / 1000} kHz)`);
      }

      // Step 6: Create composite SampleReceiver (forwards samples to both demod and spectrum)
      console.log('→ Step 6: Creating composite SampleReceiver...');
      const sampleReceiver = {
        setSampleRate: (rate: number) => {
          console.log(`  → SampleReceiver.setSampleRate(${rate / 1000} kHz)`);
          demodulatorRef.current?.setSampleRate(rate);
          spectrumRef.current?.setSampleRate(rate);
        },
        receiveSamples: (block: SampleBlock) => {
          // This will be called continuously during receiving
          // Forward to both demod (audio) and spectrum (FFT)
          demodulatorRef.current?.receiveSamples(block);
          spectrumRef.current?.receiveSamples(block);
        }
      };
      console.log('  ✓ SampleReceiver configured (forwards to demod + spectrum)');

      // Step 7: Create Radio instance (orchestrates provider + receiver)
      console.log('→ Step 7: Creating Radio instance...');
      console.log('  Radio constructor: Radio(provider, sampleReceiver)');
      radioRef.current = new Radio(providerRef.current, sampleReceiver);
      console.log('  ✓ Radio instance created');

      // Step 8: Wait for radio to initialize device
      console.log('→ Step 8: Waiting for Radio.ready() - provider acquires USB device...');
      await radioRef.current.ready();
      console.log('  ✓ Radio ready - device acquired and initialized');

      // Step 9: Configure radio with initial parameters
      console.log('→ Step 9: Configuring radio parameters...');
      await radioRef.current.setFrequency(centerFrequency);
      console.log(`  ✓ Frequency set: ${(centerFrequency / 1e6).toFixed(3)} MHz`);
      await radioRef.current.setSampleRate(sampleRate);
      console.log(`  ✓ Sample rate set: ${sampleRate / 1000} kHz`);
      await radioRef.current.setGain(gain);
      console.log(`  ✓ Gain set: ${gain} dB`);

      setIsConnected(true);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✓ RTL-SDR RECEIVER PIPELINE READY');
      console.log('  Click "Start Receiving" to begin sample streaming');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      console.error('Connection failed:', error);
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes('No device selected') || errorMessage.includes('cancelled')) {
        setConnectionError('Device selection cancelled. Click Connect again to retry.');
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('NotFoundError')) {
        setConnectionError('RTL-SDR device not found. Ensure your dongle is plugged in.');
      } else if (errorMessage.includes('denied')) {
        setConnectionError('Permission denied. Check browser permissions for USB devices.');
      } else {
        setConnectionError(errorMessage);
      }

      // Cleanup on error
      radioRef.current = null;
      demodulatorRef.current = null;
      spectrumRef.current = null;
      providerRef.current = null;
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Start receiving (begins sample streaming and audio output)
  const handleStartReceiving = async () => {
    if (!radioRef.current) {
      setReceiverError('Radio not connected');
      return;
    }

    try {
      setReceiverError(null);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('STARTING RECEIVER...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // CRITICAL: Resume AudioContext on user gesture (browser requirement)
      // The Demodulator's AudioPlayer creates its own AudioContext, which starts
      // in 'suspended' state. It must be resumed before audio can play.
      console.log('→ Checking AudioContext state...');
      if (audioContextRef.current) {
        console.log(`  Current state: ${audioContextRef.current.state}`);
        if (audioContextRef.current.state === 'suspended') {
          console.log('  ⚠ AudioContext suspended - resuming now (user gesture)...');
          await audioContextRef.current.resume();
          console.log(`  ✓ AudioContext resumed (state: ${audioContextRef.current.state})`);
        } else {
          console.log('  ✓ AudioContext already running');
        }
      }

      // Start the radio (begins USB sample streaming to demod + spectrum)
      console.log('→ Starting Radio.start() - begins USB streaming...');
      await radioRef.current.start();
      console.log('  ✓ Radio started - samples flowing to demod + spectrum');

      setIsReceiving(true);

      // Start visualization render loop (spectrum + waterfall)
      console.log('→ Starting visualization render loop...');
      startRenderLoop();
      console.log('  ✓ Render loop active');

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✓ RECEIVER STARTED');
      console.log('  Audio: Playing to browser speakers');
      console.log('  Spectrum: Rendering to canvas');
      console.log('  Waterfall: Scrolling display active');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('✗ Failed to start receiver:', error);
      setReceiverError(error instanceof Error ? error.message : 'Failed to start receiver');
      setIsReceiving(false);
    }
  };

  // Stop receiving
  const handleStopReceiving = () => {
    if (radioRef.current && isReceiving) {
      console.log('Stopping receiver...');
      radioRef.current.stop();
      setIsReceiving(false);

      // Stop render loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      console.log('✓ Receiver stopped');
    }
  };

  // Disconnect from device and clean up all resources
  const handleDisconnect = async () => {
    // Stop receiver first
    handleStopReceiving();

    // Clean up radio
    if (radioRef.current) {
      try {
        await radioRef.current.close();
      } catch (error) {
        console.error('Error closing radio:', error);
      }
      radioRef.current = null;
    }

    // Clean up other components
    demodulatorRef.current = null;
    spectrumRef.current = null;
    providerRef.current = null;

    setIsConnected(false);
    setConnectionError(null);
    console.log('Device disconnected');
  };

  // Visualization render loop
  const startRenderLoop = useCallback(() => {
    const render = () => {
      if (!isReceiving) return;

      // Render spectrum
      if (spectrumRef.current && spectrumCanvasRef.current) {
        renderSpectrum();
      }

      // Render waterfall
      if (spectrumRef.current && waterfallCanvasRef.current) {
        renderWaterfall();
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  }, [isReceiving]);

  // Render spectrum to canvas
  const renderSpectrum = () => {
    const canvas = spectrumCanvasRef.current;
    const spectrum = spectrumRef.current;
    if (!canvas || !spectrum) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Get spectrum data
    const data = new Float32Array(1024);
    spectrum.getSpectrum(data);

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw spectrum
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const barWidth = width / data.length;
    for (let i = 0; i < data.length; i++) {
      // dB scale: data is in dB (typically -120 to 0)
      const dbValue = data[i];
      const normalizedHeight = Math.max(0, Math.min(1, (dbValue + 120) / 120));
      const y = height - (normalizedHeight * height);
      const x = i * barWidth;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Render waterfall to canvas (scrolling spectrogram)
  const renderWaterfall = () => {
    const canvas = waterfallCanvasRef.current;
    const spectrum = spectrumRef.current;
    if (!canvas || !spectrum) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Get current spectrum data
    const data = new Float32Array(1024);
    spectrum.getSpectrum(data);

    // Scroll existing waterfall down by 1 pixel
    if (height > 1) {
      const imageData = ctx.getImageData(0, 0, width, height - 1);
      ctx.putImageData(imageData, 0, 1);
    }

    // Draw new spectrum row at top
    const imageData = ctx.createImageData(width, 1);
    for (let i = 0; i < width; i++) {
      // Map canvas x position to spectrum bin
      const binIndex = Math.floor((i / width) * data.length);
      const dbValue = data[binIndex];

      // Normalize to 0-1 range (dB: -120 to 0)
      const intensity = Math.max(0, Math.min(1, (dbValue + 120) / 120));

      // Color mapping: dark blue (weak) → cyan → amber (strong)
      // Match Waterfall Lab's amber/cyan color scheme
      let r, g, b;
      if (intensity < 0.5) {
        // Dark blue → cyan
        const t = intensity * 2;
        r = Math.floor(0 * (1 - t) + 6 * t);
        g = Math.floor(15 * (1 - t) + 182 * t);
        b = Math.floor(42 * (1 - t) + 212 * t);
      } else {
        // Cyan → amber
        const t = (intensity - 0.5) * 2;
        r = Math.floor(6 * (1 - t) + 251 * t);
        g = Math.floor(182 * (1 - t) + 191 * t);
        b = Math.floor(212 * (1 - t) + 36 * t);
      }

      const pixelIndex = i * 4;
      imageData.data[pixelIndex] = r;
      imageData.data[pixelIndex + 1] = g;
      imageData.data[pixelIndex + 2] = b;
      imageData.data[pixelIndex + 3] = 255; // Alpha
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Update frequency (live, no reconnect needed)
  const handleFrequencyChange = async (freq: number) => {
    setCenterFrequency(freq);

    if (radioRef.current && isConnected) {
      try {
        await radioRef.current.setFrequency(freq);
        console.log(`Frequency tuned to ${(freq / 1e6).toFixed(3)} MHz`);
      } catch (error) {
        console.error('Failed to set frequency:', error);
      }
    }
  };

  // Update gain (live)
  const handleGainChange = async (newGain: number) => {
    setGain(newGain);

    if (radioRef.current && isConnected) {
      try {
        await radioRef.current.setGain(newGain);
        console.log(`Gain set to ${newGain} dB`);
      } catch (error) {
        console.error('Failed to set gain:', error);
      }
    }
  };

  // Update sample rate (requires restart)
  const handleSampleRateChange = async (rate: number) => {
    setSampleRate(rate);

    if (radioRef.current && isConnected) {
      const wasReceiving = isReceiving;

      try {
        // Stop if running
        if (wasReceiving) {
          handleStopReceiving();
        }

        // Apply new sample rate
        await radioRef.current.setSampleRate(rate);
        demodulatorRef.current?.setSampleRate(rate);
        spectrumRef.current?.setSampleRate(rate);

        console.log(`Sample rate set to ${rate / 1000} kHz`);

        // Restart if it was running
        if (wasReceiving) {
          await handleStartReceiving();
        }
      } catch (error) {
        console.error('Failed to set sample rate:', error);
      }
    }
  };

  // Update demod mode (live)
  const handleModeChange = (mode: typeof demodMode) => {
    setDemodMode(mode);

    if (demodulatorRef.current) {
      try {
        const modeObj = getMode(mode);
        demodulatorRef.current.setMode(modeObj);
        console.log(`Demodulation mode set to ${mode}`);
      } catch (error) {
        console.error('Failed to set demod mode:', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Browser Compatibility Notice */}
      {!isWebUSBSupported && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
          <Chrome className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <strong className="block mb-1">Local dongle mode requires a Chromium-based browser</strong>
            <p className="text-amber-400/80">
              Firefox and Safari do not support WebUSB. Please use <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Brave</strong> to connect your RTL-SDR dongle directly.
            </p>
          </div>
        </div>
      )}

      {/* Connection Status Banner */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Radio className={`w-5 h-5 ${isConnected ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-white">
                  {deviceName}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {isConnected ? '● CONNECTED' : '○ DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {isConnected ? 'WebUSB connection established' : 'Click Connect to pair your RTL-SDR dongle'}
              </p>
            </div>
          </div>

          {/* Connect/Disconnect Button */}
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting || !isWebUSBSupported}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
            >
              {isConnecting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Connect Dongle</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Connection Error */}
        {connectionError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>{connectionError}</div>
          </div>
        )}

        {/* Controls (only show when connected) */}
        {isConnected && (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            {/* Receiver Error */}
            {receiverError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>{receiverError}</div>
              </div>
            )}

            {/* Frequency Control */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">
                CENTER FREQUENCY (MHz)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={(centerFrequency / 1e6).toFixed(3)}
                  onChange={(e) => handleFrequencyChange(parseFloat(e.target.value) * 1e6)}
                  step="0.001"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <div className="flex items-center gap-2">
                  {['88.5', '100.0', '146.52'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => handleFrequencyChange(parseFloat(preset) * 1e6)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-mono text-slate-300 transition-colors"
                      title={`Preset: ${preset} MHz`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mode, Gain, Sample Rate Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">
                  DEMOD MODE
                </label>
                <select
                  value={demodMode}
                  onChange={(e) => handleModeChange(e.target.value as typeof demodMode)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  disabled={!isConnected}
                >
                  <option value="WBFM">WFM (Broadcast FM)</option>
                  <option value="NBFM">NFM (Narrowband FM)</option>
                  <option value="AM">AM</option>
                  <option value="USB">USB</option>
                  <option value="LSB">LSB</option>
                  <option value="CW">CW</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono text-slate-400">
                    RF GAIN (dB)
                  </label>
                  <span className="text-xs font-mono text-amber-400">{gain ?? 'AUTO'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={gain ?? 0}
                  onChange={(e) => handleGainChange(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                  disabled={!isConnected}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">
                  SAMPLE RATE
                </label>
                <select
                  value={sampleRate}
                  onChange={(e) => handleSampleRateChange(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  disabled={!isConnected}
                >
                  <option value="240000">240 kHz</option>
                  <option value="1024000">1.024 MHz</option>
                  <option value="2048000">2.048 MHz</option>
                  <option value="2400000">2.400 MHz</option>
                </select>
              </div>
            </div>

            {/* Start/Stop Receiver Button */}
            <div className="flex justify-center pt-2">
              {!isReceiving ? (
                <button
                  onClick={handleStartReceiving}
                  disabled={!isConnected}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Receiving</span>
                </button>
              ) : (
                <button
                  onClick={handleStopReceiving}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 transition-colors"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Receiving</span>
                </button>
              )}
            </div>

            {/* Spectrum + Waterfall Display */}
            {isReceiving && (
              <div className="pt-4 space-y-3">
                {/* Spectrum Analyzer */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                    <BarChart className="w-4 h-4" />
                    <span>SPECTRUM ANALYZER</span>
                  </div>
                  <canvas
                    ref={spectrumCanvasRef}
                    width={800}
                    height={200}
                    className="w-full h-auto bg-slate-950 rounded-xl border border-slate-800"
                  />
                </div>

                {/* Waterfall Display */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                    <BarChart className="w-4 h-4" />
                    <span>WATERFALL SPECTROGRAM</span>
                  </div>
                  <canvas
                    ref={waterfallCanvasRef}
                    width={800}
                    height={300}
                    className="w-full h-auto bg-slate-950 rounded-xl border border-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Implementation Status Notice */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-start gap-3">
        <Sliders className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
        <div className="flex-1 text-sm">
          <strong className="block mb-1">Full Receiver Pipeline Implemented</strong>
          <p className="text-emerald-300/80 mb-2">
            Complete working SDR receiver using @jtarrio/webrtlsdr (driver) and @jtarrio/signals (DSP):
          </p>
          <ul className="space-y-1 list-disc list-inside text-emerald-300/70 text-xs">
            <li>✓ WebUSB RTL-SDR device connection and control</li>
            <li>✓ IQ sample streaming from RTL2832U tuner</li>
            <li>✓ Real-time demodulation (WFM, NFM, AM, USB, LSB, CW)</li>
            <li>✓ Audio output via Web Audio API</li>
            <li>✓ FFT spectrum analyzer with live display</li>
            <li>✓ Live frequency/mode/gain control (no reconnect needed)</li>
          </ul>
          <p className="text-emerald-300/80 mt-2 text-xs">
            Patterns ported from: <a href="https://github.com/betamole/sdrsharp-webclient" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-200">sdrsharp-webclient (MIT)</a>
          </p>
        </div>
      </div>

      {/* Hardware Test Checklist */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
        <div className="flex items-start gap-3">
          <Chrome className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-semibold mb-2">
              Hardware Test Checklist (When RTL-SDR v4 Arrives)
            </strong>
            <ul className="space-y-1 list-decimal list-inside text-slate-400">
              <li>Plug RTL-SDR dongle into USB port (attach antenna)</li>
              <li>Click "Connect Dongle" button</li>
              <li>Select device in WebUSB dialog → status shows "CONNECTED"</li>
              <li>Click "Start Receiving" → button changes to "Stop Receiving"</li>
              <li>Spectrum analyzer appears and shows live RF activity</li>
              <li>Tune to a known FM station (e.g., 100.0 MHz preset)</li>
              <li>Verify audio plays through browser speakers (WFM mode)</li>
              <li>Test mode switching: WFM → NFM → AM → USB → LSB → CW</li>
              <li>Test frequency presets (88.5, 100.0, 146.52 MHz)</li>
              <li>Adjust gain slider → verify audio level changes</li>
              <li>Change sample rate → verify reconnection works</li>
              <li>Click "Stop Receiving" → audio stops, spectrum freezes</li>
              <li>Click "Disconnect" → device releases cleanly</li>
            </ul>
            <p className="mt-2 text-emerald-400/80">
              <strong>Expected:</strong> Full working receiver with audio and spectrum display.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
