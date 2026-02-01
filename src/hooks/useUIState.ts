/**
 * UI State Hook
 * Syncs game state to React state every 100ms for HUD updates
 * 
 * PATCHED: Removed timeAlive and assist from UI state
 */

import { useState, useEffect, useRef } from 'react';
import { GameState, UIState } from '../game/Types';
import { getPhaseConfig, getActiveEffects } from '../game/PhaseManager';

const SYNC_INTERVAL = 100; // ms

/**
 * Creates initial UI state
 */
function createInitialUIState(): UIState {
  return {
    score: 0,
    currentPhase: 1,
    gravity: 0.375,
    windForce: 0,
    pipeSpeed: 2.0,
    activeEffects: [],
    mode: 'CHAOS',
    isSlowMotion: false,
    isControlFlipped: false,
    controlFlipWarning: false,
    phaseChangeDisplay: '',
    gravityWobble: 0,
    isSystemOverload: false,
  };
}

/**
 * Hook that syncs game state to UI state every 100ms
 */
export function useUIState(stateRef: React.MutableRefObject<GameState>) {
  const [uiState, setUIState] = useState<UIState>(createInitialUIState);
  const lastLogRef = useRef<number>(0);
  
  useEffect(() => {
    const syncUI = () => {
      const state = stateRef.current;
      const config = getPhaseConfig(state.phase);
      const activeEffects = getActiveEffects(state, config);
      
      const newUIState: UIState = {
        score: state.score,
        currentPhase: state.phase,
        gravity: state.currentGravity,
        windForce: state.currentWindForce,
        pipeSpeed: state.currentPipeSpeed,
        activeEffects,
        mode: state.gameMode,
        isSlowMotion: state.isSlowMotion,
        isControlFlipped: state.isControlFlipped,
        controlFlipWarning: state.controlFlipWarning,
        phaseChangeDisplay: state.phaseChangeDisplay,
        gravityWobble: state.gravityWobble,
        isSystemOverload: state.isSystemOverload,
      };
      
      setUIState(newUIState);
      
      // Log every 1 second for verification
      const now = performance.now();
      if (now - lastLogRef.current >= 1000 && state.isPlaying && !state.isGameOver) {
        console.log(`[UI SYNC] Score: ${state.score}, Phase: ${state.phase}, Gravity: ${state.currentGravity.toFixed(3)}, Wind: ${state.currentWindForce.toFixed(3)}`);
        lastLogRef.current = now;
      }
    };
    
    const intervalId = setInterval(syncUI, SYNC_INTERVAL);
    
    // Initial sync
    syncUI();
    
    return () => clearInterval(intervalId);
  }, [stateRef]);
  
  return uiState;
}
