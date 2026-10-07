import React from 'react';
import { X, Calendar, Radio, Clock, MapPin, Users, Wifi } from 'lucide-react';
import { CLUB_NETS } from '../data/initialPosts';

interface ClubScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClubScheduleModal: React.FC<ClubScheduleModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-white">
                Valley Amateur Radio Club On-Air Schedule
              </h3>
              <p className="text-xs text-slate-400">
                Weekly VHF repeaters, HF roundtable nets, and upcoming club field outings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Weekly Net Cards */}
        <div className="space-y-4 my-5">
          <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider">
            RECURRING ON-AIR NETS
          </h4>

          <div className="space-y-3">
            {CLUB_NETS.map((net) => (
              <div
                key={net.name}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-750 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h5 className="font-semibold text-white text-base">
                    {net.name}
                  </h5>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{net.dayOfWeek} · {net.timeLocal}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                  {net.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">FREQUENCY</span>
                    <span className="text-white font-bold">{net.frequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">OFFSET / TONE</span>
                    <span className="text-slate-300">{net.offset} ({net.tone})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MODE</span>
                    <span className="text-slate-300">{net.mode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">NET CONTROL</span>
                    <span className="text-amber-400 font-bold">{net.netControlCall}</span>
                  </div>
                </div>

                {net.echolinkNode && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
                    <Wifi className="w-3 h-3 text-cyan-400" />
                    <span>Echolink Node: <strong className="text-slate-200 font-mono">{net.echolinkNode}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upcoming Field Meetups */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">
              UPCOMING FIELD TRIPS & ACTIVATIONS
            </h4>

            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Twin Peaks POTA Group Outing (Park K-4392)
                </span>
                <span className="font-mono text-[11px]">Saturday, Oct 24</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Meet at the park trailhead at 09:00. We will deploy battery QRP stations on 20m/40m/10m and conduct an antenna shootout (End-Fed Half Wave vs 1/4 Wave Vertical with elevated radials). Bring folding chairs and your favorite handheld transceiver!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Visitors & new technicians always welcome to check in!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
