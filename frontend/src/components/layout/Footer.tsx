import {
  CalendarDays,
  Github,
  Instagram,
  Linkedin,
  Mail,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { smoothScrollTo } from '../../lib/utils';
import { Container } from '../ui/Container';

const SOCIAL_LINKS = [
  { label: 'Evently on Instagram', icon: Instagram, href: '#top' },
  { label: 'Evently on LinkedIn', icon: Linkedin, href: '#top' },
  { label: 'Evently on GitHub', icon: Github, href: '#top' },
  { label: 'Contact Evently via email', icon: Mail, href: '#cta' },
] as const;

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleFooterNavigate = (href: string) => {
    if (location.pathname !== '/') {
      navigate(href === '#top' ? '/' : `/${href}`);
      return;
    }

    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      smoothScrollTo(href);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-transparent py-10">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleFooterNavigate('#top');
              }}
              className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[#F4EFE6] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-[#0F0E0C]"
                aria-hidden="true"
              >
                <CalendarDays className="h-4 w-4" />
              </span>
              <span>Evently</span>
            </a>
            <p className="text-sm text-[#A8A094]">
              Event discovery and registration for organizers and attendees.
            </p>
          </div>

          <nav aria-label="Social links" className="flex items-center gap-2.5">
            {SOCIAL_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href === '#top' ? '/' : `/${item.href}`}
                  aria-label={item.label}
                  onClick={(e) => {
                    e.preventDefault();
                    handleFooterNavigate(item.href);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#A8A094] transition-colors hover:border-primary/45 hover:bg-white/10 hover:text-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-[#A8A094]">
          <p>© {new Date().getFullYear()} Evently. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
