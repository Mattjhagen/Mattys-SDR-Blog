/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Radio, Volume2, VolumeX, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';

interface ScannerFeed {
  id: string;
  name: string;
  description: string;
  url: string;
  location?: string;
  type: 'police' | 'fire' | 'ems' | 'weather' | 'talk' | 'custom';
}

const DEFAULT_FEEDS: ScannerFeed[] = [
  {
    id: 'omaha-police',
    name: 'Omaha Police',
    description: 'Omaha Police & Douglas County Sheriff',
    url: 'https://calls.broadcastify.com/vlpd7o2r/1678/1791838366-52500.mp3',
    location: 'Omaha, NE',
    type: 'police'
  },
  {
    id: 'lincoln-fire',
    name: 'Lincoln Fire',
    description: 'Lincoln Fire & Rescue',
    url: 'https://broadcastify.cdnstream1.com/27844',
    location: 'Lincoln, NE',
    type: 'fire'
  },
  {
    id: 'noaa-weather',
    name: 'NOAA Weather - Omaha',
    description: 'NOAA Weather Radio KIH61',
    url: 'http://radio.weatherusa.net/NWR/KIH61.mp3',
    location: 'Omaha, NE',
    type: 'weather'
  },
  {
    id: 'test-stream',
    name: 'Test Music Stream',
    description: 'SomaFM Groove Salad (for testing)',
    url: 'http://ice1.somafm.com/groovesalad-128-mp3',
    location: 'Internet Radio',
    type: 'custom'
  },
  {
    id: 'coast-to-coast-am',
    name: 'Coast to Coast AM',
    description: 'Overnight talk with George Noory — weeknights 12am-5am CT, Premiere Networks',
    // Stream URL needed - Coast to Coast AM is a commercial syndicated show.
    // To find a stream: check local affiliate station websites (e.g. KFI Los Angeles, WGN Chicago),
    // Broadcastify talk feeds, or streaming services like iHeartRadio/TuneIn.
    // Add a working stream URL via the + Add Feed button.
    url: '',
    location: 'Syndicated',
    type: 'talk'
  }
];

const FEEDS_STORAGE_KEY = 'police_scanner_feeds_v2';
const OLD_FEEDS_STORAGE_KEY = 'police_scanner_feeds_v1';

