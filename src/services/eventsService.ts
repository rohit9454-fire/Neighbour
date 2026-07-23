import apiClient from './apiClient';
import { Event } from '../types';

export interface CreateEventPayload {
  title: string;
  date: string;        // ISO string e.g. "2026-07-20T18:30:00.000Z"
  location: string;
  category: Event['category'];
  emoji?: string;
  description?: string;
}

// The API may return a bare array or wrap it in { data: [] } / { events: [] }
type ListEnvelope = Event[] | { data: Event[] } | { events: Event[] };

// Single-item responses may be bare or wrapped
type ItemEnvelope = Event | { data: Event } | { event: Event };

function unwrapList(raw: ListEnvelope): Event[] {
  if (Array.isArray(raw)) return raw;
  if ('data'   in raw && Array.isArray(raw.data))   return raw.data;
  if ('events' in raw && Array.isArray(raw.events)) return raw.events;
  return [];
}

function unwrapItem(raw: ItemEnvelope): Event {
  if ('data'  in raw && raw.data  && typeof raw.data  === 'object') return raw.data  as Event;
  if ('event' in raw && raw.event && typeof raw.event === 'object') return raw.event as Event;
  return raw as Event;
}

export const eventsService = {
  /** GET /events — returns all community events */
  getEvents: async (): Promise<Event[]> => {
    const res = await apiClient.get<ListEnvelope>('/events');
    return unwrapList(res.data);
  },

  /** POST /events — creates a new event */
  createEvent: async (payload: CreateEventPayload): Promise<Event> => {
    const res = await apiClient.post<ItemEnvelope>('/events', payload);
    return unwrapItem(res.data);
  },

  /** POST /events/:id/going — marks the current user as going (toggles) */
  markGoing: async (eventId: string): Promise<Event> => {
    const res = await apiClient.post<ItemEnvelope>(`/events/${eventId}/going`);
    return unwrapItem(res.data);
  },
};
