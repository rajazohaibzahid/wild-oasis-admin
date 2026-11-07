import { requireSupabase } from './supabase';
import { BOOKING_STATUSES, PAGE_SIZE } from '../utils/constants';

const bookingColumns =
  '*, cabins(id, name, image), guests(id, full_name, email, phone, nationality)';

export async function getBookings({ status, sortBy = 'start_date-desc', page = 1, guestId }) {
  let query = requireSupabase().from('bookings').select(bookingColumns, { count: 'exact' });
  if (BOOKING_STATUSES.includes(status)) query = query.eq('status', status);
  if (guestId) query = query.eq('guest_id', guestId);
  const [field, direction] = sortBy.split('-');
  const sortField = ['start_date', 'total_price', 'created_at'].includes(field)
    ? field
    : 'start_date';
  const { data, count, error } = await query
    .order(sortField, { ascending: direction === 'asc' })
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { bookings: data, count };
}

export async function getBooking(id) {
  const { data, error } = await requireSupabase()
    .from('bookings')
    .select(bookingColumns)
    .eq('id', id)
    .single();
  if (error) throw new Error('Booking not found or access denied.');
  return data;
}

async function runStaffOperation(name, args) {
  const { data, error } = await requireSupabase().rpc(name, args);
  if (error?.code === 'PGRST202')
    throw new Error('This staff operation is awaiting the approved database migration.');
  if (error) throw new Error(error.message);
  return data;
}

export async function checkinBooking(id) {
  return runStaffOperation('staff_check_in', { p_booking: id });
}
export async function checkoutBooking(id) {
  return runStaffOperation('staff_check_out', { p_booking: id });
}
export async function cancelBooking({ id, reason }) {
  return runStaffOperation('staff_cancel_booking', { p_booking: id, p_reason: reason });
}
export async function recordPayment({ id, reference }) {
  return runStaffOperation('staff_record_payment', { p_booking: id, p_reference: reference });
}

export async function getBookingAudit(id) {
  const { data, error } = await requireSupabase().rpc('staff_booking_audit', { p_booking: id });
  if (error?.code === 'PGRST202')
    throw new Error('Booking audit is awaiting the approved database migration.');
  if (error) throw new Error(error.message);
  return data;
}
