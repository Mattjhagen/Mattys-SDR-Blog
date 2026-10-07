// Realistic SDR Radio Receiver Synthesizer using Web Audio API

class SdrAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private signalOsc: OscillatorNode | null = null;
  private signalGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public start(): void {
    if (this.isRunning) return;
    const ctx = this.initContext();

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // 1. Synthesize atmospheric RF band hiss (band noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    // Pinkish atmospheric noise
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoiseSource = ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    // Bandpass filter for typical receiver audio passband (300Hz - 2700Hz SSB/CW filter)
    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = 'bandpass';
    this.filterNode.frequency.setValueAtTime(1400, ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.2, ctx.currentTime);

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

    whiteNoiseSource.connect(this.filterNode);
    this.filterNode.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    whiteNoiseSource.start();
    this.noiseNode = whiteNoiseSource;

    // 2. Synthesize carrier / CW / demodulated signal tone
    this.signalOsc = ctx.createOscillator();
    this.signalOsc.type = 'sine';
    this.signalOsc.frequency.setValueAtTime(700, ctx.currentTime);

    this.signalGain = ctx.createGain();
    this.signalGain.gain.setValueAtTime(0.0, ctx.currentTime);

    this.signalOsc.connect(this.signalGain);
    this.signalGain.connect(this.masterGain);
    this.signalOsc.start();

    this.isRunning = true;
  }

  public setTuningOffset(distanceToSignalHz: number, signalStrength: number, mode: 'CW' | 'USB' | 'AM' | 'FT8'): void {
    if (!this.isRunning || !this.ctx || !this.signalOsc || !this.signalGain) return;

    const absOffset = Math.abs(distanceToSignalHz);
    const now = this.ctx.currentTime;

    if (absOffset < 3000) {
      // Station is within audio passband
      let toneFreq = 700;
      let gainVal = Math.min(0.25, signalStrength * (1 - absOffset / 3000));

      if (mode === 'CW') {
        toneFreq = 500 + absOffset * 0.8;
      } else if (mode === 'USB') {
        toneFreq = Math.max(300, Math.min(3000, absOffset));
      } else if (mode === 'FT8') {
        // Multi-frequency chirp sensation
        toneFreq = 1200 + ((Math.floor(now * 4) % 8) * 80);
      } else {
        // AM carrier whistle
        toneFreq = Math.max(150, Math.min(4000, absOffset));
      }

      this.signalOsc.frequency.setTargetAtTime(toneFreq, now, 0.05);
      this.signalGain.gain.setTargetAtTime(gainVal, now, 0.08);
    } else {
      // Off frequency - only band hiss
      this.signalGain.gain.setTargetAtTime(0.0, now, 0.05);
    }
  }

  public setVolume(vol: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.03);
    }
  }

  public stop(): void {
    if (!this.isRunning) return;
    try {
      if (this.noiseNode && 'stop' in this.noiseNode) {
        (this.noiseNode as AudioBufferSourceNode).stop();
      }
      if (this.signalOsc) {
        this.signalOsc.stop();
      }
    } catch {
      // Ignored
    }
    this.isRunning = false;
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}

export const sdrAudio = new SdrAudioEngine();
