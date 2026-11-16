import api from '../lib/axios';
import type { DateFilterOption, Event, EventStatus } from '../types/event';

export type EventListStatus = EventStatus | 'all';

export interface CreateEventPayload {
  title: string;
  description: string;
  startAt: string;
  timezone: string;
  location: string;
  capacity: number;
  status?: EventStatus;
}

export interface PatchEventPayload {
  title?: string;
  description?: string;
  startAt?: string;
  timezone?: string;
  location?: string;
  capacity?: number;
  status?: EventStatus;
}

export interface CreatedEvent {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  startAt: string;
  timezone: string;
  location: string;
  capacity: number;
  status: EventStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventResponse {
  success: boolean;
  data: { event: CreatedEvent };
  message?: string;
}

export interface ListEventsResponse {
  success: boolean;
  data: {
    events: Event[];
    pagination: EventListPagination;
  };
  message?: string;
}

export interface EventListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface EventDetailsResponse {
  success: boolean;
  data: { event: Event };
  message?: string;
}

export interface PatchEventResponse {
  success: boolean;
  data: { event: Partial<Event> };
  message?: string;
}

export interface EventAttendee {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
}

export interface EventAttendeesResponse {
  success: boolean;
  data: {
    attendees: EventAttendee[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface PublicEventFilters {
  title?: string;
  dateFilter?: DateFilterOption;
  page?: number;
  limit?: number;
}

export interface OrganizerEventFilters {
  title?: string;
  page?: number;
  limit?: number;
}

const organizerEventsCache = new Map<string, ListEventsResponse>();
const organizerEventsRequests = new Map<string, Promise<ListEventsResponse>>();
const publicEventsCache = new Map<string, ListEventsResponse>();
const publicEventsRequests = new Map<string, Promise<ListEventsResponse>>();
const publicEventDetailsRequests = new Map<string, Promise<EventDetailsResponse>>();
const organizerEventDetailsRequests = new Map<string, Promise<EventDetailsResponse>>();
const eventAttendeesRequests = new Map<string, Promise<EventAttendeesResponse>>();

function getEventDetails(
  requests: Map<string, Promise<EventDetailsResponse>>,
  key: string,
  path: string,
): Promise<EventDetailsResponse> {
  const pending = requests.get(key);
  if (pending) return pending;

  const request = api.get<EventDetailsResponse>(path)
    .then(({ data }) => data)
    .finally(() => requests.delete(key));
  requests.set(key, request);
  return request;
}

function getEventAttendees(
  eventId: string,
  page: number,
  limit: number,
): Promise<EventAttendeesResponse> {
  const key = JSON.stringify([eventId, page, limit]);
  const pending = eventAttendeesRequests.get(key);
  if (pending) return pending;

  const request = api
    .get<EventAttendeesResponse>(`/events/${eventId}/registrations`, {
      params: { page, limit },
    })
    .then(({ data }) => data)
    .finally(() => eventAttendeesRequests.delete(key));

  eventAttendeesRequests.set(key, request);
  return request;
}

export function clearOrganizerEventsCache(): void {
  organizerEventsCache.clear();
  organizerEventsRequests.clear();
  publicEventsCache.clear();
  publicEventsRequests.clear();
}

export const eventApi = {
  listEvents: (filters: PublicEventFilters = {}): Promise<ListEventsResponse> => {
    const title = filters.title?.trim() ?? '';
    const dateFilter = filters.dateFilter ?? 'all';
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const cacheKey = JSON.stringify([title.toLowerCase(), dateFilter, page, limit]);
    const params = {
      page,
      limit,
      ...(title ? { title } : {}),
      ...(dateFilter !== 'all' ? { dateFilter } : {}),
    };

    const cached = publicEventsCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    const pending = publicEventsRequests.get(cacheKey);
    if (pending) return pending;

    const request = api.get<ListEventsResponse>('/events/public', { params })
      .then(({ data }) => {
        publicEventsCache.set(cacheKey, data);
        publicEventsRequests.delete(cacheKey);
        return data;
      })
      .catch((error: unknown) => {
        publicEventsRequests.delete(cacheKey);
        throw error;
      });
    publicEventsRequests.set(cacheKey, request);
    return request;
  },

  listOrganizerEvents: (
    status: EventListStatus = 'all',
    filters: OrganizerEventFilters = {},
  ): Promise<ListEventsResponse> => {
    const title = filters.title?.trim() ?? '';
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const cacheKey = JSON.stringify([status, title.toLowerCase(), page, limit]);
    const params = {
      status,
      page,
      limit,
      ...(title ? { title } : {}),
    };

    const cached = organizerEventsCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    const pending = organizerEventsRequests.get(cacheKey);
    if (pending) return pending;

    const request = api.get<ListEventsResponse>('/events', { params })
      .then(({ data }) => {
        organizerEventsCache.set(cacheKey, data);
        organizerEventsRequests.delete(cacheKey);
        return data;
      })
      .catch((error: unknown) => {
        organizerEventsRequests.delete(cacheKey);
        throw error;
      });

    organizerEventsRequests.set(cacheKey, request);
    return request;
  },

  getPublicEvent: (eventId: string): Promise<EventDetailsResponse> => {
    return getEventDetails(publicEventDetailsRequests, eventId, `/events/public/${eventId}`);
  },

  getOrganizerEvent: (eventId: string, organizerId: string): Promise<EventDetailsResponse> => {
    return getEventDetails(
      organizerEventDetailsRequests,
      `${organizerId}:${eventId}`,
      `/events/${eventId}`,
    );
  },

  listEventAttendees: (
    eventId: string,
    page = 1,
    limit = 10,
  ): Promise<EventAttendeesResponse> => getEventAttendees(eventId, page, limit),

  createEvent: async (payload: CreateEventPayload): Promise<CreateEventResponse> => {
    const response = await api.post<CreateEventResponse>('/events', payload);
    clearOrganizerEventsCache();
    return response.data;
  },

  patchEvent: async (
    eventId: string,
    payload: PatchEventPayload,
  ): Promise<PatchEventResponse> => {
    const response = await api.patch<PatchEventResponse>(`/events/${eventId}`, payload);
    clearOrganizerEventsCache();
    return response.data;
  },
};

export default eventApi;
