/**
 * Game HUD Component
 * Displays score, phase, active effects, and debug info
 * 
 * REBALANCED: Added showcase mode, adaptive assist indicators
 */

import React from 'react';
import { GameState } from '../game/Types';
import { getPhaseConfig, getActiveEffects } from '../game/PhaseManager';

interface GameHUDProps {
  state: GameState;
}

export const GameHUD: React.FC<GameHUDProps> = ({ state }) => {
  const config = getPhaseConfig(state.phase);
  const activeEffects = getActiveEffects(state, config);
  
  return (
    <div className="absolute inset-0 pointer-events-none p-4 font-mono text-foreground">
      {/* Top left - Score */}
      <div className="absolute top-4 left-4">
        <div className="text-4xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
          {state.score}
        </div>
        <div className="text-sm text-muted-foreground mt-1">SCORE</div>
      </div>
      
      {/* Top right - Phase and time */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-2xl font-bold text-game-neon-cyan">
          PHASE {state.phase}
        </div>
        <div className="text-sm text-muted-foreground">
          {Math.floor(state.timeAlive)}s ALIVE
        </div>
      </div>
      
      {/* Mode indicators */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        {state.isDemoMode && (
          <div className="text-accent text-lg font-bold animate-pulse bg-accent/20 px-3 py-1 rounded">
            🎮 DEMO MODE
          </div>
        )}
        {state.isShowcaseMode && (
          <div className="text-game-neon-cyan text-lg font-bold animate-pulse bg-game-neon-cyan/20 px-3 py-1 rounded">
            🎬 SHOWCASE MODE
          </div>
        )}
        {state.adaptiveAssist.isActive && (
          <div className="text-secondary text-sm font-bold bg-secondary/20 px-2 py-0.5 rounded">
            🛟 ADAPTIVE ASSIST ACTIVE
          </div>
        )}
        {state.isSlowMotion && (
          <div className="text-accent text-sm">
            ⏱ SLOW MOTION
          </div>
        )}
      </div>
      
      {/* Control inversion warning */}
      {state.isControlFlipped && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 
                        text-destructive text-2xl font-bold animate-pulse
                        drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
          ⚠ CONTROL INVERTED ⚠
        </div>
      )}
      
      {/* Bottom left - Active effects */}
      <div className="absolute bottom-20 left-4">
        <div className="text-xs text-muted-foreground mb-1">ACTIVE EFFECTS</div>
        <div className="flex flex-col gap-1">
          {activeEffects.length === 0 ? (
            <span className="text-xs text-muted-foreground/50">NONE</span>
          ) : (
            activeEffects.map((effect, i) => (
              <span 
                key={i} 
                className={`text-xs px-2 py-0.5 rounded ${
                  effect.includes('⚠') 
                    ? 'bg-destructive/20 text-destructive' 
                    : effect.includes('⚡')
                    ? 'bg-accent/20 text-accent'
                    : 'bg-primary/20 text-primary'
                }`}
              >
                {effect}
              </span>
            ))
          )}
        </div>
      </div>
      
      {/* Bottom right - Debug values */}
      <div className="absolute bottom-20 right-4 text-right">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            GRAVITY: <span className="text-primary">{state.currentGravity.toFixed(2)}</span>
          </div>
          <div>
            WIND: <span className={state.currentWindForce < 0 ? 'text-game-neon-cyan' : state.currentWindForce > 0 ? 'text-accent' : 'text-muted-foreground'}>
              {state.currentWindForce > 0 ? '↓' : state.currentWindForce < 0 ? '↑' : '—'} {Math.abs(state.currentWindForce).toFixed(2)}
            </span>
          </div>
          <div>
            SPEED: <span className="text-secondary">{state.currentPipeSpeed.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
                      text-xs text-muted-foreground/50 text-center">
        <div>[SPACE/CLICK] Flap • [D] Demo • [S] Showcase</div>
        <div>[1-9] Jump to Phase</div>
      </div>
    </div>
  );
};
