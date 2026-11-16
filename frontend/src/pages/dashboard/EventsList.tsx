import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { EventCard } from '../../components/events/EventCard';
import { EmptyEvents } from '../../components/dashboard/EmptyEvents';
import { EventsTabs } from '../../components/dashboard/EventsTabs';
import { EventCardSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { eventApi } from '../../api/eventapi';
import { getApiErrorMessage } from '../../api/authapi';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import type { Event } from '../../types/event';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState(2);
  const [hasNextPage, setHasNextPage] = useState(false);
  const loadingMoreRef = useRef(false);
  const loadMoreErrorRef = useRef(false);
  const queryKey = JSON.stringify([status, debouncedTitle]);
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedTitle(searchQuery.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    loadingMoreRef.current = false;
    loadMoreErrorRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setLoadError(null);
    setLoadMoreError(null);
    setEvents([]);
    setTotalEvents(0);
    setNextPage(2);
    setHasNextPage(false);
    const apiStatus = status === 'active' ? 'published' : status;
    eventApi.listOrganizerEvents(apiStatus, {
      title: debouncedTitle,
      page: 1,
      limit: PAGE_SIZE,
    })
      .then((response) => {
        if (!response.success) throw new Error(response.message || 'Unable to load your events.');
        if (isMounted) {
          setEvents(response.data.events);
          setTotalEvents(response.data.pagination.total);
          setNextPage(response.data.pagination.page + 1);
          setHasNextPage(response.data.pagination.hasNextPage && response.data.events.length > 0);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(getApiErrorMessage(error, 'Unable to load your events.'));
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [status, debouncedTitle]);

  const apiStatus = status === 'active' ? 'published' : status;
  const loadMore = useCallback(() => {
    if (!hasNextPage || loading || loadingMoreRef.current || loadMoreErrorRef.current) return;

    const requestKey = queryKey;
    const requestedPage = nextPage;
    if (!Number.isInteger(requestedPage) || requestedPage < 2) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    eventApi.listOrganizerEvents(apiStatus, {
      title: debouncedTitle,
      page: requestedPage,
      limit: PAGE_SIZE,
    })
      .then((response) => {
        if (!response.success) throw new Error(response.message || 'Unable to load more events.');
        if (queryKeyRef.current !== requestKey) return;

        const { events: nextEvents, pagination } = response.data;
        if (pagination.page !== requestedPage) {
          throw new Error('Received an unexpected event page.');
        }

        setEvents((currentEvents) => {
          const currentIds = new Set(currentEvents.map((event) => event.id));
          return [...currentEvents, ...nextEvents.filter((event) => !currentIds.has(event.id))];
        });
        setTotalEvents(pagination.total);
        setNextPage(pagination.page + 1);
        setHasNextPage(pagination.hasNextPage && nextEvents.length > 0);
      })
      .catch((error: unknown) => {
        if (queryKeyRef.current === requestKey) {
          loadMoreErrorRef.current = true;
          setLoadMoreError(getApiErrorMessage(error, 'Unable to load more events.'));
        }
      })
      .finally(() => {
        if (queryKeyRef.current === requestKey) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      });
  }, [apiStatus, debouncedTitle, hasNextPage, loading, nextPage, queryKey]);

  const sentinelRef = useInfiniteScroll(
    loadMore,
    hasNextPage && !loading && !loadingMore && !loadMoreError,
  );

  return (
    <section aria-labelledby="events-list-title">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 id="events-list-title" className="text-2xl font-semibold text-[#1A1713] sm:text-3xl">{titles[status]}</h2>
          <p className="mt-1 text-sm text-[#5C5246]">Browse and manage your events.</p>
        </div>
        {!loading && <p className="shrink-0 text-sm tabular-nums text-[#5C5246]">Showing {events.length} of {totalEvents} events</p>}
      </div>
      <div className="lg:hidden">
        <EventsTabs />
      </div>
      <div className="relative mb-5 w-full max-w-sm">
        <label htmlFor="dashboard-event-search" className="sr-only">Search events by title</label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5246]" aria-hidden="true" />
        <input
          id="dashboard-event-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search events by title..."
          className="h-10 w-full rounded-xl border border-[#1A1713]/15 bg-white/70 pl-10 pr-4 text-sm text-[#1A1713] placeholder:text-[#5C5246] focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
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
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
          {hasNextPage && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}
          {loadingMore && <p className="py-4 text-center text-sm text-[#5C5246]" role="status">Loading more events...</p>}
          {loadMoreError && (
            <div role="alert" className="flex items-center justify-center gap-3 py-4 text-sm text-red-800">
              <span>{loadMoreError}</span>
              <Button
                disableMotion
                variant="secondary"
                size="sm"
                onClick={() => {
                  loadMoreErrorRef.current = false;
                  setLoadMoreError(null);
                  loadMore();
                }}
              >
                Retry
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default EventsList;
