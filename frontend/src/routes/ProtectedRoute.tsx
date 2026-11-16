import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store';

export function ProtectedRoute() {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Verifying your session">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary" aria-hidden="true" />
        <span className="sr-only">Verifying your session</span>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}

export default ProtectedRoute;
