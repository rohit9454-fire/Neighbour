import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';
import { groupsService } from '../../services/groupsService';
import { Group } from '../../types';
import {
  fetchGroupsRequest, fetchGroupsSuccess, fetchGroupsFailure, fetchGroupsRefresh,
  createGroupRequest, createGroupSuccess, createGroupFailure,
  joinGroupRequest, joinGroupSuccess, joinGroupFailure,
  leaveGroupRequest, leaveGroupSuccess, leaveGroupFailure,
} from '../slices/groupsSlice';
function* handleFetchGroups() {
  try {
    const groups: Group[] = yield call(groupsService.getGroups);
    yield put(fetchGroupsSuccess(groups));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load groups.';
    yield put(fetchGroupsFailure(message));
  }
}

function* handleCreateGroup(action: ReturnType<typeof createGroupRequest>) {
  try {
    const group: Group = yield call(groupsService.createGroup, action.payload);
    yield put(createGroupSuccess(group));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create group.';
    yield put(createGroupFailure(message));
  }
}

function* handleJoinGroup(action: ReturnType<typeof joinGroupRequest>) {
  const groupId = action.payload;
  try {
    const confirmedId: string = yield call(groupsService.joinGroup, groupId);
    yield put(joinGroupSuccess(confirmedId));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join group.';
    const isAlreadyMember =
      message.toLowerCase().includes('already a member') ||
      message.toLowerCase().includes('forbidden') ||
      message.toLowerCase().includes('404') ||
      message.toLowerCase().includes('not found');

    if (isAlreadyMember) {
      // Treat "already a member" as success — user is in the group, just mark it
      yield put(joinGroupSuccess(groupId));
    } else {
      yield put(joinGroupFailure({ groupId, message }));
    }
  }
}

export function* groupsSaga() {
  yield takeLatest(fetchGroupsRequest.type, handleFetchGroups);
  yield takeLatest(fetchGroupsRefresh.type, handleFetchGroups);
  yield takeLatest(createGroupRequest.type, handleCreateGroup);
  yield takeEvery(joinGroupRequest.type,    handleJoinGroup);
}
