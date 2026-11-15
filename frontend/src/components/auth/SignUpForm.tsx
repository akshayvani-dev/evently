import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signUpSchema, type SignUpValues } from '../../lib/validation/auth';
import { cn } from '../../lib/utils';
import { authApi, getApiErrorMessage } from '../../api/authapi';
import { useAppDispatch } from '../../store';
import { setUser } from '../../store/slices/authSlice';
import { Button } from '../ui/Button';
import { FormField } from './FormField';
import { PasswordInput } from './PasswordInput';
import { RoleSelector } from './RoleSelector';
import { AuthErrorBanner } from './AuthErrorBanner';

export function SignUpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    name: string;
    role: 'attendee' | 'organizer';
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const timerRef = useRef<number | null>(null);
  const roleFirstButtonRef = useRef<HTMLButtonElement | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const prefersReducedMotion = useReducedMotion();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: undefined,
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const onValid = async (values: SignUpValues) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const response = await authApi.signup({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });

      if (response.success && response.data?.user) {
        const user = response.data.user;
        dispatch(setUser(user));
        localStorage.setItem('isLoggedIn', 'true');
        setCreatedAccount({ name: values.name, role: values.role });
        setIsSuccess(true);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      if (!prefersReducedMotion) {
        setIsShaking(true);
      }
      const message = getApiErrorMessage(
        err,
        'Failed to create account. Please try again.'
      );
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (fieldErrors: FieldErrors<SignUpValues>) => {
    if (!prefersReducedMotion) {
      setIsShaking(true);
    }

    if (
      !fieldErrors.name &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      fieldErrors.role
    ) {
      roleFirstButtonRef.current?.focus();
    }
  };

  if (isSuccess && createdAccount) {
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
          <h2 className="text-xl font-semibold text-text">Account created</h2>
          <p className="text-sm text-text-muted">
            Welcome to Evently, <span className="font-medium text-text">{createdAccount.name}</span>. Your{' '}
            {createdAccount.role} profile is ready.
          </p>
        </div>
        <Button
          variant="gradient"
          size="lg"
          onClick={() => navigate('/dashboard')}
          className="w-full"
        >
          Go to Dashboard
        </Button>
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
        id="signup-name"
        label="Full name"
        error={errors.name?.message}
      >
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Alex Morgan"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
          className={cn(
            'w-full rounded-xl border bg-surface/80 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
            errors.name
              ? 'border-[#DE6B6B] focus:border-[#DE6B6B]'
              : 'border-white/10 hover:border-white/20 focus:border-primary'
          )}
        />
      </FormField>

      <FormField
        id="signup-email"
        label="Email address"
        error={errors.email?.message}
      >
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
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
        id="signup-password"
        label="Password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          disabled={isSubmitting}
          hasError={Boolean(errors.password)}
          {...register('password')}
        />
      </FormField>

      <FormField
        id="signup-role"
        label="How will you use Evently?"
        error={errors.role?.message}
      >
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <RoleSelector
              value={field.value}
              onChange={field.onChange}
              firstButtonRef={(node) => {
                roleFirstButtonRef.current = node;
              }}
            />
          )}
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
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </motion.form>
  );
}
