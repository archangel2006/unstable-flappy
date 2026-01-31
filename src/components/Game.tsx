/**
 * Main Game Component
 * Handles the game loop, state management, and rendering
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Pipe } from '../game/Types';
import { CANVAS, PIPES, PHYSICS, EFFECTS, DEMO } from '../game/Config';
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
} from '../game/PhaseManager';
import { checkAllCollisions } from '../game/Collision';
import { render } from '../game/Renderer';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { GameOverScreen } from './GameOverScreen';

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
    isDemoMode: false,
    cameraShake: { x: 0, y: 0 },
    canvasRotation: 0,
    hueShift: 0,
    screenFlash: 0,
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
    
    const newPipe = createPipe(state.phase, isGhost, hasDelayed);
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
   * Handles restart
   */
  const handleRestart = useCallback(() => {
    stateRef.current = createInitialState();
    stateRef.current.hasStarted = true;
    stateRef.current.isPlaying = true;
    lastPipeSpawnRef.current = performance.now();
    forceUpdate();
  }, []);

  /**
   * Toggles demo mode
   */
  const toggleDemoMode = useCallback(() => {
    stateRef.current.isDemoMode = !stateRef.current.isDemoMode;
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
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;
    
    // Only update if playing
    if (state.isPlaying && !state.isGameOver) {
      // Update time alive
      state.timeAlive += deltaTime;
      
      // Update phase
      const newPhase = getCurrentPhase(state.timeAlive);
      if (newPhase !== state.phase) {
        // Phase change - trigger screen flash
        state.screenFlash = 0.5;
        state.phase = newPhase;
      }
      
      // Get current phase config
      const config = getPhaseConfig(state.phase);
      
      // Calculate physics values based on phase
      let gravity = calculateGravity(state.phase, state.timeAlive, config);
      let windForce = calculateWindForce(state.phase, state.timeAlive, config);
      let pipeSpeed = calculatePipeSpeed(state.phase, state.timeAlive, config);
      
      // Apply demo mode modifiers
      if (state.isDemoMode) {
        gravity *= DEMO.GRAVITY_MULTIPLIER;
        pipeSpeed *= DEMO.SPEED_MULTIPLIER;
        windForce *= 0.5;
      }
      
      // Store current values for HUD display
      state.currentGravity = gravity;
      state.currentWindForce = windForce;
      state.currentPipeSpeed = pipeSpeed;
      
      // Check for control flip trigger
      if (shouldTriggerControlFlip(state, config)) {
        state.isControlFlipped = true;
        state.controlFlipEndTime = timestamp + EFFECTS.CONTROL_FLIP_DURATION;
      }
      
      // Check if control flip should end
      if (state.isControlFlipped && timestamp > state.controlFlipEndTime) {
        state.isControlFlipped = false;
      }
      
      // Update bird physics
      state.bird = updateBird(state.bird, gravity, windForce);
      
      // Spawn pipes
      const spawnInterval = state.isDemoMode 
        ? PIPES.SPAWN_INTERVAL * 1.5 
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
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap, toggleDemoMode]);

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
