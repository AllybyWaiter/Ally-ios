import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ToastNavigationCleanup } from './ToastNavigationCleanup';

const { mockSonnerDismiss, mockLegacyDismiss } = vi.hoisted(() => ({
  mockSonnerDismiss: vi.fn(),
  mockLegacyDismiss: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    dismiss: mockSonnerDismiss,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    dismiss: mockLegacyDismiss,
    toast: vi.fn(),
    toasts: [],
  }),
}));

function NavigationButton() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate('/next')}>
      Go next
    </button>
  );
}

describe('ToastNavigationCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dismisses toasts when route changes', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/start']}>
        <ToastNavigationCleanup />
        <NavigationButton />
        <Routes>
          <Route path="/start" element={<div>Start</div>} />
          <Route path="/next" element={<div>Next</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(mockSonnerDismiss).not.toHaveBeenCalled();
    expect(mockLegacyDismiss).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /go next/i }));

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(mockSonnerDismiss).toHaveBeenCalledTimes(1);
      expect(mockLegacyDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
