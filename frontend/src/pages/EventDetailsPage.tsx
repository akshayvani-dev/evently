import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarX2,
  Ticket,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Event } from '../types/event';
import { getEventAvailability, isEventStarted } from '../lib/utils';
import type { ComputedBadgeVariant } from '../types/event';
import { Container } from '../components/ui/Container';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EventInfo } from '../components/events/EventInfo';
import { OrganizerCard } from '../components/events/OrganizerCard';
import { SlotsCard } from '../components/events/SlotsCard';
import { eventApi } from '../api/eventapi';
import { getApiErrorMessage } from '../api/authapi';

function getBadgeIcon(variant: ComputedBadgeVariant) {
  switch (variant) {
    case 'few-left':
      return <AlertCircle className="h-3.5 w-3.5" />;
    case 'full':
    case 'canceled':
      return <Ban className="h-3.5 w-3.5" />;
    default:
      return <Ticket className="h-3.5 w-3.5" />;
  }
}

interface EventDetailsPageProps {
  backTo?: string;
  dashboardMode?: boolean;
}

export function EventDetailsPage({
  backTo = '/#events',
  dashboardMode = false,
}: EventDetailsPageProps) {
  const params = useParams<{ id: string; eventId: string }>();
  const id = params.id ?? params.eventId;
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    setEvent(null);
    setLoadError(null);
    setIsLoading(true);

    if (!id) {
      setLoadError('Event not found.');
      setIsLoading(false);
      return () => { isMounted = false; };
    }

    const request = dashboardMode
      ? eventApi.getOrganizerEvent(id)
      : eventApi.getPublicEvent(id);

    request
      .then((response) => {
        if (!response.success) throw new Error(response.message || 'Unable to load this event.');
        if (isMounted) setEvent(response.data.event);
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(getApiErrorMessage(error, 'Unable to load this event.'));
      })
      .finally(() => { if (isMounted) setIsLoading(false); });

    return () => { isMounted = false; };
  }, [dashboardMode, id]);

  if (isLoading) {
    return (
      <section aria-label="Loading event details" aria-busy="true" className="py-8 sm:py-12">
        <Container className="space-y-8">
          <div className="h-5 w-36 animate-pulse rounded bg-[#1A1713]/10 motion-reduce:animate-none" />
          <div className="space-y-4 border-b border-[#1A1713]/12 pb-8">
            <div className="h-6 w-24 animate-pulse rounded-lg bg-[#1A1713]/10 motion-reduce:animate-none" />
            <div className="h-12 max-w-2xl animate-pulse rounded-xl bg-[#1A1713]/10 motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="h-28 animate-pulse rounded-2xl bg-[#1A1713]/10 motion-reduce:animate-none" />
              <div className="h-36 animate-pulse rounded-2xl bg-[#1A1713]/10 motion-reduce:animate-none" />
            </div>
            <div className="h-72 animate-pulse rounded-2xl bg-[#1A1713]/10 motion-reduce:animate-none lg:col-span-5" />
          </div>
        </Container>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="py-20 sm:py-28">
        <Container>
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-surface px-6 py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised text-primary">
              <CalendarX2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-text">
              Event not found
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {loadError ?? 'The event you are looking for does not exist or may have been removed from the schedule.'}
            </p>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => navigate(backTo)}
              className="mt-7"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to events
            </Button>
          </motion.div>
        </Container>
      </section>
    );
  }

  const hasStarted = isEventStarted(event.startAt);
  const availability = getEventAvailability(event, false);

  const isCanceled = event.status === 'canceled';
  const isCompleted = event.status === 'completed';
  const isFull = availability.badgeVariant === 'full';
  const isRegisterDisabled = availability.isDisabled || hasStarted;

  const badgeVariant: ComputedBadgeVariant = isCompleted
    ? 'completed'
    : hasStarted && !isCanceled ? 'full' : availability.badgeVariant;
  const badgeLabel = isCompleted
    ? 'Completed'
    : hasStarted && !isCanceled ? 'Started' : availability.badgeLabel;

  const disabledReason = isCanceled
    ? 'Event canceled — registration closed.'
    : isCompleted
      ? 'Event completed — registration closed.'
    : hasStarted
      ? 'Event started — registration closed.'
      : isFull
        ? 'Event full — no seats remaining.'
        : null;

  const registerButtonContent = isCanceled ? (
    <>
      <Ban className="h-4 w-4" aria-hidden="true" />
      Canceled
    </>
  ) : isCompleted ? (
    <>
      <Ban className="h-4 w-4" aria-hidden="true" />
      Completed
    </>
  ) : hasStarted ? (
    <>
      <Ban className="h-4 w-4" aria-hidden="true" />
      Started
    </>
  ) : isFull ? (
    <>
      <Ban className="h-4 w-4" aria-hidden="true" />
      Full
    </>
  ) : (
    <>
      <Ticket className="h-4 w-4" aria-hidden="true" />
      Register
    </>
  );

  return (
    <div className="pt-8 pb-28 sm:pt-12 lg:pb-20">
      <Container className="space-y-8">
        <div>
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[#5C5246] transition-colors hover:text-[#1A1713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6E9DC]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to events</span>
          </Link>
        </div>

        {/* Minimal hero header: status + title only */}
        <motion.header
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 border-b border-[#1A1713]/12 pb-8"
        >
          <Badge tone="light" variant={badgeVariant} icon={getBadgeIcon(badgeVariant)}>
            {badgeLabel}
          </Badge>

          <h1 className="max-w-3xl text-[clamp(1.85rem,3.8vw,2.85rem)] font-bold leading-[1.14] tracking-tight text-[#1A1713] [text-wrap:balance]">
            {event.title}
          </h1>
        </motion.header>

        {/* Main 2-column non-repeating layout */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <section
              aria-labelledby="about-event-heading"
              className="space-y-3"
            >
              <h2 id="about-event-heading" className="text-base font-semibold text-[#1A1713]">
                About this event
              </h2>
              <p className="text-base leading-relaxed text-[#5C5246]">
                {event.description}
              </p>
            </section>

            <SlotsCard
              event={event}
              availability={availability}
              hasStarted={hasStarted}
            />

            <OrganizerCard organizerName={event.organizerName} />
          </motion.div>

          {/* Right column: single home for schedule, location & registration */}
          <motion.aside
            aria-label="Event schedule and registration"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
              <EventInfo event={event} />

              <div className="border-t border-border/70 pt-5 space-y-2.5">
                {dashboardMode ? (
                  <Button variant="outline" size="lg" className="w-full" onClick={() => navigate(backTo)}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to events
                  </Button>
                ) : (
                  <Button
                    variant={isRegisterDisabled ? 'outline' : 'gradient'}
                    size="lg"
                    disabled={isRegisterDisabled}
                    className="w-full"
                  >
                    {registerButtonContent}
                  </Button>
                )}

                {disabledReason ? (
                  <p className="text-xs text-[#F0786B]">{disabledReason}</p>
                ) : null}
              </div>
            </div>
          </motion.aside>
        </div>
      </Container>

      {/* Mobile bottom quick action bar */}
      {!dashboardMode && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="truncate text-xs font-medium text-text-muted">
            {disabledReason ?? 'Reserve your spot'}
          </p>

          <Button
            variant={isRegisterDisabled ? 'outline' : 'gradient'}
            size="md"
            disabled={isRegisterDisabled}
            className="shrink-0"
          >
            {registerButtonContent}
          </Button>
        </div>
      </div>}
    </div>
  );
}
