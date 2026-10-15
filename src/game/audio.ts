/**
 * Procedural Web Audio API Synthesizer for Frosty Trails Snow Plow.
 * Zero external audio files — 100% synthesized sound effects.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine node references for continuous modulation
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Snow crunch noise node
  private snowNoiseGain: GainNode | null = null;
  private snowFilter: BiquadFilterNode | null = null;

  // Blizzard howling wind noise
  private blizzardGain: GainNode | null = null;
  private blizzardFilter: BiquadFilterNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio not supported or blocked
    }
  }

  public ensureRunning() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous engine rumble that changes pitch/timbre with speed
   */
  public startEngine() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isEngineRunning) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc.start();
      this.isEngineRunning = true;

      this.setupSnowNoise();
      this.setupBlizzardWind();
    } catch {
      // Audio fallback
    }
  }

  private setupSnowNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.snowFilter = this.ctx.createBiquadFilter();
    this.snowFilter.type = 'bandpass';
    this.snowFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.snowFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.snowNoiseGain = this.ctx.createGain();
    this.snowNoiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(this.snowFilter);
    this.snowFilter.connect(this.snowNoiseGain);
    this.snowNoiseGain.connect(this.masterGain);

    whiteNoise.start();
  }

  private setupBlizzardWind() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    this.blizzardFilter = this.ctx.createBiquadFilter();
    this.blizzardFilter.type = 'bandpass';
    this.blizzardFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.blizzardFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.blizzardGain = this.ctx.createGain();
    this.blizzardGain.gain.setValueAtTime(0, this.ctx.currentTime);

    windSource.connect(this.blizzardFilter);
    this.blizzardFilter.connect(this.blizzardGain);
    this.blizzardGain.connect(this.masterGain);

    windSource.start();
  }

  public updateEngine(speedRatio: number, isPlowing: boolean, comboTier: number) {
    if (!this.ctx || !this.isEngineRunning) return;

    const t = this.ctx.currentTime;
    if (this.engineOsc && this.engineFilter && this.engineGain) {
      const targetFreq = 50 + speedRatio * 90;
      const targetFilter = 120 + speedRatio * 320;
      const targetVolume = 0.08 + speedRatio * 0.14;

      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
      this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.08);
      this.engineGain.gain.setTargetAtTime(targetVolume, t, 0.08);
    }

    if (this.snowNoiseGain && this.snowFilter) {
      if (isPlowing && speedRatio > 0.05) {
        const targetVol = Math.min(0.28, 0.08 + speedRatio * 0.16 + comboTier * 0.03);
        const targetFreq = 700 + comboTier * 250 + speedRatio * 400;
        this.snowNoiseGain.gain.setTargetAtTime(targetVol, t, 0.05);
        this.snowFilter.frequency.setTargetAtTime(targetFreq, t, 0.05);
      } else {
        this.snowNoiseGain.gain.setTargetAtTime(0, t, 0.08);
      }
    }
  }

  public setBlizzardWind(active: boolean, intensity = 1.0) {
    if (!this.ctx || !this.blizzardGain || !this.blizzardFilter) return;
    const t = this.ctx.currentTime;
    if (active) {
      this.blizzardGain.gain.setTargetAtTime(0.24 * intensity, t, 0.3);
      this.blizzardFilter.frequency.setTargetAtTime(450 + Math.sin(t * 1.5) * 150, t, 0.2);
    } else {
      this.blizzardGain.gain.setTargetAtTime(0, t, 0.5);
    }
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    if (this.snowNoiseGain && this.ctx) {
      this.snowNoiseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    if (this.blizzardGain && this.ctx) {
      this.blizzardGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    this.isEngineRunning = false;
  }

  /**
   * Musical horns triggered by 'H' key or button
   */
  public playHorn(hornStyle: string = 'classic') {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    switch (hornStyle) {
      case 'steam-whistle': {
        // High locomotive steam chords
        [587.33, 739.99, 880].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t);
          osc.stop(t + 0.65);
        });
        break;
      }
      case 'chimes': {
        // Holiday bell sequence
        [659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + idx * 0.09);
          gain.gain.setValueAtTime(0.18, t + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.35);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + idx * 0.09);
          osc.stop(t + idx * 0.09 + 0.4);
        });
        break;
      }
      case 'foghorn': {
        // Resonant deep sub horn
        [110, 138.59].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t);
          osc.stop(t + 0.95);
        });
        break;
      }
      default: {
        // Classic plow dual beep
        [392, 440].forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.07);
          gain.gain.setValueAtTime(0.2, t + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + idx * 0.07);
          osc.stop(t + idx * 0.07 + 0.28);
        });
        break;
      }
    }
  }

  /**
   * Blizzard Warning Siren alerting players to incoming snowstorm
   */
  public playBlizzardWarning() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(640, t + 0.4);
    osc.frequency.linearRampToValueAtTime(320, t + 0.8);
    osc.frequency.linearRampToValueAtTime(640, t + 1.2);
    osc.frequency.linearRampToValueAtTime(320, t + 1.6);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.9);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 2.0);
  }

  public playComboChime(tierIndex: number) {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [
      [523.25, 659.25],
      [659.25, 783.99],
      [783.99, 987.77],
      [1046.5, 1318.5],
      [1318.5, 1567.98, 2093.0],
    ];
    const freqs = notes[Math.min(tierIndex, notes.length - 1)];

    freqs.forEach((freq, idx) => {
      const startTime = this.ctx!.currentTime + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  public playCoinPing() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.setValueAtTime(1318.51, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  public playBoost() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.3);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  public playThud() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playUpgradeDing() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.18, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.4);
    });
  }

  public playVictoryFanfare() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const chordTimes = [
      { delay: 0.0, notes: [261.63, 329.63, 392.0] },
      { delay: 0.25, notes: [293.66, 369.99, 440.0] },
      { delay: 0.5, notes: [329.63, 392.0, 493.88] },
      { delay: 0.8, notes: [523.25, 659.25, 783.99, 1046.5] },
    ];

    chordTimes.forEach(({ delay, notes }) => {
      const t = this.ctx!.currentTime + delay;
      notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.7);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t);
        osc.stop(t + 0.95);
      });
    });
  }
}

export const sound = new SoundSynthesizer();
