import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../bookings/useBooking';
import { useCheckin } from './useCheckin';
import BookingDataBox from '../bookings/BookingDataBox';
import PageHeading from '../../ui/PageHeading';
import Button from '../../ui/Button';
import Spinner from '../../ui/Spinner';
import ErrorFallback from '../../ui/ErrorFallback';
import { getToday } from '../../utils/helpers';

function CheckinBooking() {
  const { booking, isLoading, error, refetch } = useBooking();
  const { checkin, isCheckingIn } = useCheckin();
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  const canCheckIn =
    booking.status === 'confirmed' &&
    booking.start_date <= getToday() &&
    booking.end_date > getToday();
  return (
    <>
      <PageHeading
        title="Welcome your guest"
        description="Confirm arrival and begin a wonderful stay."
      />
      <BookingDataBox booking={booking} />
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <p className="mb-5 text-sm text-stone-500">
          Check-in records arrival only. Payment remains {booking.is_paid ? 'paid' : 'unpaid'}.
        </p>
        {canCheckIn ? (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="accent-emerald-800"
            />
            I confirm this guest has arrived at the property.
          </label>
        ) : (
          <p role="alert" className="text-sm text-amber-700">
            This booking is not eligible for check-in today.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Link to={`/bookings/${booking.id}`} className="rounded-lg px-4 py-3 text-sm">
            Go back
          </Link>
          <Button
            disabled={!canCheckIn || !confirmed || isCheckingIn}
            onClick={() =>
              checkin(booking.id, { onSuccess: () => navigate(`/bookings/${booking.id}`) })
            }
          >
            {isCheckingIn ? 'Checking in…' : 'Confirm check-in'}
          </Button>
        </div>
      </div>
    </>
  );
}
export default CheckinBooking;
