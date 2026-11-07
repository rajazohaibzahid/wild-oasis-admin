import PageHeading from '../ui/PageHeading';
import BookingTable from '../features/bookings/BookingTable';
import BookingTableOperations from '../features/bookings/BookingTableOperations';
function Bookings() {
  return (
    <>
      <PageHeading
        title="Every stay, considered"
        description="Manage reservations from arrival to a fond farewell."
      />
      <BookingTableOperations />
      <BookingTable />
    </>
  );
}
export default Bookings;
