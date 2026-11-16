import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarX2,
  CheckCircle2,
  Pencil,
  Ticket,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Event, EventStatus } from '../types/event';
import { getEventAvailability, isEventStarted } from '../lib/utils';
import type { ComputedBadgeVariant } from '../types/event';
import { Container } from '../components/ui/Container';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EventInfo } from '../components/events/EventInfo';
import { EventAttendees } from '../components/events/EventAttendees';
import { SlotsCard } from '../components/events/SlotsCard';
import { eventApi } from '../api/eventapi';
import { getApiErrorMessage } from '../api/authapi';
import { useAppSelector } from '../store';
import { useToast } from '../components/ui/toaster';

const EVENT_STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Save as draft' },
  { value: 'published', label: 'Publish' },
  { value: 'canceled', label: 'Cancel event' },
  { value: 'completed', label: 'Completed' },
];

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  canceled: 'Canceled',
  completed: 'Completed',
};

type EventConfirmationAction =
  | { type: 'status'; nextStatus: EventStatus }
  | { type: 'register' }
  | { type: 'cancel-registration' };

function getBadgeIcon(variant: ComputedBadgeVariant) {
  switch (variant) {
    case 'few-left':
    case 'draft':
      return <AlertCircle className="h-3.5 w-3.5" />;
    case 'full':
    case 'canceled':
      return <Ban className="h-3.5 w-3.5" />;
    case 'completed':
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    default:
      return <Ticket className="h-3.5 w-3.5" />;
  }
}

