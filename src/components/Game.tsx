/**
 * Main Game Component
 * Handles the game loop, state management, and rendering
 * 
 * PATCHED: Fixed control flip, horizontal wind, removed assist system
 * Added: Background audio that degrades with system instability
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Pipe, GameMode } from '../game/Types';
import { CANVAS, PIPES, PHYSICS, SLOW_MOTION, PHASE_EFFECTS } from '../game/Config';
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
import { audioManager } from '../game/AudioManager';

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
    isHoldingInput: false,
    gameMode: mode,
    modeConfig: getModeConfig(mode),
    isSlowMotion: false,
    slowMotionEndTime: 0,
    timeScale: 1,
    phaseChangeDisplay: '',
    phaseChangeDisplayEndTime: 0,
    isSystemOverload: false,
    systemOverloadEndTime: 0,
    cameraShake: { x: 0, y: 0 },
    canvasRotation: 0,
    hueShift: 0,
    screenFlash: 0,
    warningFlash: false,
    gravityWobble: 0,
    lastGravityChange: 0,
    desaturation: 0,
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
    
    const newPipe = createPipe(
      state.phase, 
      isGhost, 
      hasDelayed, 
      1, // No assist multiplier
      state.modeConfig
    );
    state.pipes.push(newPipe);
  }, []);

  /**
   * Handles flap action (only in normal mode)
   */
  const handleFlap = useCallback(() => {
    const state = stateRef.current;
    
    if (state.isGameOver) return;
    if (!state.hasStarted) return;
    
    if (!state.isPlaying) {
      state.isPlaying = true;
    }
    
    // In control flip mode, flapping is handled by hold state
    if (!state.isControlFlipped) {
      state.bird = flapBird(state.bird, false);
    }
    
    // Camera shake on flap
    const config = getPhaseConfig(state.phase);
    if (config.visualGlitch) {
      state.cameraShake = {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
      };
    }
  }, []);

  /**
   * Handles input press (for control flip hold detection)
   */
  const handleInputDown = useCallback(() => {
    const state = stateRef.current;
    state.isHoldingInput = true;
    handleFlap();
  }, [handleFlap]);

  /**
   * Handles input release
   */
  const handleInputUp = useCallback(() => {
    const state = stateRef.current;
    state.isHoldingInput = false;
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
    
    // Start background audio
    audioManager.start(mode === 'DEMO');
    
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
   * Handles restart
   */
  const handleRestart = useCallback(() => {
    const oldState = stateRef.current;
    const isDemoMode = oldState.gameMode === 'DEMO';
    
    stateRef.current = {
      ...createInitialState(oldState.gameMode),
      hasStarted: true,
      isPlaying: true,
    };
    lastPipeSpawnRef.current = performance.now();
    
    // Reset and restart audio
    audioManager.reset(isDemoMode);
    audioManager.start(isDemoMode);
    
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
    
    // Trigger phase change display (only for phases 1-10)
    const title = getPhaseTitle(phase);
    if (title) {
      state.phaseChangeDisplay = `${title.phase}\n${title.effect}`;
      state.phaseChangeDisplayEndTime = performance.now() + 2000;
      state.screenFlash = 0.5;
      state.isSlowMotion = true;
      state.slowMotionEndTime = performance.now() + SLOW_MOTION.PHASE_CHANGE_DURATION;
      state.timeScale = SLOW_MOTION.TIME_SCALE;
    }
    
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
    
    // Only update if playing and NOT in system overload freeze
    if (state.isPlaying && !state.isGameOver) {
      // Check if system overload freeze is active
      if (state.isSystemOverload) {
        if (timestamp > state.systemOverloadEndTime) {
          // End the overload freeze
          state.isSystemOverload = false;
          state.desaturation = 0;
          console.log('[SYSTEM] Overload ended, resuming...');
          
          // Resume audio with a brief distortion spike fade-out
          audioManager.resumeFromOverload();
        } else {
          // During freeze: apply flickering desaturation
          const flickerPhase = Math.sin(timestamp * 0.02) * 0.5 + 0.5;
          state.desaturation = 0.7 + flickerPhase * 0.3;
        }
        
        // Render but don't update physics during freeze
        render(ctx, canvas, state);
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      // Update time alive
      state.timeAlive += deltaTime;
      
      // Update phase
      const newPhase = getCurrentPhase(state.timeAlive);
      if (newPhase !== state.phase) {
        console.log(`[PHASE] Changed to Phase ${newPhase}`);
        state.phase = newPhase;
        
        // Update audio based on phase
        audioManager.updatePhase(newPhase);
        
        // Only show phase announcement for phases 1-10
        const title = getPhaseTitle(newPhase);
        if (title) {
          state.phaseChangeDisplay = `${title.phase}\n${title.effect}`;
          state.phaseChangeDisplayEndTime = timestamp + 2000;
          state.screenFlash = 0.5;
          state.isSlowMotion = true;
          state.slowMotionEndTime = timestamp + SLOW_MOTION.PHASE_CHANGE_DURATION;
          state.timeScale = SLOW_MOTION.TIME_SCALE;
          
          // Trigger System Overload at phases 3, 6, 9 (every 3rd phase, up to 10)
          if (newPhase >= 3 && newPhase <= 9 && newPhase % 3 === 0) {
            state.isSystemOverload = true;
            state.systemOverloadEndTime = timestamp + 700; // 0.7 second freeze
            state.desaturation = 1;
            console.log(`[SYSTEM] Overload triggered at Phase ${newPhase}`);
            
            // Trigger audio overload effect (momentary silence then distortion)
            audioManager.triggerOverload();
          }
        }
        // After phase 10, game continues silently with all effects active
      }
      
      // Clear phase display after time
      if (state.phaseChangeDisplay && timestamp > state.phaseChangeDisplayEndTime) {
        state.phaseChangeDisplay = '';
      }
      
      // Get current phase config
      const config = getPhaseConfig(state.phase);
      
      // Calculate physics values
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
      
      // Store current values for HUD display
      state.currentGravity = gravity;
      state.currentWindForce = windForce;
      state.currentPipeSpeed = pipeSpeed;
      
      // Handle control flip warning and activation
      if (shouldTriggerControlFlip(state, config)) {
        state.controlFlipWarning = true;
        state.controlFlipWarningEndTime = timestamp + 2000;
      }
      
      // Warning period ends, activate flip
      if (state.controlFlipWarning && timestamp > state.controlFlipWarningEndTime) {
        state.controlFlipWarning = false;
        state.isControlFlipped = true;
        state.controlFlipEndTime = timestamp + getControlFlipDuration(state.modeConfig);
        console.log('[CONTROL] Control flip ACTIVATED');
      }
      
      // Check if control flip should end
      if (state.isControlFlipped && timestamp > state.controlFlipEndTime) {
        state.isControlFlipped = false;
        console.log('[CONTROL] Control flip ENDED');
      }
      
      // Update warning flash for border effect
      state.warningFlash = state.controlFlipWarning && Math.floor(timestamp / 200) % 2 === 0;
      
      // Update bird physics with horizontal wind and control flip
      state.bird = updateBird(
        state.bird, 
        gravity, 
        windForce, // Now horizontal
        state.isControlFlipped,
        state.isHoldingInput
      );
      
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
          const updatedPipe = updatePipe(
            pipe, 
            pipeSpeed, 
            state.phase, 
            config.pipeOscillation,
            state.timeAlive,
            state.modeConfig
          );
          
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
        
        // Stop audio on game over
        audioManager.stop();
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
        handleInputDown();
      } else if (e.code === 'KeyM') {
        handleToggleMode();
      } else if (e.key >= '1' && e.key <= '9') {
        jumpToPhase(parseInt(e.key));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleInputUp();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInputDown, handleInputUp, handleToggleMode, jumpToPhase]);

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
      // Cleanup audio on unmount
      audioManager.dispose();
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
          onMouseDown={handleInputDown}
          onMouseUp={handleInputUp}
          onMouseLeave={handleInputUp}
          onTouchStart={handleInputDown}
          onTouchEnd={handleInputUp}
          className="rounded-lg border border-border shadow-[0_0_30px_rgba(0,255,136,0.2)] cursor-pointer transition-all duration-200"
          style={{
            filter: [
              state.hueShift > 0 ? `hue-rotate(${state.hueShift}deg)` : '',
              state.desaturation > 0 ? `grayscale(${state.desaturation})` : '',
            ].filter(Boolean).join(' ') || undefined,
          }}
        />
        
        {/* System Overload Overlay */}
        {state.isSystemOverload && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div 
              className="text-center px-10 py-6 rounded-xl border-2 border-destructive/50 animate-pulse"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                boxShadow: '0 0 60px rgba(255, 0, 0, 0.4), inset 0 0 30px rgba(255, 0, 0, 0.1)',
              }}
            >
              <div className="text-3xl font-bold text-destructive mb-2 tracking-wider">
                SYSTEM OVERLOAD
              </div>
              <div className="text-lg text-muted-foreground animate-pulse">
                Stabilizing...
              </div>
            </div>
          </div>
        )}
        
        {/* Phase Change Display - Clean two-line format */}
        {state.phaseChangeDisplay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center bg-background/80 px-8 py-4 rounded-lg animate-pulse">
              {state.phaseChangeDisplay.split('\n').map((line, i) => (
                <div 
                  key={i}
                  className={`font-bold drop-shadow-[0_0_20px_rgba(0,255,136,0.8)] ${
                    i === 0 ? 'text-3xl text-primary mb-1' : 'text-xl text-primary/80'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Control Flip Warning */}
        {state.controlFlipWarning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-2xl font-bold text-destructive animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,0.8)] bg-background/90 px-6 py-3 rounded-lg">
              ⚠ CONTROLS FLIPPING IN 2 SEC ⚠
            </div>
          </div>
        )}
        
        {/* HUD Overlay */}
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
