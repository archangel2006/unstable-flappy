/**
 * Renderer Module
 * Handles all canvas drawing operations
 * 
 * PATCHED: Horizontal wind indicator, enhanced oscillation visibility
 */

import { Bird, Pipe, GameState } from './Types';
import { CANVAS, PIPES, COLORS } from './Config';
import { getPhaseConfig } from './PhaseManager';

/**
 * Clears the canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
}

/**
 * Draws the background with subtle grid pattern
 */
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
  ctx.lineWidth = 1;
  
  for (let x = 0; x < CANVAS.WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS.HEIGHT);
    ctx.stroke();
  }
  
  for (let y = 0; y < CANVAS.HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS.WIDTH, y);
    ctx.stroke();
  }
}

/**
 * Draws the ground
 */
export function drawGround(ctx: CanvasRenderingContext2D): void {
  const groundY = CANVAS.HEIGHT - 50;
  
  ctx.fillStyle = COLORS.GROUND;
  ctx.fillRect(0, groundY, CANVAS.WIDTH, 50);
  
  ctx.shadowColor = COLORS.BIRD_GLOW;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = COLORS.GROUND_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(CANVAS.WIDTH, groundY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/**
 * Draws the bird with glow effect
 */
export function drawBird(
  ctx: CanvasRenderingContext2D, 
  bird: Bird,
  shake: { x: number; y: number }
): void {
  const x = bird.x + shake.x;
  const y = bird.y + shake.y;
  
  ctx.shadowColor = COLORS.BIRD_GLOW;
  ctx.shadowBlur = 15;
  
  ctx.fillStyle = COLORS.BIRD;
  ctx.beginPath();
  const radius = 8;
  ctx.roundRect(x, y, bird.width, bird.height, radius);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.beginPath();
  ctx.arc(x + bird.width - 10, y + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath();
  ctx.moveTo(x + bird.width, y + bird.height / 2);
  ctx.lineTo(x + bird.width + 8, y + bird.height / 2 + 4);
  ctx.lineTo(x + bird.width, y + bird.height / 2 + 8);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(0, 200, 100, 0.8)';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + bird.height / 2 + 2, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws a single pipe with enhanced effects for oscillating pipes
 */
export function drawPipe(
  ctx: CanvasRenderingContext2D, 
  pipe: Pipe,
  isOscillating: boolean,
  ghostOpacity: number = 0.4
): void {
  const effectiveGapY = pipe.gapY + pipe.oscillationOffset;
  const gapTop = effectiveGapY - pipe.gapSize / 2;
  const gapBottom = effectiveGapY + pipe.gapSize / 2;
  const groundY = CANVAS.HEIGHT - 50;
  
  // Draw trail effect for oscillating pipes
  if (isOscillating && Math.abs(pipe.oscillationOffset) > 5) {
    ctx.globalAlpha = 0.15;
    const trailOffset = -pipe.oscillationOffset * 0.4;
    const trailGapTop = (pipe.gapY + trailOffset) - pipe.gapSize / 2;
    const trailGapBottom = (pipe.gapY + trailOffset) + pipe.gapSize / 2;
    
    ctx.fillStyle = COLORS.PIPE;
    ctx.fillRect(pipe.x, 0, PIPES.WIDTH, trailGapTop);
    ctx.fillRect(pipe.x, trailGapBottom, PIPES.WIDTH, groundY - trailGapBottom);
    ctx.globalAlpha = 1;
  }
  
  // Set style based on ghost status
  if (pipe.isGhost) {
    ctx.globalAlpha = ghostOpacity;
    ctx.fillStyle = COLORS.GHOST_PIPE;
    ctx.shadowColor = 'transparent';
  } else {
    ctx.fillStyle = COLORS.PIPE;
    // Enhanced glow for oscillating pipes
    if (isOscillating && Math.abs(pipe.oscillationOffset) > 15) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 25;
    } else {
      ctx.shadowColor = COLORS.PIPE_GLOW;
      ctx.shadowBlur = 10;
    }
  }
  
  // Top pipe
  ctx.fillRect(pipe.x, 0, PIPES.WIDTH, gapTop);
  ctx.fillRect(pipe.x - 3, gapTop - 20, PIPES.WIDTH + 6, 20);
  
  // Bottom pipe
  ctx.fillRect(pipe.x, gapBottom, PIPES.WIDTH, groundY - gapBottom);
  ctx.fillRect(pipe.x - 3, gapBottom, PIPES.WIDTH + 6, 20);
  
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  
  // Draw warning indicator for delayed collision pipes
  if (pipe.hasDelayedCollision) {
    ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('!', pipe.x + PIPES.WIDTH / 2 - 3, gapTop + pipe.gapSize / 2 + 4);
  }
}

/**
 * Draws all pipes
 */
export function drawPipes(
  ctx: CanvasRenderingContext2D, 
  pipes: Pipe[],
  isOscillating: boolean,
  ghostOpacity: number = 0.4
): void {
  pipes.forEach(pipe => drawPipe(ctx, pipe, isOscillating, ghostOpacity));
}

/**
 * Draws HORIZONTAL wind direction indicator (left/right arrow)
 */
export function drawWindIndicator(
  ctx: CanvasRenderingContext2D,
  windForce: number
): void {
  if (windForce === 0) return;
  
  const x = 20;
  const y = 100;
  const size = 12;
  
  ctx.save();
  ctx.translate(x, y);
  
  // Point left or right
  if (windForce < 0) {
    // Left arrow
    ctx.scale(-1, 1);
  }
  
  // Draw horizontal arrow
  ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(0, -size / 2);
  ctx.lineTo(0, size / 2);
  ctx.closePath();
  ctx.fill();
  
  // Arrow tail
  ctx.fillRect(-size * 0.8, -3, size * 0.8, 6);
  
  ctx.restore();
}

/**
 * Main render function - draws entire game frame
 */
export function render(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState
): void {
  const config = getPhaseConfig(state.phase);
  
  ctx.save();
  
  // Apply gravity wobble effect
  if (state.gravityWobble > 0) {
    ctx.translate(0, Math.sin(Date.now() * 0.03) * state.gravityWobble);
  }
  
  if (state.canvasRotation !== 0) {
    ctx.translate(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
    ctx.rotate((state.canvasRotation * Math.PI) / 180);
    ctx.translate(-CANVAS.WIDTH / 2, -CANVAS.HEIGHT / 2);
  }
  
  clearCanvas(ctx);
  drawBackground(ctx);
  
  // Draw pipes with oscillation effects
  drawPipes(ctx, state.pipes, config.pipeOscillation, state.modeConfig.ghostPipeOpacity);
  drawGround(ctx);
  drawBird(ctx, state.bird, state.cameraShake);
  
  // Draw horizontal wind indicator
  if (state.currentWindForce !== 0) {
    drawWindIndicator(ctx, state.currentWindForce);
  }
  
  // Screen flash effect
  if (state.screenFlash > 0) {
    ctx.fillStyle = `rgba(0, 255, 136, ${state.screenFlash})`;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
  }
  
  ctx.restore();
}
