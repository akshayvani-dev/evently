import { AlertCircle, Ban, CheckCircle2 } from 'lucide-react';
import type { Event, EventAvailability } from '../../types/event';
import { cn } from '../../lib/utils';
import { ProgressBar } from '../ui/ProgressBar';

interface SlotsCardProps {
  event: Event;
  availability: EventAvailability;
  hasStarted: boolean;
}

export function SlotsCard({ event, availability, hasStarted }: SlotsCardProps) {
  const isCanceled = event.status === 'canceled';
  const isFull = availability.badgeVariant === 'full';
  const isFewLeft = availability.badgeVariant === 'few-left';

  let stateMessage =
    'Plenty of places available. Reserve your seat with instant confirmation.';
  let StateIcon = CheckCircle2;
  let stateToneClass = 'text-[#8FD18A]';

  if (isCanceled) {
    stateMessage = 'This event has been canceled. Registrations are closed.';
    StateIcon = Ban;
    stateToneClass = 'text-[#F0786B]';
  } else if (hasStarted) {
    stateMessage = 'This event has already started. Registration is closed.';
    StateIcon = Ban;
    stateToneClass = 'text-[#F0786B]';
  } else if (isFull) {
    stateMessage = 'All seats are taken. This event is at full capacity.';
    StateIcon = Ban;
    stateToneClass = 'text-[#F0786B]';
  } else if (isFewLeft) {
    stateMessage = `Only ${availability.placesRemaining} ${availability.placesRemaining === 1 ? 'place' : 'places'} left — reserve your spot soon.`;
    StateIcon = AlertCircle;
    stateToneClass = 'text-[#F5C84B]';
  }

  return (
    <section
      aria-labelledby="slots-heading"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-5"
    >
      <h2 id="slots-heading" className="text-base font-semibold text-text">
        Availability
      </h2>

      <div className="grid grid-cols-3 divide-x divide-border/70">
        <div className="pr-4">
          <p className="text-xs text-text-muted">Capacity</p>
          <p className="mt-1 text-lg font-semibold text-text tabular-nums">
            {event.capacity}
          </p>
        </div>
        <div className="px-4">
          <p className="text-xs text-text-muted">Registered</p>
          <p className="mt-1 text-lg font-semibold text-text tabular-nums">
            {event.registered}
          </p>
        </div>
        <div className="pl-4">
          <p className="text-xs text-text-muted">Remaining</p>
          <p
            className={cn(
              'mt-1 text-lg font-semibold tabular-nums',
              isCanceled || hasStarted || isFull
                ? 'text-[#F0786B]'
                : isFewLeft
                  ? 'text-[#F5C84B]'
                  : 'text-[#8FD18A]',
            )}
          >
            {availability.placesRemaining}
          </p>
        </div>
      </div>

      <ProgressBar
        value={availability.percentFilled}
        variant={hasStarted && !isCanceled ? 'full' : availability.badgeVariant}
        label={`${event.title} seat availability`}
      />

      <p className={cn('inline-flex items-start gap-2 text-sm', stateToneClass)}>
        <StateIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{stateMessage}</span>
      </p>
    </section>
  );
}
