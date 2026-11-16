import type { ReactNode } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

type ButtonVariant = 'gradient' | 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  disableMotion?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  gradient:
    'bg-brand-gradient text-[#0F0E0C] font-medium shadow-[0_6px_20px_rgba(255,106,43,0.30)] hover:brightness-110',
  primary:
    'bg-primary text-[#0F0E0C] font-medium hover:bg-primary-hover',
  secondary:
    'bg-surface-raised text-text border border-border hover:border-primary/50 hover:bg-surface-raised/80 font-medium',
  outline:
    'bg-transparent text-text border border-border hover:border-text-muted/60 hover:bg-surface font-medium',
  ghost:
    'bg-transparent text-text-muted hover:text-text hover:bg-surface-raised/60 font-medium',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  disableMotion = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const allowMotion = !disableMotion && !disabled && !prefersReducedMotion;

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={allowMotion ? { y: -1 } : undefined}
      whileTap={allowMotion ? { scale: 0.98 } : undefined}
      transition={allowMotion ? { duration: 0.15, ease: [0.16, 1, 0.3, 1] } : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer',
        !disableMotion && 'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
