import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScrolled } from '../../hooks/useScrolled';
import { cn, smoothScrollTo } from '../../lib/utils';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';

const NAV_LINKS = [
  { label: 'Events', href: '#events' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For organizers', href: '#for-organizers' },
] as const;

export function Navbar() {
  const scrolled = useScrolled(24);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavigate = (href: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate(`/${href}`);
      return;
    }
    smoothScrollTo(href);
  };

  const handleLogoClick = () => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-white/10 bg-[#0F0E0C]/70 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.28)]'
          : 'border-b border-transparent bg-transparent shadow-none',
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleLogoClick();
            }}
            className={cn(
              'inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight whitespace-nowrap shrink-0 rounded-lg transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              scrolled
                ? 'text-[#F4EFE6] focus-visible:ring-offset-[#0F0E0C]'
                : 'text-[#1A1713] focus-visible:ring-offset-[#F6E9DC]',
            )}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-[#0F0E0C] shadow-sm"
              aria-hidden="true"
            >
              <CalendarDays className="h-4 w-4" />
            </span>
            <span>Evently</span>
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={`/${link.href}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(link.href);
                }}
                className={cn(
                  'relative py-1 text-sm font-medium transition-colors duration-300 whitespace-nowrap shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-200 hover:after:w-full',
                  scrolled
                    ? 'text-[#A8A094] hover:text-[#F4EFE6] after:bg-[#F4EFE6] focus-visible:ring-offset-[#0F0E0C]'
                    : 'text-[#5C5246] hover:text-[#1A1713] after:bg-[#1A1713] focus-visible:ring-offset-[#F6E9DC]',
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                setMobileOpen(false);
                navigate('/auth');
              }}
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-xl border md:hidden transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              scrolled
                ? 'border-white/15 bg-white/10 text-[#F4EFE6] hover:bg-white/15'
                : 'border-[#1A1713]/15 bg-white/40 text-[#1A1713] hover:bg-white/65',
            )}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            id="mobile-nav-menu"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'border-t backdrop-blur-md transition-colors duration-300 md:hidden',
              scrolled
                ? 'border-white/10 bg-[#0F0E0C]/85'
                : 'border-[#1A1713]/10 bg-[#F6E9DC]/85',
            )}
          >
            <Container className="py-5 space-y-4">
              <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={`/${link.href}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate(link.href);
                    }}
                    className={cn(
                      'flex h-11 items-center rounded-xl px-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      scrolled
                        ? 'text-[#A8A094] hover:bg-white/10 hover:text-[#F4EFE6]'
                        : 'text-[#5C5246] hover:bg-[#1A1713]/5 hover:text-[#1A1713]',
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div
                className={cn(
                  'flex flex-col gap-2.5 pt-2 border-t',
                  scrolled ? 'border-white/10' : 'border-[#1A1713]/10',
                )}
              >
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/auth');
                  }}
                >
                  Get started
                </Button>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
