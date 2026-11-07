function Table({ columns, children, caption }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-stone-200 bg-stone-50 text-xs tracking-wider text-stone-500 uppercase dark:border-stone-800 dark:bg-stone-900">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="whitespace-nowrap px-5 py-4 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">{children}</tbody>
      </table>
    </div>
  );
}
export default Table;
