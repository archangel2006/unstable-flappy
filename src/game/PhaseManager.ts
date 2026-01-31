/**
 * Phase Manager Module
 * Controls which game mechanics are active based on current phase
 * 
 * REBALANCED Phase Schedule:
 * Phase 1-2 — Safe classic flappy (larger gaps, no instability)
 * Phase 3 — Very mild oscillation only
 * Phase 4 — Wind force (gentle)
 * Phase 5 — Control flip event (with warnings)
 * Phase 6 — Ghost pipes
 * Phase 7 — Speed drift (limited)
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
 * REBALANCED: Early phases are safe
 */
export function getPhaseConfig(phase: number): PhaseConfig {
  const isAllUnstable = phase >= 9;
  
  return {
    // Phase 1-2 are completely safe - no instability features
    gravityDrift: phase >= 3 || isAllUnstable,
    pipeOscillation: phase >= 3 || isAllUnstable, // Very mild in phase 3
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
 * REBALANCED: Gravity multiplier clamped between 0.7x and 1.2x
 */
export function calculateGravity(
  phase: number,
  timeAlive: number,
  config: PhaseConfig
): number {
  if (!config.gravityDrift) {
    return PHYSICS.GRAVITY;
  }
  
  // Phase 3: Mild variation
  if (phase === 3) {
    // Gentle oscillation between 0.9x and 1.1x
    const cycle = Math.sin(timeAlive * 0.5);
    return PHYSICS.GRAVITY * (1 + cycle * 0.1);
  } else if (phase === 4) {
    // Slightly floaty
    return PHYSICS.FLOATY_GRAVITY;
  } else {
    // Phase 5+: Cycle through gravity values every 5 seconds
    // But clamped between 0.7x and 1.2x
    const cycle = Math.floor(timeAlive / 5) % 3;
    switch (cycle) {
      case 0: return PHYSICS.GRAVITY;
      case 1: return PHYSICS.HEAVY_GRAVITY; // 1.2x
      case 2: return PHYSICS.FLOATY_GRAVITY; // 0.7x
      default: return PHYSICS.GRAVITY;
    }
  }
}

/**
 * Calculates wind force based on phase and time
 * REBALANCED: Max wind is 20% of gravity
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
  
  // Gentler wind in early phases
  const intensityMultiplier = phase === 4 ? 0.5 : 1;
  
  switch (gustCycle) {
    case 0: return WIND.UPWARD * intensityMultiplier;
    case 1: return 0;
    case 2: return WIND.DOWNWARD * intensityMultiplier;
    case 3: return 0;
    default: return 0;
  }
}

/**
 * Calculates pipe speed with drift effect
 * REBALANCED: Max ±15% variation
 */
export function calculatePipeSpeed(
  phase: number,
  timeAlive: number,
  config: PhaseConfig
): number {
  if (!config.speedDrift) {
    return PIPES.SPEED;
  }
  
  // Speed oscillates with max ±15% variation
  const cycle = timeAlive % 10; // 10-second cycle
  const maxDrift = PIPES.SPEED * EFFECTS.SPEED_DRIFT_MAX;
  
  if (cycle < 4) {
    // Gradual increase up to +15%
    return PIPES.SPEED + (cycle / 4) * maxDrift;
  } else if (cycle < 5) {
    // Sudden drop to -15%
    return PIPES.SPEED - maxDrift;
  } else {
    // Gradual recovery
    return PIPES.SPEED - maxDrift + ((cycle - 5) / 5) * maxDrift * 2;
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
  if (state.controlFlipWarning) return false;
  
  // Trigger at the start of phase 5, and then randomly every 25 seconds
  const phaseTime = state.timeAlive % PHASE.DURATION;
  
  // Trigger at phase start (within first second)
  if (state.phase === 5 && phaseTime < 1) {
    return true;
  }
  
  // Random trigger every ~25 seconds in later phases (less frequent)
  if (state.phase >= 5 && Math.random() < 0.0005) {
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
  
  if (config.gravityDrift && state.phase >= 3) effects.push('GRAVITY DRIFT');
  if (config.pipeOscillation && state.phase >= 3) effects.push('PIPE OSCILLATION');
  if (config.windForce) effects.push('WIND FORCE');
  if (state.isControlFlipped) effects.push('⚠ CONTROL INVERTED');
  if (config.ghostPipes) effects.push('GHOST PIPES');
  if (config.speedDrift) effects.push('SPEED DRIFT');
  if (config.visualGlitch) effects.push('VISUAL GLITCH');
  if (config.allUnstable) effects.push('⚡ ALL UNSTABLE');
  
  return effects;
}

/**
 * Gets the phase title for display during phase changes
 */
export function getPhaseTitle(phase: number): string {
  switch (phase) {
    case 1: return 'PHASE 1: CLASSIC';
    case 2: return 'PHASE 2: WARMING UP';
    case 3: return 'PHASE 3: OSCILLATION';
    case 4: return 'PHASE 4: WIND FORCE';
    case 5: return 'PHASE 5: CONTROL CHAOS';
    case 6: return 'PHASE 6: GHOST PIPES';
    case 7: return 'PHASE 7: SPEED DRIFT';
    case 8: return 'PHASE 8: VISUAL GLITCH';
    case 9: return 'PHASE 9: TOTAL CHAOS';
    default: return `PHASE ${phase}: BEYOND`;
  }
}
