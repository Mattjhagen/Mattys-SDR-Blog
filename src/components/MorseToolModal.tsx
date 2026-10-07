import React, { useState, useEffect } from 'react';
import { X, Play, Square, Volume2, Sparkles } from 'lucide-react';
import { morsePlayer } from '../utils/morseAudio';

interface MorseToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

export const MorseToolModal: React.FC<MorseToolModalProps> = ({
  isOpen,
  onClose,
  initialText = 'CQ CQ CQ K'
}) => {
  const [text, setText] = useState(initialText);
  const [wpm, setWpm] = useState(18);
  const [frequency, setFrequency] = useState(650);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChar, setCurrentChar] = useState<string>('');

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    return () => {
      morsePlayer.stop();
    };
  }, []);

  if (!isOpen) return null;

  const morseCode = morsePlayer.encode(text);

  const handlePlay = async () => {
    if (isPlaying) {
      morsePlayer.stop();
      setIsPlaying(false);
      setCurrentChar('');
      return;
    }

    setIsPlaying(true);
    await morsePlayer.play(
      text,
      wpm,
      frequency,
      (char) => setCurrentChar(char),
      () => {
        setIsPlaying(false);
        setCurrentChar('');
      }
    );
  };

  const handleStop = () => {
    morsePlayer.stop();
    setIsPlaying(false);
    setCurrentChar('');
  };

  const PRESETS = [
    { label: 'CQ CQ CQ DE W7SDR K', text: 'CQ CQ CQ DE W7SDR K' },
    { label: '73 ES GD DX DE W7SDR', text: '73 ES GD DX DE W7SDR' },
    { label: 'RST 599 TU FB', text: 'RST 599 TU FB' },
    { label: 'QTH SEATTLE GRID CN87', text: 'QTH SEATTLE GRID CN87' },
    { label: 'SOS EMERGENCY', text: 'SOS' },
    { label: 'PARIS (Speed Standard)', text: 'PARIS PARIS' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-white">
                CW Morse Code Synthesizer
              </h3>
              <p className="text-xs text-slate-400">
                Web Audio telegraph sidetone generator with PARIS timing standard
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Text */}
        <div className="space-y-4 my-5">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              MESSAGE / CALLSIGN TO TRANSMIT
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              placeholder="e.g. CQ CQ DE K7NVH"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-amber-400/80"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setText(p.text)}
                className="px-2 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Realtime Morse Translation Box */}
          <div className="p-3.5 rounded-lg bg-black/60 border border-slate-800/80 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>DIT / DAH ENCODING:</span>
              {currentChar && (
                <span className="text-amber-400 font-bold flex items-center gap-1 text-xs">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  Sending: '{currentChar}'
                </span>
              )}
            </div>
            <div className="text-amber-400 text-sm tracking-widest break-words min-h-[2.5rem]">
              {morseCode || <span className="text-slate-600">Enter text to encode...</span>}
            </div>
          </div>

          {/* Sliders: WPM and Tone */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1 font-mono">
                <span>Speed:</span>
                <span className="font-bold text-amber-400">{wpm} WPM</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                value={wpm}
                onChange={(e) => setWpm(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>5 (Novice)</span>
                <span>20 (Standard)</span>
                <span>35 (Contest)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1 font-mono">
                <span>Sidetone Pitch:</span>
                <span className="font-bold text-amber-400">{frequency} Hz</span>
              </div>
              <input
                type="range"
                min="500"
                max="850"
                step="10"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>500 Hz (Low)</span>
                <span>650 Hz</span>
                <span>850 Hz (High)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>

          <button
            onClick={handlePlay}
            disabled={!text.trim()}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Transmission
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Sidetone CW
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
