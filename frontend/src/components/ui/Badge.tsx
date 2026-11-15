import type { ReactNode } from 'react';
import type { ComputedBadgeVariant } from '../../types/event';
import { cn } from '../../lib/utils';

interface BadgeProps {
  variant: ComputedBadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}

const darkBadgeStyles: Record<ComputedBadgeVariant, string> = {
  published: 'bg-[#8FD18A]/15 text-[#8FD18A]',
  registered: 'bg-[#8FD18A]/15 text-[#8FD18A]',
  draft: 'bg-[#A8A094]/15 text-[#A8A094]',
  canceled: 'bg-[#F0786B]/15 text-[#F0786B]',
  full: 'bg-[#F0786B]/15 text-[#F0786B]',
  'few-left': 'bg-[#F5C84B]/15 text-[#F5C84B]',
};

const lightBadgeStyles: Record<ComputedBadgeVariant, string> = {
  published: 'bg-[#1F6F3D]/12 text-[#165B31]',
  registered: 'bg-[#1F6F3D]/12 text-[#165B31]',
  draft: 'bg-[#1A1713]/10 text-[#4A4238]',
  canceled: 'bg-[#B42318]/12 text-[#991B1B]',
  full: 'bg-[#B42318]/12 text-[#991B1B]',
  'few-left': 'bg-[#B45309]/12 text-[#92400E]',
};

export function Badge({
  variant,
  children,
  icon,
  tone = 'dark',
  className,
}: BadgeProps) {
  const styles = tone === 'light' ? lightBadgeStyles : darkBadgeStyles;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0',
        styles[variant],
        className,
      )}
    >
      {icon ? <span className="shrink-0" aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
