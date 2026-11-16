import api from '../lib/axios';
import type { Event, EventStatus } from '../types/event';

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

let organizerEventsCache: ListEventsResponse | null = null;
let organizerEventsRequest: Promise<ListEventsResponse> | null = null;
const publicEventsCache = new Map<EventListStatus, ListEventsResponse>();
const publicEventsRequests = new Map<EventListStatus, Promise<ListEventsResponse>>();

export function clearOrganizerEventsCache(): void {
  organizerEventsCache = null;
  organizerEventsRequest = null;
  publicEventsCache.clear();
  publicEventsRequests.clear();
}

export const eventApi = {
  listEvents: (status: EventListStatus = 'published'): Promise<ListEventsResponse> => {
    const cached = publicEventsCache.get(status);
    if (cached) return Promise.resolve(cached);
    const pending = publicEventsRequests.get(status);
    if (pending) return pending;

    const request = api.get<ListEventsResponse>('/events/public', { params: { status } })
      .then(({ data }) => {
        publicEventsCache.set(status, data);
        publicEventsRequests.delete(status);
        return data;
      })
      .catch((error: unknown) => {
        publicEventsRequests.delete(status);
        throw error;
      });
    publicEventsRequests.set(status, request);
    return request;
  },

  listOrganizerEvents: (status: EventListStatus = 'all'): Promise<ListEventsResponse> => {
    if (status === 'all' && organizerEventsCache) return Promise.resolve(organizerEventsCache);
    if (status === 'all' && organizerEventsRequest) return organizerEventsRequest;

    const request = api.get<ListEventsResponse>('/events', { params: { status } })
      .then(({ data }) => {
        if (status === 'all') organizerEventsCache = data;
        return data;
      });

    if (status === 'all') {
      organizerEventsRequest = request;
      void request.catch(() => {
        if (organizerEventsRequest === request) organizerEventsRequest = null;
      });
    }
    return request;
  },

  getPublicEvent: async (eventId: string): Promise<EventDetailsResponse> => {
    const response = await api.get<EventDetailsResponse>(`/events/public/${eventId}`);
    return response.data;
  },

  getOrganizerEvent: async (eventId: string): Promise<EventDetailsResponse> => {
    const response = await api.get<EventDetailsResponse>(`/events/${eventId}`);
    return response.data;
  },

  createEvent: async (payload: CreateEventPayload): Promise<CreateEventResponse> => {
    const response = await api.post<CreateEventResponse>('/events', payload);
    clearOrganizerEventsCache();
    return response.data;
  },
};

export default eventApi;
