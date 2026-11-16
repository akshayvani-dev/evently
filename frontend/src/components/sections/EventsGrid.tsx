import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarX2, RotateCcw } from 'lucide-react';
import type { DateFilterOption } from '../../types/event';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { EventCardSkeleton } from '../ui/Skeleton';
import { EventCard } from '../events/EventCard';
import { SearchFilter } from './SearchFilter';
import { eventApi } from '../../api/eventapi';
import { getApiErrorMessage } from '../../api/authapi';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import type { Event } from '../../types/event';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function EventsGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [registeredIds, setRegisteredIds] = useState<ReadonlySet<string>>(() => new Set());
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState(2);
  const [hasNextPage, setHasNextPage] = useState(false);
  const loadingMoreRef = useRef(false);
  const loadMoreErrorRef = useRef(false);

  const queryKey = JSON.stringify([debouncedSearchQuery, dateFilter]);
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    loadingMoreRef.current = false;
    loadMoreErrorRef.current = false;
    setIsLoading(true);
    setIsLoadingMore(false);
    setLoadError(null);
    setLoadMoreError(null);
    setEvents([]);
    setTotalEvents(0);
    setNextPage(2);
    setHasNextPage(false);
    eventApi.listEvents({
      title: debouncedSearchQuery,
      dateFilter,
      page: 1,
      limit: PAGE_SIZE,
    })
      .then((response) => {
        if (!response.success) throw new Error(response.message || 'Unable to load events.');
        if (isMounted) {
          setEvents(response.data.events);
          setTotalEvents(response.data.pagination.total);
          setNextPage(response.data.pagination.page + 1);
          setHasNextPage(response.data.pagination.hasNextPage && response.data.events.length > 0);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(getApiErrorMessage(error, 'Unable to load events.'));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [dateFilter, debouncedSearchQuery]);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isLoading || loadingMoreRef.current || loadMoreErrorRef.current) return;

    const requestKey = queryKey;
    const requestedPage = nextPage;
    if (!Number.isInteger(requestedPage) || requestedPage < 2) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    eventApi.listEvents({
      title: debouncedSearchQuery,
      dateFilter,
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
          setIsLoadingMore(false);
        }
      });
  }, [dateFilter, debouncedSearchQuery, hasNextPage, isLoading, nextPage, queryKey]);

  const sentinelRef = useInfiniteScroll(
    loadMore,
    hasNextPage && !isLoading && !isLoadingMore && !loadMoreError,
  );

  const handleToggleRegister = (eventId: string) => {
    setRegisteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
  };

  return (
    <section id="events" className="pt-6 pb-12 sm:pt-8 sm:pb-14">
      <Container className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            tone="light"
            eyebrow="Curated calendar"
            title="Upcoming events"
            description="Browse upcoming gatherings, conferences, workshops, and community meetups with live seat availability."
          />
          <p className="text-sm text-[#5C5246] tabular-nums shrink-0">
            {isLoading
              ? 'Loading events...'
              : `Showing ${events.length} of ${totalEvents} events`}
          </p>
        </div>

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-[#B42318]/20 bg-white/55 px-6 py-12 text-center text-sm font-medium text-[#991B1B]">
            {loadError}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1A1713]/12 bg-white/50 backdrop-blur-md px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1713]/8 text-[#5C5246]">
              <CalendarX2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#1A1713]">
              No matching events found
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-[#5C5246]">
              Try clearing your search terms or selecting a broader date range.
            </p>
            <Button
              disableMotion
              variant="secondary"
              size="md"
              onClick={handleResetFilters}
              className="mt-6 border-[#1A1713]/15 bg-white/70 text-[#1A1713] hover:bg-white/90"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex"
              >
                <EventCard
                  event={event}
                  isRegistered={registeredIds.has(event.id)}
                  onToggleRegister={handleToggleRegister}
                />
              </div>
            ))}
          </div>
        )}
        {!isLoading && !loadError && events.length > 0 && (
          <>
            {hasNextPage && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}
            {isLoadingMore && (
              <p className="py-2 text-center text-sm text-[#5C5246]" role="status">
                Loading more events...
              </p>
            )}
            {loadMoreError && (
              <div role="alert" className="flex items-center justify-center gap-3 py-2 text-sm text-[#991B1B]">
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
      </Container>
    </section>
  );
}
