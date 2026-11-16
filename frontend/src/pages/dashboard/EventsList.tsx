import { useEffect, useState } from 'react';
import { EventCard } from '../../components/events/EventCard';
import { EmptyEvents } from '../../components/dashboard/EmptyEvents';
import { EventsTabs } from '../../components/dashboard/EventsTabs';
import { EventCardSkeleton } from '../../components/ui/Skeleton';
import { eventApi } from '../../api/eventapi';
import { getApiErrorMessage } from '../../api/authapi';
import type { Event } from '../../types/event';

export type EventListStatus = 'all' | 'active' | 'draft' | 'canceled' | 'completed';

interface EventsListProps {
  status: EventListStatus;
}

const titles: Record<EventListStatus, string> = {
  all: 'All events',
  active: 'Active events',
  draft: 'Draft events',
  canceled: 'Canceled events',
  completed: 'Completed events',
};

export function EventsList({ status }: EventsListProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    eventApi.listOrganizerEvents('all')
      .then((response) => {
        if (!response.success) throw new Error(response.message || 'Unable to load your events.');
        const filteredEvents = status === 'all'
          ? response.data.events
          : response.data.events.filter((event) => event.status === (status === 'active' ? 'published' : status));
        if (isMounted) setEvents(filteredEvents);
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(getApiErrorMessage(error, 'Unable to load your events.'));
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [status]);

  return (
    <section aria-labelledby="events-list-title">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 id="events-list-title" className="text-2xl font-semibold text-[#1A1713] sm:text-3xl">{titles[status]}</h2>
          <p className="mt-1 text-sm text-[#5C5246]">Browse and manage your events.</p>
        </div>
        {!loading && <p className="shrink-0 text-sm tabular-nums text-[#5C5246]">{events.length} {events.length === 1 ? 'event' : 'events'}</p>}
      </div>
      <div className="lg:hidden">
        <EventsTabs />
      </div>
      {loading ? (
        <div aria-label="Loading events" aria-busy="true" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} />)}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-red-300/40 bg-white/70 px-6 py-12 text-center text-sm font-medium text-red-800">{loadError}</div>
      ) : events.length === 0 ? (
        <EmptyEvents status={status} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </section>
  );
}

export default EventsList;
