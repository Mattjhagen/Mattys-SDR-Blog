import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Square, Radio, HelpCircle } from 'lucide-react';
import { sdrAudio } from '../utils/sdrAudio';

interface SignalPeak {
  freqHz: number;
  label: string;
  strength: number; // 0 to 1
  mode: 'CW' | 'USB' | 'AM' | 'FT8';
}

interface BandPreset {
  name: string;
  centerFreqHz: number;
  spanHz: number;
  description: string;
  signals: SignalPeak[];
}

const BAND_PRESETS: BandPreset[] = [
  {
    name: '20m Band (HF)',
    centerFreqHz: 14075000,
    spanHz: 60000,
    description: 'High Frequency DX band: FT8 digital audio chirps & CW QRP calling',
    signals: [
      { freqHz: 14060000, label: 'QRP CW Calling (W7SDR)', strength: 0.75, mode: 'CW' },
      { freqHz: 14070000, label: 'PSK31 Activity', strength: 0.5, mode: 'USB' },
      { freqHz: 14074000, label: 'FT8 Digital Activity (WSJT-X)', strength: 0.95, mode: 'FT8' },
      { freqHz: 14085000, label: 'RTTY DX Contest', strength: 0.6, mode: 'USB' }
    ]
  },
  {
    name: '40m Band (HF)',
    centerFreqHz: 7150000,
    spanHz: 80000,
    description: 'Evening regional ragchew and CW net frequencies',
    signals: [
      { freqHz: 7030000, label: 'QRP CW Net (West Coast)', strength: 0.7, mode: 'CW' },
      { freqHz: 7125000, label: 'Club Round-table SSB', strength: 0.85, mode: 'USB' },
      { freqHz: 7180000, label: 'AM Broadcast Carrier', strength: 0.6, mode: 'AM' }
    ]
  },
  {
    name: '137 MHz WX Satellites',
    centerFreqHz: 137100000,
    spanHz: 120000,
    description: 'NOAA-19 APT & Meteor-M2 Polar Weather Satellite Downlinks',
    signals: [
      { freqHz: 137100000, label: 'NOAA-19 APT Downlink', strength: 0.9, mode: 'AM' },
      { freqHz: 137620000, label: 'NOAA-15 Telemetry', strength: 0.65, mode: 'AM' }
    ]
  },
  {
    name: '2m Band (VHF)',
    centerFreqHz: 146520000,
    spanHz: 200000,
    description: 'National Simplex Calling 146.520 & local repeater inputs',
    signals: [
      { freqHz: 146520000, label: 'National FM Simplex Calling', strength: 0.85, mode: 'AM' },
      { freqHz: 146880000, label: 'Valley ARC 2m Repeater (W7HRC)', strength: 0.95, mode: 'AM' }
    ]
  }
];

