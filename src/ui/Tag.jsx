const colors = {
  confirmed: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  checked_in: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  completed: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  cancelled: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
};
function Tag({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] || colors.completed}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}
export default Tag;
