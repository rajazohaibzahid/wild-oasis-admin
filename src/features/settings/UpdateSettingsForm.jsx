import { useForm } from 'react-hook-form';
import { useUpdateSetting } from './useUpdateSetting';
import Input from '../../ui/Input';
import FormRow from '../../ui/FormRow';
import Button from '../../ui/Button';

function UpdateSettingsForm({ settings }) {
  const { updateSetting, isUpdating } = useUpdateSetting();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isDirty },
    reset,
  } = useForm({ defaultValues: settings });
  function onSubmit(values) {
    updateSetting(values, { onSuccess: (updated) => reset(updated) });
  }
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900"
    >
      <fieldset disabled={isUpdating} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Reservation preferences</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Changes apply to future quotes and reservations. Existing booking prices and stay dates
            remain unchanged.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormRow
            id="min_booking_length"
            label="Minimum nights per booking"
            error={errors.min_booking_length?.message}
          >
            <Input
              id="min_booking_length"
              type="number"
              {...register('min_booking_length', {
                valueAsNumber: true,
                required: 'Required',
                min: { value: 1, message: 'At least 1 night.' },
                max: 32767,
                validate: Number.isInteger,
              })}
            />
          </FormRow>
          <FormRow
            id="max_booking_length"
            label="Maximum nights per booking"
            error={errors.max_booking_length?.message}
          >
            <Input
              id="max_booking_length"
              type="number"
              {...register('max_booking_length', {
                valueAsNumber: true,
                required: 'Required',
                max: 32767,
                validate: (value) =>
                  (Number.isInteger(value) && value >= getValues('min_booking_length')) ||
                  'Must be at least the minimum stay.',
              })}
            />
          </FormRow>
          <FormRow
            id="max_guests_per_booking"
            label="Maximum guests per booking"
            error={errors.max_guests_per_booking?.message}
          >
            <Input
              id="max_guests_per_booking"
              type="number"
              {...register('max_guests_per_booking', {
                valueAsNumber: true,
                required: 'Required',
                min: 1,
                max: { value: 20, message: 'Maximum 20 guests.' },
                validate: Number.isInteger,
              })}
            />
          </FormRow>
          <FormRow
            id="breakfast_price"
            label="Breakfast / guest / night (USD)"
            error={errors.breakfast_price?.message}
          >
            <Input
              id="breakfast_price"
              type="number"
              step="0.01"
              {...register('breakfast_price', {
                valueAsNumber: true,
                required: 'Required',
                min: { value: 0, message: 'Cannot be negative.' },
              })}
            />
          </FormRow>
          <FormRow
            id="max_advance_days"
            label="Booking horizon (days)"
            error={errors.max_advance_days?.message}
          >
            <Input
              id="max_advance_days"
              type="number"
              {...register('max_advance_days', {
                valueAsNumber: true,
                required: 'Required',
                min: 1,
                max: { value: 730, message: 'Maximum 730 days.' },
                validate: (value) =>
                  (Number.isInteger(value) && value >= getValues('min_booking_length')) ||
                  'The horizon must allow at least the minimum stay.',
              })}
            />
          </FormRow>
        </div>
        <p className="text-xs text-stone-500">Currency: USD · Property timezone: Asia/Karachi</p>
        <div className="flex justify-end gap-3 border-t border-stone-200 pt-5 dark:border-stone-800">
          <Button variant="secondary" onClick={() => reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isUpdating || !isDirty}>
            {isUpdating ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
export default UpdateSettingsForm;
