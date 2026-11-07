import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '../services/supabase';

export function useAuthSession() {
  const queryClient = useQueryClient();
  useEffect(
    function listenForSessionChanges() {
      if (!supabase) return;
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
          queryClient.setQueryData(['user'], null);
        }
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const previousUser = queryClient.getQueryData(['user']);
          if (previousUser && previousUser.id !== session?.user?.id) queryClient.clear();
          queryClient.setQueryData(['user'], session?.user || null);
          queryClient.invalidateQueries({ queryKey: ['staff-access'] });
        }
      });
      return () => subscription.unsubscribe();
    },
    [queryClient],
  );
}
