/**
 * Pipe Module
 * Handles pipe creation, movement, and oscillation
 * 
 * Oscillation: 60px amplitude, ~4 second cycle, per-pipe phase offset
 */

import { Pipe, ModeConfig } from './Types';
import { PIPES, CANVAS, EFFECTS, PHASE_EFFECTS } from './Config';

/**
 * Creates a new pipe with randomized gap position
 */
export function createPipe(
  phase: number,
  isGhost: boolean = false,
  hasDelayedCollision: boolean = false,
  gapMultiplier: number = 1,
  modeConfig: ModeConfig
): Pipe {
  const gapReduction = Math.max(0, phase - 2) * PIPES.GAP_SHRINK_PER_PHASE;
  let gapSize = Math.max(PIPES.MIN_GAP_SIZE, PIPES.GAP_SIZE - gapReduction);
  
  gapSize = gapSize * modeConfig.pipeGapMultiplier * gapMultiplier;
  
  const minY = PIPES.MIN_GAP_Y + gapSize / 2;
  const maxY = CANVAS.HEIGHT - 50 - PIPES.MIN_GAP_Y - gapSize / 2;
  const gapY = minY + Math.random() * (maxY - minY);
  
  return {
    x: CANVAS.WIDTH,
    gapY,
    gapSize,
    isGhost,
    oscillationOffset: 0,
    oscillationSeed: Math.random() * Math.PI * 2,
    passed: false,
    scored: false,
    spawnTime: Date.now(),
    hasDelayedCollision,
  };
}

/**
 * Updates pipe position and oscillation
 * 
 * Oscillation uses a smooth sine wave:
 * - Base amplitude: 60px (clearly visible)
 * - Frequency: ~4 second full cycle (up-down-up)
 * - Each pipe has a phase offset so pipes don't move in sync
 */
export function updatePipe(
  pipe: Pipe,
  speed: number,
  phase: number,
  enableOscillation: boolean,
  gameTime: number,
  modeConfig: ModeConfig
): Pipe {
  const newX = pipe.x - speed;
  
  let oscillationOffset = 0;
  if (enableOscillation) {
    // Base amplitude: 60px (clearly visible movement)
    const baseAmplitude = PHASE_EFFECTS.OSCILLATION_AMPLITUDE;
    const modeMultiplier = modeConfig.oscillationAmplitudeMultiplier;
    
    // Phase multiplier: slightly more intense in later phases
    let phaseMultiplier = 1;
    if (phase >= 9) {
      phaseMultiplier = 1.2;
    } else if (phase >= 7) {
      phaseMultiplier = 1.1;
    }
    
    // Oscillation frequency: 1.5 rad/s = ~4.2 second full cycle
    // Using gameTime (in seconds) for smooth sine wave
    const frequency = PHASE_EFFECTS.OSCILLATION_SPEED;
    
    // Calculate offset: sin(time * frequency + pipePhaseOffset) * amplitude
    // oscillationSeed provides per-pipe phase variation (0 to 2π)
    oscillationOffset = Math.sin(gameTime * frequency + pipe.oscillationSeed) 
      * baseAmplitude * modeMultiplier * phaseMultiplier;
  }
  
  return {
    ...pipe,
    x: newX,
    oscillationOffset,
  };
}

/**
 * Checks if pipe is off screen (should be removed)
 */
export function isPipeOffScreen(pipe: Pipe): boolean {
  return pipe.x + PIPES.WIDTH < 0;
}

/**
 * Checks if bird has passed the pipe center (for scoring)
 */
export function checkAndScorePipe(pipe: Pipe, birdX: number): { scored: boolean; pipe: Pipe } {
  const pipeCenterX = pipe.x + PIPES.WIDTH / 2;
  
  if (!pipe.scored && birdX > pipeCenterX) {
    return {
      scored: true,
      pipe: { ...pipe, scored: true, passed: true }
    };
  }
  
  return { scored: false, pipe };
}

/**
 * Determines if a new pipe should be a ghost pipe based on phase
 */
export function shouldBeGhostPipe(phase: number): boolean {
  if (phase < 6) return false;
  
  const probability = EFFECTS.GHOST_PIPE_BASE_PROBABILITY + 
    (phase - 6) * EFFECTS.GHOST_PIPE_PHASE_MULTIPLIER;
  return Math.random() < probability;
}

/**
 * Determines if pipe should have delayed collision (trust collapse)
 */
export function shouldHaveDelayedCollision(phase: number): boolean {
  if (phase < 8) return false;
  return Math.random() < 0.25;
}

/**
 * Checks if delayed collision is now active for a pipe
 */
export function isDelayedCollisionActive(pipe: Pipe, forgivenessMs: number = 0): boolean {
  if (!pipe.hasDelayedCollision) return true;
  return Date.now() - pipe.spawnTime > EFFECTS.DELAYED_COLLISION_MS + forgivenessMs;
}
