import { Link } from 'react-router-dom';
import Tag from '../../ui/Tag';
function TodayItem({ activity }) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-stone-100 py-4 last:border-0 dark:border-stone-800">
      <Tag status={activity.status} />
      <div className="min-w-24 flex-1">
        <p className="text-sm font-semibold">{activity.guests?.full_name || 'Guest'}</p>
        <p className="mt-1 text-xs text-stone-500">
          {activity.cabins?.name} · {activity.num_guests} guests
        </p>
      </div>
      <Link
        to={
          activity.status === 'confirmed' ? `/checkin/${activity.id}` : `/bookings/${activity.id}`
        }
        className="text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
      >
        {activity.status === 'confirmed' ? 'Check in' : 'View checkout'} →
      </Link>
    </li>
  );
}
export default TodayItem;
