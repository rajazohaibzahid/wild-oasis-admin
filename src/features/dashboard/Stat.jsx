function Stat({ title, value, detail, icon: Icon }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{title}</p>
        <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Icon size={18} />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-stone-400">{detail}</p>
    </article>
  );
}
export default Stat;
