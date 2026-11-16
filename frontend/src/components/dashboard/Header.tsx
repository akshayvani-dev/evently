import { CalendarDays, Menu, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { UserMenu } from './UserMenu';
import { useAppSelector } from '../../store';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  mobileOpen: boolean;
}

export function Header({ title, onMenuClick, mobileOpen }: HeaderProps) {
  const navigate = useNavigate();
  const isOrganizer = useAppSelector((state) => state.auth.user?.role === 'organizer');

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0F0E0C]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Open dashboard navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-dashboard-sidebar"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link to="/" className="inline-flex shrink-0 items-center gap-2 rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-[#0F0E0C]" aria-hidden="true">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="font-semibold">Evently</span>
        </Link>
        <span className="hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-white sm:text-base">{title}</h1>
        {isOrganizer && (
          <Button variant="gradient" size="md" onClick={() => navigate('/dashboard/events/create')} className="px-3 sm:px-5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Create event</span>
            <span className="sr-only sm:hidden">Create event</span>
          </Button>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
