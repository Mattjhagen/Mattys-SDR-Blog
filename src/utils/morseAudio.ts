// Web Audio API CW Morse Code Synthesizer

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '/': '-..-.', '?': '..--..', '.': '.-.-.-', ',': '--..--', '=': '-...-',
  '-': '-....-', '(': '-.--.', ')': '-.--.-', '@': '.--.-.', ':': '---...',
  ' ': ' '
};

class MorsePlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTimeout: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public encode(text: string): string {
    return text
      .toUpperCase()
      .split('')
      .map(char => MORSE_MAP[char] || '')
      .filter(Boolean)
      .join(' ');
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  public play(
    text: string,
    wpm: number = 20,
    frequency: number = 650,
    onCharacter?: (char: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    this.stop();
    this.isPlaying = true;

    return new Promise((resolve) => {
      const ctx = this.getAudioContext();
      // PARIS standard: 1 dit length = 1200ms / WPM
      const dotTimeMs = 1200 / Math.max(5, Math.min(45, wpm));
      const dotTimeSec = dotTimeMs / 1000;
      
      const cleanText = text.toUpperCase();
      let scheduleTime = ctx.currentTime + 0.05;

      for (let i = 0; i < cleanText.length; i++) {
        if (!this.isPlaying) break;
        const char = cleanText[i];
        if (char === ' ') {
          scheduleTime += dotTimeSec * 7;
          continue;
        }

        const morseCode = MORSE_MAP[char];
        if (!morseCode) continue;

        // Schedule visual callback
        const delayMs = Math.max(0, (scheduleTime - ctx.currentTime) * 1000);
        setTimeout(() => {
          if (this.isPlaying && onCharacter) {
            onCharacter(char);
          }
        }, delayMs);

        for (let j = 0; j < morseCode.length; j++) {
          const symbol = morseCode[j];
          const duration = symbol === '-' ? dotTimeSec * 3 : dotTimeSec;

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, scheduleTime);

          // Smooth envelope to prevent audio key clicks (5ms ramp up, 5ms ramp down)
          const attack = 0.005;
          const decay = 0.005;
          gain.gain.setValueAtTime(0, scheduleTime);
          gain.gain.linearRampToValueAtTime(0.18, scheduleTime + attack);
          gain.gain.setValueAtTime(0.18, scheduleTime + duration - decay);
          gain.gain.linearRampToValueAtTime(0, scheduleTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(scheduleTime);
          osc.stop(scheduleTime + duration);

          // Gap between dots and dashes within same character = 1 dot length
          scheduleTime += duration + dotTimeSec;
        }

        // Gap between characters = 3 dot lengths (we already added 1 dot at end of loop, so add 2 more)
        scheduleTime += dotTimeSec * 2;
      }

      const totalTimeMs = Math.max(0, (scheduleTime - ctx.currentTime) * 1000);
      this.currentTimeout = window.setTimeout(() => {
        this.isPlaying = false;
        if (onComplete) onComplete();
        resolve();
      }, totalTimeMs);
    });
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const morsePlayer = new MorsePlayer();
