import { useEffect, useMemo, useState } from 'react';
import { CalendarX2, RotateCcw } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { EVENTS } from '../../data/events';
import type { DateFilterOption } from '../../types/event';
import { matchesDateFilter } from '../../lib/utils';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { EventCardSkeleton } from '../ui/Skeleton';
import { EventCard } from '../events/EventCard';
import { SearchFilter } from './SearchFilter';

export function EventsGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [registeredIds, setRegisteredIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, prefersReducedMotion ? 150 : 500);

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return EVENTS.filter((event) => {
      const matchesDate = matchesDateFilter(event.startAt, dateFilter);
      const matchesQuery =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.organizerName.toLowerCase().includes(query);

      return matchesDate && matchesQuery;
    });
  }, [searchQuery, dateFilter]);

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
              : `${filteredEvents.length} ${filteredEvents.length === 1 ? 'event' : 'events'} shown`}
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
        ) : filteredEvents.length === 0 ? (
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
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{
                  duration: 0.35,
                  delay: prefersReducedMotion ? 0 : Math.min(index * 0.05, 0.25),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex"
              >
                <EventCard
                  event={event}
                  isRegistered={registeredIds.has(event.id)}
                  onToggleRegister={handleToggleRegister}
                />
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
