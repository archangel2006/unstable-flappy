/**
 * Game Type Definitions
 * PATCHED: Added ModeConfig, UIState, and updated GameState for proper sync
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
  scored: boolean; // ADDED: Track if scored
  // For delayed collision (trust collapse feature)
  spawnTime: number;
  hasDelayedCollision: boolean;
}

export interface AdaptiveAssist {
  isActive: boolean;
  manuallyToggled: boolean; // ADDED: Track if user toggled
  consecutiveEarlyDeaths: number;
  lastDeathPhase: number;
  gapMultiplier: number;
  gravityMultiplier: number;
  speedMultiplier: number;
}

/**
 * Mode Configuration - scales all parameters
 */
export interface ModeConfig {
  pipeGapMultiplier: number;
  pipeSpawnMultiplier: number;
  pipeSpeedMultiplier: number;
  gravityMultiplier: number;
  windForceMultiplier: number;
  oscillationAmplitudeMultiplier: number;
  controlFlipDurationMultiplier: number;
  ghostPipeOpacity: number;
  collisionForgivenessMs: number;
}

/**
 * UI State - synced from game state every 100ms
 */
export interface UIState {
  score: number;
  currentPhase: number;
  timeAlive: number;
  gravity: number;
  windForce: number;
  pipeSpeed: number;
  activeEffects: string[];
  mode: 'CHAOS' | 'DEMO';
  adaptiveAssistActive: boolean;
  isSlowMotion: boolean;
  isControlFlipped: boolean;
  controlFlipWarning: boolean;
  phaseChangeDisplay: string;
  gravityWobble: number; // For visual wobble effect
}

export type GameMode = 'CHAOS' | 'DEMO';

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
  
  // Game mode (CHAOS or DEMO)
  gameMode: GameMode;
  modeConfig: ModeConfig;
  
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
  gravityWobble: number; // Screen wobble when gravity changes
  lastGravityChange: number; // Timestamp of last gravity change
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
  | { type: 'TOGGLE_MODE' }
  | { type: 'TOGGLE_ASSIST' }
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'JUMP_TO_PHASE'; phase: number }
  | { type: 'TICK'; deltaTime: number };
