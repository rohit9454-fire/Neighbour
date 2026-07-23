import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Event } from '../../types';
import { CreateEventPayload } from '../../services/eventsService';

interface EventsState {
  events: Event[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  // Create
  isCreating: boolean;
  createError: string | null;
  lastCreatedId: string | null;
  // RSVP
  rsvpingIds: string[];
  rsvpError: string | null;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  refreshing: false,
  error: null,
  isCreating: false,
  createError: null,
  lastCreatedId: null,
  rsvpingIds: [],
  rsvpError: null,
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    // ── Fetch ──────────────────────────────────────────────────────────────────
    fetchEventsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchEventsSuccess: (state, action: PayloadAction<Event[]>) => {
      state.events = action.payload;
      state.loading = false;
      state.refreshing = false;
    },
    fetchEventsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.refreshing = false;
      state.error = action.payload;
    },
    fetchEventsRefresh: (state) => {
      state.refreshing = true;
      state.error = null;
    },

    // ── Create ─────────────────────────────────────────────────────────────────
    createEventRequest: (state, _action: PayloadAction<CreateEventPayload>) => {
      state.isCreating = true;
      state.createError = null;
      state.lastCreatedId = null;
    },
    createEventSuccess: (state, action: PayloadAction<Event>) => {
      state.events.unshift(action.payload);
      state.isCreating = false;
      state.lastCreatedId = action.payload.id;
    },
    createEventFailure: (state, action: PayloadAction<string>) => {
      state.isCreating = false;
      state.createError = action.payload;
    },
    clearCreateEventState: (state) => {
      state.createError = null;
      state.lastCreatedId = null;
    },

    // ── Mark Going ─────────────────────────────────────────────────────────────
    markGoingRequest: (state, action: PayloadAction<string>) => {
      if (!state.rsvpingIds.includes(action.payload)) {
        state.rsvpingIds.push(action.payload);
      }
      state.rsvpError = null;
      // Optimistic update — flip isGoing and adjust count immediately
      const ev = state.events.find(e => e.id === action.payload);
      if (ev) {
        ev.isGoing = !ev.isGoing;
        ev.going = ev.isGoing ? ev.going + 1 : Math.max(0, ev.going - 1);
      }
    },
    markGoingSuccess: (state, action: PayloadAction<Event>) => {
      // Replace with server-authoritative data (going count is source of truth)
      const idx = state.events.findIndex(e => e.id === action.payload.id);
      if (idx >= 0) state.events[idx] = { ...action.payload, isGoing: true };
      state.rsvpingIds = state.rsvpingIds.filter(id => id !== action.payload.id);
    },
    markGoingFailure: (state, action: PayloadAction<{ eventId: string; message: string }>) => {
      state.rsvpingIds = state.rsvpingIds.filter(id => id !== action.payload.eventId);
      state.rsvpError = action.payload.message;
      // Roll back optimistic update
      const ev = state.events.find(e => e.id === action.payload.eventId);
      if (ev) {
        ev.isGoing = !ev.isGoing;
        ev.going = ev.isGoing ? ev.going + 1 : Math.max(0, ev.going - 1);
      }
    },
    clearGoingError: (state) => { state.rsvpError = null; },

    // Legacy aliases — kept so any old dispatch(rsvpEventRequest()) calls still compile
    rsvpEventRequest: (state, action: PayloadAction<string>) => {
      if (!state.rsvpingIds.includes(action.payload)) {
        state.rsvpingIds.push(action.payload);
      }
      state.rsvpError = null;
      const ev = state.events.find(e => e.id === action.payload);
      if (ev) {
        ev.isGoing = !ev.isGoing;
        ev.going = ev.isGoing ? ev.going + 1 : Math.max(0, ev.going - 1);
      }
    },
    rsvpEventSuccess: (state, action: PayloadAction<Event>) => {
      const idx = state.events.findIndex(e => e.id === action.payload.id);
      if (idx >= 0) state.events[idx] = { ...action.payload, isGoing: true };
      state.rsvpingIds = state.rsvpingIds.filter(id => id !== action.payload.id);
    },
    rsvpEventFailure: (state, action: PayloadAction<{ eventId: string; message: string }>) => {
      state.rsvpingIds = state.rsvpingIds.filter(id => id !== action.payload.eventId);
      state.rsvpError = action.payload.message;
      const ev = state.events.find(e => e.id === action.payload.eventId);
      if (ev) {
        ev.isGoing = !ev.isGoing;
        ev.going = ev.isGoing ? ev.going + 1 : Math.max(0, ev.going - 1);
      }
    },
    clearRsvpError: (state) => { state.rsvpError = null; },

    // Legacy — kept so any surviving dispatch(addEventRequest()) doesn't break
    addEventRequest: (state, _action: PayloadAction<Omit<Event, 'id' | 'going'>>) => state,
    addEventSuccess: (state, action: PayloadAction<Event>) => {
      state.events.unshift(action.payload);
    },
  },
});

export const {
  fetchEventsRequest, fetchEventsSuccess, fetchEventsFailure, fetchEventsRefresh,
  createEventRequest, createEventSuccess, createEventFailure, clearCreateEventState,
  markGoingRequest, markGoingSuccess, markGoingFailure, clearGoingError,
  rsvpEventRequest, rsvpEventSuccess, rsvpEventFailure, clearRsvpError,
  addEventRequest, addEventSuccess,
} = eventsSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectAllEvents          = (state: { events: EventsState }) => state.events.events;
export const selectEventsLoading      = (state: { events: EventsState }) => state.events.loading;
export const selectEventsRefreshing   = (state: { events: EventsState }) => state.events.refreshing;
export const selectEventsError        = (state: { events: EventsState }) => state.events.error;
export const selectIsCreatingEvent    = (state: { events: EventsState }) => state.events.isCreating;
export const selectCreateEventError   = (state: { events: EventsState }) => state.events.createError;
export const selectLastCreatedEventId = (state: { events: EventsState }) => state.events.lastCreatedId;
export const selectGoingIds           = (state: { events: EventsState }) => state.events.rsvpingIds;
/** @deprecated use selectGoingIds */
export const selectRsvpingIds         = selectGoingIds;

export default eventsSlice.reducer;
