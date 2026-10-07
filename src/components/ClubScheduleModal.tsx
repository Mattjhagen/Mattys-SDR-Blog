import React, { useState, useEffect } from 'react';
import { X, Calendar, Radio, Clock, MapPin, Users, Wifi, Plus } from 'lucide-react';
import { ClubNetInfo } from '../types/blog';

interface ClubScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NETS_STORAGE_KEY = 'ham_radio_club_nets_v3';

export const ClubScheduleModal: React.FC<ClubScheduleModalProps> = ({
  isOpen,
  onClose
}) => {
  const [nets, setNets] = useState<ClubNetInfo[]>(() => {
    try {
      localStorage.removeItem('ham_radio_club_nets_v1');
      localStorage.removeItem('ham_radio_club_nets_v2');
      const stored = localStorage.getItem(NETS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [timeLocal, setTimeLocal] = useState('');
  const [frequency, setFrequency] = useState('');
  const [offset, setOffset] = useState('');
  const [tone, setTone] = useState('');
  const [mode, setMode] = useState('FM Analog');
  const [netControlCall, setNetControlCall] = useState('');
  const [echolinkNode, setEcholinkNode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(NETS_STORAGE_KEY, JSON.stringify(nets));
    } catch (e) {
      console.error(e);
    }
  }, [nets]);

  if (!isOpen) return null;

  const handleAddNet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !frequency.trim()) return;

    const newNet: ClubNetInfo = {
      name: name.trim(),
      dayOfWeek: dayOfWeek.trim(),
      timeLocal: timeLocal.trim(),
      frequency: frequency.trim(),
      offset: offset.trim(),
      tone: tone.trim(),
      mode: mode.trim(),
      netControlCall: netControlCall.trim().toUpperCase() || 'Rotating',
      echolinkNode: echolinkNode.trim() || undefined,
      description: description.trim() || 'Weekly on-air amateur radio net'
    };

    setNets((prev) => [...prev, newNet]);
    setIsAdding(false);
    setName('');
    setDescription('');
    setNetControlCall('');
  };

  const handleRemoveNet = (index: number) => {
    setNets((prev) => prev.filter((_, i) => i !== index));
  };

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
                Club On-Air Nets & Repeater Directory
              </h3>
              <p className="text-xs text-slate-400">
                Scheduled weekly repeater nets, simplex roundtables, and club emergency drills
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

        {/* Content */}
        <div className="space-y-4 my-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider">
              RECURRING ON-AIR NETS ({nets.length})
            </h4>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Club Net</span>
              </button>
            )}
          </div>

          {/* Add Net Form */}
          {isAdding && (
            <form onSubmit={handleAddNet} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                <span>NEW CLUB ON-AIR NET</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    NET NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Thursday 2m Check-in Net"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    FREQUENCY *
                  </label>
                  <input
                    type="text"
                    required
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="146.880 MHz"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">DAY</label>
                  <input
                    type="text"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    placeholder="Every Thursday"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">TIME</label>
                  <input
                    type="text"
                    value={timeLocal}
                    onChange={(e) => setTimeLocal(e.target.value)}
                    placeholder="19:30 Local"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">OFFSET / TONE</label>
                  <input
                    type="text"
                    value={offset}
                    onChange={(e) => setOffset(e.target.value)}
                    placeholder="-0.600 MHz (103.5)"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">NET CONTROL</label>
                  <input
                    type="text"
                    value={netControlCall}
                    onChange={(e) => setNetControlCall(e.target.value.toUpperCase())}
                    placeholder="Rotating"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs font-mono text-amber-300 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">DESCRIPTION</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Club announcements, tech discussion, visitor check-ins..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950"
                >
                  Save Net
                </button>
              </div>
            </form>
          )}

          {/* List of Nets */}
          <div className="space-y-3">
            {nets.map((net, index) => (
              <div
                key={`${net.name}-${index}`}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-750 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h5 className="font-semibold text-white text-base">
                    {net.name}
                  </h5>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-mono text-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      {net.dayOfWeek} · {net.timeLocal}
                    </span>
                    <button
                      onClick={() => handleRemoveNet(index)}
                      className="text-slate-600 hover:text-red-400 p-1 text-xs"
                      title="Remove net"
                    >
                      ✕
                    </button>
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

            {nets.length === 0 && !isAdding && (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                <Radio className="w-8 h-8 text-slate-600 mx-auto" />
                <h5 className="font-semibold text-white text-sm">
                  No Club Nets Scheduled Yet
                </h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add your local club repeater frequencies, weekly check-in times, and net control operators to keep members informed.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Club Net</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Visitors & new licensees welcome to check in on scheduled nets.
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
