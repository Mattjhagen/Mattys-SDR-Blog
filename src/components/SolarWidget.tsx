import React, { useState } from 'react';
import { Sun, Compass, Radio, RefreshCw, Zap } from 'lucide-react';
import { SOLAR_CONDITIONS } from '../data/initialPosts';

export const SolarWidget: React.FC = () => {
  const [sfi, setSfi] = useState(168);
  const [sn, setSn] = useState(142);
  const [aIndex, setAIndex] = useState(7);
  const [kIndex, setKIndex] = useState(2);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSfi(165 + Math.floor(Math.random() * 8));
      setSn(138 + Math.floor(Math.random() * 10));
      setKIndex(1 + Math.floor(Math.random() * 2));
      setAIndex(5 + Math.floor(Math.random() * 4));
      setIsRefreshing(false);
    }, 400);
  };

  const getStatusColor = (status: 'Good' | 'Fair' | 'Poor') => {
    switch (status) {
      case 'Good':
        return 'text-emerald-400 font-medium';
      case 'Fair':
        return 'text-amber-400 font-medium';
      case 'Poor':
        return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
            <Sun className="w-3.5 h-3.5" />
            <span>IONOSPHERE & HF PROPAGATION REPORT</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Solar Flux & Band Conditions
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time space weather indices and MUF (Maximum Usable Frequency) band opening forecasts.
          </p>
        </div>

        <button
          onClick={handleSimulateRefresh}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span>Fetch Space Weather</span>
        </button>
      </div>

      {/* Solar Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* SFI */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-mono text-slate-400">SOLAR FLUX INDEX (SFI)</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
              {sfi}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Elevated (+6)</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Higher values (&gt;120) favor 15m, 12m, and 10m DX.
          </div>
        </div>

        {/* Sunspot Number */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-mono text-slate-400">SUNSPOT NUMBER (SSN)</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tabular-nums">
              {sn}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Active Cycle 25</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            F2-layer ionization density for intercontinental skip.
          </div>
        </div>

        {/* K-Index */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-mono text-slate-400">GEOMAGNETIC K-INDEX</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              {kIndex}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Quiet / Stable</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Values 0–2 mean low ionospheric turbulence & minimal QSB.
          </div>
        </div>

        {/* A-Index */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-mono text-slate-400">PLANETARY A-INDEX</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
              {aIndex}
            </span>
            <span className="text-xs text-slate-400 font-medium">Low Aurora Risk</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Daily geomagnetic activity index.
          </div>
        </div>
      </div>

      {/* Band Conditions Matrix Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              Mid-Latitude Band Propagation Forecast
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Updated Hourly for PNW / Club Latitude
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-mono border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">AMATEUR BAND</th>
                <th className="px-5 py-3 font-semibold">FREQUENCY SPAN</th>
                <th className="px-5 py-3 font-semibold">DAYTIME OPENING</th>
                <th className="px-5 py-3 font-semibold">NIGHTTIME OPENING</th>
                <th className="px-5 py-3 font-semibold">PRIMARY MODE REC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {SOLAR_CONDITIONS.map((cond) => (
                <tr key={cond.band} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 font-bold text-white">
                    {cond.band}
                  </td>
                  <td className="px-5 py-3 text-slate-400 tabular-nums">
                    {cond.mhz}
                  </td>
                  <td className="px-5 py-3">
                    <span className={getStatusColor(cond.day)}>{cond.day}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={getStatusColor(cond.night)}>{cond.night}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-sans text-xs">
                    {cond.band === '20m' || cond.band === '15m'
                      ? 'Global DX, CW & FT8 Pileups'
                      : cond.band === '40m' || cond.band === '80m'
                      ? 'Regional NVIS & Evening Ragchew'
                      : cond.band === '10m' || cond.band === '6m'
                      ? 'Sporadic-E & Trans-Equatorial'
                      : 'Greyline CW & Digital'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Field Activation Takeaway */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
        <div>
          <h4 className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5" />
            Recommended Operating Frequencies Today
          </h4>
          <p className="leading-relaxed text-slate-400">
            With SFI holding steady at 168 and low geomagnetic K of 2, <strong>20m (14 MHz)</strong> and <strong>15m (21 MHz)</strong> are wide open for daytime QRP activations. Transition to <strong>40m (7.0-7.3 MHz)</strong> at dusk for regional PNW club contacts.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
            <Compass className="w-3.5 h-3.5" />
            Greyline Operating Window
          </h4>
          <p className="leading-relaxed text-slate-400">
            Sunset greyline along the day/night terminator provides significant ionospheric ducting. Focus on 40m and 30m CW between 18:30 and 19:45 local for long-path Europe and South Pacific contacts.
          </p>
        </div>
      </div>
    </div>
  );
};
