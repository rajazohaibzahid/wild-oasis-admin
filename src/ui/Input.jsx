function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-950 ${className}`}
      {...props}
    />
  );
}
export default Input;
