import { useRecentBookings } from './useRecentBookings';
import Stats from './Stats';
import SalesChart from './SalesChart';
import DurationChart from './DurationChart';
import TodayActivity from '../check-in-out/TodayActivity';
import Spinner from '../../ui/Spinner';
import ErrorFallback from '../../ui/ErrorFallback';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

function DashboardLayout() {
  const { data, isLoading, error, refetch } = useRecentBookings();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  return (
    <div className="space-y-6">
      <Stats data={data} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SalesChart daily={data.daily} />
        <DurationChart durations={data.durations} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <TodayActivity />
        <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="text-lg font-semibold">Recent reservations</h2>
          <p className="mt-1 mb-5 text-xs text-stone-500">Latest bookings across the property</p>
          {!data.recent.length && (
            <p className="py-10 text-center text-sm text-stone-500">
              Your next guest story starts here.
            </p>
          )}
          <ul>
            {data.recent.map((booking) => (
              <li
                key={booking.id}
                className="flex justify-between gap-4 border-b border-stone-100 py-4 last:border-0 dark:border-stone-800"
              >
                <div>
                  <Link
                    to={`/bookings/${booking.id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {booking.guest_name || 'Guest'} · {booking.cabin_name}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatDate(booking.start_date)} · {booking.num_nights} nights
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(booking.total_price)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="text-xs leading-5 text-stone-400">
        Demo bookings are included in reservation and occupancy counts. Demo payments are excluded
        from recorded collections. Occupancy uses all cabins with active inventory or an overlapping
        stay, and clips occupied nights to the selected dates.
      </p>
    </div>
  );
}
export default DashboardLayout;
