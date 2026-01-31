/**
 * Bird Physics Module
 * Handles bird movement, gravity, and flapping mechanics
 */

import { Bird } from './Types';
import { PHYSICS, CANVAS, BIRD } from './Config';

/**
 * Creates a new bird at the starting position
 */
export function createBird(): Bird {
  return {
    x: BIRD.X_POSITION,
    y: BIRD.INITIAL_Y,
    velocityY: 0,
    width: BIRD.WIDTH,
    height: BIRD.HEIGHT,
  };
}

/**
 * Updates bird physics based on gravity and velocity
 * @param bird - Current bird state
 * @param gravity - Current gravity value (can change per phase)
 * @param windForce - Current wind force
 * @returns Updated bird state
 */
export function updateBird(
  bird: Bird,
  gravity: number,
  windForce: number
): Bird {
  // Apply gravity
  let newVelocity = bird.velocityY + gravity;
  
  // Apply wind force
  newVelocity += windForce;
  
  // Clamp velocity to prevent extreme speeds
  newVelocity = Math.max(
    PHYSICS.MIN_VELOCITY,
    Math.min(PHYSICS.MAX_VELOCITY, newVelocity)
  );
  
  // Update position
  let newY = bird.y + newVelocity;
  
  // Clamp to screen bounds (top)
  if (newY < 0) {
    newY = 0;
    newVelocity = 0;
  }
  
  return {
    ...bird,
    y: newY,
    velocityY: newVelocity,
  };
}

/**
 * Applies flap force to the bird
 * @param bird - Current bird state
 * @param isControlFlipped - Whether controls are inverted
 * @returns Updated bird state with flap applied
 */
export function flapBird(bird: Bird, isControlFlipped: boolean): Bird {
  // When control is flipped, flap pushes DOWN instead of UP
  const force = isControlFlipped ? -PHYSICS.FLAP_FORCE : PHYSICS.FLAP_FORCE;
  
  return {
    ...bird,
    velocityY: force,
  };
}

/**
 * Checks if bird has hit the ground
 */
export function isGroundCollision(bird: Bird): boolean {
  return bird.y + bird.height >= CANVAS.HEIGHT - 50; // Ground is 50px tall
}

/**
 * Checks if bird is out of bounds (top of screen)
 */
export function isOutOfBounds(bird: Bird): boolean {
  return bird.y < 0;
}
