import { Link } from 'react-router-dom';
import Tag from '../../ui/Tag';
import { formatCurrency, formatDate } from '../../utils/helpers';

function BookingRow({ booking }) {
  return (
    <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
      <td className="whitespace-nowrap px-5 py-4 font-semibold">
        {booking.cabins?.name || 'Cabin unavailable'}
      </td>
      <td className="px-5 py-4">
        <p className="whitespace-nowrap font-medium">{booking.guests?.full_name || 'Guest'}</p>
        <p className="mt-1 text-xs text-stone-500">{booking.guests?.email}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <p>
          {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {booking.num_nights} nights · {booking.num_guests} guests
        </p>
      </td>
      <td className="px-5 py-4">
        <Tag status={booking.status} />
      </td>
      <td className="px-5 py-4">
        <p className="font-medium tabular-nums">{formatCurrency(booking.total_price)}</p>
        <p className="mt-1 text-xs text-stone-500">
          {booking.is_demo ? 'Demo · ' : ''}
          {booking.is_paid ? 'Paid' : 'Unpaid'}
        </p>
      </td>
      <td className="px-5 py-4">
        <Link
          to={`/bookings/${booking.id}`}
          className="whitespace-nowrap font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
        >
          View details →
        </Link>
      </td>
    </tr>
  );
}
export default BookingRow;
