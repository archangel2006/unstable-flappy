/**
 * Phase Manager Module
 * Controls which game mechanics are active based on current phase
 * 
 * PATCHED: Enhanced visibility for Phase 2-3 effects
 * 
 * Phase Schedule:
 * Phase 1-2 — Safe classic flappy (larger gaps, no instability)
 * Phase 3 — Very mild oscillation only
 * Phase 4 — Wind force (gentle)
 * Phase 5 — Control flip event (with warnings)
 * Phase 6 — Ghost pipes
 * Phase 7 — Speed drift (limited)
 * Phase 8 — Visual glitch effects
 * Phase 9 — All combined unstable mode
 */

import { PhaseConfig, GameState, ModeConfig } from './Types';
import { PHYSICS, WIND, PIPES, EFFECTS, PHASE, PHASE_EFFECTS } from './Config';

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
    // Phase 1 is completely safe - no instability features
    // Phase 2+ starts gravity drift
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
 * ENHANCED: More visible gravity drift in Phase 2
 */
export function calculateGravity(
  phase: number,
  timeAlive: number,
  config: PhaseConfig,
  modeConfig: ModeConfig
): { gravity: number; changed: boolean } {
  const baseGravity = PHYSICS.GRAVITY * modeConfig.gravityMultiplier;
  
  if (!config.gravityDrift) {
    return { gravity: baseGravity, changed: false };
  }
  
  // Phase 2-3: Clear alternating gravity
  if (phase === 2 || phase === 3) {
    const cycleTime = PHASE_EFFECTS.GRAVITY_DRIFT_CYCLE_TIME;
    const cyclePhase = Math.floor(timeAlive / cycleTime) % 2;
    const prevCyclePhase = Math.floor((timeAlive - 0.016) / cycleTime) % 2;
    const changed = cyclePhase !== prevCyclePhase;
    
    const multiplier = cyclePhase === 0 
      ? PHASE_EFFECTS.GRAVITY_LOW_MULTIPLIER 
      : PHASE_EFFECTS.GRAVITY_HIGH_MULTIPLIER;
    
    console.log(`[GRAVITY] Phase ${phase}: ${multiplier.toFixed(2)}x (${cyclePhase === 0 ? 'LOW' : 'HIGH'})`);
    
    return { gravity: baseGravity * multiplier, changed };
  } else if (phase === 4) {
    // Slightly floaty
    return { gravity: PHYSICS.FLOATY_GRAVITY * modeConfig.gravityMultiplier, changed: false };
  } else {
    // Phase 5+: Cycle through gravity values every 5 seconds
    const cycle = Math.floor(timeAlive / 5) % 3;
    const prevCycle = Math.floor((timeAlive - 0.016) / 5) % 3;
    const changed = cycle !== prevCycle;
    
    let gravity: number;
    switch (cycle) {
      case 0: gravity = PHYSICS.GRAVITY; break;
      case 1: gravity = PHYSICS.HEAVY_GRAVITY; break;
      case 2: gravity = PHYSICS.FLOATY_GRAVITY; break;
      default: gravity = PHYSICS.GRAVITY;
    }
    
    return { gravity: gravity * modeConfig.gravityMultiplier, changed };
  }
}

/**
 * Calculates wind force based on phase and time
 */
export function calculateWindForce(
  phase: number,
  timeAlive: number,
  config: PhaseConfig,
  modeConfig: ModeConfig
): number {
  if (!config.windForce) {
    return 0;
  }
  
  // Alternate between upward and downward wind every gust interval
  const gustCycle = Math.floor((timeAlive * 1000) / WIND.GUST_INTERVAL) % 4;
  
  // Gentler wind in early phases
  const intensityMultiplier = phase === 4 ? 0.5 : 1;
  const modeMultiplier = modeConfig.windForceMultiplier;
  
  switch (gustCycle) {
    case 0: return WIND.UPWARD * intensityMultiplier * modeMultiplier;
    case 1: return 0;
    case 2: return WIND.DOWNWARD * intensityMultiplier * modeMultiplier;
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
  config: PhaseConfig,
  modeConfig: ModeConfig
): number {
  const baseSpeed = PIPES.SPEED * modeConfig.pipeSpeedMultiplier;
  
  if (!config.speedDrift) {
    return baseSpeed;
  }
  
  // Speed oscillates with max ±15% variation
  const cycle = timeAlive % 10; // 10-second cycle
  const maxDrift = baseSpeed * EFFECTS.SPEED_DRIFT_MAX;
  
  if (cycle < 4) {
    // Gradual increase up to +15%
    return baseSpeed + (cycle / 4) * maxDrift;
  } else if (cycle < 5) {
    // Sudden drop to -15%
    return baseSpeed - maxDrift;
  } else {
    // Gradual recovery
    return baseSpeed - maxDrift + ((cycle - 5) / 5) * maxDrift * 2;
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
 * Gets control flip duration based on mode
 */
export function getControlFlipDuration(modeConfig: ModeConfig): number {
  return EFFECTS.CONTROL_FLIP_DURATION * modeConfig.controlFlipDurationMultiplier;
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
  
  if (config.gravityDrift && state.phase >= 2) effects.push('GRAVITY DRIFT');
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
    case 1: return 'PHASE 1 — CLASSIC';
    case 2: return 'PHASE 2 — GRAVITY DRIFT';
    case 3: return 'PHASE 3 — OSCILLATION';
    case 4: return 'PHASE 4 — WIND FORCE';
    case 5: return 'PHASE 5 — CONTROL CHAOS';
    case 6: return 'PHASE 6 — GHOST PIPES';
    case 7: return 'PHASE 7 — SPEED DRIFT';
    case 8: return 'PHASE 8 — VISUAL GLITCH';
    case 9: return 'PHASE 9 — TOTAL CHAOS';
    default: return `PHASE ${phase} — BEYOND`;
  }
}
