import { Leaf } from 'lucide-react';
function Empty({ resource = 'records', children }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-700">
      <Leaf className="mx-auto mb-4 text-emerald-700" aria-hidden="true" />
      <p className="font-medium">No {resource} found</p>
      <p className="mt-2 text-sm text-stone-500">
        {children || 'Try a different filter or check back later.'}
      </p>
    </div>
  );
}
export default Empty;
