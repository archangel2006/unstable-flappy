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
  
  // Demo mode
  isDemoMode: boolean;
  
  // Visual effects
  cameraShake: { x: number; y: number };
  canvasRotation: number;
  hueShift: number;
  screenFlash: number;
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
  | { type: 'TICK'; deltaTime: number };
