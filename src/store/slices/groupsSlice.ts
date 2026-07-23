import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group } from '../../types';
import { CreateGroupPayload } from '../../services/groupsService';

interface GroupsState {
  groups: Group[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  // Create
  isCreating: boolean;
  createError: string | null;
  lastCreatedId: string | null;
  // Join
  joiningIds: string[];
  joinError: string | null;
  joinedIds: string[];
  // Leave
  leavingIds: string[];
  leaveError: string | null;
}

const initialState: GroupsState = {
  groups: [],
  loading: false,
  refreshing: false,
  error: null,
  isCreating: false,
  createError: null,
  lastCreatedId: null,
  joiningIds: [],
  joinError: null,
  joinedIds: [],
  leavingIds: [],
  leaveError: null,
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    // ── Fetch ──────────────────────────────────────────────────────────────────
    fetchGroupsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchGroupsSuccess: (state, action: PayloadAction<Group[]>) => {
      state.groups = action.payload;
      state.loading = false;
      state.refreshing = false;
    },
    fetchGroupsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.refreshing = false;
      state.error = action.payload;
    },
    fetchGroupsRefresh: (state) => {
      state.refreshing = true;
      state.error = null;
    },

    // ── Create ─────────────────────────────────────────────────────────────────
    createGroupRequest: (state, _action: PayloadAction<CreateGroupPayload>) => {
      state.isCreating = true;
      state.createError = null;
      state.lastCreatedId = null;
    },
    createGroupSuccess: (state, action: PayloadAction<Group>) => {
      state.groups.unshift(action.payload);
      // Creator is automatically a member
      if (!state.joinedIds.includes(action.payload.id)) {
        state.joinedIds.push(action.payload.id);
      }
      state.isCreating = false;
      state.lastCreatedId = action.payload.id;
    },
    createGroupFailure: (state, action: PayloadAction<string>) => {
      state.isCreating = false;
      state.createError = action.payload;
    },
    clearCreateGroupState: (state) => {
      state.createError = null;
      state.lastCreatedId = null;
    },

    // ── Join ───────────────────────────────────────────────────────────────────
    joinGroupRequest: (state, action: PayloadAction<string>) => {
      if (!state.joiningIds.includes(action.payload)) {
        state.joiningIds.push(action.payload);
      }
      state.joinError = null;
      // Optimistic member count bump
      const g = state.groups.find(x => x.id === action.payload);
      if (g && !state.joinedIds.includes(action.payload)) {
        g.members += 1;
      }
    },
    joinGroupSuccess: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      state.joiningIds = state.joiningIds.filter(id => id !== groupId);
      if (!state.joinedIds.includes(groupId)) {
        state.joinedIds.push(groupId);
      }
      // Member count was already bumped optimistically in joinGroupRequest.
      // No server group object returned — leave the optimistic count in place.
    },
    joinGroupFailure: (state, action: PayloadAction<{ groupId: string; message: string }>) => {
      const { groupId, message } = action.payload;
      state.joiningIds = state.joiningIds.filter(id => id !== groupId);
      state.joinError = message;
      // Roll back optimistic bump
      if (!state.joinedIds.includes(groupId)) {
        const g = state.groups.find(x => x.id === groupId);
        if (g) g.members = Math.max(0, g.members - 1);
      }
    },
    clearJoinError: (state) => { state.joinError = null; },

    // ── Leave ──────────────────────────────────────────────────────────────────
    leaveGroupRequest: (state, action: PayloadAction<string>) => {
      if (!state.leavingIds.includes(action.payload)) {
        state.leavingIds.push(action.payload);
      }
      state.leaveError = null;
      // Optimistic: decrement member count and remove from joinedIds immediately
      const g = state.groups.find(x => x.id === action.payload);
      if (g) g.members = Math.max(0, g.members - 1);
      state.joinedIds = state.joinedIds.filter(id => id !== action.payload);
    },
    leaveGroupSuccess: (state, action: PayloadAction<string>) => {
      state.leavingIds = state.leavingIds.filter(id => id !== action.payload);
      // joinedIds already removed optimistically — nothing else to do
    },
    leaveGroupFailure: (state, action: PayloadAction<{ groupId: string; message: string }>) => {
      const { groupId, message } = action.payload;
      state.leavingIds = state.leavingIds.filter(id => id !== groupId);
      state.leaveError = message;
      // Roll back: re-add to joinedIds and restore member count
      if (!state.joinedIds.includes(groupId)) {
        state.joinedIds.push(groupId);
      }
      const g = state.groups.find(x => x.id === groupId);
      if (g) g.members += 1;
    },
    clearLeaveError: (state) => { state.leaveError = null; },
  },
});

export const {
  fetchGroupsRequest, fetchGroupsSuccess, fetchGroupsFailure, fetchGroupsRefresh,
  createGroupRequest, createGroupSuccess, createGroupFailure, clearCreateGroupState,
  joinGroupRequest, joinGroupSuccess, joinGroupFailure, clearJoinError,
  leaveGroupRequest, leaveGroupSuccess, leaveGroupFailure, clearLeaveError,
} = groupsSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectAllGroups          = (state: { groups: GroupsState }) => state.groups.groups;
export const selectGroupsLoading      = (state: { groups: GroupsState }) => state.groups.loading;
export const selectGroupsRefreshing   = (state: { groups: GroupsState }) => state.groups.refreshing;
export const selectGroupsError        = (state: { groups: GroupsState }) => state.groups.error;
export const selectIsCreatingGroup    = (state: { groups: GroupsState }) => state.groups.isCreating;
export const selectCreateGroupError   = (state: { groups: GroupsState }) => state.groups.createError;
export const selectLastCreatedGroupId = (state: { groups: GroupsState }) => state.groups.lastCreatedId;
export const selectJoiningIds         = (state: { groups: GroupsState }) => state.groups.joiningIds;
export const selectJoinedIds          = (state: { groups: GroupsState }) => state.groups.joinedIds;
export const selectJoinError          = (state: { groups: GroupsState }) => state.groups.joinError;
export const selectLeavingIds         = (state: { groups: GroupsState }) => state.groups.leavingIds;
export const selectLeaveError         = (state: { groups: GroupsState }) => state.groups.leaveError;

export default groupsSlice.reducer;
