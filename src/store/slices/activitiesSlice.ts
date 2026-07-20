import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Activity } from '../../types';

interface ActivitiesState {
  activities: Activity[];
  myJoined: string[];
  myCreated: string[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const initialState: ActivitiesState = {
  activities: [],
  myJoined: [],
  myCreated: [],
  loading: false,
  refreshing: false,
  error: null,
};

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    fetchActivitiesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchActivitiesSuccess: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload;
      state.loading = false;
      state.refreshing = false;
    },
    fetchActivitiesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.refreshing = false;
      state.error = action.payload;
    },
    fetchActivitiesRefresh: (state) => {
      state.refreshing = true;
      state.error = null;
    },
    joinActivity: (state, action: PayloadAction<{ activityId: string; userName: string }>) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity && !activity.participants.includes(action.payload.userName)) {
        activity.participants.push(action.payload.userName);
      }
      if (!state.myJoined.includes(action.payload.activityId)) {
        state.myJoined.push(action.payload.activityId);
      }
    },
    leaveActivity: (state, action: PayloadAction<{ activityId: string; userName: string }>) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity) {
        activity.participants = activity.participants.filter(p => p !== action.payload.userName);
      }
      state.myJoined = state.myJoined.filter(id => id !== action.payload.activityId);
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
      state.myCreated.push(action.payload.id);
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    cancelActivity: (state, action: PayloadAction<string>) => {
      const activity = state.activities.find(a => a.id === action.payload);
      if (activity) activity.status = 'cancelled';
    },
    deleteActivity: (state, action: PayloadAction<string>) => {
      state.activities = state.activities.filter(a => a.id !== action.payload);
      state.myCreated = state.myCreated.filter(id => id !== action.payload);
    },
  },
});

export const {
  fetchActivitiesRequest,
  fetchActivitiesSuccess,
  fetchActivitiesFailure,
  fetchActivitiesRefresh,
  joinActivity, leaveActivity, addActivity, setRefreshing,
  setLoading, cancelActivity, deleteActivity,
} = activitiesSlice.actions;

// Selectors
export const selectAllActivities = (state: { activities: ActivitiesState }) =>
  state.activities.activities;

export const selectActivityById = (id: string) => (state: { activities: ActivitiesState }) =>
  state.activities.activities.find(a => a.id === id);

export const selectMyJoined = (state: { activities: ActivitiesState }) =>
  state.activities.activities.filter(a => state.activities.myJoined.includes(a.id));

export const selectMyCreated = (state: { activities: ActivitiesState }) =>
  state.activities.activities.filter(a => state.activities.myCreated.includes(a.id));

export const selectIsJoined = (activityId: string) => (state: { activities: ActivitiesState }) =>
  state.activities.myJoined.includes(activityId);

export const selectIsCreated = (activityId: string) => (state: { activities: ActivitiesState }) =>
  state.activities.myCreated.includes(activityId);

export default activitiesSlice.reducer;
