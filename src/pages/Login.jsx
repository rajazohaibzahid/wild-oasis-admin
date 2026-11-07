import { Trees, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import LoginForm from '../features/authentication/LoginForm';
import { useUser } from '../features/authentication/useUser';
import { isConfigured } from '../services/supabase';

function Login() {
  const { user } = useUser();
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-[#173e35] p-16 text-white lg:flex">
        <div className="flex items-center gap-3 font-display text-3xl">
          <Trees size={38} />
          Wild Oasis
        </div>
        <div>
          <p className="mb-5 text-xs tracking-[0.3em] text-emerald-100/60 uppercase">
            The art of a thoughtful stay
          </p>
          <h1 className="max-w-lg font-display text-7xl leading-[1.05]">
            Extraordinary stays.
            <br />
            <span className="text-[#ced9b9]">Beautifully managed.</span>
          </h1>
          <p className="mt-8 max-w-sm text-sm leading-7 text-emerald-50/60">
            Your space to care for every cabin, every guest, and every detail in between.
          </p>
        </div>
        <p className="text-xs text-emerald-100/40">Wild Oasis Escapes · Staff workspace</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-emerald-700 uppercase dark:text-emerald-400">
            Wild Oasis Admin
          </p>
          <h2 className="font-display text-5xl font-semibold">Welcome back.</h2>
          <p className="mt-3 mb-9 text-sm leading-6 text-stone-500">
            Sign in with your approved staff account.
          </p>
          {isConfigured ? (
            <LoginForm />
          ) : (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
            >
              Add the new project’s publishable key to <code>.env</code> using{' '}
              <code>.env.example</code>, then restart the development server.
            </div>
          )}
          <p className="mt-8 flex items-center gap-2 text-xs text-stone-500">
            <ShieldCheck size={15} />
            Access is limited to authorized staff.
          </p>
        </div>
      </section>
    </main>
  );
}
export default Login;
