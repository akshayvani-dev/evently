import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signUpSchema, type SignUpValues } from '../../lib/validation/auth';
import { cn } from '../../lib/utils';
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
  const [serverError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const timerRef = useRef<number | null>(null);
  const roleFirstButtonRef = useRef<HTMLButtonElement | null>(null);

  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const {
    register,
    control,
    watch,
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

  const passwordValue = watch('password') ?? '';
  const passwordChecks = [
    { label: '8+ characters', met: passwordValue.length >= 8 },
    { label: 'One letter', met: /[A-Za-z]/.test(passwordValue) },
    { label: 'One number', met: /[0-9]/.test(passwordValue) },
  ];

  const onValid = (values: SignUpValues) => {
    setIsSubmitting(true);
    timerRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setCreatedAccount({ name: values.name, role: values.role });
      setIsSuccess(true);
    }, 1000);
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
          onClick={() => navigate('/')}
          className="w-full"
        >
          Explore events
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={false}
      animate={
        isShaking && !prefersReducedMotion
          ? { x: [0, -6, 6, -4, 4, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.32 }}
      onAnimationComplete={() => setIsShaking(false)}
      onSubmit={handleSubmit(onValid, onInvalid)}
      noValidate
      className="space-y-4"
    >
      <AuthErrorBanner message={serverError} />

      <FormField id="signup-name" label="Full name" error={errors.name?.message}>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Alex Rivera"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'signup-name-error' : undefined}
          className={cn(
            'h-11 w-full rounded-xl border bg-background/70 px-3.5 text-sm text-text placeholder:text-text-muted/70 transition-colors',
            'focus:outline-none focus-visible:ring-2',
            errors.name
              ? 'border-[#F0786B] focus:border-[#F0786B] focus-visible:ring-[#F0786B]/40'
              : 'border-border focus:border-primary focus-visible:ring-primary/50',
          )}
          {...register('name')}
        />
      </FormField>

      <FormField id="signup-email" label="Email" error={errors.email?.message}>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          className={cn(
            'h-11 w-full rounded-xl border bg-background/70 px-3.5 text-sm text-text placeholder:text-text-muted/70 transition-colors',
            'focus:outline-none focus-visible:ring-2',
            errors.email
              ? 'border-[#F0786B] focus:border-[#F0786B] focus-visible:ring-[#F0786B]/40'
              : 'border-border focus:border-primary focus-visible:ring-primary/50',
          )}
          {...register('email')}
        />
      </FormField>

      <FormField
        id="signup-password"
        label="Password"
        error={errors.password?.message}
        hint={
          <ul
            aria-label="Password requirements"
            className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs"
          >
            {passwordChecks.map((check) => (
              <li
                key={check.label}
                className={cn(
                  'inline-flex items-center gap-1.5 transition-colors',
                  check.met ? 'text-[#8FD18A]' : 'text-text-muted',
                )}
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5',
                    check.met ? 'opacity-100' : 'opacity-40',
                  )}
                  aria-hidden="true"
                />
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        }
      >
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          hasError={Boolean(errors.password)}
          aria-describedby={errors.password ? 'signup-password-error' : undefined}
          {...register('password')}
        />
      </FormField>

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <RoleSelector
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.role?.message}
            firstButtonRef={(node) => {
              roleFirstButtonRef.current = node;
            }}
          />
        )}
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </div>
    </motion.form>
  );
}
