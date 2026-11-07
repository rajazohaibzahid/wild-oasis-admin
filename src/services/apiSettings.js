import { requireSupabase } from './supabase';

export async function getSettings() {
  const { data, error } = await requireSupabase().from('settings').select('*').eq('id', 1).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSetting(values) {
  const {
    min_booking_length,
    max_booking_length,
    max_guests_per_booking,
    breakfast_price,
    max_advance_days,
  } = values;
  if (max_booking_length < min_booking_length)
    throw new Error('Maximum stay cannot be shorter than minimum stay.');
  if (max_advance_days < min_booking_length)
    throw new Error('Booking horizon must allow at least the minimum stay.');
  const { data, error } = await requireSupabase()
    .from('settings')
    .update({
      min_booking_length,
      max_booking_length,
      max_guests_per_booking,
      breakfast_price,
      max_advance_days,
    })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
