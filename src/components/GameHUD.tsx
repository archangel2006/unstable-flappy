/**
 * Game HUD Component
 * Displays score, phase, active effects, and debug info
 * 
 * PATCHED: Reads from synced UIState, shows mode and assist status
 */

import React from 'react';
import { UIState } from '../game/Types';

interface GameHUDProps {
  uiState: UIState;
}

export const GameHUD: React.FC<GameHUDProps> = ({ uiState }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-4 font-mono text-foreground">
      {/* Top left - Score */}
      <div className="absolute top-4 left-4">
        <div className="text-4xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
          {uiState.score}
        </div>
        <div className="text-sm text-muted-foreground mt-1">SCORE</div>
      </div>
      
      {/* Top right - Phase and time */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-2xl font-bold text-game-neon-cyan">
          PHASE {uiState.currentPhase}
        </div>
        <div className="text-sm text-muted-foreground">
          {Math.floor(uiState.timeAlive)}s ALIVE
        </div>
      </div>
      
      {/* Mode and status indicators */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        {/* Mode indicator - always shown */}
        <div className={`text-lg font-bold px-3 py-1 rounded ${
          uiState.mode === 'CHAOS' 
            ? 'text-destructive bg-destructive/20' 
            : 'text-game-neon-cyan bg-game-neon-cyan/20'
        }`}>
          MODE: {uiState.mode}
        </div>
        
        {/* Assist indicator */}
        <div className={`text-sm font-bold px-2 py-0.5 rounded ${
          uiState.adaptiveAssistActive 
            ? 'text-secondary bg-secondary/20' 
            : 'text-muted-foreground bg-muted/20'
        }`}>
          ASSIST: {uiState.adaptiveAssistActive ? 'ON' : 'OFF'}
        </div>
        
        {uiState.isSlowMotion && (
          <div className="text-accent text-sm animate-pulse">
            ⏱ SLOW MOTION
          </div>
        )}
      </div>
      
      {/* Control inversion warning */}
      {uiState.isControlFlipped && (
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
          {uiState.activeEffects.length === 0 ? (
            <span className="text-xs text-muted-foreground/50">NONE</span>
          ) : (
            uiState.activeEffects.map((effect, i) => (
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
            GRAVITY: <span className="text-primary">{uiState.gravity.toFixed(2)}</span>
          </div>
          <div>
            WIND: <span className={uiState.windForce < 0 ? 'text-game-neon-cyan' : uiState.windForce > 0 ? 'text-accent' : 'text-muted-foreground'}>
              {uiState.windForce > 0 ? '↓' : uiState.windForce < 0 ? '↑' : '—'} {Math.abs(uiState.windForce).toFixed(2)}
            </span>
          </div>
          <div>
            SPEED: <span className="text-secondary">{uiState.pipeSpeed.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
                      text-xs text-muted-foreground/50 text-center">
        <div>[SPACE/CLICK] Flap • [M] Mode • [A] Assist</div>
        <div>[1-9] Jump to Phase</div>
      </div>
    </div>
  );
};
