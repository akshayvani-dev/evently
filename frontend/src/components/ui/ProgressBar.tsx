import { cn } from '../../lib/utils';
import type { ComputedBadgeVariant } from '../../types/event';

interface ProgressBarProps {
  value: number;
  variant?: ComputedBadgeVariant;
  label: string;
  tone?: 'light' | 'dark';
  className?: string;
}

const darkFillColors: Record<ComputedBadgeVariant, string> = {
  published: 'bg-primary',
  registered: 'bg-[#8FD18A]',
  'few-left': 'bg-[#F5C84B]',
  full: 'bg-[#F0786B]',
  canceled: 'bg-[#F0786B]/60',
  draft: 'bg-[#A8A094]',
  completed: 'bg-[#7DD3C0]',
};

const lightFillColors: Record<ComputedBadgeVariant, string> = {
  published: 'bg-[#E8571C]',
  registered: 'bg-[#1F7A44]',
  'few-left': 'bg-[#D97706]',
  full: 'bg-[#DC2626]',
  canceled: 'bg-[#DC2626]/60',
  draft: 'bg-[#5C5246]/50',
  completed: 'bg-[#0F766E]',
};

export function ProgressBar({
  value,
  variant = 'published',
  label,
  tone = 'dark',
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fillColors = tone === 'light' ? lightFillColors : darkFillColors;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-full',
        tone === 'light' ? 'bg-[#1A1713]/12' : 'bg-white/10',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-300', fillColors[variant])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
