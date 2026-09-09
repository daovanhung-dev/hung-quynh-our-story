export type ComboInput = 'light' | 'heavy' | 'weapon';
export type ComboAction = 'light-1' | 'light-2' | 'heavy-finisher' | 'weapon-chain' | 'reset-light' | 'rejected';

export interface ComboState {
  readonly count: number;
  readonly lastInput: ComboInput | null;
  readonly lastInputAtMs: number;
  readonly expiresAtMs: number;
}

export const COMBO_WINDOW_MS = 420;
export const COMBO_RESET_MS = 450;

export const createComboState = (): ComboState => ({ count: 0, lastInput: null, lastInputAtMs: -Infinity, expiresAtMs: 0 });

export const resetCombo = (): ComboState => createComboState();

export const comboExpired = (state: ComboState, nowMs: number): boolean => state.count > 0 && nowMs > state.expiresAtMs;

export const advanceCombo = (state: ComboState, input: ComboInput, nowMs: number): { readonly state: ComboState; readonly action: ComboAction } => {
  const expired = comboExpired(state, nowMs);
  const current = expired ? createComboState() : state;
  const withinLightWindow = nowMs - current.lastInputAtMs <= COMBO_WINDOW_MS;
  if (input === 'light') {
    const count = current.count === 1 && withinLightWindow ? 2 : 1;
    return { state: { count, lastInput: input, lastInputAtMs: nowMs, expiresAtMs: nowMs + COMBO_RESET_MS }, action: count === 2 ? 'light-2' : (current.count ? 'reset-light' : 'light-1') };
  }
  if (input === 'heavy' && current.count >= 2 && nowMs <= current.expiresAtMs) {
    return { state: { count: 3, lastInput: input, lastInputAtMs: nowMs, expiresAtMs: nowMs + COMBO_RESET_MS }, action: 'heavy-finisher' };
  }
  if (input === 'weapon' && current.count >= 2 && nowMs <= current.expiresAtMs) {
    return { state: { count: current.count + 1, lastInput: input, lastInputAtMs: nowMs, expiresAtMs: nowMs + COMBO_RESET_MS }, action: 'weapon-chain' };
  }
  return { state: current, action: 'rejected' };
};
