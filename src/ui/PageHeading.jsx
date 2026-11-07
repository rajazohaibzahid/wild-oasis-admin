function PageHeading({ title, description, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
export default PageHeading;
