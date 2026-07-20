import { call, put, takeLatest } from 'redux-saga/effects';
import { activitiesService } from '../../services/activitiesService';
import {
  fetchActivitiesRequest,
  fetchActivitiesRefresh,
  fetchActivitiesSuccess,
  fetchActivitiesFailure,
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

export function* activitiesSaga() {
  yield takeLatest(fetchActivitiesRequest.type, handleFetchActivities);
  yield takeLatest(fetchActivitiesRefresh.type, handleFetchActivities);
}
