function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const colors = {
    primary:
      'bg-emerald-800 text-white hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-700',
    secondary:
      'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800',
    danger: 'bg-red-700 text-white hover:bg-red-800',
    ghost: 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${colors[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;
