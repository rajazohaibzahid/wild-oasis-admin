import { useQuery } from '@tanstack/react-query';
import { getStaffAccess } from '../../services/apiAuth';

export function useStaffAccess(userId) {
  const {
    data: isStaff,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff-access', userId],
    queryFn: getStaffAccess,
    enabled: Boolean(userId),
    staleTime: 0,
    retry: false,
    refetchInterval: 60000,
  });
  return { isStaff, isLoading, error, refetch };
}
