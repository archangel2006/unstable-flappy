/**
 * Start Screen Component
 */

import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div 
      className="absolute inset-0 bg-background/90 backdrop-blur-sm 
                 flex flex-col items-center justify-center cursor-pointer"
      onClick={onStart}
    >
      {/* Title */}
      <h1 className="text-4xl font-bold text-primary mb-2
                     drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]
                     animate-pulse">
        UNSTABLE FLAPPY
      </h1>
      <p className="text-sm text-muted-foreground mb-8 italic">
        A System That Breaks Itself
      </p>
      
      {/* Decorative glitch lines */}
      <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mb-8" />
      
      {/* Instructions */}
      <div className="text-center mb-8 space-y-2">
        <p className="text-foreground">
          <span className="text-primary">SPACE</span> or{' '}
          <span className="text-primary">CLICK</span> to flap
        </p>
        <p className="text-sm text-muted-foreground">
          Survive as mechanics break and mutate
        </p>
      </div>
      
      {/* Phase preview */}
      <div className="text-xs text-muted-foreground mb-8 max-w-xs text-center">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <span className="text-game-neon-cyan">PHASE 2</span>
          <span className="text-game-neon-cyan">→ Gravity Drift</span>
          <span></span>
          <span className="text-game-neon-cyan">PHASE 3</span>
          <span className="text-game-neon-cyan">→ Pipe Oscillation</span>
          <span></span>
          <span className="text-accent">PHASE 5</span>
          <span className="text-accent">→ Control Flip</span>
          <span></span>
          <span className="text-destructive">PHASE 9</span>
          <span className="text-destructive">→ ALL UNSTABLE</span>
          <span></span>
        </div>
      </div>
      
      {/* Start button */}
      <div className="text-xl text-primary animate-bounce">
        [ CLICK TO START ]
      </div>
      
      {/* Demo mode hint */}
      <p className="absolute bottom-8 text-xs text-muted-foreground/50">
        Press [D] during game for Demo Mode
      </p>
    </div>
  );
};
