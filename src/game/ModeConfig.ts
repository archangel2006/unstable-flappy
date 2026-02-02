/**
 * Mode Configuration Module
 * Defines CHAOS and DEMO mode scaling values
 * 
 * All game systems read from modeConfig instead of hardcoded constants
 */

import { ModeConfig, GameMode } from './Types';

/**
 * CHAOS MODE - Full difficulty, base values
 */
export const CHAOS_MODE_CONFIG: ModeConfig = {
  pipeGapMultiplier: 1.0,
  pipeSpawnMultiplier: 1.0,
  pipeSpeedMultiplier: 1.0,
  gravityMultiplier: 1.0,
  windForceMultiplier: 1.0,
  oscillationAmplitudeMultiplier: 1.0,
  controlFlipDurationMultiplier: 1.0,
  controlFlipForceMultiplier: 1.0, // Full flip force
  ghostPipeOpacity: 0.4,
  collisionForgivenessMs: 0,
};

/**
 * DEMO MODE - Easier spacing for showcase
 * Mechanics still active, only parameters scaled
 * Control flip is significantly dampened for recordability
 */
export const DEMO_MODE_CONFIG: ModeConfig = {
  pipeGapMultiplier: 1.6,
  pipeSpawnMultiplier: 1.25,
  pipeSpeedMultiplier: 0.7,
  gravityMultiplier: 0.8,
  windForceMultiplier: 0.6,
  oscillationAmplitudeMultiplier: 0.75,
  controlFlipDurationMultiplier: 0.3, // Much shorter flip (was 0.5)
  controlFlipForceMultiplier: 0.5,    // Dampened flip force (50% strength)
  ghostPipeOpacity: 0.3,
  collisionForgivenessMs: 120,
};

/**
 * Gets the mode configuration for the given mode
 */
export function getModeConfig(mode: GameMode): ModeConfig {
  return mode === 'CHAOS' ? CHAOS_MODE_CONFIG : DEMO_MODE_CONFIG;
}

/**
 * Logging helper
 */
export function logModeChange(mode: GameMode): void {
  console.log(`[MODE] Switched to ${mode} mode`);
  const config = getModeConfig(mode);
  console.log(`[MODE] Config:`, {
    gapMultiplier: config.pipeGapMultiplier,
    speedMultiplier: config.pipeSpeedMultiplier,
    gravityMultiplier: config.gravityMultiplier,
  });
}
