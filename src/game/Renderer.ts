/**
 * Renderer Module
 * Handles all canvas drawing operations
 */

import { Bird, Pipe, GameState } from './Types';
import { CANVAS, PIPES, COLORS } from './Config';

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
  // Draw subtle grid lines
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x < CANVAS.WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS.HEIGHT);
    ctx.stroke();
  }
  
  // Horizontal lines
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
  
  // Ground fill
  ctx.fillStyle = COLORS.GROUND;
  ctx.fillRect(0, groundY, CANVAS.WIDTH, 50);
  
  // Ground line with glow
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
  
  // Glow effect
  ctx.shadowColor = COLORS.BIRD_GLOW;
  ctx.shadowBlur = 15;
  
  // Bird body (rounded rectangle)
  ctx.fillStyle = COLORS.BIRD;
  ctx.beginPath();
  const radius = 8;
  ctx.roundRect(x, y, bird.width, bird.height, radius);
  ctx.fill();
  
  // Eye
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.beginPath();
  ctx.arc(x + bird.width - 10, y + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Beak
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath();
  ctx.moveTo(x + bird.width, y + bird.height / 2);
  ctx.lineTo(x + bird.width + 8, y + bird.height / 2 + 4);
  ctx.lineTo(x + bird.width, y + bird.height / 2 + 8);
  ctx.fill();
  
  // Wing
  ctx.fillStyle = 'rgba(0, 200, 100, 0.8)';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + bird.height / 2 + 2, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws a single pipe
 */
export function drawPipe(
  ctx: CanvasRenderingContext2D, 
  pipe: Pipe
): void {
  const effectiveGapY = pipe.gapY + pipe.oscillationOffset;
  const gapTop = effectiveGapY - pipe.gapSize / 2;
  const gapBottom = effectiveGapY + pipe.gapSize / 2;
  const groundY = CANVAS.HEIGHT - 50;
  
  // Set style based on ghost status
  if (pipe.isGhost) {
    ctx.fillStyle = COLORS.GHOST_PIPE;
    ctx.shadowColor = 'transparent';
  } else {
    ctx.fillStyle = COLORS.PIPE;
    ctx.shadowColor = COLORS.PIPE_GLOW;
    ctx.shadowBlur = 10;
  }
  
  // Top pipe
  ctx.fillRect(pipe.x, 0, PIPES.WIDTH, gapTop);
  
  // Top pipe cap
  ctx.fillRect(pipe.x - 3, gapTop - 20, PIPES.WIDTH + 6, 20);
  
  // Bottom pipe
  ctx.fillRect(pipe.x, gapBottom, PIPES.WIDTH, groundY - gapBottom);
  
  // Bottom pipe cap
  ctx.fillRect(pipe.x - 3, gapBottom, PIPES.WIDTH + 6, 20);
  
  ctx.shadowBlur = 0;
  
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
  pipes: Pipe[]
): void {
  pipes.forEach(pipe => drawPipe(ctx, pipe));
}

/**
 * Draws wind direction indicator
 */
export function drawWindIndicator(
  ctx: CanvasRenderingContext2D,
  windForce: number
): void {
  if (windForce === 0) return;
  
  const x = 20;
  const y = 100;
  const size = 15;
  
  ctx.save();
  ctx.translate(x, y);
  
  // Arrow direction based on wind
  if (windForce < 0) {
    // Upward wind
    ctx.rotate(-Math.PI / 2);
  } else {
    // Downward wind
    ctx.rotate(Math.PI / 2);
  }
  
  ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size / 2, -size / 2);
  ctx.lineTo(-size / 2, size / 2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Applies visual glitch effects
 */
export function applyVisualEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  rotation: number,
  hueShift: number,
  screenFlash: number
): void {
  // Save current transform
  ctx.save();
  
  // Apply rotation around center
  if (rotation !== 0) {
    ctx.translate(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-CANVAS.WIDTH / 2, -CANVAS.HEIGHT / 2);
  }
  
  // Screen flash effect
  if (screenFlash > 0) {
    ctx.fillStyle = `rgba(0, 255, 136, ${screenFlash})`;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
  }
  
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
  // Apply visual effects transform
  ctx.save();
  
  if (state.canvasRotation !== 0) {
    ctx.translate(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2);
    ctx.rotate((state.canvasRotation * Math.PI) / 180);
    ctx.translate(-CANVAS.WIDTH / 2, -CANVAS.HEIGHT / 2);
  }
  
  // Clear and draw background
  clearCanvas(ctx);
  drawBackground(ctx);
  
  // Draw game elements
  drawPipes(ctx, state.pipes);
  drawGround(ctx);
  drawBird(ctx, state.bird, state.cameraShake);
  
  // Draw wind indicator if wind is active
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
