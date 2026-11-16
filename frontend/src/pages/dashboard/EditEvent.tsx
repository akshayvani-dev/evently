import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/auth/FormField';
import { eventApi } from '../../api/eventapi';
import { getApiErrorMessage } from '../../api/authapi';
import { useToast } from '../../components/ui/toaster';
import { isEventStarted } from '../../lib/utils';
import { useAppSelector } from '../../store';
import type { Event } from '../../types/event';

const DESCRIPTION_MAX_LENGTH = 500;
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

interface ZonedDateTime {
  date: string;
  time: string;
  wallTime: number;
}

function getDateTimeFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = dateTimeFormatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    dateTimeFormatters.set(timezone, formatter);
  }
  return formatter;
}

function getZonedDateTime(timestamp: number, timezone: string): ZonedDateTime {
  const parts = getDateTimeFormatter(timezone).formatToParts(new Date(timestamp));
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const year = Number(getPart('year'));
  const month = Number(getPart('month'));
  const day = Number(getPart('day'));
  const hour = Number(getPart('hour'));
  const minute = Number(getPart('minute'));

  return {
    date: `${getPart('year')}-${getPart('month')}-${getPart('day')}`,
    time: `${getPart('hour')}:${getPart('minute')}`,
    wallTime: Date.UTC(year, month - 1, day, hour, minute),
  };
}

function getDateTimeInTimezone(startAt: string, timezone: string): { date: string; time: string } {
  const zonedDateTime = getZonedDateTime(new Date(startAt).getTime(), timezone);
  return { date: zonedDateTime.date, time: zonedDateTime.time };
}

function localDateTimeToIso(date: string, time: string, timezone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  const checkDate = new Date(wallTime);
  if (
    checkDate.getUTCFullYear() !== year
    || checkDate.getUTCMonth() !== month - 1
    || checkDate.getUTCDate() !== day
    || checkDate.getUTCHours() !== hour
    || checkDate.getUTCMinutes() !== minute
  ) {
    return null;
  }

  const possibleOffsets = new Set<number>();
  for (const hours of [-36, -24, -12, 0, 12, 24, 36]) {
    const sampleTime = wallTime + hours * 60 * 60 * 1000;
    const zonedSample = getZonedDateTime(sampleTime, timezone);
    possibleOffsets.add(zonedSample.wallTime - sampleTime);
  }

  const candidates = [...possibleOffsets]
    .map((offset) => wallTime - offset)
    .filter((timestamp) => {
      const zonedDateTime = getZonedDateTime(timestamp, timezone);
      return zonedDateTime.date === date && zonedDateTime.time === time;
    })
    .sort((left, right) => left - right);

  return candidates.length ? new Date(candidates[0]).toISOString() : null;
}

