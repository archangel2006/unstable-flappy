/**
 * Game Configuration Constants
 * PATCHED: Changed wind to horizontal, increased oscillation visibility
 */

export const CANVAS = {
  WIDTH: 400,
  HEIGHT: 600,
} as const;

export const BIRD = {
  WIDTH: 34,
  HEIGHT: 24,
  X_POSITION: 80,
  INITIAL_Y: 250,
} as const;

export const PHYSICS = {
  GRAVITY: 0.375,
  FLAP_FORCE: -7.5,
  HEAVY_GRAVITY: 0.45,
  FLOATY_GRAVITY: 0.26,
  MAX_VELOCITY: 8,
  MIN_VELOCITY: -10,
} as const;

export const PIPES = {
  WIDTH: 52,
  GAP_SIZE: 200,
  MIN_GAP_SIZE: 140,
  GAP_SHRINK_PER_PHASE: 5,
  SPAWN_INTERVAL: 2000,
  SPEED: 2.0,
  MIN_GAP_Y: 100,
  MAX_GAP_Y_OFFSET: 100,
} as const;

export const PHASE = {
  DURATION: 15,
  TOTAL_PHASES: 9,
} as const;

export const WIND = {
  // HORIZONTAL WIND (left/right)
  HORIZONTAL_LEFT: -0.08,
  HORIZONTAL_RIGHT: 0.08,
  GUST_INTERVAL: 2500,
} as const;

export const EFFECTS = {
  CONTROL_FLIP_DURATION: 5000,
  CONTROL_FLIP_WARNING: 2000,
  GHOST_PIPE_BASE_PROBABILITY: 0.1,
  GHOST_PIPE_PHASE_MULTIPLIER: 0.1,
  DELAYED_COLLISION_MS: 300,
  OSCILLATION_SPEED: 0.015,
  OSCILLATION_AMPLITUDE: 20,
  SPEED_DRIFT_MAX: 0.15,
} as const;

export const SLOW_MOTION = {
  PHASE_CHANGE_DURATION: 1500,
  TIME_SCALE: 0.5,
} as const;

export const PHASE_EFFECTS = {
  GRAVITY_DRIFT_CYCLE_TIME: 4,
  GRAVITY_LOW_MULTIPLIER: 0.65,
  GRAVITY_HIGH_MULTIPLIER: 1.45,
  GRAVITY_WOBBLE_INTENSITY: 3,
  // Oscillation: Minimum 40px amplitude for visibility
  OSCILLATION_AMPLITUDE: 50,
  OSCILLATION_SPEED: 0.025,
} as const;

export const COLORS = {
  BACKGROUND: '#0d1117',
  GROUND: '#1a2332',
  BIRD: '#00ff88',
  BIRD_GLOW: 'rgba(0, 255, 136, 0.4)',
  PIPE: '#00ccff',
  PIPE_GLOW: 'rgba(0, 204, 255, 0.3)',
  GHOST_PIPE: 'rgba(0, 204, 255, 0.4)',
  GROUND_LINE: '#00ff88',
} as const;
