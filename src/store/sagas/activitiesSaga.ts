import { call, put, takeLatest } from 'redux-saga/effects';
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
} from '../slices/activitiesSlice';
import { Activity } from '../../types';

function* handleFetchActivities() {
  try {
    const activities: Activity[] = yield call(activitiesService.getActivities);
    yield put(fetchActivitiesSuccess(activities));
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

export function* activitiesSaga() {
  yield takeLatest(fetchActivitiesRequest.type, handleFetchActivities);
  yield takeLatest(fetchActivitiesRefresh.type, handleFetchActivities);
  yield takeLatest(createActivityRequest.type, handleCreateActivity);
  yield takeLatest(updateActivityRequest.type, handleUpdateActivity);
  yield takeLatest(joinActivityRequest.type, handleJoinActivity);
}
