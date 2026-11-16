import { useEffect, useState } from 'react';
import { CalendarDays, CircleCheck, CircleDashed, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { eventApi } from '../../api/eventapi';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [counts, setCounts] = useState({ all: 0, active: 0, draft: 0, canceled: 0, completed: 0 });

  useEffect(() => onClose(), [location.pathname, onClose]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    eventApi.listOrganizerEvents('all').then((response) => {
      if (!isMounted || !response.success) return;
      const events = response.data.events;
      setCounts({
        all: events.length,
        active: events.filter((event) => event.status === 'published').length,
        draft: events.filter((event) => event.status === 'draft').length,
        canceled: events.filter((event) => event.status === 'canceled').length,
        completed: events.filter((event) => event.status === 'completed').length,
      });
    }).catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive ? 'font-medium text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'}`;

  const navContent = (
    <>
      <nav aria-label="Dashboard navigation" className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Events</p>
        {[
          { to: '/dashboard/events/all', label: 'All events', icon: CalendarDays, count: counts.all },
          { to: '/dashboard/events/active', label: 'Active', icon: CircleCheck, count: counts.active },
          { to: '/dashboard/events/draft', label: 'Draft', icon: CircleDashed, count: counts.draft },
          { to: '/dashboard/events/canceled', label: 'Canceled', icon: XCircle, count: counts.canceled },
          { to: '/dashboard/events/completed', label: 'Completed', icon: CircleCheck, count: counts.completed },
        ].map(({ to, label, icon: Icon, count }) => (
          <NavLink key={to} to={to} className={linkClass}>
            {({ isActive }) => <>
              {isActive && <motion.span layoutId="dashboard-nav-indicator" className="absolute inset-0 rounded-xl bg-white/10" transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }} />}
              <Icon className="relative h-4 w-4" aria-hidden="true" />
              <span className="relative flex-1">{label}</span>
              <span className={`relative rounded-full px-2 py-0.5 text-xs tabular-nums ${isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-white/55'}`}>{count}</span>
            </>}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0F0E0C]/80 px-4 py-6 backdrop-blur-xl lg:block" aria-label="Dashboard sidebar">
        {navContent}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation drawer"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              id="mobile-dashboard-sidebar"
              aria-label="Dashboard sidebar"
              initial={prefersReducedMotion ? { x: 0 } : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={prefersReducedMotion ? { x: 0 } : { x: '-100%' }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
              className="fixed inset-y-0 left-0 z-50 w-[min(19rem,86vw)] overflow-y-auto border-r border-white/10 bg-[#0F0E0C]/95 px-4 py-6 backdrop-blur-xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-semibold text-white">Navigation</span>
                <button type="button" aria-label="Close navigation" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
