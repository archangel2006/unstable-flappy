/**
 * Main Game Component
 * Handles the game loop, state management, and rendering
 * 
 * REBALANCED: Added showcase mode, phase jump, slow motion, adaptive assist
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Pipe, AdaptiveAssist } from '../game/Types';
import { CANVAS, PIPES, PHYSICS, EFFECTS, DEMO, SHOWCASE, ADAPTIVE_ASSIST, SLOW_MOTION } from '../game/Config';
import { createBird, updateBird, flapBird } from '../game/Bird';
import { 
  createPipe, 
  updatePipe, 
  isPipeOffScreen, 
  hasBirdPassedPipe,
  shouldBeGhostPipe,
  shouldHaveDelayedCollision
} from '../game/Pipe';
import {
  getCurrentPhase,
  getPhaseConfig,
  calculateGravity,
  calculateWindForce,
  calculatePipeSpeed,
  shouldTriggerControlFlip,
  calculateVisualEffects,
  getPhaseTitle,
} from '../game/PhaseManager';
import { checkAllCollisions } from '../game/Collision';
import { render } from '../game/Renderer';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { GameOverScreen } from './GameOverScreen';

/**
 * Creates initial adaptive assist state
 */
function createInitialAdaptiveAssist(): AdaptiveAssist {
  return {
    isActive: false,
    consecutiveEarlyDeaths: 0,
    lastDeathPhase: 0,
    gapMultiplier: 1,
    gravityMultiplier: 1,
    speedMultiplier: 1,
  };
}

/**
 * Creates initial game state
 */
function createInitialState(): GameState {
  return {
    bird: createBird(),
    pipes: [],
    score: 0,
    timeAlive: 0,
    phase: 1,
    isPlaying: false,
    isGameOver: false,
    hasStarted: false,
    currentGravity: PHYSICS.GRAVITY,
    currentWindForce: 0,
    currentPipeSpeed: PIPES.SPEED,
    isControlFlipped: false,
    controlFlipEndTime: 0,
    controlFlipWarning: false,
    controlFlipWarningEndTime: 0,
    isDemoMode: false,
    isShowcaseMode: false,
    adaptiveAssist: createInitialAdaptiveAssist(),
    isSlowMotion: false,
    slowMotionEndTime: 0,
    timeScale: 1,
    phaseChangeDisplay: '',
    phaseChangeDisplayEndTime: 0,
    cameraShake: { x: 0, y: 0 },
    canvasRotation: 0,
    hueShift: 0,
    screenFlash: 0,
    warningFlash: false,
  };
}

