import React, { useState, useMemo } from 'react';
import { ContactedHam, BlogPost } from '../types/blog';
import { gridToLatLon, calculateDistanceAndBearing } from '../utils/maidenhead';
import { 
  Compass, MapPin, Radio, Search, Plus, ExternalLink, 
  Download, Globe, Filter, X, ArrowUpRight, Check, BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

interface ContactLogbookMapProps {
  contacts: ContactedHam[];
  posts: BlogPost[];
  onAddContact: (contact: ContactedHam) => void;
  onSelectPost: (post: BlogPost) => void;
}

// Home Station coordinates (CN87us Puget Sound: ~47.6° N, -122.3° W)
const HOME_COORDS = { lat: 47.6062, lon: -122.3321, callsign: 'W7SDR', grid: 'CN87us' };

// SVG Map Viewport settings
const MAP_WIDTH = 960;
const MAP_HEIGHT = 480;

// Convert Lat/Lon to SVG X,Y (Equirectangular Projection)
function latLonToSvg(lat: number, lon: number): { x: number; y: number } {
  // lon: -180 to 180 -> x: 0 to MAP_WIDTH
  // lat: 90 to -90 -> y: 0 to MAP_HEIGHT
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

export const ContactLogbookMap: React.FC<ContactLogbookMapProps> = ({
  contacts,
  posts,
  onAddContact,
  onSelectPost
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBand, setSelectedBand] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [regionZoom, setRegionZoom] = useState<'world' | 'na' | 'eu' | 'asia'>('world');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<'30days' | 'all'>('30days');

  // Compute contacts made per band over the last 30 days
  const { bandChartData, totalPeriodContacts, topBand } = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgoMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    // Filter contacts based on chosen timeframe
    const scopedContacts = contacts.filter((c) => {
      if (chartTimeframe === 'all') return true;
      const parsed = new Date(c.dateTimeUtc.replace(' ', 'T')).getTime();
      return !isNaN(parsed) && parsed >= thirtyDaysAgoMs;
    });

    const STANDARD_BANDS = ['80m', '40m', '20m', '15m', '10m', '2m'];
    const bandMap = new Map<string, { count: number; modes: Set<string>; callsigns: string[] }>();

    // Seed standard bands so they always appear in logical order
    STANDARD_BANDS.forEach((b) => {
      bandMap.set(b, { count: 0, modes: new Set(), callsigns: [] });
    });

    scopedContacts.forEach((c) => {
      if (!bandMap.has(c.band)) {
        bandMap.set(c.band, { count: 0, modes: new Set(), callsigns: [] });
      }
      const entry = bandMap.get(c.band)!;
      entry.count += 1;
      entry.modes.add(c.mode);
      if (!entry.callsigns.includes(c.callsign)) {
        entry.callsigns.push(c.callsign);
      }
    });

    const BAND_COLORS: Record<string, string> = {
      '80m': '#3b82f6',
      '40m': '#10b981',
      '30m': '#14b8a6',
      '20m': '#f59e0b',
      '17m': '#f97316',
      '15m': '#06b6d4',
      '12m': '#8b5cf6',
      '10m': '#a855f7',
      '6m': '#ec4899',
      '2m': '#f43f5e'
    };

    const totalPeriodContacts = scopedContacts.length;

    const data = Array.from(bandMap.entries())
      .filter(([band, item]) => item.count > 0 || ['80m', '40m', '20m', '15m', '10m', '2m'].includes(band))
      .map(([band, item]) => ({
        band,
        count: item.count,
        modes: Array.from(item.modes),
        callsigns: item.callsigns,
        percentage: totalPeriodContacts > 0 ? Math.round((item.count / totalPeriodContacts) * 100) : 0,
        color: BAND_COLORS[band] || '#f59e0b'
      }));

    // Find top band
    const topBand = data.reduce((max, item) => (item.count > (max?.count || 0) ? item : max), data[0]);

    return {
      bandChartData: data,
      totalPeriodContacts,
      topBand
    };
  }, [contacts, chartTimeframe]);

  // New Contact Form State
  const [formCallsign, setFormCallsign] = useState('');
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formGrid, setFormGrid] = useState('');
  const [formBand, setFormBand] = useState('20m');
  const [formMode, setFormMode] = useState<'CW' | 'SSB' | 'FT8' | 'FM'>('CW');
  const [formFreq, setFormFreq] = useState('14.060');
  const [formRstSent, setFormRstSent] = useState('599');
  const [formRstRcvd, setFormRstRcvd] = useState('599');
  const [formPower, setFormPower] = useState('5');
  const [formPostId, setFormPostId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (selectedBand !== 'All' && c.band !== selectedBand) return false;
      if (selectedMode !== 'All' && c.mode !== selectedMode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCall = c.callsign.toLowerCase().includes(q);
        const mName = c.name.toLowerCase().includes(q);
        const mCity = c.city.toLowerCase().includes(q);
        const mCountry = c.country.toLowerCase().includes(q);
        const mGrid = c.gridSquare.toLowerCase().includes(q);
        if (!mCall && !mName && !mCity && !mCountry && !mGrid) return false;
      }
      return true;
    });
  }, [contacts, selectedBand, selectedMode, searchQuery]);

  // Selected station
  const activeStation = useMemo(() => {
    return contacts.find((c) => c.id === activeStationId) || null;
  }, [contacts, activeStationId]);

  // Statistics
  const stats = useMemo(() => {
    const countries = new Set(contacts.map((c) => c.country)).size;
    const grids = new Set(contacts.map((c) => c.gridSquare.slice(0, 4))).size;
    const furthest = contacts.reduce((max, c) => {
      const d = c.distanceMiles || 0;
      return d > (max?.distanceMiles || 0) ? c : max;
    }, contacts[0]);

    return {
      totalQso: contacts.length,
      countries,
      grids,
      furthest
    };
  }, [contacts]);

  // Map viewbox based on region zoom
  const viewBox = useMemo(() => {
    switch (regionZoom) {
      case 'na':
        return '60 40 400 240';
      case 'eu':
        return '400 40 280 200';
      case 'asia':
        return '600 40 360 260';
      case 'world':
      default:
        return `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;
    }
  }, [regionZoom]);

  const homePoint = latLonToSvg(HOME_COORDS.lat, HOME_COORDS.lon);

  // Band badge color
  const getBandColor = (band: string) => {
    switch (band) {
      case '20m':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case '40m':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case '15m':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
      case '10m':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case '2m':
        return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCallsign.trim() || !formGrid.trim()) return;

    const coords = gridToLatLon(formGrid);
    const lat = coords ? coords.lat : 0;
    const lon = coords ? coords.lon : 0;
    const distBearing = calculateDistanceAndBearing(HOME_COORDS.grid, formGrid);

    const newContact: ContactedHam = {
      id: `qso-${Date.now()}`,
      callsign: formCallsign.trim().toUpperCase(),
      name: formName.trim() || 'Operator',
      city: formCity.trim(),
      country: formCountry.trim() || 'Unknown',
      gridSquare: formGrid.trim().toUpperCase(),
      lat,
      lon,
      band: formBand,
      mode: formMode,
      frequencyMhz: parseFloat(formFreq) || undefined,
      dateTimeUtc: new Date().toISOString().replace('T', ' ').slice(0, 16),
      rstSent: formRstSent.trim() || '599',
      rstRcvd: formRstRcvd.trim() || '599',
      powerWatts: parseInt(formPower, 10) || 5,
      notes: formNotes.trim() || undefined,
      blogPostId: formPostId || undefined,
      distanceMiles: distBearing?.distanceMiles,
      bearingDeg: distBearing?.bearingDeg
    };

    onAddContact(newContact);
    setActiveStationId(newContact.id);
    setIsAddModalOpen(false);

    // Reset form
    setFormCallsign('');
    setFormName('');
    setFormCity('');
    setFormCountry('');
    setFormGrid('');
    setFormNotes('');
  };

  // Export Logbook to ADIF / JSON format
  const handleExportLogbook = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(contacts, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `w7sdr_contact_logbook_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
            <Globe className="w-3.5 h-3.5" />
            <span>QSO LOGBOOK & GEODESIC CONTACT MAP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Contacted Stations Directory & World Map
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Geographic log of all confirmed two-way amateur radio contacts, Maidenhead grid squares, and signal reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportLogbook}
            title="Download Logbook JSON"
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log New Contact</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block">TOTAL CONFIRMED QSOS</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums mt-1 block">
            {stats.totalQso}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Logged on air</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block">COUNTRIES / DXCC</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tabular-nums mt-1 block">
            {stats.countries}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Unique geopolitical entities</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block">MAIDENHEAD GRIDS</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 tabular-nums mt-1 block">
            {stats.grids}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Fields worked</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block">FURTHEST DX CONTACT</span>
          <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1 block truncate">
            {stats.furthest ? `${stats.furthest.callsign} (${stats.furthest.distanceMiles?.toLocaleString()} mi)` : 'None'}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            {stats.furthest ? `${stats.furthest.city}, ${stats.furthest.country}` : 'Logging pending'}
          </span>
        </div>
      </div>

      {/* Map Section */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Map Top Bar Controls */}
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">HOME QTH:</span>
            <span className="text-amber-400 font-bold">{HOME_COORDS.callsign}</span>
            <span className="text-slate-500">({HOME_COORDS.grid})</span>
          </div>

          {/* Region Zoom Presets */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setRegionZoom('world')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                regionZoom === 'world' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              World
            </button>
            <button
              onClick={() => setRegionZoom('na')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                regionZoom === 'na' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              N. America
            </button>
            <button
              onClick={() => setRegionZoom('eu')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                regionZoom === 'eu' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Europe
            </button>
            <button
              onClick={() => setRegionZoom('asia')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                regionZoom === 'asia' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Asia/Pacific
            </button>
          </div>
        </div>

        {/* SVG Projection Map */}
        <div className="relative w-full aspect-[2/1] bg-[#070d18] select-none">
          <svg
            viewBox={viewBox}
            className="w-full h-full block"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Radar pulse animation for home */}
              <radialGradient id="homeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Latitude / Longitude Grids */}
            <g stroke="rgba(30, 58, 95, 0.35)" strokeWidth="0.5" strokeDasharray="3 3">
              {/* Equator */}
              <line x1="0" y1={MAP_HEIGHT / 2} x2={MAP_WIDTH} y2={MAP_HEIGHT / 2} stroke="rgba(30, 58, 95, 0.6)" />
              {/* Tropic Lines */}
              <line x1="0" y1={(MAP_HEIGHT / 180) * (90 - 23.5)} x2={MAP_WIDTH} y2={(MAP_HEIGHT / 180) * (90 - 23.5)} />
              <line x1="0" y1={(MAP_HEIGHT / 180) * (90 + 23.5)} x2={MAP_WIDTH} y2={(MAP_HEIGHT / 180) * (90 + 23.5)} />
              {/* Longitude meridians */}
              {[60, 120, 180, 240, 300].map((deg) => (
                <line key={deg} x1={(MAP_WIDTH / 360) * deg} y1="0" x2={(MAP_WIDTH / 360) * deg} y2={MAP_HEIGHT} />
              ))}
            </g>

            {/* Simplified Continent Outlines for authentic radio map */}
            <g fill="#0e1726" stroke="#1e293b" strokeWidth="0.8">
              {/* North America */}
              <path d="M 110,60 L 220,55 L 260,85 L 230,120 L 220,160 L 250,180 L 230,210 L 210,230 L 195,200 L 175,170 L 130,165 L 90,130 L 70,80 Z" />
              {/* South America */}
              <path d="M 230,235 L 280,250 L 310,290 L 290,360 L 260,420 L 240,380 L 225,290 Z" />
              {/* Europe */}
              <path d="M 440,70 L 520,70 L 540,110 L 510,135 L 470,140 L 450,115 L 430,95 Z" />
              {/* Africa */}
              <path d="M 440,150 L 520,155 L 560,210 L 540,320 L 490,360 L 450,260 L 420,190 Z" />
              {/* Asia */}
              <path d="M 525,65 L 750,70 L 800,120 L 780,180 L 710,210 L 640,180 L 590,160 L 535,115 Z" />
              {/* Japan */}
              <path d="M 800,140 L 825,160 L 815,185 L 795,165 Z" fill="#1e293b" />
              {/* Australia & NZ */}
              <path d="M 720,290 L 810,295 L 830,360 L 760,380 L 710,340 Z" />
              <path d="M 850,380 L 870,390 L 860,430 L 845,410 Z" />
            </g>

            {/* Great Circle Geodesic Arc Lines from Home to each Station */}
            {filteredContacts.map((c) => {
              const pt = latLonToSvg(c.lat, c.lon);
              const isActive = c.id === activeStationId;

              // Arc curve calculation
              const dx = pt.x - homePoint.x;
              const dy = pt.y - homePoint.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const midX = (homePoint.x + pt.x) / 2;
              const midY = (homePoint.y + pt.y) / 2 - dist * 0.15; // arch upward

              return (
                <g key={`arc-${c.id}`}>
                  <path
                    d={`M ${homePoint.x},${homePoint.y} Q ${midX},${midY} ${pt.x},${pt.y}`}
                    fill="none"
                    stroke={isActive ? '#f59e0b' : 'rgba(56, 189, 248, 0.45)'}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={isActive ? 'none' : '4 3'}
                  />
                </g>
              );
            })}

            {/* Home Station Pin (Seattle / Puget Sound) */}
            <g transform={`translate(${homePoint.x}, ${homePoint.y})`}>
              <circle r="12" fill="url(#homeGlow)" className="animate-ping opacity-60" />
              <circle r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="8" y="4" fill="#f59e0b" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                W7SDR (HOME)
              </text>
            </g>

            {/* Contacted Station Pins */}
            {filteredContacts.map((c) => {
              const pt = latLonToSvg(c.lat, c.lon);
              const isActive = c.id === activeStationId;

              return (
                <g
                  key={`pin-${c.id}`}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => setActiveStationId(c.id)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isActive ? 7 : 4.5}
                    fill={isActive ? '#f59e0b' : '#38bdf8'}
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="transition-all hover:scale-150"
                  />
                  {/* Callsign label on map */}
                  <text
                    x="7"
                    y="3"
                    fill={isActive ? '#fbbf24' : '#e2e8f0'}
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight={isActive ? 'bold' : 'normal'}
                    className="drop-shadow pointer-events-none"
                  >
                    {c.callsign}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active Station Info Overlay Card (if clicked) */}
          {activeStation && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md p-4 rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-amber-400">
                      {activeStation.callsign}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      ({activeStation.name})
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getBandColor(activeStation.band)}`}>
                      {activeStation.band} {activeStation.mode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {activeStation.city}, {activeStation.country} · Grid <strong className="text-white font-mono">{activeStation.gridSquare}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStationId(null)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Azimuth and Distance */}
              <div className="grid grid-cols-3 gap-2 py-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">DISTANCE</span>
                  <span className="font-bold text-white tabular-nums">
                    {activeStation.distanceMiles ? `${activeStation.distanceMiles.toLocaleString()} mi` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">BEARING</span>
                  <span className="font-bold text-amber-300 tabular-nums">
                    {activeStation.bearingDeg ? `${activeStation.bearingDeg}°` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">RST REPORT</span>
                  <span className="font-bold text-white tabular-nums">
                    {activeStation.rstSent} / {activeStation.rstRcvd}
                  </span>
                </div>
              </div>

              {activeStation.notes && (
                <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800 mt-1">
                  "{activeStation.notes}"
                </div>
              )}

              {/* Link to Blog Post if available */}
              {activeStation.blogPostId && (
                <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Documented in adventure log:</span>
                  {(() => {
                    const post = posts.find((p) => p.id === activeStation.blogPostId);
                    return post ? (
                      <button
                        onClick={() => onSelectPost(post)}
                        className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>{post.title.slice(0, 32)}...</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 30-Day Band Activity Distribution Bar Chart (Recharts) */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Band Contacts Activity ({chartTimeframe === '30days' ? 'Last 30 Days' : 'All Time'})
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing contacts made per frequency band over the last 30 days. Click any bar to filter the directory & map.
              </p>
            </div>
          </div>

          {/* Timeframe Toggle Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs self-start sm:self-auto font-mono">
            <button
              onClick={() => setChartTimeframe('30days')}
              className={`px-3 py-1 rounded transition-colors ${
                chartTimeframe === '30days'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setChartTimeframe('all')}
              className={`px-3 py-1 rounded transition-colors ${
                chartTimeframe === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Chart Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* Main Recharts Bar Chart */}
          <div className="lg:col-span-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bandChartData}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="band"
                  stroke="#64748b"
                  tick={{ fill: '#cbd5e1', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as {
                        band: string;
                        count: number;
                        percentage: number;
                        modes: string[];
                        callsigns: string[];
                        color: string;
                      };
                      return (
                        <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs space-y-1.5 font-mono">
                          <div className="flex items-center justify-between gap-4 font-bold text-white border-b border-slate-800 pb-1">
                            <span style={{ color: data.color }}>{data.band} Band</span>
                            <span className="text-amber-400">{data.count} {data.count === 1 ? 'QSO' : 'QSOs'}</span>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Share of activity: <strong className="text-white">{data.percentage}%</strong>
                          </div>
                          {data.modes.length > 0 && (
                            <div className="text-[11px] text-slate-400">
                              Modes: <span className="text-slate-200">{data.modes.join(', ')}</span>
                            </div>
                          )}
                          {data.callsigns.length > 0 && (
                            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 truncate max-w-[200px]">
                              Stations: {data.callsigns.slice(0, 4).join(', ')}{data.callsigns.length > 4 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(entry) => {
                    const typedEntry = entry as unknown as { band?: string };
                    if (typedEntry && typedEntry.band) {
                      setSelectedBand(selectedBand === typedEntry.band ? 'All' : typedEntry.band);
                    }
                  }}
                >
                  {bandChartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.band}`}
                      fill={entry.color}
                      opacity={selectedBand === 'All' || selectedBand === entry.band ? 1 : 0.4}
                      stroke={selectedBand === entry.band ? '#ffffff' : 'transparent'}
                      strokeWidth={1.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Side Summary Metric Panel */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">
                {chartTimeframe === '30days' ? 'LAST 30 DAYS TOTAL' : 'ALL TIME TOTAL'}
              </span>
              <span className="text-2xl font-bold text-white tabular-nums">
                {totalPeriodContacts} Contacts
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">MOST ACTIVE BAND</span>
              <span className="text-sm font-bold text-amber-400">
                {topBand && topBand.count > 0 ? `${topBand.band} (${topBand.count} QSOs · ${topBand.percentage}%)` : 'No contacts yet'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">BAND FILTER STATUS</span>
              <div className="flex items-center justify-between text-slate-300 mt-0.5">
                <span>Active Filter:</span>
                <span className="text-amber-400 font-bold">{selectedBand}</span>
              </div>
              {selectedBand !== 'All' && (
                <button
                  onClick={() => setSelectedBand('All')}
                  className="mt-1.5 w-full py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  Reset to All Bands
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Directory Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search callsigns (e.g. JH1ECG), operator, grid, city..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Band & Mode Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Band Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              {['All', '20m', '40m', '15m', '10m', '2m'].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBand(b)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedBand === b
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              {['All', 'CW', 'SSB', 'FT8', 'FM'].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMode(m)}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    selectedMode === m
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Directory Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              Contacted Hams Directory ({filteredContacts.length} recorded)
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Click any station to focus on map
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">CALLSIGN</th>
                  <th className="px-4 py-3 font-semibold">OPERATOR</th>
                  <th className="px-4 py-3 font-semibold">QTH / COUNTRY</th>
                  <th className="px-4 py-3 font-semibold">GRID</th>
                  <th className="px-4 py-3 font-semibold">BAND / MODE</th>
                  <th className="px-4 py-3 font-semibold">RST</th>
                  <th className="px-4 py-3 font-semibold">DISTANCE & BEARING</th>
                  <th className="px-4 py-3 font-semibold">LOG DATE (UTC)</th>
                  <th className="px-4 py-3 font-semibold">LINKED LOG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredContacts.map((c) => {
                  const isCurrent = c.id === activeStationId;
                  const linkedPost = c.blogPostId
                    ? posts.find((p) => p.id === c.blogPostId)
                    : null;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setActiveStationId(c.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isCurrent ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-amber-400">
                        {c.callsign}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-sans">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-sans">
                        {c.city ? `${c.city}, ` : ''}{c.country}
                      </td>
                      <td className="px-4 py-3 text-white font-bold">
                        {c.gridSquare}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] border ${getBandColor(c.band)}`}>
                          {c.band} · {c.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 tabular-nums">
                        {c.rstSent} / {c.rstRcvd}
                      </td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums">
                        {c.distanceMiles ? `${c.distanceMiles.toLocaleString()} mi (${c.bearingDeg}°)` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 tabular-nums">
                        {c.dateTimeUtc}
                      </td>
                      <td className="px-4 py-3">
                        {linkedPost ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPost(linkedPost);
                            }}
                            className="text-amber-400 hover:underline flex items-center gap-1 font-sans text-[11px]"
                            title={linkedPost.title}
                          >
                            <span className="truncate max-w-[120px]">{linkedPost.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {contacts.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-950/40 border-t border-slate-800 space-y-3">
              <Radio className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="font-semibold text-white text-sm">
                No Contacts in Directory Yet
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Keep track of all the amateur radio operators you have contacted on-air. Log their callsign, signal report (RST), Maidenhead grid square, and band to map them globally.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Log First Contact (QSO)</span>
                </button>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No contacted stations found matching current search/filters.
            </div>
          ) : null}
        </div>
      </div>

      {/* Log New Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-white">
                    Log New Station Contact (QSO)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add station to your contacted directory and world map
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 my-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    CALLSIGN *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCallsign}
                    onChange={(e) => setFormCallsign(e.target.value.toUpperCase())}
                    placeholder="e.g. JA1ABC"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono font-bold text-sm uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    OPERATOR NAME
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Kenji"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    CITY
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Tokyo"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    COUNTRY *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="Japan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    GRID SQUARE *
                  </label>
                  <input
                    type="text"
                    required
                    value={formGrid}
                    onChange={(e) => setFormGrid(e.target.value.toUpperCase())}
                    placeholder="PM95ur"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono text-xs uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    BAND
                  </label>
                  <select
                    value={formBand}
                    onChange={(e) => setFormBand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="20m">20m</option>
                    <option value="40m">40m</option>
                    <option value="15m">15m</option>
                    <option value="10m">10m</option>
                    <option value="2m">2m</option>
                    <option value="80m">80m</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    MODE
                  </label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as 'CW' | 'SSB' | 'FT8' | 'FM')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="CW">CW</option>
                    <option value="SSB">SSB</option>
                    <option value="FT8">FT8</option>
                    <option value="FM">FM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    RST SENT
                  </label>
                  <input
                    type="text"
                    value={formRstSent}
                    onChange={(e) => setFormRstSent(e.target.value)}
                    placeholder="599"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    RST RCVD
                  </label>
                  <input
                    type="text"
                    value={formRstRcvd}
                    onChange={(e) => setFormRstRcvd(e.target.value)}
                    placeholder="599"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  LINK TO BLOG ADVENTURE / POST (OPTIONAL)
                </label>
                <select
                  value={formPostId}
                  onChange={(e) => setFormPostId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="">None (Independent QSO)</option>
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  CONTACT NOTES
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. QRP 5W summit activation into tree wire"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950"
                >
                  Save to Logbook & Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
