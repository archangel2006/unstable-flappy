/**
 * Main Game Component
 * Handles the game loop, state management, and rendering
 * 
 * PATCHED: Fixed HUD sync, mode system, adaptive assist default
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Pipe, AdaptiveAssist, GameMode } from '../game/Types';
import { CANVAS, PIPES, PHYSICS, EFFECTS, ADAPTIVE_ASSIST, SLOW_MOTION, PHASE_EFFECTS } from '../game/Config';
import { getModeConfig, logModeChange } from '../game/ModeConfig';
import { createBird, updateBird, flapBird } from '../game/Bird';
import { 
  createPipe, 
  updatePipe, 
  isPipeOffScreen, 
  checkAndScorePipe,
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
  getControlFlipDuration,
  calculateVisualEffects,
  getPhaseTitle,
} from '../game/PhaseManager';
import { checkAllCollisions } from '../game/Collision';
import { render } from '../game/Renderer';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { GameOverScreen } from './GameOverScreen';
import { useUIState } from '../hooks/useUIState';

/**
 * Creates initial adaptive assist state - defaults to OFF
 */
function createInitialAdaptiveAssist(): AdaptiveAssist {
  return {
    isActive: false,
    manuallyToggled: false,
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
function createInitialState(mode: GameMode = 'CHAOS'): GameState {
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
    gameMode: mode,
    modeConfig: getModeConfig(mode),
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
    gravityWobble: 0,
    lastGravityChange: 0,
  };
}

export const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const lastTimeRef = useRef<number>(0);
  const lastPipeSpawnRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Synced UI state for HUD
  const uiState = useUIState(stateRef);

  /**
   * Spawns a new pipe
   */
  const spawnPipe = useCallback(() => {
    const state = stateRef.current;
    const config = getPhaseConfig(state.phase);
    
    const isGhost = config.ghostPipes && shouldBeGhostPipe(state.phase);
    const hasDelayed = config.visualGlitch && shouldHaveDelayedCollision(state.phase);
    
    // Adaptive assist gap multiplier
    const gapMultiplier = state.adaptiveAssist.gapMultiplier;
    
    const newPipe = createPipe(
      state.phase, 
      isGhost, 
      hasDelayed, 
      gapMultiplier,
      state.modeConfig
    );
    state.pipes.push(newPipe);
    console.log(`[PIPE] Spawned pipe. Ghost: ${isGhost}, Gap: ${newPipe.gapSize.toFixed(0)}px`);
  }, []);

  /**
   * Handles flap action
   */
  const handleFlap = useCallback(() => {
    const state = stateRef.current;
    
    if (state.isGameOver) {
      return;
    }
    
    if (!state.hasStarted) {
      // Don't start on click - use button instead
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
   * Starts the game with a specific mode
   */
  const handleStart = useCallback((mode: GameMode) => {
    console.log(`[GAME] Starting in ${mode} mode`);
    logModeChange(mode);
    
    stateRef.current = {
      ...createInitialState(mode),
      hasStarted: true,
      isPlaying: true,
    };
    lastPipeSpawnRef.current = performance.now();
    forceUpdate();
  }, []);

  /**
   * Toggles game mode before start
   */
  const handleToggleMode = useCallback(() => {
    const state = stateRef.current;
    if (state.hasStarted) return;
    
    const newMode: GameMode = state.gameMode === 'CHAOS' ? 'DEMO' : 'CHAOS';
    state.gameMode = newMode;
    state.modeConfig = getModeConfig(newMode);
    console.log(`[MODE] Toggled to ${newMode}`);
    forceUpdate();
  }, []);

  /**
   * Toggles adaptive assist
   */
  const handleToggleAssist = useCallback(() => {
    const state = stateRef.current;
    state.adaptiveAssist.isActive = !state.adaptiveAssist.isActive;
    state.adaptiveAssist.manuallyToggled = true;
    
    if (state.adaptiveAssist.isActive) {
      state.adaptiveAssist.gapMultiplier = ADAPTIVE_ASSIST.GAP_BOOST;
      state.adaptiveAssist.gravityMultiplier = ADAPTIVE_ASSIST.GRAVITY_REDUCTION;
      state.adaptiveAssist.speedMultiplier = ADAPTIVE_ASSIST.SPEED_REDUCTION;
    } else {
      state.adaptiveAssist.gapMultiplier = 1;
      state.adaptiveAssist.gravityMultiplier = 1;
      state.adaptiveAssist.speedMultiplier = 1;
    }
    
    console.log(`[ASSIST] Adaptive Assist: ${state.adaptiveAssist.isActive ? 'ON' : 'OFF'}`);
    forceUpdate();
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
    
    // Only auto-activate if not manually toggled
    if (!newAssist.manuallyToggled) {
      if (currentPhase === prevAssist.lastDeathPhase || currentPhase === prevAssist.lastDeathPhase + 1) {
        newAssist.consecutiveEarlyDeaths++;
        
        if (newAssist.consecutiveEarlyDeaths >= ADAPTIVE_ASSIST.DEATHS_THRESHOLD) {
          newAssist.isActive = true;
          newAssist.gapMultiplier *= ADAPTIVE_ASSIST.GAP_BOOST;
          newAssist.gravityMultiplier *= ADAPTIVE_ASSIST.GRAVITY_REDUCTION;
          newAssist.speedMultiplier *= ADAPTIVE_ASSIST.SPEED_REDUCTION;
          console.log(`[ASSIST] Auto-activated after ${newAssist.consecutiveEarlyDeaths} early deaths`);
        }
      } else {
        newAssist.consecutiveEarlyDeaths = 0;
      }
    }
    
    newAssist.lastDeathPhase = currentPhase;
    
    // Create new state preserving mode and assist
    stateRef.current = {
      ...createInitialState(oldState.gameMode),
      adaptiveAssist: newAssist,
      hasStarted: true,
      isPlaying: true,
    };
    lastPipeSpawnRef.current = performance.now();
    forceUpdate();
  }, []);

  /**
   * Jumps to a specific phase (for testing)
   */
  const jumpToPhase = useCallback((phase: number) => {
    const state = stateRef.current;
    if (!state.hasStarted || state.isGameOver) return;
    
    const targetTime = (phase - 1) * 15 + 0.5;
    state.timeAlive = targetTime;
    state.phase = phase;
    
    // Trigger phase change display
    state.phaseChangeDisplay = getPhaseTitle(phase);
    state.phaseChangeDisplayEndTime = performance.now() + 2000;
    state.screenFlash = 0.5;
    state.isSlowMotion = true;
    state.slowMotionEndTime = performance.now() + SLOW_MOTION.PHASE_CHANGE_DURATION;
    state.timeScale = SLOW_MOTION.TIME_SCALE;
    
    console.log(`[PHASE] Jumped to Phase ${phase}`);
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
        console.log(`[PHASE] Changed to Phase ${newPhase}: ${getPhaseTitle(newPhase)}`);
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
      
      // Calculate physics values based on phase (now returns object with changed flag)
      const gravityResult = calculateGravity(state.phase, state.timeAlive, config, state.modeConfig);
      let gravity = gravityResult.gravity;
      const windForce = calculateWindForce(state.phase, state.timeAlive, config, state.modeConfig);
      let pipeSpeed = calculatePipeSpeed(state.phase, state.timeAlive, config, state.modeConfig);
      
      // Handle gravity change wobble effect
      if (gravityResult.changed) {
        state.gravityWobble = PHASE_EFFECTS.GRAVITY_WOBBLE_INTENSITY;
        state.lastGravityChange = timestamp;
      }
      
      // Decay gravity wobble
      if (state.gravityWobble > 0) {
        state.gravityWobble *= 0.9;
        if (state.gravityWobble < 0.1) state.gravityWobble = 0;
      }
      
      // Apply adaptive assist modifiers
      if (state.adaptiveAssist.isActive) {
        gravity *= state.adaptiveAssist.gravityMultiplier;
        pipeSpeed *= state.adaptiveAssist.speedMultiplier;
      }
      
      // Store current values for HUD display
      state.currentGravity = gravity;
      state.currentWindForce = windForce;
      state.currentPipeSpeed = pipeSpeed;
      
      // Handle control flip warning and activation
      if (shouldTriggerControlFlip(state, config)) {
        state.controlFlipWarning = true;
        state.controlFlipWarningEndTime = timestamp + EFFECTS.CONTROL_FLIP_WARNING;
      }
      
      // Warning period ends, activate flip
      if (state.controlFlipWarning && timestamp > state.controlFlipWarningEndTime) {
        state.controlFlipWarning = false;
        state.isControlFlipped = true;
        state.controlFlipEndTime = timestamp + getControlFlipDuration(state.modeConfig);
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
      const spawnInterval = PIPES.SPAWN_INTERVAL * state.modeConfig.pipeSpawnMultiplier;
      
      if (timestamp - lastPipeSpawnRef.current > spawnInterval) {
        spawnPipe();
        lastPipeSpawnRef.current = timestamp;
      }
      
      // Update pipes and check scoring
      let scoreIncrement = 0;
      state.pipes = state.pipes
        .map(pipe => {
          // Update pipe position and oscillation
          const updatedPipe = updatePipe(
            pipe, 
            pipeSpeed, 
            state.phase, 
            config.pipeOscillation,
            state.timeAlive,
            state.modeConfig
          );
          
          // Check for scoring
          const scoreResult = checkAndScorePipe(updatedPipe, state.bird.x);
          if (scoreResult.scored) {
            scoreIncrement++;
          }
          
          return scoreResult.pipe;
        })
        .filter(pipe => !isPipeOffScreen(pipe));
      
      // Apply score increment
      if (scoreIncrement > 0) {
        state.score += scoreIncrement;
        console.log(`[SCORE] Score: ${state.score}`);
      }
      
      // Check collisions
      const collision = checkAllCollisions(
        state.bird, 
        state.pipes,
        state.modeConfig.collisionForgivenessMs
      );
      if (collision.hit) {
        state.isGameOver = true;
        state.isPlaying = false;
        console.log(`[GAME] Game Over! Final score: ${state.score}, Phase: ${state.phase}`);
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
      } else if (e.code === 'KeyM') {
        handleToggleMode();
      } else if (e.code === 'KeyA') {
        handleToggleAssist();
      } else if (e.key >= '1' && e.key <= '9') {
        jumpToPhase(parseInt(e.key));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap, handleToggleMode, handleToggleAssist, jumpToPhase]);

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
        
        {/* Gravity wobble effect */}
        {state.gravityWobble > 0 && (
          <div 
            className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none z-10"
            style={{
              transform: `translateY(${Math.sin(Date.now() * 0.05) * state.gravityWobble}px)`,
            }}
          />
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
        
        {/* HUD Overlay - uses synced UI state */}
        {state.hasStarted && !state.isGameOver && (
          <GameHUD uiState={uiState} />
        )}
        
        {/* Start Screen */}
        {!state.hasStarted && (
          <StartScreen 
            currentMode={state.gameMode}
            onStart={handleStart}
            onToggleMode={handleToggleMode}
          />
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
