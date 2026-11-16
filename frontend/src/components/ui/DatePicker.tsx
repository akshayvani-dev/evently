import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  hasError?: boolean;
  describedBy?: string;
  disableMotion?: boolean;
  tone?: 'light' | 'dark';
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (value: number) => String(value).padStart(2, '0');

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function DatePicker({
  id,
  value,
  onChange,
  minDate,
  hasError,
  describedBy,
  disableMotion = false,
  tone = 'light',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);
  const minimum = parseDateValue(minDate ?? '') ?? new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selected ?? new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  useEffect(() => {
    if (selected) setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const days = useMemo(() => {
    const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
    const dayCount = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: dayCount }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(visibleMonth);
  const isDark = tone === 'dark';
  const triggerStateClass = hasError
    ? isDark ? 'border-[#F0786B]' : 'border-[#B42318]'
    : isDark ? 'border-border focus-visible:border-primary' : 'border-[#1A1713]/15 focus-visible:border-[#9A340A]';
  const displayValue = selected
    ? new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }).format(selected)
    : 'Choose a date';

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        aria-invalid={hasError}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-3.5 text-left text-sm outline-none focus-visible:ring-2',
          !disableMotion && 'transition',
          isDark ? 'bg-surface-raised text-text focus-visible:ring-primary/30' : 'bg-white/70 shadow-sm focus-visible:ring-[#9A340A]/30',
          triggerStateClass,
        )}
      >
        <span className={selected ? (isDark ? 'text-text' : 'text-[#1A1713]') : (isDark ? 'text-text-muted' : 'text-[#74695E]')}>
          {displayValue}
        </span>
        <CalendarDays className={cn('h-4 w-4', isDark ? 'text-text-muted' : 'text-[#5C5246]')} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose event date"
          className={cn(
            'absolute left-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-xl border p-3 shadow-[0_18px_50px_rgba(0,0,0,0.2)]',
            isDark ? 'border-border bg-surface text-text' : 'border-[#1A1713]/12 bg-white text-[#1A1713]',
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2',
                isDark ? 'text-text-muted hover:bg-surface-raised focus-visible:ring-primary' : 'text-[#4A4238] hover:bg-[#1A1713]/5 focus-visible:ring-[#9A340A]',
              )}
            ><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
            <p className="text-sm font-semibold" aria-live="polite">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2',
                isDark ? 'text-text-muted hover:bg-surface-raised focus-visible:ring-primary' : 'text-[#4A4238] hover:bg-[#1A1713]/5 focus-visible:ring-[#9A340A]',
              )}
            ><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <div role="grid" aria-label={monthLabel} className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} role="columnheader" className={cn('py-2 text-xs font-medium', isDark ? 'text-text-muted' : 'text-[#5C5246]')}>
                {weekday}
              </div>
            ))}
            {days.map((day, index) => {
              if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
              const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
              const dateValue = toDateValue(date);
              const isDisabled = date < minimum;
              const isSelected = dateValue === value;
              return (
                <button
                  key={dateValue}
                  type="button"
                  aria-label={new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(date)}
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  onClick={() => { onChange(dateValue); setOpen(false); }}
                  className={cn(
                    'h-9 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed',
                    !disableMotion && 'transition',
                    isDark
                      ? 'focus-visible:ring-primary disabled:text-text-muted/40'
                      : 'focus-visible:ring-[#9A340A] disabled:text-[#A8A094]/60',
                    isSelected
                      ? isDark ? 'bg-primary font-semibold text-[#0F0E0C]' : 'bg-[#9A340A] font-semibold text-white'
                      : isDark ? 'text-text hover:bg-surface-raised' : 'text-[#1A1713] hover:bg-[#1A1713]/8',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
