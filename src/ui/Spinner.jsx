import { LoaderCircle } from 'lucide-react';
function Spinner() {
  return (
    <div role="status" className="flex justify-center gap-3 py-16 text-stone-500">
      <LoaderCircle className="animate-spin" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  );
}
export default Spinner;
