import { useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authapi';
import { getInitials } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearUser } from '../../store/slices/authSlice';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const name = user?.name || 'Organizer';

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Continue local cleanup if the logout request fails.
    } finally {
      localStorage.setItem('isLoggedIn', 'false');
      dispatch(clearUser());
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2.5 text-sm text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-[#0F0E0C]" aria-hidden="true">
          {getInitials(name)}
        </span>
        <span className="hidden max-w-32 truncate sm:block">{name}</span>
        <ChevronDown className="h-4 w-4 text-white/65" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/15 bg-[#181714] p-1.5 shadow-xl">
          <p className="truncate px-3 py-2 text-xs text-white/60">{user?.email || name}</p>
          <button
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={() => { setOpen(false); void logout(); }}
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}
