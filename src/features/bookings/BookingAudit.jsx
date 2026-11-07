import { useQuery } from '@tanstack/react-query';
import { getBookingAudit } from '../../services/apiBookings';
import Spinner from '../../ui/Spinner';
import { formatDate } from '../../utils/helpers';
function BookingAudit({ bookingId }) {
  const {
    data: events,
    isPending,
    error,
  } = useQuery({
    queryKey: ['booking', bookingId, 'audit'],
    queryFn: () => getBookingAudit(bookingId),
  });
  if (isPending) return <Spinner />;
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="mb-4 text-lg font-semibold">Staff activity</h2>
      {error && <p className="text-sm text-stone-500">{error.message}</p>}
      {!error && !events?.length && (
        <p className="text-sm text-stone-500">No staff actions recorded.</p>
      )}
      <ul className="space-y-4">
        {events?.map((event) => (
          <li key={event.id} className="border-l-2 border-emerald-700 pl-4">
            <p className="text-sm font-medium">{event.action.replaceAll('_', ' ')}</p>
            <p className="mt-1 text-xs text-stone-500">
              {formatDate(event.created_at)} · Staff {event.actor_id.slice(0, 8)}
            </p>
            {event.reason && <p className="mt-2 text-sm">{event.reason}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
export default BookingAudit;
