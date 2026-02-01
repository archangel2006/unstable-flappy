/**
 * Audio Manager Module
 * Creates ambient background audio that degrades with system instability
 * 
 * Uses Web Audio API for real-time manipulation:
 * - Early phases: Clean, steady ambient drone
 * - Mid phases: Subtle filtering, slight detune
 * - Late phases: Stutters, pitch instability, distortion
 */

import { PHASE } from './Config';

interface AudioState {
  isPlaying: boolean;
  phase: number;
  instabilityLevel: number; // 0-1, derived from phase
  isDemoMode: boolean;
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private oscillatorGains: GainNode[] = [];
  private lowPassFilter: BiquadFilterNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private distortion: WaveShaperNode | null = null;
  
  private isInitialized = false;
  private isPlaying = false;
  private currentPhase = 1;
  private stutterInterval: number | null = null;
  private wobbleInterval: number | null = null;
  
  // Base frequencies for ambient drone (in Hz)
  private readonly BASE_FREQUENCIES = [55, 82.5, 110, 165]; // A1, E2, A2, E3
  private readonly MASTER_VOLUME = 0.15; // Keep it subtle
  
  /**
   * Initialize the audio context and nodes
   * Must be called after user interaction (browser requirement)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.audioContext.destination);
      
      // Create filters
      this.lowPassFilter = this.audioContext.createBiquadFilter();
      this.lowPassFilter.type = 'lowpass';
      this.lowPassFilter.frequency.value = 2000;
      this.lowPassFilter.Q.value = 1;
      this.lowPassFilter.connect(this.masterGain);
      
      this.highPassFilter = this.audioContext.createBiquadFilter();
      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.value = 20;
      this.highPassFilter.Q.value = 1;
      this.highPassFilter.connect(this.lowPassFilter);
      
      // Create subtle distortion for late phases
      this.distortion = this.audioContext.createWaveShaper();
      this.distortion.curve = null; // No distortion initially
      this.distortion.connect(this.highPassFilter);
      
      // Create oscillators for ambient drone
      this.BASE_FREQUENCIES.forEach((freq, index) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = index === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        gain.gain.value = index === 0 ? 0.4 : 0.2; // Bass louder
        
        osc.connect(gain);
        gain.connect(this.distortion!);
        
        this.oscillators.push(osc);
        this.oscillatorGains.push(gain);
      });
      
      this.isInitialized = true;
      console.log('[AUDIO] Initialized');
    } catch (error) {
      console.error('[AUDIO] Failed to initialize:', error);
    }
  }
  
  /**
   * Start playing the ambient audio
   */
  async start(isDemoMode: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.audioContext || this.isPlaying) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    // Start oscillators
    this.oscillators.forEach(osc => {
      try {
        osc.start();
      } catch (e) {
        // Already started, ignore
      }
    });
    
    // Fade in
    const targetVolume = isDemoMode ? this.MASTER_VOLUME * 0.7 : this.MASTER_VOLUME;
    this.masterGain!.gain.linearRampToValueAtTime(
      targetVolume,
      this.audioContext.currentTime + 1
    );
    
    this.isPlaying = true;
    this.currentPhase = 1;
    this.updatePhase(1);
    
