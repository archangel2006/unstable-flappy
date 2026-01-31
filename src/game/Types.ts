/**
 * Game Type Definitions
 */

export interface Bird {
  x: number;
  y: number;
  velocityY: number;
  width: number;
  height: number;
}

export interface Pipe {
  x: number;
  gapY: number; // Center of the gap
  gapSize: number;
  isGhost: boolean;
  oscillationOffset: number;
  oscillationSeed: number;
  passed: boolean;
  // For delayed collision (trust collapse feature)
  spawnTime: number;
  hasDelayedCollision: boolean;
}

export interface AdaptiveAssist {
  isActive: boolean;
  consecutiveEarlyDeaths: number;
  lastDeathPhase: number;
  gapMultiplier: number;
  gravityMultiplier: number;
  speedMultiplier: number;
}

export interface GameState {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  timeAlive: number; // seconds
  phase: number;
  isPlaying: boolean;
  isGameOver: boolean;
  hasStarted: boolean;
  
  // Current physics values (can mutate)
  currentGravity: number;
  currentWindForce: number;
  currentPipeSpeed: number;
  
  // Feature flags controlled by phase
  isControlFlipped: boolean;
  controlFlipEndTime: number;
  controlFlipWarning: boolean; // Show warning before flip
  controlFlipWarningEndTime: number;
  
  // Demo mode
  isDemoMode: boolean;
  
  // Showcase mode (all features, easy difficulty)
  isShowcaseMode: boolean;
  
  // Adaptive difficulty assist
  adaptiveAssist: AdaptiveAssist;
  
  // Slow motion for phase changes
  isSlowMotion: boolean;
  slowMotionEndTime: number;
  timeScale: number;
  
  // Phase change display
  phaseChangeDisplay: string;
  phaseChangeDisplayEndTime: number;
  
  // Visual effects
  cameraShake: { x: number; y: number };
  canvasRotation: number;
  hueShift: number;
  screenFlash: number;
  warningFlash: boolean; // Flashing border for control flip warning
}

export interface PhaseConfig {
  gravityDrift: boolean;
  pipeOscillation: boolean;
  windForce: boolean;
  controlFlip: boolean;
  ghostPipes: boolean;
  speedDrift: boolean;
  visualGlitch: boolean;
  allUnstable: boolean;
}

export type GameAction =
  | { type: 'FLAP' }
  | { type: 'START' }
  | { type: 'RESTART' }
  | { type: 'TOGGLE_DEMO' }
  | { type: 'TOGGLE_SHOWCASE' }
  | { type: 'JUMP_TO_PHASE'; phase: number }
  | { type: 'TICK'; deltaTime: number };
