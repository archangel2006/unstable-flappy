/**
 * Game Type Definitions
 * PATCHED: Removed AdaptiveAssist, added horizontal wind, control flip hold state
 */

export interface Bird {
  x: number;
  y: number;
  velocityY: number;
  velocityX: number; // ADDED: For horizontal wind
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
  scored: boolean;
  spawnTime: number;
  hasDelayedCollision: boolean;
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
  controlFlipForceMultiplier: number; // Dampens flip force in Demo Mode
  ghostPipeOpacity: number;
  collisionForgivenessMs: number;
}

/**
 * UI State - synced from game state every 100ms
 */
export interface UIState {
  score: number;
  currentPhase: number;
  gravity: number;
  windForce: number;
  pipeSpeed: number;
  activeEffects: string[];
  mode: 'CHAOS' | 'DEMO';
  isSlowMotion: boolean;
  isControlFlipped: boolean;
  controlFlipWarning: boolean;
  phaseChangeDisplay: string;
  gravityWobble: number;
  isSystemOverload: boolean;
}

export type GameMode = 'CHAOS' | 'DEMO';

export interface GameState {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  timeAlive: number; // seconds (internal use only)
  phase: number;
  isPlaying: boolean;
  isGameOver: boolean;
  hasStarted: boolean;
  
  // Current physics values (can mutate)
  currentGravity: number;
  currentWindForce: number; // Now horizontal
  currentPipeSpeed: number;
  
  // Control flip state
  isControlFlipped: boolean;
  controlFlipEndTime: number;
  controlFlipWarning: boolean;
  controlFlipWarningEndTime: number;
  isHoldingInput: boolean; // ADDED: Track if player is holding space/click
  
  // Game mode (CHAOS or DEMO)
  gameMode: GameMode;
  modeConfig: ModeConfig;
  
  // Slow motion for phase changes
  isSlowMotion: boolean;
  slowMotionEndTime: number;
  timeScale: number;
  
  // Phase change display
  phaseChangeDisplay: string;
  phaseChangeDisplayEndTime: number;
  
  // System Overload freeze event
  isSystemOverload: boolean;
  systemOverloadEndTime: number;
  
  // Visual effects
  cameraShake: { x: number; y: number };
  canvasRotation: number;
  hueShift: number;
  screenFlash: number;
  warningFlash: boolean;
  gravityWobble: number;
  lastGravityChange: number;
  desaturation: number; // 0-1 for grayscale effect
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
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'JUMP_TO_PHASE'; phase: number }
  | { type: 'TICK'; deltaTime: number };