    console.log('[AUDIO] Started');
  }
  
  /**
   * Stop the audio with fade out
   */
  stop(): void {
    if (!this.audioContext || !this.masterGain || !this.isPlaying) return;
    
    // Clear intervals
    if (this.stutterInterval) {
      clearInterval(this.stutterInterval);
      this.stutterInterval = null;
    }
    if (this.wobbleInterval) {
      clearInterval(this.wobbleInterval);
      this.wobbleInterval = null;
    }
    
    // Fade out
    this.masterGain.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + 0.5
    );
    
    this.isPlaying = false;
    console.log('[AUDIO] Stopped');
  }
  
  /**
   * Reset audio state for new game
   */
  reset(isDemoMode: boolean = false): void {
    this.currentPhase = 1;
    
    // Reset all effects
    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.value = 2000;
    }
    if (this.highPassFilter) {
      this.highPassFilter.frequency.value = 20;
    }
    if (this.distortion) {
      this.distortion.curve = null;
    }
    
    // Reset oscillator frequencies
    this.oscillators.forEach((osc, index) => {
      osc.frequency.value = this.BASE_FREQUENCIES[index];
      osc.detune.value = 0;
    });
    
    // Clear intervals
    if (this.stutterInterval) {
      clearInterval(this.stutterInterval);
      this.stutterInterval = null;
    }
    if (this.wobbleInterval) {
      clearInterval(this.wobbleInterval);
      this.wobbleInterval = null;
    }
    
    // Restart if was playing
    if (this.isPlaying) {
      this.updatePhase(1);
    }
  }
  
  /**
   * Update audio based on current phase
   * This is called from the game loop
   */
  updatePhase(phase: number): void {
    if (!this.audioContext || !this.isPlaying) return;
    if (phase === this.currentPhase && phase !== 1) return;
    
    this.currentPhase = phase;
    const instability = this.getInstabilityLevel(phase);
    
    console.log(`[AUDIO] Phase ${phase}, instability: ${instability.toFixed(2)}`);
    
    // Apply phase-based effects gradually
    this.applyPhaseEffects(phase, instability);
  }
  
  /**
   * Calculate instability level from phase (0-1)
   */
  private getInstabilityLevel(phase: number): number {
    if (phase <= 2) return 0;
    if (phase >= 9) return 1;
    return (phase - 2) / 7; // Linear 0-1 from phase 3-9
  }
  
  /**
   * Apply audio effects based on phase
   */
  private applyPhaseEffects(phase: number, instability: number): void {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const transitionTime = 2; // Gradual transitions
    
    // Phase 1-2: Clean, steady
    if (phase <= 2) {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(2000, now + transitionTime);
      this.highPassFilter!.frequency.linearRampToValueAtTime(20, now + transitionTime);
      this.distortion!.curve = null;
      this.clearWobble();
      this.clearStutter();
    }
    // Phase 3-4: Subtle filtering
    else if (phase <= 4) {
      // Slightly muffled sound
      this.lowPassFilter!.frequency.linearRampToValueAtTime(1200 - (phase - 3) * 200, now + transitionTime);
      this.startWobble(0.1); // Very subtle pitch wobble
    }
    // Phase 5-6: More filtering, subtle detune
    else if (phase <= 6) {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(800, now + transitionTime);
      this.highPassFilter!.frequency.linearRampToValueAtTime(60, now + transitionTime);
      this.startWobble(0.2);
      
      // Slight detune
      this.oscillators.forEach((osc, i) => {
        const detune = (Math.random() - 0.5) * 10 * instability;
        osc.detune.linearRampToValueAtTime(detune, now + transitionTime);
      });
    }
    // Phase 7-8: Noticeable instability
    else if (phase <= 8) {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(600, now + transitionTime);
      this.highPassFilter!.frequency.linearRampToValueAtTime(100, now + transitionTime);
      this.setDistortion(5);
      this.startWobble(0.4);
      this.startStutter(0.3);
    }
    // Phase 9+: System collapse
    else {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(400, now + transitionTime);
      this.highPassFilter!.frequency.linearRampToValueAtTime(150, now + transitionTime);
      this.setDistortion(15);
      this.startWobble(0.6);
      this.startStutter(0.5);
    }
  }
  
  /**
   * Set distortion amount safely
   */
  private setDistortion(amount: number): void {
    if (!this.distortion) return;
    
    if (amount === 0) {
      this.distortion.curve = null;
      return;
    }
    
    const samples = 256;
    const curve = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    
    // Type assertion to satisfy TypeScript
    (this.distortion as any).curve = curve;
  }
  
  /**
   * Start pitch wobble effect
   */
  private startWobble(intensity: number): void {
    this.clearWobble();
    
    this.wobbleInterval = window.setInterval(() => {
      if (!this.audioContext) return;
      
      this.oscillators.forEach((osc, i) => {
        const wobble = (Math.random() - 0.5) * 20 * intensity;
        osc.detune.linearRampToValueAtTime(
          wobble,
          this.audioContext!.currentTime + 0.3
        );
      });
    }, 500);
  }
  
  /**
   * Clear pitch wobble
   */
  private clearWobble(): void {
    if (this.wobbleInterval) {
      clearInterval(this.wobbleInterval);
      this.wobbleInterval = null;
    }
    
    // Reset detune
    this.oscillators.forEach(osc => {
      if (this.audioContext) {
        osc.detune.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
      }
    });
  }
  
  /**
   * Start stutter effect (brief volume drops)
   */
  private startStutter(intensity: number): void {
    this.clearStutter();
    
    this.stutterInterval = window.setInterval(() => {
      if (!this.audioContext || !this.masterGain) return;
      
      // Random chance of stutter based on intensity
      if (Math.random() < intensity * 0.3) {
        const now = this.audioContext.currentTime;
        const currentGain = this.masterGain.gain.value;
        
        // Brief volume drop
        this.masterGain.gain.linearRampToValueAtTime(currentGain * 0.3, now + 0.02);
        this.masterGain.gain.linearRampToValueAtTime(currentGain, now + 0.08);
      }
    }, 200);
  }
  
  /**
   * Clear stutter effect
   */
  private clearStutter(): void {
    if (this.stutterInterval) {
      clearInterval(this.stutterInterval);
      this.stutterInterval = null;
    }
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    
    this.oscillators = [];
    this.oscillatorGains = [];
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    console.log('[AUDIO] Disposed');
  }
}

// Singleton instance
export const audioManager = new AudioManager();
