import { all } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import { eventsSaga } from './eventsSaga';

export function* rootSaga() {
  yield all([authSaga(), eventsSaga()]);
}
