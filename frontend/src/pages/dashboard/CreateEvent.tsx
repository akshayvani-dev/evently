import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/auth/FormField';
import { eventApi } from '../../api/eventapi';
import { getApiErrorMessage } from '../../api/authapi';
import { useToast } from '../../components/ui/toaster';

const DESCRIPTION_MAX_LENGTH = 500;

function isValidLocalDateTime(date: string, time: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(year, month - 1, day, hour, minute);
  return value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day && value.getHours() === hour && value.getMinutes() === minute;
}

const eventFormSchema = z.object({
  title: z.string().trim().min(1, 'Event title is required.').max(255, 'Title must be 255 characters or fewer.'),
  description: z.string().trim().min(1, 'Event description is required.').max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`),
  date: z.string().min(1, 'Choose an event date.').refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), 'Choose a valid event date.'),
  time: z.string().min(1, 'Choose a start time.').refine((value) => /^\d{2}:\d{2}$/.test(value), 'Choose a valid start time.'),
  location: z.string().trim().min(1, 'Event location is required.').max(255, 'Location must be 255 characters or fewer.'),
  capacity: z.number({ error: 'Enter the event capacity.' }).int('Capacity must be a whole number.').positive('Capacity must be a positive integer.'),
  status: z.enum(['draft', 'published', 'canceled']),
}).superRefine((values, context) => {
  if (!isValidLocalDateTime(values.date, values.time)) {
    context.addIssue({ code: 'custom', message: 'Choose a valid date and time.', path: ['date'] });
    return;
  }
  const [year, month, day] = values.date.split('-').map(Number);
  const [hour, minute] = values.time.split(':').map(Number);
  const startAt = new Date(year, month - 1, day, hour, minute);
  if (startAt.getTime() <= Date.now()) {
    context.addIssue({ code: 'custom', message: 'Choose a date and time in the future.', path: ['time'] });
  }
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const today = new Date();
const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

export function CreateEvent() {
  const [requestError, setRequestError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: undefined,
      status: 'draft',
    },
  });

  const selectedDate = watch('date');
  const descriptionValue = watch('description') || '';
  const submit = async (values: EventFormValues) => {
    setRequestError(null);
    const [year, month, day] = values.date.split('-').map(Number);
    const [hour, minute] = values.time.split(':').map(Number);
    const startAt = new Date(year, month - 1, day, hour, minute).toISOString();

    try {
      const response = await eventApi.createEvent({
        title: values.title.trim(),
        description: values.description.trim(),
        startAt,
        timezone: localTimezone,
        location: values.location.trim(),
        capacity: values.capacity,
        status: values.status,
      });
      if (!response.success) throw new Error(response.message || 'Could not create the event.');
      toast({
        title: 'Event created',
        description: `${response.data.event.title} was created successfully.`,
      });
      navigate('/dashboard/events/all', { replace: true });
    } catch (error: unknown) {
      setRequestError(getApiErrorMessage(error, 'Could not create the event. Please try again.'));
    }
  };

  const inputClass = 'w-full rounded-xl border border-border bg-surface-raised px-3.5 py-3 text-sm text-text placeholder:text-text-muted/70 shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25';
  const timeError = errors.time?.message;

  return (
    <section aria-labelledby="create-event-title" className="w-full text-text">
      <Link to="/dashboard/events/all" className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#5C5246] hover:text-[#1A1713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to events
      </Link>
      <header className="mb-2">
        <h2 id="create-event-title" className="text-3xl font-semibold tracking-tight text-[#1A1713] sm:text-4xl">Create an event</h2>
        <p className="mt-2 text-sm text-[#5C5246]">Add the key details for your event. You can keep it as a draft or publish it.</p>
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
              minDate={todayValue}
              hasError={Boolean(errors.date)}
              describedBy={errors.date ? 'event-date-error' : undefined}
              tone="dark"
              onChange={(date) => setValue('date', date, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
            />
          </FormField>

          <FormField id="event-time" label="Start time" error={timeError} errorClassName="text-[#F0786B]" labelClassName="text-text">
            <input id="event-time" type="time" aria-invalid={Boolean(errors.time)} aria-describedby={errors.time ? 'event-time-error' : undefined} className={inputClass} {...register('time')} />
          </FormField>

          <div className="sm:col-span-2 -mt-2 text-xs text-text-muted">
            Event time uses your local timezone: <span className="font-medium text-text">{localTimezone}</span>
          </div>

          <FormField id="event-capacity" label="Capacity" error={errors.capacity?.message} errorClassName="text-[#F0786B]" labelClassName="text-text">
            <input id="event-capacity" type="number" min={1} step={1} placeholder="100" aria-invalid={Boolean(errors.capacity)} aria-describedby={errors.capacity ? 'event-capacity-error' : undefined} className={inputClass} {...register('capacity', { valueAsNumber: true })} />
          </FormField>

          <FormField id="event-status" label="Status" labelClassName="text-text">
            <select id="event-status" className={inputClass} {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Publish</option>
            </select>
          </FormField>

          <FormField id="event-description" label="Description" error={errors.description?.message} errorClassName="text-[#F0786B]" labelClassName="text-text" className="sm:col-span-2">
            <textarea id="event-description" rows={3} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Tell guests what to expect" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'event-description-error' : undefined} className={`${inputClass} resize-y`} {...register('description')} />
            <p className="text-right text-xs tabular-nums text-text-muted" aria-live="polite">{descriptionValue.length}/{DESCRIPTION_MAX_LENGTH}</p>
          </FormField>
        </div>

        {requestError && <p role="alert" className="mt-5 rounded-xl border border-[#F0786B]/20 bg-[#F0786B]/10 px-4 py-3 text-sm font-medium text-[#F0786B]">{requestError}</p>}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="md" className="border-border bg-surface-raised text-text hover:bg-surface" onClick={() => navigate('/dashboard/events/all')}>Cancel</Button>
          <Button type="submit" variant="gradient" size="md" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Creating...' : 'Create event'}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default CreateEvent;
