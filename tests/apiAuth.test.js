import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateCurrentUser } from '../src/services/apiAuth';
const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  from: vi.fn(),
}));
vi.mock('../src/services/supabase', () => ({
  requireSupabase: () => ({ auth: mocks, from: mocks.from }),
}));
beforeEach(() => vi.resetAllMocks());
describe('Staff profile updates', () => {
  it('updates display metadata without silently editing guest records', async () => {
    mocks.updateUser.mockResolvedValue({ data: { user: { id: 'staff' } }, error: null });
    await updateCurrentUser({ fullName: '  Staff Display Name  ' });
    expect(mocks.updateUser).toHaveBeenCalledWith({ data: { full_name: 'Staff Display Name' } });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('reports a failed metadata update', async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: 'Please sign in again' } });
    await expect(updateCurrentUser({ fullName: 'Staff Name' })).rejects.toThrow(
      'Please sign in again',
    );
  });
  it('does not change password when current-password verification fails', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { email: 'staff@example.invalid' } },
      error: null,
    });
    mocks.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login' } });
    await expect(
      updateCurrentUser({ password: 'new-password-123', currentPassword: 'wrong' }),
    ).rejects.toThrow('current password');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
