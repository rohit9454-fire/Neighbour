import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Activity } from '../../types';
import {
  CreateActivityPayload,
  UpdateActivityPayload,
} from '../../services/activitiesService';

interface ActivitiesState {
  activities: Activity[];
  myJoined: string[];
  myCreated: string[];
  loading: boolean;
  refreshing: boolean;
  isCreating: boolean;
  createError: string | null;
  lastCreatedId: string | null;
  isUpdating: boolean;
  updateError: string | null;
  lastUpdatedId: string | null;
  joiningIds: string[];
  joinError: string | null;
  lastJoinedId: string | null;
  error: string | null;
}

const initialState: ActivitiesState = {
  activities: [],
  myJoined: [],
  myCreated: [],
  loading: false,
  refreshing: false,
  isCreating: false,
  createError: null,
  lastCreatedId: null,
  isUpdating: false,
  updateError: null,
  lastUpdatedId: null,
  joiningIds: [],
  joinError: null,
  lastJoinedId: null,
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
    joinActivityRequest: (state, action: PayloadAction<string>) => {
      if (!state.joiningIds.includes(action.payload)) {
        state.joiningIds.push(action.payload);
      }
      state.joinError = null;
      state.lastJoinedId = null;
    },
    joinActivitySuccess: (state, action: PayloadAction<Activity>) => {
      const index = state.activities.findIndex(item => item.id === action.payload.id);
      if (index >= 0) state.activities[index] = action.payload;
      if (!state.myJoined.includes(action.payload.id)) {
        state.myJoined.push(action.payload.id);
      }
      state.joiningIds = state.joiningIds.filter(id => id !== action.payload.id);
      state.lastJoinedId = action.payload.id;
    },
    joinActivityFailure: (state, action: PayloadAction<{ activityId: string; message: string }>) => {
      state.joiningIds = state.joiningIds.filter(id => id !== action.payload.activityId);
      state.joinError = action.payload.message;
    },
    clearJoinActivityState: (state) => {
      state.joinError = null;
      state.lastJoinedId = null;
    },
    leaveActivity: (state, action: PayloadAction<{ activityId: string; userId: string }>) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity) {
        activity.participants = activity.participants.filter(p => p.userId !== action.payload.userId);
      }
      state.myJoined = state.myJoined.filter(id => id !== action.payload.activityId);
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
      state.myCreated.push(action.payload.id);
    },
    createActivityRequest: (state, _action: PayloadAction<CreateActivityPayload>) => {
      state.isCreating = true;
      state.createError = null;
      state.lastCreatedId = null;
    },
    createActivitySuccess: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
      state.myCreated.push(action.payload.id);
      state.isCreating = false;
      state.lastCreatedId = action.payload.id;
    },
    createActivityFailure: (state, action: PayloadAction<string>) => {
      state.isCreating = false;
      state.createError = action.payload;
    },
    clearCreateActivityState: (state) => {
      state.createError = null;
      state.lastCreatedId = null;
    },
    updateActivityRequest: (
      state,
      _action: PayloadAction<{ activityId: string; changes: UpdateActivityPayload }>,
    ) => {
      state.isUpdating = true;
      state.updateError = null;
      state.lastUpdatedId = null;
    },
    updateActivitySuccess: (state, action: PayloadAction<Activity>) => {
      const index = state.activities.findIndex(item => item.id === action.payload.id);
      if (index >= 0) state.activities[index] = action.payload;
      state.isUpdating = false;
      state.lastUpdatedId = action.payload.id;
    },
    updateActivityFailure: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.updateError = action.payload;
    },
    clearUpdateActivityState: (state) => {
      state.updateError = null;
      state.lastUpdatedId = null;
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
  joinActivityRequest, joinActivitySuccess, joinActivityFailure,
  clearJoinActivityState, leaveActivity, addActivity, createActivityRequest,
  createActivitySuccess, createActivityFailure, clearCreateActivityState,
  updateActivityRequest, updateActivitySuccess, updateActivityFailure,
  clearUpdateActivityState, setRefreshing,
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
