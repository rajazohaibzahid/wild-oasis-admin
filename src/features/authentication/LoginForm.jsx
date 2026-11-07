import { useForm } from 'react-hook-form';
import { useLogin } from './useLogin';
import Input from '../../ui/Input';
import FormRow from '../../ui/FormRow';
import Button from '../../ui/Button';

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { login, isLoggingIn } = useLogin();
  return (
    <form onSubmit={handleSubmit(login)} className="space-y-5">
      <fieldset disabled={isLoggingIn} className="space-y-5">
        <FormRow id="email" label="Email address" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            {...register('email', { required: 'Enter your email address.' })}
          />
        </FormRow>
        <FormRow id="password" label="Password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Enter your password.' })}
          />
        </FormRow>
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? 'Signing in…' : 'Sign in to your workspace'}
        </Button>
      </fieldset>
    </form>
  );
}
export default LoginForm;
