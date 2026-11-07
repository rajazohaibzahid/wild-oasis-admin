import { useForm } from 'react-hook-form';
import { useUpdateUser } from './useUpdateUser';
import Input from '../../ui/Input';
import FormRow from '../../ui/FormRow';
import Button from '../../ui/Button';
function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm();
  const { updateUser, isUpdating } = useUpdateUser();
  function onSubmit(values) {
    updateUser(values, { onSuccess: () => reset() });
  }
  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-lg font-semibold">Change password</h2>
      <FormRow
        id="currentPassword"
        label="Current password"
        error={errors.currentPassword?.message}
      >
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register('currentPassword', { required: 'Enter your current password.' })}
        />
      </FormRow>
      <FormRow id="newPassword" label="New password" error={errors.password?.message}>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register('password', {
            required: 'Enter a password.',
            minLength: { value: 12, message: 'Use at least 12 characters.' },
          })}
        />
      </FormRow>
      <FormRow
        id="confirmPassword"
        label="Confirm password"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword', {
            validate: (value) => value === getValues('password') || 'Passwords must match.',
          })}
        />
      </FormRow>
      <Button type="submit" disabled={isUpdating}>
        Update password
      </Button>
    </form>
  );
}
export default UpdatePasswordForm;
