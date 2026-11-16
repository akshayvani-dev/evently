import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/dashboard/events/all', label: 'All events' },
  { to: '/dashboard/events/active', label: 'Active' },
  { to: '/dashboard/events/draft', label: 'Draft' },
  { to: '/dashboard/events/canceled', label: 'Canceled' },
  { to: '/dashboard/events/completed', label: 'Completed' },
];

export function EventsTabs() {
  return (
    <nav aria-label="Event status tabs" className="mb-6 flex gap-1 overflow-x-auto border-b border-white/15">
      {tabs.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `relative flex min-h-11 shrink-0 items-center rounded-t-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`}
        >
          {({ isActive }) => <>
            {label}
            {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />}
          </>}
        </NavLink>
      ))}
    </nav>
  );
}
