export interface MotionConfig {
  readonly minX: number;
  readonly maxX: number;
  readonly maxSpeed: number;
  readonly acceleration: number;
  readonly friction: number;
  readonly gravity: number;
  readonly jumpVelocity: number;
  readonly coyoteTimeMs: number;
  readonly jumpBufferMs: number;
  readonly dashDistance: number;
  readonly dashDurationMs: number;
  readonly dashCooldownMs: number;
  readonly dashInvulnerabilityMs: number;
}

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  minX: 92,
  maxX: 1188,
  maxSpeed: 285,
  acceleration: 2200,
  friction: 2600,
  gravity: 1900,
  jumpVelocity: -700,
  coyoteTimeMs: 100,
  jumpBufferMs: 100,
  dashDistance: 160,
  dashDurationMs: 90,
  dashCooldownMs: 220,
  dashInvulnerabilityMs: 90
};

export interface MotionState {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly facing: -1 | 1;
  readonly grounded: boolean;
  readonly crouching: boolean;
  readonly dashing: boolean;
  readonly dashUntilMs: number;
  readonly dashCooldownUntilMs: number;
  readonly invulnerableUntilMs: number;
  readonly coyoteUntilMs: number;
  readonly jumpBufferUntilMs: number;
  readonly actionPhase: 'idle' | 'anticipation' | 'active' | 'recovery';
}

export interface MotionInput {
  readonly horizontal: -1 | 0 | 1;
  readonly crouching: boolean;
  readonly jumpPressed: boolean;
  readonly dashPressed: boolean;
  readonly dashDirection?: -1 | 1;
}

export interface MotionEvents {
  readonly jumped: boolean;
  readonly landed: boolean;
  readonly dashed: boolean;
  readonly dashEnded: boolean;
}

export interface MotionStep {
  readonly state: MotionState;
  readonly events: MotionEvents;
}

export const createMotionState = (x: number, nowMs = 0, facing: -1 | 1 = 1): MotionState => ({
  x,
  y: 0,
  velocityX: 0,
  velocityY: 0,
  facing,
  grounded: true,
  crouching: false,
  dashing: false,
  dashUntilMs: 0,
  dashCooldownUntilMs: 0,
  invulnerableUntilMs: nowMs,
  coyoteUntilMs: nowMs,
  jumpBufferUntilMs: 0,
  actionPhase: 'idle'
});

const approach = (value: number, target: number, amount: number): number => {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const isDashReady = (state: MotionState, nowMs: number): boolean => nowMs >= state.dashCooldownUntilMs && !state.dashing;

export const isInvulnerable = (state: MotionState, nowMs: number): boolean => nowMs < state.invulnerableUntilMs;

export const startDash = (
  state: MotionState,
  direction: -1 | 1,
  nowMs: number,
  config: MotionConfig = DEFAULT_MOTION_CONFIG
): MotionStep => {
  if (!isDashReady(state, nowMs)) return { state, events: { jumped: false, landed: false, dashed: false, dashEnded: false } };
  const next: MotionState = {
    ...state,
    facing: direction,
    velocityX: direction * (config.dashDistance / (config.dashDurationMs / 1000)),
    dashing: true,
    dashUntilMs: nowMs + config.dashDurationMs,
    dashCooldownUntilMs: nowMs + config.dashCooldownMs,
    invulnerableUntilMs: nowMs + config.dashInvulnerabilityMs,
    crouching: false
  };
  return { state: next, events: { jumped: false, landed: false, dashed: true, dashEnded: false } };
};

export const stepMotion = (
  state: MotionState,
  input: MotionInput,
  deltaMs: number,
  nowMs: number,
  config: MotionConfig = DEFAULT_MOTION_CONFIG
): MotionStep => {
  const dt = Math.max(0, Math.min(deltaMs, 50)) / 1000;
  let jumpBufferUntilMs = input.jumpPressed ? nowMs + config.jumpBufferMs : state.jumpBufferUntilMs;
  let next = { ...state };
  let jumped = false;
  let landed = false;
  let dashed = false;
  const dashEnded = state.dashing && nowMs >= state.dashUntilMs;

  if (input.dashPressed && isDashReady(next, nowMs)) {
    const dash = startDash(next, input.dashDirection || input.horizontal || next.facing, nowMs, config);
    next = dash.state;
    dashed = dash.events.dashed;
  }

  if (next.dashing) {
    const activeDashMs = Math.max(0, Math.min(deltaMs, next.dashUntilMs - nowMs));
    const dashFinished = nowMs + deltaMs >= next.dashUntilMs;
    const dashTarget = next.x + next.velocityX * (activeDashMs / 1000);
    next = {
      ...next,
      x: clamp(dashTarget, config.minX, config.maxX),
      y: 0,
      velocityY: 0,
      grounded: true,
      crouching: false,
      dashing: !dashFinished,
      velocityX: dashFinished ? 0 : next.velocityX
    };
    if (!next.dashing) next = { ...next, dashUntilMs: nowMs };
    return { state: next, events: { jumped: false, landed: false, dashed, dashEnded: dashFinished || dashEnded } };
  }

  if (input.horizontal) next = { ...next, facing: input.horizontal };
  const targetSpeed = input.horizontal * config.maxSpeed;
  const rate = input.horizontal ? config.acceleration : config.friction;
  const velocityX = approach(next.velocityX, targetSpeed, rate * dt);
  const wasGrounded = next.grounded;
  let y = next.y + next.velocityY * dt;
  let velocityY = next.velocityY + config.gravity * dt;
  let grounded = next.grounded;

  if (input.jumpPressed) jumpBufferUntilMs = nowMs + config.jumpBufferMs;
  if (jumpBufferUntilMs >= nowMs && (next.grounded || nowMs <= next.coyoteUntilMs)) {
    velocityY = config.jumpVelocity;
    y = 0;
    grounded = false;
    jumped = true;
    jumpBufferUntilMs = 0;
  } else if (y >= 0) {
    if (!wasGrounded && next.velocityY > 0) landed = true;
    y = 0;
    velocityY = 0;
    grounded = true;
  } else {
    grounded = false;
  }

  const coyoteUntilMs = jumped ? nowMs : grounded ? nowMs + config.coyoteTimeMs : (wasGrounded ? nowMs + config.coyoteTimeMs : next.coyoteUntilMs);
  return {
    state: {
      ...next,
      x: clamp(next.x + velocityX * dt, config.minX, config.maxX),
      y,
      velocityX,
      velocityY,
      grounded,
      crouching: input.crouching && grounded,
      dashing: false,
      coyoteUntilMs,
      jumpBufferUntilMs
    },
    events: { jumped, landed, dashed, dashEnded }
  };
};

export const interpolate = (from: number, to: number, alpha: number): number => from + (to - from) * clamp(alpha, 0, 1);
