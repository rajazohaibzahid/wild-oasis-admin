import { describe, expect, it, vi } from 'vitest';
import { getTodayActivity } from '../src/services/apiDashboard';
const mocks = vi.hoisted(() => ({ filter: vi.fn() }));
vi.mock('../src/services/supabase', () => ({
  requireSupabase: () => ({ from: () => ({ select: () => ({ or: mocks.filter }) }) }),
}));
describe('Today activity', () => {
  it('includes late arrivals still eligible for check-in, not only same-day starts', async () => {
    const query = { order: vi.fn() };
    query.order.mockReturnValueOnce(query).mockResolvedValueOnce({ data: [], error: null });
    mocks.filter.mockReturnValue(query);
    await getTodayActivity();
    expect(mocks.filter).toHaveBeenCalledWith(
      expect.stringMatching(/status\.eq\.confirmed,start_date\.lte\.[\d-]+,end_date\.gt\./),
    );
  });
});
