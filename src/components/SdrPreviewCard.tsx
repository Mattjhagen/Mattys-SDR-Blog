import React from 'react';
import { Activity, Radio, Satellite } from 'lucide-react';

export const SdrPreviewCard: React.FC = () => {
  // Check if SDR is online from environment variable
  const sdrOnline = import.meta.env.VITE_SDR_ONLINE === 'true';
  const sdrUrl = import.meta.env.VITE_SDR_URL;

  if (sdrOnline && sdrUrl) {
    // When SDR is online, show live iframe
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl">
        <div className="aspect-[4/3] w-full">
          <iframe
            src={sdrUrl}
            title="Live SDR Waterfall"
            className="w-full h-full border-0"
            allow="autoplay"
          />
        </div>
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-xs font-mono text-slate-300 drop-shadow-lg">
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">SDR ONLINE</span>
          </div>
          <span className="text-amber-400 font-bold bg-slate-950/90 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-slate-800">
            SWL MODE
          </span>
        </div>
      </div>
    );
  }

  // SDR not online yet - show placeholder with planned setup
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl">
      {/* Blurred waterfall placeholder background */}
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Simulated waterfall pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-amber-500/10 to-cyan-500/10" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(251,191,36,0.05)_2px,rgba(251,191,36,0.05)_4px)]" />
        </div>

        {/* Center badge */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-slate-950/95 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl px-6 py-4 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-mono font-bold text-amber-400 tracking-wide">
                RTL-SDR ORDERED
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">ONLINE SOON</p>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Info panel at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3.5">
        <div className="space-y-2.5">
          {/* Planned setup */}
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-white mb-0.5">Planned Setup</div>
              <div className="text-[11px] text-slate-400">RTL-SDR v4 + EFHW / Dipole</div>
            </div>
          </div>

          {/* Preset buttons (disabled) */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '20m FT8', freq: '14.074 MHz' },
              { label: '40m SSB', freq: '7.200 MHz' },
              { label: 'NOAA', freq: '137 MHz' },
              { label: 'ISS', freq: '145.8 MHz' },
              { label: 'Local 2m', freq: '146.52 MHz' }
            ].map((preset, idx) => (
              <button
                key={idx}
                disabled
                title={`${preset.label} (${preset.freq}) - Available when SDR online`}
                className="px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-slate-600 text-[10px] font-mono font-semibold cursor-not-allowed opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top corner status badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-950/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-slate-600" />
        <span className="text-slate-400 font-semibold">SWL MODE</span>
      </div>
    </div>
  );
};
