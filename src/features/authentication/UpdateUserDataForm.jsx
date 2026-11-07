import { useForm } from 'react-hook-form';
import { useUser } from './useUser';
import { useUpdateUser } from './useUpdateUser';
import Input from '../../ui/Input';
import FormRow from '../../ui/FormRow';
import Button from '../../ui/Button';
function UpdateUserDataForm() {
  const { user } = useUser();
  const { updateUser, isUpdating } = useUpdateUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { fullName: user?.user_metadata?.full_name || '' } });
  return (
    <form className="space-y-5" onSubmit={handleSubmit(updateUser)}>
      <h2 className="text-lg font-semibold">Profile details</h2>
      <FormRow id="account-email" label="Email">
        <Input id="account-email" value={user?.email || ''} disabled />
      </FormRow>
      <FormRow id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          {...register('fullName', {
            required: 'Enter your name.',
            minLength: { value: 2, message: 'Use at least 2 characters.' },
            maxLength: 100,
          })}
        />
      </FormRow>
      <Button type="submit" disabled={isUpdating}>
        Save profile
      </Button>
    </form>
  );
}
export default UpdateUserDataForm;
