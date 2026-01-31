/**
 * Game Configuration Constants
 * All physics, timing, and gameplay values are centralized here
 * 
 * REBALANCED for demo-friendliness and 2-3 minute survivability
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
  // Normal gravity (reduced by 25% from 0.5)
  GRAVITY: 0.375,
  FLAP_FORCE: -7.5,
  
  // Gravity variants for phases (clamped between 0.7x and 1.2x of base)
  HEAVY_GRAVITY: 0.45, // 1.2x base
  FLOATY_GRAVITY: 0.26, // 0.7x base
  
  // Terminal velocity (clamped to avoid instant drops)
  MAX_VELOCITY: 8,
  MIN_VELOCITY: -10,
} as const;

export const PIPES = {
  WIDTH: 52,
  GAP_SIZE: 200, // Increased by ~35% from 150
  MIN_GAP_SIZE: 140, // Increased from 100
  GAP_SHRINK_PER_PHASE: 5, // Reduced from 8
  SPAWN_INTERVAL: 2000, // Increased from 1600ms
  SPEED: 2.0, // Reduced by 20% from 2.5
  MIN_GAP_Y: 100,
  MAX_GAP_Y_OFFSET: 100,
} as const;

export const PHASE = {
  DURATION: 15, // seconds per phase
  TOTAL_PHASES: 9,
} as const;

export const WIND = {
  // Max wind is 20% of gravity
  UPWARD: -0.075,
  DOWNWARD: 0.075,
  GUST_INTERVAL: 2500, // Slightly longer
} as const;

export const EFFECTS = {
  CONTROL_FLIP_DURATION: 5000, // Reduced from 8000ms
  CONTROL_FLIP_WARNING: 2000, // Show warning 2 seconds before
  GHOST_PIPE_BASE_PROBABILITY: 0.1,
  GHOST_PIPE_PHASE_MULTIPLIER: 0.1,
  DELAYED_COLLISION_MS: 300,
  // Toned down oscillation
  OSCILLATION_SPEED: 0.015, // Slower
  OSCILLATION_AMPLITUDE: 20, // Reduced from 30
  // Speed drift limited to ±15%
  SPEED_DRIFT_MAX: 0.15,
} as const;

// REMOVED: Old DEMO and SHOWCASE configs - now in ModeConfig.ts

export const ADAPTIVE_ASSIST = {
  GAP_BOOST: 1.1, // +10%
  GRAVITY_REDUCTION: 0.9, // -10%
  SPEED_REDUCTION: 0.9, // -10%
  DEATHS_THRESHOLD: 2, // Activate after 2 deaths before next phase
} as const;

export const SLOW_MOTION = {
  PHASE_CHANGE_DURATION: 1500, // 1.5 seconds
  TIME_SCALE: 0.5,
} as const;

// ENHANCED: Stronger phase effects for visibility
export const PHASE_EFFECTS = {
  // Phase 2 Gravity Drift - more visible
  GRAVITY_DRIFT_CYCLE_TIME: 4, // seconds
  GRAVITY_LOW_MULTIPLIER: 0.65,
  GRAVITY_HIGH_MULTIPLIER: 1.45,
  GRAVITY_WOBBLE_INTENSITY: 3, // pixels
  
  // Phase 3 Oscillation - more visible
  OSCILLATION_AMPLITUDE: 55, // pixels (increased from 20)
  OSCILLATION_SPEED: 0.02, // rad/frame
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
