/**
 * Game Configuration Constants
 * All physics, timing, and gameplay values are centralized here
 */

export const CANVAS = {
  WIDTH: 400,
  HEIGHT: 600,
} as const;

export const BIRD = {
  WIDTH: 34,
  HEIGHT: 24,
  X_POSITION: 80, // Fixed X position
  INITIAL_Y: 250,
} as const;

export const PHYSICS = {
  // Normal gravity and flap values
  GRAVITY: 0.5,
  FLAP_FORCE: -8,
  
  // Gravity variants for phases
  HEAVY_GRAVITY: 0.75,
  FLOATY_GRAVITY: 0.3,
  
  // Terminal velocity
  MAX_VELOCITY: 12,
  MIN_VELOCITY: -12,
} as const;

export const PIPES = {
  WIDTH: 52,
  GAP_SIZE: 150, // Initial gap size
  MIN_GAP_SIZE: 100, // Minimum gap after shrinking
  GAP_SHRINK_PER_PHASE: 8,
  SPAWN_INTERVAL: 1600, // ms
  SPEED: 2.5, // pixels per frame
  MIN_GAP_Y: 100, // Minimum Y for gap center
  MAX_GAP_Y_OFFSET: 100, // Max offset from center
} as const;

export const PHASE = {
  DURATION: 15, // seconds per phase
  TOTAL_PHASES: 9,
} as const;

export const WIND = {
  UPWARD: -0.15,
  DOWNWARD: 0.15,
  GUST_INTERVAL: 2000, // ms
} as const;

export const EFFECTS = {
  CONTROL_FLIP_DURATION: 8000, // ms
  GHOST_PIPE_BASE_PROBABILITY: 0.1,
  GHOST_PIPE_PHASE_MULTIPLIER: 0.1,
  DELAYED_COLLISION_MS: 300,
  OSCILLATION_SPEED: 0.02,
  OSCILLATION_AMPLITUDE: 30,
} as const;

export const DEMO = {
  GRAVITY_MULTIPLIER: 0.6,
  GAP_MULTIPLIER: 1.4,
  SPEED_MULTIPLIER: 0.6,
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
