import { useSearchParams } from 'react-router-dom';
function Filter({ field, options }) {
  const [params, setParams] = useSearchParams();
  const current = params.get(field) || options[0].value;
  function handleChange(value) {
    const next = new URLSearchParams(params);
    next.set(field, value);
    next.set('page', '1');
    setParams(next);
  }
  return (
    <div
      className="flex flex-wrap gap-1 rounded-lg border border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900"
      aria-label={`Filter by ${field}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={current === option.value}
          onClick={() => handleChange(option.value)}
          className={`rounded-md px-3 py-2 text-xs font-medium ${current === option.value ? 'bg-emerald-800 text-white dark:bg-emerald-600' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
export default Filter;
