import React, { useState } from 'react';
import { X, Compass, ArrowRight, Navigation } from 'lucide-react';
import { gridToLatLon, calculateDistanceAndBearing } from '../utils/maidenhead';

interface GridCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GridCalculatorModal: React.FC<GridCalculatorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [homeGrid, setHomeGrid] = useState('CN87us');
  const [targetGrid, setTargetGrid] = useState('FN31pr');

  if (!isOpen) return null;

  const homeCoord = gridToLatLon(homeGrid);
  const targetCoord = gridToLatLon(targetGrid);
  const calc = calculateDistanceAndBearing(homeGrid, targetGrid);

  const PRESET_TARGETS = [
    { name: 'Tokyo, Japan', grid: 'PM95ur' },
    { name: 'London, UK', grid: 'IO91wm' },
    { name: 'Boston, MA (W1AW)', grid: 'FN31pr' },
    { name: 'Sydney, Australia', grid: 'QF56oe' },
    { name: 'Denver, CO', grid: 'DM79nm' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-white">
                Maidenhead Grid & Beam Heading Calculator
              </h3>
              <p className="text-xs text-slate-400">
                Great circle antenna azimuth and distance between ham radio stations
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

        {/* Inputs */}
        <div className="space-y-4 my-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Station QTH */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-mono text-slate-400 mb-1">
                MY QTH GRID LOCATOR
              </label>
              <input
                type="text"
                value={homeGrid}
                onChange={(e) => setHomeGrid(e.target.value.toUpperCase())}
                placeholder="e.g. CN87us"
                maxLength={6}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-amber-300 font-mono text-base font-bold uppercase focus:outline-none focus:border-amber-400"
              />
              {homeCoord ? (
                <div className="mt-2 text-[11px] font-mono text-slate-400 tabular-nums">
                  {homeCoord.lat.toFixed(4)}° N, {Math.abs(homeCoord.lon).toFixed(4)}° W
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-red-400">Invalid grid format</div>
              )}
            </div>

            {/* Target DX QTH */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-mono text-slate-400 mb-1">
                TARGET / DX STATION GRID
              </label>
              <input
                type="text"
                value={targetGrid}
                onChange={(e) => setTargetGrid(e.target.value.toUpperCase())}
                placeholder="e.g. FN31pr"
                maxLength={6}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-amber-300 font-mono text-base font-bold uppercase focus:outline-none focus:border-amber-400"
              />
              {targetCoord ? (
                <div className="mt-2 text-[11px] font-mono text-slate-400 tabular-nums">
                  {targetCoord.lat.toFixed(4)}° N, {Math.abs(targetCoord.lon).toFixed(4)}° W
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-red-400">Invalid grid format</div>
              )}
            </div>
          </div>

          {/* Quick Target Presets */}
          <div>
            <span className="text-[11px] font-mono text-slate-500 mb-1.5 block">
              QUICK TARGET GRIDS:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TARGETS.map((tgt) => (
                <button
                  key={tgt.grid}
                  onClick={() => setTargetGrid(tgt.grid)}
                  className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {tgt.name} ({tgt.grid})
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Output Card */}
          {calc ? (
            <div className="p-4 rounded-xl bg-black/60 border border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 border-r border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 mb-1">BEAM AZIMUTH</div>
                <div className="text-2xl font-bold font-mono text-amber-400 flex items-center justify-center gap-1">
                  <Navigation
                    className="w-4 h-4 text-amber-400 inline"
                    style={{ transform: `rotate(${calc.bearingDeg}deg)` }}
                  />
                  <span>{calc.bearingDeg}°</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">True North Bearing</div>
              </div>

              <div className="p-2 border-r border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 mb-1">STATUTE MILES</div>
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {calc.distanceMiles.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Air Distance (mi)</div>
              </div>

              <div className="p-2">
                <div className="text-[11px] font-mono text-slate-400 mb-1">KILOMETERS</div>
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {calc.distanceKm.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Great Circle (km)</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 text-center text-xs text-slate-500">
              Enter valid 4-character or 6-character Maidenhead squares (e.g. CN87 or CN87us)
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span>Useful for Yagi rotator pointing and POTA distance logs.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
