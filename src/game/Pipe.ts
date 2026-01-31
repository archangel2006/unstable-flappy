/**
 * Pipe Module
 * Handles pipe creation, movement, and mutation
 * 
 * REBALANCED: Larger gaps, gentler oscillation in early phases
 */

import { Pipe } from './Types';
import { PIPES, CANVAS, EFFECTS } from './Config';

/**
 * Creates a new pipe with randomized gap position
 */
export function createPipe(
  phase: number,
  isGhost: boolean = false,
  hasDelayedCollision: boolean = false,
  gapMultiplier: number = 1
): Pipe {
  // Calculate gap size (shrinks with phase, but more gently)
  const gapReduction = Math.max(0, phase - 2) * PIPES.GAP_SHRINK_PER_PHASE;
  let gapSize = Math.max(PIPES.MIN_GAP_SIZE, PIPES.GAP_SIZE - gapReduction);
  
  // Apply gap multiplier (from adaptive assist or showcase mode)
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
    oscillationSeed: Math.random() * Math.PI * 2, // Random starting phase
    passed: false,
    spawnTime: Date.now(),
    hasDelayedCollision,
  };
}

/**
 * Updates pipe position and oscillation
 * REBALANCED: Very mild oscillation in phase 3
 */
export function updatePipe(
  pipe: Pipe,
  speed: number,
  phase: number,
  enableOscillation: boolean,
  gameTime: number
): Pipe {
  // Move pipe left
  const newX = pipe.x - speed;
  
  // Calculate oscillation if enabled
  let oscillationOffset = 0;
  if (enableOscillation) {
    // Phase 3: Very mild oscillation
    // Later phases: Slightly more, but capped at 20px amplitude
    let amplitudeMultiplier = 1;
    if (phase === 3) {
      amplitudeMultiplier = 0.3; // Only 30% of normal amplitude
    } else if (phase <= 5) {
      amplitudeMultiplier = 0.6;
    }
    
    const oscillationSpeed = EFFECTS.OSCILLATION_SPEED * (1 + Math.min(phase - 3, 3) * 0.15);
    oscillationOffset = Math.sin(gameTime * oscillationSpeed + pipe.oscillationSeed) 
      * EFFECTS.OSCILLATION_AMPLITUDE * amplitudeMultiplier;
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
 * Checks if bird has passed the pipe (for scoring)
 */
export function hasBirdPassedPipe(pipe: Pipe, birdX: number): boolean {
  return !pipe.passed && pipe.x + PIPES.WIDTH < birdX;
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
  return Math.random() < 0.25; // 25% chance in phase 8+ (reduced from 30%)
}

/**
 * Checks if delayed collision is now active for a pipe
 */
export function isDelayedCollisionActive(pipe: Pipe): boolean {
  if (!pipe.hasDelayedCollision) return true; // Normal pipe, collision always active
  return Date.now() - pipe.spawnTime > EFFECTS.DELAYED_COLLISION_MS;
}
