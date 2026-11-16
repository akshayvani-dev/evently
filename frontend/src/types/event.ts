export type DateFilterOption = 'all' | 'this-week' | 'this-month' | 'next-3-months';

export type EventStatus = 'draft' | 'published' | 'canceled' | 'completed';
export type RegistrationStatus = 'active' | 'canceled';

export type ComputedBadgeVariant =
  | 'published'
  | 'registered'
  | 'few-left'
  | 'full'
  | 'canceled'
  | 'draft'
  | 'completed';

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  startAt: string;
  timezone: string;
  location: string;
  capacity: number;
  registered: number;
  status: EventStatus;
  organizerName: string;
  registrationId?: string | null;
  registrationStatus?: RegistrationStatus | null;
}

export interface EventAvailability {
  placesRemaining: number;
  percentFilled: number;
  badgeLabel: string;
  badgeVariant: ComputedBadgeVariant;
  isDisabled: boolean;
}
