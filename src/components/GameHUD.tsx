/**
 * Game HUD Component
 * Displays score, phase, effects, and debug metrics
 * 
 * PATCHED: Removed timeAlive and Assist, added horizontal wind display
 */

import React from 'react';
import { UIState } from '../game/Types';

interface GameHUDProps {
  uiState: UIState;
}

export const GameHUD: React.FC<GameHUDProps> = ({ uiState }) => {
  const {
    score,
    currentPhase,
    gravity,
    windForce,
    pipeSpeed,
    activeEffects,
    mode,
    isControlFlipped,
  } = uiState;

  // Format wind with direction arrow (horizontal: left/right)
  const windDisplay = windForce === 0 
    ? '— 0.00' 
    : windForce < 0 
      ? `← ${Math.abs(windForce).toFixed(2)}`
      : `→ ${windForce.toFixed(2)}`;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 font-mono text-foreground">
      {/* Top left - Score */}
      <div className="absolute top-4 left-4">
        <div className="text-4xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
          {score}
        </div>
        <div className="text-sm text-muted-foreground mt-1">SCORE</div>
      </div>
      
      {/* Top right - Phase */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-2xl font-bold text-game-neon-cyan">
          PHASE {currentPhase}
        </div>
      </div>
      
      {/* Mode indicator - centered */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <div className={`text-lg font-bold px-3 py-1 rounded ${
          mode === 'CHAOS' 
            ? 'text-destructive bg-destructive/20' 
            : 'text-game-neon-cyan bg-game-neon-cyan/20'
        }`}>
          {mode} MODE
        </div>
      </div>
      
      {/* Control Flipped Warning */}
      {isControlFlipped && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 
                        text-destructive text-2xl font-bold animate-pulse
                        drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]
                        bg-background/90 px-4 py-2 rounded-lg">
          ⚠ CONTROLS FLIPPED ⚠
        </div>
      )}
      
      {/* Bottom left - Active effects */}
      <div className="absolute bottom-16 left-4">
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
      <div className="absolute bottom-16 right-4 text-right">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            GRAVITY: <span className="text-primary">{gravity.toFixed(3)}</span>
          </div>
          <div>
            WIND: <span className={windForce < 0 ? 'text-game-neon-cyan' : windForce > 0 ? 'text-accent' : 'text-muted-foreground'}>
              {windDisplay}
            </span>
          </div>
          <div>
            SPEED: <span className="text-secondary">{pipeSpeed.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Controls hint - single clean line */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
                      text-xs text-muted-foreground/50 text-center whitespace-nowrap">
        [SPACE / CLICK] Flap&nbsp;&nbsp;&nbsp;[M] Mode&nbsp;&nbsp;&nbsp;[1–9] Jump Phase
      </div>
    </div>
  );
};
