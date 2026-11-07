import Filter from '../../ui/Filter';
import SortBy from '../../ui/SortBy';
function BookingTableOperations() {
  return (
    <div className="mb-5 flex flex-wrap justify-between gap-3">
      <Filter
        field="status"
        options={[
          { value: 'all', label: 'All bookings' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'checked_in', label: 'Checked in' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />
      <SortBy
        options={[
          { value: 'start_date-desc', label: 'Date (newest first)' },
          { value: 'start_date-asc', label: 'Date (oldest first)' },
          { value: 'total_price-desc', label: 'Amount (high first)' },
          { value: 'total_price-asc', label: 'Amount (low first)' },
        ]}
      />
    </div>
  );
}
export default BookingTableOperations;
