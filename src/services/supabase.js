import { createClient } from '@supabase/supabase-js';
import { PROJECT_REF } from '../utils/constants';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const expectedUrl = `https://${PROJECT_REF}.supabase.co`;
export const isConfigured = url === expectedUrl && Boolean(key?.startsWith('sb_publishable_'));

// A separate storage key prevents customer and staff sessions sharing browser state.
const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        storageKey: 'wild-oasis-admin-auth',
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Configure the new project URL and publishable key in .env.');
  return supabase;
}

export default supabase;
