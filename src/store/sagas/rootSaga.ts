import { all } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import { eventsSaga } from './eventsSaga';
import { activitiesSaga } from './activitiesSaga';
import { chatSaga } from './chatSaga';

export function* rootSaga() {
  yield all([authSaga(), eventsSaga(), activitiesSaga(), chatSaga()]);
}
