import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Users } from 'lucide-react';
import { eventApi, type EventAttendeesResponse } from '../../api/eventapi';
import { getApiErrorMessage } from '../../api/authapi';
import { Button } from '../ui/Button';

const PAGE_SIZE = 10;

interface EventAttendeesProps {
  eventId: string;
}

function formatRegisteredAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function EventAttendees({ eventId }: EventAttendeesProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EventAttendeesResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setData(null);
    setError(null);
    setIsLoading(true);

    eventApi.listEventAttendees(eventId, page, PAGE_SIZE)
      .then((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Unable to load event attendees.');
        }

        const lastPage = Math.max(1, Math.ceil(response.data.total / response.data.limit));
        if (page > lastPage) {
          if (isMounted) setPage(lastPage);
          return;
        }

        if (isMounted) setData(response.data);
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, 'Unable to load event attendees.'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [eventId, page, retryCount]);

  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const firstItem = data?.total ? (data.page - 1) * data.limit + 1 : 0;
  const lastItem = data ? Math.min(data.page * data.limit, data.total) : 0;

  return (
    <section
      aria-labelledby="event-attendees-heading"
      aria-busy={isLoading}
      className="overflow-hidden rounded-2xl border border-border bg-surface/90"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 id="event-attendees-heading" className="text-sm font-semibold text-text">
            Registered attendees
          </h2>
          {data && (
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs tabular-nums text-text-muted">
              {data.total}
            </span>
          )}
        </div>
        {data && data.total > 0 && (
          <p className="text-xs text-text-muted">
            Showing {firstItem}–{lastItem} of {data.total}
          </p>
        )}
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-[#F0786B] sm:px-5">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetryCount((count) => count + 1)}
            disabled={isLoading}
            className="border-border bg-surface-raised text-text hover:bg-surface"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {!error && isLoading && (
        <div role="status" className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-text-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading attendees...
        </div>
      )}

      {!error && !isLoading && data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-surface-raised text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Name</th>
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Email</th>
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.attendees.map((attendee) => (
                  <tr key={attendee.id} className="text-text">
                    <td className="px-4 py-3 font-medium sm:px-5">{attendee.name}</td>
                    <td className="px-4 py-3 text-text-muted sm:px-5">{attendee.email}</td>
                    <td className="px-4 py-3 text-text-muted sm:px-5">
                      {formatRegisteredAt(attendee.registeredAt)}
                    </td>
                  </tr>
                ))}
                {data.attendees.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-text-muted sm:px-5">
                      No active registrations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data.total > 0 && (
            <nav aria-label="Attendee pages" className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={isLoading || page <= 1}
                className="border-border bg-surface-raised text-text hover:bg-surface"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <span className="text-xs tabular-nums text-text-muted">
                Page {data.page} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={isLoading || page >= pageCount}
                className="border-border bg-surface-raised text-text hover:bg-surface"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
