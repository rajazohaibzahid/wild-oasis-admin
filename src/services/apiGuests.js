import { requireSupabase } from './supabase';
import { PAGE_SIZE } from '../utils/constants';

export async function getGuests({ search = '', page = 1, contact = 'all' }) {
  let query = requireSupabase()
    .from('guests')
    .select('id,full_name,email,phone,nationality,created_at', { count: 'exact' });
  // Restrict PostgREST filter punctuation while retaining common names and email characters.
  const term = search.replace(/[^\p{L}\p{N}@. +_-]/gu, '').slice(0, 100);
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  if (contact === 'with-phone') query = query.not('phone', 'is', null).neq('phone', '');
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { guests: data, count };
}

export async function getGuest(id) {
  const { data, error } = await requireSupabase()
    .from('guests')
    .select('id,full_name,email,phone,nationality,created_at')
    .eq('id', id)
    .single();
  if (error) throw new Error('Guest not found or access denied.');
  return data;
}
