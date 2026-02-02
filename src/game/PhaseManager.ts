/**
 * Phase Manager Module
 * Controls which game mechanics are active based on current phase
 * 
 * PATCHED: Wind is now HORIZONTAL, cleaned up phase titles
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
    
    return { gravity: baseGravity * multiplier, changed };
  } else if (phase === 4) {
    return { gravity: PHYSICS.FLOATY_GRAVITY * modeConfig.gravityMultiplier, changed: false };
  } else {
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
 * Calculates HORIZONTAL wind force based on phase and time
 * Wind now pushes bird LEFT or RIGHT
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
  
  // Alternate between left and right wind
  const gustCycle = Math.floor((timeAlive * 1000) / WIND.GUST_INTERVAL) % 4;
  
  // Phase 4: Gentle wind, later phases: stronger
  const intensityMultiplier = phase === 4 ? 0.5 : Math.min(1 + (phase - 4) * 0.15, 2);
  const modeMultiplier = modeConfig.windForceMultiplier;
  
  // Horizontal wind: negative = left, positive = right
  switch (gustCycle) {
    case 0: return WIND.HORIZONTAL_LEFT * intensityMultiplier * modeMultiplier;
    case 1: return 0;
    case 2: return WIND.HORIZONTAL_RIGHT * intensityMultiplier * modeMultiplier;
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
  
  const cycle = timeAlive % 10;
  const maxDrift = baseSpeed * EFFECTS.SPEED_DRIFT_MAX;
  
  if (cycle < 4) {
    return baseSpeed + (cycle / 4) * maxDrift;
  } else if (cycle < 5) {
    return baseSpeed - maxDrift;
  } else {
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
  
  const phaseTime = state.timeAlive % PHASE.DURATION;
  
  // Trigger at phase start
  if (state.phase === 5 && phaseTime < 1) {
    return true;
  }
  
  // Random trigger in later phases
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
  
  const rotation = Math.sin(timeAlive * 2) * 2;
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
  if (state.isControlFlipped) effects.push('⚠ CONTROLS FLIPPED');
  if (config.ghostPipes) effects.push('GHOST PIPES');
  if (config.speedDrift) effects.push('SPEED DRIFT');
  if (config.visualGlitch) effects.push('VISUAL GLITCH');
  if (config.allUnstable) effects.push('⚡ TOTAL CHAOS');
  
  return effects;
}

/**
 * Gets the phase title for display (clean format without em dash)
 * Phase 10 is the final announced phase
 */
export function getPhaseTitle(phase: number): { phase: string; effect: string } | null {
  // No display for phases beyond 10
  if (phase > 10) {
    return null;
  }
  
  const titles: { [key: number]: string } = {
    1: 'CLASSIC',
    2: 'GRAVITY DRIFT',
    3: 'OSCILLATION',
    4: 'WIND FORCE',
    5: 'CONTROL CHAOS',
    6: 'GHOST PIPES',
    7: 'SPEED DRIFT',
    8: 'VISUAL GLITCH',
    9: 'TOTAL CHAOS',
    10: 'BEYOND REPAIR',
  };
  
  return {
    phase: `PHASE ${phase}`,
    effect: titles[phase] || 'BEYOND',
  };
}