export const SdrWaterfallLab: React.FC = () => {
  const [selectedBandIndex, setSelectedBandIndex] = useState(0);
  const band = BAND_PRESETS[selectedBandIndex];

  const [tunedFreqHz, setTunedFreqHz] = useState<number>(band.centerFreqHz);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [selectedMode, setSelectedMode] = useState<'CW' | 'USB' | 'AM' | 'FT8'>('USB');
  const [waterfallSpeed, setWaterfallSpeed] = useState(1);
  const [rfGain, setRfGain] = useState(30);

  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // When band changes, center tuned frequency
  useEffect(() => {
    setTunedFreqHz(band.centerFreqHz);
  }, [selectedBandIndex, band.centerFreqHz]);

  // Audio start/stop & tuning
  useEffect(() => {
    if (isPlayingAudio) {
      sdrAudio.start();
      sdrAudio.setVolume(volume);
    } else {
      sdrAudio.stop();
    }
    return () => {
      sdrAudio.stop();
    };
  }, [isPlayingAudio]);

  useEffect(() => {
    if (isPlayingAudio) {
      sdrAudio.setVolume(volume);
    }
  }, [volume, isPlayingAudio]);

  // Find closest active signal to calculate S-meter & tone pitch
  const closestSignal = band.signals.reduce((closest, sig) => {
    const dist = Math.abs(sig.freqHz - tunedFreqHz);
    const closestDist = Math.abs(closest.freqHz - tunedFreqHz);
    return dist < closestDist ? sig : closest;
  }, band.signals[0]);

  const distanceToClosestSignal = Math.abs(closestSignal.freqHz - tunedFreqHz);
  const isLockedOnSignal = distanceToClosestSignal < 2500;

  // Update audio tone
  useEffect(() => {
    if (isPlayingAudio && isLockedOnSignal) {
      sdrAudio.setTuningOffset(tunedFreqHz - closestSignal.freqHz, closestSignal.strength, selectedMode);
    } else if (isPlayingAudio) {
      sdrAudio.setTuningOffset(99999, 0, selectedMode);
    }
  }, [tunedFreqHz, isPlayingAudio, closestSignal, isLockedOnSignal, selectedMode]);

  // Render Waterfall and Spectrum Loop
  useEffect(() => {
    const specCanvas = spectrumCanvasRef.current;
    const wfCanvas = waterfallCanvasRef.current;
    if (!specCanvas || !wfCanvas) return;

    const specCtx = specCanvas.getContext('2d');
    const wfCtx = wfCanvas.getContext('2d');
    if (!specCtx || !wfCtx) return;

    let tick = 0;

    const render = () => {
      tick++;
      const w = specCanvas.width;
      const hSpec = specCanvas.height;
      const hWf = wfCanvas.height;

      const minF = band.centerFreqHz - band.spanHz / 2;
      const maxF = band.centerFreqHz + band.spanHz / 2;

      // 1. Calculate Spectrum Line Data
      const bins = w;
      const spectrumData: number[] = new Array(bins);
      const baseNoise = 30 + (rfGain / 50) * 15;

      for (let x = 0; x < bins; x++) {
        const f = minF + (x / bins) * (maxF - minF);
        // Atmospheric noise flutter
        let power = baseNoise + Math.random() * 8 + Math.sin(x * 0.04 + tick * 0.05) * 2;

        // Add signal Gaussian peaks
        for (const sig of band.signals) {
          const sigX = ((sig.freqHz - minF) / (maxF - minF)) * bins;
          const dist = Math.abs(x - sigX);
          if (dist < 18) {
            const bell = Math.exp(-(dist * dist) / 16);
            // Signal pulsing modulation
            let mod = 1.0;
            if (sig.mode === 'CW') {
              mod = (Math.sin(tick * 0.15) > 0.1) ? 1.0 : 0.2;
            } else if (sig.mode === 'FT8') {
              mod = 0.9 + Math.sin(tick * 0.3) * 0.15;
            }
            power += sig.strength * 65 * bell * mod;
          }
        }
        spectrumData[x] = Math.min(hSpec - 10, Math.max(10, power));
      }

      // 2. Draw Spectrum Scope
      specCtx.fillStyle = '#050a14';
      specCtx.fillRect(0, 0, w, hSpec);

      // Grid lines
      specCtx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
      specCtx.lineWidth = 1;
      specCtx.beginPath();
      for (let y = 20; y < hSpec; y += 25) {
        specCtx.moveTo(0, y);
        specCtx.lineTo(w, y);
      }
      for (let x = 0; x < w; x += 100) {
        specCtx.moveTo(x, 0);
        specCtx.lineTo(x, hSpec);
      }
      specCtx.stroke();

      // Spectrum curve (gradient phosphor amber/cyan)
      const grad = specCtx.createLinearGradient(0, 0, 0, hSpec);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
      grad.addColorStop(0.6, 'rgba(6, 182, 212, 0.2)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');

      specCtx.beginPath();
      specCtx.moveTo(0, hSpec);
      for (let x = 0; x < bins; x++) {
        const yVal = hSpec - spectrumData[x];
        specCtx.lineTo(x, yVal);
      }
      specCtx.lineTo(w, hSpec);
      specCtx.closePath();
      specCtx.fillStyle = grad;
      specCtx.fill();

      // Top line stroke
      specCtx.beginPath();
      for (let x = 0; x < bins; x++) {
        const yVal = hSpec - spectrumData[x];
        if (x === 0) specCtx.moveTo(x, yVal);
        else specCtx.lineTo(x, yVal);
      }
      specCtx.strokeStyle = '#38bdf8';
      specCtx.lineWidth = 1.5;
      specCtx.stroke();

      // Tuned VFO Marker (Amber Needle)
      const tunedX = ((tunedFreqHz - minF) / (maxF - minF)) * w;
      if (tunedX >= 0 && tunedX <= w) {
        specCtx.strokeStyle = '#f59e0b';
        specCtx.lineWidth = 2;
        specCtx.setLineDash([4, 4]);
        specCtx.beginPath();
        specCtx.moveTo(tunedX, 0);
        specCtx.lineTo(tunedX, hSpec);
        specCtx.stroke();
        specCtx.setLineDash([]);

        // Demodulation passband box
        const passbandWidthPx = Math.max(12, (2800 / band.spanHz) * w);
        specCtx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        specCtx.fillRect(tunedX - 2, 0, passbandWidthPx, hSpec);
      }

      // Signal labels on spectrum
      for (const sig of band.signals) {
        const sigX = ((sig.freqHz - minF) / (maxF - minF)) * w;
        if (sigX > 15 && sigX < w - 15) {
          specCtx.fillStyle = '#94a3b8';
          specCtx.font = '10px "JetBrains Mono", monospace';
          specCtx.fillText(sig.label, sigX - 20, 16);
          // little triangle marker
          specCtx.fillStyle = '#f59e0b';
          specCtx.beginPath();
          specCtx.moveTo(sigX, 20);
          specCtx.lineTo(sigX - 3, 24);
          specCtx.lineTo(sigX + 3, 24);
          specCtx.fill();
        }
      }

      // 3. Scroll and Draw Waterfall (Bottom Half)
      if (tick % waterfallSpeed === 0) {
        // Shift existing waterfall canvas content down by 1 pixel
        const imgData = wfCtx.getImageData(0, 0, w, hWf - 1);
        wfCtx.putImageData(imgData, 0, 1);

        // Generate top row with heatmap colors
        const rowData = wfCtx.createImageData(w, 1);
        for (let x = 0; x < w; x++) {
          const power = spectrumData[x];
          // Map power (0..120) to heat map (Blue -> Cyan -> Green -> Yellow -> Red)
          const norm = Math.max(0, Math.min(1, (power - baseNoise) / 60));

          let r = 0, g = 0, b = 0;
          if (norm < 0.25) {
            // Dark blue to deep cyan
            b = Math.floor(norm * 4 * 180 + 30);
            g = Math.floor(norm * 4 * 80);
          } else if (norm < 0.5) {
            // Cyan to bright green
            const sub = (norm - 0.25) * 4;
            b = Math.floor((1 - sub) * 200);
            g = Math.floor(80 + sub * 150);
          } else if (norm < 0.75) {
            // Green to yellow
            const sub = (norm - 0.5) * 4;
            g = 230;
            r = Math.floor(sub * 240);
          } else {
            // Yellow to white/red hot
            const sub = (norm - 0.75) * 4;
            r = 255;
            g = Math.floor(230 * (1 - sub * 0.7));
            b = Math.floor(sub * 180);
          }

          const idx = x * 4;
          rowData.data[idx] = r;
          rowData.data[idx + 1] = g;
          rowData.data[idx + 2] = b;
          rowData.data[idx + 3] = 255;
        }
        wfCtx.putImageData(rowData, 0, 0);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [band, tunedFreqHz, rfGain, waterfallSpeed]);

  // Click to tune on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    const minF = band.centerFreqHz - band.spanHz / 2;
    const maxF = band.centerFreqHz + band.spanHz / 2;
    const newFreq = Math.round(minF + ratio * (maxF - minF));
    setTunedFreqHz(newFreq);
  };

  const formattedFreq = (tunedFreqHz / 1000000).toFixed(6);

  // S-Meter calculation
  const sUnit = isLockedOnSignal
    ? Math.min(9, Math.floor(closestSignal.strength * 9))
    : Math.floor(1 + Math.random() * 2);
  const plusDb = isLockedOnSignal && closestSignal.strength > 0.8 ? '+15dB' : '';

  return (
    <div className="space-y-6">
      {/* Header & Band Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
            <Radio className="w-3.5 h-3.5" />
            <span>OPEN LAB · REALTIME SDR WATERFALL & SPECTRUM SCOPE</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Software Defined Radio Receiver Lab
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Interactive DSP spectrum waterfall simulator with live receiver audio synthesis and frequency dial.
          </p>
        </div>

        {/* Band Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {BAND_PRESETS.map((p, idx) => (
            <button
              key={p.name}
              onClick={() => setSelectedBandIndex(idx)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedBandIndex === idx
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Receiver Control Deck */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        {/* VFO Frequency Display */}
        <div className="md:col-span-2 flex flex-col justify-between p-3 rounded-lg bg-black/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>MAIN VFO FREQUENCY</span>
            <span className="text-amber-400/90">{band.name}</span>
          </div>
          <div className="my-1 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-3xl sm:text-4xl font-bold text-amber-400 tracking-wider">
              {formattedFreq}
            </span>
            <span className="text-sm font-semibold text-amber-500/70">MHz</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <span className="font-mono">
              S-METER: <strong className="text-white">S{sUnit} {plusDb}</strong>
            </span>
            <span className="text-slate-500 truncate max-w-[200px]">
              {isLockedOnSignal ? `Locked: ${closestSignal.label}` : 'Band Noise'}
            </span>
          </div>
        </div>

        {/* Audio Output Controls */}
        <div className="flex flex-col justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AUDIO DEMOD</span>
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
                isPlayingAudio
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  Mute
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  Listen Live
                </>
              )}
            </button>
          </div>

          <div className="my-2 flex items-center gap-2">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Demod Mode Tabs */}
          <div className="flex items-center gap-1">
            {(['USB', 'CW', 'FT8', 'AM'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMode(m)}
                className={`flex-1 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
                  selectedMode === m
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* DSP Controls */}
        <div className="flex flex-col justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            <span>RF GAIN & WATERFALL RATE</span>
          </div>

          <div className="space-y-2 my-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono">RF Gain</span>
              <span className="font-mono tabular-nums text-amber-300">{rfGain} dB</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={rfGain}
              onChange={(e) => setRfGain(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <span className="text-[11px]">Speed:</span>
            <div className="flex gap-1">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setWaterfallSpeed(spd)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                    waterfallSpeed === spd
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {spd === 1 ? 'Fast' : spd === 2 ? 'Norm' : 'Slow'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Waterfall & Spectrum Displays */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
        {/* Spectrum Scope Canvas */}
        <div className="relative">
          <div className="absolute top-2 left-3 z-10 text-[11px] font-mono text-slate-400 pointer-events-none">
            FFT SPECTRUM (CLICK ANYWHERE TO TUNE)
          </div>
          <canvas
            ref={spectrumCanvasRef}
            width={900}
            height={160}
            onClick={handleCanvasClick}
            className="w-full h-40 cursor-crosshair block"
          />
        </div>

        {/* Frequency Ruler Divider */}
        <div className="h-6 bg-slate-900 border-y border-slate-800 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 tabular-nums">
          <span>{((band.centerFreqHz - band.spanHz / 2) / 1000000).toFixed(4)} MHz</span>
          <span className="text-amber-400 font-bold">▲ VFO: {formattedFreq} MHz</span>
          <span>{((band.centerFreqHz + band.spanHz / 2) / 1000000).toFixed(4)} MHz</span>
        </div>

        {/* Scrolling Waterfall Canvas */}
        <div className="relative">
          <div className="absolute top-2 left-3 z-10 text-[11px] font-mono text-slate-400/80 pointer-events-none">
            WATERFALL DENSITY HISTOGRAM
          </div>
          <canvas
            ref={waterfallCanvasRef}
            width={900}
            height={220}
            className="w-full h-56 block"
          />
        </div>
      </div>

      {/* Signal Directory & Quick Jump Buttons */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            Active Signals on this Band (Click to Jump & Listen)
          </h3>
          <span className="text-xs text-slate-500 font-mono">{band.signals.length} signals spotted</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {band.signals.map((sig) => {
            const isCurrent = Math.abs(sig.freqHz - tunedFreqHz) < 1000;
            return (
              <button
                key={sig.freqHz}
                onClick={() => {
                  setTunedFreqHz(sig.freqHz);
                  setSelectedMode(sig.mode);
                  if (!isPlayingAudio) setIsPlayingAudio(true);
                }}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {(sig.freqHz / 1000000).toFixed(4)} MHz
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {sig.mode}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-medium truncate">
                  {sig.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Signal Strength: {Math.round(sig.strength * 100)}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Club Explainer Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-300">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-300">Club Operating Tip:</strong> When listening with your computer or phone speakers, click <span className="font-semibold text-white">"Listen Live"</span> and select the matching demodulation mode. The receiver simulates CW beat-frequency oscillators (BFO), SSB voice passbands, and WSJT-X FT8 tones as you click and drag across the waterfall!
        </p>
      </div>
    </div>
  );
};
