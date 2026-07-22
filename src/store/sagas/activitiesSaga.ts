import { call, put, select, takeLatest } from 'redux-saga/effects';
import { activitiesService } from '../../services/activitiesService';
import {
  fetchActivitiesRequest,
  fetchActivitiesRefresh,
  fetchActivitiesSuccess,
  fetchActivitiesFailure,
  createActivityRequest,
  createActivitySuccess,
  createActivityFailure,
  updateActivityRequest,
  updateActivitySuccess,
  updateActivityFailure,
  joinActivityRequest,
  joinActivitySuccess,
  joinActivityFailure,
  leaveActivityRequest,
  leaveActivitySuccess,
  leaveActivityFailure,
  deleteActivityRequest,
  deleteActivitySuccess,
  deleteActivityFailure,
  cancelActivityRequest,
  cancelActivitySuccess,
  cancelActivityFailure,
} from '../slices/activitiesSlice';
import { Activity } from '../../types';
import { RootState } from '../index';

function* handleFetchActivities() {
  try {
    const activities: Activity[] = yield call(activitiesService.getActivities);
    // Pass the current user's id so the slice can seed myJoined/myCreated
    const userId: string | undefined = yield select(
      (state: RootState) => state.auth.user?.id,
    );
    yield put(fetchActivitiesSuccess({ activities, userId }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load activities.';
    yield put(fetchActivitiesFailure(message));
  }
}

function* handleCreateActivity(action: ReturnType<typeof createActivityRequest>) {
  try {
    const activity: Activity = yield call(
      activitiesService.createActivity,
      action.payload,
    );
    yield put(createActivitySuccess(activity));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create activity.';
    yield put(createActivityFailure(message));
  }
}

function* handleUpdateActivity(action: ReturnType<typeof updateActivityRequest>) {
  try {
    const activity: Activity = yield call(
      activitiesService.updateActivity,
      action.payload.activityId,
      action.payload.changes,
    );
    yield put(updateActivitySuccess(activity));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update activity.';
    yield put(updateActivityFailure(message));
  }
}

function* handleJoinActivity(action: ReturnType<typeof joinActivityRequest>) {
  try {
    const activity: Activity = yield call(activitiesService.joinActivity, action.payload);
    yield put(joinActivitySuccess(activity));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join activity.';
    yield put(joinActivityFailure({ activityId: action.payload, message }));
  }
}

function* handleLeaveActivity(action: ReturnType<typeof leaveActivityRequest>) {
  try {
    const activity: Activity | null = yield call(
      activitiesService.leaveActivity,
      action.payload.activityId,
    );
    yield put(leaveActivitySuccess({ ...action.payload, activity }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to leave activity.';
    yield put(leaveActivityFailure({ activityId: action.payload.activityId, message }));
  }
}

function* handleDeleteActivity(action: ReturnType<typeof deleteActivityRequest>) {
  try {
    yield call(activitiesService.deleteActivity, action.payload);
    yield put(deleteActivitySuccess(action.payload));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete activity.';
    yield put(deleteActivityFailure(message));
  }
}

function* handleCancelActivity(action: ReturnType<typeof cancelActivityRequest>) {
  try {
    // Cancel is a soft-delete: update the activity status on the server via patch
    const activity: Activity = yield call(
      activitiesService.updateActivity,
      action.payload,
      { status: 'cancelled' } as any,
    );
    yield put(cancelActivitySuccess(activity?.id ?? action.payload));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel activity.';
    yield put(cancelActivityFailure(message));
  }
}

export function* activitiesSaga() {
  yield takeLatest(fetchActivitiesRequest.type, handleFetchActivities);
  yield takeLatest(fetchActivitiesRefresh.type, handleFetchActivities);
  yield takeLatest(createActivityRequest.type, handleCreateActivity);
  yield takeLatest(updateActivityRequest.type, handleUpdateActivity);
  yield takeLatest(joinActivityRequest.type, handleJoinActivity);
  yield takeLatest(leaveActivityRequest.type, handleLeaveActivity);
  yield takeLatest(deleteActivityRequest.type, handleDeleteActivity);
  yield takeLatest(cancelActivityRequest.type, handleCancelActivity);
}
