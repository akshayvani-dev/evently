import { useRef, type KeyboardEvent } from 'react';
import { CalendarPlus, Ticket } from 'lucide-react';
import type { UserRole } from '../../lib/validation/auth';
import { cn } from '../../lib/utils';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: typeof Ticket;
}

const ROLE_OPTIONS: ReadonlyArray<RoleOption> = [
  {
    id: 'attendee',
    title: 'Attendee',
    description: 'I want to discover and register for events',
    icon: Ticket,
  },
  {
    id: 'organizer',
    title: 'Organizer',
    description: 'I want to create and manage events',
    icon: CalendarPlus,
  },
];

interface RoleSelectorProps {
  value: UserRole | undefined;
  onChange: (role: UserRole) => void;
  onBlur?: () => void;
  error?: string;
  firstButtonRef?: (node: HTMLButtonElement | null) => void;
}

export function RoleSelector({
  value,
  onChange,
  onBlur,
  error,
  firstButtonRef,
}: RoleSelectorProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const labelId = 'role-selector-label';
  const errorId = 'role-selector-error';

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault();
      const nextIndex = index === 0 ? 1 : 0;
      const nextOption = ROLE_OPTIONS[nextIndex];
      onChange(nextOption.id);
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="space-y-2">
      <span id={labelId} className="block text-sm font-medium text-text">
        How will you use Evently?
      </span>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {ROLE_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          const tabIndex =
            value === undefined ? (index === 0 ? 0 : -1) : isSelected ? 0 : -1;

          return (
            <button
              key={option.id}
              ref={(node) => {
                buttonRefs.current[index] = node;
                if (index === 0 && firstButtonRef) {
                  firstButtonRef(node);
                }
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={tabIndex}
              onClick={() => onChange(option.id)}
              onBlur={onBlur}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all duration-150 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-[0_0_16px_rgba(255,106,43,0.16)]'
                  : error
                    ? 'border-[#F0786B]/70 bg-background/60 hover:border-[#F0786B]'
                    : 'border-border bg-background/60 hover:border-text-muted/50 hover:bg-surface-raised/50',
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    isSelected
                      ? 'bg-primary text-[#0F0E0C]'
                      : 'bg-surface-raised text-text-muted',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-4 rounded-full border transition-colors flex items-center justify-center',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-text-muted/50 bg-transparent',
                  )}
                >
                  {isSelected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0F0E0C]" />
                  ) : null}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-text">{option.title}</p>
                <p className="text-xs leading-relaxed text-text-muted">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-[#F0786B]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
