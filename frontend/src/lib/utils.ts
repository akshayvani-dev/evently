import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DateFilterOption, Event, EventAvailability } from '../types/event';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatEventDate(isoDate: string, timeZone: string): {
  dateLabel: string;
  fullDateLabel: string;
  timeLabel: string;
  shortDate: string;
} {
  const date = new Date(isoDate);

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date);

  const fullDateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date);

  const shortDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone,
  }).format(date);

  return { dateLabel, fullDateLabel, timeLabel, shortDate };
}

export function isEventStarted(isoDate: string, referenceDate = new Date()): boolean {
  return new Date(isoDate).getTime() <= referenceDate.getTime();
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'EV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getEventAvailability(event: Event, isUserRegistered = false): EventAvailability {
  const effectiveRegistered = isUserRegistered
    ? Math.min(event.capacity, event.registered + 1)
    : event.registered;
  const placesRemaining = Math.max(0, event.capacity - effectiveRegistered);
  const percentFilled = event.capacity > 0
    ? Math.min(100, Math.round((effectiveRegistered / event.capacity) * 100))
    : 100;

  if (event.status === 'canceled') {
    return {
      placesRemaining: 0,
      percentFilled: 100,
      badgeLabel: 'Canceled',
      badgeVariant: 'canceled',
      isDisabled: true,
    };
  }

  if (event.status === 'draft') {
    return {
      placesRemaining,
      percentFilled,
      badgeLabel: 'Draft',
      badgeVariant: 'draft',
      isDisabled: true,
    };
  }

  if (isUserRegistered) {
    return {
      placesRemaining,
      percentFilled,
      badgeLabel: 'Registered',
      badgeVariant: 'registered',
      isDisabled: false,
    };
  }

  if (placesRemaining === 0) {
    return {
      placesRemaining: 0,
      percentFilled: 100,
      badgeLabel: 'Full',
      badgeVariant: 'full',
      isDisabled: true,
    };
  }

  const fewThreshold = Math.max(8, Math.ceil(event.capacity * 0.1));
  if (placesRemaining <= fewThreshold) {
    return {
      placesRemaining,
      percentFilled,
      badgeLabel: 'Few places left',
      badgeVariant: 'few-left',
      isDisabled: false,
    };
  }

  return {
    placesRemaining,
    percentFilled,
    badgeLabel: 'Open',
    badgeVariant: 'published',
    isDisabled: false,
  };
}

export function matchesDateFilter(isoDate: string, filter: DateFilterOption, referenceDate = new Date()): boolean {
  if (filter === 'all') return true;

  const eventDate = new Date(isoDate);
  const diffMs = eventDate.getTime() - referenceDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < -1) return false;

  switch (filter) {
    case 'this-week':
      return diffDays <= 7;
    case 'this-month':
      return diffDays <= 30;
    case 'next-3-months':
      return diffDays <= 90;
    default:
      return true;
  }
}

export function smoothScrollTo(targetId: string): void {
  const id = targetId.startsWith('#') ? targetId.slice(1) : targetId;
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
