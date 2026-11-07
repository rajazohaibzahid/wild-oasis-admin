import { Link } from 'react-router-dom';
import { House, Users, Coffee, Mail, Phone, Globe } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
function BookingDataBox({ booking }) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#173e35] px-6 py-5 text-white">
        <p className="flex items-center gap-3 font-semibold">
          <House size={20} />
          {booking.num_nights} nights in {booking.cabins?.name}
        </p>
        <p className="text-sm text-emerald-50/70">
          {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
        </p>
      </div>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            to={`/guests/${booking.guest_id}`}
            className="flex items-center gap-2 font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
          >
            <Users size={17} />
            {booking.guests?.full_name || 'Guest'}
          </Link>
          <span className="text-sm text-stone-500">{booking.num_guests} guests</span>
          <span className="flex items-center gap-2 text-sm text-stone-500">
            <Mail size={15} />
            {booking.guests?.email}
          </span>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-stone-500">
          {booking.guests?.phone && (
            <span className="flex items-center gap-2">
              <Phone size={15} />
              {booking.guests.phone}
            </span>
          )}
          {booking.guests?.nationality && (
            <span className="flex items-center gap-2">
              <Globe size={15} />
              {booking.guests.nationality}
            </span>
          )}
          <span className="flex items-center gap-2">
            <Coffee size={15} />
            Breakfast {booking.has_breakfast ? 'included' : 'not included'}
          </span>
        </div>
        {booking.observations && (
          <div className="rounded-lg bg-stone-50 p-4 text-sm leading-6 dark:bg-stone-800">
            <p className="mb-1 font-semibold">Guest notes</p>
            <p className="whitespace-pre-wrap">{booking.observations}</p>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-3 rounded-lg bg-stone-50 p-5 dark:bg-stone-800">
          <div>
            <p className="font-semibold">
              Total reservation: {formatCurrency(booking.total_price)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Cabin {formatCurrency(booking.cabin_price)} + extras{' '}
              {formatCurrency(booking.extras_price)}
            </p>
          </div>
          <p
            className={`text-sm font-semibold ${booking.is_paid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}
          >
            {booking.is_paid ? 'Payment recorded' : 'Awaiting payment'}
            {booking.is_demo && ' · Demo reservation'}
          </p>
        </div>
        <p className="text-xs text-stone-500">
          Created {formatDate(booking.created_at)} · Reference {booking.id.slice(0, 8)}
        </p>
      </div>
    </section>
  );
}
export default BookingDataBox;
