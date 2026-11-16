import { useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/dashboard/Header';
import { Sidebar } from '../components/dashboard/Sidebar';

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Overview';
  if (pathname.endsWith('/events/create')) return 'Create event';
  if (pathname.endsWith('/edit')) return 'Edit event';
  if (pathname.endsWith('/attendee/events/my')) return 'My events';
  if (pathname.endsWith('/events/active')) return 'Active events';
  if (pathname.endsWith('/events/draft')) return 'Draft events';
  if (pathname.endsWith('/events/canceled')) return 'Canceled events';
  if (pathname.endsWith('/events/completed')) return 'Completed events';
  if (pathname.endsWith('/events') || pathname.endsWith('/events/all')) return 'All events';
  if (pathname.startsWith('/dashboard/events/')) return 'Event details';
  return 'Dashboard';
}

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const closeDrawer = useCallback(() => setMobileOpen(false), []);
  const openDrawer = useCallback(() => setMobileOpen(true), []);
  const title = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  return (
    <div className="min-h-screen flex-1 text-text">
      <Header title={title} onMenuClick={openDrawer} mobileOpen={mobileOpen} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar mobileOpen={mobileOpen} onClose={closeDrawer} />
        <main id="dashboard-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
