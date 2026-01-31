/**
 * Game Over Screen Component
 */

import React from 'react';

interface GameOverScreenProps {
  score: number;
  timeAlive: number;
  phase: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  timeAlive, 
  phase, 
  onRestart 
}) => {
  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm 
                    flex flex-col items-center justify-center">
      {/* Glitch effect title */}
      <h1 className="text-5xl font-bold text-destructive mb-2
                     drop-shadow-[0_0_30px_rgba(255,100,100,0.8)]">
        SYSTEM CRASH
      </h1>
      <p className="text-muted-foreground mb-8 italic">
        The instability won.
      </p>
      
      {/* Stats */}
      <div className="bg-card/50 border border-border rounded-lg p-6 mb-8 min-w-[200px]">
        <div className="text-center space-y-4">
          <div>
            <div className="text-5xl font-bold text-primary mb-1">
              {score}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              SCORE
            </div>
          </div>
          
          <div className="h-px bg-border" />
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-game-neon-cyan">
                {Math.floor(timeAlive)}s
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                TIME ALIVE
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">
                {phase}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                PHASE REACHED
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Restart button */}
      <button
        onClick={onRestart}
        className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded
                   hover:bg-primary/80 transition-all
                   hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]
                   active:scale-95"
      >
        [ RESTART ]
      </button>
      
      {/* Phase breakdown */}
      <div className="mt-8 text-xs text-muted-foreground/50 text-center">
        {phase >= 9 ? (
          <span className="text-accent">You reached FULL INSTABILITY!</span>
        ) : phase >= 5 ? (
          <span>You survived the control flip!</span>
        ) : (
          <span>Keep playing to unlock more instabilities...</span>
        )}
      </div>
    </div>
  );
};
