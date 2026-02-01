/**
 * Start Screen Component
 * PATCHED: Cleaner controls text formatting, removed Assist reference
 */

import React from 'react';
import { GameMode } from '../game/Types';

interface StartScreenProps {
  currentMode: GameMode;
  onStart: (mode: GameMode) => void;
  onToggleMode: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ 
  currentMode, 
  onStart,
  onToggleMode 
}) => {
  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm 
                    flex flex-col items-center justify-center">
      {/* Title */}
      <h1 className="text-4xl font-bold text-primary mb-2
                     drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]
                     animate-pulse">
        UNSTABLE FLAPPY
      </h1>
      <p className="text-sm text-muted-foreground mb-6 italic">
        A System That Breaks Itself
      </p>
      
      {/* Decorative line */}
      <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mb-6" />
      
      {/* Mode indicator */}
      <div className="mb-6 text-center">
        <div className="text-xs text-muted-foreground mb-1">CURRENT MODE</div>
        <div className={`text-2xl font-bold ${
          currentMode === 'CHAOS' 
            ? 'text-destructive drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]' 
            : 'text-game-neon-cyan drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]'
        }`}>
          {currentMode}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMode(); }}
          className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          [M] Switch Mode
        </button>
      </div>
      
      {/* Start buttons */}
      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={(e) => { e.stopPropagation(); onStart('CHAOS'); }}
          className="px-8 py-3 bg-destructive/20 border-2 border-destructive 
                     text-destructive font-bold rounded-lg
                     hover:bg-destructive/30 hover:scale-105
                     transition-all duration-200
                     drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]"
        >
          START — CHAOS MODE
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onStart('DEMO'); }}
          className="px-8 py-3 bg-game-neon-cyan/20 border-2 border-game-neon-cyan 
                     text-game-neon-cyan font-bold rounded-lg
                     hover:bg-game-neon-cyan/30 hover:scale-105
                     transition-all duration-200
                     drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]"
        >
          START — DEMO MODE
        </button>
      </div>
      
      {/* Instructions */}
      <div className="text-center mb-4 space-y-1">
        <p className="text-foreground text-sm">
          <span className="text-primary">SPACE</span> or{' '}
          <span className="text-primary">CLICK</span> to flap
        </p>
        <p className="text-xs text-muted-foreground">
          Survive as mechanics break and mutate
        </p>
      </div>
      
      {/* Phase preview */}
      <div className="text-xs text-muted-foreground mb-4 max-w-xs text-center">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
          <span className="text-game-neon-cyan text-right">PHASE 2</span>
          <span className="text-game-neon-cyan text-left">Gravity Drift</span>
          <span className="text-game-neon-cyan text-right">PHASE 3</span>
          <span className="text-game-neon-cyan text-left">Pipe Oscillation</span>
          <span className="text-accent text-right">PHASE 5</span>
          <span className="text-accent text-left">Control Flip</span>
          <span className="text-destructive text-right">PHASE 9</span>
          <span className="text-destructive text-left">Total Chaos</span>
        </div>
      </div>
      
      {/* Controls hint - single clean line */}
      <div className="absolute bottom-8 text-xs text-muted-foreground/50 text-center whitespace-nowrap">
        [SPACE / CLICK] Flap&nbsp;&nbsp;&nbsp;[M] Mode&nbsp;&nbsp;&nbsp;[1–9] Jump Phase
      </div>
    </div>
  );
};
