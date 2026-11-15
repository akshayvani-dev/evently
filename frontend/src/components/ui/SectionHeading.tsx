import { cn } from '../../lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';
  const isLight = tone === 'light';

  return (
    <div
      className={cn(
        'space-y-3',
        centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl text-left',
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            'text-sm font-medium',
            isLight ? 'text-[#9A340A]' : 'text-highlight',
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl [text-wrap:balance]',
          isLight ? 'text-[#1A1713]' : 'text-[#F4EFE6]',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'text-base leading-relaxed',
            isLight ? 'text-[#5C5246]' : 'text-[#BFB6A8]',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
