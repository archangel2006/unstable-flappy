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
  
  // Base frequencies for ambient drone (in Hz) - LOWER, warmer tones
  private readonly BASE_FREQUENCIES = [32, 48, 64, 96]; // C1, G1, C2, G2 - sub-bass/bass range
  private readonly MASTER_VOLUME = 0.04; // Very subtle - felt more than heard
  
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
      
      // Create oscillators for ambient drone - pure sine waves only, no harmonics
      this.BASE_FREQUENCIES.forEach((freq, index) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'sine'; // Pure sine only - no buzzy harmonics
        osc.frequency.value = freq;
        gain.gain.value = index === 0 ? 0.5 : 0.25; // Sub-bass dominant
        
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
   * Trigger system overload audio effect - near silence with muffled low-pass
   */
  triggerOverload(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Fade to near-silence quickly
    this.masterGain.gain.linearRampToValueAtTime(0.005, now + 0.1);
    
    // Apply heavy low-pass filter (muffled, underwater effect)
    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.linearRampToValueAtTime(80, now + 0.1);
    }
    
    // Slight pitch drop
    this.oscillators.forEach((osc) => {
      osc.detune.linearRampToValueAtTime(-50, now + 0.2);
    });
    
    console.log('[AUDIO] Overload triggered - muffled silence');
  }
  
  /**
   * Resume from system overload with smooth recovery
   */
  resumeFromOverload(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    const targetVolume = this.MASTER_VOLUME;
    
    // Fade back in
    this.masterGain.gain.linearRampToValueAtTime(targetVolume, now + 0.3);
    
    // Reset distortion based on current phase
    this.applyPhaseEffects(this.currentPhase, this.getInstabilityLevel(this.currentPhase));
    
    // Reset detune
    this.oscillators.forEach((osc) => {
      osc.detune.linearRampToValueAtTime(0, now + 0.5);
    });
    
    console.log('[AUDIO] Resuming from overload');
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
   * Apply audio effects based on phase - SUBTLE, non-fatiguing
   */
  private applyPhaseEffects(phase: number, instability: number): void {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const transitionTime = 3; // Slow, gradual transitions
    
    // Phase 1-2: Clean, steady, warm
    if (phase <= 2) {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(400, now + transitionTime); // Low pass for warmth
      this.highPassFilter!.frequency.linearRampToValueAtTime(20, now + transitionTime);
      this.distortion!.curve = null;
      this.clearWobble();
      this.clearStutter();
    }
    // Phase 3-4: Very subtle filtering, slow gentle modulation
    else if (phase <= 4) {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(300, now + transitionTime);
      this.startWobble(0.03); // Very slow, gentle pitch drift
    }
    // Phase 5-6: Slightly more filtering, gentle unease
    else if (phase <= 6) {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(250, now + transitionTime);
      this.highPassFilter!.frequency.linearRampToValueAtTime(30, now + transitionTime);
      this.startWobble(0.06); // Still subtle
    }
    // Phase 7-8: Sparse glitches, brief stutters
    else if (phase <= 8) {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(200, now + transitionTime);
      this.highPassFilter!.frequency.linearRampToValueAtTime(40, now + transitionTime);
      this.clearWobble(); // No constant wobble
      this.startSparseGlitch(0.15); // Sparse, brief glitches
    }
    // Phase 9+: More frequent sparse glitches
    else {
      this.lowPassFilter!.frequency.linearRampToValueAtTime(150, now + transitionTime);
      this.highPassFilter!.frequency.linearRampToValueAtTime(50, now + transitionTime);
      this.startSparseGlitch(0.25); // Slightly more frequent but still sparse
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
   * Start SLOW, gentle pitch modulation (not wobble)
   */
  private startWobble(intensity: number): void {
    this.clearWobble();
    
    // Much slower interval for gentle drift
    this.wobbleInterval = window.setInterval(() => {
      if (!this.audioContext) return;
      
      this.oscillators.forEach((osc, i) => {
        // Very slow, smooth sine-like drift instead of random
        const time = Date.now() * 0.0005;
        const drift = Math.sin(time + i * 0.5) * 5 * intensity;
        osc.detune.linearRampToValueAtTime(
          drift,
          this.audioContext!.currentTime + 1.5 // Slow transition
        );
      });
    }, 2000); // Every 2 seconds, not 500ms
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
   * Start SPARSE glitch effect - brief, infrequent audio hiccups
   */
  private startSparseGlitch(intensity: number): void {
    this.clearStutter();
    
    this.stutterInterval = window.setInterval(() => {
      if (!this.audioContext || !this.masterGain) return;
      
      // Low probability of glitch
      if (Math.random() < intensity) {
        const now = this.audioContext.currentTime;
        const currentGain = this.masterGain.gain.value;
        
        // Very brief dropout (20-40ms)
        this.masterGain.gain.setValueAtTime(currentGain * 0.1, now);
        this.masterGain.gain.linearRampToValueAtTime(currentGain, now + 0.03);
        
        // Occasional brief pitch glitch
        if (Math.random() < 0.3) {
          const randomOsc = this.oscillators[Math.floor(Math.random() * this.oscillators.length)];
          if (randomOsc) {
            randomOsc.detune.setValueAtTime(-20, now);
            randomOsc.detune.linearRampToValueAtTime(0, now + 0.05);
          }
        }
      }
    }, 800); // Check less frequently
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
