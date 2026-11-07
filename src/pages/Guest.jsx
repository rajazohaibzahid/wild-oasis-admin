import { useGuest } from '../features/guests/useGuest';
import PageHeading from '../ui/PageHeading';
import Spinner from '../ui/Spinner';
import ErrorFallback from '../ui/ErrorFallback';
import BookingTable from '../features/bookings/BookingTable';
import BookingTableOperations from '../features/bookings/BookingTableOperations';
function Guest() {
  const { guest, isLoading, error, refetch } = useGuest();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  return (
    <>
      <PageHeading
        title={guest.full_name || 'Guest profile'}
        description="Contact details and reservation history."
      />
      <dl className="mb-8 grid gap-6 rounded-xl border border-stone-200 bg-white p-6 text-sm dark:border-stone-800 dark:bg-stone-900 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-stone-500">Email address</dt>
          <dd className="mt-2 break-all font-medium">{guest.email}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Phone</dt>
          <dd className="mt-2 font-medium">{guest.phone || 'Not provided'}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Nationality</dt>
          <dd className="mt-2 font-medium">{guest.nationality || 'Not provided'}</dd>
        </div>
      </dl>
      <h2 className="mb-5 text-lg font-semibold">Booking history</h2>
      <BookingTableOperations />
      <BookingTable guestId={guest.id} />
    </>
  );
}
export default Guest;
