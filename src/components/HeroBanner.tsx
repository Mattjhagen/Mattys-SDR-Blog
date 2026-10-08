import React from 'react';
import { Activity, Radio, Calendar } from 'lucide-react';
import { SdrPreviewCard } from './SdrPreviewCard';

interface HeroBannerProps {
  onOpenWaterfall: () => void;
  onOpenNets: () => void;
  onOpenNewPost: () => void;
  postCount: number;
  contactCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenWaterfall,
  onOpenNets,
  onOpenNewPost,
  postCount,
  contactCount
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
            <span className="text-amber-400 font-bold tracking-wide">AMATEUR RADIO JOURNAL</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>SDR LABS & FIELD EXPEDITIONS</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>LOCAL HAM CLUB</span>
          </div>

          {/* Headline with text-wrap: balance */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance">
            SWL Journal: SDR Experiments & License Study
          </h1>

          {/* Editorial Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            SWL journal tracking shortwave listens, SDR experiments to come, and study notes while I work toward my Technician license. Live RTL-SDR waterfall launching soon from {import.meta.env.VITE_OPERATOR_CITY || 'Omaha'}, {import.meta.env.VITE_OPERATOR_STATE || 'NE'}.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenNewPost}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
              aria-label="Log a new listen or journal entry"
            >
              <Radio className="w-4 h-4 stroke-[2.5]" />
              <span>Log a Listen</span>
            </button>

            <button
              onClick={onOpenWaterfall}
              className="px-4 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors"
              aria-label="Preview SDR waterfall lab (RTL-SDR coming soon)"
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Preview SDR Lab</span>
            </button>

            <button
              onClick={onOpenNets}
              className="px-4 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors"
              aria-label="View club nets schedule"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Club Nets</span>
            </button>
          </div>

          {/* SWL Status Bar - Only show counts when > 0 */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-400">
            {/* Always show SWL status */}
            <div>
              <span className="text-amber-400 font-bold text-base block">SWL</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500">Receive Only</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-white font-bold text-base block">Studying</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500">Technician License</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-300 font-bold text-base block">{import.meta.env.VITE_OPERATOR_CITY || 'Omaha'}, {import.meta.env.VITE_OPERATOR_STATE || 'NE'}</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500">Grid: {import.meta.env.VITE_MAIDENHEAD_GRID || 'EN09xv'}</span>
            </div>

            {/* Only show counts when > 0 */}
            {postCount > 0 && (
              <>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-white font-bold text-base block tabular-nums">{postCount}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Journal Entries</span>
                </div>
              </>
            )}
            {contactCount > 0 && (
              <>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-white font-bold text-base block tabular-nums">{contactCount}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Logged QSOs</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: SDR Preview Card */}
        <div className="lg:col-span-5">
          <SdrPreviewCard />
        </div>
      </div>
    </div>
  );
};
