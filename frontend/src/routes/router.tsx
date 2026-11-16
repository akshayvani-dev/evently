import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/sections/Hero';
import { EventsGrid } from '../components/sections/EventsGrid';
import { HowItWorks } from '../components/sections/HowItWorks';
import { ForOrganizers } from '../components/sections/ForOrganizers';
import { CtaBanner } from '../components/sections/CtaBanner';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { AuthPage } from '../pages/AuthPage';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Overview } from '../pages/dashboard/Overview';
import { EventsList } from '../pages/dashboard/EventsList';
import { CreateEvent } from '../pages/dashboard/CreateEvent';
import { NotFound } from '../pages/dashboard/NotFound';
import { smoothScrollTo } from '../lib/utils';

function LandingPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => smoothScrollTo(hash), 60);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return <><Hero /><EventsGrid /><HowItWorks /><ForOrganizers /><CtaBanner /></>;
}

function MainLayout({ children }: { children: ReactNode }) {
  return <><Navbar /><main className="flex-1">{children}</main><Footer /></>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
      <Route path="/event-details/:id" element={<MainLayout><EventDetailsPage /></MainLayout>} />
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="events" element={<Outlet />}>
            <Route index element={<Navigate to="all" replace />} />
            <Route path="all" element={<EventsList status="all" />} />
            <Route path="active" element={<EventsList status="active" />} />
            <Route path="draft" element={<EventsList status="draft" />} />
            <Route path="canceled" element={<EventsList status="canceled" />} />
            <Route path="completed" element={<EventsList status="completed" />} />
            <Route path="create" element={<CreateEvent />} />
            <Route path=":eventId" element={<EventDetailsPage backTo="/dashboard/events/all" dashboardMode />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
    </Routes>
  );
}

export default AppRouter;
