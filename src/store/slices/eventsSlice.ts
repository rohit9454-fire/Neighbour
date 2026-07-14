import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Event } from '../../types';

interface EventsState {
  events: Event[];
}

const INITIAL_EVENTS: Event[] = [
  { id: '1', emoji: '⚽', title: 'Sunday Football Match', date: 'Sun, 22 Jun · 7:00 AM', location: 'Central Park Ground', going: 12, category: 'Sports' },
  { id: '2', emoji: '🎭', title: 'Cultural Evening', date: 'Sat, 28 Jun · 6:00 PM', location: 'Community Hall', going: 34, category: 'Culture' },
  { id: '3', emoji: '🏏', title: 'Cricket Tournament', date: 'Sun, 29 Jun · 8:00 AM', location: 'Sports Complex', going: 22, category: 'Sports' },
  { id: '4', emoji: '🎉', title: 'Neighbourhood BBQ', date: 'Fri, 4 Jul · 5:00 PM', location: 'Block C Garden', going: 18, category: 'Social' },
];

const eventsSlice = createSlice({
  name: 'events',
  initialState: { events: INITIAL_EVENTS } as EventsState,
  reducers: {
    addEventRequest: (state, _action: PayloadAction<Omit<Event, 'id' | 'going'>>) => state,
    addEventSuccess: (state, action: PayloadAction<Event>) => {
      state.events.unshift(action.payload);
    },
  },
});

export const { addEventRequest, addEventSuccess } = eventsSlice.actions;
export default eventsSlice.reducer;
