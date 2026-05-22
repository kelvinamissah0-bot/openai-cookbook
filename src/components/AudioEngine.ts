import { ArtisticStyle } from '../types';

export class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private currentStyle: ArtisticStyle | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Initialized lazily upon user-gesture interaction
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(
        muted ? 0 : (this.currentStyle ? this.getStyleVolume(this.currentStyle.id) : 0.15),
        this.ctx?.currentTime || 0
      );
    }
  }

  private getStyleVolume(id: string): number {
    switch (id) {
      case 'cyberpunk': return 0.2;
      case 'watercolor': return 0.25;
      case 'cinematic': return 0.22;
      case 'vangogh': return 0.18;
      case 'claymation': return 0.22;
      case 'anime': return 0.15;
      default: return 0.2;
    }
  }

  public start(style: ArtisticStyle) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.currentStyle = style;
    const settings = style.synthSettings;

    // Create Audio Nodes
    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.filter = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();
    
    // Setup oscillators
    this.osc1.type = settings.type;
    this.osc1.frequency.setValueAtTime(settings.baseFreq, this.ctx.currentTime);
    
    this.osc2.type = settings.type;
    // Detuned oscillator for thick phasing sound
    this.osc2.frequency.setValueAtTime(settings.baseFreq * 1.5, this.ctx.currentTime);
    this.osc2.detune.setValueAtTime(settings.detune, this.ctx.currentTime);

    // Setup filter
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(settings.filterFreq, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(settings.resonance, this.ctx.currentTime);

    // Setup gain with fade-in to prevent clicks
    const volume = this.isMuted ? 0 : this.getStyleVolume(style.id);
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.0);

    // Modulation (LFO) for sci-fi waves and organic sweeps
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    
    this.lfo.type = 'sine';
    // Cyberpunk pulsing sub, watercolor slow breath, anime fast arps
    const lfoSpeed = style.id === 'cyberpunk' ? 4 : style.id === 'watercolor' ? 0.2 : 1;
    this.lfo.frequency.setValueAtTime(lfoSpeed, this.ctx.currentTime);
    
    const lfoAmount = style.id === 'cyberpunk' ? 120 : style.id === 'watercolor' ? 250 : 80;
    this.lfoGain.gain.setValueAtTime(lfoAmount, this.ctx.currentTime);

    // Node connections: OSCs -> Filter -> Gain -> Destination
    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    
    // Connect LFO to filter frequency to wobble
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    // Trigger start
    this.osc1.start();
    this.osc2.start();
    this.lfo.start();
  }

  // Update soundscape depending on video timeline progress (0 to 60 seconds)
  public updateTimeProgress(seconds: number, style: ArtisticStyle) {
    if (!this.ctx || !this.filter || !this.osc1 || this.currentStyle?.id !== style.id) return;

    const normalizedTime = Math.min(Math.max(seconds / 60, 0), 1);
    const settings = style.synthSettings;

    // Peak filter sweeps at the climax (around 35-45 seconds)
    let dynamicFilterFreq = settings.filterFreq;
    let basePitch = settings.baseFreq;

    if (normalizedTime > 0.4 && normalizedTime < 0.75) {
      // Climax phase - open filter for brighter resonance and shift pitch up a perfect fifth!
      const peakMagnitude = 1 - Math.abs((normalizedTime - 0.58) / 0.18); // peaks at 58% progression
      dynamicFilterFreq = settings.filterFreq + (1200 * peakMagnitude);
      basePitch = settings.baseFreq * (1 + (0.5 * peakMagnitude));
    } else if (normalizedTime >= 0.75) {
      // Resolution phase - fade out frequency and filter for soft ending
      const fadeMagnitude = (1 - normalizedTime) / 0.25; // goes 1 to 0
      dynamicFilterFreq = Math.max(80, settings.filterFreq * fadeMagnitude);
      basePitch = settings.baseFreq * (0.8 + (0.2 * fadeMagnitude));
    }

    // Apply smooth ramps to parameters
    this.filter.frequency.setTargetAtTime(dynamicFilterFreq, this.ctx.currentTime, 0.2);
    this.osc1.frequency.setTargetAtTime(basePitch, this.ctx.currentTime, 0.4);
    
    // Vary LFO speed over time to match dramatic tension
    if (this.lfo) {
      const dynamicLfoSpeed = (style.id === 'cyberpunk' ? 4 : style.id === 'watercolor' ? 0.2 : 1) * (1 + (normalizedTime * 1.5));
      this.lfo.frequency.setTargetAtTime(dynamicLfoSpeed, this.ctx.currentTime, 0.5);
    }
  }

  public stop() {
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2 = null;
      }
      if (this.lfo) {
        this.lfo.stop();
        this.lfo = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.filter) {
        this.filter.disconnect();
        this.filter = null;
      }
      if (this.lfoGain) {
        this.lfoGain.disconnect();
        this.lfoGain = null;
      }
    } catch (e) {
      console.warn("Error stopping synth keys cleanly:", e);
    }
  }
}
export const synthInstance = new CinematicAudioEngine();
