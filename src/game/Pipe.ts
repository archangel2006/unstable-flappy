/**
 * Pipe Module
 * Handles pipe creation, movement, and mutation
 * 
 * PATCHED: Added scored flag, enhanced oscillation visibility
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
  // Calculate gap size (shrinks with phase, but more gently)
  const gapReduction = Math.max(0, phase - 2) * PIPES.GAP_SHRINK_PER_PHASE;
  let gapSize = Math.max(PIPES.MIN_GAP_SIZE, PIPES.GAP_SIZE - gapReduction);
  
  // Apply gap multiplier from mode config first
  gapSize = gapSize * modeConfig.pipeGapMultiplier;
  
  // Then apply additional multiplier (from adaptive assist)
  gapSize = gapSize * gapMultiplier;
  
  // Random gap Y position (center of gap)
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
    scored: false, // ADDED: Track if scored
    spawnTime: Date.now(),
    hasDelayedCollision,
  };
}

/**
 * Updates pipe position and oscillation
 * ENHANCED: More visible oscillation in Phase 3
 */
export function updatePipe(
  pipe: Pipe,
  speed: number,
  phase: number,
  enableOscillation: boolean,
  gameTime: number,
  modeConfig: ModeConfig
): Pipe {
  // Move pipe left
  const newX = pipe.x - speed;
  
  // Calculate oscillation if enabled
  let oscillationOffset = 0;
  if (enableOscillation) {
    // Enhanced amplitude for Phase 3 visibility
    const baseAmplitude = PHASE_EFFECTS.OSCILLATION_AMPLITUDE;
    const modeMultiplier = modeConfig.oscillationAmplitudeMultiplier;
    
    // Phase 3: Full visible oscillation
    // Later phases: Even more intense
    let phaseMultiplier = 1;
    if (phase >= 9) {
      phaseMultiplier = 1.3;
    }
    
    const oscillationSpeed = PHASE_EFFECTS.OSCILLATION_SPEED * (1 + Math.min(phase - 3, 3) * 0.1);
    oscillationOffset = Math.sin(gameTime * oscillationSpeed + pipe.oscillationSeed) 
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
 * FIXED: Uses pipe center and scored flag
 */
export function checkAndScorePipe(pipe: Pipe, birdX: number): { scored: boolean; pipe: Pipe } {
  const pipeCenterX = pipe.x + PIPES.WIDTH / 2;
  
  // Bird has passed center and not yet scored
  if (!pipe.scored && birdX > pipeCenterX) {
    console.log(`[SCORE] Pipe scored! Bird X: ${birdX.toFixed(0)}, Pipe center: ${pipeCenterX.toFixed(0)}`);
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
