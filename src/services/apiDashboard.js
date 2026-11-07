import { requireSupabase } from './supabase';
import { getToday } from '../utils/helpers';
import { addDays, format, parseISO } from 'date-fns';

export async function getDashboardData(numDays) {
  const today = getToday();
  const start = format(addDays(parseISO(today), -(numDays - 1)), 'yyyy-MM-dd');
  const { data, error } = await requireSupabase().rpc('staff_dashboard', {
    p_start: start,
    p_end: today,
  });
  if (error?.code === 'PGRST202')
    throw new Error(
      'Dashboard analytics are awaiting the approved staff migration. No sample financial data is shown.',
    );
  if (error) throw new Error(error.message);
  return data;
}

export async function getTodayActivity() {
  const today = getToday();
  const { data, error } = await requireSupabase()
    .from('bookings')
    .select('id,status,start_date,end_date,num_guests,cabins(name),guests(full_name)')
    .or(
      `and(status.eq.confirmed,start_date.eq.${today}),and(status.eq.checked_in,end_date.lte.${today})`,
    )
    .order('start_date')
    .order('id');
  if (error) throw new Error(error.message);
  return data;
}
