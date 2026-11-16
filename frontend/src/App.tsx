import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { AppRouter } from './routes/router';
import { authApi } from './api/authapi';
import { useAppDispatch } from './store';
import { clearUser, setLoading, setUser } from './store/slices/authSlice';
import { ToastProvider, Toaster } from './components/ui/toaster';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      dispatch(clearUser());
      dispatch(setLoading(false));
      return;
    }

    dispatch(setLoading(true));
    authApi
      .getMe()
      .then((res) => {
        if (res.success && res.data?.user) {
          dispatch(setUser(res.data.user));
        } else {
          dispatch(clearUser());
          localStorage.setItem('isLoggedIn', 'false');
        }
      })
      .catch(() => {
        dispatch(clearUser());
        localStorage.setItem('isLoggedIn', 'false');
      })
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);

  return (
    <ToastProvider>
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-transparent text-text flex flex-col">
          <AppRouter />
        </div>
        <Toaster />
      </MotionConfig>
    </ToastProvider>
  );
}
