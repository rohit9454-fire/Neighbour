import { all } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import { eventsSaga } from './eventsSaga';
import { activitiesSaga } from './activitiesSaga';

export function* rootSaga() {
  yield all([authSaga(), eventsSaga(), activitiesSaga()]);
}
