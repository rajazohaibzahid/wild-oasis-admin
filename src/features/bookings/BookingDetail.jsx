import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from './useBooking';
import { useDeleteBooking } from './useDeleteBooking';
import { useRecordPayment } from './useRecordPayment';
import { useCheckout } from '../check-in-out/useCheckout';
import BookingDataBox from './BookingDataBox';
import BookingActionForm from './BookingActionForm';
import BookingAudit from './BookingAudit';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Spinner from '../../ui/Spinner';
import ErrorFallback from '../../ui/ErrorFallback';
import PageHeading from '../../ui/PageHeading';
import Tag from '../../ui/Tag';
import ConfirmDelete from '../../ui/ConfirmDelete';
import { getToday } from '../../utils/helpers';

function BookingDetail() {
  const { booking, isLoading, error, refetch } = useBooking();
  const [action, setAction] = useState(null);
  const { cancelBooking, isCancelling } = useDeleteBooking();
  const { recordPayment, isRecording } = useRecordPayment();
  const { checkout, isCheckingOut } = useCheckout();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  const isBusy = isCancelling || isRecording || isCheckingOut;
  const modalTitle = {
    payment: 'Record verified payment',
    checkout: 'Check out guest',
    cancel: 'Cancel reservation',
  }[action];
  function handleSubmit({ reason }) {
    const options = { onSuccess: () => setAction(null) };
    if (action === 'payment') recordPayment({ id: booking.id, reference: reason }, options);
    else cancelBooking({ id: booking.id, reason }, options);
  }
  return (
    <>
      <PageHeading
        title={`Booking #${booking.id.slice(0, 8)}`}
        description="The complete picture of this stay."
      >
        <Tag status={booking.status} />
      </PageHeading>
      <div className="space-y-6">
        <BookingDataBox booking={booking} />
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            to="/bookings"
            className="mr-auto rounded-lg px-3 py-3 text-sm font-medium text-stone-500 hover:underline"
          >
            ← All bookings
          </Link>
          {booking.status === 'confirmed' &&
            booking.start_date <= getToday() &&
            booking.end_date > getToday() && (
              <Link
                to={`/checkin/${booking.id}`}
                className="rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white"
              >
                Check in
              </Link>
            )}
          {booking.status === 'checked_in' && (
            <Button onClick={() => setAction('checkout')}>Check out</Button>
          )}
          {!booking.is_paid &&
            !booking.is_demo &&
            ['confirmed', 'checked_in', 'completed'].includes(booking.status) && (
              <Button variant="secondary" onClick={() => setAction('payment')}>
                Record payment
              </Button>
            )}
          {booking.status === 'confirmed' && !booking.is_paid && (
            <Button variant="danger" onClick={() => setAction('cancel')}>
              Cancel booking
            </Button>
          )}
        </div>
        <BookingAudit bookingId={booking.id} />
      </div>
      {action && (
        <Modal title={modalTitle} onClose={() => setAction(null)} busy={isBusy}>
          {action === 'checkout' ? (
            <ConfirmDelete
              confirmLabel="Confirm checkout"
              description="Complete this stay? The booking history and payment status will be preserved. Early checkout does not change the reserved dates."
              onClose={() => setAction(null)}
              disabled={isCheckingOut}
              onConfirm={() => checkout(booking.id, { onSuccess: () => setAction(null) })}
            />
          ) : (
            <BookingActionForm
              action={action}
              onSubmit={handleSubmit}
              isWorking={isBusy}
              onClose={() => setAction(null)}
            />
          )}
        </Modal>
      )}
    </>
  );
}
export default BookingDetail;
