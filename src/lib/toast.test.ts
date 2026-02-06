import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockSonnerDismiss,
  mockSonnerToast,
  mockTriggerHaptic,
} = vi.hoisted(() => {
  const dismiss = vi.fn();
  const sonnerToast = Object.assign(vi.fn(() => 'toast-id'), {
    dismiss,
    promise: vi.fn(),
  });
  const triggerHaptic = vi.fn();

  return {
    mockSonnerDismiss: dismiss,
    mockSonnerToast: sonnerToast,
    mockTriggerHaptic: triggerHaptic,
  };
});

vi.mock('sonner', () => ({
  toast: mockSonnerToast,
}));

vi.mock('@/hooks/useHaptics', () => ({
  triggerHaptic: mockTriggerHaptic,
}));

import { toast } from './toast';

describe('toast helper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enforces fallback dismissal for finite toasts', () => {
    toast.success('Saved', { duration: 1000 });

    expect(mockSonnerToast).toHaveBeenCalledTimes(1);
    expect(mockTriggerHaptic).toHaveBeenCalledWith('success');

    vi.advanceTimersByTime(1399);
    expect(mockSonnerDismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockSonnerDismiss).toHaveBeenCalledWith('toast-id');
  });

  it('does not schedule fallback dismissal for loading toasts', () => {
    toast.loading('Loading...');

    expect(mockSonnerToast).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(mockSonnerDismiss).not.toHaveBeenCalled();
  });
});
