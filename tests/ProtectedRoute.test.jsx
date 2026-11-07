import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../src/ui/ProtectedRoute';
const state = vi.hoisted(() => ({ user: { id: 'customer' }, isStaff: false, error: null }));
vi.mock('../src/features/authentication/useUser', () => ({
  useUser: () => ({ user: state.user, isLoading: false }),
}));
vi.mock('../src/features/authentication/useStaffAccess', () => ({
  useStaffAccess: () => ({ isStaff: state.isStaff, isLoading: false, error: state.error }),
}));
vi.mock('../src/features/authentication/useLogout', () => ({
  useLogout: () => ({ logout: vi.fn() }),
}));
describe('Staff route boundary', () => {
  it('does not render private content for a customer session', () => {
    state.isStaff = false;
    state.error = null;
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <p>Private dashboard</p>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Staff access required')).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
  });
  it('fails closed when the RPC is unavailable', () => {
    state.isStaff = undefined;
    state.error = new Error('Migration pending');
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <p>Private dashboard</p>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Migration pending')).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
  });
  it('renders the app only for an approved staff member', () => {
    state.isStaff = true;
    state.error = null;
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <p>Private dashboard</p>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });
});
