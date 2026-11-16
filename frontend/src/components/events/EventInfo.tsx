import { Building2, Calendar, Clock, Globe, MapPin } from 'lucide-react';
import type { Event } from '../../types/event';
import { formatEventDate } from '../../lib/utils';

interface EventInfoProps {
  event: Event;
}

export function EventInfo({ event }: EventInfoProps) {
  const { fullDateLabel, timeLabel } = formatEventDate(event.startAt, event.timezone);

  return (
    <dl className="divide-y divide-border">
      <div className="flex items-start gap-3 py-2 first:pt-0">
        <dt className="sr-only">Date</dt>
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm font-medium text-text">{fullDateLabel}</dd>
      </div>

      <div className="flex items-start gap-3 py-2">
        <dt className="sr-only">Time</dt>
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm font-medium text-text">{timeLabel}</dd>
      </div>

      <div className="flex items-start gap-3 py-2">
        <dt className="sr-only">Time zone</dt>
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm text-text-muted">{event.timezone}</dd>
      </div>

      <div className="flex items-start gap-3 py-2">
        <dt className="sr-only">Location</dt>
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm font-medium text-text">{event.location}</dd>
      </div>

      <div className="flex items-start gap-3 py-2 last:pb-0">
        <dt className="sr-only">Organizer</dt>
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <dd className="text-sm font-medium text-text">
          <span className="mr-2 text-xs font-normal text-text-muted">Organized by</span>
          {event.organizerName}
        </dd>
      </div>
    </dl>
  );
}
