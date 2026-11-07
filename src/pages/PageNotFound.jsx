import { Link } from 'react-router-dom';
function PageNotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-xs tracking-widest text-emerald-700 uppercase">
        404 · A little off the trail
      </p>
      <h1 className="mt-4 font-display text-5xl">This page is out of reach.</h1>
      <Link
        to="/dashboard"
        className="mt-8 inline-block rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white"
      >
        Return to overview
      </Link>
    </main>
  );
}
export default PageNotFound;
