import { useQuery } from '@tanstack/react-query';
import { getTodayActivity } from '../../services/apiDashboard';
import { getToday } from '../../utils/helpers';
export function useTodayActivity() {
  const {
    data: activities,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['today-activity', getToday()], queryFn: getTodayActivity });
  return { activities, isLoading, error, refetch };
}
