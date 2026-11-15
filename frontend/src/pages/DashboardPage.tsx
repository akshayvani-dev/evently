import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authapi';
import { useAppDispatch, useAppSelector } from '../store';
import { clearUser } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.setItem('isLoggedIn', 'false');
      dispatch(clearUser());
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-text">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface/50 p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Logged in</h1>
          {user && (
            <p className="text-sm text-text-muted">
              Welcome back, <span className="font-semibold text-primary">{user.name}</span> ({user.role})
            </p>
          )}
        </div>

        {user && (
          <div className="rounded-xl bg-surface/80 p-4 text-left text-sm space-y-1.5 border border-white/5">
            <div className="flex justify-between text-xs text-text-muted">
              <span>Email:</span>
              <span className="text-text font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Role:</span>
              <span className="capitalize text-text font-medium">{user.role}</span>
            </div>
          </div>
        )}

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

export default DashboardPage;
