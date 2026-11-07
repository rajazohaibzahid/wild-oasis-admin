import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../../services/apiAuth';
import { isConfigured } from '../../services/supabase';

export function useUser() {
  const {
    data: user,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    enabled: isConfigured,
  });
  return { user, isLoading: isConfigured && isLoading, error, refetch };
}
