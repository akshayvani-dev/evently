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
  data: { events: Event[] };
  message?: string;
}

export interface EventDetailsResponse {
  success: boolean;
  data: { event: Event };
  message?: string;
}

export interface PublicEventFilters {
  title?: string;
  dateFilter?: DateFilterOption;
}

const organizerEventsCache = new Map<EventListStatus, ListEventsResponse>();
const organizerEventsRequests = new Map<EventListStatus, Promise<ListEventsResponse>>();
const publicEventsCache = new Map<string, ListEventsResponse>();
const publicEventsRequests = new Map<string, Promise<ListEventsResponse>>();
const publicEventDetailsRequests = new Map<string, Promise<EventDetailsResponse>>();
const organizerEventDetailsRequests = new Map<string, Promise<EventDetailsResponse>>();

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

export function clearOrganizerEventsCache(): void {
  organizerEventsCache.clear();
  organizerEventsRequests.clear();
  publicEventsCache.clear();
  publicEventsRequests.clear();
}

export const eventApi = {
  listEvents: (
    status: EventListStatus = 'published',
    filters: PublicEventFilters = {},
  ): Promise<ListEventsResponse> => {
    const title = filters.title?.trim() ?? '';
    const dateFilter = filters.dateFilter ?? 'all';
    const cacheKey = JSON.stringify([status, title.toLowerCase(), dateFilter]);
    const params = {
      status,
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

  listOrganizerEvents: (status: EventListStatus = 'all'): Promise<ListEventsResponse> => {
    const cached = organizerEventsCache.get(status);
    if (cached) return Promise.resolve(cached);
    const pending = organizerEventsRequests.get(status);
    if (pending) return pending;

    const request = api.get<ListEventsResponse>('/events', { params: { status } })
      .then(({ data }) => {
        organizerEventsCache.set(status, data);
        organizerEventsRequests.delete(status);
        return data;
      })
      .catch((error: unknown) => {
        organizerEventsRequests.delete(status);
        throw error;
      });

    organizerEventsRequests.set(status, request);
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

  createEvent: async (payload: CreateEventPayload): Promise<CreateEventResponse> => {
    const response = await api.post<CreateEventResponse>('/events', payload);
    clearOrganizerEventsCache();
    return response.data;
  },
};

export default eventApi;
