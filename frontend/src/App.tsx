import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { EventsGrid } from './components/sections/EventsGrid';
import { HowItWorks } from './components/sections/HowItWorks';
import { ForOrganizers } from './components/sections/ForOrganizers';
import { CtaBanner } from './components/sections/CtaBanner';
import { Footer } from './components/layout/Footer';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { AuthPage } from './pages/AuthPage';
import { smoothScrollTo } from './lib/utils';

function LandingPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => {
      smoothScrollTo(hash);
    }, 60);
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

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-transparent text-text flex flex-col">
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <LandingPage />
              </MainLayout>
            }
          />
          <Route
            path="/event-details/:id"
            element={
              <MainLayout>
                <EventDetailsPage />
              </MainLayout>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </div>
    </MotionConfig>
  );
}
