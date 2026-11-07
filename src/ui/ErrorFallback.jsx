import Button from './Button';
function ErrorFallback({ error, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <h2 className="font-semibold">Something needs attention</h2>
      <p className="my-3 text-sm">{error?.message || 'Please reload and try again.'}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export default ErrorFallback;
