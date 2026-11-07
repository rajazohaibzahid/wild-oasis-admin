import { useForm } from 'react-hook-form';
import FormRow from '../../ui/FormRow';
import Textarea from '../../ui/Textarea';
import Button from '../../ui/Button';

function BookingActionForm({ action, onSubmit, isWorking, onClose }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const isPayment = action === 'payment';
  let submitLabel = isPayment ? 'Record verified payment' : 'Cancel reservation';
  if (isWorking) submitLabel = 'Saving…';
  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <p className="text-sm leading-6 text-stone-500">
        {isPayment
          ? 'Only record a payment already received and verified outside this application. This does not charge a card. Demo reservations cannot be recorded as collected payments.'
          : 'Cancelling releases inventory and preserves the reservation history. Paid reservations require a separate refund workflow and cannot be cancelled here.'}
      </p>
      <FormRow
        id="reason"
        label={isPayment ? 'Payment receipt / reconciliation reference' : 'Cancellation reason'}
        error={errors.reason?.message}
      >
        <Textarea
          id="reason"
          disabled={isWorking}
          {...register('reason', {
            required: 'A reference or reason is required.',
            minLength: { value: 5, message: 'Use at least 5 characters.' },
            maxLength: { value: 500, message: 'Use no more than 500 characters.' },
          })}
        />
      </FormRow>
      {isPayment && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required
            className="mt-1 accent-emerald-800"
            disabled={isWorking}
          />
          I have independently verified receipt of the full booking amount.
        </label>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" disabled={isWorking} onClick={onClose}>
          Go back
        </Button>
        <Button type="submit" variant={isPayment ? 'primary' : 'danger'} disabled={isWorking}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
export default BookingActionForm;