export const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const lastTimeRef = useRef<number>(0);
  const lastPipeSpawnRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  /**
   * Spawns a new pipe
   */
  const spawnPipe = useCallback(() => {
    const state = stateRef.current;
    const config = getPhaseConfig(state.phase);
    
    const isGhost = config.ghostPipes && shouldBeGhostPipe(state.phase);
    const hasDelayed = config.visualGlitch && shouldHaveDelayedCollision(state.phase);
    
    // Calculate gap multiplier from all sources
    let gapMultiplier = state.adaptiveAssist.gapMultiplier;
    if (state.isDemoMode) gapMultiplier *= DEMO.GAP_MULTIPLIER;
    if (state.isShowcaseMode) gapMultiplier *= SHOWCASE.GAP_MULTIPLIER;
    
    const newPipe = createPipe(state.phase, isGhost, hasDelayed, gapMultiplier);
    state.pipes.push(newPipe);
  }, []);

  /**
   * Handles flap action
   */
  const handleFlap = useCallback(() => {
    const state = stateRef.current;
    
    if (!state.hasStarted) {
      state.hasStarted = true;
      state.isPlaying = true;
      forceUpdate();
      return;
    }
    
    if (state.isGameOver) {
      return;
    }
    
    if (!state.isPlaying) {
      state.isPlaying = true;
    }
    
    // Apply flap with possible control inversion
    state.bird = flapBird(state.bird, state.isControlFlipped);
    
    // Camera shake on flap (if visual effects enabled)
    const config = getPhaseConfig(state.phase);
    if (config.visualGlitch) {
      state.cameraShake = {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
      };
    }
  }, []);

  /**
   * Handles restart with adaptive assist tracking
   */
  const handleRestart = useCallback(() => {
    const oldState = stateRef.current;
    const prevAssist = oldState.adaptiveAssist;
    
    // Track consecutive early deaths (died before reaching next phase)
    let newAssist = { ...prevAssist };
    const currentPhase = oldState.phase;
    
    if (currentPhase === prevAssist.lastDeathPhase || currentPhase === prevAssist.lastDeathPhase + 1) {
      // Died in same phase or next phase (didn't survive much longer)
      newAssist.consecutiveEarlyDeaths++;
      
      if (newAssist.consecutiveEarlyDeaths >= ADAPTIVE_ASSIST.DEATHS_THRESHOLD) {
        // Activate assist
        newAssist.isActive = true;
        newAssist.gapMultiplier *= ADAPTIVE_ASSIST.GAP_BOOST;
        newAssist.gravityMultiplier *= ADAPTIVE_ASSIST.GRAVITY_REDUCTION;
        newAssist.speedMultiplier *= ADAPTIVE_ASSIST.SPEED_REDUCTION;
      }
    } else {
      // Made good progress, reset death counter but keep assist if active
      newAssist.consecutiveEarlyDeaths = 0;
    }
    
    newAssist.lastDeathPhase = currentPhase;
    
    // Create new state but preserve assist and mode settings
    stateRef.current = {
      ...createInitialState(),
      isDemoMode: oldState.isDemoMode,
      isShowcaseMode: oldState.isShowcaseMode,
      adaptiveAssist: newAssist,
      hasStarted: true,
      isPlaying: true,
    };
    lastPipeSpawnRef.current = performance.now();
    forceUpdate();
  }, []);

  /**
   * Toggles demo mode
   */
  const toggleDemoMode = useCallback(() => {
    stateRef.current.isDemoMode = !stateRef.current.isDemoMode;
    if (stateRef.current.isDemoMode) {
      stateRef.current.isShowcaseMode = false; // Mutually exclusive
    }
    forceUpdate();
  }, []);

  /**
   * Toggles showcase mode
   */
  const toggleShowcaseMode = useCallback(() => {
    stateRef.current.isShowcaseMode = !stateRef.current.isShowcaseMode;
    if (stateRef.current.isShowcaseMode) {
      stateRef.current.isDemoMode = false; // Mutually exclusive
    }
    forceUpdate();
  }, []);

  /**
   * Jumps to a specific phase (for testing)
   */
  const jumpToPhase = useCallback((phase: number) => {
    const state = stateRef.current;
    if (!state.hasStarted || state.isGameOver) return;
    
    // Calculate time needed to be in that phase
    const targetTime = (phase - 1) * 15 + 0.5; // 0.5 seconds into the phase
    state.timeAlive = targetTime;
    state.phase = phase;
    
    // Trigger phase change display
    state.phaseChangeDisplay = getPhaseTitle(phase);
    state.phaseChangeDisplayEndTime = performance.now() + 2000;
    state.screenFlash = 0.5;
    state.isSlowMotion = true;
    state.slowMotionEndTime = performance.now() + SLOW_MOTION.PHASE_CHANGE_DURATION;
    state.timeScale = SLOW_MOTION.TIME_SCALE;
    
    forceUpdate();
  }, []);

  /**
   * Main game update loop
   */
  const gameLoop = useCallback((timestamp: number) => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Calculate delta time
    let deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;
    
    // Apply slow motion
    if (state.isSlowMotion) {
      if (timestamp > state.slowMotionEndTime) {
        state.isSlowMotion = false;
        state.timeScale = 1;
      } else {
        deltaTime *= state.timeScale;
      }
    }
    
    // Only update if playing
    if (state.isPlaying && !state.isGameOver) {
      // Update time alive
      state.timeAlive += deltaTime;
      
      // Update phase
      const newPhase = getCurrentPhase(state.timeAlive);
      if (newPhase !== state.phase) {
        // Phase change - trigger slow motion and display
        state.phase = newPhase;
        state.phaseChangeDisplay = getPhaseTitle(newPhase);
        state.phaseChangeDisplayEndTime = timestamp + 2000;
        state.screenFlash = 0.5;
        state.isSlowMotion = true;
        state.slowMotionEndTime = timestamp + SLOW_MOTION.PHASE_CHANGE_DURATION;
        state.timeScale = SLOW_MOTION.TIME_SCALE;
      }
      
      // Clear phase display after time
      if (state.phaseChangeDisplay && timestamp > state.phaseChangeDisplayEndTime) {
        state.phaseChangeDisplay = '';
      }
      
      // Get current phase config
      const config = getPhaseConfig(state.phase);
      
      // Calculate physics values based on phase
      let gravity = calculateGravity(state.phase, state.timeAlive, config);
      let windForce = calculateWindForce(state.phase, state.timeAlive, config);
      let pipeSpeed = calculatePipeSpeed(state.phase, state.timeAlive, config);
      
      // Apply adaptive assist modifiers
      if (state.adaptiveAssist.isActive) {
        gravity *= state.adaptiveAssist.gravityMultiplier;
        pipeSpeed *= state.adaptiveAssist.speedMultiplier;
      }
      
      // Apply demo mode modifiers
      if (state.isDemoMode) {
        gravity *= DEMO.GRAVITY_MULTIPLIER;
        pipeSpeed *= DEMO.SPEED_MULTIPLIER;
        windForce *= 0.5;
      }
      
      // Apply showcase mode modifiers
      if (state.isShowcaseMode) {
        gravity *= SHOWCASE.GRAVITY_MULTIPLIER;
        pipeSpeed *= SHOWCASE.SPEED_MULTIPLIER;
        windForce *= 0.3;
      }
      
      // Store current values for HUD display
      state.currentGravity = gravity;
      state.currentWindForce = windForce;
      state.currentPipeSpeed = pipeSpeed;
      
      // Handle control flip warning and activation
      if (shouldTriggerControlFlip(state, config)) {
        // Start warning period
        state.controlFlipWarning = true;
        state.controlFlipWarningEndTime = timestamp + EFFECTS.CONTROL_FLIP_WARNING;
      }
      
      // Warning period ends, activate flip
      if (state.controlFlipWarning && timestamp > state.controlFlipWarningEndTime) {
        state.controlFlipWarning = false;
        state.isControlFlipped = true;
        state.controlFlipEndTime = timestamp + EFFECTS.CONTROL_FLIP_DURATION;
      }
      
      // Check if control flip should end
      if (state.isControlFlipped && timestamp > state.controlFlipEndTime) {
        state.isControlFlipped = false;
      }
      
      // Update warning flash for border effect
      state.warningFlash = state.controlFlipWarning && Math.floor(timestamp / 200) % 2 === 0;
      
      // Update bird physics
      state.bird = updateBird(state.bird, gravity, windForce);
      
      // Spawn pipes
      let spawnInterval = state.isDemoMode 
        ? PIPES.SPAWN_INTERVAL * 1.5 
        : state.isShowcaseMode
        ? PIPES.SPAWN_INTERVAL * 1.8
        : PIPES.SPAWN_INTERVAL;
      
      if (timestamp - lastPipeSpawnRef.current > spawnInterval) {
        spawnPipe();
        lastPipeSpawnRef.current = timestamp;
      }
      
      // Update pipes
      state.pipes = state.pipes
        .map(pipe => updatePipe(
          pipe, 
          pipeSpeed, 
          state.phase, 
          config.pipeOscillation,
          state.timeAlive
        ))
        .filter(pipe => !isPipeOffScreen(pipe));
      
      // Check for scoring
      state.pipes.forEach(pipe => {
        if (hasBirdPassedPipe(pipe, state.bird.x)) {
          pipe.passed = true;
          state.score++;
        }
      });
      
      // Check collisions
      const collision = checkAllCollisions(state.bird, state.pipes);
      if (collision.hit) {
        state.isGameOver = true;
        state.isPlaying = false;
        forceUpdate();
      }
      
      // Update visual effects
      if (config.visualGlitch) {
        const effects = calculateVisualEffects(state.phase, state.timeAlive, config);
        state.canvasRotation = effects.rotation;
        state.hueShift = effects.hueShift;
      } else {
        state.canvasRotation = 0;
        state.hueShift = 0;
      }
      
      // Decay camera shake
      state.cameraShake.x *= 0.9;
      state.cameraShake.y *= 0.9;
      
      // Decay screen flash
      state.screenFlash *= 0.95;
      if (state.screenFlash < 0.01) state.screenFlash = 0;
    }
    
    // Render
    render(ctx, canvas, state);
    
    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [spawnPipe]);

  /**
   * Input handlers
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlap();
      } else if (e.code === 'KeyD') {
        toggleDemoMode();
      } else if (e.code === 'KeyS') {
        toggleShowcaseMode();
      } else if (e.key >= '1' && e.key <= '9') {
        jumpToPhase(parseInt(e.key));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap, toggleDemoMode, toggleShowcaseMode, jumpToPhase]);

  /**
   * Start game loop
   */
  useEffect(() => {
    lastPipeSpawnRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // Get current state for React components
  const state = stateRef.current;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-game-bg-dark">
      <div className="relative" style={{ width: CANVAS.WIDTH, height: CANVAS.HEIGHT }}>
        {/* Warning border for control flip */}
        {state.warningFlash && (
          <div className="absolute inset-0 border-4 border-destructive rounded-lg animate-pulse pointer-events-none z-20" />
        )}
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS.WIDTH}
          height={CANVAS.HEIGHT}
          onClick={handleFlap}
          className="rounded-lg border border-border shadow-[0_0_30px_rgba(0,255,136,0.2)] cursor-pointer"
          style={{
            filter: state.hueShift > 0 ? `hue-rotate(${state.hueShift}deg)` : undefined,
          }}
        />
        
        {/* Phase Change Display */}
        {state.phaseChangeDisplay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-3xl font-bold text-primary animate-pulse drop-shadow-[0_0_20px_rgba(0,255,136,0.8)] bg-background/80 px-6 py-3 rounded-lg">
              {state.phaseChangeDisplay}
            </div>
          </div>
        )}
        
        {/* Control Flip Warning */}
        {state.controlFlipWarning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-2xl font-bold text-destructive animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
              ⚠ CONTROLS FLIPPING IN 2 SEC ⚠
            </div>
          </div>
        )}
        
        {/* HUD Overlay */}
        {state.hasStarted && !state.isGameOver && (
          <GameHUD state={state} />
        )}
        
        {/* Start Screen */}
        {!state.hasStarted && (
          <StartScreen onStart={handleFlap} />
        )}
        
        {/* Game Over Screen */}
        {state.isGameOver && (
          <GameOverScreen
            score={state.score}
            timeAlive={state.timeAlive}
            phase={state.phase}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
};
