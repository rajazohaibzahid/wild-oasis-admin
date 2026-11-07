function Textarea(props) {
  return (
    <textarea
      rows={4}
      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-950"
      {...props}
    />
  );
}
export default Textarea;
