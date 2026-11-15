import { Calendar, Clock, Globe, MapPin } from 'lucide-react';
import type { Event } from '../../types/event';
import { formatEventDate } from '../../lib/utils';

interface EventInfoProps {
  event: Event;
}

export function EventInfo({ event }: EventInfoProps) {
  const { fullDateLabel, timeLabel } = formatEventDate(event.startAt, event.timezone);

  return (
    <dl className="divide-y divide-border/70">
      <div className="flex items-start gap-3 py-3 first:pt-0">
        <dt className="sr-only">Date</dt>
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm font-medium text-text">{fullDateLabel}</dd>
      </div>

      <div className="flex items-start gap-3 py-3">
        <dt className="sr-only">Time</dt>
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm font-medium text-text">{timeLabel}</dd>
      </div>

      <div className="flex items-start gap-3 py-3">
        <dt className="sr-only">Time zone</dt>
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm text-text-muted">{event.timezone}</dd>
      </div>

      <div className="flex items-start gap-3 py-3 last:pb-0">
        <dt className="sr-only">Location</dt>
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm font-medium text-text">{event.location}</dd>
      </div>
    </dl>
  );
}
