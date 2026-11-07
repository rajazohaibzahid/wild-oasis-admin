import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../../services/apiSettings';

export function useSettings() {
  const {
    data: settings,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });
  return { settings, isLoading, error, refetch };
}
