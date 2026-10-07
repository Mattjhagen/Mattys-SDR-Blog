import React, { useState } from 'react';
import { X, Terminal, Radio, Copy, Check, ExternalLink, Cpu, Wifi, ShieldCheck, ChevronRight, BookOpen } from 'lucide-react';

interface LinuxSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStreamUrl?: (url: string) => void;
}

export const LinuxSetupGuideModal: React.FC<LinuxSetupGuideModalProps> = ({
  isOpen,
  onClose,
  onApplyStreamUrl
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'driver' | 'sdrpp' | 'audio' | 'stream' | 'tunnel'>('overview');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState('http://localhost:8000/live');

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold tracking-tight text-white">
                  RTL-SDR v4 & SDR++ Linux Station Guide
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-400 text-slate-950 rounded">
                  v4 BLOG EDITION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect your physical RTL-SDR v4 on Linux to stream live radio audio to this web app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto text-xs font-mono shrink-0">
          {[
            { id: 'overview', label: '1. Architecture' },
            { id: 'driver', label: '2. RTL-SDR v4 Driver' },
            { id: 'sdrpp', label: '3. SDR++ Setup' },
            { id: 'audio', label: '4. Virtual Audio Sink' },
            { id: 'stream', label: '5. FFmpeg Web Stream' },
            { id: 'tunnel', label: '6. Public Club Tunnel' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  How the RTL-SDR v4 Live Web Stream Works
                </h4>
                <p className="text-xs text-slate-300">
                  Your physical <strong>RTL-SDR Blog v4</strong> receives radio signals (HF, VHF, UHF) on your Linux PC.
                  SDR++ performs the DSP demodulation (USB, LSB, CW, FM, etc.). You then stream the demodulated audio
                  to an HTTP stream endpoint so anyone visiting your club blog can listen in real time!
                </p>

                {/* Architecture Diagram */}
                <div className="p-3.5 rounded-lg bg-black border border-slate-800/90 font-mono text-[11px] text-amber-300 overflow-x-auto whitespace-pre">
{`[Antenna]
   │
   ▼
[RTL-SDR v4 (USB)] ──> [Linux PC: SDR++]
                            │ (Demodulates SSB/CW/FM)
                            ▼
                   [PulseAudio/PipeWire: sdr_stream]
                            │
                            ▼
                   [FFmpeg / Icecast / Cloudflared] ──> [Port 8000 / Web URL]
                                                              │
                                                              ▼
                                                 [This Web App (SDR Lab)]
                                                 • Live Audio Playback
                                                 • Real-time Audio Waterfall
                                                 • FFT Spectrum & S-Meter
                                                 • On-Air Clip Recorder`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
                    <Cpu className="w-4 h-4" />
                    <span>RTL-SDR Blog v4</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Uses R828D tuner chip + built-in HF upconverter. Works from 500 kHz to 1.75 GHz with zero mods.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
                    <Wifi className="w-4 h-4" />
                    <span>No Cloud Costs</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Runs 100% locally on your Linux machine or Raspberry Pi. Stream locally or tunnel securely.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Universal Listening</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Club members don't need SDR software or hardware. They simply open your blog on their phone or PC!
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('driver')}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Install RTL-SDR v4 Driver</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RTL-SDR v4 DRIVER */}
          {activeTab === 'driver' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                <strong>Important note for RTL-SDR Blog v4:</strong> The v4 uses the newer <strong>Rafael Micro R828D</strong> tuner instead of the older R820T2. Old Linux distributions have older librtlsdr drivers that do not recognize v4 without the updated driver package.
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">
                  Option 1: Quick Install (Ubuntu 24.04+, Debian 13+, Fedora, Arch)
                </h4>
                <div className="relative p-3 rounded-lg bg-black font-mono text-xs text-slate-200 border border-slate-800">
                  <pre className="overflow-x-auto">sudo apt update && sudo apt install -y rtl-sdr librtlsdr-dev</pre>
                  <button
                    onClick={() => handleCopy('sudo apt update && sudo apt install -y rtl-sdr librtlsdr-dev', 'drv1')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                  >
                    {copiedIndex === 'drv1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'drv1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">
                  Option 2: Official RTL-SDR Blog v4 Driver Build (Recommended for Ubuntu 20.04/22.04 & Mint)
                </h4>
                <p className="text-xs text-slate-400">
                  This installs the official driver branch maintained by RTL-SDR Blog with full R828D tuner support and udev permissions:
                </p>
                <div className="relative p-3 rounded-lg bg-black font-mono text-xs text-slate-200 border border-slate-800">
                  <pre className="overflow-x-auto">{`sudo apt purge ^librtlsdr
sudo apt install -y libusb-1.0-0-dev git cmake pkg-config build-essential
git clone https://github.com/rtlsdrblog/rtl-sdr-blog
cd rtl-sdr-blog && mkdir build && cd build
cmake ../ -DINSTALL_UDEV_RULES=ON
make -j$(nproc)
sudo make install
sudo cp ../rtl-sdr.rules /etc/udev/rules.d/
sudo ldconfig
echo 'blacklist dvb_usb_rtl28xxu' | sudo tee /etc/modprobe.d/nortl.conf`}</pre>
                  <button
                    onClick={() => handleCopy(`sudo apt purge ^librtlsdr\nsudo apt install -y libusb-1.0-0-dev git cmake pkg-config build-essential\ngit clone https://github.com/rtlsdrblog/rtl-sdr-blog\ncd rtl-sdr-blog && mkdir build && cd build\ncmake ../ -DINSTALL_UDEV_RULES=ON\nmake -j$(nproc)\nsudo make install\nsudo cp ../rtl-sdr.rules /etc/udev/rules.d/\nsudo ldconfig\necho 'blacklist dvb_usb_rtl28xxu' | sudo tee /etc/modprobe.d/nortl.conf`, 'drv2')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                  >
                    {copiedIndex === 'drv2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'drv2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white text-sm">Verify Dongle Detection</h4>
                <p className="text-xs text-slate-400">Plug in your RTL-SDR v4 to a USB port and run:</p>
                <div className="relative p-3 rounded-lg bg-black font-mono text-xs text-emerald-300 border border-slate-800">
                  <pre>rtl_test -t</pre>
                  <button
                    onClick={() => handleCopy('rtl_test -t', 'drv3')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                  >
                    {copiedIndex === 'drv3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'drv3' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  You should see output like: <code className="text-amber-300">Found Rafael Micro R828D tuner</code> and <code className="text-emerald-300">No E4000 tuner found, tuner chip: R828D</code>.
                </p>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveTab('sdrpp')}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Configure SDR++</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SDR++ SETUP */}
          {activeTab === 'sdrpp' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm">Installing SDR++ on Linux</h4>
              <p className="text-xs text-slate-400">
                SDR++ (SDRPlusPlus by AlexandreRouma) is one of the best cross-platform SDR software suites with low CPU overhead and high DSP fidelity.
              </p>

              <div className="relative p-3 rounded-lg bg-black font-mono text-xs text-slate-200 border border-slate-800">
                <pre className="overflow-x-auto">{`# For Ubuntu / Debian (AMD64 / x86_64):
wget https://github.com/AlexandreRouma/SDRPlusPlus/releases/latest/download/sdrpp_debian_amd64.deb
sudo apt install -y ./sdrpp_debian_amd64.deb

# For Arch Linux:
yay -S sdrpp-git`}</pre>
                <button
                  onClick={() => handleCopy(`wget https://github.com/AlexandreRouma/SDRPlusPlus/releases/latest/download/sdrpp_debian_amd64.deb\nsudo apt install -y ./sdrpp_debian_amd64.deb`, 'sdrpp1')}
                  className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                >
                  {copiedIndex === 'sdrpp1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 'sdrpp1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="font-semibold text-white text-xs font-mono text-amber-300">
                  RTL-SDR v4 Specific Settings in SDR++:
                </h5>
                <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
                  <li><strong>Source:</strong> Select <code className="text-amber-300">RTL-SDR</code> in the Source module on the top left.</li>
                  <li><strong>Sample Rate:</strong> Set to <code className="text-white">2.048 MSPS</code> or <code className="text-white">2.4 MSPS</code> for stable USB bandwidth.</li>
                  <li><strong>Direct Sampling:</strong> Leave <code className="text-white">OFF</code>! The RTL-SDR v4 has an internal upconverter, meaning HF (160m–10m) tunes directly in normal mode without Q-branch direct sampling!</li>
                  <li><strong>Tuner Gain:</strong> Start around <code className="text-white">28 to 36 dB</code>.</li>
                  <li><strong>Bias-Tee:</strong> Enable only if you are powering an active antenna or LNA.</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveTab('driver')}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveTab('audio')}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Create Virtual Audio Sink</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: VIRTUAL AUDIO SINK */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm">Create a Virtual Audio Sink in Linux</h4>
              <p className="text-xs text-slate-400">
                To stream audio from SDR++ to the web without capturing your microphone or system notification sounds,
                we create a clean virtual null-sink in PulseAudio or PipeWire.
              </p>

              <div className="relative p-3 rounded-lg bg-black font-mono text-xs text-slate-200 border border-slate-800">
                <pre className="overflow-x-auto">{`# Create dedicated audio sink for SDR stream:
pactl load-module module-null-sink sink_name=sdr_stream sink_properties=device.description="SDR_Audio_Stream"`}</pre>
                <button
                  onClick={() => handleCopy('pactl load-module module-null-sink sink_name=sdr_stream sink_properties=device.description="SDR_Audio_Stream"', 'aud1')}
                  className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                >
                  {copiedIndex === 'aud1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 'aud1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h5 className="font-semibold text-white text-xs font-mono text-amber-300">
                  Select it inside SDR++:
                </h5>
                <ol className="list-decimal list-inside space-y-1">
                  <li>In SDR++, find the <strong>Audio</strong> module in the left sidebar.</li>
                  <li>Under <strong>Audio Device / Sink</strong>, choose <code className="text-white font-mono">SDR_Audio_Stream</code> (or null-sink).</li>
                  <li>Click the Play (▶) button at the top of SDR++ to start listening.</li>
                </ol>
                <p className="text-[11px] text-slate-400 pt-1">
                  <em>Tip: If you also want to hear it in your headphones simultaneously, PulseAudio/PipeWire volume control (pavucontrol) lets you monitor both.</em>
                </p>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveTab('sdrpp')}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveTab('stream')}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Launch FFmpeg Stream</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: FFMPEG STREAM */}
          {activeTab === 'stream' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm">Launch 1-Line FFmpeg Web Audio Stream</h4>
              <p className="text-xs text-slate-400">
                FFmpeg can directly grab audio from <code className="text-amber-300">sdr_stream.monitor</code> and serve an MP3 web stream directly on port 8000. It requires zero server setup!
              </p>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Install FFmpeg (if not already installed):</span>
                <div className="relative p-2.5 rounded-lg bg-black font-mono text-xs text-slate-200 border border-slate-800">
                  <pre>sudo apt install -y ffmpeg</pre>
                  <button
                    onClick={() => handleCopy('sudo apt install -y ffmpeg', 'ff1')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                  >
                    {copiedIndex === 'ff1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'ff1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Run the Streamer Command in Terminal:</span>
                <div className="relative p-3 rounded-lg bg-black font-mono text-xs text-emerald-300 border border-slate-800">
                  <pre className="overflow-x-auto">ffmpeg -f pulse -i sdr_stream.monitor -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:8000/live</pre>
                  <button
                    onClick={() => handleCopy('ffmpeg -f pulse -i sdr_stream.monitor -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:8000/live', 'ff2')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                  >
                    {copiedIndex === 'ff2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'ff2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-semibold text-white font-mono text-amber-300">
                  Test on Your Local Network:
                </div>
                <p>
                  Your stream is now live at <code className="text-white font-bold">http://localhost:8000/live</code> (or <code className="text-white">http://YOUR-LINUX-IP:8000/live</code> on your home Wi-Fi)!
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyStreamUrl) {
                        onApplyStreamUrl('http://localhost:8000/live');
                      }
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
                  >
                    Set App Stream URL to http://localhost:8000/live
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveTab('audio')}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveTab('tunnel')}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors"
                >
                  <span>Next: Share Over Internet (Cloudflare)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: TUNNEL FOR REMOTE CLUB ACCESS */}
          {activeTab === 'tunnel' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm">
                Share With Club Members Worldwide (Zero Port Forwarding)
              </h4>
              <p className="text-xs text-slate-400">
                If you want other club members to listen from their homes or phones across the internet, you can use a free, secure Cloudflare Quick Tunnel. This gives you an <strong>https://...</strong> link that works everywhere without touching your home router or exposing your home IP.
              </p>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Install Cloudflared on Linux:</span>
                <div className="relative p-2.5 rounded-lg bg-black font-mono text-xs text-slate-200 border border-slate-800">
                  <pre className="overflow-x-auto">{`# Download and install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb`}</pre>
                  <button
                    onClick={() => handleCopy(`wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb\nsudo dpkg -i cloudflared-linux-amd64.deb`, 'tun1')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                  >
                    {copiedIndex === 'tun1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'tun1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Launch Instant Free Tunnel:</span>
                <div className="relative p-3 rounded-lg bg-black font-mono text-xs text-emerald-300 border border-slate-800">
                  <pre>cloudflared tunnel --url http://localhost:8000</pre>
                  <button
                    onClick={() => handleCopy('cloudflared tunnel --url http://localhost:8000', 'tun2')}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                  >
                    {copiedIndex === 'tun2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'tun2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Cloudflare will print a URL in the terminal like:
                  <code className="block mt-1 p-2 bg-slate-950 text-cyan-300 rounded border border-slate-800 font-mono">
                    https://neat-radio-station.trycloudflare.com
                  </code>
                </p>
                <p className="text-xs text-slate-400">
                  Your public web stream URL is that address plus <code className="text-white font-mono">/live</code> (e.g. <code className="text-amber-300 font-mono">https://neat-radio-station.trycloudflare.com/live</code>).
                  Paste that into the SDR Waterfall Lab settings so all club members can listen!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
                <strong>You're All Set!</strong> Now anyone in your ham radio club can visit your blog, click <strong>Launch SDR Waterfall Lab</strong>, and listen to live on-air signals from your RTL-SDR v4 with real-time audio waterfall visualization!
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveTab('stream')}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors"
                >
                  Close & Open SDR Lab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
