/**
 * Phase Manager Module
 * Controls which game mechanics are active based on current phase
 * 
 * Phase Schedule:
 * Phase 1 — Normal
 * Phase 2 — Gravity drift
 * Phase 3 — Pipe oscillation
 * Phase 4 — Wind force
 * Phase 5 — Control flip event
 * Phase 6 — Ghost pipes
 * Phase 7 — Speed drift
 * Phase 8 — Visual glitch effects
 * Phase 9 — All combined unstable mode
 */

import { PhaseConfig, GameState } from './Types';
import { PHYSICS, WIND, PIPES, EFFECTS, PHASE } from './Config';

/**
 * Gets the current phase based on time alive
 */
export function getCurrentPhase(timeAlive: number): number {
  return Math.floor(timeAlive / PHASE.DURATION) + 1;
}

/**
 * Gets the phase configuration (which features are active)
 */
export function getPhaseConfig(phase: number): PhaseConfig {
  const isAllUnstable = phase >= 9;
  
  return {
    gravityDrift: phase >= 2 || isAllUnstable,
    pipeOscillation: phase >= 3 || isAllUnstable,
    windForce: phase >= 4 || isAllUnstable,
    controlFlip: phase >= 5 || isAllUnstable,
    ghostPipes: phase >= 6 || isAllUnstable,
    speedDrift: phase >= 7 || isAllUnstable,
    visualGlitch: phase >= 8 || isAllUnstable,
    allUnstable: isAllUnstable,
  };
}

/**
 * Calculates gravity based on phase and time
 */
export function calculateGravity(
  phase: number,
  timeAlive: number,
  config: PhaseConfig
): number {
  if (!config.gravityDrift) {
    return PHYSICS.GRAVITY;
  }
  
  // Phase 2: Normal
  // Phase 3: Heavy gravity
  // Phase 4: Floaty gravity
  // Phase 5+: Random gravity every 5 seconds
  
  if (phase === 2) {
    return PHYSICS.GRAVITY;
  } else if (phase === 3) {
    return PHYSICS.HEAVY_GRAVITY;
  } else if (phase === 4) {
    return PHYSICS.FLOATY_GRAVITY;
  } else {
    // Phase 5+: Cycle through gravity values every 5 seconds
    const cycle = Math.floor(timeAlive / 5) % 3;
    switch (cycle) {
      case 0: return PHYSICS.GRAVITY;
      case 1: return PHYSICS.HEAVY_GRAVITY;
      case 2: return PHYSICS.FLOATY_GRAVITY;
      default: return PHYSICS.GRAVITY;
    }
  }
}

/**
 * Calculates wind force based on phase and time
 */
export function calculateWindForce(
  phase: number,
  timeAlive: number,
  config: PhaseConfig
): number {
  if (!config.windForce) {
    return 0;
  }
  
  // Alternate between upward and downward wind every gust interval
  const gustCycle = Math.floor((timeAlive * 1000) / WIND.GUST_INTERVAL) % 4;
  
  switch (gustCycle) {
    case 0: return WIND.UPWARD;
    case 1: return 0;
    case 2: return WIND.DOWNWARD;
    case 3: return 0;
    default: return 0;
  }
}

/**
 * Calculates pipe speed with drift effect
 */
export function calculatePipeSpeed(
  phase: number,
  timeAlive: number,
  config: PhaseConfig
): number {
  if (!config.speedDrift) {
    return PIPES.SPEED;
  }
  
  // Speed oscillates: increases, suddenly drops, increases again
  const cycle = timeAlive % 10; // 10-second cycle
  
  if (cycle < 4) {
    // Gradual increase
    return PIPES.SPEED + (cycle * 0.3);
  } else if (cycle < 5) {
    // Sudden drop
    return PIPES.SPEED * 0.6;
  } else {
    // Gradual increase again
    return PIPES.SPEED + ((cycle - 5) * 0.25);
  }
}

/**
 * Determines if control flip should trigger
 */
export function shouldTriggerControlFlip(
  state: GameState,
  config: PhaseConfig
): boolean {
  if (!config.controlFlip) return false;
  if (state.isControlFlipped) return false;
  
  // Trigger at the start of phase 5, and then randomly every 20 seconds
  const phaseTime = state.timeAlive % PHASE.DURATION;
  
  // Trigger at phase start (within first second)
  if (state.phase === 5 && phaseTime < 1) {
    return true;
  }
  
  // Random trigger every ~20 seconds in later phases
  if (state.phase >= 5 && Math.random() < 0.001) {
    return true;
  }
  
  return false;
}

/**
 * Calculates visual effects intensity
 */
export function calculateVisualEffects(
  phase: number,
  timeAlive: number,
  config: PhaseConfig
): { rotation: number; hueShift: number } {
  if (!config.visualGlitch) {
    return { rotation: 0, hueShift: 0 };
  }
  
  // Slight canvas rotation (±2 degrees)
  const rotation = Math.sin(timeAlive * 2) * 2;
  
  // Hue shift cycling
  const hueShift = (timeAlive * 10) % 360;
  
  return { rotation, hueShift };
}

/**
 * Gets a list of currently active effects for display
 */
export function getActiveEffects(
  state: GameState,
  config: PhaseConfig
): string[] {
  const effects: string[] = [];
  
  if (config.gravityDrift) effects.push('GRAVITY DRIFT');
  if (config.pipeOscillation) effects.push('PIPE OSCILLATION');
  if (config.windForce) effects.push('WIND FORCE');
  if (state.isControlFlipped) effects.push('⚠ CONTROL INVERTED');
  if (config.ghostPipes) effects.push('GHOST PIPES');
  if (config.speedDrift) effects.push('SPEED DRIFT');
  if (config.visualGlitch) effects.push('VISUAL GLITCH');
  if (config.allUnstable) effects.push('⚡ ALL UNSTABLE');
  
  return effects;
}
