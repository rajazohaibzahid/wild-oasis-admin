function Select({ children, ...props }) {
  return (
    <select
      className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900"
      {...props}
    >
      {children}
    </select>
  );
}
export default Select;
