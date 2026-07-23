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
  leavingIds: string[];
  leaveError: string | null;
  isDeleting: boolean;
  deleteError: string | null;
  lastDeletedId: string | null;
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
  leavingIds: [],
  leaveError: null,
  isDeleting: false,
  deleteError: null,
  lastDeletedId: null,
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
    fetchActivitiesSuccess: (state, action: PayloadAction<{ activities: Activity[]; userId?: string }>) => {
      state.activities = action.payload.activities;
      // Seed myJoined from the server response so joined state survives auto-login
      if (action.payload.userId) {
        const joinedIds = action.payload.activities
          .filter(a =>
            a.participants.some(p => p.userId === action.payload.userId),
          )
          .map(a => a.id);
        // Merge: keep any IDs already in the list that aren't in the new batch
        const merged = Array.from(new Set([...state.myJoined, ...joinedIds]));
        state.myJoined = merged;

        // Seed myCreated similarly
        const createdIds = action.payload.activities
          .filter(a => a.hostId === action.payload.userId)
          .map(a => a.id);
        state.myCreated = Array.from(new Set([...state.myCreated, ...createdIds]));
      }
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

      // ─── OPTIMISTIC UPDATE ────────────────────────────────────────────────────
      // Immediately add the activityId to myJoined so UI reflects join state
      // before the server responds. If join fails, saga will dispatch failure
      // which removes the id from joiningIds but leaves myJoined intact (user
      // can retry). This prevents double-join if user taps button twice.
      if (!state.myJoined.includes(action.payload)) {
        state.myJoined.push(action.payload);
      }
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
      // Roll back the optimistic join — server rejected the request
      state.myJoined = state.myJoined.filter(id => id !== action.payload.activityId);
    },
    clearJoinActivityState: (state) => {
      state.joinError = null;
      state.lastJoinedId = null;
    },
    leaveActivityRequest: (
      state,
      action: PayloadAction<{ activityId: string; userId: string }>,
    ) => {
      if (!state.leavingIds.includes(action.payload.activityId)) {
        state.leavingIds.push(action.payload.activityId);
      }
      state.leaveError = null;
    },
    leaveActivitySuccess: (
      state,
      action: PayloadAction<{ activityId: string; userId: string; activity: Activity | null }>,
    ) => {
      const { activityId, userId, activity } = action.payload;
      const index = state.activities.findIndex(item => item.id === activityId);
      if (activity && index >= 0) {
        state.activities[index] = activity;
      } else if (index >= 0) {
        state.activities[index].participants = state.activities[index].participants.filter(
          participant => participant.userId !== userId,
        );
      }
      state.myJoined = state.myJoined.filter(id => id !== activityId);
      state.leavingIds = state.leavingIds.filter(id => id !== activityId);
    },
    leaveActivityFailure: (
      state,
      action: PayloadAction<{ activityId: string; message: string }>,
    ) => {
      state.leavingIds = state.leavingIds.filter(id => id !== action.payload.activityId);
      state.leaveError = action.payload.message;
    },
    clearLeaveActivityState: (state) => {
      state.leaveError = null;
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
    deleteActivityRequest: (state, _action: PayloadAction<string>) => {
      state.isDeleting = true;
      state.deleteError = null;
      state.lastDeletedId = null;
    },
    deleteActivitySuccess: (state, action: PayloadAction<string>) => {
      const activityId = action.payload;
      state.activities = state.activities.filter(activity => activity.id !== activityId);
      state.myCreated = state.myCreated.filter(id => id !== activityId);
      state.myJoined = state.myJoined.filter(id => id !== activityId);
      state.joiningIds = state.joiningIds.filter(id => id !== activityId);
      state.isDeleting = false;
      state.lastDeletedId = activityId;
    },
    deleteActivityFailure: (state, action: PayloadAction<string>) => {
      state.isDeleting = false;
      state.deleteError = action.payload;
    },
    clearDeleteActivityState: (state) => {
      state.deleteError = null;
      state.lastDeletedId = null;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // cancelActivityRequest → dispatches to saga → calls API → cancelActivitySuccess
    cancelActivityRequest: (state, _action: PayloadAction<string>) => {
      state.isDeleting = true; // reuse the deleting flag
      state.deleteError = null;
    },
    cancelActivitySuccess: (state, action: PayloadAction<string>) => {
      const activity = state.activities.find(a => a.id === action.payload);
      if (activity) activity.status = 'cancelled';
      state.isDeleting = false;
    },
    cancelActivityFailure: (state, action: PayloadAction<string>) => {
      state.isDeleting = false;
      state.deleteError = action.payload;
    },
  },
});

export const {
  fetchActivitiesRequest,
  fetchActivitiesSuccess,
  fetchActivitiesFailure,
  fetchActivitiesRefresh,
  joinActivityRequest, joinActivitySuccess, joinActivityFailure,
  clearJoinActivityState, leaveActivityRequest, leaveActivitySuccess,
  leaveActivityFailure, clearLeaveActivityState, addActivity, createActivityRequest,
  createActivitySuccess, createActivityFailure, clearCreateActivityState,
  updateActivityRequest, updateActivitySuccess, updateActivityFailure,
  clearUpdateActivityState, deleteActivityRequest, deleteActivitySuccess,
  deleteActivityFailure, clearDeleteActivityState, setRefreshing,
  setLoading, cancelActivityRequest, cancelActivitySuccess, cancelActivityFailure,
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
