import { useEffect, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { getApiErrorMessage } from '../../api/authapi';
import { eventApi } from '../../api/eventapi';
import type { UserRegistrationFilters } from '../../api/eventapi';
import { EventCard } from '../../components/events/EventCard';
import { EventCardSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useAppSelector } from '../../store';
import type { Event } from '../../types/event';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export type AttendeeEventView = 'all' | 'my' | 'canceled' | 'completed';

interface AttendeeEventsPageProps {
  view: AttendeeEventView;
}

const titles: Record<AttendeeEventView, string> = {
  all: 'All events',
  my: 'My events',
  canceled: 'Canceled events',
  completed: 'Completed events',
};

const descriptions: Record<AttendeeEventView, string> = {
  all: 'Browse published events and see your registration status.',
  my: 'Events you are currently registered for.',
  canceled: 'Events with a canceled registration.',
  completed: 'Events you attended that have been completed.',
};

const emptyMessages: Record<AttendeeEventView, string> = {
  all: 'No events match your search.',
  my: "You haven't registered for any events yet.",
  canceled: 'You do not have any canceled registrations.',
  completed: 'You do not have any completed events yet.',
};

const registrationStatusByView: Record<
  Exclude<AttendeeEventView, 'all'>,
  UserRegistrationFilters['status']
> = {
  my: 'active',
  canceled: 'canceled',
  completed: 'completed',
};

export function AttendeeEventsPage({ view }: AttendeeEventsPageProps) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedTitle(searchQuery.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    setEvents([]);
    setTotal(0);

    if (!userId) {
      setLoadError('Unable to verify your attendee account. Please sign in again.');
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const filters = {
      title: debouncedTitle,
      page,
      limit: PAGE_SIZE,
    };

    const loadEvents = async () => {
      try {
        if (view === 'all') {
          const response = await eventApi.listEvents(filters, `attendee:${userId}`);
          if (!response.success) {
            throw new Error(response.message || 'Unable to load events.');
          }
          if (isMounted) {
            setEvents(response.data.events);
            setTotal(response.data.pagination.total);
          }
        } else {
          const response = await eventApi.listUserRegistrations(userId, {
            ...filters,
            status: registrationStatusByView[view],
          });
          if (!response.success) {
            throw new Error(response.message || 'Unable to load your registrations.');
          }
          if (isMounted) {
            setEvents(
              response.data.registrations.map(({ event, status }) => ({
                ...event,
                registrationStatus: status,
              })),
            );
            setTotal(response.data.total);
          }
        }
      } catch (error: unknown) {
        if (isMounted) {
          setLoadError(getApiErrorMessage(error, 'Unable to load events.'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadEvents();
    return () => {
      isMounted = false;
    };
  }, [debouncedTitle, page, retryCount, userId, view]);

  return (
    <section aria-labelledby="attendee-events-heading">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2
            id="attendee-events-heading"
            className="text-2xl font-semibold text-[#1A1713] sm:text-3xl"
          >
            {titles[view]}
          </h2>
          <p className="mt-1 text-sm text-[#5C5246]">{descriptions[view]}</p>
        </div>
        {!loading && !loadError && (
          <p className="shrink-0 text-sm tabular-nums text-[#5C5246]">
            Showing {events.length} of {total} events
          </p>
        )}
      </div>

      <div className="relative mb-5 w-full max-w-sm">
        <label htmlFor="attendee-event-search" className="sr-only">
          Search events by title
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5246]"
          aria-hidden="true"
        />
        <input
          id="attendee-event-search"
          type="search"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search events by title..."
          className="h-10 w-full rounded-xl border border-[#1A1713]/15 bg-white/70 pl-10 pr-4 text-sm text-[#1A1713] placeholder:text-[#5C5246] focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      </div>

      {loading ? (
        <div
          aria-label="Loading events"
          aria-busy="true"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-300/40 bg-white/70 px-6 py-12 text-center text-sm font-medium text-red-800"
        >
          <p>{loadError}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Try again
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-[#1A1713]/12 bg-white/70 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1713]/8 text-[#5C5246]">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-[#1A1713]">
            {emptyMessages[view]}
          </h3>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={event.registrationStatus === 'active'}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm tabular-nums text-[#5C5246]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AttendeeEventsPage;