export const PoliceScanner: React.FC = () => {
  const [feeds, setFeeds] = useState<ScannerFeed[]>(() => {
    try {
      // Try to load v2 feeds first
      const stored = localStorage.getItem(FEEDS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Migrate from v1 if it exists
      const oldStored = localStorage.getItem(OLD_FEEDS_STORAGE_KEY);
      if (oldStored) {
        const oldFeeds = JSON.parse(oldStored);
        // Merge old custom feeds with new defaults
        const customFeeds = oldFeeds.filter((f: ScannerFeed) => f.id.startsWith('custom-'));
        const migratedFeeds = [...DEFAULT_FEEDS, ...customFeeds];
        // Save to new key
        localStorage.setItem(FEEDS_STORAGE_KEY, JSON.stringify(migratedFeeds));
        return migratedFeeds;
      }
    } catch (e) {
      console.error('Failed to load scanner feeds:', e);
    }
    return DEFAULT_FEEDS;
  });

  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddFeed, setShowAddFeed] = useState(false);

  // Form state for adding new feeds
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedDescription, setNewFeedDescription] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedLocation, setNewFeedLocation] = useState('');
  const [newFeedType, setNewFeedType] = useState<ScannerFeed['type']>('custom');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Save feeds to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FEEDS_STORAGE_KEY, JSON.stringify(feeds));
    } catch (e) {
      console.error('Failed to save scanner feeds:', e);
    }
  }, [feeds]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playFeed = async (feedId: string) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed || !audioRef.current) return;

    // Check if URL is empty
    if (!feed.url.trim()) {
      setError(`${feed.name} needs a stream URL. Add one using the + Add Feed button or edit this feed.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Stop current playback
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Load and play new feed
      audioRef.current.src = feed.url;
      audioRef.current.load();

      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        await playPromise;
        setActiveFeedId(feedId);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error playing feed:', err);
      setError(`Failed to play ${feed.name}. The stream may be offline or require authentication.`);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setActiveFeedId(null);
    setError(null);
  };

  const addFeed = () => {
    if (!newFeedName.trim() || !newFeedUrl.trim()) {
      setError('Feed name and URL are required');
      return;
    }

    const newFeed: ScannerFeed = {
      id: `custom-${Date.now()}`,
      name: newFeedName.trim(),
      description: newFeedDescription.trim() || 'Custom Scanner Feed',
      url: newFeedUrl.trim(),
      location: newFeedLocation.trim() || undefined,
      type: newFeedType
    };

    setFeeds([...feeds, newFeed]);

    // Reset form
    setNewFeedName('');
    setNewFeedDescription('');
    setNewFeedUrl('');
    setNewFeedLocation('');
    setNewFeedType('custom');
    setShowAddFeed(false);
    setError(null);
  };

  const deleteFeed = (feedId: string) => {
    if (activeFeedId === feedId) {
      stopPlayback();
    }
    setFeeds(feeds.filter(f => f.id !== feedId));
  };

  const resetToDefaults = () => {
    if (confirm('Reset to default feeds? This will remove all custom feeds.')) {
      stopPlayback();
      setFeeds(DEFAULT_FEEDS);
    }
  };

  const getTypeColor = (type: ScannerFeed['type']) => {
    switch (type) {
      case 'police': return 'text-blue-400';
      case 'fire': return 'text-red-400';
      case 'ems': return 'text-green-400';
      case 'weather': return 'text-yellow-400';
      case 'talk': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeLabel = (type: ScannerFeed['type']) => {
    switch (type) {
      case 'police': return 'Police';
      case 'fire': return 'Fire';
      case 'ems': return 'EMS';
      case 'weather': return 'Weather';
      case 'talk': return 'Talk Radio';
      default: return 'Custom';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Radio className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Police Scanner
                </h1>
                <p className="text-slate-400 text-sm">Live emergency services radio feeds</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddFeed(!showAddFeed)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Feed
              </button>
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                title="Reset to default feeds"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Now Playing Bar */}
          {isPlaying && activeFeedId && (
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Radio className="w-6 h-6 text-blue-400 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-300">
                      {feeds.find(f => f.id === activeFeedId)?.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {feeds.find(f => f.id === activeFeedId)?.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-24"
                    />
                    <Volume2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <button
                    onClick={stopPlayback}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium">Error</p>
                <p className="text-red-200/80 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Add Feed Form */}
          {showAddFeed && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold mb-4">Add Custom Feed</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Feed Name *</label>
                  <input
                    type="text"
                    value={newFeedName}
                    onChange={(e) => setNewFeedName(e.target.value)}
                    placeholder="e.g., Douglas County Fire"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={newFeedDescription}
                    onChange={(e) => setNewFeedDescription(e.target.value)}
                    placeholder="e.g., Fire and EMS Dispatch"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Stream URL *</label>
                  <input
                    type="text"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    placeholder="https://broadcastify.cdnstream1.com/12345"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={newFeedLocation}
                      onChange={(e) => setNewFeedLocation(e.target.value)}
                      placeholder="e.g., Omaha, NE"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                    <select
                      value={newFeedType}
                      onChange={(e) => setNewFeedType(e.target.value as ScannerFeed['type'])}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="police">Police</option>
                      <option value="fire">Fire</option>
                      <option value="ems">EMS</option>
                      <option value="weather">Weather</option>
                      <option value="talk">Talk Radio</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowAddFeed(false)}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addFeed}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    Add Feed
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feed List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className={`bg-slate-800/50 border rounded-lg p-5 transition-all ${
                activeFeedId === feed.id
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{feed.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(feed.type)} bg-slate-900/50`}>
                      {getTypeLabel(feed.type)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{feed.description}</p>
                  {feed.location && (
                    <p className="text-xs text-slate-500 mt-1">📍 {feed.location}</p>
                  )}
                </div>
                {feed.id.startsWith('custom-') && (
                  <button
                    onClick={() => deleteFeed(feed.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete feed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {activeFeedId === feed.id && isPlaying ? (
                  <button
                    onClick={stopPlayback}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-colors w-full justify-center"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => playFeed(feed.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    {isLoading && activeFeedId === feed.id ? 'Loading...' : 'Play'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            About Scanner Feeds
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>
              • <strong>Broadcastify:</strong> Free feeds may have 15-30 second ads. Premium subscription ($6.99/mo) removes ads.
            </p>
            <p>
              • <strong>Silent feeds:</strong> Scanner feeds are often quiet when there's no radio traffic. This is normal.
            </p>
            <p>
              • <strong>Finding feeds:</strong> Visit <a href="https://www.broadcastify.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">broadcastify.com</a> to find feeds for your area.
            </p>
            <p>
              • <strong>Custom feeds:</strong> Add your own scanner URLs from Broadcastify, Scanner Radio, or other streaming services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
