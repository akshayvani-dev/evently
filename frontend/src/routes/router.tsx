import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { EventsGrid } from "../components/sections/EventsGrid";
import { HowItWorks } from "../components/sections/HowItWorks";
import { ForOrganizers } from "../components/sections/ForOrganizers";
import { CtaBanner } from "../components/sections/CtaBanner";
import { EventDetailsPage } from "../pages/EventDetailsPage";
import { AuthPage } from "../pages/AuthPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Overview } from "../pages/dashboard/Overview";
import { EventsList } from "../pages/dashboard/EventsList";
import { AttendeeEventsPage } from "../pages/dashboard/AttendeeEventsPage";
import { CreateEvent } from "../pages/dashboard/CreateEvent";
import { EditEvent } from "../pages/dashboard/EditEvent";
import { NotFound } from "../pages/dashboard/NotFound";
import { smoothScrollTo } from "../lib/utils";
import { useAppSelector } from "../store";

function LandingPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => smoothScrollTo(hash), 60);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <Hero />
      <EventsGrid />
      <HowItWorks />
      <ForOrganizers />
      <CtaBanner />
    </>
  );
}

function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

function HomeRoute() {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-label="Verifying your session"
      >
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary"
          aria-hidden="true"
        />
        <span className="sr-only">Verifying your session</span>
      </div>
    );
  }

  return user ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  );
}

function OrganizerRoute() {
  const role = useAppSelector((state) => state.auth.user?.role);
  return role === "organizer" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function AttendeeRoute() {
  const role = useAppSelector((state) => state.auth.user?.role);
  return role === "attendee" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard/events/all" replace />
  );
}

function DashboardIndex() {
  const role = useAppSelector((state) => state.auth.user?.role);
  return role === "attendee" ? (
    <Navigate to="/dashboard/attendee/events/all" replace />
  ) : (
    <Overview />
  );
}

function DashboardEventDetailsRoute() {
  const role = useAppSelector((state) => state.auth.user?.role);
  return role === "organizer" ? (
    <DashboardLayout />
  ) : (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route
        path="/event-details/:id"
        element={
          <MainLayout>
            <EventDetailsPage />
          </MainLayout>
        }
      />
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard/events/:eventId"
          element={<DashboardEventDetailsRoute />}
        >
          <Route index element={<EventDetailsPage />} />
          <Route element={<OrganizerRoute />}>
            <Route path="edit" element={<EditEvent />} />
          </Route>
        </Route>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardIndex />} />
          <Route element={<OrganizerRoute />}>
            <Route path="events" element={<Outlet />}>
              <Route index element={<Navigate to="all" replace />} />
              <Route path="all" element={<EventsList status="all" />} />
              <Route path="active" element={<EventsList status="active" />} />
              <Route path="draft" element={<EventsList status="draft" />} />
              <Route
                path="canceled"
                element={<EventsList status="canceled" />}
              />
              <Route
                path="completed"
                element={<EventsList status="completed" />}
              />
              <Route path="create" element={<CreateEvent />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
          <Route element={<AttendeeRoute />}>
            <Route path="attendee/events" element={<Outlet />}>
              <Route index element={<Navigate to="all" replace />} />
              <Route
                path="all"
                element={<AttendeeEventsPage key="all" view="all" />}
              />
              <Route
                path="my"
                element={<AttendeeEventsPage key="my" view="my" />}
              />
              <Route
                path="canceled"
                element={<AttendeeEventsPage key="canceled" view="canceled" />}
              />
              <Route
                path="completed"
                element={<AttendeeEventsPage key="completed" view="completed" />}
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <MainLayout>
            <NotFound />
          </MainLayout>
        }
      />
    </Routes>
  );
}

export default AppRouter;