function createEditEventSchema(minimumCapacity: number) {
  return z.object({
    title: z.string().trim().min(1, 'Event title is required.').max(255, 'Title must be 255 characters or fewer.'),
    description: z.string().trim().min(1, 'Event description is required.').max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`),
    date: z.string().min(1, 'Choose an event date.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid event date.'),
    time: z.string().min(1, 'Choose a start time.').regex(/^\d{2}:\d{2}$/, 'Choose a valid start time.'),
    location: z.string().trim().min(1, 'Event location is required.').max(255, 'Location must be 255 characters or fewer.'),
    capacity: z.number({ error: 'Enter the event capacity.' }).int('Capacity must be a whole number.').positive('Capacity must be a positive integer.'),
    timezone: z.string().min(1),
  }).superRefine((values, context) => {
    const startAt = localDateTimeToIso(values.date, values.time, values.timezone);
    if (!startAt) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a valid date and time in the event timezone.',
        path: ['time'],
      });
    } else if (new Date(startAt).getTime() <= Date.now()) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a date and time in the future.',
        path: ['time'],
      });
    }

    if (values.capacity < Math.max(1, minimumCapacity)) {
      context.addIssue({
        code: 'custom',
        message: `Capacity must be at least ${Math.max(1, minimumCapacity)}.`,
        path: ['capacity'],
      });
    }
  });
}

type EventFormValues = z.infer<ReturnType<typeof createEditEventSchema>>;

export function EditEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAppSelector((state) => state.auth);
  const organizerId = user?.role === 'organizer' ? user.id : null;
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const schema = useMemo(
    () => createEditEventSchema(event?.registered ?? 0),
    [event?.registered],
  );
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: 1,
      timezone: 'UTC',
    },
  });

  useEffect(() => {
    let isMounted = true;
    setEvent(null);
    setLoadError(null);
    setRequestError(null);
    setIsLoading(true);

    if (isAuthLoading) {
      return () => { isMounted = false; };
    }

    if (!eventId || !organizerId) {
      setLoadError('Only the event organizer can edit this event.');
      setIsLoading(false);
      return () => { isMounted = false; };
    }

    eventApi.getOrganizerEvent(eventId, organizerId)
      .then((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Unable to load this event.');
        }

        const loadedEvent = response.data.event;
        if (loadedEvent.organizerId !== organizerId) {
          throw new Error('Only the event organizer can edit this event.');
        }

        if (isMounted) {
          setEvent(loadedEvent);
          const dateTime = getDateTimeInTimezone(loadedEvent.startAt, loadedEvent.timezone);
          reset({
            title: loadedEvent.title,
            description: loadedEvent.description,
            date: dateTime.date,
            time: dateTime.time,
            location: loadedEvent.location,
            capacity: loadedEvent.capacity,
            timezone: loadedEvent.timezone,
          });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError(getApiErrorMessage(error, 'Unable to load this event.'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [eventId, isAuthLoading, organizerId, reset]);

  useEffect(() => {
    if (!event) return undefined;
    const delay = Math.max(0, new Date(event.startAt).getTime() - Date.now());
    const timeout = window.setTimeout(() => setCurrentTime(Date.now()), delay);
    return () => window.clearTimeout(timeout);
  }, [event?.startAt]);

  const selectedDate = watch('date');
  const descriptionValue = watch('description') || '';
  const eventLink = event ? `/dashboard/events/${event.id}` : '/dashboard/events/all';
  const canEdit = Boolean(
    event
    && !isEventStarted(event.startAt)
    && new Date(event.startAt).getTime() > currentTime,
  );

  const submit = async (values: EventFormValues) => {
    if (!event) return;
    setRequestError(null);

    const startAt = localDateTimeToIso(values.date, values.time, values.timezone);
    if (!startAt || new Date(startAt).getTime() <= Date.now()) {
      setRequestError('Choose a valid future date and time in the event timezone.');
      return;
    }

    try {
      const response = await eventApi.patchEvent(event.id, {
        title: values.title.trim(),
        description: values.description.trim(),
        startAt,
        timezone: values.timezone,
        location: values.location.trim(),
        capacity: values.capacity,
      });
      if (!response.success) {
        throw new Error(response.message || 'Could not update this event.');
      }

      toast({
        title: 'Event updated',
        description: `${values.title.trim()} was updated successfully.`,
      });
      navigate(eventLink, { replace: true });
    } catch (error: unknown) {
      setRequestError(getApiErrorMessage(error, 'Could not update this event. Please try again.'));
    }
  };

  if (isLoading) {
    return (
      <section aria-label="Loading event" aria-busy="true" className="space-y-5 text-text">
        <div className="h-10 w-40 rounded bg-surface-raised" />
        <div className="h-16 max-w-xl rounded-xl bg-surface-raised" />
        <div className="h-96 rounded-2xl bg-surface-raised" />
      </section>
    );
  }

  if (!event || !canEdit) {
    return (
      <section aria-labelledby="edit-event-title" className="w-full space-y-2 text-text">
        <Link to={eventLink} className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#5C5246] hover:text-[#1A1713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to event
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h1 id="edit-event-title" className="text-2xl font-semibold tracking-tight text-white">
            {event ? 'Event can no longer be edited' : 'Unable to edit event'}
          </h1>
          <p role={loadError ? 'alert' : undefined} className="mt-2 text-sm text-white/70">
            {loadError ?? 'Events that have started cannot be edited.'}
          </p>
        </div>
      </section>
    );
  }

  const todayInEventTimezone = getZonedDateTime(Date.now(), event.timezone).date;
  const inputClass = 'w-full rounded-xl border border-border bg-surface-raised px-3.5 py-3 text-sm text-text placeholder:text-text-muted/70 shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25';

  return (
    <section aria-labelledby="edit-event-title" className="w-full text-text">
      <Link to={eventLink} className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#5C5246] hover:text-[#1A1713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to event
      </Link>
      <header className="mb-2">
        <h1 id="edit-event-title" className="text-3xl font-semibold tracking-tight text-[#1A1713] sm:text-4xl">Edit event</h1>
        <p className="mt-2 text-sm text-[#5C5246]">Update the details for {event.title}. Event status can be changed on the details page.</p>
      </header>

      <form onSubmit={handleSubmit(submit)} noValidate className="w-full rounded-2xl border border-border bg-surface/90 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <FormField id="event-title" label="Event title" error={errors.title?.message} errorClassName="text-[#F0786B]" labelClassName="text-text">
            <input id="event-title" maxLength={255} autoComplete="off" placeholder="e.g. Creative Futures Summit" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'event-title-error' : undefined} className={inputClass} {...register('title')} />
          </FormField>

          <FormField id="event-location" label="Location" error={errors.location?.message} errorClassName="text-[#F0786B]" labelClassName="text-text">
            <input id="event-location" maxLength={255} placeholder="Venue or city" aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? 'event-location-error' : undefined} className={inputClass} {...register('location')} />
          </FormField>

          <FormField id="event-date" label="Date" error={errors.date?.message} errorClassName="text-[#F0786B]" labelClassName="text-text">
            <DatePicker
              id="event-date"
              value={selectedDate || ''}
              minDate={todayInEventTimezone}
              hasError={Boolean(errors.date)}
              describedBy={errors.date ? 'event-date-error' : undefined}
              tone="dark"
              disableMotion
              onChange={(date) => setValue('date', date, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
            />
          </FormField>

          <FormField id="event-time" label="Start time" error={errors.time?.message} errorClassName="text-[#F0786B]" labelClassName="text-text">
            <input id="event-time" type="time" aria-invalid={Boolean(errors.time)} aria-describedby={errors.time ? 'event-time-error' : undefined} className={inputClass} {...register('time')} />
          </FormField>

          <div className="sm:col-span-2 -mt-2 text-xs text-text-muted">
            Event time uses its existing timezone: <span className="font-medium text-text">{event.timezone}</span>
          </div>

          <FormField id="event-capacity" label="Capacity" error={errors.capacity?.message} errorClassName="text-[#F0786B]" labelClassName="text-text">
            <input id="event-capacity" type="number" min={Math.max(1, event.registered)} step={1} placeholder="100" aria-invalid={Boolean(errors.capacity)} aria-describedby={errors.capacity ? 'event-capacity-error' : undefined} className={inputClass} {...register('capacity', { valueAsNumber: true })} />
          </FormField>

          <input type="hidden" {...register('timezone')} />

          <FormField id="event-description" label="Description" error={errors.description?.message} errorClassName="text-[#F0786B]" labelClassName="text-text" className="sm:col-span-2">
            <textarea id="event-description" rows={3} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Tell guests what to expect" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'event-description-error' : undefined} className={`${inputClass} resize-y`} {...register('description')} />
            <p className="text-right text-xs tabular-nums text-text-muted" aria-live="polite">{descriptionValue.length}/{DESCRIPTION_MAX_LENGTH}</p>
          </FormField>
        </div>

        {requestError && <p role="alert" className="mt-5 rounded-xl border border-[#F0786B]/20 bg-[#F0786B]/10 px-4 py-3 text-sm font-medium text-[#F0786B]">{requestError}</p>}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button disableMotion type="button" variant="outline" size="md" className="border-border bg-surface-raised text-text hover:bg-surface" onClick={() => navigate(eventLink)}>Cancel</Button>
          <Button disableMotion type="submit" variant="gradient" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default EditEvent;
