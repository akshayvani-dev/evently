import { useEffect, useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInSchema, type SignInValues } from '../../lib/validation/auth';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { FormField } from './FormField';
import { PasswordInput } from './PasswordInput';
import { AuthErrorBanner } from './AuthErrorBanner';

export function SignInForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const timerRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
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

  const onValid = (values: SignInValues) => {
    setIsSubmitting(true);
    timerRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedEmail(values.email);
      setIsSuccess(true);
    }, 1000);
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
        <Button
          variant="gradient"
          size="lg"
          onClick={() => navigate('/')}
          className="w-full"
        >
          Browse events
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

      <FormField id="signin-email" label="Email" error={errors.email?.message}>
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'signin-email-error' : undefined}
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
        id="signin-password"
        label="Password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="signin-password"
          autoComplete="current-password"
          placeholder="Enter your password"
          hasError={Boolean(errors.password)}
          aria-describedby={errors.password ? 'signin-password-error' : undefined}
          {...register('password')}
        />
      </FormField>

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
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </div>
    </motion.form>
  );
}
