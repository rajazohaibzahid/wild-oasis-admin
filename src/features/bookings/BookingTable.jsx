import { useBookings } from './useBookings';
import BookingRow from './BookingRow';
import Table from '../../ui/Table';
import Spinner from '../../ui/Spinner';
import Empty from '../../ui/Empty';
import ErrorFallback from '../../ui/ErrorFallback';
import Pagination from '../../ui/Pagination';

function BookingTable({ guestId }) {
  const { bookings, count, isLoading, error, refetch } = useBookings(guestId);
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  if (!bookings?.length)
    return (
      <>
        <Empty resource="bookings">Reservations from Wild Oasis Escapes will appear here.</Empty>
        {count > 0 && <Pagination count={count} />}
      </>
    );
  return (
    <>
      <Table
        columns={['Cabin', 'Guest', 'Stay', 'Status', 'Amount', 'Details']}
        caption="Reservations"
      >
        <>
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </>
      </Table>
      <Pagination count={count} />
    </>
  );
}
export default BookingTable;
