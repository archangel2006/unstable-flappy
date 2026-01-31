/**
 * Pipe Module
 * Handles pipe creation, movement, and mutation
 */

import { Pipe } from './Types';
import { PIPES, CANVAS, EFFECTS } from './Config';

/**
 * Creates a new pipe with randomized gap position
 */
export function createPipe(
  phase: number,
  isGhost: boolean = false,
  hasDelayedCollision: boolean = false
): Pipe {
  // Calculate gap size (shrinks with phase)
  const gapReduction = Math.min(phase, 5) * PIPES.GAP_SHRINK_PER_PHASE;
  const gapSize = Math.max(PIPES.MIN_GAP_SIZE, PIPES.GAP_SIZE - gapReduction);
  
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
    // Oscillation speed increases with phase
    const oscillationSpeed = EFFECTS.OSCILLATION_SPEED * (1 + phase * 0.2);
    oscillationOffset = Math.sin(gameTime * oscillationSpeed + pipe.oscillationSeed) 
      * EFFECTS.OSCILLATION_AMPLITUDE;
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
  return Math.random() < 0.3; // 30% chance in phase 8+
}

/**
 * Checks if delayed collision is now active for a pipe
 */
export function isDelayedCollisionActive(pipe: Pipe): boolean {
  if (!pipe.hasDelayedCollision) return true; // Normal pipe, collision always active
  return Date.now() - pipe.spawnTime > EFFECTS.DELAYED_COLLISION_MS;
}
