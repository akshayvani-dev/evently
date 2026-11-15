import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { AuthTab } from '../lib/validation/auth';
import { Container } from '../components/ui/Container';
import { AuthTabs } from '../components/auth/AuthTabs';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-12">
      <Container className="flex flex-col items-center">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] space-y-6"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight text-[#1A1713] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6E9DC]"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-[#0F0E0C] shadow-sm"
                aria-hidden="true"
              >
                <CalendarDays className="h-4.5 w-4.5" />
              </span>
              <span>Evently</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-[#5C5246] transition-colors hover:text-[#1A1713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to home</span>
            </Link>
          </div>

          <section
            aria-label={activeTab === 'signin' ? 'Sign in to Evently' : 'Create an Evently account'}
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] space-y-6"
          >
            <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                id={`auth-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`auth-tab-${activeTab}`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'signin' ? <SignInForm /> : <SignUpForm />}
              </motion.div>
            </AnimatePresence>
          </section>
        </motion.div>
      </Container>
    </main>
  );
}
