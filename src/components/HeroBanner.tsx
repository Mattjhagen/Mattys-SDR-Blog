import React from 'react';
import { Activity, Radio, Calendar, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  onOpenWaterfall: () => void;
  onOpenNets: () => void;
  onOpenNewPost: () => void;
  postCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenWaterfall,
  onOpenNets,
  onOpenNewPost,
  postCount
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 p-6 sm:p-10 lg:p-12 mb-10">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Typographic Editorial Impact */}
        <div className="lg:col-span-7 space-y-5">
          {/* Unboxed Metadata Kicker */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-amber-400 font-bold tracking-wide">STATION W7SDR</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>GRID CN87us</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>VALLEY AMATEUR RADIO CLUB</span>
          </div>

          {/* Headline with text-wrap: balance */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance">
            RF Explorations, SDR DSP & Field Transmissions
          </h1>

          {/* Editorial Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            A technical journal chronicling Software Defined Radio experiments, low-power QRP summits, homebrew magnetic loops, and weather satellite downlinks to keep our local club informed.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenWaterfall}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Activity className="w-4 h-4 stroke-[2.5]" />
              <span>Launch SDR Waterfall Lab</span>
            </button>

            <button
              onClick={onOpenNets}
              className="px-4 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Weekly Club Nets</span>
            </button>
          </div>

          {/* Unboxed Statistics Counter */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-6 text-xs font-mono text-slate-400">
            <div>
              <span className="text-white font-bold text-base block tabular-nums">{postCount}</span>
              <span className="text-[11px] text-slate-500">Documented Logs</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-white font-bold text-base block tabular-nums">146.88 MHz</span>
              <span className="text-[11px] text-slate-500">Club 2m Repeater</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-amber-400 font-bold text-base block tabular-nums">SFI 168</span>
              <span className="text-[11px] text-slate-500">Cycle 25 Solar Flux</span>
            </div>
          </div>
        </div>

        {/* Right Column: Shack Visual Container */}
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl group">
            <img
              src="/src/assets/images/hero_ham_shack_1791391157714.jpg"
              alt="Ham radio shack and SDR laboratory desk at night"
              referrerPolicy="no-referrer"
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

            {/* Overlaid Live Station Badge */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-xs font-mono text-slate-300 drop-shadow">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">SHACK VFO ACTIVE</span>
              </div>
              <span className="text-amber-400 font-bold">14.074 MHz USB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
