import { act, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { useAuthSession } from '../src/hooks/useAuthSession';
const state = vi.hoisted(() => ({ callback: null }));
vi.mock('../src/services/supabase', () => ({
  default: {
    auth: {
      onAuthStateChange: (callback) => {
        state.callback = callback;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  },
}));
function SessionListener() {
  useAuthSession();
  return null;
}
it('clears private caches when an auth event changes the signed-in identity', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['user'], { id: 'staff-a' });
  queryClient.setQueryData(['guests'], [{ id: 'private-guest' }]);
  render(
    <QueryClientProvider client={queryClient}>
      <SessionListener />
    </QueryClientProvider>,
  );
  act(() => state.callback('SIGNED_IN', { user: { id: 'staff-b' } }));
  expect(queryClient.getQueryData(['guests'])).toBeUndefined();
  expect(queryClient.getQueryData(['user'])).toEqual({ id: 'staff-b' });
});
