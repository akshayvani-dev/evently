import { useEffect, useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInSchema, type SignInValues } from '../../lib/validation/auth';
import { cn } from '../../lib/utils';
import { authApi, getApiErrorMessage } from '../../api/authapi';
import { useAppDispatch } from '../../store';
import { setUser } from '../../store/slices/authSlice';
import { Button } from '../ui/Button';
import { FormField } from './FormField';
import { PasswordInput } from './PasswordInput';
import { AuthErrorBanner } from './AuthErrorBanner';

export function SignInForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const timerRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const prefersReducedMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const onValid = async (values: SignInValues) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const response = await authApi.signin({
        email: values.email,
        password: values.password,
      });

      if (response.success && response.data?.user) {
        const user = response.data.user;
        dispatch(setUser(user));
        localStorage.setItem('isLoggedIn', 'true');
        setSubmittedEmail(values.email);
        setIsSuccess(true);
        navigate('/dashboard/events/all', { replace: true });
      }
    } catch (err: unknown) {
      if (!prefersReducedMotion) {
        setIsShaking(true);
      }
      const message = getApiErrorMessage(err, 'Invalid email or password');
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (_errors: FieldErrors<SignInValues>) => {
    if (!prefersReducedMotion) {
      setIsShaking(true);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="py-4 text-center space-y-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8FD18A]/15 text-[#8FD18A]">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-text">Welcome back</h2>
          <p className="text-sm text-text-muted">
            Signed in as <span className="font-medium text-text">{submittedEmail}</span>.
          </p>
        </div>
      </motion.div>
    );
  }

  const shakeAnimation = isShaking
    ? {
        x: [0, -8, 8, -6, 6, -3, 3, 0],
        transition: { duration: 0.4 },
      }
    : { x: 0 };

  return (
    <motion.form
      noValidate
      onSubmit={handleSubmit(onValid, onInvalid)}
      animate={prefersReducedMotion ? undefined : shakeAnimation}
      onAnimationComplete={() => setIsShaking(false)}
      className="space-y-4"
    >
      <AuthErrorBanner message={serverError} />

      <FormField
        id="signin-email"
        label="Email address"
        error={errors.email?.message}
      >
        <input
          id="signin-email"
          type="email"
          maxLength={500}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
          onFocus={() => void trigger('email')}
          {...register('email')}
          className={cn(
            'w-full rounded-xl border bg-surface/80 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
            errors.email
              ? 'border-[#DE6B6B] focus:border-[#DE6B6B]'
              : 'border-white/10 hover:border-white/20 focus:border-primary'
          )}
        />
      </FormField>

      <FormField
        id="signin-password"
        label="Password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="signin-password"
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={isSubmitting}
          hasError={Boolean(errors.password)}
          onFocus={() => void trigger('password')}
          {...register('password')}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full mt-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </motion.form>
  );
}
