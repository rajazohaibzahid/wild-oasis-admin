import { Link } from 'react-router-dom';
import { useTodayActivity } from './useTodayActivity';
import TodayItem from './TodayItem';
import Spinner from '../../ui/Spinner';
import Empty from '../../ui/Empty';
import ErrorFallback from '../../ui/ErrorFallback';
function TodayActivity() {
  const { activities, isLoading, error, refetch } = useTodayActivity();
  let content = <Empty resource="arrivals or departures today">A quiet day at the oasis.</Empty>;
  if (isLoading) content = <Spinner />;
  else if (error) content = <ErrorFallback error={error} onRetry={refetch} />;
  else if (activities?.length)
    content = (
      <ul>
        {activities.map((activity) => (
          <TodayItem key={activity.id} activity={activity} />
        ))}
      </ul>
    );
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-6 flex justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Today at the oasis</h2>
          <p className="mt-1 text-xs text-stone-500">Arrivals, departures & overdue checkouts</p>
        </div>
        <Link
          to="/bookings"
          className="text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
        >
          All stays →
        </Link>
      </div>
      {content}
    </section>
  );
}
export default TodayActivity;
