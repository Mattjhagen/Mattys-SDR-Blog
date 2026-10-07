import React, { useState, useEffect } from 'react';
import { BookOpen, MapPin, Radio, Calendar, X } from 'lucide-react';

interface VisitorEntry {
  id: string;
  callsign: string;
  name: string;
  qth: string;
  message: string;
  timestamp: number;
}

const VISITOR_LOG_KEY = 'ham_radio_visitor_log_v1';

export const VisitorLog: React.FC = () => {
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [isSigningOpen, setIsSigningOpen] = useState(false);

  // Form state
  const [callsign, setCallsign] = useState('');
  const [name, setName] = useState('');
  const [qth, setQth] = useState('');
  const [message, setMessage] = useState('');

  // Load entries from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VISITOR_LOG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEntries(parsed);
      }
    } catch (e) {
      console.error('Failed to load visitor log:', e);
    }
  }, []);

  // Save entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEntry: VisitorEntry = {
      id: Date.now().toString(),
      callsign: callsign.trim().toUpperCase(),
      name: name.trim(),
      qth: qth.trim(),
      message: message.trim(),
      timestamp: Date.now()
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);

    try {
      localStorage.setItem(VISITOR_LOG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save visitor log:', e);
    }

    // Reset form
    setCallsign('');
    setName('');
    setQth('');
    setMessage('');
    setIsSigningOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">
              Visitor Log
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">
            Sign the logbook and let us know you stopped by the station!
          </p>
        </div>

        {/* Sign Guestbook Button */}
        <button
          onClick={() => setIsSigningOpen(true)}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-colors mb-10 shadow-lg"
        >
          <Radio className="w-5 h-5" />
          <span>Sign the Logbook</span>
        </button>

        {/* Entries */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No entries yet</p>
              <p className="text-slate-600 text-sm">Be the first to sign the logbook!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400 font-mono font-bold text-lg">
                        {entry.callsign}
                      </span>
                      {entry.name && (
                        <span className="text-slate-300 font-semibold">
                          {entry.name}
                        </span>
                      )}
                    </div>
                    {entry.qth && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{entry.qth}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(entry.timestamp)}</span>
                  </div>
                </div>

                {/* Message */}
                {entry.message && (
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {entry.message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Signing Modal */}
        {isSigningOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">Sign the Logbook</h2>
                </div>
                <button
                  onClick={() => setIsSigningOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Callsign */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      Callsign <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono uppercase"
                      placeholder="W7SDR"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  {/* QTH */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      QTH / Location (optional)
                    </label>
                    <input
                      type="text"
                      value={qth}
                      onChange={(e) => setQth(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                      placeholder="Seattle, WA"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      Message (optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                      placeholder="Leave a message... 73!"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsSigningOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Sign Log</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
