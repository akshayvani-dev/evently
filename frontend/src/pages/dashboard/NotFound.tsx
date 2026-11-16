import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.045] px-6 py-12 text-center">
      <h2 className="text-2xl font-semibold text-white">Page not found</h2>
      <p className="mt-2 text-sm text-white/65">That dashboard page doesn’t exist.</p>
      <Link to="/dashboard/events/all" className="mt-5 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-[#FFB17E] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        Return to overview
      </Link>
    </section>
  );
}

export default NotFound;
