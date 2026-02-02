/**
 * Bird Physics Module
 * Handles bird movement, gravity, and flapping mechanics
 * 
 * PATCHED: Added horizontal wind support, fixed control flip logic
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
    velocityX: 0, // Horizontal velocity for wind
    width: BIRD.WIDTH,
    height: BIRD.HEIGHT,
  };
}

/**
 * Updates bird physics based on gravity and control state
 * 
 * Normal mode: gravity pulls down, flap pushes up
 * Control flip mode: HOLD input = forced down, RELEASE = floats up
 * 
 * @param bird - Current bird state
 * @param gravity - Current gravity value
 * @param horizontalWind - Horizontal wind force (left/right)
 * @param isControlFlipped - Whether controls are inverted
 * @param isHoldingInput - Whether player is holding space/click
 * @param flipForceMultiplier - Dampens flip force (1.0 = full, 0.5 = half strength)
 */
export function updateBird(
  bird: Bird,
  gravity: number,
  horizontalWind: number,
  isControlFlipped: boolean,
  isHoldingInput: boolean,
  flipForceMultiplier: number = 1.0
): Bird {
  let newVelocityY = bird.velocityY;
  
  if (isControlFlipped) {
    // CONTROL FLIP MODE:
    // Holding input = pulled DOWN (like gravity is stronger)
    // Not holding = floats UP (like anti-gravity)
    // Force is dampened by flipForceMultiplier in Demo Mode
    if (isHoldingInput) {
      // Holding: Strong downward pull (dampened in Demo Mode)
      newVelocityY += gravity * 2.5 * flipForceMultiplier;
    } else {
      // Released: Float upward (dampened in Demo Mode)
      newVelocityY -= gravity * 1.2 * flipForceMultiplier;
    }
    
    // In Demo Mode with low multiplier, add some normal gravity to stay playable
    if (flipForceMultiplier < 1.0) {
      newVelocityY += gravity * (1 - flipForceMultiplier) * 0.5;
    }
  } else {
    // NORMAL MODE: gravity always pulls down
    newVelocityY += gravity;
  }
  
  // Clamp velocity to prevent extreme speeds
  newVelocityY = Math.max(
    PHYSICS.MIN_VELOCITY,
    Math.min(PHYSICS.MAX_VELOCITY, newVelocityY)
  );
  
  // Update vertical position
  let newY = bird.y + newVelocityY;
  
  // Clamp to screen bounds (top)
  if (newY < 0) {
    newY = 0;
    newVelocityY = 0;
  }
  
  // Apply horizontal wind force
  let newVelocityX = bird.velocityX + horizontalWind;
  // Apply friction to horizontal movement
  newVelocityX *= 0.95;
  // Clamp horizontal velocity
  newVelocityX = Math.max(-3, Math.min(3, newVelocityX));
  
  // Update horizontal position
  let newX = bird.x + newVelocityX;
  // Keep bird on screen horizontally
  newX = Math.max(20, Math.min(CANVAS.WIDTH - bird.width - 20, newX));
  
  return {
    ...bird,
    x: newX,
    y: newY,
    velocityY: newVelocityY,
    velocityX: newVelocityX,
  };
}

/**
 * Applies flap force to the bird (only in normal mode)
 * In control flip mode, this is handled by updateBird based on hold state
 */
export function flapBird(bird: Bird, isControlFlipped: boolean): Bird {
  if (isControlFlipped) {
    // In control flip mode, flapping is handled by hold state in updateBird
    return bird;
  }
  
  // Normal mode: flap pushes up
  return {
    ...bird,
    velocityY: PHYSICS.FLAP_FORCE,
  };
}

/**
 * Checks if bird has hit the ground
 */
export function isGroundCollision(bird: Bird): boolean {
  return bird.y + bird.height >= CANVAS.HEIGHT - 50;
}

/**
 * Checks if bird is out of bounds (top of screen)
 */
export function isOutOfBounds(bird: Bird): boolean {
  return bird.y < 0;
}