export function EventDetailsPage() {
  const params = useParams<{ id: string; eventId: string }>();
  const id = params.id ?? params.eventId;
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { user, isLoading: isAuthLoading } = useAppSelector((state) => state.auth);
  const isOrganizer = user?.role === 'organizer';
  const isAttendee = user?.role === 'attendee';
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isSavingRegistration, setIsSavingRegistration] = useState(false);
  const [confirmationAction, setConfirmationAction] =
    useState<EventConfirmationAction | null>(null);

  const isDashboardRoute = Boolean(params.eventId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    setEvent(null);
    setLoadError(null);
    setStatusError(null);
    setIsLoading(true);

    if (isAuthLoading) {
      return () => { isMounted = false; };
    }

    if (!id) {
      setLoadError('Event not found.');
      setIsLoading(false);
      return () => { isMounted = false; };
    }

    const request = isOrganizer && user && isDashboardRoute
      ? eventApi.getOrganizerEvent(id, user.id)
      : eventApi.getPublicEvent(
          id,
          isAttendee && user ? `attendee:${user.id}` : 'public',
        );

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
  }, [isAuthLoading, isOrganizer, isAttendee, isDashboardRoute, id, user?.id]);

  useEffect(() => {
    if (!event) return undefined;

    const delay = Math.max(0, new Date(event.startAt).getTime() - Date.now());
    const timeout = window.setTimeout(() => setCurrentTime(Date.now()), delay);
    return () => window.clearTimeout(timeout);
  }, [event?.startAt]);

  if (isLoading) {
    return (
      <section aria-label="Loading event details" aria-busy="true" className="bg-background py-4 text-text sm:py-6">
        <Container className="space-y-5">
          <div className="h-5 w-32 animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
          <div className="space-y-3 border-b border-border pb-5">
            <div className="h-6 w-24 animate-pulse rounded-lg bg-surface-raised motion-reduce:animate-none" />
            <div className="h-12 max-w-2xl animate-pulse rounded-xl bg-surface-raised motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <div className="h-60 animate-pulse rounded-2xl bg-surface-raised motion-reduce:animate-none lg:col-span-5" />
            <div className="space-y-4 lg:col-span-7">
              <div className="h-36 animate-pulse rounded-2xl bg-surface-raised motion-reduce:animate-none" />
              <div className="h-36 animate-pulse rounded-2xl bg-surface-raised motion-reduce:animate-none" />
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="bg-background py-10 text-text sm:py-14">
        <Container>
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-surface px-6 py-8 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarX2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-text">
              Event not found
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {loadError ?? 'The event you are looking for does not exist or may have been removed from the schedule.'}
            </p>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => navigate(-1)}
              className="mt-5"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to events
            </Button>
          </motion.div>
        </Container>
      </section>
    );
  }

  const hasStarted = isEventStarted(event.startAt)
    || new Date(event.startAt).getTime() <= currentTime;
  const availability = getEventAvailability(event, false);
  const isEventOwner = Boolean(isOrganizer && user?.id === event.organizerId);
  const canManage = Boolean(
    isEventOwner
    && !hasStarted,
  );

  const isCanceled = event.status === 'canceled';
  const isCompleted = event.status === 'completed';
  const isFull = availability.badgeVariant === 'full';
  const isRegisterDisabled = availability.isDisabled || hasStarted;
  const isAttendeeRegistered = Boolean(
    isAttendee && event.registrationStatus === 'active',
  );
  const registrationFeedback = registrationError ?? (
    isAttendeeRegistered && !event.registrationId
      ? 'Your registration could not be found. Refresh the page and try again.'
      : null
  );
  const isRegistrationActionDisabled = isSavingRegistration || (
    isAttendeeRegistered
      ? !event.registrationId || event.status !== 'published' || hasStarted
      : isRegisterDisabled
  );

  const badgeVariant: ComputedBadgeVariant = event.status;
  const badgeLabel = EVENT_STATUS_LABELS[event.status];

  const disabledReason = isCanceled
    ? 'Event canceled — registration closed.'
    : isCompleted
      ? 'Event completed — registration closed.'
    : hasStarted
      ? 'Event started — registration closed.'
      : isFull && !isAttendeeRegistered
        ? 'Event full — no seats remaining.'
        : null;

  const registerButtonContent = isSavingRegistration
    ? isAttendeeRegistered ? 'Cancelling registration...' : 'Registering...'
    : isCanceled ? (
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
  ) : isAttendeeRegistered ? (
    <>
      <Ban className="h-4 w-4" aria-hidden="true" />
      Cancel registration
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

  const handleStatusChange = (nextStatus: EventStatus) => {
    if (nextStatus === event.status || isSavingStatus) return;
    setConfirmationAction({ type: 'status', nextStatus });
  };

  const handleRegistrationAction = () => {
    if (!isAttendee) {
      navigate('/auth');
      return;
    }

    if (isRegistrationActionDisabled) return;
    if (isAttendeeRegistered && !event.registrationId) {
      setRegistrationError('Your registration could not be found. Refresh the page and try again.');
      return;
    }

    setConfirmationAction({
      type: isAttendeeRegistered ? 'cancel-registration' : 'register',
    });
  };

  const handleConfirmation = async () => {
    const action = confirmationAction;
    if (!action) return;

    if (action.type === 'status') {
      setStatusError(null);
      setIsSavingStatus(true);
      try {
        const response = await eventApi.patchEvent(event.id, {
          status: action.nextStatus,
        });
        if (!response.success) {
          throw new Error(response.message || 'Unable to update the event status.');
        }

        setEvent((current) => current
          ? { ...current, ...response.data.event }
          : current);
      } catch (error: unknown) {
        setStatusError(getApiErrorMessage(error, 'Unable to update the event status.'));
      } finally {
        setIsSavingStatus(false);
        setConfirmationAction(null);
      }

      return;
    }

    if (!isAttendee) {
      setConfirmationAction(null);
      navigate('/auth');
      return;
    }

    setRegistrationError(null);
    setIsSavingRegistration(true);
    try {
      if (action.type === 'cancel-registration') {
        const registrationId = event.registrationId;
        if (!registrationId) {
          throw new Error('Your registration could not be found. Refresh the page and try again.');
        }

        const response = await eventApi.cancelRegistration(registrationId);
        if (!response.success) {
          throw new Error(response.message || 'Unable to cancel your registration.');
        }

        setEvent((current) => current
          ? {
              ...current,
              registrationId: response.data.registration.id,
              registrationStatus: response.data.registration.status,
              registered: Math.max(0, current.registered - 1),
            }
          : current);
        toast({
          title: 'Registration canceled',
          description: `Your registration for ${event.title} was canceled.`,
        });
      } else {
        const response = await eventApi.registerForEvent(event.id);
        if (!response.success) {
          throw new Error(response.message || 'Unable to register for this event.');
        }

        setEvent((current) => current
          ? {
              ...current,
              registrationId: response.data.registration.id,
              registrationStatus: response.data.registration.status,
              registered: current.registered + 1,
            }
          : current);
        toast({
          title: 'Registration confirmed',
          description: `${event.title} is now in My events.`,
        });
      }
    } catch (error: unknown) {
      setRegistrationError(
        getApiErrorMessage(error, 'Unable to update your registration. Please try again.'),
      );
    } finally {
      setIsSavingRegistration(false);
      setConfirmationAction(null);
    }
  };

  const registrationButtonVariant = isAttendeeRegistered || isRegisterDisabled
    ? 'outline'
    : 'gradient';
  const registrationButtonClassName = isAttendeeRegistered
    ? 'w-full border-[#F0786B]/35 bg-[#F0786B]/10 text-[#F0786B] hover:bg-[#F0786B]/15'
    : isRegisterDisabled
      ? 'w-full border-border bg-surface-raised text-text hover:bg-surface'
      : 'w-full';

  const confirmationDetails = confirmationAction?.type === 'status'
    ? {
        title: 'Change event status?',
        description: `Change this event's status from ${EVENT_STATUS_LABELS[event.status]} to ${EVENT_STATUS_LABELS[confirmationAction.nextStatus]}?`,
        confirmLabel: 'Update status',
        loadingLabel: 'Updating status...',
        isDestructive: confirmationAction.nextStatus === 'canceled',
      }
    : confirmationAction?.type === 'cancel-registration'
      ? {
          title: 'Cancel registration?',
          description: `Cancel your registration for ${event.title}?`,
          confirmLabel: 'Cancel registration',
          loadingLabel: 'Canceling registration...',
          isDestructive: true,
        }
      : confirmationAction
        ? {
            title: 'Register for this event?',
            description: `${event.title} will be added to My events.`,
            confirmLabel: 'Register',
            loadingLabel: 'Registering...',
            isDestructive: false,
          }
        : null;

  const startEditing = () => navigate(`/dashboard/events/${event.id}/edit`);

  return (
    <div className={`min-h-full bg-background pt-3 text-text sm:pt-5 lg:pb-8 ${isOrganizer ? 'pb-6' : 'pb-24'}`}>
      <Container className="space-y-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center cursor-pointer gap-2 rounded-lg text-sm font-medium text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to events</span>
          </button>
        </div>

        <motion.header
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 border-b border-border pb-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={badgeVariant} icon={getBadgeIcon(badgeVariant)}>
              {badgeLabel}
            </Badge>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  disabled={isSavingStatus}
                  className="border-border bg-surface-raised text-text hover:bg-surface"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit event
                </Button>
                <label htmlFor="event-status" className="sr-only">Change event status</label>
                <select
                  id="event-status"
                  aria-label="Change event status"
                  value={event.status}
                  disabled={isSavingStatus}
                  onChange={(e) => {
                    const selectedStatus = EVENT_STATUS_OPTIONS.find(
                      (option) => option.value === e.target.value,
                    );
                    if (selectedStatus) handleStatusChange(selectedStatus.value);
                  }}
                  className="h-10 min-w-36 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                >
                  {EVENT_STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {isSavingStatus && (
                  <span role="status" className="text-xs text-text-muted">
                    Updating...
                  </span>
                )}
              </div>
            )}
          </div>

          {statusError && (
            <p role="alert" className="text-sm text-[#F0786B]">{statusError}</p>
          )}

          {registrationFeedback && (
            <p role="alert" className="text-sm text-[#F0786B]">{registrationFeedback}</p>
          )}

          <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-text sm:text-3xl">
            {event.title}
          </h1>
        </motion.header>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="grid w-full grid-cols-1 items-stretch gap-4 lg:grid-cols-12"
        >
          <section
            aria-labelledby="about-event-heading"
            className="space-y-1.5 rounded-2xl border border-border bg-surface/90 p-4 sm:p-5 lg:col-span-5"
          >
            <h2 id="about-event-heading" className="text-sm font-semibold text-text">
              About this event
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              {event.description}
            </p>
          </section>

          <div className="space-y-4 lg:col-span-7">
            <section
              aria-labelledby="event-details-heading"
              className="rounded-2xl border border-border bg-surface/90 p-4 sm:p-5"
            >
              <h2 id="event-details-heading" className="mb-1 text-sm font-semibold text-text">
                Event details
              </h2>
              <EventInfo event={event} />
            </section>

            <SlotsCard
              event={event}
              availability={availability}
              hasStarted={hasStarted}
            />

            {!isOrganizer && (
              <div className="hidden space-y-2 lg:block">
                <Button
                  variant={registrationButtonVariant}
                  size="sm"
                  disabled={isRegistrationActionDisabled}
                  className={registrationButtonClassName}
                  onClick={handleRegistrationAction}
                >
                  {registerButtonContent}
                </Button>
                {disabledReason && (
                  <p className="text-xs text-[#F0786B]">{disabledReason}</p>
                )}
              </div>
            )}
          </div>

          {isEventOwner && (
            <div className="lg:col-span-12">
              <EventAttendees key={event.id} eventId={event.id} />
            </div>
          )}
        </motion.div>
      </Container>

      {/* Mobile bottom quick action bar */}
      {!isOrganizer && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="truncate text-xs font-medium text-text-muted">
            {isAttendeeRegistered
              ? 'You are registered for this event.'
              : disabledReason ?? 'Reserve your spot'}
          </p>

          <Button
            variant={registrationButtonVariant}
            size="sm"
            disabled={isRegistrationActionDisabled}
            className={isAttendeeRegistered
              ? 'shrink-0 border-[#F0786B]/35 bg-[#F0786B]/10 text-[#F0786B] hover:bg-[#F0786B]/15'
              : isRegisterDisabled
                ? 'shrink-0 border-border bg-surface-raised text-text hover:bg-surface'
                : 'shrink-0'}
            onClick={handleRegistrationAction}
          >
            {registerButtonContent}
          </Button>
        </div>
      </div>}
      {confirmationDetails && (
        <ConfirmationDialog
          isOpen={Boolean(confirmationAction)}
          title={confirmationDetails.title}
          description={confirmationDetails.description}
          confirmLabel={confirmationDetails.confirmLabel}
          loadingLabel={confirmationDetails.loadingLabel}
          isLoading={isSavingStatus || isSavingRegistration}
          isDestructive={confirmationDetails.isDestructive}
          onConfirm={() => void handleConfirmation()}
          onCancel={() => setConfirmationAction(null)}
        />
      )}
    </div>
  );
}
