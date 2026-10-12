import React from 'react';
import { Radio, Plus, Compass, Activity, Volume2, Calendar, Download, BookOpen, Shield } from 'lucide-react';

export type NavigationTab = 'posts' | 'archive' | 'map' | 'waterfall' | 'propagation' | 'nets' | 'visitor-log' | 'scanner';

interface TopNavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenNewPost: () => void;
  onOpenMorseModal: () => void;
  onOpenGridModal: () => void;
  onExportData: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPost,
  onOpenMorseModal,
  onOpenGridModal,
  onExportData
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title (single text element wordmark in display face) */}
        <button
          onClick={() => setActiveTab('posts')}
          className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition-colors">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            73 ON THE AIR
          </span>
        </button>

        {/* Zone 2: 5 Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <button
            onClick={() => setActiveTab('posts')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'posts' || activeTab === 'archive'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
            aria-label="View logbook and journal entries"
          >
            Logbook
          </button>
          <button
            onClick={() => setActiveTab('waterfall')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'waterfall'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
            aria-label="Live SDR waterfall (coming soon)"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400/80" />
            Live SDR <span className="text-[10px] text-slate-500">(Soon)</span>
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
            aria-label="Police scanner and emergency services radio"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400/80" />
            Scanner
          </button>
          <button
            onClick={() => setActiveTab('propagation')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'propagation'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
            aria-label="View band conditions and solar data"
          >
            Band Conditions
          </button>
          <button
            onClick={() => setActiveTab('nets')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'nets'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
            aria-label="View club nets and events"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
            Nets & Events
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
            aria-label="View QSO map and logbook"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400/80" />
            About
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMorseModal}
            title="CW Morse Code Generator & Player"
            aria-label="Open CW Morse code generator and player"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-amber-400/80" />
          </button>
          <button
            onClick={onExportData}
            title="Export ADIF - Download your logbook data"
            aria-label="Export logbook data in ADIF format"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewPost}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
            aria-label="Log a new listen or journal entry"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log QSO</span>
          </button>
        </div>
      </div>
    </header>
  );
};
