import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getDashboardData } from '../../services/apiDashboard';
export function useRecentBookings() {
  const [params] = useSearchParams();
  const value = Number(params.get('last') || 7);
  const numDays = [7, 30, 90].includes(value) ? value : 7;
  const {
    data,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['dashboard', numDays], queryFn: () => getDashboardData(numDays) });
  return { data, numDays, isLoading, error, refetch };
}
