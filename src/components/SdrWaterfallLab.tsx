import React, { useEffect, useRef, useState } from 'react';
import { 
  Volume2, VolumeX, Play, Square, Radio, HelpCircle, Terminal, 
  Settings, Disc, Download, AlertCircle, Wifi, WifiOff, Check, 
  Maximize2, Activity, ShieldCheck, Sparkles, Sliders, ExternalLink
} from 'lucide-react';
import { sdrAudio } from '../utils/sdrAudio';
import { LinuxSetupGuideModal } from './LinuxSetupGuideModal';

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
      { freqHz: 14060000, label: 'QRP CW Calling', strength: 0.75, mode: 'CW' },
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

const STREAM_STORAGE_KEY = 'ham_radio_sdr_stream_url_v1';
const STATION_INFO_STORAGE_KEY = 'ham_radio_live_sdr_station_info_v1';

export const SdrWaterfallLab: React.FC = () => {
  // Operating Mode: 'live' = physical RTL-SDR v4 via SDR++, 'simulator' = synthetic RF band practice
  const [labMode, setLabMode] = useState<'live' | 'simulator'>('live');

  // --- LIVE RTL-SDR STATION STREAM STATE ---
  const [streamUrl, setStreamUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STREAM_STORAGE_KEY) || 'http://localhost:8000/live';
    } catch {
      return 'http://localhost:8000/live';
    }
  });

  const [stationInfo, setStationInfo] = useState(() => {
    const defaultInfo = {
      callsign: 'W7SDR',
      frequencyMhz: '14.074',
      band: '20m HF',
      mode: 'USB',
      hardware: 'RTL-SDR Blog v4 · SDR++ (Linux)',
      antenna: '20m Dipole / End-Fed Wire',
      description: 'Listening to 20m FT8 / CW band activity on RTL-SDR Blog v4'
    };
    try {
      const stored = localStorage.getItem(STATION_INFO_STORAGE_KEY);
      if (stored) return { ...defaultInfo, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return defaultInfo;
  });

  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveStreamError, setLiveStreamError] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState(0.8);
  const [liveFilter, setLiveFilter] = useState<'flat' | 'ssb' | 'cw' | 'highcut'>('flat');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [isEditingStation, setIsEditingStation] = useState(false);
  const [isLinuxGuideOpen, setIsLinuxGuideOpen] = useState(false);
  const [audioMeterLevel, setAudioMeterLevel] = useState<number>(0);

  // Audio elements & Web Audio refs for live stream
  const liveAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);

  // Live Canvas refs
  const liveSpectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveWaterfallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveAnimFrameRef = useRef<number | null>(null);

  // --- SIMULATOR STATE ---
  const [selectedBandIndex, setSelectedBandIndex] = useState(0);
  const band = BAND_PRESETS[selectedBandIndex];
  const [tunedFreqHz, setTunedFreqHz] = useState<number>(band.centerFreqHz);
  const [isSimPlaying, setIsSimPlaying] = useState(false);
  const [simVolume, setSimVolume] = useState(0.5);
  const [simMode, setSimMode] = useState<'CW' | 'USB' | 'AM' | 'FT8'>('USB');
  const [waterfallSpeed, setWaterfallSpeed] = useState(1);
  const [rfGain, setRfGain] = useState(30);

  const simSpectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simWaterfallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simAnimFrameRef = useRef<number | null>(null);

  // Save stream URL to storage
  const handleSaveStreamUrl = (newUrl: string) => {
    setStreamUrl(newUrl);
    try {
      localStorage.setItem(STREAM_STORAGE_KEY, newUrl);
    } catch (e) {
      console.error(e);
    }
  };

  // Save station info
  const handleSaveStationInfo = (updated: typeof stationInfo) => {
    setStationInfo(updated);
    setIsEditingStation(false);
    try {
      localStorage.setItem(STATION_INFO_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Clean stop of simulator audio when switching modes
  useEffect(() => {
    if (labMode === 'live') {
      if (isSimPlaying) {
        setIsSimPlaying(false);
        sdrAudio.stop();
      }
    } else {
      if (isLiveConnected) {
        handleStopLiveStream();
      }
    }
  }, [labMode]);

  // Auto-proxy external URLs to avoid CORS issues
  const getProxiedUrl = (url: string): string => {
    // If already a proxy URL, return as-is
    if (url.startsWith('/api/websdr-proxy')) {
      return url;
    }

    // If localhost URL, use directly
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return url;
    }

    // For all external URLs, route through proxy
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return '/api/websdr-proxy?url=' + encodeURIComponent(url);
    }

    // Otherwise use as-is (relative URLs, etc)
    return url;
  };

  // --- LIVE AUDIO CONNECTION & WEBAUDIO SETUP ---
  const handleStartLiveStream = async () => {
    setLiveStreamError(null);
    setIsLiveLoading(true);

    try {
      const audio = liveAudioRef.current;
      if (!audio) return;

      // Auto-proxy external URLs
      const proxiedUrl = getProxiedUrl(streamUrl);
      audio.src = proxiedUrl;
      audio.volume = liveVolume;

      // Initialize Web Audio Context if not ready
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        try {
          const source = ctx.createMediaElementSource(audio);
          const filter = ctx.createBiquadFilter();
          filter.type = 'allpass';
          biquadFilterRef.current = filter;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.8;
          analyserNodeRef.current = analyser;

          source.connect(filter);
          filter.connect(analyser);
          analyser.connect(ctx.destination);
        } catch (corsErr) {
          console.warn('Cross-origin audio source restricted, continuing with direct audio playback:', corsErr);
        }
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      await audio.play();
      setIsLiveConnected(true);
      setIsLiveLoading(false);
    } catch (err) {
      console.error('Failed to play stream:', err);
      setLiveStreamError(
        'Unable to connect to stream at ' + streamUrl + '. Verify your Linux FFmpeg/Icecast streamer is active on port 8000, or check CORS settings.'
      );
      setIsLiveConnected(false);
      setIsLiveLoading(false);
    }
  };

  const handleStopLiveStream = () => {
    const audio = liveAudioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    if (isRecording) {
      handleStopRecording();
    }
    setIsLiveConnected(false);
    setIsLiveLoading(false);
    setAudioMeterLevel(0);
  };

  // Live filter adjustments
  useEffect(() => {
    const filter = biquadFilterRef.current;
    if (!filter) return;

    switch (liveFilter) {
      case 'ssb':
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 0.8;
        break;
      case 'cw':
        filter.type = 'bandpass';
        filter.frequency.value = 700;
        filter.Q.value = 5.0; // narrow telegraph filter
        break;
      case 'highcut':
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        filter.Q.value = 0.7;
        break;
      case 'flat':
      default:
        filter.type = 'allpass';
        break;
    }
  }, [liveFilter]);

  // Sync live audio volume
  useEffect(() => {
    if (liveAudioRef.current) {
      liveAudioRef.current.volume = liveVolume;
    }
  }, [liveVolume]);

  // Audio Clip Recording
  const handleStartRecording = () => {
    const audio = liveAudioRef.current;
    if (!audio) return;

    try {
      recordedChunksRef.current = [];
      let stream: MediaStream | null = null;

      // Try capturing stream from element or WebAudio
      if ('captureStream' in audio) {
        stream = (audio as unknown as { captureStream: () => MediaStream }).captureStream();
      } else if (audioContextRef.current && biquadFilterRef.current) {
        const dest = audioContextRef.current.createMediaStreamDestination();
        biquadFilterRef.current.connect(dest);
        stream = dest.stream;
      }

      if (!stream) {
        alert('Media recording not supported by browser for this audio source.');
        return;
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const cleanFreq = stationInfo.frequencyMhz.replace('.', '_');
        a.download = `${stationInfo.callsign}_RTL-SDR_${cleanFreq}MHz_${new Date().toISOString().slice(0, 10)}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordedSeconds(0);
      recordIntervalRef.current = window.setInterval(() => {
        setRecordedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not start audio clip recorder: ' + err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  // --- LIVE WATERFALL & SPECTRUM ANIMATION LOOP ---
  useEffect(() => {
    if (labMode !== 'live') return;

    const specCanvas = liveSpectrumCanvasRef.current;
    const wfCanvas = liveWaterfallCanvasRef.current;
    if (!specCanvas || !wfCanvas) return;

    const specCtx = specCanvas.getContext('2d');
    const wfCtx = wfCanvas.getContext('2d');
    if (!specCtx || !wfCtx) return;

    // Initialize Waterfall canvas with dark navy
    wfCtx.fillStyle = '#030712';
    wfCtx.fillRect(0, 0, wfCanvas.width, wfCanvas.height);

    const freqData = new Uint8Array(256);

    const render = () => {
      const width = specCanvas.width;
      const height = specCanvas.height;

      // Fetch FFT frequency data if analyser is connected
      if (analyserNodeRef.current && isLiveConnected) {
        analyserNodeRef.current.getByteFrequencyData(freqData);

        // Compute RMS level for S-meter
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        const avg = sum / freqData.length;
        setAudioMeterLevel(Math.min(100, Math.round((avg / 255) * 100)));
      } else {
        // Fallback baseline noise floor when idle or stream unconnected
        for (let i = 0; i < freqData.length; i++) {
          freqData[i] = isLiveConnected ? 30 + Math.random() * 20 : 10 + Math.random() * 8;
        }
        if (!isLiveConnected) setAudioMeterLevel(0);
      }

      // 1. Draw Spectrum Scope
      specCtx.fillStyle = '#060a14';
      specCtx.fillRect(0, 0, width, height);

      // Grid Lines
      specCtx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
      specCtx.lineWidth = 1;
      specCtx.setLineDash([3, 3]);
      for (let y = 30; y < height; y += 35) {
        specCtx.beginPath();
        specCtx.moveTo(0, y);
        specCtx.lineTo(width, y);
        specCtx.stroke();
      }
      for (let x = 60; x < width; x += 90) {
        specCtx.beginPath();
        specCtx.moveTo(x, 0);
        specCtx.lineTo(x, height);
        specCtx.stroke();
      }
      specCtx.setLineDash([]);

      // Spectrum Waveform
      specCtx.beginPath();
      specCtx.moveTo(0, height);
      for (let i = 0; i < freqData.length; i++) {
        const x = (i / (freqData.length - 1)) * width;
        const normalized = freqData[i] / 255;
        const y = height - normalized * (height - 15) - 4;
        if (i === 0) specCtx.moveTo(x, y);
        else specCtx.lineTo(x, y);
      }

      // Gradient Fill
      const grad = specCtx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.85)');
      grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');

      specCtx.strokeStyle = '#f59e0b';
      specCtx.lineWidth = 2;
      specCtx.stroke();

      specCtx.lineTo(width, height);
      specCtx.lineTo(0, height);
      specCtx.fillStyle = grad;
      specCtx.fill();

      // Peak Indicator
      let maxVal = 0;
      let maxIndex = 0;
      for (let i = 0; i < freqData.length; i++) {
        if (freqData[i] > maxVal) {
          maxVal = freqData[i];
          maxIndex = i;
        }
      }
      if (maxVal > 50) {
        const peakX = (maxIndex / (freqData.length - 1)) * width;
        const peakY = height - (maxVal / 255) * (height - 15) - 4;
        specCtx.fillStyle = '#ef4444';
        specCtx.beginPath();
        specCtx.arc(peakX, peakY, 3.5, 0, Math.PI * 2);
        specCtx.fill();
      }

      // 2. Draw Scrolling Waterfall
      const wfWidth = wfCanvas.width;
      const wfHeight = wfCanvas.height;

      // Scroll down by 1 pixel
      wfCtx.drawImage(wfCanvas, 0, 0, wfWidth, wfHeight - 1, 0, 1, wfWidth, wfHeight - 1);

      // Render top row from current FFT data
      const imgData = wfCtx.createImageData(wfWidth, 1);
      const data = imgData.data;

      for (let x = 0; x < wfWidth; x++) {
        const bin = Math.floor((x / wfWidth) * freqData.length);
        const val = freqData[bin] / 255;

        let r = 0, g = 0, b = 0;
        if (val < 0.2) {
          r = Math.floor(val * 5 * 20);
          g = Math.floor(val * 5 * 40);
          b = Math.floor(val * 5 * 120);
        } else if (val < 0.5) {
          const t = (val - 0.2) / 0.3;
          r = 20;
          g = Math.floor(40 + t * 160);
          b = Math.floor(120 + t * 120);
        } else if (val < 0.8) {
          const t = (val - 0.5) / 0.3;
          r = Math.floor(20 + t * 230);
          g = Math.floor(200 + t * 45);
          b = Math.floor(240 * (1 - t));
        } else {
          const t = (val - 0.8) / 0.2;
          r = 255;
          g = Math.floor(245 * (1 - t * 0.7));
          b = Math.floor(t * 120);
        }

        const idx = x * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }

      wfCtx.putImageData(imgData, 0, 0);

      liveAnimFrameRef.current = requestAnimationFrame(render);
    };

    liveAnimFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (liveAnimFrameRef.current) {
        cancelAnimationFrame(liveAnimFrameRef.current);
      }
    };
  }, [labMode, isLiveConnected]);

  // --- SIMULATOR LOGIC & ANIMATION ---
  useEffect(() => {
    setTunedFreqHz(band.centerFreqHz);
  }, [selectedBandIndex, band.centerFreqHz]);

  useEffect(() => {
    if (isSimPlaying) {
      sdrAudio.start();
      sdrAudio.setVolume(simVolume);
    } else {
      sdrAudio.stop();
    }
    return () => {
      sdrAudio.stop();
    };
  }, [isSimPlaying]);

  useEffect(() => {
    if (isSimPlaying) {
      sdrAudio.setVolume(simVolume);
    }
  }, [simVolume, isSimPlaying]);

  const closestSignal = band.signals.reduce((closest, sig) => {
    const dist = Math.abs(sig.freqHz - tunedFreqHz);
    const closestDist = Math.abs(closest.freqHz - tunedFreqHz);
    return dist < closestDist ? sig : closest;
  }, band.signals[0]);

  const distanceToClosestSignal = Math.abs(closestSignal.freqHz - tunedFreqHz);
  const isLockedOnSignal = distanceToClosestSignal < 2500;

  useEffect(() => {
    if (isSimPlaying && isLockedOnSignal) {
      sdrAudio.setTuningOffset(tunedFreqHz - closestSignal.freqHz, closestSignal.strength, simMode);
    } else if (isSimPlaying) {
      sdrAudio.setTuningOffset(99999, 0, simMode);
    }
  }, [tunedFreqHz, isSimPlaying, closestSignal, isLockedOnSignal, simMode]);

  useEffect(() => {
    if (labMode !== 'simulator') return;

    const specCanvas = simSpectrumCanvasRef.current;
    const wfCanvas = simWaterfallCanvasRef.current;
    if (!specCanvas || !wfCanvas) return;

    const specCtx = specCanvas.getContext('2d');
    const wfCtx = wfCanvas.getContext('2d');
    if (!specCtx || !wfCtx) return;

    wfCtx.fillStyle = '#030712';
    wfCtx.fillRect(0, 0, wfCanvas.width, wfCanvas.height);

    const render = () => {
      const width = specCanvas.width;
      const height = specCanvas.height;
      const minFreq = band.centerFreqHz - band.spanHz / 2;
      const maxFreq = band.centerFreqHz + band.spanHz / 2;

      specCtx.fillStyle = '#060a14';
      specCtx.fillRect(0, 0, width, height);

      specCtx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
      specCtx.lineWidth = 1;
      specCtx.setLineDash([3, 3]);
      for (let y = 30; y < height; y += 35) {
        specCtx.beginPath();
        specCtx.moveTo(0, y);
        specCtx.lineTo(width, y);
        specCtx.stroke();
      }
      specCtx.setLineDash([]);

      const numBins = 240;
      const powers: number[] = new Array(numBins).fill(0);
      const noiseBase = 15 + (rfGain / 50) * 12;

      for (let i = 0; i < numBins; i++) {
        powers[i] = noiseBase + Math.random() * 12;
      }

      band.signals.forEach((sig) => {
        if (sig.freqHz >= minFreq && sig.freqHz <= maxFreq) {
          const normPos = (sig.freqHz - minFreq) / band.spanHz;
          const centerBin = Math.floor(normPos * numBins);
          const peakHeight = sig.strength * (height - 35) + Math.random() * 4;

          const widthBins = sig.mode === 'CW' ? 2 : sig.mode === 'FT8' ? 5 : 8;
          for (let offset = -widthBins; offset <= widthBins; offset++) {
            const b = centerBin + offset;
            if (b >= 0 && b < numBins) {
              const falloff = Math.exp(-Math.pow(offset / (widthBins / 2), 2));
              powers[b] = Math.max(powers[b], noiseBase + peakHeight * falloff);
            }
          }
        }
      });

      specCtx.beginPath();
      specCtx.moveTo(0, height);
      for (let i = 0; i < numBins; i++) {
        const x = (i / (numBins - 1)) * width;
        const y = height - powers[i];
        if (i === 0) specCtx.moveTo(x, y);
        else specCtx.lineTo(x, y);
      }

      const grad = specCtx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.85)');
      grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.4)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');

      specCtx.strokeStyle = '#f59e0b';
      specCtx.lineWidth = 1.5;
      specCtx.stroke();

      specCtx.lineTo(width, height);
      specCtx.lineTo(0, height);
      specCtx.fillStyle = grad;
      specCtx.fill();

      // Tuned VFO Line
      const vfoX = ((tunedFreqHz - minFreq) / band.spanHz) * width;
      specCtx.strokeStyle = '#ef4444';
      specCtx.lineWidth = 2;
      specCtx.beginPath();
      specCtx.moveTo(vfoX, 0);
      specCtx.lineTo(vfoX, height);
      specCtx.stroke();

      // Passband shadow
      specCtx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      const passWidth = simMode === 'CW' ? 12 : 36;
      specCtx.fillRect(vfoX - (simMode === 'USB' ? 0 : passWidth / 2), 0, passWidth, height);

      // Waterfall scroll
      const wfWidth = wfCanvas.width;
      const wfHeight = wfCanvas.height;
      wfCtx.drawImage(wfCanvas, 0, 0, wfWidth, wfHeight - waterfallSpeed, 0, waterfallSpeed, wfWidth, wfHeight - waterfallSpeed);

      const imgData = wfCtx.createImageData(wfWidth, waterfallSpeed);
      const data = imgData.data;

      for (let py = 0; py < waterfallSpeed; py++) {
        for (let x = 0; x < wfWidth; x++) {
          const bin = Math.floor((x / wfWidth) * numBins);
          const p = Math.min(1, Math.max(0, powers[bin] / (height - 15)));

          let r = 0, g = 0, b = 0;
          if (p < 0.25) {
            b = Math.floor(p * 4 * 160);
          } else if (p < 0.55) {
            const t = (p - 0.25) / 0.3;
            g = Math.floor(t * 180);
            b = Math.floor(160 + t * 95);
          } else if (p < 0.85) {
            const t = (p - 0.55) / 0.3;
            r = Math.floor(t * 240);
            g = 220;
            b = Math.floor(255 * (1 - t));
          } else {
            const t = (p - 0.85) / 0.15;
            r = 255;
            g = Math.floor(220 * (1 - t * 0.7));
            b = Math.floor(t * 80);
          }

          const idx = (py * wfWidth + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      wfCtx.putImageData(imgData, 0, 0);

      simAnimFrameRef.current = requestAnimationFrame(render);
    };

    simAnimFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (simAnimFrameRef.current) {
        cancelAnimationFrame(simAnimFrameRef.current);
      }
    };
  }, [labMode, band, tunedFreqHz, simMode, waterfallSpeed, rfGain]);

  const handleSimCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = simSpectrumCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const minFreq = band.centerFreqHz - band.spanHz / 2;
    const newFreq = Math.round(minFreq + ratio * band.spanHz);
    setTunedFreqHz(newFreq);
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element for live web stream */}
      <audio
        ref={liveAudioRef}
        crossOrigin="anonymous"
        onEnded={handleStopLiveStream}
        onError={() => {
          setLiveStreamError('Stream connection interrupted or endpoint unreachable at ' + streamUrl);
          setIsLiveConnected(false);
          setIsLiveLoading(false);
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>SOFTWARE DEFINED RADIO WATERFALL & ON-AIR LAB</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            RTL-SDR v4 Station Receiver
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Listen in live to on-air amateur radio signals streamed directly from an RTL-SDR Blog v4 running on Linux.
          </p>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
            <button
              onClick={() => setLabMode('live')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                labMode === 'live'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-red-600 animate-ping' : 'bg-amber-600'}`} />
              <span>Live RTL-SDR v4</span>
            </button>
            <button
              onClick={() => setLabMode('simulator')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                labMode === 'simulator'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>RF Simulator</span>
            </button>
          </div>

          <button
            onClick={() => setIsLinuxGuideOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Linux Setup</span> Guide
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: LIVE RTL-SDR v4 STATION RECEIVER */}
      {/* ======================================================== */}
      {labMode === 'live' && (
        <div className="space-y-6">
          {/* Station Broadcast Banner */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  isLiveConnected
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <Radio className={`w-5 h-5 ${isLiveConnected ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-white">
                      {stationInfo.callsign} On-Air Receiver
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                      isLiveConnected
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {isLiveConnected ? '● BROADCASTING LIVE' : '○ STANDBY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {stationInfo.hardware} · {stationInfo.antenna}
                  </p>
                </div>
              </div>

              {/* Station Tuned Telemetry Display */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-right">
                  <span className="text-[10px] text-slate-500 block uppercase">TUNED FREQUENCY</span>
                  <div className="text-lg font-bold text-amber-300 tabular-nums">
                    {stationInfo.frequencyMhz} <span className="text-xs text-slate-400">MHz</span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-slate-800 text-white rounded font-sans font-semibold">
                      {stationInfo.mode}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingStation(!isEditingStation)}
                  title="Update station frequency & info"
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Operator Edit Drawer (Conditional) */}
            {isEditingStation && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const data = new FormData(form);
                  handleSaveStationInfo({
                    callsign: (data.get('callsign') as string).toUpperCase() || 'W7SDR',
                    frequencyMhz: (data.get('freq') as string) || '14.074',
                    band: (data.get('band') as string) || '20m HF',
                    mode: (data.get('mode') as string) || 'USB',
                    hardware: (data.get('hardware') as string) || 'RTL-SDR Blog v4 · SDR++ (Linux)',
                    antenna: (data.get('antenna') as string) || '20m Dipole',
                    description: (data.get('desc') as string) || ''
                  });
                }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between font-mono font-bold text-white border-b border-slate-800 pb-2">
                  <span>UPDATE ON-AIR FREQUENCY & OPERATOR TELEMETRY</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingStation(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">CALLSIGN</label>
                    <input
                      name="callsign"
                      defaultValue={stationInfo.callsign}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono font-bold text-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">FREQUENCY (MHz)</label>
                    <input
                      name="freq"
                      defaultValue={stationInfo.frequencyMhz}
                      placeholder="14.074"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">DEMOD MODE</label>
                    <select
                      name="mode"
                      defaultValue={stationInfo.mode}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-white"
                    >
                      {['USB', 'LSB', 'CW', 'FM', 'AM', 'FT8', 'WFM'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">BAND</label>
                    <input
                      name="band"
                      defaultValue={stationInfo.band}
                      placeholder="20m HF"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">ANTENNA</label>
                    <input
                      name="antenna"
                      defaultValue={stationInfo.antenna}
                      placeholder="e.g. 20m Dipole / End-Fed Half Wave"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">ON-AIR NOTES</label>
                    <input
                      name="desc"
                      defaultValue={stationInfo.description}
                      placeholder="e.g. Monitoring 14.074 FT8 activity / Calling CQ"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded transition-colors"
                  >
                    Save Broadcast Telemetry
                  </button>
                </div>
              </form>
            )}

            {/* Stream Connection Control Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
              {/* Stream URL Input & Preset selector */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-amber-400" />
                    AUDIO STREAM ENDPOINT (HTTP / MP3 / ICECAST)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveStreamUrl('http://localhost:8000/live')}
                      className="text-[11px] text-slate-500 hover:text-amber-300 underline"
                    >
                      localhost:8000
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setIsLinuxGuideOpen(true)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>How to stream from Linux</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Scanner Feed Presets */}
                <div className="space-y-2 py-2 border-b border-slate-800/50 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Test Streams:</span>
                    <button
                      type="button"
                      onClick={() => handleSaveStreamUrl('http://ice1.somafm.com/groovesalad-128-mp3')}
                      className="px-2 py-1 bg-slate-800/50 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 rounded text-[10px] font-mono text-slate-300 hover:text-amber-300 transition-colors"
                      title="Test music stream - SomaFM Groove Salad (always works!)"
                    >
                      🎵 SomaFM Music
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveStreamUrl('http://ice1.somafm.com/defcon-128-mp3')}
                      className="px-2 py-1 bg-slate-800/50 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 rounded text-[10px] font-mono text-slate-300 hover:text-amber-300 transition-colors"
                      title="DEF CON Radio - Electronic music"
                    >
                      🎧 DEF CON Radio
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveStreamUrl('http://radio.weatherusa.net/NWR/KIH61.mp3')}
                      className="px-2 py-1 bg-slate-800/50 hover:bg-yellow-500/20 border border-slate-700 hover:border-yellow-500/40 rounded text-[10px] font-mono text-slate-300 hover:text-yellow-300 transition-colors"
                      title="NOAA Weather Radio - Omaha KIH61"
                    >
                      🌤️ NOAA Weather
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveStreamUrl('http://stream.live.vc.bbcmedia.co.uk/bbc_world_service')}
                      className="px-2 py-1 bg-slate-800/50 hover:bg-purple-500/20 border border-slate-700 hover:border-purple-500/40 rounded text-[10px] font-mono text-slate-300 hover:text-purple-300 transition-colors"
                      title="BBC World Service Radio"
                    >
                      📻 BBC World
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    💡 Auto-proxied for CORS. For scanner feeds, visit <a href="https://broadcastify.com" target="_blank" rel="noopener" className="text-blue-400 hover:underline">broadcastify.com</a> and find stream URLs for your area.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={(e) => handleSaveStreamUrl(e.target.value)}
                    placeholder="http://localhost:8000/live or https://your-tunnel.trycloudflare.com/live"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                  />

                  {/* Connect / Disconnect Action Button */}
                  {isLiveConnected ? (
                    <button
                      onClick={handleStopLiveStream}
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20 whitespace-nowrap"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Listening</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartLiveStream}
                      disabled={isLiveLoading}
                      className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap"
                    >
                      {isLiveLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>Connect & Listen Live</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Volume & Filter Quick Controls */}
              <div className="flex items-center gap-4 p-2 px-3 rounded-xl bg-slate-950 border border-slate-800 shrink-0 self-start lg:self-auto">
                <div className="flex items-center gap-2">
                  {liveVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  )}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={liveVolume}
                    onChange={(e) => setLiveVolume(parseFloat(e.target.value))}
                    className="w-20 sm:w-24 accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div className="h-5 w-px bg-slate-800" />

                {/* Audio Filter Dropdown */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-[11px] text-slate-500">FILTER:</span>
                  <select
                    value={liveFilter}
                    onChange={(e) => setLiveFilter(e.target.value as typeof liveFilter)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none"
                  >
                    <option value="flat">Wide / Flat</option>
                    <option value="ssb">SSB Voice (300Hz-2.8kHz)</option>
                    <option value="cw">CW Sharp (700Hz)</option>
                    <option value="highcut">Noise Cut (&lt;2.4kHz)</option>
                  </select>
                </div>

                <div className="h-5 w-px bg-slate-800" />

                {/* Audio Clip Recorder Button */}
                {isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="px-3 py-1 rounded bg-red-600 text-white font-mono text-xs flex items-center gap-1.5 animate-pulse"
                  >
                    <Disc className="w-3.5 h-3.5 fill-current" />
                    <span>Stop ({recordedSeconds}s)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    disabled={!isLiveConnected}
                    className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Disc className="w-3.5 h-3.5 text-red-400" />
                    <span>Record Clip</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Message if stream connection fails */}
            {liveStreamError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{liveStreamError}</p>
                  <p className="mt-1 text-[11px] text-red-400">
                    Click the <strong>Linux Setup Guide</strong> button above to see the single-line terminal command for FFmpeg or Cloudflare Tunnel to expose your SDR++ audio cleanly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* S-Meter & Audio Signal VU Gauge */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs font-bold">SIGNAL S-METER:</span>
              <div className="flex items-center gap-1">
                {['S1', 'S3', 'S5', 'S7', 'S9', '+10', '+20', '+30'].map((mark, i) => {
                  const threshold = (i + 1) * 12;
                  const isActive = audioMeterLevel >= threshold;
                  return (
                    <div key={mark} className="flex flex-col items-center">
                      <div className={`w-5 sm:w-7 h-3 rounded-sm transition-colors ${
                        isActive
                          ? i >= 5
                            ? 'bg-red-500 shadow-sm shadow-red-500/50'
                            : 'bg-amber-400 shadow-sm shadow-amber-400/50'
                          : 'bg-slate-800'
                      }`} />
                      <span className={`text-[9px] mt-0.5 ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                        {mark}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <div>
                <span>STATUS: </span>
                <strong className={isLiveConnected ? 'text-emerald-400' : 'text-slate-500'}>
                  {isLiveConnected ? 'STREAM ACTIVE' : 'AWAITING CONNECTION'}
                </strong>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div>
                <span>FILTER: </span>
                <strong className="text-amber-400 uppercase">{liveFilter}</strong>
              </div>
            </div>
          </div>

          {/* Real-Time Live Stream Spectrum Scope & Audio Waterfall Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
            {/* Live Spectrum Canvas */}
            <div className="relative">
              <div className="absolute top-2.5 left-3.5 z-10 flex items-center gap-2 text-[11px] font-mono text-slate-400 pointer-events-none">
                <span className="text-amber-400 font-bold">LIVE AUDIO FFT SPECTRUM</span>
                <span className="text-slate-600">·</span>
                <span>DEMODULATED AUDIO PASSBAND (0 Hz – 4 kHz)</span>
              </div>
              <canvas
                ref={liveSpectrumCanvasRef}
                width={900}
                height={160}
                className="w-full h-40 block"
              />
            </div>

            {/* Frequency Ruler Divider */}
            <div className="h-6 bg-slate-900 border-y border-slate-800 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 tabular-nums">
              <span>0 Hz (DC)</span>
              <span className="text-amber-400 font-bold">▲ AUDIO CENTER: 1.5 kHz</span>
              <span>4.0 kHz (AF High Cut)</span>
            </div>

            {/* Live Scrolling Waterfall Canvas */}
            <div className="relative">
              <div className="absolute top-2.5 left-3.5 z-10 flex items-center gap-2 text-[11px] font-mono text-slate-400/80 pointer-events-none">
                <span className="text-amber-400 font-bold">LIVE AUDIO WATERFALL DENSITY</span>
                <span className="text-slate-600">·</span>
                <span>TEMPORAL SIGNAL HISTOGRAM</span>
              </div>
              <canvas
                ref={liveWaterfallCanvasRef}
                width={900}
                height={220}
                className="w-full h-56 block"
              />
            </div>
          </div>

          {/* Quick Setup Instructions Callout */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">
                  How do I connect my RTL-SDR v4 on Linux to this live player?
                </strong>
                <p className="text-slate-400 text-xs">
                  Run SDR++ on your Linux box, route audio to a virtual null sink, and launch a 1-line FFmpeg stream or Cloudflare tunnel.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsLinuxGuideOpen(true)}
              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap transition-colors"
            >
              Open Linux Setup Wizard
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: SIMULATED RF SPECTRUM & WATERFALL PRACTICE */}
      {/* ======================================================== */}
      {labMode === 'simulator' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Notice banner for Simulator Mode */}
          <div className="p-3 px-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>
                <strong>RF Band Simulator Mode:</strong> Ideal for practicing tuning, exploring HF/VHF band plans, or testing demodulation when your physical RTL-SDR is powered off.
              </span>
            </div>
            <button
              onClick={() => setLabMode('live')}
              className="text-amber-400 hover:underline font-bold font-mono text-xs whitespace-nowrap"
            >
              Switch to Live Receiver ➔
            </button>
          </div>

          {/* Band Selector Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-500 mr-1">RF PRESET BANDS:</span>
            {BAND_PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                onClick={() => setSelectedBandIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                  selectedBandIndex === idx
                    ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* VFO Dial & Receiver Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* VFO Frequency Display */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-500 block uppercase">TUNED VFO FREQUENCY</span>
              <div className="text-2xl font-bold text-amber-400 tracking-wider tabular-nums my-1">
                {(tunedFreqHz / 1000000).toFixed(4)} <span className="text-xs text-slate-400">MHz</span>
              </div>
              <span className="text-xs text-slate-400 block truncate">
                {band.description}
              </span>
            </div>

            {/* Demodulation & Volume */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">DEMODULATION</span>
                <button
                  onClick={() => setIsSimPlaying(!isSimPlaying)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    isSimPlaying
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  }`}
                >
                  {isSimPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Mute Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Listen Audio</span>
                    </>
                  )}
                </button>
              </div>

              <div className="my-2 flex items-center gap-2">
                {simVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={simVolume}
                  onChange={(e) => setSimVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['USB', 'CW', 'FT8', 'AM'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSimMode(m)}
                    className={`flex-1 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
                      simMode === m
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* RF Gain & Speed */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>RF GAIN</span>
                <span className="text-amber-400 font-bold">{rfGain} dB</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={rfGain}
                onChange={(e) => setRfGain(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer my-2"
              />
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                <span className="text-[11px]">WATERFALL RATE:</span>
                <div className="flex gap-1">
                  {[1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setWaterfallSpeed(spd)}
                      className={`px-2 py-0.5 text-[10px] rounded ${
                        waterfallSpeed === spd
                          ? 'bg-slate-700 text-white font-bold'
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

          {/* Simulator Spectrum Scope & RF Waterfall Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
            {/* Spectrum Scope Canvas */}
            <div className="relative">
              <div className="absolute top-2.5 left-3.5 z-10 flex items-center gap-2 text-[11px] font-mono text-slate-400 pointer-events-none">
                <span className="text-amber-400 font-bold">RF FFT SPECTRUM</span>
                <span className="text-slate-600">·</span>
                <span>CLICK ANYWHERE ON CANVAS TO TUNE VFO</span>
              </div>
              <canvas
                ref={simSpectrumCanvasRef}
                width={900}
                height={160}
                onClick={handleSimCanvasClick}
                className="w-full h-40 cursor-crosshair block"
              />
            </div>

            {/* Frequency Ruler Divider */}
            <div className="h-6 bg-slate-900 border-y border-slate-800 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 tabular-nums">
              <span>{((band.centerFreqHz - band.spanHz / 2) / 1000000).toFixed(4)} MHz</span>
              <span className="text-amber-400 font-bold">▲ VFO: {(tunedFreqHz / 1000000).toFixed(4)} MHz</span>
              <span>{((band.centerFreqHz + band.spanHz / 2) / 1000000).toFixed(4)} MHz</span>
            </div>

            {/* Scrolling Waterfall Canvas */}
            <div className="relative">
              <div className="absolute top-2.5 left-3.5 z-10 flex items-center gap-2 text-[11px] font-mono text-slate-400/80 pointer-events-none">
                <span className="text-amber-400 font-bold">RF WATERFALL DENSITY HISTOGRAM</span>
              </div>
              <canvas
                ref={simWaterfallCanvasRef}
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
                      setSimMode(sig.mode);
                      if (!isSimPlaying) setIsSimPlaying(true);
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
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Signal Strength: {Math.round(sig.strength * 100)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Linux Setup Modal */}
      <LinuxSetupGuideModal
        isOpen={isLinuxGuideOpen}
        onClose={() => setIsLinuxGuideOpen(false)}
        onApplyStreamUrl={(url) => handleSaveStreamUrl(url)}
      />
    </div>
  );
};
