/**
 * Collision Detection Module
 * Handles all collision checks between game entities
 * 
 * PATCHED: Added collision forgiveness for Demo mode
 */

import { Bird, Pipe } from './Types';
import { PIPES, CANVAS } from './Config';
import { isDelayedCollisionActive } from './Pipe';

/**
 * Checks if bird collides with a specific pipe
 * Takes into account ghost pipes and delayed collision
 */
export function checkPipeCollision(bird: Bird, pipe: Pipe, forgivenessMs: number = 0): boolean {
  // Ghost pipes don't have collision
  if (pipe.isGhost) {
    return false;
  }
  
  // Check if delayed collision is active (with forgiveness)
  if (!isDelayedCollisionActive(pipe, forgivenessMs)) {
    return false;
  }
  
  // Get pipe bounds
  const pipeLeft = pipe.x;
  const pipeRight = pipe.x + PIPES.WIDTH;
  
  // Apply oscillation offset to gap position
  const effectiveGapY = pipe.gapY + pipe.oscillationOffset;
  const gapTop = effectiveGapY - pipe.gapSize / 2;
  const gapBottom = effectiveGapY + pipe.gapSize / 2;
  
  // Get bird bounds
  const birdLeft = bird.x;
  const birdRight = bird.x + bird.width;
  const birdTop = bird.y;
  const birdBottom = bird.y + bird.height;
  
  // Check horizontal overlap
  const horizontalOverlap = birdRight > pipeLeft && birdLeft < pipeRight;
  
  if (!horizontalOverlap) {
    return false;
  }
  
  // Check if bird is within the gap (no collision)
  const withinGap = birdTop > gapTop && birdBottom < gapBottom;
  
  // Collision if horizontal overlap AND not within gap
  return !withinGap;
}

/**
 * Checks if bird collides with ground
 */
export function checkGroundCollision(bird: Bird): boolean {
  const groundY = CANVAS.HEIGHT - 50;
  return bird.y + bird.height >= groundY;
}

/**
 * Checks if bird hits the ceiling
 */
export function checkCeilingCollision(bird: Bird): boolean {
  return bird.y <= 0;
}

/**
 * Checks collision against all pipes
 */
export function checkAllPipeCollisions(bird: Bird, pipes: Pipe[], forgivenessMs: number = 0): boolean {
  return pipes.some(pipe => checkPipeCollision(bird, pipe, forgivenessMs));
}

/**
 * Performs all collision checks and returns collision result
 */
export function checkAllCollisions(
  bird: Bird, 
  pipes: Pipe[],
  forgivenessMs: number = 0
): { hit: boolean; type: 'none' | 'pipe' | 'ground' | 'ceiling' } {
  // Check ground first (most common)
  if (checkGroundCollision(bird)) {
    return { hit: true, type: 'ground' };
  }
  
  // Check pipes (with forgiveness)
  if (checkAllPipeCollisions(bird, pipes, forgivenessMs)) {
    return { hit: true, type: 'pipe' };
  }
  
  // Ceiling collision doesn't cause game over
  
  return { hit: false, type: 'none' };
}
