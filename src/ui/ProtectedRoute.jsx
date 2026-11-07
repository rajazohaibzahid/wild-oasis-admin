import { Navigate } from 'react-router-dom';
import { useUser } from '../features/authentication/useUser';
import { useStaffAccess } from '../features/authentication/useStaffAccess';
import { useLogout } from '../features/authentication/useLogout';
import Spinner from './Spinner';
import ErrorFallback from './ErrorFallback';
import Button from './Button';

function ProtectedRoute({ children }) {
  const { user, isLoading, error } = useUser();
  const {
    isStaff,
    isLoading: isCheckingStaff,
    error: accessError,
    refetch,
  } = useStaffAccess(user?.id);
  const { logout, isLoggingOut } = useLogout();
  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorFallback error={error} />
        <Button onClick={logout} disabled={isLoggingOut}>
          Sign out
        </Button>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (isCheckingStaff) return <Spinner />;
  if (accessError || !isStaff)
    return (
      <main className="mx-auto max-w-xl space-y-6 px-6 py-24">
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
          Wild Oasis Admin
        </p>
        <h1 className="font-display text-4xl">Staff access required</h1>
        {accessError ? (
          <ErrorFallback error={accessError} onRetry={refetch} />
        ) : (
          <p className="text-stone-500">
            This account has not been approved as a staff member. Contact the project owner to
            verify your account and provision membership.
          </p>
        )}
        <Button variant="secondary" disabled={isLoggingOut} onClick={logout}>
          Sign out
        </Button>
      </main>
    );
  return children;
}
export default ProtectedRoute;
